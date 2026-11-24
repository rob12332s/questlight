-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0013 · Topic challenges and mixed GCSE challenges
--
-- Live games could already cover one topic or a whole subject. A room with no subject
-- is now a mixed GCSE challenge drawing questions from every subject. Everything else
-- about rooms (server-side scoring, timing, rate limits) is unchanged.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.game_rooms alter column subject_id drop not null;

create or replace function public.game_question_pool(p_subject uuid, p_topic uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select q.id
  from public.questions q
  join public.topics t on t.id = q.topic_id
  where q.is_published
    and q.question_type in ('multiple_choice', 'true_false')
    and (p_subject is null or t.subject_id = p_subject)
    and (p_topic is null or q.topic_id = p_topic);
$$;
revoke execute on function public.game_question_pool(uuid, uuid) from public, anon, authenticated;

create or replace function public.create_room(
  p_subject uuid,
  p_topic uuid default null,
  p_difficulty public.difficulty default null,
  p_count integer default 10,
  p_seconds integer default 20,
  p_classroom uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  name text;
  available integer;
  recent integer;
  new_id uuid;
  code text;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if p_count is null or p_count < 3 or p_count > 20 then
    raise exception 'game length must be between 3 and 20' using errcode = 'check_violation';
  end if;
  if p_seconds is null or p_seconds < 10 or p_seconds > 60 then
    raise exception 'time per question must be between 10 and 60 seconds' using errcode = 'check_violation';
  end if;
  if p_classroom is not null and not exists (
    select 1 from public.classrooms where id = p_classroom and teacher_id = uid and archived_at is null
  ) then
    raise exception 'only the class teacher can host a class game' using errcode = 'P0001', hint = 'not_teacher';
  end if;
  -- No subject means a mixed GCSE challenge across every subject (and then no topic).
  if p_subject is null and p_topic is not null then
    raise exception 'choose a subject for a topic game' using errcode = 'check_violation';
  end if;
  if p_subject is not null and not exists (select 1 from public.subjects where id = p_subject) then
    raise exception 'subject not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if p_topic is not null and not exists (select 1 from public.topics where id = p_topic and subject_id = p_subject) then
    raise exception 'topic not found' using errcode = 'P0001', hint = 'not_found';
  end if;

  select count(*) into recent from public.game_rooms where host_id = uid and created_at > now() - interval '1 hour';
  if recent >= 15 then
    raise exception 'too many games created; try again later' using errcode = 'P0001', hint = 'rate_limited';
  end if;

  select count(*) into available from public.game_question_pool(p_subject, p_topic);
  if available < 3 then
    raise exception 'not enough questions for a live game yet' using errcode = 'P0001', hint = 'not_enough_questions';
  end if;

  select display_name into name from public.profiles where id = uid;

  -- Tidy up: rooms past their expiry stop holding their codes.
  update public.game_rooms set status = 'expired'
  where status in ('lobby', 'in_progress') and expires_at < now();

  -- One open lobby per host: an older lobby they still host is closed.
  update public.game_rooms set status = 'abandoned', last_activity_at = now()
  where host_id = uid and status = 'lobby';

  for attempt in 1..10 loop
    code := public.generate_room_code();
    begin
      -- In a class game the teacher hosts without playing.
      insert into public.game_rooms (room_code, host_id, classroom_id, host_plays, subject_id, topic_id, difficulty, question_count, max_players, seconds_per_question)
      values (code, uid, p_classroom, p_classroom is null, p_subject, p_topic, p_difficulty, least(p_count, available), 40, p_seconds)
      returning id into new_id;
      exit;
    exception when unique_violation then
      code := null;
    end;
  end loop;
  if new_id is null then
    raise exception 'could not create a room code; try again' using errcode = 'P0001', hint = 'try_again';
  end if;

  if p_classroom is null then
    insert into public.room_players (room_id, player_id, display_name) values (new_id, uid, name);
  end if;
  return jsonb_build_object('room_id', new_id, 'room_code', code);
end;
$$;

revoke execute on function public.create_room(uuid, uuid, public.difficulty, integer, integer, uuid) from public, anon;
grant execute on function public.create_room(uuid, uuid, public.difficulty, integer, integer, uuid) to authenticated;
