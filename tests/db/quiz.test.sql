-- ════════════════════════════════════════════════════════════════════════════
-- Solo quiz engine: server-side checking, reveal timing, XP rules, anti-farming,
-- progress and achievements. XP expectations here are mirrored by
-- tests/unit/progression.test.ts ("parity with the database") so the two
-- implementations can't drift apart.
-- ════════════════════════════════════════════════════════════════════════════
\set QUIET on
\o /dev/null

\set dave '\'00000000-0000-4000-8000-0000000000d4\''
\set erin '\'00000000-0000-4000-8000-0000000000e5\''
\set topic '\'11000000-0000-4000-8000-000000000001\''

insert into auth.users (id, email, raw_user_meta_data) values
  (:dave, 'dave@example.test', '{"display_name":"Dave"}'),
  (:erin, 'erin@example.test', '{"display_name":"Erin"}');

insert into public.topics (id, subject_id, slug, name, education_stage)
select :topic, id, 'quiz-test-topic', 'Quiz test topic', 'gcse' from public.subjects where slug = 'chemistry';

-- Six published questions (five multiple choice, one short answer) and one draft.
insert into public.questions (id, topic_id, question_type, question_text, options, difficulty, is_published)
select ('12000000-0000-4000-8000-00000000000' || n)::uuid, :topic, 'multiple_choice',
       'Multiple choice test question number ' || n,
       '[{"id":"A","text":"one"},{"id":"B","text":"two"},{"id":"C","text":"three"},{"id":"D","text":"four"}]',
       'foundation', true
from generate_series(1, 5) n;
insert into public.questions (id, topic_id, question_type, question_text, options, difficulty, is_published) values
  ('12000000-0000-4000-8000-000000000006', :topic, 'short_answer', 'Name the green pigment in leaves.', null, 'standard', true),
  ('12000000-0000-4000-8000-000000000007', :topic, 'multiple_choice', 'Unpublished draft question',
   '[{"id":"A","text":"w"},{"id":"B","text":"x"},{"id":"C","text":"y"},{"id":"D","text":"z"}]', 'foundation', false);
insert into public.question_answers (question_id, correct_option, explanation)
select ('12000000-0000-4000-8000-00000000000' || n)::uuid, 'B', 'Explanation long enough to pass the length check.'
from generate_series(1, 5) n;
insert into public.question_answers (question_id, correct_option, explanation)
values ('12000000-0000-4000-8000-000000000007', 'A', 'Explanation long enough to pass the length check.');
insert into public.question_answers (question_id, accepted_answers, explanation)
values ('12000000-0000-4000-8000-000000000006', array['chlorophyll'], 'Chlorophyll absorbs light for photosynthesis.');

insert into tests.answer_key select question_id, coalesce(correct_option, accepted_answers[1]) from public.question_answers
where question_id::text like '12000000-%';

\echo '  · quiz fixtures loaded'

-- ── Access ───────────────────────────────────────────────────────────────────
select tests.login_anon();
select tests.expect_error(format('select public.start_quiz(%L)', :topic), '42501');
select tests.login(:dave);
select tests.expect_error(format('select public.start_quiz(%L, null, 2)', :topic), '23514');
select tests.expect_error(format('select public.start_quiz(%L, null, 21)', :topic), '23514');
select tests.expect_error('select public.start_quiz(gen_random_uuid())', 'not_enough_questions');
\echo '  ✓ quizzes need a signed-in student, a sensible length and enough questions'

-- ── Quiz one: 5 right, 1 wrong ───────────────────────────────────────────────
select public.start_quiz(:topic, 'foundation', 6) as q1 \gset
select tests.expect_error(format('select * from public.get_quiz_review(%L)', :'q1'), 'not_finished');
select tests.assert((select cardinality(question_ids) = 6 from public.quiz_sessions where id = :'q1'), 'six questions picked');
select tests.assert(
  (select bool_and(q.is_published) from public.quiz_sessions s, unnest(s.question_ids) qid join public.questions q on q.id = qid where s.id = :'q1'),
  'only published questions are used');

-- Answers checked server-side; the reveal comes back only after submitting.
select tests.assert(
  (select (r ->> 'is_correct')::boolean = false and r ->> 'correct_option' = 'B' and r ->> 'explanation' like 'Explanation%'
   from public.submit_quiz_answer(:'q1', '12000000-0000-4000-8000-000000000001', 'a') r),
  'wrong answer marked wrong, then answer + explanation revealed');
select tests.expect_error(format('select public.submit_quiz_answer(%L, %L, %L)', :'q1', '12000000-0000-4000-8000-000000000001', 'B'), 'already_answered');
select tests.expect_error(format('select public.submit_quiz_answer(%L, %L, %L)', :'q1', '12000000-0000-4000-8000-000000000002', 'E'), 'invalid_answer');
select tests.expect_error(format('select public.submit_quiz_answer(%L, %L, %L)', :'q1', '12000000-0000-4000-8000-000000000007', 'A'), 'not_in_quiz');
select tests.expect_error(format('select public.submit_quiz_answer(%L, %L, %L)', :'q1', '12000000-0000-4000-8000-000000000002', ''), 'invalid_answer');
select tests.assert(
  (select (r ->> 'is_correct')::boolean from public.submit_quiz_answer(:'q1', '12000000-0000-4000-8000-000000000006', '  Chlorophyll. ') r),
  'short answers are normalised before comparing');
select public.submit_quiz_answer(:'q1', question_id, answer) from tests.answer_key
where question_id in ('12000000-0000-4000-8000-000000000002', '12000000-0000-4000-8000-000000000003',
                      '12000000-0000-4000-8000-000000000004', '12000000-0000-4000-8000-000000000005');
\echo '  ✓ answers are checked on the server and revealed only after submitting'

-- Another student can't touch Dave's quiz or see his answers.
select tests.login(:erin);
select tests.expect_error(format('select public.submit_quiz_answer(%L, %L, %L)', :'q1', '12000000-0000-4000-8000-000000000002', 'B'), 'not_found');
select tests.expect_error(format('select public.complete_quiz(%L)', :'q1'), 'not_found');
select tests.expect_error(format('select * from public.get_quiz_review(%L)', :'q1'), 'not_found');
select tests.assert((select count(*) = 0 from public.quiz_attempts), 'other students cannot read your attempts');
select tests.assert((select count(*) = 0 from public.quiz_sessions), 'other students cannot read your quizzes');
\echo '  ✓ quizzes are private to their owner'

select tests.login(:dave);
select public.complete_quiz(:'q1') as r1 \gset
-- 5 correct × 10 + completion 20 = 70 (cap not reached). first_quiz achievement pays 25.
select tests.assert((:'r1'::jsonb -> 'xp' ->> 'total')::int = 70, 'quiz one XP = 70, got ' || (:'r1'::jsonb -> 'xp' ->> 'total'));
select tests.assert((:'r1'::jsonb ->> 'accuracy')::numeric = 0.833, 'accuracy 5/6');
select tests.assert(:'r1'::jsonb -> 'new_achievements' ? 'first_quiz', 'first quiz achievement awarded');
select tests.assert((select xp = 95 from public.profiles), 'profile XP = 70 + 25');
select tests.assert(
  (select questions_attempted = 6 and correct_answers = 5 and best_accuracy = 0.833 from public.user_progress where topic_id = :topic),
  'topic progress saved');
select tests.expect_error(format('select public.complete_quiz(%L)', :'q1'), 'finished');
select tests.assert((select count(*) = 6 and count(*) filter (where not is_correct) = 1 from public.get_quiz_review(:'q1')), 'review lists every question after finishing');
select tests.expect_error(format('select public.submit_quiz_answer(%L, %L, %L)', :'q1', '12000000-0000-4000-8000-000000000002', 'B'), 'finished');
\echo '  ✓ finishing saves progress, awards XP once, and locks the quiz'

-- ── Quiz two: all right. Only the previously-missed question is "fresh". ──────
select public.start_quiz(:topic, null, 6) as q2 \gset
select public.submit_quiz_answer(:'q2', question_id, answer) from tests.answer_key
where question_id <> '12000000-0000-4000-8000-000000000007';
select public.complete_quiz(:'q2') as r2 \gset
-- 1 fresh correct × 10 + completion 20 + perfect 25 + personal best 15 = 70
select tests.assert((:'r2'::jsonb -> 'xp' ->> 'total')::int = 70, 'quiz two XP = 70, got ' || (:'r2'::jsonb -> 'xp' ->> 'total'));
select tests.assert((:'r2'::jsonb -> 'xp' ->> 'personal_best')::int = 15, 'personal best bonus');
select tests.assert(:'r2'::jsonb -> 'new_achievements' ? 'perfect_quiz', 'perfect quiz achievement');
select tests.assert((select xp = 95 + 70 + 40 from public.profiles), 'profile XP includes perfect-quiz reward');

-- ── Quiz three: identical replay earns nothing (anti-farming) ────────────────
select public.start_quiz(:topic, null, 6) as q3 \gset
select public.submit_quiz_answer(:'q3', question_id, answer) from tests.answer_key
where question_id <> '12000000-0000-4000-8000-000000000007';
select public.complete_quiz(:'q3') as r3 \gset
select tests.assert((:'r3'::jsonb -> 'xp' ->> 'total')::int = 0, 'replaying rewarded questions pays nothing');
select tests.assert((select xp = 205 from public.profiles), 'XP unchanged by replay');
\echo '  ✓ anti-farming: replaying the same questions earns no XP'

-- ── Daily cap ────────────────────────────────────────────────────────────────
reset role;
insert into public.xp_events (player_id, source, source_id, amount) values (:dave, 'solo_quiz', 'cap-test', 595);
select tests.login(:erin);
select public.start_quiz(:topic, null, 6) as q4 \gset
reset role;
update public.quiz_sessions set player_id = :dave where id = :'q4';
delete from public.quiz_attempts where player_id = :dave;  -- make every question fresh again
select tests.login(:dave);
select public.submit_quiz_answer(:'q4', question_id, answer) from tests.answer_key
where question_id <> '12000000-0000-4000-8000-000000000007';
select public.complete_quiz(:'q4') as r4 \gset
-- Earned today: 70 + 70 + 0 + 595 = 735 ≥ 600, so nothing more is paid.
select tests.assert((:'r4'::jsonb -> 'xp' ->> 'total')::int = 0, 'daily solo XP cap respected, got ' || (:'r4'::jsonb -> 'xp' ->> 'total'));
select tests.assert((:'r4'::jsonb -> 'xp' ->> 'capped')::int > 0, 'capped amount reported');
\echo '  ✓ daily XP cap applies'

-- ── Students still can't write the tables directly ───────────────────────────
select tests.expect_error(format($s$update public.quiz_sessions set correct_count = 99 where id = %L$s$, :'q4'), '42501');
select tests.expect_error(format($s$update public.user_progress set mastery = 1$s$), '42501');
select tests.expect_error('select public.award_achievement(auth.uid(), ''century'')', '42501');
\echo '  ✓ results, progress and achievements can only change through the quiz functions'

reset role;
select set_config('request.jwt.claims', '', false);

-- ── Streaks (UK calendar days) ───────────────────────────────────────────────
reset role;
select tests.assert(public.learning_streak(:dave) = 1, 'quizzes today give a 1-day streak, got ' || public.learning_streak(:dave));
insert into public.quiz_sessions (player_id, topic_id, question_ids, status, completed_at, started_at)
select :dave, :topic, array['12000000-0000-4000-8000-000000000001'::uuid], 'completed', now() - (n || ' days')::interval, now() - (n || ' days')::interval
from generate_series(1, 2) n;
select tests.assert(public.learning_streak(:dave) = 3, 'three consecutive days, got ' || public.learning_streak(:dave));
insert into public.quiz_sessions (player_id, topic_id, question_ids, status, completed_at, started_at)
values (:dave, :topic, array['12000000-0000-4000-8000-000000000001'::uuid], 'completed', now() - interval '5 days', now() - interval '5 days');
select tests.assert(public.learning_streak(:dave) = 3, 'a gap breaks the streak');
select tests.assert(public.learning_streak(:erin) = 0, 'no activity, no streak');
select tests.login(:dave);
select tests.assert('streak_3' = any (public.check_flashcard_achievements()), 'streak achievement awarded');
select tests.assert(not ('streak_3' = any (public.check_flashcard_achievements())), 'awarded only once');
select tests.expect_error(format('select public.learning_streak(%L)', :erin), '42501');
reset role;
\echo '  ✓ streaks follow UK calendar days and pay their achievement once'

-- ── The real question bank ───────────────────────────────────────────────────
select tests.assert((select count(*) from public.questions where source_type = 'question_bank' and is_published) >= 144, 'bank loaded');
select tests.assert(
  (select count(*) from public.questions q where q.is_published
     and not exists (select 1 from public.question_answers a where a.question_id = q.id)) = 0,
  'every published question has an answer key');
select tests.assert(
  (select count(*) from public.subjects s where not exists (select 1 from public.topics t where t.subject_id = s.id)) = 0,
  'every subject has at least one topic');
select tests.login(:dave);
select public.start_quiz(t.id, 'standard', 8) as bankquiz from public.topics t where t.slug = 'cell-biology' \gset
select tests.assert((select cardinality(question_ids) = 8 from public.quiz_sessions where id = :'bankquiz'), 'a full 8-question quiz from the bank');
reset role;
\echo '  ✓ the question bank is complete and playable'
