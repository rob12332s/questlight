-- ════════════════════════════════════════════════════════════════════════════
-- Questlight · 0001 · Foundation schema, Row Level Security and privileges
--
-- Security model
--   • The browser talks to Postgres as `anon` / `authenticated` (RLS applies).
--   • Students read their own data and public reference data. The only direct
--     writes allowed are low-stakes personal content: a few profile fields,
--     subject preferences, their own flashcards, and content reports.
--   • Everything that affects scores, XP, games or quiz results is written by
--     SECURITY DEFINER functions (later migrations) that read auth.uid().
--   • Answer keys (question_answers) and room question plans are never readable
--     by anon/authenticated — not even through RLS.
--   • Supabase grants ALL on new public tables to anon/authenticated by default,
--     so privileges are revoked and re-granted explicitly near the end of this file.
--     tests/db/security.test.sql fails if a future table forgets to do this.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Enumerations ─────────────────────────────────────────────────────────────
create type public.education_stage as enum ('primary', 'secondary', 'gcse', 'a_level', 'college', 'university');
create type public.difficulty as enum ('foundation', 'standard', 'challenge');
create type public.question_type as enum ('multiple_choice', 'true_false', 'short_answer');
create type public.question_source as enum ('question_bank', 'ai_generated', 'teacher_created');
create type public.account_type as enum ('student', 'teacher');
create type public.room_status as enum ('lobby', 'in_progress', 'finished', 'abandoned', 'expired');
create type public.connection_status as enum ('connected', 'disconnected', 'left');
create type public.xp_source as enum ('solo_quiz', 'multiplayer_game', 'achievement', 'flashcards', 'ai_practice');
create type public.flashcard_rating as enum ('needs_practice', 'learning', 'confident');
create type public.report_reason as enum ('incorrect_answer', 'unclear', 'inappropriate', 'other');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

-- ── Helpers ──────────────────────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Options must match the question type. Mirrors src/domain/question-validation.ts.
--   multiple_choice: exactly four {id, text} objects with ids A–D in order
--   true_false:      exactly [{A, True}, {B, False}]
--   short_answer:    no options (accepted answers live in question_answers)
create function public.is_valid_options(qtype public.question_type, opts jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case qtype
    when 'short_answer' then opts is null
    when 'true_false' then opts is not null
      and opts = '[{"id":"A","text":"True"},{"id":"B","text":"False"}]'::jsonb
    else case
      when opts is null or jsonb_typeof(opts) <> 'array' or jsonb_array_length(opts) <> 4 then false
      else coalesce((
        select bool_and(
          jsonb_typeof(o.value) = 'object'
          and o.value ->> 'id' = chr(64 + o.ordinality::int)
          and char_length(btrim(coalesce(o.value ->> 'text', ''))) between 1 and 160
        )
        from jsonb_array_elements(opts) with ordinality as o(value, ordinality)
      ), false)
    end
  end;
$$;

-- Display names: 3–24 characters, letters/digits/space/_ . -, no leading/trailing or doubled spaces.
create function public.is_valid_display_name(name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(name ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{1,22}[A-Za-z0-9]$' and name !~ '\s{2,}', false);
$$;

-- ── Profiles ─────────────────────────────────────────────────────────────────
-- Deliberately minimal: no real name, no date of birth, no location, no email copy.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null constraint profiles_display_name_format check (public.is_valid_display_name(display_name)),
  education_stage public.education_stage,
  account_type public.account_type not null default 'student',
  show_on_leaderboards boolean not null default true,
  onboarding_completed boolean not null default false,
  plan text not null default 'free'
    constraint profiles_plan_check check (plan in ('free', 'student_pro', 'teacher_pro', 'school')),
  xp integer not null default 0 constraint profiles_xp_nonnegative check (xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ── Curriculum: stage → subject → topic → subtopic ───────────────────────────
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique constraint subjects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 60),
  description text check (char_length(description) <= 300),
  icon text not null default 'book-open',
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  slug text not null constraint topics_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 300),
  education_stage public.education_stage not null,
  -- Only set once content has genuinely been checked against a specification.
  -- Never implies official exam-board material.
  curriculum text check (char_length(curriculum) <= 60),
  exam_board text check (char_length(exam_board) <= 40),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (subject_id, education_stage, slug)
);
create index topics_subject_stage_idx on public.topics (subject_id, education_stage) where is_active;

create table public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  slug text not null constraint subtopics_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  unique (topic_id, slug)
);

create table public.profile_subjects (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, subject_id)
);
create index profile_subjects_subject_idx on public.profile_subjects (subject_id);

-- ── Questions & answer keys ──────────────────────────────────────────────────
-- `questions` holds only what a student may see BEFORE answering.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  subtopic_id uuid references public.subtopics (id) on delete set null,
  question_type public.question_type not null default 'multiple_choice',
  question_text text not null check (char_length(question_text) between 10 and 400),
  options jsonb,
  difficulty public.difficulty not null,
  source_type public.question_source not null default 'question_bank',
  -- "Exam-style" is a format label only; it never claims to be an official exam question.
  is_exam_style boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint questions_options_match_type check (public.is_valid_options(question_type, options)),
  constraint questions_ai_not_public check (source_type <> 'ai_generated' or not is_published)
);
create index questions_topic_difficulty_idx on public.questions (topic_id, difficulty) where is_published;
create index questions_subtopic_idx on public.questions (subtopic_id) where subtopic_id is not null;
create index questions_created_by_idx on public.questions (created_by) where created_by is not null;

-- Answer keys and explanations. No client role can read this table, ever.
create table public.question_answers (
  question_id uuid primary key references public.questions (id) on delete cascade,
  -- Option-based questions (multiple choice, true/false)
  correct_option char(1) check (correct_option in ('A', 'B', 'C', 'D')),
  -- Short-answer questions: acceptable answers, compared after normalisation
  accepted_answers text[] check (cardinality(accepted_answers) between 1 and 10),
  explanation text not null check (char_length(explanation) between 20 and 900),
  wrong_option_notes jsonb not null default '{}'::jsonb check (jsonb_typeof(wrong_option_notes) = 'object'),
  constraint question_answers_one_kind check ((correct_option is null) <> (accepted_answers is null))
);

-- The answer kind must match the question type (a check constraint can't see the other table).
create function public.check_answer_matches_question()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  qtype public.question_type;
begin
  select question_type into qtype from public.questions where id = new.question_id;
  if qtype = 'short_answer' and new.accepted_answers is null then
    raise exception 'short-answer questions need accepted_answers' using errcode = 'check_violation';
  elsif qtype = 'true_false' and new.correct_option not in ('A', 'B') then
    raise exception 'true/false answers must be A or B' using errcode = 'check_violation';
  elsif qtype <> 'short_answer' and new.correct_option is null then
    raise exception 'option-based questions need correct_option' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger question_answers_match_question
before insert or update on public.question_answers
for each row execute function public.check_answer_matches_question();

-- ── Solo revision ────────────────────────────────────────────────────────────
create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  difficulty public.difficulty not null,
  question_ids uuid[] not null check (cardinality(question_ids) between 1 and 30),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  correct_count smallint not null default 0 check (correct_count >= 0),
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint quiz_sessions_completed_has_time check ((status = 'completed') = (completed_at is not null))
);
create index quiz_sessions_player_idx on public.quiz_sessions (player_id, started_at desc);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  submitted_answer text not null check (char_length(submitted_answer) between 1 and 200),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (session_id, question_id)
);
create index quiz_attempts_player_question_idx on public.quiz_attempts (player_id, question_id, created_at desc);

-- Measured performance per topic. Recommendations are derived from this, and the
-- app only recommends once `questions_attempted` passes a minimum sample size.
create table public.user_progress (
  player_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  questions_attempted integer not null default 0 check (questions_attempted >= 0),
  correct_answers integer not null default 0 check (correct_answers >= 0),
  best_accuracy numeric(4, 3) check (best_accuracy between 0 and 1),
  mastery numeric(4, 3) not null default 0 check (mastery between 0 and 1),
  last_practised_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (player_id, topic_id),
  constraint user_progress_correct_le_attempted check (correct_answers <= questions_attempted)
);

-- ── Flashcards ───────────────────────────────────────────────────────────────
-- A student's own study material, so they may edit it directly (RLS-scoped).
create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  subject_id uuid references public.subjects (id) on delete set null,
  topic_id uuid references public.topics (id) on delete set null,
  is_ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index flashcard_decks_owner_idx on public.flashcard_decks (owner_id, updated_at desc);
create trigger flashcard_decks_set_updated_at
before update on public.flashcard_decks
for each row execute function public.set_updated_at();

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks (id) on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  front text not null check (char_length(btrim(front)) between 1 and 300),
  back text not null check (char_length(btrim(back)) between 1 and 600),
  explanation text check (char_length(explanation) <= 900),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index flashcards_deck_idx on public.flashcards (deck_id, sort_order);

-- Spaced-repetition state per card. Viewing a card changes nothing; only a rating does.
create table public.flashcard_reviews (
  card_id uuid primary key references public.flashcards (id) on delete cascade,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  last_rating public.flashcard_rating not null,
  interval_days numeric(6, 2) not null default 0 check (interval_days between 0 and 365),
  ease numeric(4, 2) not null default 2.5 check (ease between 1.3 and 3.0),
  review_count integer not null default 1 check (review_count >= 1),
  due_at timestamptz not null,
  reviewed_at timestamptz not null default now()
);
create index flashcard_reviews_due_idx on public.flashcard_reviews (owner_id, due_at);

-- ── Content reports ──────────────────────────────────────────────────────────
create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  question_id uuid references public.questions (id) on delete cascade,
  flashcard_id uuid references public.flashcards (id) on delete cascade,
  reason public.report_reason not null,
  details text check (char_length(details) <= 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  constraint content_reports_one_target check ((question_id is null) <> (flashcard_id is null)),
  -- One report per person per item is enough.
  constraint content_reports_once unique nulls not distinct (reporter_id, question_id, flashcard_id)
);
create index content_reports_status_idx on public.content_reports (status, created_at);

-- ── Classrooms (foundation for teacher-led games) ────────────────────────────
create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  class_code text not null unique constraint classrooms_code_format check (class_code ~ '^[BCDFGHJKMNPQRSTVWXZ2-9]{6}$'),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index classrooms_teacher_idx on public.classrooms (teacher_id);

create table public.classroom_members (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  -- Snapshot so the teacher sees display names without reading profiles.
  display_name text not null,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);
create index classroom_members_student_idx on public.classroom_members (student_id);

-- ── Multiplayer ──────────────────────────────────────────────────────────────
create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null constraint game_rooms_code_format check (room_code ~ '^[BCDFGHJKMNPQRSTVWXZ2-9]{6}$'),
  host_id uuid not null references public.profiles (id) on delete cascade,
  -- Set for teacher-hosted classroom games; only class members may join those.
  classroom_id uuid references public.classrooms (id) on delete cascade,
  host_plays boolean not null default true,
  status public.room_status not null default 'lobby',
  subject_id uuid not null references public.subjects (id),
  topic_id uuid references public.topics (id),
  difficulty public.difficulty not null,
  question_count smallint not null check (question_count between 3 and 30),
  max_players smallint not null check (max_players between 2 and 40),
  seconds_per_question smallint not null default 20 check (seconds_per_question between 10 and 60),
  current_round smallint not null default -1 check (current_round >= -1),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 hours',
  constraint game_rooms_expiry_after_creation check (expires_at > created_at),
  constraint game_rooms_round_within_count check (current_round < question_count)
);
-- A code is unique among rooms people can still join or play; finished rooms free their code.
create unique index game_rooms_active_code_idx on public.game_rooms (room_code)
  where status in ('lobby', 'in_progress');
create index game_rooms_host_idx on public.game_rooms (host_id);
create index game_rooms_cleanup_idx on public.game_rooms (expires_at) where status in ('lobby', 'in_progress');

create table public.room_players (
  room_id uuid not null references public.game_rooms (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  score integer not null default 0 check (score >= 0),
  correct_count smallint not null default 0 check (correct_count >= 0),
  total_correct_ms integer not null default 0 check (total_correct_ms >= 0),
  connection_status public.connection_status not null default 'connected',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, player_id)
);
create index room_players_player_idx on public.room_players (player_id);

-- The order of questions for a room. Private: knowing it would let players look ahead.
create table public.room_question_plan (
  room_id uuid not null references public.game_rooms (id) on delete cascade,
  round_index smallint not null check (round_index >= 0),
  question_id uuid not null references public.questions (id),
  primary key (room_id, round_index),
  unique (room_id, question_id)
);

-- One row per round, created only when that round opens. Live games use option-based
-- questions only. The answer and explanation stay NULL until the server closes the round.
create table public.room_rounds (
  room_id uuid not null references public.game_rooms (id) on delete cascade,
  round_index smallint not null check (round_index >= 0),
  question_id uuid not null references public.questions (id),
  question_text text not null,
  options jsonb not null check (
    public.is_valid_options('multiple_choice', options) or public.is_valid_options('true_false', options)
  ),
  started_at timestamptz not null,
  deadline_at timestamptz not null,
  closed_at timestamptz,
  correct_option char(1) check (correct_option in ('A', 'B', 'C', 'D')),
  explanation text,
  primary key (room_id, round_index),
  constraint room_rounds_deadline_after_start check (deadline_at > started_at),
  constraint room_rounds_reveal_only_when_closed check (closed_at is not null or (correct_option is null and explanation is null))
);

create table public.game_answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  round_index smallint not null,
  player_id uuid not null,
  question_id uuid not null references public.questions (id),
  submitted_option char(1) not null check (submitted_option in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  points_awarded smallint not null check (points_awarded between 0 and 150),
  response_ms integer not null check (response_ms >= 0),
  submitted_at timestamptz not null default now(),
  -- One answer per player per round: duplicate submissions fail at the database.
  unique (room_id, round_index, player_id),
  foreign key (room_id, round_index) references public.room_rounds (room_id, round_index) on delete cascade,
  foreign key (room_id, player_id) references public.room_players (room_id, player_id) on delete cascade,
  constraint game_answers_points_only_if_correct check (is_correct or points_awarded = 0)
);
create index game_answers_player_idx on public.game_answers (player_id);

-- ── Progression ──────────────────────────────────────────────────────────────
-- Idempotent XP ledger: (player, source, source_id) is unique, so a quiz or game can
-- never pay out twice even if a request is retried. profiles.xp is derived from it.
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  source public.xp_source not null,
  source_id text not null check (char_length(source_id) between 1 and 80),
  amount integer not null check (amount between 0 and 1000),
  created_at timestamptz not null default now(),
  unique (player_id, source, source_id)
);
create index xp_events_created_idx on public.xp_events (created_at desc, player_id);
create index xp_events_player_created_idx on public.xp_events (player_id, created_at desc);

create table public.achievements (
  id text primary key check (id ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 60),
  description text not null check (char_length(description) between 5 and 200),
  icon text not null default 'award',
  xp_reward integer not null default 0 check (xp_reward between 0 and 500),
  sort_order smallint not null default 0,
  is_active boolean not null default true
);

create table public.user_achievements (
  player_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

-- ── AI usage ─────────────────────────────────────────────────────────────────
-- Used for rate limiting and cost visibility. Never stores prompts or student text.
create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  request_type text not null check (request_type in ('questions', 'flashcards', 'explanation')),
  status text not null check (status in ('success', 'failed', 'rejected', 'rate_limited')),
  item_count smallint not null default 0 check (item_count between 0 and 50),
  usage_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(usage_metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index ai_generation_logs_player_created_idx on public.ai_generation_logs (player_id, created_at desc);

-- ════════════════════════════════════════════════════════════════════════════
-- Functions used by policies and triggers
-- ════════════════════════════════════════════════════════════════════════════

-- SECURITY DEFINER avoids RLS recursion when tables check membership.
create function public.is_room_member(target_room uuid)
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
  );
$$;

create function public.is_classroom_teacher(target_class uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.classrooms c
    where c.id = target_class and c.teacher_id = (select auth.uid())
  );
$$;

create function public.is_classroom_member(target_class uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.classroom_members m
    where m.classroom_id = target_class and m.student_id = (select auth.uid())
  );
$$;

-- Create a profile for every new auth user. Only display name and education stage are
-- taken from sign-up metadata, and both are validated; anything else is ignored.
-- Teacher accounts are granted by an administrator, never self-selected at sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  requested_stage text := new.raw_user_meta_data ->> 'education_stage';
begin
  if not public.is_valid_display_name(requested_name) then
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

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep profiles.xp in sync with the ledger.
create function public.apply_xp_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set xp = xp + new.amount where id = new.player_id;
  return new;
end;
$$;

create trigger xp_events_apply
after insert on public.xp_events
for each row execute function public.apply_xp_event();

-- When an account is deleted, remove that student's private AI-generated questions.
-- Shared bank / teacher content survives with created_by set to NULL.
create function public.purge_user_generated_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.questions where created_by = old.id and source_type = 'ai_generated';
  return old;
end;
$$;

create trigger profiles_purge_generated_content
before delete on public.profiles
for each row execute function public.purge_user_generated_content();

-- A card's owner must own its deck; a review's owner must own its card.
create function public.check_flashcard_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'flashcards' then
    if not exists (select 1 from public.flashcard_decks d where d.id = new.deck_id and d.owner_id = new.owner_id) then
      raise exception 'deck belongs to someone else' using errcode = 'insufficient_privilege';
    end if;
  elsif tg_table_name = 'flashcard_reviews' then
    if not exists (select 1 from public.flashcards f where f.id = new.card_id and f.owner_id = new.owner_id) then
      raise exception 'card belongs to someone else' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

create trigger flashcards_check_owner
before insert or update on public.flashcards
for each row execute function public.check_flashcard_ownership();
create trigger flashcard_reviews_check_owner
before insert or update on public.flashcard_reviews
for each row execute function public.check_flashcard_ownership();

-- ════════════════════════════════════════════════════════════════════════════
-- Privileges: deny by default, then grant the minimum
-- ════════════════════════════════════════════════════════════════════════════
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Functions are executable by PUBLIC by default in Postgres; lock down internal ones.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.apply_xp_event() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.purge_user_generated_content() from public, anon, authenticated;
revoke execute on function public.check_answer_matches_question() from public, anon, authenticated;
revoke execute on function public.check_flashcard_ownership() from public, anon, authenticated;
revoke execute on function public.is_room_member(uuid) from public, anon;
revoke execute on function public.is_classroom_teacher(uuid) from public, anon;
revoke execute on function public.is_classroom_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.is_classroom_teacher(uuid) to authenticated;
grant execute on function public.is_classroom_member(uuid) to authenticated;

-- Public reference data (readable before sign-in for the landing page and sign-up).
grant select on public.subjects, public.topics, public.subtopics, public.achievements to anon, authenticated;

-- Signed-in students: read access, scoped by RLS below.
grant select on
  public.profiles,
  public.profile_subjects,
  public.questions,
  public.quiz_sessions,
  public.quiz_attempts,
  public.user_progress,
  public.flashcard_decks,
  public.flashcards,
  public.flashcard_reviews,
  public.content_reports,
  public.classrooms,
  public.classroom_members,
  public.game_rooms,
  public.room_players,
  public.room_rounds,
  public.game_answers,
  public.xp_events,
  public.user_achievements,
  public.ai_generation_logs
to authenticated;

-- Direct writes a student may make. xp, plan, account_type and id are NOT updatable.
grant update (display_name, education_stage, show_on_leaderboards, onboarding_completed)
  on public.profiles to authenticated;
grant insert, delete on public.profile_subjects to authenticated;
grant insert, update, delete on public.flashcard_decks, public.flashcards, public.flashcard_reviews to authenticated;
grant insert (question_id, flashcard_id, reason, details) on public.content_reports to authenticated;

-- question_answers and room_question_plan: no grants to anon/authenticated at all.

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security — enabled on every table in the schema
-- ════════════════════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- Profiles: a student sees and edits only their own. Leaderboards will use a
-- definer function that exposes display name + XP for opted-in players only.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "subjects: read active" on public.subjects
  for select to anon, authenticated using (is_active);
create policy "topics: read active" on public.topics
  for select to anon, authenticated using (is_active);
create policy "subtopics: read active" on public.subtopics
  for select to anon, authenticated using (is_active);
create policy "achievements: read active" on public.achievements
  for select to anon, authenticated using (is_active);

create policy "profile_subjects: read own" on public.profile_subjects
  for select to authenticated using (profile_id = (select auth.uid()));
create policy "profile_subjects: add own" on public.profile_subjects
  for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "profile_subjects: remove own" on public.profile_subjects
  for delete to authenticated using (profile_id = (select auth.uid()));

-- Published bank questions, plus a student's own AI-generated questions.
create policy "questions: read published or own" on public.questions
  for select to authenticated using (is_published or created_by = (select auth.uid()));

-- question_answers / room_question_plan: RLS on with NO policies → no rows for clients.

create policy "quiz_sessions: read own" on public.quiz_sessions
  for select to authenticated using (player_id = (select auth.uid()));
create policy "quiz_attempts: read own" on public.quiz_attempts
  for select to authenticated using (player_id = (select auth.uid()));
create policy "user_progress: read own" on public.user_progress
  for select to authenticated using (player_id = (select auth.uid()));

-- Flashcards: full control over your own, nothing else.
create policy "flashcard_decks: own" on public.flashcard_decks
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "flashcards: own" on public.flashcards
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "flashcard_reviews: own" on public.flashcard_reviews
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "content_reports: file own" on public.content_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "content_reports: read own" on public.content_reports
  for select to authenticated using (reporter_id = (select auth.uid()));

create policy "classrooms: teacher or member reads" on public.classrooms
  for select to authenticated
  using (teacher_id = (select auth.uid()) or public.is_classroom_member(id));
create policy "classroom_members: teacher sees class, student sees self" on public.classroom_members
  for select to authenticated
  using (student_id = (select auth.uid()) or public.is_classroom_teacher(classroom_id));

create policy "game_rooms: members read" on public.game_rooms
  for select to authenticated using (public.is_room_member(id));
create policy "room_players: members read" on public.room_players
  for select to authenticated using (public.is_room_member(room_id));
create policy "room_rounds: members read" on public.room_rounds
  for select to authenticated using (public.is_room_member(room_id));
create policy "game_answers: read own" on public.game_answers
  for select to authenticated using (player_id = (select auth.uid()));

create policy "xp_events: read own" on public.xp_events
  for select to authenticated using (player_id = (select auth.uid()));
create policy "user_achievements: read own" on public.user_achievements
  for select to authenticated using (player_id = (select auth.uid()));
create policy "ai_generation_logs: read own" on public.ai_generation_logs
  for select to authenticated using (player_id = (select auth.uid()));

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Clients subscribe to room changes; Realtime applies the RLS policies above, so a
-- player only receives events for rooms they belong to. Answer keys are never published.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.game_rooms, public.room_players, public.room_rounds;
  end if;
end;
$$;
