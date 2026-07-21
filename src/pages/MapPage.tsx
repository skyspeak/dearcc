import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { scaleSequential } from 'd3-scale'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Geometry } from 'geojson'
import { motion } from 'framer-motion'
import { useData } from '../data/DataContext'
import { formatNumber, formatSalary, formatShare } from '../lib/format'
import type { AiMode, MapColorBy } from '../types'

interface StateProps {
  name?: string
}

const FIPS_TO_ABBR: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
  '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
  '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY',
}

export function MapPage({ aiMode = 'default' }: { aiMode?: AiMode }) {
  const { socCode = '' } = useParams()
  const { occupationsBySoc, eloundouBySoc, stateData, loading, loadStateData } = useData()
  const [colorBy, setColorBy] = useState<MapColorBy>('employment')
  const [selected, setSelected] = useState<string | null>(null)
  const [topo, setTopo] = useState<FeatureCollection<Geometry, StateProps> | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const isV2 = aiMode === 'eloundou'
  const home = isV2 ? '/v2' : '/'

  const occupation = occupationsBySoc.get(socCode)
  const eloundou = eloundouBySoc.get(socCode)

  useEffect(() => {
    void loadStateData()
  }, [loadStateData])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch('/us-states-topo.json')
      const raw = (await res.json()) as Topology<{ states: GeometryCollection }>
      const obj = raw.objects.states ?? Object.values(raw.objects)[0]
      const fc = feature(raw, obj) as unknown as FeatureCollection<Geometry, StateProps>
      if (!cancelled) setTopo(fc)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const values = useMemo(() => {
    const map: Record<string, number> = {}
    if (!stateData || !occupation) return map
    const exposure = isV2
      ? (eloundou?.gptBeta ?? 0)
      : (occupation.karpathyExposure ?? 0) / 10
    for (const [abbr, state] of Object.entries(stateData)) {
      const cell = state.occupations[socCode]
      if (!cell) continue
      if (colorBy === 'employment') map[abbr] = cell.employment
      else if (colorBy === 'salary') map[abbr] = cell.medianSalary
      else map[abbr] = cell.employment * exposure
    }
    return map
  }, [stateData, occupation, socCode, colorBy, isV2, eloundou])

  const colorScale = useMemo(() => {
    const nums = Object.values(values).filter((v) => v > 0)
    const min = nums.length ? Math.min(...nums) : 0
    const max = nums.length ? Math.max(...nums) : 1
    const interpolator =
      colorBy === 'aiImpact'
        ? (t: number) => `rgb(${Math.round(40 + t * 200)}, ${Math.round(30 + (1 - t) * 40)}, ${Math.round(40 + (1 - t) * 40)})`
        : colorBy === 'salary'
          ? (t: number) => `rgb(${Math.round(30 + t * 40)}, ${Math.round(80 + t * 120)}, ${Math.round(90 + t * 80)})`
          : (t: number) => `rgb(${Math.round(40 + t * 180)}, ${Math.round(50 + t * 60)}, ${Math.round(80 + (1 - t) * 40)})`
    return scaleSequential(interpolator).domain([min, max || 1])
  }, [values, colorBy])

  const paths = useMemo(() => {
    if (!topo) return []
    const projection = geoAlbersUsa().fitSize([960, 560], topo)
    const path = geoPath(projection)
    return topo.features.map((f) => {
      const id = String(f.id ?? '')
      const abbr =
        FIPS_TO_ABBR[id.padStart(2, '0')] ||
        FIPS_TO_ABBR[id] ||
        guessAbbr(f.properties?.name)
      const d = path(f) ?? ''
      return { abbr, name: f.properties?.name ?? abbr, d }
    })
  }, [topo])

  const ranked = useMemo(() => {
    return Object.entries(values)
      .map(([abbr, value]) => ({
        abbr,
        value,
        name: stateData?.[abbr]?.name ?? abbr,
        employment: stateData?.[abbr]?.occupations[socCode]?.employment ?? 0,
        salary: stateData?.[abbr]?.occupations[socCode]?.medianSalary ?? 0,
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [values, stateData, socCode])

  const activeAbbr = selected ?? hover
  const active = activeAbbr
    ? {
        abbr: activeAbbr,
        name: stateData?.[activeAbbr]?.name ?? activeAbbr,
        employment: stateData?.[activeAbbr]?.occupations[socCode]?.employment ?? 0,
        salary: stateData?.[activeAbbr]?.occupations[socCode]?.medianSalary ?? 0,
        value: values[activeAbbr] ?? 0,
        rank: ranked.findIndex((r) => r.abbr === activeAbbr) + 1,
      }
    : null

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-muted">Loading map data...</div>
  }

  if (!occupation) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link to={home} className="text-sm text-muted hover:text-ink mb-6 inline-block">
          ← Back
        </Link>
        <h1 className="font-serif text-3xl text-ink">Occupation not found</h1>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
      <Link to={home} className="text-sm text-muted hover:text-ink mb-6 inline-block">
        ← Back to results
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">
            SOC {occupation.soc}
            {isV2 ? ' · Eloundou β' : ''}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-tight">
            {occupation.title}
          </h1>
          <p className="text-muted mt-3 max-w-xl">
            Click any state for a deep-dive. Color by employment, median salary, or jobs ×{' '}
            {isV2 ? 'Eloundou β' : 'AI exposure'} (redder = more at risk).
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Metric label="Entry Salary" value={formatSalary(occupation.entrySalary)} />
          <Metric label="Median Salary" value={formatSalary(occupation.medianSalary)} />
          <Metric label="Total Employment" value={formatNumber(occupation.totalEmployment)} />
          {isV2 ? (
            <Metric
              label="Eloundou β"
              value={eloundou?.gptBeta != null ? formatShare(eloundou.gptBeta) : '—'}
            />
          ) : (
            <Metric label="Annual Openings" value={formatNumber(occupation.openPositions)} />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        <span className="text-muted">Color by:</span>
        {(
          [
            ['employment', 'Employment'],
            ['salary', 'Salary'],
            ['aiImpact', 'AI Impact'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setColorBy(key)}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              colorBy === key
                ? 'bg-primary text-white'
                : 'text-muted hover:text-ink bg-white border border-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-border rounded-xl p-3 sm:p-5 overflow-hidden"
        >
          {!stateData || !topo ? (
            <p className="text-muted py-20 text-center">Loading map data...</p>
          ) : (
            <svg viewBox="0 0 960 560" className="w-full h-auto" role="img" aria-label="US map">
              {paths.map((p) => {
                const v = values[p.abbr] ?? 0
                const fill = v > 0 ? colorScale(v) : '#e4e4e7'
                const isActive = activeAbbr === p.abbr
                return (
                  <path
                    key={p.abbr || p.name}
                    d={p.d}
                    fill={fill}
                    stroke={isActive ? '#141414' : '#ffffff'}
                    strokeWidth={isActive ? 2 : 0.75}
                    className="cursor-pointer transition-[stroke-width]"
                    onMouseEnter={() => setHover(p.abbr)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setSelected(p.abbr)}
                  >
                    <title>{p.name}</title>
                  </path>
                )
              })}
            </svg>
          )}
          <Legend colorBy={colorBy} values={Object.values(values).filter((v) => v > 0)} />
        </motion.div>

        <aside className="bg-white border border-border rounded-xl p-5 h-fit">
          {active ? (
            <>
              <h2 className="font-serif text-2xl text-ink">{active.name}</h2>
              <p className="text-xs text-muted font-mono mt-1">
                #{active.rank || '—'} of {ranked.length || '—'}
              </p>
              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="text-muted">Employment</dt>
                  <dd className="font-mono text-lg text-ink mt-0.5">
                    {formatNumber(active.employment)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Median salary</dt>
                  <dd className="font-mono text-lg text-ink mt-0.5">
                    {formatSalary(active.salary)}
                  </dd>
                </div>
                {colorBy === 'aiImpact' && (
                  <div>
                    <dt className="text-muted">AI impact</dt>
                    <dd className="font-mono text-lg text-ink mt-0.5">
                      {formatNumber(active.value)}
                    </dd>
                    <p className="text-xs text-muted mt-1">
                      {isV2
                        ? 'state employment × Eloundou β'
                        : 'state employment × AI exposure / 10'}
                    </p>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <p className="text-muted text-sm leading-relaxed">
              Hover or click a state to see employment and salary for{' '}
              {occupation.title.toLowerCase()}.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-border rounded-xl px-4 py-3 min-w-[120px]">
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
      <div className="font-mono text-ink mt-1">{value}</div>
    </div>
  )
}

function Legend({ colorBy, values }: { colorBy: MapColorBy; values: number[] }) {
  if (values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const label =
    colorBy === 'salary'
      ? 'Median Salary'
      : colorBy === 'aiImpact'
        ? 'Jobs at AI risk'
        : 'Employment'

  return (
    <div className="mt-4 flex items-center gap-3 text-xs text-muted">
      <span>{label}</span>
      <div
        className="h-2 flex-1 max-w-48 rounded-full"
        style={{
          background:
            colorBy === 'aiImpact'
              ? 'linear-gradient(90deg, #281e28, #e84628)'
              : colorBy === 'salary'
                ? 'linear-gradient(90deg, #1e5060, #46d0aa)'
                : 'linear-gradient(90deg, #283250, #dc7846)',
        }}
      />
      <span className="font-mono">
        {colorBy === 'salary' ? formatSalary(min) : formatNumber(min)} –{' '}
        {colorBy === 'salary' ? formatSalary(max) : formatNumber(max)}
      </span>
    </div>
  )
}

function guessAbbr(name?: string): string {
  if (!name) return ''
  const entries = Object.entries({
    Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
    Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC',
    Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
    Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
    Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
    Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
    Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
    Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
    Wyoming: 'WY',
  })
  return entries.find(([n]) => n === name)?.[1] ?? ''
}
