# Personal Budget Dashboard

A self-hostable personal budgeting app: monthly spend vs. budget by category,
a savings goal, recent transactions, upcoming bills, and an optional
logging-streak/badges panel. Built with Next.js (App Router), Prisma +
PostgreSQL, and Auth.js credentials-based login.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- PostgreSQL via Prisma ORM 7 (driver adapter: `@prisma/adapter-pg`)
- Auth.js (NextAuth v5) — email/password (Credentials provider), JWT sessions
- Docker Compose for self-hosting (app + Postgres)

## Local development

Requires Node 20+ and Docker.

```bash
npm install
docker compose up -d db          # local Postgres on :5432
cp .env.example .env              # then edit AUTH_SECRET
npx prisma migrate deploy
npx prisma db seed                # optional: demo data
npm run dev
```

App runs at http://localhost:3000. The seed script creates a demo account:

- Email: `aiman@example.com`
- Password: `password123`

Generate a real `AUTH_SECRET` with `openssl rand -base64 32`.

## Project structure

- `src/app/(app)/` — authenticated routes: `dashboard`, `bills`,
  `settings/categories`, sharing a layout that applies the user's accent
  color/density as CSS variables (`src/components/theme-vars.tsx`).
- `src/app/login`, `src/app/register` — public auth pages.
- `src/auth.ts` — Auth.js config (Credentials provider, JWT callbacks).
- `proxy.ts` — route protection (Next.js 16 renamed `middleware.ts` to
  `proxy.ts`; functionally the same).
- `src/lib/dal.ts` — session verification / current-user data access layer.
- `src/lib/actions/` — Server Actions for auth, transactions, bills, and
  settings mutations.
- `prisma/schema.prisma` — `User`, `Category`, `Transaction`, `Bill`,
  `SavingsGoal`, `StreakLog`.

## Testing & CI

```bash
npm test               # unit tests (Vitest)
npm run test:watch     # watch mode
npm run test:coverage  # + coverage report
npm run ci             # everything CI runs: generate, lint, typecheck, test, build
npm run ci:fast        # same, minus the production build
```

`scripts/ci.sh` is the single source of truth for the verification gate — the
GitHub Actions workflow in `.github/workflows/ci.yml` runs the same steps, so a
green local run means a green pipeline.

Tests live next to what they cover (`src/lib/cycle.test.ts`). Two kinds:

- **Pure logic** (`cycle`, `currency`) — called directly.
- **Server Actions and data loaders** (`src/lib/actions/`, `dashboard`,
  `history`) — Prisma, `verifySession`, and `next/cache` are mocked, so the
  suite needs no database. Assertions cover validation, ringgit→cents
  conversion, and that every query is scoped to the session user.

Two things worth knowing:

- `TZ=Asia/Kuala_Lumpur` is pinned by the test scripts. Billing-cycle maths and
  `en-MY` date formatting are timezone sensitive, and CI runners are UTC.
- Coverage on `src/lib/**` is gated at 85%. Components are reported but not
  gated — most are markup, and `next build` typechecks them.

The CI workflow also runs migrations against a real Postgres and fails if
`schema.prisma` has drifted from the committed migrations.

### Shipping a change

`main` is protected: direct pushes are rejected and `verify` + `migrations`
must pass before anything merges. The rest is automated — push a branch and a
PR is opened for it, with auto-merge enabled:

```bash
git checkout -b fix-something
npm run ci:fast          # optional, but cheaper than a failed CI run
git push -u origin fix-something
```

CI runs, and if it goes green the PR squash-merges itself and the branch is
deleted. If a check fails the PR stays open — push a fix to the same branch and
it re-evaluates.

Note that CI is the only gate on `main`, so treat a red check as a stop sign
rather than something to override. The app container runs `prisma migrate
deploy` on boot, which means a schema change that merges is a schema change
that applies on your next deploy.

## Database

Prisma 7 requires a driver adapter at runtime (no implicit `datasource.url`
in `PrismaClient`) — see `src/lib/prisma.ts`. Migrations still read
`DATABASE_URL` via `prisma.config.ts`.

Common commands:

```bash
npx prisma migrate dev --name <change>   # create + apply a migration (dev)
npx prisma migrate deploy                # apply migrations (prod)
npx prisma db seed                       # re-run the seed script
npx prisma studio                        # browse data
```

## Deploying to your own server

```bash
cp .env.example .env   # set a real AUTH_SECRET
export AUTH_SECRET=$(openssl rand -base64 32)
export AUTH_URL=https://YOUR_DOMAIN
docker compose --profile prod up -d --build
```

This starts Postgres and the app in one Compose project. The app container
runs `prisma migrate deploy` on boot, then starts the server. Put a reverse
proxy (nginx/Caddy) in front of port 3000 for TLS.

`AUTH_TRUST_HOST=true` is set for the app service — required by Auth.js
when running behind a reverse proxy instead of on Vercel. Set `AUTH_URL` to
your real domain too: without it, Auth.js infers the base URL from request
headers, which can resolve to the container's internal `localhost:3000` if
your reverse proxy doesn't forward `Host`/`X-Forwarded-*` correctly — causing
Google login to redirect to `localhost` after auth instead of your domain.

## Notes on this Next.js/Prisma version

This scaffold uses Next.js 16 and Prisma 7, both of which shipped breaking
changes after most training data cutoffs:

- Next.js: `middleware.ts` → `proxy.ts` (same behavior, new file name).
- Prisma: `datasource.url` moved out of `schema.prisma` into
  `prisma.config.ts`; `PrismaClient` now requires an explicit driver
  adapter (`@prisma/adapter-pg` here) instead of reading `DATABASE_URL`
  implicitly.

See `node_modules/next/dist/docs/` and the Prisma skills under
`.claude/skills/` if extending this further.
