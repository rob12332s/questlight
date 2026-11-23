# Status

## Stage 1 (foundation): partially complete

### Built and tested

- **Domain rules** (`src/domain`): scoring and ranking, XP/levels/streaks with anti-farming and a daily cap, room codes, answer evaluation, and AI-question validation.
  - The AI-question validation catches duplicate options, answer-index mismatches, "all of the above" options, and topic or difficulty drift.
  - 65 unit tests pass, and the code passes a strict `tsc` check.
- **Database** (`supabase/migrations`): the full schema for profiles, curriculum, questions and answer keys, solo quizzes, multiplayer rooms and rounds, the XP ledger, achievements and AI usage logs. It includes constraints, indexes, RLS, column-level grants, auto-created profiles, and account-deletion cleanup.
  - The security suite (`npm run test:db`) passes against a real PostgreSQL 16. It covers own-data isolation, unreadable answer keys, no client-side score/XP/room writes, member-only room visibility, duplicate and invalid data, a privilege audit, and account deletion.
  - The suite was mutation-checked: four deliberately introduced security holes were each caught.
- **Configuration:** env parsing (AI is optional), plan limits with no hardcoded prices, a brand file, and design tokens.

### Written but not yet run

- Next.js, Tailwind, Supabase client, ESLint and Playwright config, plus the root layout and a holding page. Dependencies couldn't be installed in the build environment, so `npm install && npm run build` has **not yet been run**.
- In the build environment the unit tests ran through a small `node:test` adapter, because Vitest couldn't be installed. Running `npm test` with real Vitest is the first check to do after installing.

### Not started (next)

- Design-system components, landing page, registration/onboarding, login and dashboard shell. These are held back until they can be compiled and visually reviewed.

## Known limitations

- Package versions in `package.json` are caret ranges. The first `npm install` fixes them in `package-lock.json`.
- Display names are format-validated but not yet profanity-filtered. A word filter is needed before any public leaderboard.
- Topic relevance of AI questions is checked only by the model echoing the topic. True relevance checking would need a second review pass or a human.
- The database tests use a stand-in for Supabase's `auth` schema. They should also run against `supabase start` locally before release.

## Needs adult / professional review before school deployment

- **UK GDPR and the ICO Age Appropriate Design Code (Children's Code):** a DPIA, lawful basis, parental consent where needed (the age of digital consent is 13 in the UK), retention periods, and the privacy notice wording.
- **School procurement:** data processing agreements with Supabase, Vercel and the AI provider, data residency, and safeguarding policies (KCSIE).
- **AI content:** an accuracy-review process and a reporting mechanism for incorrect questions.
- **Trademark and domain check** for the product name.

Nothing in this repository claims legal compliance.
