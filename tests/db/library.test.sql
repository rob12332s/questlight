-- ════════════════════════════════════════════════════════════════════════════
-- Library, Exam Answer Coach, Pro access and subscriptions.
-- ════════════════════════════════════════════════════════════════════════════
\set QUIET on
\o /dev/null

\set kim '\'00000000-0000-4000-8000-00000000d001\''
\set lee '\'00000000-0000-4000-8000-00000000d002\''
\set ada '\'00000000-0000-4000-8000-00000000d003\''
insert into auth.users (id, email, raw_user_meta_data) values
  (:kim, 'kim@example.test', '{"display_name":"Kim"}'),
  (:lee, 'lee@example.test', '{"display_name":"Lee"}'),
  (:ada, 'ada@example.test', '{"display_name":"Ada"}');
update public.profiles set is_content_admin = true where id = :ada;
select id as maths from public.subjects where slug = 'maths' \gset

-- Seven free lessons, one Pro lesson, one planned topic, one unpublished.
insert into public.library_topics (id, subject_id, slug, area, title, objective, skill, coverage, verification, access, content_status, is_published, sort_order)
select ('e1000000-0000-4000-8000-00000000000' || n)::uuid, :'maths', 'free-' || n, 'Number', 'Free lesson ' || n,
       'Learn free lesson number ' || n, 'A skill', 'shared', 'verified', 'free', 'lesson', true, n
from generate_series(1, 7) n;
insert into public.library_topics (id, subject_id, slug, area, title, objective, skill, coverage, verification, access, content_status, is_published) values
  ('e2000000-0000-4000-8000-000000000001', :'maths', 'pro-lesson', 'Algebra', 'Pro lesson', 'Learn the Pro lesson topic', 'A skill', 'shared', 'verified', 'pro', 'lesson', true),
  ('e2000000-0000-4000-8000-000000000002', :'maths', 'planned', 'Algebra', 'Planned topic', 'Being written for later', 'A skill', 'general', 'awaiting_verification', 'free', 'planned', true),
  ('e2000000-0000-4000-8000-000000000003', :'maths', 'hidden', 'Algebra', 'Hidden topic', 'Not published yet at all', 'A skill', 'general', 'awaiting_verification', 'free', 'lesson', false);
insert into public.lessons (topic_id, content, status)
select id, '{"summary":"secret lesson body"}', 'published' from public.library_topics where slug <> 'planned';

-- ── The catalogue is public; lessons are not ────────────────────────────────
select tests.login_anon();
select tests.assert((select count(*) = 9 from public.library_topics), 'anyone can browse published topics (not the hidden one)');
select tests.expect_error('select * from public.lessons', '42501');
select tests.assert((select count(*) >= 20 from public.specifications), 'specifications are listed');
select tests.expect_error('select public.open_lesson(''e1000000-0000-4000-8000-000000000001'')', '42501');

select tests.login(:kim);
select tests.expect_error('select * from public.lessons', '42501');
select tests.expect_error('select public.open_lesson(''e2000000-0000-4000-8000-000000000002'')', 'not_found');
select tests.expect_error('select public.open_lesson(''e2000000-0000-4000-8000-000000000003'')', 'not_found');
\echo '  ✓ the library is browsable; lesson content is only served through open_lesson'

-- ── Free plan: Pro lessons locked, 5 lessons a day ──────────────────────────
select tests.expect_error('select public.open_lesson(''e2000000-0000-4000-8000-000000000001'')', 'pro_required');
select tests.assert(public.open_lesson('e1000000-0000-4000-8000-000000000001') -> 'content' ->> 'summary' = 'secret lesson body', 'a free lesson opens');
select public.open_lesson(('e1000000-0000-4000-8000-00000000000' || n)::uuid) from generate_series(2, 5) n;
select tests.assert((public.my_plan() ->> 'lessons_today')::int = 5 and not (public.my_plan() ->> 'pro')::boolean, 'plan shows 5 lessons used, not Pro');
select tests.expect_error('select public.open_lesson(''e1000000-0000-4000-8000-000000000006'')', 'daily_limit');
select tests.assert(public.open_lesson('e1000000-0000-4000-8000-000000000003') ? 'content', 'reopening a lesson already opened today is fine');
\echo '  ✓ free students get 5 lessons a day and Pro lessons stay locked'

-- ── Results ─────────────────────────────────────────────────────────────────
select public.record_coach_result('e1000000-0000-4000-8000-000000000001', 'independent', 3, 4, array['missing_units', 'BAD TAG!', 'missing_units']);
select tests.assert((select mistakes = array['missing_units'] and marks_awarded = 3 from public.coach_attempts), 'results are saved with clean mistake tags');
select tests.expect_error('select public.record_coach_result(''e1000000-0000-4000-8000-000000000001'', ''independent'', 5, 4)', '23514');
select tests.expect_error('select public.record_coach_result(''e1000000-0000-4000-8000-000000000001'', ''cheating'', 1, 4)', '23514');
select tests.expect_error('select public.record_coach_result(''e2000000-0000-4000-8000-000000000001'', ''independent'', 1, 4)', 'pro_required');
select tests.expect_error(format('insert into public.coach_attempts (player_id, topic_id, mode, marks_awarded, marks_available) values (%L, %L, %L, 4, 4)', :kim, 'e1000000-0000-4000-8000-000000000001', 'independent'), '42501');
select tests.login(:lee);
select tests.assert((select count(*) = 0 from public.coach_attempts), 'students only see their own results');
\echo '  ✓ results are validated and private'

-- ── Subscriptions: no client writes; test mode needed to simulate ───────────
select tests.expect_error(format('insert into public.subscriptions (player_id, status) values (%L, %L)', :lee, 'active'), '42501');
select tests.expect_error('select public.simulate_subscription(''active'')', 'test_mode_off');
select tests.assert(not public.has_pro(), 'no Pro without a subscription');

set app.payments_test_mode = 'on';
select tests.assert((public.simulate_subscription('pending') ->> 'pro')::boolean = false, 'pending payment is not Pro');
select tests.assert((public.simulate_subscription('failed') ->> 'pro')::boolean = false, 'a failed payment is not Pro');
select tests.assert((public.simulate_subscription('active') ->> 'pro')::boolean, 'an active subscription is Pro');
select tests.assert(public.open_lesson('e2000000-0000-4000-8000-000000000001') ? 'content', 'Pro opens Pro lessons');
select public.open_lesson(('e1000000-0000-4000-8000-00000000000' || n)::uuid) from generate_series(1, 7) n;
select tests.assert((public.my_plan() ->> 'lessons_today')::int = 8, 'Pro has no daily lesson limit');
select tests.assert((public.simulate_subscription('cancelled') ->> 'pro')::boolean, 'cancelled keeps Pro until the period ends');
select tests.assert((public.simulate_subscription('expired') ->> 'pro')::boolean = false, 'expired is not Pro');
select tests.expect_error('select public.open_lesson(''e2000000-0000-4000-8000-000000000001'')', 'pro_required');
select tests.assert((select count(*) = 5 and bool_and(test_mode) from public.subscription_events), 'every change is recorded and marked as test mode');
select public.simulate_subscription('free');
select tests.assert((select count(*) = 0 from public.subscriptions), 'back to free');
reset app.payments_test_mode;
\echo '  ✓ Pro states (pending, failed, active, cancelled, expired) behave correctly, in test mode only'

-- ── Courses: board, tier, options on own subjects only ──────────────────────
insert into public.profile_subjects (profile_id, subject_id) values (:lee, :'maths');
update public.profile_subjects set exam_board = 'edexcel', tier = 'higher', confidence = 3 where subject_id = :'maths';
select tests.assert((select exam_board = 'edexcel' and tier = 'higher' from public.profile_subjects where subject_id = :'maths'), 'students set board and tier');
select tests.expect_error(format('update public.profile_subjects set tier = %L', 'extreme'), '23514');
select tests.login(:kim);
update public.profile_subjects set tier = 'foundation';
reset role;
select tests.assert((select tier = 'higher' from public.profile_subjects where profile_id = :lee), 'students can''t change others'' courses');
select tests.login(:kim);
select tests.expect_error(format('update public.profiles set is_content_admin = true where id = %L', :kim), '42501');
\echo '  ✓ students set board, tier and options for their own subjects only'

-- ── Content admin ───────────────────────────────────────────────────────────
select tests.expect_error('select public.admin_update_topic(''e2000000-0000-4000-8000-000000000002'', ''verified'', ''free'', ''lesson'', true)', 'not_admin');
select tests.expect_error('select public.admin_get_lesson(''e1000000-0000-4000-8000-000000000001'')', 'not_admin');
select tests.login(:ada);
select tests.assert((select count(*) = 10 from public.library_topics), 'admins see unpublished topics too');
select tests.assert(public.admin_save_lesson('e2000000-0000-4000-8000-000000000002', '{"summary":"new"}', 'in_review') = 1, 'admins save a draft for review');
select tests.assert((select content_status = 'planned' from public.library_topics where slug = 'planned'), 'a lesson in review doesn''t go live');
select tests.assert(public.admin_save_lesson('e2000000-0000-4000-8000-000000000002', '{"summary":"new v2"}', 'published') = 2, 'publishing bumps the version');
select tests.assert((select content_status = 'lesson' from public.library_topics where slug = 'planned'), 'publishing makes it a lesson');
select public.admin_update_topic('e2000000-0000-4000-8000-000000000002', 'verified', 'pro', 'lesson', true);
select tests.assert((select verification = 'verified' and access = 'pro' from public.library_topics where slug = 'planned'), 'admins change labels and access');
select tests.expect_error('select public.admin_update_topic(''e2000000-0000-4000-8000-000000000002'', ''sort of'', ''pro'', ''lesson'', true)', '23514');
\echo '  ✓ only content admins review, publish and relabel content'
\echo '  ✓ library tests passed'
