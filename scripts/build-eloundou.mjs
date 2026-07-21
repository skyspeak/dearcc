#!/usr/bin/env node
/**
 * Aggregate Eloundou et al. (GPTs are GPTs) O*NET-level ratings to 6-digit SOC.
 *
 * Source: data/raw/eloundou_occ_level.csv from
 * https://github.com/openai/GPTs-are-GPTs (occ_level.csv)
 *
 * Measures (per README):
 *   alpha = E1
 *   beta  = E1 + 0.5*E2   ← headline exposure
 *   gamma = E1 + E2
 * dv_rating_* = GPT-4; human_rating_* = human annotators
 */
import { createReadStream, writeFileSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'data/raw/eloundou_occ_level.csv')
const out = join(root, 'public/data/eloundou.json')
const occupationsPath = join(root, 'public/data/occupations.json')

function parseCsvLine(line) {
  const cols = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      cols.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  cols.push(cur)
  return cols
}

const bySoc = new Map()

const rl = createInterface({ input: createReadStream(src), crlfDelay: Infinity })
let header = null
for await (const line of rl) {
  if (!line.trim()) continue
  const cols = parseCsvLine(line)
  if (!header) {
    header = cols
    continue
  }
  const row = Object.fromEntries(header.map((h, i) => [h, cols[i]]))
  const onet = row['O*NET-SOC Code']
  if (!onet) continue
  const soc = onet.split('.')[0]
  const entry = {
    onet,
    title: row.Title,
    gptAlpha: Number(row.dv_rating_alpha),
    gptBeta: Number(row.dv_rating_beta),
    gptGamma: Number(row.dv_rating_gamma),
    humanAlpha: Number(row.human_rating_alpha),
    humanBeta: Number(row.human_rating_beta),
    humanGamma: Number(row.human_rating_gamma),
  }
  if (!bySoc.has(soc)) bySoc.set(soc, [])
  bySoc.get(soc).push(entry)
}

function avg(rows, key) {
  const vals = rows.map((r) => r[key]).filter((v) => Number.isFinite(v))
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function band(beta) {
  if (beta == null) return null
  if (beta < 0.25) return 'Low'
  if (beta < 0.45) return 'Moderate'
  if (beta < 0.65) return 'High'
  return 'Very High'
}

const eloundou = {}
for (const [soc, rows] of bySoc) {
  const gptBeta = avg(rows, 'gptBeta')
  eloundou[soc] = {
    soc,
    title: rows.find((r) => r.onet.endsWith('.00'))?.title ?? rows[0].title,
    onetCount: rows.length,
    gptAlpha: avg(rows, 'gptAlpha'),
    gptBeta,
    gptGamma: avg(rows, 'gptGamma'),
    humanAlpha: avg(rows, 'humanAlpha'),
    humanBeta: avg(rows, 'humanBeta'),
    humanGamma: avg(rows, 'humanGamma'),
    band: band(gptBeta),
  }
}

const occupations = JSON.parse(readFileSync(occupationsPath, 'utf8'))
const ourSocs = new Set(occupations.map((o) => o.soc))
const matched = [...ourSocs].filter((s) => eloundou[s]).length

const payload = {
  source: 'Eloundou et al. (2023), GPTs are GPTs — OpenAI',
  repo: 'https://github.com/openai/GPTs-are-GPTs',
  measures: {
    alpha: 'E1 — direct LLM exposure without tools',
    beta: 'E1 + 0.5·E2 — headline LLM exposure (with software)',
    gamma: 'E1 + E2 — full exposure including tool-augmented tasks',
  },
  aggregation: 'Mean of O*NET detailed codes sharing the same 6-digit SOC prefix',
  generatedAt: new Date().toISOString(),
  coverage: { occupations: ourSocs.size, matched, pct: Number(((100 * matched) / ourSocs.size).toFixed(1)) },
  bySoc: eloundou,
}

writeFileSync(out, JSON.stringify(payload))
console.log(
  `Wrote ${out} — ${Object.keys(eloundou).length} SOCs, matched ${matched}/${ourSocs.size} (${payload.coverage.pct}%)`,
)
