# Questlight

Quizzes, flashcards and live games for GCSE students, connected so that every answer helps decide what to study next.

> **Status: Stage 1 of 6 (brand and foundation).** The public site, accounts, the app shell, the database and its security rules are built. Quizzes, flashcards, live games and AI come next. See [docs/STATUS.md](docs/STATUS.md).

"Questlight" is a working name ([docs/BRAND.md](docs/BRAND.md)). Change it in `src/config/brand.ts`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Motion for React · Supabase (Auth, Postgres, Realtime) · Zod · Vitest · Playwright · Vercel

## Quick start

```bash
npm install                      # resolves and locks dependency versions
cp .env.example .env.local       # then fill in Supabase keys (docs/SETUP.md)
npm run dev                      # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | Strict TypeScript check |
| `npm test` | Unit tests (Vitest) |
| `npm run test:db` | Applies all migrations to a throwaway local Postgres and runs the security/integrity suite (needs PostgreSQL 15+ server binaries) |
| `npm run test:e2e` | End-to-end tests (Playwright, desktop and mobile) |
| `npm run check` | Typecheck, lint and unit tests |

## Project layout

```
src/
  app/              Routes (App Router) and global styles / design tokens
  components/       Design-system pieces (ui/), logo, learning components
  features/         Feature modules: auth, settings, app shell, landing, progress
  domain/           Pure business rules: scoring, XP, room codes, validation
  lib/              Env parsing, Supabase clients
  server/           Server-only services (never imported by client code)
  config/           Brand and plan configuration
supabase/migrations Schema, RLS, privileges, reference data
tests/unit          Vitest unit tests for src/domain and src/lib
tests/db            Database security suite (plain SQL, real Postgres)
tests/e2e           Playwright journeys (from Stage 2)
docs/               Setup, architecture, status and known limitations
```

## Documentation

- [docs/BRAND.md](docs/BRAND.md): name candidates, visual identity, design rules
- [docs/SETUP.md](docs/SETUP.md): Supabase, environment variables, Vercel, AI provider
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): layers, security model, multiplayer design
- [docs/STATUS.md](docs/STATUS.md): stage report, known limitations, items needing professional review
