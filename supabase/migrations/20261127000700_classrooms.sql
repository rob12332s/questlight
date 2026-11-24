-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0007 · Teacher classrooms
--
-- Teachers (accounts the site owner marks as teachers; never self-selected) create
-- classes with a six-character code. Students join with the code. Teachers see their
-- class's activity, host class-only live games without playing, and everyone in the
-- class sees a weekly class leaderboard.
--
-- Make an account a teacher (site owner, in the SQL editor):
--   update public.profiles set account_type = 'teacher'
--   where id = (select id from auth.users where email = 'teacher@school.example');
-- ════════════════════════════════════════════════════════════════════════════

-- ── Live games: a host who doesn't play ──────────────────────────────────────
-- The host can always see their room, even when they aren't a player in it.
create or replace function public.is_room_member(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_players rp
    where rp.room_id = target_room
      and rp.player_id = (select auth.uid())
      and rp.connection_status <> 'left'
  ) or exists (
    select 1 from public.game_rooms r where r.id = target_room and r.host_id = (select auth.uid())
  );
$$;

create or replace function public.lock_my_room(p_room uuid)
returns public.game_rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  room public.game_rooms%rowtype;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  select * into room from public.game_rooms where id = p_room for update;
  if not found or (room.host_id <> uid and not exists (
    select 1 from public.room_players
    where room_id = p_room and player_id = uid and connection_status <> 'left'
  )) then
    raise exception 'game not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return room;
end;
$$;

create or replace function public.start_game(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  room public.game_rooms%rowtype := public.lock_my_room(p_room);
  players integer;
  picked integer;
begin
  if room.host_id <> auth.uid() then
    raise exception 'only the host can start the game' using errcode = 'P0001', hint = 'not_host';
  end if;
  if room.status <> 'lobby' then
    raise exception 'this game has already started' using errcode = 'P0001', hint = 'already_started';
  end if;
  select count(*) into players from public.room_players where room_id = p_room and connection_status <> 'left';
  -- A playing host needs one other player; a teacher who only hosts needs one student.
  if players < (case when room.host_plays then 2 else 1 end) then
    raise exception 'wait for at least one more player' using errcode = 'P0001', hint = 'need_players';
  end if;

  insert into public.room_question_plan (room_id, round_index, question_id)
  select p_room, (row_number() over (order by random()) - 1)::smallint, id
  from (
    select pool.id from public.game_question_pool(room.subject_id, room.topic_id) as pool(id)
    join public.questions q on q.id = pool.id
    order by (room.difficulty is not null and q.difficulty = room.difficulty) desc, random()
    limit room.question_count
  ) chosen;
  get diagnostics picked = row_count;
  if picked < 3 then
    raise exception 'not enough questions for a live game yet' using errcode = 'P0001', hint = 'not_enough_questions';
  end if;

  update public.game_rooms
  set status = 'in_progress', started_at = now(), question_count = picked, last_activity_at = now()
  where id = p_room;
  perform public.open_game_round(p_room, 0);
end;
$$;

create or replace function public.submit_game_answer(p_room uuid, p_round integer, p_option text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  room public.game_rooms%rowtype := public.lock_my_room(p_room);
  rnd public.room_rounds%rowtype;
  answer_key char(1);
  correct boolean;
  window_ms bigint;
  remaining_ms bigint;
  elapsed_ms bigint;
  points integer := 0;
  everyone boolean;
begin
  if room.status <> 'in_progress' then
    raise exception 'this game is not running' using errcode = 'P0001', hint = 'not_running';
  end if;
  if not exists (
    select 1 from public.room_players where room_id = p_room and player_id = uid and connection_status <> 'left'
  ) then
    raise exception 'you are hosting this game' using errcode = 'P0001', hint = 'not_player';
  end if;
  if p_round is distinct from room.current_round::integer then
    raise exception 'that question has finished' using errcode = 'P0001', hint = 'round_over';
  end if;
  select * into rnd from public.room_rounds where room_id = p_room and round_index = p_round;
  if not found or rnd.closed_at is not null or now() > rnd.deadline_at + interval '1 second' then
    raise exception 'that question has finished' using errcode = 'P0001', hint = 'round_over';
  end if;
  if now() < rnd.started_at then
    raise exception 'the question has not started yet' using errcode = 'P0001', hint = 'not_open';
  end if;
  if p_option is null or not exists (
    select 1 from jsonb_array_elements(rnd.options) o where o ->> 'id' = p_option
  ) then
    raise exception 'choose one of the options' using errcode = 'P0001', hint = 'invalid_answer';
  end if;
  if exists (select 1 from public.game_answers where room_id = p_room and round_index = p_round and player_id = uid) then
    raise exception 'you have already answered' using errcode = 'P0001', hint = 'already_answered';
  end if;

  select a.correct_option into answer_key from public.question_answers a where a.question_id = rnd.question_id;
  correct := answer_key = p_option;

  window_ms := floor(extract(epoch from (rnd.deadline_at - rnd.started_at)) * 1000);
  remaining_ms := least(greatest(floor(extract(epoch from (rnd.deadline_at - now())) * 1000), 0), window_ms);
  elapsed_ms := greatest(floor(extract(epoch from (now() - rnd.started_at)) * 1000), 0);
  if correct then
    points := 100 + floor(50 * remaining_ms / window_ms)::integer; -- SCORING_RULES
  end if;

  insert into public.game_answers (room_id, round_index, player_id, question_id, submitted_option, is_correct, points_awarded, response_ms)
  values (p_room, p_round, uid, rnd.question_id, p_option, correct, points, elapsed_ms);

  update public.room_players
  set score = score + points,
      correct_count = correct_count + case when correct then 1 else 0 end,
      total_correct_ms = total_correct_ms + case when correct then elapsed_ms else 0 end,
      connection_status = 'connected',
      last_seen_at = now()
  where room_id = p_room and player_id = uid;

  update public.room_rounds set answers_received = answers_received + 1
  where room_id = p_room and round_index = p_round;

  everyone := public.everyone_answered(p_room, p_round);
  if everyone then
    perform public.close_game_round(p_room, p_round);
  end if;
  return jsonb_build_object('accepted', true, 'round_closed', everyone);
end;
$$;

create or replace function public.join_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  code text := upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'));
  attempts integer;
  room public.game_rooms%rowtype;
  me public.room_players%rowtype;
  players integer;
  name text;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;

  select count(*) into attempts from public.room_join_attempts
  where player_id = uid and attempted_at > now() - interval '10 minutes';
  if attempts >= 30 then
    return jsonb_build_object('error', 'rate_limited');
  end if;
  insert into public.room_join_attempts (player_id) values (uid);

  if code !~ '^[BCDFGHJKMNPQRSTVWXZ2-9]{6}$' then
    return jsonb_build_object('error', 'invalid_code');
  end if;

  select * into room from public.game_rooms
  where room_code = code and status in ('lobby', 'in_progress') and expires_at > now()
  for update;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  -- A host who doesn't play (a teacher) goes straight back to their room.
  if room.host_id = uid then
    return jsonb_build_object('room_id', room.id);
  end if;

  select * into me from public.room_players where room_id = room.id and player_id = uid;
  if found then
    -- Rejoining (after a dropped connection or leaving by mistake).
    update public.room_players set connection_status = 'connected', last_seen_at = now()
    where room_id = room.id and player_id = uid;
    return jsonb_build_object('room_id', room.id);
  end if;

  if room.status <> 'lobby' then
    return jsonb_build_object('error', 'already_started');
  end if;
  if room.classroom_id is not null and not public.is_classroom_member(room.classroom_id) then
    return jsonb_build_object('error', 'class_only');
  end if;
  select count(*) into players from public.room_players where room_id = room.id and connection_status <> 'left';
  if players >= room.max_players then
    return jsonb_build_object('error', 'full');
  end if;

  select display_name into name from public.profiles where id = uid;
  insert into public.room_players (room_id, player_id, display_name) values (room.id, uid, name);
  update public.game_rooms set last_activity_at = now() where id = room.id;
  return jsonb_build_object('room_id', room.id);
end;
$$;

drop function public.create_room(uuid, uuid, public.difficulty, integer, integer);
create function public.create_room(
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
revoke execute on function public.lock_my_room(uuid) from public, anon, authenticated;

-- ── Classrooms ───────────────────────────────────────────────────────────────
create index if not exists game_rooms_classroom_idx on public.game_rooms (classroom_id) where classroom_id is not null;

create function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select account_type = 'teacher' from public.profiles where id = (select auth.uid())), false);
$$;

create function public.create_classroom(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  active integer;
  new_id uuid;
  code text;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if not public.is_teacher() then
    raise exception 'only teacher accounts can create classes' using errcode = 'P0001', hint = 'not_teacher';
  end if;
  if char_length(clean) < 2 or char_length(clean) > 60 then
    raise exception 'class names are 2 to 60 characters' using errcode = 'check_violation', hint = 'bad_name';
  end if;
  select count(*) into active from public.classrooms where teacher_id = uid and archived_at is null;
  if active >= 30 then
    raise exception 'too many classes' using errcode = 'P0001', hint = 'too_many_classes';
  end if;
  for attempt in 1..10 loop
    code := public.generate_room_code();
    begin
      insert into public.classrooms (teacher_id, name, class_code) values (uid, clean, code) returning id into new_id;
      exit;
    exception when unique_violation then
      code := null;
    end;
  end loop;
  if new_id is null then
    raise exception 'could not create a class code; try again' using errcode = 'P0001', hint = 'try_again';
  end if;
  return jsonb_build_object('classroom_id', new_id, 'class_code', code);
end;
$$;

-- Returns {classroom_id} or {error}; errors are returned (not raised) so the attempt
-- still counts towards the same rate limit as room codes.
create function public.join_classroom(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  code text := upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'));
  attempts integer;
  cls public.classrooms%rowtype;
  members integer;
  name text;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  select count(*) into attempts from public.room_join_attempts
  where player_id = uid and attempted_at > now() - interval '10 minutes';
  if attempts >= 30 then
    return jsonb_build_object('error', 'rate_limited');
  end if;
  insert into public.room_join_attempts (player_id) values (uid);

  if code !~ '^[BCDFGHJKMNPQRSTVWXZ2-9]{6}$' then
    return jsonb_build_object('error', 'invalid_code');
  end if;
  select * into cls from public.classrooms where class_code = code and archived_at is null;
  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;
  if cls.teacher_id = uid
     or exists (select 1 from public.classroom_members where classroom_id = cls.id and student_id = uid) then
    return jsonb_build_object('classroom_id', cls.id);
  end if;
  select count(*) into members from public.classroom_members where classroom_id = cls.id;
  if members >= 200 then
    return jsonb_build_object('error', 'full');
  end if;
  select display_name into name from public.profiles where id = uid;
  insert into public.classroom_members (classroom_id, student_id, display_name) values (cls.id, uid, name)
  on conflict do nothing;
  return jsonb_build_object('classroom_id', cls.id);
end;
$$;

create function public.leave_classroom(p_class uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.classroom_members where classroom_id = p_class and student_id = (select auth.uid());
$$;

-- Teacher-only helper: the class row, locked, or not_found.
create function public.lock_my_class(p_class uuid)
returns public.classrooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  cls public.classrooms%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  select * into cls from public.classrooms where id = p_class and teacher_id = auth.uid() for update;
  if not found then
    raise exception 'class not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return cls;
end;
$$;

create function public.remove_classroom_member(p_class uuid, p_student uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cls public.classrooms%rowtype := public.lock_my_class(p_class);
begin
  delete from public.classroom_members where classroom_id = cls.id and student_id = p_student;
end;
$$;

create function public.reset_class_code(p_class uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  cls public.classrooms%rowtype := public.lock_my_class(p_class);
  code text;
begin
  for attempt in 1..10 loop
    code := public.generate_room_code();
    begin
      update public.classrooms set class_code = code where id = cls.id;
      return code;
    exception when unique_violation then
      code := null;
    end;
  end loop;
  raise exception 'could not create a class code; try again' using errcode = 'P0001', hint = 'try_again';
end;
$$;

-- Archiving keeps the class's history but stops new joins and closes its open lobbies.
create function public.archive_classroom(p_class uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cls public.classrooms%rowtype := public.lock_my_class(p_class);
begin
  update public.classrooms set archived_at = coalesce(archived_at, now()) where id = cls.id;
  update public.game_rooms set status = 'abandoned', last_activity_at = now()
  where classroom_id = cls.id and status = 'lobby';
end;
$$;

-- Teacher view of the class: one row per student, with this week's activity (UK week).
create function public.get_classroom_overview(p_class uuid)
returns table (
  student_id uuid,
  display_name text,
  joined_at timestamptz,
  xp_week integer,
  quizzes_week integer,
  answers_week integer,
  correct_week integer,
  last_active timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  week_start timestamptz := date_trunc('week', now() at time zone 'Europe/London') at time zone 'Europe/London';
begin
  if not public.is_classroom_teacher(p_class) then
    raise exception 'class not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return query
  select m.student_id,
         p.display_name,
         m.joined_at,
         coalesce((select sum(x.amount)::integer from public.xp_events x where x.player_id = m.student_id and x.created_at >= week_start), 0),
         (select count(*)::integer from public.quiz_sessions s where s.player_id = m.student_id and s.status = 'completed' and s.completed_at >= week_start),
         (select count(*)::integer from public.quiz_attempts a where a.player_id = m.student_id and a.created_at >= week_start),
         (select count(*)::integer from public.quiz_attempts a where a.player_id = m.student_id and a.created_at >= week_start and a.is_correct),
         greatest(
           (select max(x.created_at) from public.xp_events x where x.player_id = m.student_id),
           (select max(a.created_at) from public.quiz_attempts a where a.player_id = m.student_id)
         )
  from public.classroom_members m
  join public.profiles p on p.id = m.student_id
  where m.classroom_id = p_class
  order by lower(p.display_name);
end;
$$;

-- Weekly class leaderboard, for the teacher and the class's students. Classmates see
-- each other here (students are told this when they join a class). Names that fail
-- the filter are shown as "Student".
create function public.get_class_leaderboard(p_class uuid)
returns table (place integer, display_name text, points integer, is_me boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  week_start timestamptz := date_trunc('week', now() at time zone 'Europe/London') at time zone 'Europe/London';
begin
  if not (public.is_classroom_teacher(p_class) or public.is_classroom_member(p_class)) then
    raise exception 'class not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return query
  with scored as (
    select m.student_id,
           case when public.is_acceptable_display_name(p.display_name) then p.display_name else 'Student' end as name,
           coalesce((select sum(x.amount)::integer from public.xp_events x
                     where x.player_id = m.student_id and x.created_at >= week_start), 0) as pts
    from public.classroom_members m
    join public.profiles p on p.id = m.student_id
    where m.classroom_id = p_class
  )
  select rank() over (order by s.pts desc)::integer, s.name, s.pts, s.student_id = uid
  from scored s
  where s.pts > 0 or s.student_id = uid
  order by 1, 2;
end;
$$;

-- Open class games, so students can join from the class page.
create function public.get_class_games(p_class uuid)
returns table (room_id uuid, room_code text, status public.room_status, title text, joined boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not (public.is_classroom_teacher(p_class) or public.is_classroom_member(p_class)) then
    raise exception 'class not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return query
  select r.id, r.room_code, r.status, coalesce(t.name, s.name),
         exists (select 1 from public.room_players rp where rp.room_id = r.id and rp.player_id = auth.uid() and rp.connection_status <> 'left')
           or r.host_id = auth.uid()
  from public.game_rooms r
  join public.subjects s on s.id = r.subject_id
  left join public.topics t on t.id = r.topic_id
  where r.classroom_id = p_class and r.status in ('lobby', 'in_progress') and r.expires_at > now()
  order by r.created_at desc;
end;
$$;

-- ── Privileges ───────────────────────────────────────────────────────────────
revoke execute on function public.lock_my_class(uuid) from public, anon, authenticated;
revoke execute on function public.is_teacher() from public, anon;
revoke execute on function public.create_classroom(text) from public, anon;
revoke execute on function public.join_classroom(text) from public, anon;
revoke execute on function public.leave_classroom(uuid) from public, anon;
revoke execute on function public.remove_classroom_member(uuid, uuid) from public, anon;
revoke execute on function public.reset_class_code(uuid) from public, anon;
revoke execute on function public.archive_classroom(uuid) from public, anon;
revoke execute on function public.get_classroom_overview(uuid) from public, anon;
revoke execute on function public.get_class_leaderboard(uuid) from public, anon;
revoke execute on function public.get_class_games(uuid) from public, anon;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.create_classroom(text) to authenticated;
grant execute on function public.join_classroom(text) to authenticated;
grant execute on function public.leave_classroom(uuid) to authenticated;
grant execute on function public.remove_classroom_member(uuid, uuid) to authenticated;
grant execute on function public.reset_class_code(uuid) to authenticated;
grant execute on function public.archive_classroom(uuid) to authenticated;
grant execute on function public.get_classroom_overview(uuid) to authenticated;
grant execute on function public.get_class_leaderboard(uuid) to authenticated;
grant execute on function public.get_class_games(uuid) to authenticated;
