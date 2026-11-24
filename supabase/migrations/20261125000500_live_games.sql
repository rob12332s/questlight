-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0005 · Live games
--
-- Private rooms joined with a six-character code. Everyone gets the same question at
-- the same time; the server decides timing, correctness and scores.
--
-- How a game runs:
--   create_room → join_room (others) → start_game (host)
--   each round: submit_game_answer → close_round (when time is up or everyone answered)
--               → next_round (host; anyone after a pause, so a lost host can't stall it)
--   closing the last round finishes the game and awards XP and achievements.
--
-- Clients read rooms, players and rounds through RLS (members only) and Realtime.
-- A round's answer and explanation stay NULL until the round is closed. The question
-- order (room_question_plan) and answer keys are never readable by clients.
-- Scoring mirrors src/domain/scoring.ts; XP mirrors XP_RULES in src/domain/progression.ts.
-- ════════════════════════════════════════════════════════════════════════════

-- A game may mix difficulties; NULL means "mixed".
alter table public.game_rooms alter column difficulty drop not null;

-- Join attempts, kept for rate limiting so room codes can't be guessed by brute force.
create table public.room_join_attempts (
  player_id uuid not null references public.profiles (id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index room_join_attempts_player_idx on public.room_join_attempts (player_id, attempted_at desc);
alter table public.room_join_attempts enable row level security;
revoke all on public.room_join_attempts from public, anon, authenticated;

-- Answers per round are counted often; this keeps it cheap.
create index if not exists game_answers_round_idx on public.game_answers (room_id, round_index);

-- How many players have answered the open round, so everyone sees "3 of 5 answered"
-- (through Realtime) without seeing anyone's answer. Written only by the server.
alter table public.room_rounds add column answers_received smallint not null default 0 check (answers_received >= 0);

-- ── Helpers (internal) ───────────────────────────────────────────────────────

-- Six characters from the room-code alphabet (no vowels, no 0/1/O/I/L/Y), drawn from
-- gen_random_uuid()'s random bytes. Bytes 0–5 of a v4 UUID are fully random.
create function public.generate_room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'BCDFGHJKMNPQRSTVWXZ23456789';
  bytes bytea := uuid_send(gen_random_uuid());
  code text := '';
begin
  for i in 0..5 loop
    code := code || substr(alphabet, 1 + (get_byte(bytes, i) % 27), 1);
  end loop;
  return code;
end;
$$;

-- Option-based published questions a game can use.
create function public.game_question_pool(p_subject uuid, p_topic uuid)
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
    and t.subject_id = p_subject
    and (p_topic is null or q.topic_id = p_topic);
$$;

-- Opens round p_round: copies the question (never the answer) into room_rounds.
-- A 3-second countdown comes first, so everyone starts together.
create function public.open_game_round(p_room uuid, p_round integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.room_rounds (room_id, round_index, question_id, question_text, options, started_at, deadline_at)
  select p_room, p_round, q.id, q.question_text, q.options,
         now() + interval '3 seconds',
         now() + interval '3 seconds' + make_interval(secs => r.seconds_per_question)
  from public.room_question_plan p
  join public.questions q on q.id = p.question_id
  join public.game_rooms r on r.id = p.room_id
  where p.room_id = p_room and p.round_index = p_round;
  update public.game_rooms set current_round = p_round, last_activity_at = now() where id = p_room;
end;
$$;

-- Ends the game: ranks players, then pays XP and achievements once (idempotent ledger).
-- Ranking matches rankPlayers(): score, then correct answers, then total answer time.
create function public.finish_game(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  player_count integer;
  games_today integer;
  amount integer;
begin
  update public.game_rooms set status = 'finished', finished_at = now(), last_activity_at = now() where id = p_room;

  select count(*) into player_count from public.room_players where room_id = p_room and connection_status <> 'left';

  for r in
    select rp.player_id, rp.score,
           rank() over (order by rp.score desc, rp.correct_count desc, rp.total_correct_ms asc) as place,
           exists (select 1 from public.game_answers ga where ga.room_id = p_room and ga.player_id = rp.player_id) as took_part
    from public.room_players rp
    where rp.room_id = p_room and rp.connection_status <> 'left'
  loop
    continue when not r.took_part;

    -- At most 10 rewarded games per UK day, to blunt farming with friends.
    select count(*) into games_today from public.xp_events
    where player_id = r.player_id and source = 'multiplayer_game'
      and (created_at at time zone 'Europe/London')::date = (now() at time zone 'Europe/London')::date;

    if games_today < 10 then
      amount := 20; -- XP_RULES.multiplayerGameCompleted
      if player_count >= 2 and r.score > 0 then
        amount := amount + case r.place when 1 then 30 when 2 then 20 when 3 then 10 else 0 end; -- multiplayerPodium
      end if;
      insert into public.xp_events (player_id, source, source_id, amount)
      values (r.player_id, 'multiplayer_game', p_room::text, amount)
      on conflict do nothing;
    end if;

    perform public.award_achievement(r.player_id, 'first_battle');
    if r.place = 1 and player_count >= 2 and r.score > 0 then
      perform public.award_achievement(r.player_id, 'battle_winner');
    end if;
  end loop;
end;
$$;

-- Closes a round: reveals the answer and explanation. Finishes the game after the last.
create function public.close_game_round(p_room uuid, p_round integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
  last_round integer;
begin
  update public.room_rounds rr
  set closed_at = now(), correct_option = a.correct_option, explanation = a.explanation
  from public.question_answers a
  where rr.room_id = p_room and rr.round_index = p_round and rr.closed_at is null
    and a.question_id = rr.question_id;
  get diagnostics changed = row_count;
  if changed = 0 then
    return;
  end if;
  update public.game_rooms set last_activity_at = now() where id = p_room;
  select question_count - 1 into last_round from public.game_rooms where id = p_room;
  if p_round >= last_round then
    perform public.finish_game(p_room);
  end if;
end;
$$;

-- True when every player still in the room has answered the round.
create function public.everyone_answered(p_room uuid, p_round integer)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.room_players rp
    where rp.room_id = p_room and rp.connection_status <> 'left'
      and not exists (
        select 1 from public.game_answers ga
        where ga.room_id = p_room and ga.round_index = p_round and ga.player_id = rp.player_id
      )
  );
$$;

-- Locks a room the caller belongs to (and hasn't left), or raises not_found.
create function public.lock_my_room(p_room uuid)
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
  if not found or not exists (
    select 1 from public.room_players
    where room_id = p_room and player_id = uid and connection_status <> 'left'
  ) then
    raise exception 'game not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  return room;
end;
$$;

-- ── create_room ──────────────────────────────────────────────────────────────
create function public.create_room(
  p_subject uuid,
  p_topic uuid default null,
  p_difficulty public.difficulty default null,
  p_count integer default 10,
  p_seconds integer default 20
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
      insert into public.game_rooms (room_code, host_id, subject_id, topic_id, difficulty, question_count, max_players, seconds_per_question)
      values (code, uid, p_subject, p_topic, p_difficulty, least(p_count, available), 40, p_seconds)
      returning id into new_id;
      exit;
    exception when unique_violation then
      code := null;
    end;
  end loop;
  if new_id is null then
    raise exception 'could not create a room code; try again' using errcode = 'P0001', hint = 'try_again';
  end if;

  insert into public.room_players (room_id, player_id, display_name) values (new_id, uid, name);
  return jsonb_build_object('room_id', new_id, 'room_code', code);
end;
$$;

-- ── join_room ────────────────────────────────────────────────────────────────
-- Returns {room_id} or {error}. Errors are returned, not raised, so the attempt is
-- still recorded for rate limiting.
create function public.join_room(p_code text)
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

-- ── leave_room ───────────────────────────────────────────────────────────────
-- A host leaving the lobby closes the room. Mid-game, the game carries on.
create function public.leave_room(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  room public.game_rooms%rowtype := public.lock_my_room(p_room);
begin
  update public.room_players set connection_status = 'left', last_seen_at = now()
  where room_id = p_room and player_id = auth.uid();
  if room.status = 'lobby' and room.host_id = auth.uid() then
    update public.game_rooms set status = 'abandoned', last_activity_at = now() where id = p_room;
  elsif room.status = 'in_progress' and room.current_round >= 0
        and public.everyone_answered(p_room, room.current_round) then
    -- They may have been the last one the round was waiting for.
    perform public.close_game_round(p_room, room.current_round);
  end if;
end;
$$;

-- ── start_game ───────────────────────────────────────────────────────────────
create function public.start_game(p_room uuid)
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
  if players < 2 then
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

-- ── submit_game_answer ───────────────────────────────────────────────────────
-- Accepts one answer per player per round. Correctness is not returned: everyone sees
-- the answer together when the round closes. Score = 100 + speed bonus (0–50).
create function public.submit_game_answer(p_room uuid, p_round integer, p_option text)
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

-- ── close_round ──────────────────────────────────────────────────────────────
-- Any player may ask; it only closes once time is up or everyone has answered.
-- Returns {closed}: false means "not yet", so clients can simply ask again.
create function public.close_round(p_room uuid, p_round integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  room public.game_rooms%rowtype := public.lock_my_room(p_room);
  rnd public.room_rounds%rowtype;
begin
  select * into rnd from public.room_rounds where room_id = p_room and round_index = p_round;
  if not found then
    raise exception 'question not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if rnd.closed_at is not null then
    return jsonb_build_object('closed', true);
  end if;
  if now() >= rnd.deadline_at or public.everyone_answered(p_room, p_round) then
    perform public.close_game_round(p_room, p_round);
    return jsonb_build_object('closed', true);
  end if;
  return jsonb_build_object('closed', false);
end;
$$;

-- ── next_round ───────────────────────────────────────────────────────────────
-- The host moves on. If the host has gone quiet for 15 seconds after a reveal, any
-- player may move on instead. p_from_round makes double clicks harmless.
create function public.next_round(p_room uuid, p_from_round integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  room public.game_rooms%rowtype := public.lock_my_room(p_room);
  rnd public.room_rounds%rowtype;
begin
  if room.status <> 'in_progress' or room.current_round::integer <> p_from_round then
    return; -- Someone already moved on, or the game is over.
  end if;
  select * into rnd from public.room_rounds where room_id = p_room and round_index = p_from_round;
  if rnd.closed_at is null then
    raise exception 'this question is still open' using errcode = 'P0001', hint = 'still_open';
  end if;
  if room.host_id <> auth.uid() and rnd.closed_at > now() - interval '15 seconds' then
    raise exception 'waiting for the host' using errcode = 'P0001', hint = 'not_host';
  end if;
  perform public.open_game_round(p_room, p_from_round + 1);
end;
$$;

-- Server clock, so clients can line their countdowns up with the server's deadlines.
create function public.server_time()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now(); $$;

-- ── Privileges ───────────────────────────────────────────────────────────────
revoke execute on function public.generate_room_code() from public, anon, authenticated;
revoke execute on function public.game_question_pool(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.open_game_round(uuid, integer) from public, anon, authenticated;
revoke execute on function public.finish_game(uuid) from public, anon, authenticated;
revoke execute on function public.close_game_round(uuid, integer) from public, anon, authenticated;
revoke execute on function public.everyone_answered(uuid, integer) from public, anon, authenticated;
revoke execute on function public.lock_my_room(uuid) from public, anon, authenticated;

revoke execute on function public.create_room(uuid, uuid, public.difficulty, integer, integer) from public, anon;
revoke execute on function public.join_room(text) from public, anon;
revoke execute on function public.leave_room(uuid) from public, anon;
revoke execute on function public.start_game(uuid) from public, anon;
revoke execute on function public.submit_game_answer(uuid, integer, text) from public, anon;
revoke execute on function public.close_round(uuid, integer) from public, anon;
revoke execute on function public.next_round(uuid, integer) from public, anon;
revoke execute on function public.server_time() from public, anon;
grant execute on function public.create_room(uuid, uuid, public.difficulty, integer, integer) to authenticated;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.start_game(uuid) to authenticated;
grant execute on function public.submit_game_answer(uuid, integer, text) to authenticated;
grant execute on function public.close_round(uuid, integer) to authenticated;
grant execute on function public.next_round(uuid, integer) to authenticated;
grant execute on function public.server_time() to authenticated;
