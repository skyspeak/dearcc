# dear[CC] Field report

Search a U.S. college major → see linked occupations with BLS prevailing wages, openings, competition, and AI exposure.

## Develop

```bash
npm install
npm run dev
```

## Data

See [SOURCES.md](./SOURCES.md). JSON lives in `public/data/` and refreshes with the annual BLS OEWS release.

## Stack

Vite · React · TypeScript · Tailwind v4 · React Router · Framer Motion · d3-geo

## dear[CC] The Letter

Results and map pages end with an email CTA. `POST /api/subscribe` enrolls the reader in The Letter (server-side secret).

```bash
cp .env.example .env.local
# Set LETTER_URL + LETTER_PARTNER_SECRET
```
