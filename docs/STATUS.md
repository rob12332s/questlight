# Status

Feature statuses shown on the site come from `src/config/features.ts`. Change one only after the feature has been built and tested.

## Stage 1: brand and foundation

### Built
- **Brand:** 20 name candidates evaluated, with Questlight chosen as the working name ([BRAND.md](BRAND.md)). The identity covers palette, logo mark, wordmark, type and rules.
- **Design system:** colour, type, radius and motion tokens (`src/app/globals.css`), plus buttons, form fields, status badges, the answer-option component and the logo.
- **Public pages:** landing, features (with honest per-feature status), pricing (free plan only, no prices), privacy and terms (marked as drafts for professional review), and a 404 page.
- **Landing page:** an answerable sample question, an explanation-level demo labelled as written by the team, and a lobby illustration labelled as a preview.
- **Accounts:** sign-up (display name, email, password, stage, 13+ confirmation), log in, log out, email-confirmation callback, and session refresh in `proxy.ts`. If Supabase isn't configured, the forms say so plainly.
- **App shell:**
  - A sidebar on desktop and a menu on mobile.
  - Navigation items for features that aren't ready are visibly disabled, with "Soon" or "Later" labels.
- **Dashboard:**
  - Level and XP are read from the database.
  - Questions answered, topics practised and chosen subjects are also real data.
  - Getting-started steps and honest empty states fill the rest.
- **Profile and settings:** edit display name, stage and leaderboard visibility, choose subjects, and delete the account (needs the service-role key).
- **Database:**
  - The schema covers stage, subject, topic, subtopic and question, with three question types and private answer keys.
  - It also includes quizzes, progress, flashcards with spaced-repetition state, content reports, classrooms, live-game tables, the XP ledger, achievements and AI usage logs.
  - Nine GCSE subjects are seeded.

### Tested (GitHub Actions, 23 Nov 2026: all green)
- **Lint and production build:** both pass. The build includes strict type checking.
- **Unit tests (Vitest):** 72 pass. They cover scoring, XP and levels, streaks, room codes, answer checking, AI-question validation, display-name rules, environment checks, the open-redirect guard, and config/database consistency.
- **Database security suite (`npm run test:db`):** passes on PostgreSQL 16, and was mutation-checked. It covers:
  - own-data isolation and unreadable answer keys;
  - no client writes to scores, XP, quiz results or rooms;
  - teacher and member visibility for classrooms, and private flashcards;
  - content reports filed only as yourself, with no status tampering;
  - question-type consistency and a privilege audit;
  - account deletion cascades.
- **End-to-end tests (Playwright):** 25 pass across desktop and mobile Chrome, with 1 mobile-only test skipped on desktop.
  - Every public page is checked for a single h1, no console errors and no horizontal scroll.
  - They also test answering the sample question, explanation tabs, the redirect from the app to log in, the 404 page and the mobile menu.
- **Manual check:** the live site was checked in a browser at desktop and phone widths.
- **Not yet tested:** signing up, logging in, the dashboard and settings against a real Supabase project. These need the Supabase setup below.

### Needs configuration
- A Supabase project, with the migrations applied and environment variables set in Vercel. Until then, accounts show a "not switched on" message. See [SETUP.md](SETUP.md).

### Known limitations
- There's no profanity filter on display names yet. It's needed before shared leaderboards are switched on.
- Quizzes, flashcards, live games, AI study and leaderboards are not built yet. They appear as disabled navigation and "In development" or "Planned" on the features page.

## Stage 2: core student experience

### Built
- **Question bank:** 144 original GCSE questions across 18 topics in all nine subjects (multiple choice, true/false, short answer), each with an explanation. Generated into a migration by `scripts/build-question-bank.ts`.
- **Learn:** subject and topic browsing with per-topic progress.
- **Solo quizzes:**
  - Answers are checked on the server; answer keys never reach the browser.
  - Multiple-choice options are shuffled per quiz (stable on reload).
  - Explanations after every answer, a missed-question review, keyboard shortcuts, and content reports.
- **XP and progression:** server-side XP with a daily solo cap and no repeat XP for questions already answered correctly in the last 24 hours, levels, UK-day streaks, and 10 achievements.
- **Flashcards:** decks, cards, flip-to-reveal review, three ratings, and spaced-repetition scheduling.
- **Dashboard:** recent quizzes, streak, and "what to study next" (only judged after 10 answers on a topic).
- **Password reset**, and an in-app "not found" page for missing or other people's items.

### Tested
- **GitHub Actions, 24 Nov 2026 (all green):**
  - lint and production build;
  - 113 unit tests;
  - the database security and quiz-engine suites;
  - 29 end-to-end tests on desktop and mobile Chrome (1 skipped by design). These include a full student journey against a local Supabase: sign up, quiz, results with XP and an achievement, flashcards, another student being unable to see the first student's data, log out and in, and account deletion.
- **Live site, by hand:**
  - two quizzes (desktop and phone width), results, XP and achievements;
  - the dashboard, achievements and settings pages;
  - creating a flashcard deck, adding a card and reviewing it (the test deck was deleted afterwards).

### Needs configuration
- **Account deletion on the live site:** needs the Supabase secret key added in Vercel. See [SETUP.md](SETUP.md).

### Known limitations
- The question bank is small: about 8 questions per topic, 2 topics per subject. It needs expanding and reviewing by a teacher.
- There's no profanity filter on display names yet. It's needed before shared leaderboards are switched on.
- AI study, classrooms and leaderboards are not built yet. They are shown as "Soon" or "Later".

## Stage 3 (part 1): live games

### Built
- **Rooms:** a host picks a subject or topic, difficulty, length and time per question, and gets a six-character code plus a shareable link (`/play?code=…`). Up to 40 players.
- **Gameplay:**
  - A lobby that updates as people join.
  - A 3-second countdown, then the same question for everyone with a timer and an "answered" counter.
  - Answers are locked in, then revealed together with the explanation and standings.
  - The host moves on; if the host goes quiet for 15 seconds after a reveal, anyone can.
  - Final results show a podium, full standings and XP earned.
- **Server rules (migration 0005):**
  - Timing, correctness and scores are decided by the database: 100 points plus up to 50 for speed.
  - The question order and answers are never readable by players.
  - Join attempts are rate limited, so codes can't be guessed.
  - XP: 20 for finishing, plus 30, 20 or 10 for the top three. At most 10 rewarded games a day.
  - Achievements: "Into the room" and "Top of the room".
- **Live updates:** Supabase Realtime, falling back to polling if Realtime isn't connected. Clocks are aligned with the server, so countdowns match the deadlines.

### Tested (24 Nov 2026)
- **Database suite (`live_games.test.sql`):** joining, host-only controls, hidden answers, timing and score parity, early close when everyone has answered, late answers refused, the stuck-host fallback, XP paid once, leaving, no direct writes, and rate limiting.
- **Unit tests:** game screen state, standings and clock alignment. 121 unit tests pass in CI.
- **End-to-end (CI, desktop and mobile Chrome):** two students sign up, one hosts, the other joins with the shared link, and they play all 5 rounds with live updates and see final results with XP. Someone outside the game can't open it. 31 end-to-end tests pass in all.
- **Live site:**
  - Migration applied and checked: functions, permissions, Realtime tables and RLS on every table.
  - A lobby was created and Realtime was confirmed connected; the room was then closed.
  - The wrong-code message was checked at phone width.
  - A full game on the live site needs two real accounts, so it hasn't been played there yet.

## Next
1. Leaderboards (friends, weekly, classroom), with a display-name filter first.
2. An AI study assistant that only switches on when an API key is configured.
3. Teacher classrooms (class-only games, where the host doesn't play).
4. More questions, reviewed by a teacher.

## Needs adult and professional review before use with schools or before payments
- UK GDPR and the ICO Children's Code: a DPIA, lawful basis, retention periods, and the privacy notice wording.
- Approach for users under 13, which would need parent or school involvement.
- Data processing agreements with Supabase, Vercel and any AI provider, plus safeguarding policy (KCSIE).
- A trademark and domain check for the final name.

Nothing in this repository claims legal compliance.
