# Architecture

## Layers

| Layer | Where | Rule |
| --- | --- | --- |
| Presentation | `src/components/ui`, `src/app/**/page.tsx` | No business logic; props in, events out |
| Features | `src/features/<feature>` | Composes UI with server actions; one folder per feature |
| Domain | `src/domain` | Pure TypeScript with no framework imports, fully unit-tested |
| Server services | `src/server` | `import "server-only"`; the only place secrets and the service-role client are used |
| Data | `supabase/migrations` | Schema, constraints, RLS, privileges, and the authoritative game/XP functions |

Data crossing a boundary is validated: Zod for request bodies, and `src/domain/question-validation.ts` for AI output.

## Security model

- The browser uses the **anon key** only. Every table has RLS enabled, and client roles get **SELECT only**, scoped to their own rows. There are two exceptions: a student can edit four profile fields (column-level grants) and choose their subjects.
- **All writes that matter** go through `SECURITY DEFINER` Postgres functions that read `auth.uid()`. That covers starting a game, submitting an answer, scoring, awarding XP and finishing a quiz. A request forged from the browser can only call those functions, and they enforce the rules.
- **Answer keys** live in `question_answers`, which no client role can read at all. Each multiplayer round copies the answer into `room_rounds` only when the round closes. The order of upcoming questions (`room_question_plan`) is private too.
- **XP** is a ledger (`xp_events`), unique per (player, source, source id), so retries and replays can't pay out twice. `profiles.xp` is updated by trigger and isn't client-writable.
- Supabase grants new public tables to client roles by default. Every migration revokes these grants explicitly, and `tests/db/security.test.sql` fails if any table ends up with unexpected client write access or without RLS.

## Multiplayer design (implemented in Stage 3)

- **Server-authoritative timing.** The server sets `room_rounds.started_at` and `deadline_at` using database `now()`. A submission is accepted only while `now() <= deadline_at`, and the speed bonus is computed from server time.
- **Lazy round progression.** A deadline can pass without anyone polling, so any room member's client may call `advance_room(room_id)`. That call closes the round if the deadline has passed or everyone has answered, reveals the answer, and opens the next round. As a result, a host who disconnects can't freeze a game, and nobody can advance a round early.
- **Realtime as a signal, not a source of truth.** Clients subscribe to `game_rooms`, `room_players` and `room_rounds` changes, and RLS limits those events to members. Clients render from the rows themselves and never from client-computed state.
- **Scoring** is 100 points for a correct answer plus up to 50 for speed. It lives in `src/domain/scoring.ts` and is mirrored in SQL, with a parity test.
- **Room codes** are 6 characters from an alphabet with no vowels or look-alikes, and a code is unique among active rooms only.

## Decisions worth knowing

- **Postgres functions over an API-layer game engine.** This gives atomicity (row locks stop race conditions on simultaneous answers) and keeps the rules enforced even if someone calls Supabase directly with a student's token.
- **Tailwind v4 `@theme` tokens** in `src/app/globals.css` are the single source of colours, radii, shadows and motion timings.
- **Fonts:** Bricolage Grotesque (display), Figtree (body), JetBrains Mono (room codes), loaded with `next/font` so there's no layout shift.
