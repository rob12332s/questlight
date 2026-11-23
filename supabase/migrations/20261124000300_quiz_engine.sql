-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0003 · Solo quiz engine, XP awards and achievements
--
-- Every write here happens inside SECURITY DEFINER functions that read auth.uid().
-- Students can call them, but cannot write the underlying tables directly.
-- The XP rules mirror src/domain/progression.ts (calculateSoloQuizXp); the parity is
-- checked by tests/db/quiz.test.sql.
-- ════════════════════════════════════════════════════════════════════════════

-- A quiz may mix difficulties; NULL means "mixed".
alter table public.quiz_sessions alter column difficulty drop not null;
alter table public.quiz_sessions add column subtopic_id uuid references public.subtopics (id) on delete set null;

-- Answer normalisation for short answers. Mirrors normalizeAnswerText() in
-- src/domain/answers.ts: case, quote marks, repeated spaces and trailing sentence
-- punctuation are ignored.
create function public.normalize_answer(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
           regexp_replace(
             regexp_replace(lower(btrim(coalesce(t, ''))), '[“”"''‘’`]', '', 'g'),
             '\s+', ' ', 'g'),
           '[\s.,;:]+$', '');
$$;

-- Grant an achievement once; pays its XP once (idempotent via the XP ledger).
create function public.award_achievement(p_player uuid, p_achievement text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reward integer;
  inserted integer;
begin
  insert into public.user_achievements (player_id, achievement_id)
  select p_player, a.id from public.achievements a where a.id = p_achievement and a.is_active
  on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then
    return false;
  end if;
  select xp_reward into reward from public.achievements where id = p_achievement;
  if coalesce(reward, 0) > 0 then
    insert into public.xp_events (player_id, source, source_id, amount)
    values (p_player, 'achievement', p_achievement, reward)
    on conflict do nothing;
  end if;
  return true;
end;
$$;

-- Learning streak in days (UK calendar): consecutive days ending today or yesterday on
-- which the student finished a quiz or rated a flashcard. Mirrors currentStreak().
create function public.learning_streak(p_player uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with days as (
    select distinct (completed_at at time zone 'Europe/London')::date as d
    from public.quiz_sessions where player_id = p_player and status = 'completed'
    union
    select distinct (reviewed_at at time zone 'Europe/London')::date
    from public.flashcard_reviews where owner_id = p_player
  ),
  today as (select (now() at time zone 'Europe/London')::date as t),
  anchor as (
    select case
      when exists (select 1 from days, today where d = t) then (select t from today)
      when exists (select 1 from days, today where d = t - 1) then (select t - 1 from today)
    end as a
  )
  select coalesce((
    select count(*)::int from (
      select d, row_number() over (order by d desc) as rn from days, anchor where d <= anchor.a
    ) ranked, anchor
    where ranked.d = anchor.a - (ranked.rn - 1)::int
  ), 0);
$$;

-- Flashcard achievements, checked after a student builds a deck or rates cards.
create function public.check_flashcard_achievements()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  earned text[] := '{}';
  streak integer;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if exists (
    select 1 from public.flashcards f where f.owner_id = uid group by f.deck_id having count(*) >= 10
  ) and public.award_achievement(uid, 'deck_builder') then
    earned := array_append(earned, 'deck_builder');
  end if;
  if (select count(*) from public.flashcard_reviews where owner_id = uid and last_rating = 'confident') >= 50
     and public.award_achievement(uid, 'steady_recall') then
    earned := array_append(earned, 'steady_recall');
  end if;
  streak := public.learning_streak(uid);
  if streak >= 3 and public.award_achievement(uid, 'streak_3') then earned := array_append(earned, 'streak_3'); end if;
  if streak >= 7 and public.award_achievement(uid, 'streak_7') then earned := array_append(earned, 'streak_7'); end if;
  return earned;
end;
$$;

-- ── start_quiz ───────────────────────────────────────────────────────────────
-- Picks published questions for a topic (optionally a subtopic and difficulty),
-- preferring the requested difficulty and topping up from others if needed.
create function public.start_quiz(
  p_topic uuid,
  p_difficulty public.difficulty default null,
  p_count integer default 10,
  p_subtopic uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  picked uuid[];
  session_id uuid;
  recent integer;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if p_count is null or p_count < 3 or p_count > 20 then
    raise exception 'quiz length must be between 3 and 20' using errcode = 'check_violation';
  end if;

  -- Basic abuse protection: at most 40 quizzes started per hour.
  select count(*) into recent from public.quiz_sessions
  where player_id = uid and started_at > now() - interval '1 hour';
  if recent >= 40 then
    raise exception 'too many quizzes started; try again later' using errcode = 'P0001', hint = 'rate_limited';
  end if;

  select array_agg(id) into picked from (
    select q.id
    from public.questions q
    where q.topic_id = p_topic
      and q.is_published
      and (p_subtopic is null or q.subtopic_id = p_subtopic)
    order by (p_difficulty is not null and q.difficulty = p_difficulty) desc, random()
    limit p_count
  ) chosen;

  if picked is null or cardinality(picked) < 3 then
    raise exception 'not enough questions for this topic yet' using errcode = 'P0001', hint = 'not_enough_questions';
  end if;

  -- Shuffle the final order so preferred-difficulty questions aren't always first.
  select array_agg(x order by random()) into picked from unnest(picked) as x;

  insert into public.quiz_sessions (player_id, topic_id, subtopic_id, difficulty, question_ids)
  values (uid, p_topic, p_subtopic, p_difficulty, picked)
  returning id into session_id;
  return session_id;
end;
$$;

-- ── submit_quiz_answer ───────────────────────────────────────────────────────
-- Checks one answer on the server and only then reveals the answer and explanation.
create function public.submit_quiz_answer(p_session uuid, p_question uuid, p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  s public.quiz_sessions%rowtype;
  q public.questions%rowtype;
  a public.question_answers%rowtype;
  submitted text := btrim(coalesce(p_answer, ''));
  correct boolean;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;

  -- Lock the session so two rapid submissions can't race each other.
  select * into s from public.quiz_sessions where id = p_session for update;
  if not found or s.player_id <> uid then
    raise exception 'quiz not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if s.status <> 'in_progress' then
    raise exception 'this quiz has finished' using errcode = 'P0001', hint = 'finished';
  end if;
  if not (p_question = any (s.question_ids)) then
    raise exception 'question is not part of this quiz' using errcode = 'P0001', hint = 'not_in_quiz';
  end if;
  if exists (select 1 from public.quiz_attempts where session_id = p_session and question_id = p_question) then
    raise exception 'already answered' using errcode = 'P0001', hint = 'already_answered';
  end if;
  if char_length(submitted) = 0 or char_length(submitted) > 200 then
    raise exception 'answer is empty or too long' using errcode = 'P0001', hint = 'invalid_answer';
  end if;

  select * into q from public.questions where id = p_question;
  select * into a from public.question_answers where question_id = p_question;
  if a.question_id is null then
    raise exception 'question has no answer key' using errcode = 'P0001', hint = 'not_found';
  end if;

  if q.question_type = 'short_answer' then
    correct := public.normalize_answer(submitted) = any (
      select public.normalize_answer(x) from unnest(a.accepted_answers) as x
    );
  else
    submitted := upper(submitted);
    if not exists (select 1 from jsonb_array_elements(q.options) o where o ->> 'id' = submitted) then
      raise exception 'not one of the options' using errcode = 'P0001', hint = 'invalid_answer';
    end if;
    correct := submitted = a.correct_option;
  end if;

  insert into public.quiz_attempts (session_id, player_id, question_id, submitted_answer, is_correct)
  values (p_session, uid, p_question, submitted, correct);

  if correct then
    update public.quiz_sessions set correct_count = correct_count + 1 where id = p_session;
  end if;

  return jsonb_build_object(
    'is_correct', correct,
    'correct_option', a.correct_option,
    'accepted_answer', a.accepted_answers[1],
    'explanation', a.explanation,
    'wrong_option_notes', a.wrong_option_notes
  );
end;
$$;

-- ── complete_quiz ────────────────────────────────────────────────────────────
-- Finishes a quiz, updates topic progress, and awards XP exactly once.
create function public.complete_quiz(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  s public.quiz_sessions%rowtype;
  answered integer;
  correct integer;
  fresh integer;
  rewardable_correct integer;
  accuracy numeric;
  qualifies boolean;
  prev_best numeric;
  xp_correct integer;
  xp_completion integer;
  xp_perfect integer;
  xp_best integer;
  earned_today integer;
  uncapped integer;
  awarded integer;
  total_correct_ever integer;
  new_achievements text[] := '{}';
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;

  select * into s from public.quiz_sessions where id = p_session for update;
  if not found or s.player_id <> uid then
    raise exception 'quiz not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if s.status <> 'in_progress' then
    raise exception 'this quiz has already finished' using errcode = 'P0001', hint = 'finished';
  end if;

  select count(*), count(*) filter (where is_correct) into answered, correct
  from public.quiz_attempts where session_id = p_session;
  if answered = 0 then
    raise exception 'answer at least one question first' using errcode = 'P0001', hint = 'nothing_answered';
  end if;

  -- A question is "already rewarded today" if it was answered correctly in another
  -- quiz in the last 24 hours. Replaying the same questions earns nothing extra.
  with attempts as (
    select qa.question_id, qa.is_correct,
      exists (
        select 1 from public.quiz_attempts other
        where other.player_id = uid
          and other.question_id = qa.question_id
          and other.session_id <> p_session
          and other.is_correct
          and other.created_at > now() - interval '24 hours'
      ) as rewarded_today
    from public.quiz_attempts qa
    where qa.session_id = p_session
  )
  select count(*) filter (where not rewarded_today),
         count(*) filter (where is_correct and not rewarded_today)
  into fresh, rewardable_correct
  from attempts;

  accuracy := correct::numeric / answered;
  qualifies := answered >= 5 and fresh > 0;
  select best_accuracy into prev_best from public.user_progress where player_id = uid and topic_id = s.topic_id;

  xp_correct := rewardable_correct * 10;
  xp_completion := case when qualifies then 20 else 0 end;
  xp_perfect := case when qualifies and accuracy = 1 then 25 else 0 end;
  xp_best := case when qualifies and prev_best is not null and accuracy > prev_best then 15 else 0 end;
  uncapped := xp_correct + xp_completion + xp_perfect + xp_best;

  select coalesce(sum(amount), 0) into earned_today from public.xp_events
  where player_id = uid and source = 'solo_quiz' and created_at > now() - interval '24 hours';
  awarded := least(uncapped, greatest(0, 600 - earned_today));

  if awarded > 0 then
    insert into public.xp_events (player_id, source, source_id, amount)
    values (uid, 'solo_quiz', p_session::text, awarded)
    on conflict do nothing;
  end if;

  -- Measured progress for the topic. Best accuracy only counts quizzes of 5+ answers.
  if s.topic_id is not null then
    insert into public.user_progress (player_id, topic_id, questions_attempted, correct_answers, best_accuracy, mastery, last_practised_at)
    values (uid, s.topic_id, answered, correct, case when answered >= 5 then round(accuracy, 3) end, 0, now())
    on conflict (player_id, topic_id) do update set
      questions_attempted = public.user_progress.questions_attempted + excluded.questions_attempted,
      correct_answers = public.user_progress.correct_answers + excluded.correct_answers,
      best_accuracy = case
        when excluded.best_accuracy is null then public.user_progress.best_accuracy
        else greatest(coalesce(public.user_progress.best_accuracy, 0), excluded.best_accuracy)
      end,
      last_practised_at = now(),
      updated_at = now();

    -- Mastery: accuracy over the most recent 20 answers on this topic.
    update public.user_progress up set mastery = coalesce((
      select round(avg(case when r.is_correct then 1 else 0 end)::numeric, 3)
      from (
        select qa.is_correct from public.quiz_attempts qa
        join public.quiz_sessions qs on qs.id = qa.session_id
        where qa.player_id = uid and qs.topic_id = s.topic_id
        order by qa.created_at desc
        limit 20
      ) r
    ), 0)
    where up.player_id = uid and up.topic_id = s.topic_id;
  end if;

  update public.quiz_sessions
  set status = 'completed', completed_at = now(), xp_awarded = awarded
  where id = p_session;

  -- Achievements
  if public.award_achievement(uid, 'first_quiz') then new_achievements := array_append(new_achievements, 'first_quiz'); end if;
  if answered >= 5 and accuracy = 1 and public.award_achievement(uid, 'perfect_quiz') then
    new_achievements := array_append(new_achievements, 'perfect_quiz');
  end if;
  select count(*) into total_correct_ever from public.quiz_attempts where player_id = uid and is_correct;
  if total_correct_ever >= 100 and public.award_achievement(uid, 'century') then
    new_achievements := array_append(new_achievements, 'century');
  end if;
  if public.learning_streak(uid) >= 3 and public.award_achievement(uid, 'streak_3') then
    new_achievements := array_append(new_achievements, 'streak_3');
  end if;
  if public.learning_streak(uid) >= 7 and public.award_achievement(uid, 'streak_7') then
    new_achievements := array_append(new_achievements, 'streak_7');
  end if;
  if prev_best is not null and prev_best < 0.6 and answered >= 5 and accuracy >= 0.8
     and public.award_achievement(uid, 'comeback') then
    new_achievements := array_append(new_achievements, 'comeback');
  end if;

  return jsonb_build_object(
    'answered', answered,
    'correct', correct,
    'total_questions', cardinality(s.question_ids),
    'accuracy', round(accuracy, 3),
    'previous_best', prev_best,
    'xp', jsonb_build_object(
      'correct_answers', xp_correct,
      'completion', xp_completion,
      'perfect', xp_perfect,
      'personal_best', xp_best,
      'capped', uncapped - awarded,
      'total', awarded
    ),
    'new_achievements', to_jsonb(new_achievements)
  );
end;
$$;

-- ── get_quiz_review ──────────────────────────────────────────────────────────
-- After a quiz is finished, returns each question with the student's answer, the
-- correct answer and the explanation. Never available while the quiz is running.
create function public.get_quiz_review(p_session uuid)
returns table (
  question_id uuid,
  submitted_answer text,
  is_correct boolean,
  correct_option char(1),
  accepted_answer text,
  explanation text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.quiz_sessions%rowtype;
begin
  select * into s from public.quiz_sessions where id = p_session;
  if not found or s.player_id <> auth.uid() then
    raise exception 'quiz not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if s.status <> 'completed' then
    raise exception 'finish the quiz to see the review' using errcode = 'P0001', hint = 'not_finished';
  end if;
  return query
    select q.qid, qa.submitted_answer, qa.is_correct, a.correct_option, a.accepted_answers[1], a.explanation
    from unnest(s.question_ids) with ordinality as q(qid, pos)
    join public.question_answers a on a.question_id = q.qid
    left join public.quiz_attempts qa on qa.session_id = p_session and qa.question_id = q.qid
    order by q.pos;
end;
$$;

-- ── Privileges ───────────────────────────────────────────────────────────────
revoke execute on function public.award_achievement(uuid, text) from public, anon, authenticated;
revoke execute on function public.learning_streak(uuid) from public, anon, authenticated;
revoke execute on function public.check_flashcard_achievements() from public, anon;
grant execute on function public.check_flashcard_achievements() to authenticated;
revoke execute on function public.start_quiz(uuid, public.difficulty, integer, uuid) from public, anon;
revoke execute on function public.submit_quiz_answer(uuid, uuid, text) from public, anon;
revoke execute on function public.complete_quiz(uuid) from public, anon;
grant execute on function public.start_quiz(uuid, public.difficulty, integer, uuid) to authenticated;
grant execute on function public.submit_quiz_answer(uuid, uuid, text) to authenticated;
grant execute on function public.complete_quiz(uuid) to authenticated;
revoke execute on function public.get_quiz_review(uuid) from public, anon;
grant execute on function public.get_quiz_review(uuid) to authenticated;
grant execute on function public.normalize_answer(text) to authenticated;
