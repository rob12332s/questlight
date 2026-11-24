-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0011 · GCSE Library, Exam Answer Coach, My Exam Map and Pro
--
--   exam_boards, specifications   which boards and specification codes we support
--   library_topics                the GCSE library: one row per learnable topic or skill,
--                                 with coverage and verification labels
--   lessons                       Exam Answer Coach content (never readable directly:
--                                 served only by open_lesson, which checks Pro access)
--   coach_attempts                results from coach activities (feeds My Exam Map)
--   subscriptions                 Free/Pro state; written only by the server
--   profile_subjects              + exam board, tier, set texts/options and confidence
--
-- Pro access is decided here, in the database, never by the browser.
-- Payments are not live: subscriptions can only be simulated where the row
-- ('payments_test_mode', 'on') exists in private_settings (local and CI test databases
-- only; it is never added to the live database).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Boards and specifications ────────────────────────────────────────────────
create table public.exam_boards (
  id text primary key check (id ~ '^[a-z]+$'),
  name text not null,
  sort_order smallint not null default 0
);

create table public.specifications (
  id text primary key check (id ~ '^[a-z]+-[a-z0-9]+$'),
  board_id text not null references public.exam_boards (id),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  code text not null,
  title text not null,
  tiered boolean not null default false,
  -- True only when the code and title were checked against the board's own published material.
  verified boolean not null default false,
  source_url text,
  unique (board_id, subject_id, code)
);

-- ── The library ──────────────────────────────────────────────────────────────
create table public.library_topics (
  id uuid primary key,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  area text not null check (char_length(area) between 2 and 80),
  subtopic text check (char_length(subtopic) <= 80),
  title text not null check (char_length(title) between 2 and 120),
  objective text not null check (char_length(objective) between 10 and 300),
  skill text not null check (char_length(skill) between 3 and 160),
  -- 'all' means the topic is for every tier (or the subject isn't tiered).
  tier text not null default 'all' check (tier in ('all', 'foundation', 'higher')),
  difficulty public.difficulty not null default 'standard',
  paper text check (char_length(paper) <= 80),
  -- shared: common content all boards must teach (e.g. DfE GCSE maths content)
  -- general: general GCSE revision content, not yet mapped line by line to a board
  -- board_specific: belongs to the listed boards only (set texts, history options…)
  coverage text not null check (coverage in ('shared', 'general', 'board_specific')),
  verification text not null check (verification in ('verified', 'awaiting_verification')),
  boards text[] not null default '{}',
  access text not null default 'pro' check (access in ('free', 'pro')),
  -- lesson: a full Exam Answer Coach lesson is published
  -- practice: quiz practice is available, the lesson is being written
  -- planned: listed in the library, content being written
  content_status text not null default 'planned' check (content_status in ('lesson', 'practice', 'planned')),
  quiz_topic_id uuid references public.topics (id) on delete set null,
  -- Separate-science-only content (not in Combined Science); 'all' otherwise.
  qualification text not null default 'all' check (qualification in ('all', 'separate_only')),
  -- Set texts and history options: shown to students who chose this option.
  option_key text check (option_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);
create index library_topics_subject_idx on public.library_topics (subject_id, sort_order);

create table public.lessons (
  topic_id uuid primary key references public.library_topics (id) on delete cascade,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  version integer not null default 1 check (version >= 1),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published')),
  review_note text check (char_length(review_note) <= 500),
  updated_at timestamptz not null default now()
);

-- One row per student per lesson per UK day: used for the free daily allowance.
create table public.lesson_opens (
  player_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.library_topics (id) on delete cascade,
  opened_on date not null,
  primary key (player_id, topic_id, opened_on)
);

create table public.coach_attempts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.library_topics (id) on delete cascade,
  mode text not null check (mode in ('worked', 'guided', 'independent', 'retest')),
  marks_awarded smallint not null check (marks_awarded >= 0),
  marks_available smallint not null check (marks_available between 1 and 100),
  mistakes text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint coach_attempts_marks_in_range check (marks_awarded <= marks_available)
);
create index coach_attempts_player_idx on public.coach_attempts (player_id, created_at desc);

-- ── Subscriptions ────────────────────────────────────────────────────────────
create table public.subscriptions (
  player_id uuid primary key references public.profiles (id) on delete cascade,
  plan text not null default 'pro' check (plan in ('pro')),
  status text not null check (status in ('active', 'pending', 'cancelled', 'expired', 'failed')),
  current_period_end timestamptz,
  provider text check (char_length(provider) <= 40),
  provider_ref text check (char_length(provider_ref) <= 120),
  test_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Every change to a subscription, for support and audit.
create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  status text not null,
  note text check (char_length(note) <= 200),
  test_mode boolean not null default false,
  created_at timestamptz not null default now()
);
create index subscription_events_player_idx on public.subscription_events (player_id, created_at desc);

-- ── Courses: board, tier and options per subject ─────────────────────────────
alter table public.profile_subjects
  add column exam_board text references public.exam_boards (id),
  add column tier text check (tier in ('foundation', 'higher')),
  add column options text[] not null default '{}' check (cardinality(options) <= 20),
  add column confidence smallint check (confidence between 1 and 5);

-- Content admins (set by the site owner, like teachers). Not writable by students.
alter table public.profiles add column is_content_admin boolean not null default false;

-- ── Functions ────────────────────────────────────────────────────────────────

-- Free plan: Exam Answer Coach lessons a student can open per UK day (mirrors
-- PLAN_LIMITS.free.coachLessonsPerDay in src/config/plans.ts).
create function public.free_lessons_per_day()
returns integer
language sql
immutable
set search_path = ''
as $$ select 5; $$;

create function public.has_pro(p_player uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.player_id = p_player
      and (
        (s.status = 'active' and (s.current_period_end is null or s.current_period_end > now()))
        -- Cancelled subscriptions keep Pro until the end of the period already paid for.
        or (s.status = 'cancelled' and s.current_period_end > now())
      )
  );
$$;

-- AI allowances now depend on the plan. Free numbers are unchanged from 0009; both sets
-- mirror PLAN_LIMITS in src/config/plans.ts (a unit test checks they match).
create or replace function public.ai_limits()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.has_pro(auth.uid()) then
    jsonb_build_object('explanation', 100, 'questions', 150, 'questions_per_request', 10, 'flashcards', 25)
  else
    jsonb_build_object('explanation', 20, 'questions', 30, 'questions_per_request', 10, 'flashcards', 5)
  end;
$$;

create function public.my_plan()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'pro', public.has_pro(auth.uid()),
    'status', (select status from public.subscriptions where player_id = auth.uid()),
    'current_period_end', (select current_period_end from public.subscriptions where player_id = auth.uid()),
    'test_mode', coalesce((select test_mode from public.subscriptions where player_id = auth.uid()), false),
    'lessons_today', (select count(*) from public.lesson_opens
                      where player_id = auth.uid() and opened_on = (now() at time zone 'Europe/London')::date),
    'free_lessons_per_day', public.free_lessons_per_day()
  );
$$;

create function public.is_content_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_content_admin from public.profiles where id = (select auth.uid())), false);
$$;

-- Serves a lesson after checking it's published, the student's plan allows it, and the
-- free daily allowance. Lessons are never readable any other way.
create function public.open_lesson(p_topic uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  t public.library_topics%rowtype;
  l public.lessons%rowtype;
  today date := (now() at time zone 'Europe/London')::date;
  pro boolean;
  opened integer;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  select * into t from public.library_topics where id = p_topic and is_published;
  select * into l from public.lessons where topic_id = p_topic and status = 'published';
  if t.id is null or l.topic_id is null or t.content_status <> 'lesson' then
    raise exception 'lesson not found' using errcode = 'P0001', hint = 'not_found';
  end if;

  pro := public.has_pro(uid);
  if t.access = 'pro' and not pro then
    raise exception 'this lesson is part of Pro' using errcode = 'P0001', hint = 'pro_required';
  end if;
  if not pro and not exists (
    select 1 from public.lesson_opens where player_id = uid and topic_id = p_topic and opened_on = today
  ) then
    select count(*) into opened from public.lesson_opens where player_id = uid and opened_on = today;
    if opened >= public.free_lessons_per_day() then
      raise exception 'daily free lessons used' using errcode = 'P0001', hint = 'daily_limit';
    end if;
  end if;

  insert into public.lesson_opens (player_id, topic_id, opened_on) values (uid, p_topic, today) on conflict do nothing;
  return jsonb_build_object('content', l.content, 'version', l.version);
end;
$$;

-- Records the result of a coach activity. The student must be able to open the lesson.
create function public.record_coach_result(
  p_topic uuid,
  p_mode text,
  p_awarded integer,
  p_available integer,
  p_mistakes text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  t public.library_topics%rowtype;
  recent integer;
  clean text[];
  new_id uuid;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  select * into t from public.library_topics where id = p_topic and is_published and content_status = 'lesson';
  if t.id is null then
    raise exception 'lesson not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if t.access = 'pro' and not public.has_pro(uid) then
    raise exception 'this lesson is part of Pro' using errcode = 'P0001', hint = 'pro_required';
  end if;
  if p_mode is null or p_mode not in ('worked', 'guided', 'independent', 'retest')
     or p_available is null or p_available < 1 or p_available > 100
     or p_awarded is null or p_awarded < 0 or p_awarded > p_available then
    raise exception 'invalid result' using errcode = 'check_violation';
  end if;
  select count(*) into recent from public.coach_attempts where player_id = uid and created_at > now() - interval '24 hours';
  if recent >= 300 then
    raise exception 'too many results today' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  -- Mistake tags are short identifiers; anything else is dropped.
  select coalesce(array_agg(distinct m), '{}') into clean
  from unnest(coalesce(p_mistakes, '{}')) m
  where m ~ '^[a-z_]{3,40}$';
  insert into public.coach_attempts (player_id, topic_id, mode, marks_awarded, marks_available, mistakes)
  values (uid, p_topic, p_mode, p_awarded, p_available, clean[1:10])
  returning id into new_id;
  return new_id;
end;
$$;

-- Settings only the database owner can change. No grants: invisible to the API.
create table public.private_settings (
  key text primary key check (key ~ '^[a-z_]{3,40}$'),
  value text not null check (char_length(value) <= 200)
);
alter table public.private_settings enable row level security;
revoke all on public.private_settings from public, anon, authenticated;

-- Test mode only: lets a student move their own subscription through every state, so the
-- Pro experience can be tested without taking payments. Refuses unless private_settings
-- has payments_test_mode = 'on', which is never added to the live database.
create function public.simulate_subscription(p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.private_settings where key = 'payments_test_mode' and value = 'on') then
    raise exception 'payments are not live and test mode is off' using errcode = 'P0001', hint = 'test_mode_off';
  end if;
  if p_status is null or p_status not in ('active', 'pending', 'cancelled', 'expired', 'failed', 'free') then
    raise exception 'unknown status' using errcode = 'check_violation';
  end if;
  if p_status = 'free' then
    delete from public.subscriptions where player_id = uid;
  else
    insert into public.subscriptions (player_id, status, current_period_end, provider, test_mode, updated_at)
    values (
      uid, p_status,
      case p_status when 'active' then now() + interval '1 month'
                    when 'cancelled' then now() + interval '10 days'
                    when 'expired' then now() - interval '1 day'
                    else null end,
      'test', true, now()
    )
    on conflict (player_id) do update
      set status = excluded.status, current_period_end = excluded.current_period_end,
          provider = 'test', test_mode = true, updated_at = now();
  end if;
  insert into public.subscription_events (player_id, status, note, test_mode) values (uid, p_status, 'simulated in test mode', true);
  return public.my_plan();
end;
$$;

-- Content admin: change a topic's labels and publication.
create function public.admin_update_topic(
  p_topic uuid,
  p_verification text,
  p_access text,
  p_content_status text,
  p_published boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_content_admin() then
    raise exception 'admins only' using errcode = 'P0001', hint = 'not_admin';
  end if;
  update public.library_topics
  set verification = p_verification, access = p_access, content_status = p_content_status,
      is_published = p_published, updated_at = now()
  where id = p_topic;
  if not found then
    raise exception 'topic not found' using errcode = 'P0001', hint = 'not_found';
  end if;
end;
$$;

-- Content admin: save a lesson (validated by the app first) and set its review status.
create function public.admin_save_lesson(p_topic uuid, p_content jsonb, p_status text, p_note text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v integer;
begin
  if not public.is_content_admin() then
    raise exception 'admins only' using errcode = 'P0001', hint = 'not_admin';
  end if;
  if not exists (select 1 from public.library_topics where id = p_topic) then
    raise exception 'topic not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  insert into public.lessons (topic_id, content, version, status, review_note, updated_at)
  values (p_topic, p_content, 1, p_status, p_note, now())
  on conflict (topic_id) do update
    set content = excluded.content, version = public.lessons.version + 1, status = excluded.status,
        review_note = excluded.review_note, updated_at = now()
  returning version into v;
  -- A published lesson makes the topic a lesson; unpublishing falls back to planned.
  update public.library_topics
  set content_status = case when p_status = 'published' then 'lesson'
                            when content_status = 'lesson' then 'planned' else content_status end,
      updated_at = now()
  where id = p_topic;
  return v;
end;
$$;

-- Content admin: read any lesson, including drafts.
create function public.admin_get_lesson(p_topic uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_content_admin() then
    raise exception 'admins only' using errcode = 'P0001', hint = 'not_admin';
  end if;
  return (select jsonb_build_object('content', content, 'version', version, 'status', status, 'review_note', review_note)
          from public.lessons where topic_id = p_topic);
end;
$$;

-- ── Security ─────────────────────────────────────────────────────────────────
alter table public.exam_boards enable row level security;
alter table public.specifications enable row level security;
alter table public.library_topics enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_opens enable row level security;
alter table public.coach_attempts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

revoke all on public.exam_boards, public.specifications, public.library_topics, public.lessons, public.lesson_opens,
  public.coach_attempts, public.subscriptions, public.subscription_events from public, anon, authenticated;

-- The catalogue is public (no answers or lesson content in it).
grant select on public.exam_boards, public.specifications, public.library_topics to anon, authenticated;
create policy "exam_boards: everyone reads" on public.exam_boards for select to anon, authenticated using (true);
create policy "specifications: everyone reads" on public.specifications for select to anon, authenticated using (true);
create policy "library_topics: published, or admins" on public.library_topics
  for select to anon, authenticated using (is_published or public.is_content_admin());

-- Students read their own results and plan; nothing here is client-writable.
grant select on public.coach_attempts, public.subscriptions, public.subscription_events, public.lesson_opens to authenticated;
create policy "coach_attempts: read own" on public.coach_attempts for select to authenticated using (player_id = (select auth.uid()));
create policy "subscriptions: read own" on public.subscriptions for select to authenticated using (player_id = (select auth.uid()));
create policy "subscription_events: read own" on public.subscription_events for select to authenticated using (player_id = (select auth.uid()));
create policy "lesson_opens: read own" on public.lesson_opens for select to authenticated using (player_id = (select auth.uid()));
-- lessons: RLS on and no policies or grants. Only open_lesson / admin_get_lesson serve them.

-- Students choose board, tier, options and confidence for their own subjects.
grant update (exam_board, tier, options, confidence) on public.profile_subjects to authenticated;
create policy "profile_subjects: update own" on public.profile_subjects
  for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

revoke execute on function public.free_lessons_per_day() from public, anon;
revoke execute on function public.has_pro(uuid) from public, anon;
revoke execute on function public.my_plan() from public, anon;
revoke execute on function public.is_content_admin() from public;
revoke execute on function public.open_lesson(uuid) from public, anon;
revoke execute on function public.record_coach_result(uuid, text, integer, integer, text[]) from public, anon;
revoke execute on function public.simulate_subscription(text) from public, anon;
revoke execute on function public.admin_update_topic(uuid, text, text, text, boolean) from public, anon;
revoke execute on function public.admin_save_lesson(uuid, jsonb, text, text) from public, anon;
revoke execute on function public.admin_get_lesson(uuid) from public, anon;
grant execute on function public.free_lessons_per_day() to authenticated;
grant execute on function public.has_pro(uuid) to authenticated;
grant execute on function public.my_plan() to authenticated;
grant execute on function public.is_content_admin() to anon, authenticated;
grant execute on function public.open_lesson(uuid) to authenticated;
grant execute on function public.record_coach_result(uuid, text, integer, integer, text[]) to authenticated;
grant execute on function public.simulate_subscription(text) to authenticated;
grant execute on function public.admin_update_topic(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.admin_save_lesson(uuid, jsonb, text, text) to authenticated;
grant execute on function public.admin_get_lesson(uuid) to authenticated;

-- ── Reference data: boards and specifications ────────────────────────────────
insert into public.exam_boards (id, name, sort_order) values
  ('aqa', 'AQA', 1), ('edexcel', 'Pearson Edexcel', 2), ('ocr', 'OCR', 3)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

-- verified = code and title checked against the board's published specification pages.
insert into public.specifications (id, board_id, subject_id, code, title, tiered, verified, source_url)
select v.id, v.board, s.id, v.code, v.title, v.tiered, v.verified, v.url
from (values
  ('aqa-8300', 'aqa', 'maths', '8300', 'GCSE Mathematics', true, true, 'https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300'),
  ('edexcel-1ma1', 'edexcel', 'maths', '1MA1', 'GCSE (9–1) Mathematics', true, true, 'https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.html'),
  ('ocr-j560', 'ocr', 'maths', 'J560', 'GCSE (9–1) Mathematics', true, false, 'https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/'),
  ('aqa-8461', 'aqa', 'biology', '8461', 'GCSE Biology', true, true, 'https://www.aqa.org.uk/subjects/biology/gcse/biology-8461'),
  ('edexcel-1bi0', 'edexcel', 'biology', '1BI0', 'GCSE (9–1) Biology', true, true, null),
  ('ocr-j247', 'ocr', 'biology', 'J247', 'GCSE (9–1) Biology A (Gateway Science)', true, true, 'https://www.ocr.org.uk/qualifications/gcse/gateway-science-suite-biology-a-j247-from-2016/'),
  ('aqa-8462', 'aqa', 'chemistry', '8462', 'GCSE Chemistry', true, true, null),
  ('edexcel-1ch0', 'edexcel', 'chemistry', '1CH0', 'GCSE (9–1) Chemistry', true, true, null),
  ('ocr-j248', 'ocr', 'chemistry', 'J248', 'GCSE (9–1) Chemistry A (Gateway Science)', true, false, null),
  ('aqa-8463', 'aqa', 'physics', '8463', 'GCSE Physics', true, true, null),
  ('edexcel-1ph0', 'edexcel', 'physics', '1PH0', 'GCSE (9–1) Physics', true, true, null),
  ('ocr-j249', 'ocr', 'physics', 'J249', 'GCSE (9–1) Physics A (Gateway Science)', true, false, null),
  ('aqa-8464', 'aqa', 'combined-science', '8464', 'GCSE Combined Science: Trilogy', true, true, null),
  ('edexcel-1sc0', 'edexcel', 'combined-science', '1SC0', 'GCSE (9–1) Combined Science', true, true, null),
  ('ocr-j250', 'ocr', 'combined-science', 'J250', 'GCSE (9–1) Combined Science A (Gateway Science)', true, false, null),
  ('aqa-8700', 'aqa', 'english-language', '8700', 'GCSE English Language', false, true, null),
  ('edexcel-1en0', 'edexcel', 'english-language', '1EN0', 'GCSE (9–1) English Language', false, false, null),
  ('ocr-j351', 'ocr', 'english-language', 'J351', 'GCSE (9–1) English Language', false, false, null),
  ('aqa-8702', 'aqa', 'english-literature', '8702', 'GCSE English Literature', false, true, 'https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702'),
  ('edexcel-1et0', 'edexcel', 'english-literature', '1ET0', 'GCSE (9–1) English Literature', false, false, null),
  ('ocr-j352', 'ocr', 'english-literature', 'J352', 'GCSE (9–1) English Literature', false, false, null),
  ('aqa-8145', 'aqa', 'history', '8145', 'GCSE History', false, true, 'https://www.aqa.org.uk/subjects/history/gcse/history-8145'),
  ('edexcel-1hi0', 'edexcel', 'history', '1HI0', 'GCSE (9–1) History', false, true, null),
  ('ocr-j411', 'ocr', 'history', 'J411', 'GCSE (9–1) History B (Schools History Project)', false, true, null),
  ('ocr-j410', 'ocr', 'history', 'J410', 'GCSE (9–1) History A (Explaining the Modern World)', false, true, null),
  ('aqa-8035', 'aqa', 'geography', '8035', 'GCSE Geography', false, true, 'https://www.aqa.org.uk/subjects/geography/gcse/geography-8035'),
  ('edexcel-1ga0', 'edexcel', 'geography', '1GA0', 'GCSE (9–1) Geography A', false, false, null),
  ('ocr-j384', 'ocr', 'geography', 'J384', 'GCSE (9–1) Geography B (Geography for Enquiring Minds)', false, true, null)
) as v(id, board, slug, code, title, tiered, verified, url)
join public.subjects s on s.slug = v.slug
on conflict (id) do update set code = excluded.code, title = excluded.title, tiered = excluded.tiered,
  verified = excluded.verified, source_url = excluded.source_url;
