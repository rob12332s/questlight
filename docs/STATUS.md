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

### Tested
- **Unit tests:** scoring, XP and levels, streaks, room codes, answer checking, AI-question validation, display-name rules, environment checks and the open-redirect guard. Config and database consistency is tested in CI.
- **Database security suite (`npm run test:db`):** passes on PostgreSQL 16, and was mutation-checked. It covers:
  - own-data isolation and unreadable answer keys;
  - no client writes to scores, XP, quiz results or rooms;
  - teacher and member visibility for classrooms, and private flashcards;
  - content reports filed only as yourself, with no status tampering;
  - question-type consistency and a privilege audit;
  - account deletion cascades.
- **End-to-end tests (`tests/e2e`):** every public page on desktop and mobile is checked for a single h1, no console errors and no horizontal scroll. They also test answering the sample question, explanation tabs, the redirect from the app to log in, the 404 page and the mobile menu. They run in GitHub Actions on every push.

### Needs configuration
- A Supabase project, with the migrations applied and environment variables set in Vercel. Until then, accounts show a "not switched on" message. See [SETUP.md](SETUP.md).

### Known limitations
- There's no password reset yet. It's planned early in Stage 2.
- There's no profanity filter on display names yet. It's needed before shared leaderboards are switched on.
- Quizzes, flashcards, live games, AI study and leaderboards are not built yet. They appear as disabled navigation and "In development" or "Planned" on the features page.

## Next: Stage 2 (core student experience)
1. Original GCSE question bank: a small, reviewed set of topics per subject.
2. Learn: subject → topic → subtopic browsing.
3. Solo quizzes with server-checked answers, explanations, wrong-answer review and saved attempts.
4. Flashcards: create decks, review with ratings, and spaced-repetition scheduling.
5. Progress per topic, feeding the dashboard.
6. Password reset.

## Needs adult and professional review before use with schools or before payments
- UK GDPR and the ICO Children's Code: a DPIA, lawful basis, retention periods, and the privacy notice wording.
- Approach for users under 13, which would need parent or school involvement.
- Data processing agreements with Supabase, Vercel and any AI provider, plus safeguarding policy (KCSIE).
- A trademark and domain check for the final name.

Nothing in this repository claims legal compliance.
