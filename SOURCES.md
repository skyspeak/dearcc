# Data sources

This app ships pre-joined JSON under `public/data/`.

| File | Contents | Upstream |
|------|----------|----------|
| `majors.json` | CIP majors (code, name, category) | NCES CIP |
| `occupations.json` | SOC wages, openings, competition, AI scores | BLS OEWS May 2024, BLS projections 2024–2034, IPEDS Completions, Frey & Osborne (2013), Karpathy/BLS OOH LLM scores (2025) |
| `crosswalk.json` | CIP → primary/related SOC | NCES / BLS field-of-degree style crosswalk |
| `states.json` | State × SOC employment & median wage | BLS OEWS state estimates |
| `eloundou.json` | Eloundou et al. GPT-4 exposure α/β/γ by SOC | [GPTs-are-GPTs](https://github.com/openai/GPTs-are-GPTs) `occ_level.csv` (O*NET → SOC mean) |
| `us-states-topo.json` | US state topology for the choropleth | TopoJSON |

**v2 routes** (`/v2`, `/v2/results/:cip`, `/v2/map/:soc`) swap the AI column to Eloundou β (`E1 + 0.5·E2`). Rebuild with:

```bash
node scripts/build-eloundou.mjs
```

Raw CSV lives at `data/raw/eloundou_occ_level.csv`.

**Refresh cadence:** rebuild occupation/state wage files when BLS publishes a new May OEWS release (~annually). Projections ~every 2 years. IPEDS Completions ~annually. Eloundou scores are static (2023 paper) unless OpenAI republishes.

Bootstrap wage/crosswalk data was sourced from the public Field Report dataset for an initial working product; replace with your own OEWS/IPEDS ETL for production ownership.
