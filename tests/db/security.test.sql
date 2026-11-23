-- ════════════════════════════════════════════════════════════════════════════
-- Security & integrity tests for the foundation schema.
-- Each block either asserts a value or expects a specific error class; anything
-- unexpected aborts the run (psql ON_ERROR_STOP).
-- ════════════════════════════════════════════════════════════════════════════
\set QUIET on
\o /dev/null

-- ── Fixtures (as the database owner) ─────────────────────────────────────────
insert into auth.users (id, email, raw_user_meta_data) values
  (tests.alice(), 'alice@example.test', '{"display_name": "Alice", "education_stage": "gcse"}'),
  (tests.bob(),   'bob@example.test',   '{"display_name": "<script>x</script>", "education_stage": "wizard"}'),
  (tests.carol(), 'carol@example.test', '{}');

insert into public.topics (id, subject_id, slug, name, education_stage)
select '10000000-0000-4000-8000-000000000001', id, 'cells', 'Cells', 'gcse' from public.subjects where slug = 'science';

insert into public.questions (id, topic_id, question_text, options, difficulty, is_published) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'What is the powerhouse of the cell?',
   '[{"id":"A","text":"Nucleus"},{"id":"B","text":"Mitochondria"},{"id":"C","text":"Ribosome"},{"id":"D","text":"Cell wall"}]',
   'easy', true);
insert into public.question_answers (question_id, correct_option, explanation) values
  ('20000000-0000-4000-8000-000000000001', 'B', 'Mitochondria carry out aerobic respiration, releasing energy for the cell.');

-- An unpublished AI question belonging to Bob.
insert into public.questions (id, topic_id, question_text, options, difficulty, source_type, created_by) values
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
   'Which organelle contains genetic material?',
   '[{"id":"A","text":"Nucleus"},{"id":"B","text":"Vacuole"},{"id":"C","text":"Ribosome"},{"id":"D","text":"Membrane"}]',
   'easy', 'ai_generated', tests.bob());

insert into public.game_rooms (id, room_code, host_id, subject_id, difficulty, question_count, max_players, status, current_round)
select '30000000-0000-4000-8000-000000000001', 'KX49QT', tests.alice(), id, 'easy', 5, 10, 'in_progress', 0
from public.subjects where slug = 'science';

insert into public.room_players (room_id, player_id, display_name) values
  ('30000000-0000-4000-8000-000000000001', tests.alice(), 'Alice'),
  ('30000000-0000-4000-8000-000000000001', tests.bob(), 'Player-B');

insert into public.room_question_plan (room_id, round_index, question_id) values
  ('30000000-0000-4000-8000-000000000001', 0, '20000000-0000-4000-8000-000000000001');

insert into public.room_rounds (room_id, round_index, question_id, question_text, options, started_at, deadline_at)
select '30000000-0000-4000-8000-000000000001', 0, id, question_text, options, now(), now() + interval '20 seconds'
from public.questions where id = '20000000-0000-4000-8000-000000000001';

insert into public.game_answers (room_id, round_index, player_id, question_id, submitted_option, is_correct, points_awarded, response_ms)
values ('30000000-0000-4000-8000-000000000001', 0, tests.alice(), '20000000-0000-4000-8000-000000000001', 'B', true, 140, 4000);

insert into public.xp_events (player_id, source, source_id, amount) values (tests.alice(), 'solo_quiz', 'session-1', 50);

\echo '  · fixtures loaded'

-- ── Profile creation ─────────────────────────────────────────────────────────
select tests.assert((select display_name = 'Alice' and education_stage = 'gcse' from public.profiles where id = tests.alice()),
  'profile created from valid sign-up metadata');
select tests.assert((select display_name ~ '^Player-[0-9A-F]{5}$' and education_stage is null from public.profiles where id = tests.bob()),
  'unsafe display name and unknown stage are replaced, not stored');
select tests.assert((select count(*) = 3 from public.profiles), 'every auth user has a profile');
\echo '  ✓ profiles are created safely on sign-up'

-- ── XP ledger ────────────────────────────────────────────────────────────────
select tests.assert((select xp = 50 from public.profiles where id = tests.alice()), 'xp follows the ledger');
do $$ begin
  insert into public.xp_events (player_id, source, source_id, amount) values (tests.alice(), 'solo_quiz', 'session-1', 50);
  raise exception 'ASSERTION FAILED: the same XP source paid out twice';
exception when unique_violation then null;
end $$;
select tests.assert((select xp = 50 from public.profiles where id = tests.alice()), 'duplicate XP is not applied');
\echo '  ✓ XP is idempotent'

-- ── Student: own profile only, cannot touch XP/plan ──────────────────────────
select tests.login(tests.alice());
select tests.assert((select count(*) = 1 from public.profiles), 'student sees only their own profile');
update public.profiles set display_name = 'Alice Q' where id = tests.alice();
select tests.assert((select display_name = 'Alice Q' from public.profiles), 'student can rename themselves');

do $$ begin
  update public.profiles set xp = 999999 where id = tests.alice();
  raise exception 'ASSERTION FAILED: student changed their own XP';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  update public.profiles set plan = 'school' where id = tests.alice();
  raise exception 'ASSERTION FAILED: student upgraded their own plan';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  update public.profiles set display_name = 'x' where id = tests.alice();
  raise exception 'ASSERTION FAILED: invalid display name accepted';
exception when check_violation then null;
end $$;
do $$
declare affected int;
begin
  update public.profiles set display_name = 'Hacked' where id = tests.bob();
  get diagnostics affected = row_count;
  perform tests.assert(affected = 0, 'student cannot edit another profile');
end $$;
\echo '  ✓ students control only their own editable profile fields'

-- ── Answer keys and question plans are unreadable ────────────────────────────
do $$ begin
  perform 1 from public.question_answers;
  raise exception 'ASSERTION FAILED: student read answer keys';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform 1 from public.room_question_plan;
  raise exception 'ASSERTION FAILED: student read the upcoming question plan';
exception when insufficient_privilege then null;
end $$;
select tests.assert((select correct_option is null and explanation is null from public.room_rounds), 'open round does not reveal the answer');
\echo '  ✓ answers and question order stay server-side'

-- ── Questions visibility ─────────────────────────────────────────────────────
select tests.assert((select count(*) = 1 from public.questions), 'alice sees only published questions');
select tests.login(tests.bob());
select tests.assert((select count(*) = 2 from public.questions), 'bob also sees his own unpublished AI question');
\echo '  ✓ AI questions stay private to their creator'

-- ── Students cannot write game state ─────────────────────────────────────────
select tests.login(tests.alice());
do $$ begin
  update public.room_players set score = 100000 where player_id = tests.alice();
  raise exception 'ASSERTION FAILED: student awarded themselves points';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into public.game_answers (room_id, round_index, player_id, question_id, submitted_option, is_correct, points_awarded, response_ms)
  values ('30000000-0000-4000-8000-000000000001', 0, tests.bob(), '20000000-0000-4000-8000-000000000001', 'A', true, 150, 1);
  raise exception 'ASSERTION FAILED: student wrote an answer directly';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  update public.game_rooms set status = 'finished';
  raise exception 'ASSERTION FAILED: student changed room state directly';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into public.xp_events (player_id, source, source_id, amount) values (tests.alice(), 'achievement', 'free', 1000);
  raise exception 'ASSERTION FAILED: student granted themselves XP';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  delete from public.game_rooms;
  raise exception 'ASSERTION FAILED: student deleted a room';
exception when insufficient_privilege then null;
end $$;
\echo '  ✓ scores, answers, rooms and XP cannot be written by students'

-- ── Room membership controls visibility ──────────────────────────────────────
select tests.login(tests.carol());
select tests.assert((select count(*) = 0 from public.game_rooms), 'non-member cannot see the room');
select tests.assert((select count(*) = 0 from public.room_players), 'non-member cannot see players');
select tests.assert((select count(*) = 0 from public.room_rounds), 'non-member cannot see rounds');

select tests.login(tests.bob());
select tests.assert((select count(*) = 1 from public.game_rooms), 'member sees the room');
select tests.assert((select count(*) = 2 from public.room_players), 'member sees other players');
select tests.assert((select count(*) = 0 from public.game_answers), 'member cannot see other players'' answers');
select tests.assert((select count(*) = 0 from public.xp_events), 'member cannot see other players'' XP history');
\echo '  ✓ rooms are visible to members only'

-- ── Subjects of interest ─────────────────────────────────────────────────────
select tests.login(tests.alice());
insert into public.profile_subjects (profile_id, subject_id) select tests.alice(), id from public.subjects where slug = 'maths';
do $$ begin
  insert into public.profile_subjects (profile_id, subject_id) select tests.bob(), id from public.subjects where slug = 'maths';
  raise exception 'ASSERTION FAILED: student changed another student''s subjects';
exception when insufficient_privilege then null; -- RLS violation (42501)
end $$;
\echo '  ✓ students manage only their own subjects'

-- ── Anonymous visitors ───────────────────────────────────────────────────────
select tests.login_anon();
select tests.assert((select count(*) = 5 from public.subjects), 'anon sees launch subjects');
select tests.assert((select count(*) > 0 from public.achievements), 'anon sees achievement catalogue');
do $$ begin
  perform 1 from public.profiles;
  raise exception 'ASSERTION FAILED: anon read profiles';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform 1 from public.questions;
  raise exception 'ASSERTION FAILED: anon read questions';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.is_room_member('30000000-0000-4000-8000-000000000001');
  raise exception 'ASSERTION FAILED: anon executed an internal function';
exception when insufficient_privilege then null;
end $$;
\echo '  ✓ anonymous visitors see only public reference data'

reset role;
select set_config('request.jwt.claims', '', false);

-- ── Data integrity constraints ───────────────────────────────────────────────
do $$ begin
  insert into public.game_answers (room_id, round_index, player_id, question_id, submitted_option, is_correct, points_awarded, response_ms)
  values ('30000000-0000-4000-8000-000000000001', 0, tests.alice(), '20000000-0000-4000-8000-000000000001', 'C', false, 0, 9000);
  raise exception 'ASSERTION FAILED: duplicate answer accepted';
exception when unique_violation then null;
end $$;
do $$ begin
  insert into public.game_answers (room_id, round_index, player_id, question_id, submitted_option, is_correct, points_awarded, response_ms)
  values ('30000000-0000-4000-8000-000000000001', 0, tests.bob(), '20000000-0000-4000-8000-000000000001', 'A', false, 50, 9000);
  raise exception 'ASSERTION FAILED: points awarded for a wrong answer';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.game_answers (room_id, round_index, player_id, question_id, submitted_option, is_correct, points_awarded, response_ms)
  values ('30000000-0000-4000-8000-000000000001', 0, tests.carol(), '20000000-0000-4000-8000-000000000001', 'B', true, 150, 1);
  raise exception 'ASSERTION FAILED: non-member answer accepted';
exception when foreign_key_violation then null;
end $$;
do $$ begin
  update public.room_rounds set correct_option = 'B' where room_id = '30000000-0000-4000-8000-000000000001';
  raise exception 'ASSERTION FAILED: answer revealed on an open round';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.questions (topic_id, question_text, options, difficulty)
  values ('10000000-0000-4000-8000-000000000001', 'Broken options question?', '[{"id":"A","text":"x"},{"id":"C","text":"y"},{"id":"B","text":"z"},{"id":"D","text":"w"}]', 'easy');
  raise exception 'ASSERTION FAILED: out-of-order options accepted';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.questions (topic_id, question_text, options, difficulty)
  values ('10000000-0000-4000-8000-000000000001', 'Not an array question?', '{"A":"x"}', 'easy');
  raise exception 'ASSERTION FAILED: non-array options accepted';
exception when check_violation then null;
end $$;
do $$ begin
  update public.questions set is_published = true where id = '20000000-0000-4000-8000-000000000002';
  raise exception 'ASSERTION FAILED: AI question published to the shared bank';
exception when check_violation then null;
end $$;
do $$ begin
  insert into public.game_rooms (room_code, host_id, subject_id, difficulty, question_count, max_players)
  select 'KX49QT', tests.bob(), id, 'easy', 5, 10 from public.subjects where slug = 'maths';
  raise exception 'ASSERTION FAILED: duplicate active room code accepted';
exception when unique_violation then null;
end $$;
do $$ begin
  insert into public.game_rooms (room_code, host_id, subject_id, difficulty, question_count, max_players)
  select 'AEIOU1', tests.bob(), id, 'easy', 5, 10 from public.subjects where slug = 'maths';
  raise exception 'ASSERTION FAILED: invalid room code accepted';
exception when check_violation then null;
end $$;
-- A finished room releases its code for reuse.
update public.game_rooms set status = 'finished', finished_at = now() where room_code = 'KX49QT';
insert into public.game_rooms (room_code, host_id, subject_id, difficulty, question_count, max_players)
select 'KX49QT', tests.bob(), id, 'easy', 5, 10 from public.subjects where slug = 'maths';
\echo '  ✓ constraints reject duplicate, late-reveal, malformed and unfair data'

-- ── Privilege audit: catches future migrations that forget to lock tables ────
do $$
declare offenders text;
begin
  select string_agg(format('%s:%s:%s', grantee, table_name, privilege_type), ', ')
  into offenders
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
    and not (grantee = 'authenticated' and table_name = 'profile_subjects' and privilege_type in ('INSERT', 'DELETE'));
  perform tests.assert(offenders is null, 'unexpected write privileges: ' || coalesce(offenders, ''));

  select string_agg(format('%s:%s', grantee, table_name), ', ')
  into offenders
  from information_schema.role_table_grants
  where table_schema = 'public'
    and grantee in ('anon', 'authenticated')
    and table_name in ('question_answers', 'room_question_plan');
  perform tests.assert(offenders is null, 'secret tables are granted to clients: ' || coalesce(offenders, ''));

  select string_agg(c.relname, ', ')
  into offenders
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  perform tests.assert(offenders is null, 'tables without RLS: ' || coalesce(offenders, ''));

  select string_agg(column_name, ', ')
  into offenders
  from information_schema.role_column_grants
  where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated'
    and privilege_type = 'UPDATE'
    and column_name not in ('display_name', 'education_stage', 'show_on_leaderboards', 'onboarding_completed');
  perform tests.assert(offenders is null, 'unexpected updatable profile columns: ' || coalesce(offenders, ''));
end $$;
\echo '  ✓ privilege audit: no unexpected client write access, RLS on every table'

-- ── Account deletion removes personal data ───────────────────────────────────
delete from auth.users where id = tests.bob();
select tests.assert((select count(*) = 0 from public.profiles where id = tests.bob()), 'profile deleted with account');
select tests.assert((select count(*) = 0 from public.room_players where player_id = tests.bob()), 'room membership deleted');
select tests.assert((select count(*) = 0 from public.questions where id = '20000000-0000-4000-8000-000000000002'), 'deleted user''s private AI questions removed');
select tests.assert((select count(*) = 1 from public.questions where id = '20000000-0000-4000-8000-000000000001'), 'shared bank questions survive');
select tests.assert((select count(*) = 0 from public.game_rooms where host_id = tests.bob()), 'rooms hosted by deleted user removed');
\echo '  ✓ deleting an account removes the student''s data'
