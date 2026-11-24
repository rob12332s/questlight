-- ════════════════════════════════════════════════════════════════════════════
-- Teacher classrooms: who can create classes, joining with a code, privacy between
-- classmates, the teacher's overview, class leaderboards, class-only games hosted by
-- a teacher who doesn't play, code resets, removing, leaving and archiving.
-- ════════════════════════════════════════════════════════════════════════════
\set QUIET on
\o /dev/null

\set tess '\'00000000-0000-4000-8000-00000000a001\''
\set sam '\'00000000-0000-4000-8000-00000000a002\''
\set una '\'00000000-0000-4000-8000-00000000a003\''
\set vic '\'00000000-0000-4000-8000-00000000a004\''

insert into auth.users (id, email, raw_user_meta_data) values
  (:tess, 'tess@example.test', '{"display_name":"Ms Tess"}'),
  (:sam, 'sam@example.test', '{"display_name":"Sam"}'),
  (:una, 'una@example.test', '{"display_name":"Una"}'),
  (:vic, 'vic@example.test', '{"display_name":"Vic"}');
select id as subject from public.subjects where slug = 'physics' \gset

-- ── Only teachers create classes; nobody can make themselves a teacher ───────
select tests.login(:sam);
select tests.expect_error('select public.create_classroom(''My class'')', 'not_teacher');
select tests.expect_error(format('update public.profiles set account_type = %L where id = %L', 'teacher', :sam), '42501');
select tests.assert(not public.is_teacher(), 'students are not teachers');
reset role;
update public.profiles set account_type = 'teacher' where id = :tess;

select tests.login(:tess);
select tests.assert(public.is_teacher(), 'the site owner can mark a teacher');
select tests.expect_error('select public.create_classroom(''x'')', 'bad_name');
select public.create_classroom('  Year 10   Science ') as created \gset
select (:'created'::jsonb ->> 'classroom_id') as class, (:'created'::jsonb ->> 'class_code') as code \gset
select tests.assert((select name = 'Year 10 Science' from public.classrooms where id = :'class'), 'class names are tidied');
select tests.assert(:'code' ~ '^[BCDFGHJKMNPQRSTVWXZ2-9]{6}$', 'class codes use the safe alphabet');
\echo '  ✓ only teacher accounts create classes'

-- ── Joining ──────────────────────────────────────────────────────────────────
select tests.login(:sam);
select tests.assert((select count(*) = 0 from public.classrooms), 'students cannot see a class before joining');
select tests.assert(public.join_classroom('nope') ->> 'error' = 'invalid_code', 'bad codes are rejected');
select tests.assert(public.join_classroom(lower(:'code')) ->> 'classroom_id' = :'class', 'students join with the code');
select tests.assert(public.join_classroom(:'code') ->> 'classroom_id' = :'class', 'joining twice is harmless');
select tests.login(:una);
select public.join_classroom(:'code');
select tests.assert((select count(*) = 1 from public.classrooms), 'members see their class');
select tests.assert((select count(*) = 1 from public.classroom_members), 'students see only their own membership');
select tests.login(:tess);
select tests.assert((select count(*) = 2 from public.classroom_members where classroom_id = :'class'), 'the teacher sees the class list');
\echo '  ✓ students join with a code and only see their own membership'

-- ── Overview and class leaderboard ───────────────────────────────────────────
reset role;
insert into public.xp_events (player_id, source, source_id, amount) values (:sam, 'solo_quiz', 'class-test', 40);

select tests.login(:tess);
select tests.assert(
  (select array_agg(display_name || ':' || xp_week order by display_name) from public.get_classroom_overview(:'class'))
  = array['Sam:40', 'Una:0'],
  'the teacher sees every student''s week, including those with no activity');
select tests.assert(
  (select array_agg(display_name || ':' || place || ':' || points order by place) from public.get_class_leaderboard(:'class'))
  = array['Sam:1:40'],
  'the teacher sees the class leaderboard');

select tests.login(:una);
select tests.expect_error(format('select * from public.get_classroom_overview(%L)', :'class'), 'not_found');
select tests.assert(
  (select array_agg(display_name || ':' || place || ':' || is_me order by place) from public.get_class_leaderboard(:'class'))
  = array['Sam:1:false', 'Una:2:true'],
  'classmates see the class board and their own place');

select tests.login(:vic);
select tests.expect_error(format('select * from public.get_class_leaderboard(%L)', :'class'), 'not_found');
select tests.expect_error(format('select * from public.get_class_games(%L)', :'class'), 'not_found');
\echo '  ✓ the teacher overview is teacher-only; the class board is for the class'

-- ── Class games: the teacher hosts without playing ───────────────────────────
select tests.login(:sam);
select tests.expect_error(format('select public.create_room(%L, null, null, 5, 20, %L)', :'subject', :'class'), 'not_teacher');

select tests.login(:tess);
select public.create_room(:'subject', null, null, 5, 20, :'class') as game \gset
select (:'game'::jsonb ->> 'room_id') as room, (:'game'::jsonb ->> 'room_code') as room_code \gset
select tests.assert((select not host_plays and classroom_id = :'class' from public.game_rooms where id = :'room'), 'class games are hosted, not played, by the teacher');
select tests.assert((select count(*) = 0 from public.room_players where room_id = :'room'), 'the teacher is not a player');
select tests.expect_error(format('select public.start_game(%L)', :'room'), 'need_players');
select tests.assert(public.join_room(:'room_code') ->> 'room_id' = :'room', 'the teacher can reopen their own game');

select tests.login(:sam);
select tests.assert(
  (select title is not null and not joined from public.get_class_games(:'class') where room_id = :'room'),
  'students see the class''s open game');
select tests.assert(public.join_room(:'room_code') ->> 'room_id' = :'room', 'a class member joins');
select tests.login(:vic);
select tests.assert(public.join_room(:'room_code') ->> 'error' = 'class_only', 'outsiders cannot join a class game');

select tests.login(:tess);
select public.start_game(:'room');
reset role;
update public.room_rounds set started_at = now() - interval '1 second', deadline_at = now() + interval '19 seconds'
where room_id = :'room' and round_index = 0;
select a.correct_option as k from public.question_answers a join public.room_rounds r on r.question_id = a.question_id
where r.room_id = :'room' and r.round_index = 0 \gset
select tests.login(:tess);
select tests.assert((select count(*) = 1 from public.room_rounds where room_id = :'room'), 'the teacher sees the question');
select tests.expect_error(format('select public.submit_game_answer(%L, 0, %L)', :'room', :'k'), 'not_player');
select tests.login(:sam);
select tests.assert((public.submit_game_answer(:'room', 0, :'k') ->> 'round_closed')::boolean,
  'the round closes when every student has answered (the teacher isn''t waited for)');
select tests.login(:tess);
select public.next_round(:'room', 0);
select tests.assert((select current_round = 1 from public.game_rooms where id = :'room'), 'the teacher moves the class on');
\echo '  ✓ teachers host class-only games without playing'

-- ── Codes, removing, leaving, archiving ──────────────────────────────────────
select tests.login(:tess);
select public.reset_class_code(:'class') as new_code \gset
select tests.login(:vic);
select tests.assert(public.join_classroom(:'code') ->> 'error' = 'not_found', 'an old class code stops working');
select tests.assert(public.join_classroom(:'new_code') ->> 'classroom_id' = :'class', 'the new code works');

select tests.login(:sam);
select tests.expect_error(format('select public.remove_classroom_member(%L, %L)', :'class', :vic), 'not_found');
select tests.expect_error(format('select public.reset_class_code(%L)', :'class'), 'not_found');
select tests.login(:tess);
select public.remove_classroom_member(:'class', :vic);
select tests.login(:vic);
select tests.assert((select count(*) = 0 from public.classrooms), 'a removed student no longer sees the class');

select tests.login(:una);
select public.leave_classroom(:'class');
select tests.assert((select count(*) = 0 from public.classrooms), 'a student can leave a class');

select tests.login(:tess);
select (public.create_room(:'subject', null, null, 5, 20, :'class') ->> 'room_id') as lobby \gset
select public.archive_classroom(:'class');
select tests.assert((select status = 'abandoned' from public.game_rooms where id = :'lobby'), 'archiving closes the class''s open lobbies');
select tests.expect_error(format('select public.create_room(%L, null, null, 5, 20, %L)', :'subject', :'class'), 'not_teacher');
select tests.login(:vic);
select tests.assert(public.join_classroom(:'new_code') ->> 'error' = 'not_found', 'an archived class can''t be joined');
\echo '  ✓ teachers can reset codes, remove students and archive; students can leave'

-- ── Direct writes ────────────────────────────────────────────────────────────
select tests.expect_error(format('insert into public.classroom_members (classroom_id, student_id, display_name) values (%L, %L, %L)', :'class', :vic, 'Vic'), '42501');
select tests.expect_error(format('insert into public.classrooms (teacher_id, name, class_code) values (%L, %L, %L)', :vic, 'Fake', 'BCDFGH'), '42501');
select tests.expect_error(format('select public.lock_my_class(%L)', :'class'), '42501');
\echo '  ✓ classes change only through these functions'

\echo '  ✓ classroom tests passed'
