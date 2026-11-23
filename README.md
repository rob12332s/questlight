# Questlight

Live quiz battles with friends, solo revision and AI-assisted practice for primary to college students.

> **Status: Stage 1 of 6, foundation only.** The domain rules, the database schema and the security rules are built and tested. The UI hasn't been built yet. See [docs/STATUS.md](docs/STATUS.md) for what works today and what doesn't.

"Questlight" is a working name. Change it in `src/config/brand.ts`.

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
| `npm run test:e2e` | End-to-end tests (Playwright; added from Stage 2) |
| `npm run check` | Typecheck, lint and unit tests |

## Project layout

```
src/
  app/              Routes (App Router) and global styles / design tokens
  components/ui/    Reusable presentation components (Stage 1b)
  features/         Feature modules: auth, revision, battles, ai, progress
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

- [docs/SETUP.md](docs/SETUP.md): Supabase, environment variables, Vercel, AI provider
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): layers, security model, multiplayer design
- [docs/STATUS.md](docs/STATUS.md): stage report, known limitations, items needing professional review
