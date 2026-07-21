# dear[CC] Field report

Three-part funnel:

1. **Field Report** — search a U.S. college major → linked occupations with BLS wages, openings, competition, and AI exposure.
2. **The Letter** — Sunday email (Resend + Neon). Persona from Results/Map signup.
3. **Game Plan** — `/plan` gap analysis + roadmap (Fuse-matched BLS occupation + optional Gemini). Deep-linked from Letter emails via `?from=letter&t=<token>`.

## Develop

```bash
npm install
cp .env.example .env.local
# Fill DATABASE_URL, RESEND_*, CRON_SECRET, BASE_URL
# Optional: GEMINI_API_KEY (Letter personalization + Game Plan analysis)
npx prisma db push
npm run dev
```

Local Vite middleware covers `/api/subscribe`, `/api/plan/profile`, `/api/plan/analyze`, `/api/plan/waitlist`, `/api/plan/get`.

## Env keys (Vercel + `.env.local`)

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | Yes | Neon Postgres (subscribers + game_plans) |
| `RESEND_API_KEY` | Yes for email | Welcome + weekly sends |
| `RESEND_FROM_EMAIL` | Recommended | Verified Resend domain in prod |
| `BASE_URL` | Yes | Public site URL (unsubscribe + Game Plan CTAs) |
| `CRON_SECRET` | Yes for cron | Auth for `/api/cron/newsletter` |
| `GEMINI_API_KEY` | Optional | Letter + Game Plan personalization; template fallback without it |
| `GEMINI_MODEL` | Optional | Default `gemini-2.0-flash` |

## Deploy (Vercel)

Production host for the SPA, The Letter APIs, Game Plan APIs, and Sunday cron.

1. Import [skyspeak/dearcc](https://github.com/skyspeak/dearcc) into Vercel.
2. Set env vars from `.env.example`.
3. Deploy. Cron `0 14 * * 0` hits `/api/cron/newsletter` with `Authorization: Bearer $CRON_SECRET`.

Manual test send:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://YOUR_PROJECT.vercel.app/api/cron/newsletter?dryRun=1&limit=5"
```

## GitHub Pages

Static mirror at https://skyspeak.github.io/dearcc/ (no serverless enroll/cron/plan). Use the Vercel URL for The Letter and Game Plan.

## Game Plan routes

| Path | Role |
|------|------|
| `/plan` | Connect (Letter prefill via `?from=letter&t=`) |
| `/plan/building` | Runs `POST /api/plan/analyze` |
| `/plan/analysis` | Strengths / gaps / labor-market strip |
| `/plan/roadmap` | Milestones M1–M4 |
| `/plan/waitlist` | Cohort waitlist (`cohortWaitlistedAt`) |

## Data

See [SOURCES.md](./SOURCES.md). JSON lives in `public/data/` and refreshes with the annual BLS OEWS release.

## Stack

Vite · React · TypeScript · Tailwind v4 · React Router · Framer Motion · d3-geo · Fuse.js · Prisma · Neon · Resend · optional Gemini
