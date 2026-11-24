-- ════════════════════════════════════════════════════════════════════════════
-- AI study allowances: every claim counts, limits per type, no way to give allowance back.
-- ════════════════════════════════════════════════════════════════════════════
\set QUIET on
\o /dev/null

\set amy '\'00000000-0000-4000-8000-00000000b001\''
\set ben '\'00000000-0000-4000-8000-00000000b002\''
insert into auth.users (id, email, raw_user_meta_data) values
  (:amy, 'amy@example.test', '{"display_name":"Amy"}'),
  (:ben, 'ben@example.test', '{"display_name":"Ben"}');

select tests.login_anon();
select tests.expect_error('select public.claim_ai_request(''explanation'')', '42501');

select tests.login(:amy);
select tests.expect_error('select public.claim_ai_request(''poems'')', '23514');
select tests.expect_error('select public.claim_ai_request(''questions'', 11)', '23514');

-- Questions: 30 a day, counted by number of questions.
select tests.assert((public.claim_ai_request('questions', 10) ->> 'ok')::boolean, 'first 10 questions');
select tests.assert((public.claim_ai_request('questions', 10) ->> 'ok')::boolean, 'next 10 questions');
select tests.assert((public.claim_ai_request('questions', 10) ->> 'ok')::boolean, 'reaches 30');
select tests.assert(public.claim_ai_request('questions', 1) ->> 'reason' = 'limit', 'question 31 is refused');
\echo '  ✓ practice questions are limited to 30 a day'

-- Flashcards: 5 requests a day. Marking a request failed doesn't give it back.
select (public.claim_ai_request('flashcards', 10) ->> 'log_id') as log1 \gset
select public.finish_ai_request(:'log1', 'failed', 0);
select public.claim_ai_request('flashcards', 10) from generate_series(1, 4);
select tests.assert(public.claim_ai_request('flashcards', 10) ->> 'reason' = 'limit', 'the sixth flashcard request is refused');
select tests.assert(
  (select status = 'failed' and (usage_metadata ->> 'delivered')::int = 0 from public.ai_generation_logs where id = :'log1'),
  'finishing records the outcome');
\echo '  ✓ flashcard requests are limited, and failed requests still count'

select tests.assert((public.ai_usage() ->> 'questions')::int = 30 and (public.ai_usage() ->> 'flashcards')::int = 5, 'usage is reported');

-- Limits are per student.
select tests.login(:ben);
select tests.assert((public.claim_ai_request('questions', 10) ->> 'ok')::boolean, 'another student has their own allowance');
select public.finish_ai_request(:'log1', 'success', 50);
select tests.login(:amy);
select tests.assert((select status = 'failed' from public.ai_generation_logs where id = :'log1'), 'students cannot change each other''s records');

-- A day later the allowance is back.
reset role;
update public.ai_generation_logs set created_at = now() - interval '25 hours' where player_id = :amy;
select tests.login(:amy);
select tests.assert((public.claim_ai_request('questions', 10) ->> 'ok')::boolean, 'the allowance renews after 24 hours');

select tests.expect_error(format('insert into public.ai_generation_logs (player_id, request_type, status) values (%L, %L, %L)', :amy, 'questions', 'success'), '42501');
select tests.expect_error(format('delete from public.ai_generation_logs where player_id = %L', :amy), '42501');
\echo '  ✓ allowances are per student, renew daily, and can''t be edited directly'
\echo '  ✓ AI study tests passed'
