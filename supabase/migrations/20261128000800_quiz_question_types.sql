-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0008 · Choose question types in a quiz
--
-- start_quiz gains p_types: NULL (or empty) means any type; otherwise only the listed
-- types (multiple choice, true/false, short answer) are used. Everything else about
-- the function is unchanged.
-- ════════════════════════════════════════════════════════════════════════════

drop function public.start_quiz(uuid, public.difficulty, integer, uuid);

create function public.start_quiz(
  p_topic uuid,
  p_difficulty public.difficulty default null,
  p_count integer default 10,
  p_subtopic uuid default null,
  p_types public.question_type[] default null
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
      and (p_types is null or cardinality(p_types) = 0 or q.question_type = any (p_types))
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

revoke execute on function public.start_quiz(uuid, public.difficulty, integer, uuid, public.question_type[]) from public, anon;
grant execute on function public.start_quiz(uuid, public.difficulty, integer, uuid, public.question_type[]) to authenticated;
