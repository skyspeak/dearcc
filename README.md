# dear[CC] Field report

Search a U.S. college major → see linked occupations with BLS prevailing wages, openings, competition, and AI exposure.

## Develop

```bash
npm install
cp .env.example .env.local
# Fill DATABASE_URL, RESEND_*, CRON_SECRET, BASE_URL
npx prisma db push
npm run dev
```

## Deploy (Vercel)

Production host for the SPA, The Letter APIs, and Sunday cron.

1. Import [skyspeak/dearcc](https://github.com/skyspeak/dearcc) into Vercel.
2. Set env vars from `.env.example` (`DATABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET`, `BASE_URL`).
3. Deploy. Cron `0 14 * * 0` hits `/api/cron/newsletter` with `Authorization: Bearer $CRON_SECRET`.

Manual test send:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://YOUR_PROJECT.vercel.app/api/cron/newsletter?dryRun=1&limit=5"
```

## GitHub Pages

Static mirror at https://skyspeak.github.io/dearcc/ (no serverless enroll/cron). Use the Vercel URL for The Letter funnel.

## Data

See [SOURCES.md](./SOURCES.md). JSON lives in `public/data/` and refreshes with the annual BLS OEWS release.

## Stack

Vite · React · TypeScript · Tailwind v4 · React Router · Framer Motion · d3-geo · Prisma · Neon · Resend

## dear[CC] The Letter

Results and map CTAs call `POST /api/subscribe` (upsert `newsletter_subscribers` + welcome email). Weekly issues compose from rotating templates (optional Gemini) and send via Resend on the Sunday cron.
