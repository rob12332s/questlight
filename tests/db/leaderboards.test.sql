-- ════════════════════════════════════════════════════════════════════════════
-- Display-name filter and leaderboards: offensive names refused, opt-in only,
-- weekly window in UK time, the caller's own place, and "played with".
-- ════════════════════════════════════════════════════════════════════════════
\set QUIET on
\o /dev/null

\set gina '\'00000000-0000-4000-8000-0000000000a7\''
\set hal '\'00000000-0000-4000-8000-0000000000b8\''
\set ivy '\'00000000-0000-4000-8000-0000000000c9\''
\set jon '\'00000000-0000-4000-8000-0000000000da\''
\set kat '\'00000000-0000-4000-8000-0000000000eb\''

-- ── Filter: the same samples as tests/unit/name-filter.test.ts ───────────────
create temp table samples (name text, ok boolean);
insert into samples values
  ('Rob', true),
  ('Hancock', true),
  ('Dickens Fan', true),
  ('Arsenal 4ever', true),
  ('Sexton', true),
  ('Scrabble Queen', true),
  ('Pedro', true),
  ('Cockburn', true),
  ('Grass Hopper', true),
  ('Title Winner', true),
  ('Analise', true),
  ('Shitake Sam', false),
  ('f.u.c.k', false),
  ('Fuuuck', false),
  ('BigDick', false),
  ('big_dick_99', false),
  ('5h1t', false),
  ('d i c k', false),
  ('Kys', false),
  ('MrWanker', false),
  ('N1gg4', false),
  ('Hitler Fan', false),
  ('Bob', true),
  ('Nigeria Fan', true),
  ('Glass Act', true),
  ('Cassie', true),
  ('Massive Brain', true),
  ('Ass', false),
  ('Assss', true);
do $$
declare r record;
begin
  for r in select * from samples loop
    if public.is_acceptable_display_name(r.name) is distinct from r.ok then
      raise exception 'ASSERTION FAILED: filter gave the wrong answer for "%" (wanted %)', r.name, r.ok;
    end if;
  end loop;
end;
$$;
\echo '  ✓ the display-name filter matches the app''s rules on every sample'

insert into auth.users (id, email, raw_user_meta_data) values
  (:gina, 'gina@example.test', '{"display_name":"Gina"}'),
  (:hal, 'hal@example.test', '{"display_name":"Hal"}'),
  (:ivy, 'ivy@example.test', '{"display_name":"Ivy"}'),
  (:jon, 'jon@example.test', '{"display_name":"Jon"}'),
  (:kat, 'kat@example.test', '{"display_name":"Big Dick"}');

select tests.assert((select display_name like 'Player-%' from public.profiles where id = :kat),
  'an offensive name at sign-up becomes a neutral one');
select tests.assert((select bool_and(not show_on_leaderboards) from public.profiles), 'new accounts start hidden from leaderboards');

select tests.login(:gina);
select tests.expect_error(format('update public.profiles set display_name = %L where id = %L', 'Fuuuck', :gina), '23514');
update public.profiles set display_name = 'Gina G' where id = :gina;
select tests.assert((select display_name = 'Gina G' from public.profiles where id = :gina), 'ordinary renames still work');
\echo '  ✓ offensive names are refused at sign-up and on change'

-- ── Fixtures: who appears, and their XP ──────────────────────────────────────
reset role;
update public.profiles set show_on_leaderboards = true where id in (:gina, :hal, :jon);
-- Jon has an old offensive name from before the filter existed (simulated).
alter table public.profiles disable trigger profiles_display_name_acceptable;
update public.profiles set display_name = 'Shit Head' where id = :jon;
alter table public.profiles enable trigger profiles_display_name_acceptable;

select date_trunc('week', now() at time zone 'Europe/London') at time zone 'Europe/London' as week_start \gset
insert into public.xp_events (player_id, source, source_id, amount, created_at) values
  (:gina, 'solo_quiz', 'g1', 100, now()),
  (:hal, 'solo_quiz', 'h1', 50, now()),
  (:hal, 'solo_quiz', 'h0', 500, :'week_start'::timestamptz - interval '1 minute'),
  (:ivy, 'solo_quiz', 'i1', 80, now()),
  (:jon, 'solo_quiz', 'j1', 1000, now());
select tests.assert((select xp = 1000 from public.profiles where id = :jon), 'an old offensive name never blocks earning XP');

-- ── This week ────────────────────────────────────────────────────────────────
select tests.login_anon();
select tests.expect_error('select * from public.get_leaderboard(''week'')', '42501');
select tests.login(:gina);
select tests.expect_error('select * from public.get_leaderboard(''month'')', 'invalid_board');

select tests.assert(
  (select array_agg(display_name || ':' || place || ':' || points || ':' || is_me order by place) from public.get_leaderboard('week'))
  = array['Gina G:1:100:true', 'Hal:2:50:false'],
  'this week counts only XP since Monday, lists only students who opted in, and hides offensive names');
select tests.assert(
  (select array_agg(display_name || ':' || place || ':' || points order by place) from public.get_leaderboard('all_time'))
  = array['Hal:1:550', 'Gina G:2:100'],
  'all time uses total XP');

select tests.login(:ivy);
select tests.assert(
  (select array_agg(display_name || ':' || place || ':' || is_me || ':' || is_hidden order by place, is_me) from public.get_leaderboard('week'))
  = array['Gina G:1:false:false', 'Hal:2:false:false', 'Ivy:2:true:true'],
  'a hidden student sees where they would place, without changing anyone else''s place');
\echo '  ✓ weekly and all-time boards are opt-in, filtered and ranked'

-- ── Played with ──────────────────────────────────────────────────────────────
select tests.login(:gina);
select tests.assert(
  (select array_agg(display_name order by place) from public.get_leaderboard('played_with')) = array['Gina G'],
  'nobody else until you have played together');
reset role;
select id as subject from public.subjects where slug = 'physics' \gset
insert into public.game_rooms (id, room_code, host_id, subject_id, question_count, max_players, status)
values ('31000000-0000-4000-8000-000000000001', 'BCDFGH', :gina, :'subject', 5, 10, 'finished');
insert into public.room_players (room_id, player_id, display_name) values
  ('31000000-0000-4000-8000-000000000001', :gina, 'Gina G'),
  ('31000000-0000-4000-8000-000000000001', :hal, 'Hal');
select tests.login(:gina);
select tests.assert(
  (select array_agg(display_name order by place) from public.get_leaderboard('played_with')) = array['Gina G', 'Hal'],
  'people you finished a game with appear');
select tests.login(:hal);
select tests.assert(
  (select array_agg(display_name order by place) from public.get_leaderboard('played_with')) = array['Gina G', 'Hal'],
  'and it works both ways');
\echo '  ✓ "played with" lists people you have finished a live game with'

\echo '  ✓ leaderboard tests passed'
