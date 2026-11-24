-- ════════════════════════════════════════════════════════════════════════════
-- Live games: codes, joining, host controls, server timing and scoring, answer
-- secrecy, round reveal, XP and achievements, leaving and rate limits.
-- Times are moved by editing a round's timestamps as the database owner, so the
-- test doesn't need to sleep.
-- ════════════════════════════════════════════════════════════════════════════
\set QUIET on
\o /dev/null

\set dave '\'00000000-0000-4000-8000-0000000000d4\''
\set erin '\'00000000-0000-4000-8000-0000000000e5\''
\set finn '\'00000000-0000-4000-8000-0000000000f6\''
\set topic '\'21000000-0000-4000-8000-000000000001\''

insert into auth.users (id, email, raw_user_meta_data) values
  (:dave, 'dave@example.test', '{"display_name":"Dave"}'),
  (:erin, 'erin@example.test', '{"display_name":"Erin"}'),
  (:finn, 'finn@example.test', '{"display_name":"Finn"}');

select id as subject from public.subjects where slug = 'physics' \gset
select id as other_subject from public.subjects where slug = 'history' \gset

insert into public.topics (id, subject_id, slug, name, education_stage)
values (:topic, :'subject', 'live-game-test-topic', 'Live game test topic', 'gcse');

-- Three multiple choice (answer B), one true/false (answer A), one short answer.
insert into public.questions (id, topic_id, question_type, question_text, options, difficulty, is_published)
select ('22000000-0000-4000-8000-00000000000' || n)::uuid, :topic, 'multiple_choice',
       'Live game test question number ' || n,
       '[{"id":"A","text":"one"},{"id":"B","text":"two"},{"id":"C","text":"three"},{"id":"D","text":"four"}]',
       'standard', true
from generate_series(1, 3) n;
insert into public.questions (id, topic_id, question_type, question_text, options, difficulty, is_published) values
  ('22000000-0000-4000-8000-000000000004', :topic, 'true_false', 'Live game true or false question',
   '[{"id":"A","text":"True"},{"id":"B","text":"False"}]', 'foundation', true),
  ('22000000-0000-4000-8000-000000000005', :topic, 'short_answer', 'Live game short answer question', null, 'standard', true);
insert into public.question_answers (question_id, correct_option, explanation)
select ('22000000-0000-4000-8000-00000000000' || n)::uuid, 'B', 'Explanation long enough to pass the length check.'
from generate_series(1, 3) n;
insert into public.question_answers (question_id, correct_option, explanation)
values ('22000000-0000-4000-8000-000000000004', 'A', 'Explanation long enough to pass the length check.');
insert into public.question_answers (question_id, accepted_answers, explanation)
values ('22000000-0000-4000-8000-000000000005', array['volt'], 'Explanation long enough to pass the length check.');

-- Answer key for this test: the right option for each question.
create function pg_temp.key(q uuid) returns text language sql as $$
  select correct_option from public.question_answers where question_id = q
$$;

\echo '  · live game fixtures loaded'

-- ── Creating a room ──────────────────────────────────────────────────────────
select tests.login_anon();
select tests.expect_error(format('select public.create_room(%L)', :'subject'), '42501');
select tests.expect_error(format('select public.join_room(%L)', 'BBBBBB'), '42501');

select tests.login(:dave);
select tests.expect_error(format('select public.create_room(%L, %L, null, 2)', :'subject', :topic), '23514');
select tests.expect_error(format('select public.create_room(%L, %L, null, 5, 5)', :'subject', :topic), '23514');
select tests.expect_error(format('select public.create_room(%L, %L)', :'other_subject', :topic), 'not_found');

select public.create_room(:'subject', :topic, null, 10, 20) as created \gset
select (:'created'::jsonb ->> 'room_id') as room, (:'created'::jsonb ->> 'room_code') as code \gset
select tests.assert(:'code' ~ '^[BCDFGHJKMNPQRSTVWXZ2-9]{6}$', 'room code uses the safe alphabet');
select tests.assert((select question_count = 4 from public.game_rooms where id = :'room'),
  'game length is capped at the option questions available (short answers are not used live)');
select tests.assert((select status = 'lobby' and host_id = :dave from public.game_rooms where id = :'room'), 'room starts in the lobby');
select tests.expect_error(format('select public.start_game(%L)', :'room'), 'need_players');
\echo '  ✓ rooms need a signed-in host, sensible settings and enough questions'

-- A second room closes the host's first lobby.
select (public.create_room(:'subject', :topic) ->> 'room_id') as spare \gset
select tests.assert((select status = 'abandoned' from public.game_rooms where id = :'room'), 'older lobby closed');
reset role;
update public.game_rooms set status = 'lobby' where id = :'room';
update public.game_rooms set status = 'abandoned' where id = :'spare';
select tests.login(:dave);
\echo '  ✓ a host has one open lobby at a time'

-- ── Joining ──────────────────────────────────────────────────────────────────
select tests.login(:erin);
select tests.assert((select count(*) = 0 from public.game_rooms), 'outsiders cannot see the room');
select tests.assert(public.join_room('not a code') ->> 'error' = 'invalid_code', 'bad codes are rejected');
select tests.assert(
  public.join_room(case when :'code' = 'BBBBBB' then 'CCCCCC' else 'BBBBBB' end) ->> 'error' = 'not_found',
  'unknown codes are rejected');
select tests.assert(
  public.join_room(lower(substr(:'code', 1, 3)) || ' ' || substr(:'code', 4)) ->> 'room_id' = :'room',
  'codes are matched ignoring case and spaces');
select tests.assert(public.join_room(:'code') ->> 'room_id' = :'room', 'joining twice is harmless');
select tests.assert((select count(*) = 2 from public.room_players where room_id = :'room'), 'two players in the room');
select tests.assert((select display_name from public.room_players where room_id = :'room' and player_id = :erin) = 'Erin', 'display name copied');
select tests.expect_error(format('select public.start_game(%L)', :'room'), 'not_host');
\echo '  ✓ players join with a code; only the host can start'

-- ── Starting ─────────────────────────────────────────────────────────────────
select tests.login(:dave);
select public.start_game(:'room');
select tests.expect_error(format('select public.start_game(%L)', :'room'), 'already_started');
select tests.assert((select status = 'in_progress' and current_round = 0 from public.game_rooms where id = :'room'), 'game running at round 0');
select tests.assert((select count(*) = 1 from public.room_rounds where room_id = :'room'), 'only the first round is open');
select tests.assert(
  (select correct_option is null and explanation is null and started_at > now() from public.room_rounds where room_id = :'room'),
  'the open round hides the answer and starts after a countdown');
select tests.expect_error('select * from public.room_question_plan', '42501');
select tests.expect_error('select * from public.question_answers', '42501');

select tests.login(:finn);
select tests.assert(public.join_room(:'code') ->> 'error' = 'already_started', 'no joining once started');
select tests.assert((select count(*) = 0 from public.room_rounds), 'outsiders cannot see rounds');
select tests.expect_error(format('select public.submit_game_answer(%L, 0, %L)', :'room', 'A'), 'not_found');
\echo '  ✓ the question order and answers stay hidden; outsiders are kept out'

-- ── Round 0: timing, scoring, one answer each ────────────────────────────────
select tests.login(:dave);
select tests.expect_error(format('select public.submit_game_answer(%L, 0, %L)', :'room', 'B'), 'not_open');

reset role;
-- 5 s into a 20 s window: 15 s left → bonus floor(50 × 15000 / 20000) = 37 (36 if a few ms pass).
update public.room_rounds set started_at = now() - interval '5 seconds', deadline_at = now() + interval '15 seconds'
where room_id = :'room' and round_index = 0;
select question_id as q0 from public.room_rounds where room_id = :'room' and round_index = 0 \gset
select pg_temp.key(:'q0') as k0 \gset
select case when :'k0' = 'A' then 'B' else 'A' end as w0 \gset

select tests.login(:dave);
select tests.expect_error(format('select public.submit_game_answer(%L, 0, %L)', :'room', 'E'), 'invalid_answer');
select tests.expect_error(format('select public.submit_game_answer(%L, 1, %L)', :'room', :'k0'), 'round_over');
select tests.assert(
  (public.submit_game_answer(:'room', 0, :'k0') ->> 'round_closed')::boolean = false,
  'round stays open until everyone answers');
select tests.expect_error(format('select public.submit_game_answer(%L, 0, %L)', :'room', :'k0'), 'already_answered');
select tests.assert(
  (select is_correct and points_awarded between 136 and 137 and response_ms between 5000 and 5500 from public.game_answers),
  'a correct answer 5 s into a 20 s round scores 100 + 37 (scoring.ts parity)');
select tests.assert((select score between 136 and 137 and correct_count = 1 from public.room_players where room_id = :'room' and player_id = :dave),
  'the score is added on the server');
select tests.assert((select correct_option is null from public.room_rounds where room_id = :'room' and round_index = 0), 'answer still hidden');
select tests.assert((select answers_received = 1 from public.room_rounds where room_id = :'room' and round_index = 0),
  'everyone can see how many have answered');
select tests.expect_error(format('update public.room_rounds set answers_received = 0 where room_id = %L', :'room'), '42501');

select tests.login(:erin);
select tests.assert((select count(*) = 0 from public.game_answers), 'players cannot see each other''s answers');
select tests.assert((public.close_round(:'room', 0) ->> 'closed')::boolean = false, 'a round cannot be closed early');
select tests.assert(
  (public.submit_game_answer(:'room', 0, :'w0') ->> 'round_closed')::boolean = true,
  'the last answer closes the round');
select tests.assert((select correct_option = :'k0' and explanation is not null from public.room_rounds where room_id = :'room' and round_index = 0),
  'the answer and explanation are revealed to everyone after the round');
select tests.assert((select not is_correct and points_awarded = 0 from public.game_answers), 'a wrong answer scores nothing');
select tests.expect_error(format('select public.next_round(%L, 0)', :'room'), 'not_host');
\echo '  ✓ answers are timed and scored on the server and revealed together'

-- ── Moving on ────────────────────────────────────────────────────────────────
select tests.login(:dave);
select public.next_round(:'room', 0);
select public.next_round(:'room', 0);
select tests.assert((select current_round = 1 from public.game_rooms where id = :'room'), 'a double click only moves on once');
select tests.expect_error(format('select public.next_round(%L, 1)', :'room'), 'still_open');

-- Round 1: time runs out. Late answers are refused and anyone can close it.
reset role;
update public.room_rounds set started_at = now() - interval '30 seconds', deadline_at = now() - interval '10 seconds'
where room_id = :'room' and round_index = 1;
select tests.login(:erin);
select tests.expect_error(format('select public.submit_game_answer(%L, 1, %L)', :'room', 'A'), 'round_over');
select tests.assert((public.close_round(:'room', 1) ->> 'closed')::boolean, 'anyone can close a round once time is up');

-- If the host goes quiet after a reveal, another player can move on after 15 s.
select tests.expect_error(format('select public.next_round(%L, 1)', :'room'), 'not_host');
reset role;
update public.room_rounds set closed_at = now() - interval '20 seconds' where room_id = :'room' and round_index = 1;
select tests.login(:erin);
select public.next_round(:'room', 1);
select tests.assert((select current_round = 2 from public.game_rooms where id = :'room'), 'a player can move on when the host is away');
\echo '  ✓ late answers are refused and a missing host cannot stall the game'

-- ── Rounds 2 and 3: both correct; Dave is faster ─────────────────────────────
reset role;
update public.room_rounds set started_at = now() - interval '1 second', deadline_at = now() + interval '19 seconds'
where room_id = :'room' and round_index = 2;
select pg_temp.key(question_id) as k2 from public.room_rounds where room_id = :'room' and round_index = 2 \gset
select tests.login(:dave);
select public.submit_game_answer(:'room', 2, :'k2');
select tests.login(:erin);
select public.submit_game_answer(:'room', 2, :'k2');
select tests.login(:dave);
select public.next_round(:'room', 2);

reset role;
update public.room_rounds set started_at = now() - interval '1 second', deadline_at = now() + interval '19 seconds'
where room_id = :'room' and round_index = 3;
select pg_temp.key(question_id) as k3 from public.room_rounds where room_id = :'room' and round_index = 3 \gset
select tests.login(:erin);
select public.submit_game_answer(:'room', 3, :'k3');
select tests.login(:dave);
select tests.assert((public.submit_game_answer(:'room', 3, :'k3') ->> 'round_closed')::boolean, 'last round closes');

-- ── Results, XP and achievements ─────────────────────────────────────────────
select tests.assert((select status = 'finished' and finished_at is not null from public.game_rooms where id = :'room'),
  'closing the last round finishes the game');
select tests.assert((select amount = 50 from public.xp_events where source = 'multiplayer_game' and source_id = :'room'),
  'the winner gets 20 XP for finishing plus 30 for first place');
select tests.assert(exists (select 1 from public.user_achievements where achievement_id = 'battle_winner'), 'winner achievement');
select tests.assert(exists (select 1 from public.user_achievements where achievement_id = 'first_battle'), 'first game achievement');
select tests.login(:erin);
select tests.assert((select amount = 40 from public.xp_events where source = 'multiplayer_game' and source_id = :'room'),
  'second place gets 20 + 20 XP');
select tests.assert(not exists (select 1 from public.user_achievements where achievement_id = 'battle_winner'), 'only the winner wins');
select tests.expect_error(format('select public.submit_game_answer(%L, 3, %L)', :'room', 'A'), 'not_running');

reset role;
select public.finish_game(:'room');
select tests.assert((select count(*) = 2 from public.xp_events where source = 'multiplayer_game'), 'XP is never paid twice');
select tests.assert((select xp from public.profiles where id = :dave) = 50 + 25 + 50, 'profile XP includes game and achievement XP');
\echo '  ✓ results pay XP and achievements once'

-- ── Leaving ──────────────────────────────────────────────────────────────────
select tests.login(:dave);
select (public.create_room(:'subject', null, 'foundation', 5, 15) ->> 'room_code') as code2 \gset
select id as room2 from public.game_rooms where room_code = :'code2' and status = 'lobby' \gset
select tests.login(:finn);
select public.join_room(:'code2');
select public.leave_room(:'room2');
select tests.assert((select count(*) = 0 from public.game_rooms where id = :'room2'), 'a player who leaves no longer sees the room');
select tests.assert(public.join_room(:'code2') ->> 'room_id' = :'room2', 'a player can come back to the lobby');
select tests.login(:dave);
select public.leave_room(:'room2');
select tests.login(:finn);
select tests.assert(public.join_room(:'code2') ->> 'error' = 'not_found', 'the room closes when the host leaves the lobby');
\echo '  ✓ leaving works, and a host leaving the lobby closes the room'

-- ── Direct writes and rate limits ────────────────────────────────────────────
select tests.expect_error(format(
  'insert into public.game_answers (room_id, round_index, player_id, question_id, submitted_option, is_correct, points_awarded, response_ms) values (%L, 0, %L, %L, %L, true, 150, 1)',
  :'room', :finn, :'q0', 'A'), '42501');
select tests.expect_error(format('update public.room_players set score = 9999 where room_id = %L', :'room'), '42501');
select tests.expect_error(format('select public.close_game_round(%L, 0)', :'room'), '42501');
select tests.expect_error(format('select public.finish_game(%L)', :'room'), '42501');
select tests.expect_error('select * from public.room_join_attempts', '42501');

select count(*) from generate_series(1, 30) n, lateral public.join_room('ZZZZZ' || (n % 9 + 1)) j;
select tests.assert(public.join_room(:'code') ->> 'error' = 'rate_limited', 'too many join attempts are refused');
\echo '  ✓ no direct writes; code guessing is rate limited'

\echo '  ✓ live game tests passed'
