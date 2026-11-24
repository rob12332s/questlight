-- ════════════════════════════════════════════════════════════════════════════
-- Work set by teachers: only the class teacher sets it, students see their own, and
-- completion (on time or late) comes from finished quizzes on the topic.
-- ════════════════════════════════════════════════════════════════════════════
\set QUIET on
\o /dev/null

\set tom '\'00000000-0000-4000-8000-00000000c001\''
\set ola '\'00000000-0000-4000-8000-00000000c002\''
\set pip '\'00000000-0000-4000-8000-00000000c003\''
\set rex '\'00000000-0000-4000-8000-00000000c004\''
insert into auth.users (id, email, raw_user_meta_data) values
  (:tom, 'tom@example.test', '{"display_name":"Mr Tom"}'),
  (:ola, 'ola@example.test', '{"display_name":"Ola"}'),
  (:pip, 'pip@example.test', '{"display_name":"Pip"}'),
  (:rex, 'rex@example.test', '{"display_name":"Rex"}');
update public.profiles set account_type = 'teacher' where id = :tom;
select t.id as topic from public.topics t where t.slug = 'cell-biology' \gset
select t.id as other_topic from public.topics t where t.slug = 'energy' \gset

select tests.login(:tom);
select (public.create_classroom('Year 9 Biology') ->> 'classroom_id') as class \gset
select class_code as code from public.classrooms where id = :'class' \gset
select tests.login(:ola);
select public.join_classroom(:'code');
select tests.login(:pip);
select public.join_classroom(:'code');

-- ── Setting work ─────────────────────────────────────────────────────────────
select tests.expect_error(format('select public.create_assignment(%L, %L, current_date + 3)', :'class', :'topic'), 'not_found');
select tests.login(:tom);
select tests.expect_error(format('select public.create_assignment(%L, %L, current_date - 1)', :'class', :'topic'), 'bad_due_date');
select tests.expect_error(format('select public.create_assignment(%L, %L, current_date + 400)', :'class', :'topic'), 'bad_due_date');
select public.create_assignment(:'class', :'topic', current_date + 3) as work \gset
select tests.assert((select title = 'Cell biology' and due_at > now() from public.class_assignments where id = :'work'), 'work is named after the topic and due later');
select tests.expect_error(format('insert into public.class_assignments (classroom_id, topic_id, title, due_at, created_by) values (%L, %L, %L, now() + interval %L, %L)', :'class', :'topic', 'Fake', '1 day', :tom), '42501');
\echo '  ✓ only the class teacher sets work, with a sensible due date'

-- ── Students see their own work; outsiders see nothing ───────────────────────
select tests.login(:ola);
select tests.assert((select count(*) = 1 and bool_and(not done) from public.get_my_assignments()), 'a student sees the work set, not yet done');
select tests.assert((select count(*) = 1 from public.class_assignments), 'members can read the class''s work');
select tests.expect_error(format('select * from public.get_assignment_progress(%L)', :'work'), 'not_found');
select tests.login(:rex);
select tests.assert((select count(*) = 0 from public.get_my_assignments()), 'outsiders see no work');
select tests.assert((select count(*) = 0 from public.class_assignments), 'outsiders can''t read the class''s work');
\echo '  ✓ students see work set for their classes only'

-- ── Completion: Ola on time, Pip late, a different topic doesn't count ──────
reset role;
insert into public.quiz_sessions (player_id, topic_id, difficulty, question_ids, status, correct_count, completed_at)
select :ola, :'topic', 'standard', (select array_agg(id) from (select id from public.questions where topic_id = :'topic' limit 5) q), 'completed', 4, now();
insert into public.quiz_sessions (player_id, topic_id, difficulty, question_ids, status, correct_count, completed_at)
select :ola, :'topic', 'standard', (select array_agg(id) from (select id from public.questions where topic_id = :'topic' limit 5) q), 'completed', 5, now() + interval '1 minute';
insert into public.quiz_sessions (player_id, topic_id, difficulty, question_ids, status, correct_count, completed_at)
select :pip, :'other_topic', 'standard', (select array_agg(id) from (select id from public.questions where topic_id = :'other_topic' limit 5) q), 'completed', 5, now();
update public.class_assignments set due_at = now() + interval '1 hour' where id = :'work';
insert into public.quiz_sessions (player_id, topic_id, difficulty, question_ids, status, correct_count, completed_at)
select :pip, :'topic', 'standard', (select array_agg(id) from (select id from public.questions where topic_id = :'topic' limit 5) q), 'completed', 2, now() + interval '2 hours';

select tests.login(:tom);
select tests.assert(
  (select array_agg(display_name || ':' || status || ':' || coalesce(best_correct, -1) || '/' || coalesce(best_total, -1) order by display_name) from public.get_assignment_progress(:'work'))
  = array['Ola:done:5/5', 'Pip:late:2/5'],
  'the teacher sees on-time, late and best scores');
select tests.assert((select done_count = 2 and student_count = 2 from public.get_class_assignments(:'class')), 'the class summary counts students who have done it');
select tests.login(:ola);
select tests.assert((select bool_and(done) from public.get_my_assignments()), 'the student sees it as done');
\echo '  ✓ completion comes from finished quizzes on the topic, on time or late'

-- ── Deleting ────────────────────────────────────────────────────────────────
select tests.expect_error(format('select public.delete_assignment(%L)', :'work'), 'not_found');
select tests.login(:tom);
select public.delete_assignment(:'work');
select tests.assert((select count(*) = 0 from public.class_assignments), 'the teacher can remove work');
select public.archive_classroom(:'class');
select tests.expect_error(format('select public.create_assignment(%L, %L, current_date + 3)', :'class', :'topic'), 'archived');
\echo '  ✓ teachers can remove work; archived classes can''t get new work'
\echo '  ✓ assignment tests passed'
