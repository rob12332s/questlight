-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0006 · Display-name filter and leaderboards
--
-- Leaderboards show names to other students, so:
--   • clearly offensive display names are refused (mirrors src/domain/name-filter.ts;
--     a unit test checks the term lists match);
--   • only students who choose to appear are listed, and new accounts start hidden
--     (privacy by default). Everyone can still see where they would place.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Display-name filter ──────────────────────────────────────────────────────
-- See name-filter.ts for how matching avoids catching ordinary names.
create function public.is_acceptable_display_name(name text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  anywhere constant text[] := array['fuck', 'cunt', 'nigger', 'nigga', 'faggot', 'wanker', 'wank', 'twat', 'bitch', 'shit', 'slut', 'whore', 'retard', 'rapist', 'paedo', 'hitler', 'nazi', 'porn', 'penis', 'vagina', 'dildo', 'bastard', 'bollock', 'spastic', 'jizz', 'killyourself', 'motherfucker'];
  words constant text[] := array['ass', 'arse', 'arsehole', 'asshole', 'anal', 'boob', 'boobs', 'cock', 'coon', 'cum', 'dick', 'dyke', 'fag', 'homo', 'kike', 'knob', 'kys', 'nonce', 'paki', 'pedo', 'piss', 'prick', 'rape', 'sex', 'spaz', 'tit', 'tits', 'tranny'];
  raw text := translate(lower(regexp_replace(coalesce(name, ''), '[[:space:]_.-]+', '', 'g')), '0134578', 'oieastb');
  collapsed text := regexp_replace(raw, '(.)\1+', '\1', 'g');
  term text;
  word text;
begin
  foreach term in array anywhere loop
    if strpos(raw, term) > 0 or strpos(collapsed, term) > 0 then
      return false;
    end if;
  end loop;
  for word in
    select translate(lower(part), '0134578', 'oieastb')
    from regexp_split_to_table(regexp_replace(coalesce(name, ''), '([a-z])([A-Z])', '\1 \2', 'g'), '[[:space:]_.-]+') as part
    where part <> ''
  loop
    if word = any (words) or regexp_replace(word, '(.)\1+', '\1', 'g') = any (words) then
      return false;
    end if;
  end loop;
  -- Letters spaced out to dodge the word list ("d i c k").
  return not (raw = any (words) or collapsed = any (words));
end;
$$;
grant execute on function public.is_acceptable_display_name(text) to anon, authenticated;

-- New and changed names must pass. Only checked when the name is set or changed, so a
-- name from before the filter never blocks other updates (such as XP); leaderboards
-- hide those names instead.
create function public.check_display_name_acceptable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.display_name is distinct from old.display_name)
     and not public.is_acceptable_display_name(new.display_name) then
    raise exception 'display name not allowed' using errcode = 'check_violation', hint = 'display_name_not_allowed';
  end if;
  return new;
end;
$$;
create trigger profiles_display_name_acceptable
before insert or update of display_name on public.profiles
for each row execute function public.check_display_name_acceptable();

-- Sign-up falls back to a neutral name rather than failing (the form checks first).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  requested_stage text := new.raw_user_meta_data ->> 'education_stage';
begin
  if not public.is_valid_display_name(requested_name) or not public.is_acceptable_display_name(requested_name) then
    requested_name := 'Player-' || upper(substr(replace(new.id::text, '-', ''), 1, 5));
  end if;

  insert into public.profiles (id, display_name, education_stage)
  values (
    new.id,
    requested_name,
    case
      when requested_stage = any (enum_range(null::public.education_stage)::text[])
        then requested_stage::public.education_stage
    end
  );
  return new;
end;
$$;

-- Privacy by default: new accounts don't appear on leaderboards until they choose to.
alter table public.profiles alter column show_on_leaderboards set default false;

-- ── Leaderboards ─────────────────────────────────────────────────────────────
-- p_board:
--   'week'        XP earned since Monday 00:00 (UK time)
--   'all_time'    total XP
--   'played_with' this week's XP, among people you've finished a live game with
-- Lists the top 50 students who chose to appear (and whose names pass the filter),
-- plus the caller. If the caller is hidden, their row shows where they would place
-- without changing anyone else's place.
create function public.get_leaderboard(p_board text)
returns table (place integer, display_name text, points integer, is_me boolean, is_hidden boolean)
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
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if p_board is null or p_board not in ('week', 'all_time', 'played_with') then
    raise exception 'unknown leaderboard' using errcode = 'P0001', hint = 'invalid_board';
  end if;

  return query
  with candidates as (
    select p.id, p.display_name,
           (p.show_on_leaderboards and public.is_acceptable_display_name(p.display_name)) as visible
    from public.profiles p
    where p.id = uid
       or (p.show_on_leaderboards
           and (p_board <> 'played_with' or exists (
             select 1
             from public.room_players mine
             join public.room_players theirs on theirs.room_id = mine.room_id
             join public.game_rooms r on r.id = mine.room_id and r.status = 'finished'
             where mine.player_id = uid and theirs.player_id = p.id
           )))
  ),
  scored as (
    select c.id, c.display_name, c.visible,
           case
             when p_board = 'all_time' then (select pr.xp from public.profiles pr where pr.id = c.id)
             else coalesce((
               select sum(x.amount)::integer from public.xp_events x
               where x.player_id = c.id and x.created_at >= week_start
             ), 0)
           end as pts
    from candidates c
  ),
  shown as (
    select s.id, s.display_name, s.pts,
           rank() over (order by s.pts desc)::integer as place
    from scored s
    where s.visible and s.pts > 0
  ),
  me as (
    select s.id, s.display_name, s.pts, s.visible from scored s where s.id = uid
  )
  select sh.place, sh.display_name, sh.pts, sh.id = uid, false
  from shown sh
  where sh.place <= 50 or sh.id = uid
  union all
  -- The caller when they aren't in the list above: hidden, or on zero points.
  select (1 + (select count(*) from shown where shown.pts > me.pts))::integer, me.display_name, me.pts, true, not me.visible
  from me
  where not exists (select 1 from shown where shown.id = uid)
  order by 1, 2;
end;
$$;
revoke execute on function public.get_leaderboard(text) from public, anon;
grant execute on function public.get_leaderboard(text) to authenticated;
