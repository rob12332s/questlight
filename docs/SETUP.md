# Setup

## 1. Requirements

- Node.js 20.9 or newer (22 LTS recommended)
- A free Supabase account: <https://supabase.com>
- Optional: PostgreSQL 15+ installed locally, so you can run `npm run test:db`
- Optional: an API key for one AI provider (see section 5)

## 2. Supabase project

1. Create a new project. Pick the region closest to your users (London for UK schools).
2. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role / secret key → `SUPABASE_SERVICE_ROLE_KEY` (**server only, never share or commit**)
3. Apply the migrations. Pick one:
   - **Supabase CLI** (recommended): `npx supabase login`, `npx supabase link --project-ref <ref>`, then `npx supabase db push`
   - **SQL editor**: paste each file from `supabase/migrations/` **in filename order** and run it.
4. **Authentication → Providers → Email**: keep email sign-up enabled. For production, leave "Confirm email" on.
5. **Authentication → URL Configuration**: set Site URL to your deployed URL, and add `http://localhost:3000/**` to the redirect URLs.

## 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in the values from step 2. Only variables starting with `NEXT_PUBLIC_` ever reach the browser.

## 4. Deploying to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project**, import the repo, and keep the framework preset on Next.js.
3. Add the same environment variables in **Settings → Environment Variables**, and set `NEXT_PUBLIC_SITE_URL` to the Vercel URL.
4. Deploy, then add the Vercel URL to Supabase's redirect URLs (step 2.5).

## 5. AI provider (optional)

The platform works fully without AI; AI features show a clear "not configured" state. To enable it, set `AI_PROVIDER` (`anthropic`, `openai` or `gemini`) and `AI_API_KEY`. Usage is capped per student per day (`src/config/plans.ts`) and logged in `ai_generation_logs`.

## 6. Free-tier limits to plan around

Checked November 2026. Confirm on the providers' pricing pages before launch.

**Supabase Free**
- 500 MB database, 50,000 monthly active users, 5 GB egress.
- 200 concurrent Realtime connections, which is roughly how many students can be in live battles at the same moment, and 2 million Realtime messages a month.
- Projects pause after 1 week of inactivity, and there are no backups on Free. Export data regularly, or move to Pro (from $25/month) before real users depend on it.

**Vercel Hobby**
- Hobby is for **personal, non-commercial** use. Building a prototype there is accepted, but you should move to Pro once the product is commercial (charging, or intending to charge).

**AI providers**
- Usage is billed per token, so costs grow with use. The daily caps in `src/config/plans.ts` are the main cost control.
