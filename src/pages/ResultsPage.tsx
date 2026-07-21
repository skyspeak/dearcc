import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useData } from '../data/DataContext'
import { DigestSignup } from '../components/DigestSignup'
import { ShareSheet } from '../components/ShareSheet'
import { formatNumber, formatRatio, formatSalary, formatShare } from '../lib/format'
import {
  AI_BAND_COPY,
  COMPETITION_COPY,
  ELOUNDOU_BAND_COLORS,
  ELOUNDOU_COPY,
  aiBandFromScore,
} from '../lib/labels'
import type {
  AiMode,
  CompetitionLevel,
  EloundouScore,
  Occupation,
  SortDirection,
  SortField,
} from '../types'

export function ResultsPage({ aiMode = 'default' }: { aiMode?: AiMode }) {
  const { cipCode = '' } = useParams()
  const { majors, occupationsBySoc, crosswalk, eloundouBySoc, loading } = useData()
  const isV2 = aiMode === 'eloundou'
  const home = isV2 ? '/v2' : '/'
  const mapBase = isV2 ? '/v2/map' : '/map'

  const [sortField, setSortField] = useState<SortField>('entrySalary')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const major = useMemo(
    () => majors.find((m) => m.cip === cipCode),
    [majors, cipCode],
  )

  const { relevant, other } = useMemo(() => {
    const entry = crosswalk[cipCode]
    if (!entry) return { relevant: [] as Occupation[], other: [] as Occupation[] }

    const primarySet = new Set(entry.primary)
    const allSocs = [...entry.primary, ...entry.related]
    const seen = new Set<string>()
    const list: Occupation[] = []

    for (const soc of allSocs) {
      if (seen.has(soc)) continue
      seen.add(soc)
      const occ = occupationsBySoc.get(soc)
      if (occ) list.push(occ)
    }

    const sorted = [...list].sort((a, b) =>
      compareOcc(a, b, sortField, sortDirection, eloundouBySoc),
    )
    return {
      relevant: sorted.filter((o) => primarySet.has(o.soc)),
      other: sorted.filter((o) => !primarySet.has(o.soc)),
    }
  }, [cipCode, crosswalk, occupationsBySoc, sortField, sortDirection, eloundouBySoc])

  function onSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(
        field === 'graduatesPerOpening' ||
          field === 'karpathyExposure' ||
          field === 'eloundouBeta'
          ? 'asc'
          : 'desc',
      )
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-muted">Loading data...</div>
    )
  }

  if (!major) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link to={home} className="text-sm text-muted hover:text-ink mb-6 inline-block">
          ← Back
        </Link>
        <h1 className="font-serif text-3xl text-ink">Major not found</h1>
        <p className="text-muted mt-2">
          Try searching for another field of study in the header.
        </p>
      </div>
    )
  }

  const all = [...relevant, ...other]
  const aiSortField: SortField = isV2 ? 'eloundouBeta' : 'karpathyExposure'

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
      <Link to={home} className="text-sm text-muted hover:text-ink mb-6 inline-block">
        ← Back
      </Link>

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2 break-words">
            {major.category} · CIP {major.cip}
            {isV2 ? ' · LLM Risk' : ''}
          </p>
          <h1 className="font-serif text-2xl sm:text-4xl text-ink tracking-tight text-balance">
            {major.name.replace(/\.$/, '')}
          </h1>
          <p className="text-muted mt-3 max-w-xl text-sm sm:text-base">
            {isV2
              ? 'BLS wages plus LLM Risk (share of tasks exposed to LLMs).'
              : 'Occupations linked to this major, with BLS entry wages, openings, competition, and AI exposure.'}
          </p>
        </div>
        <div className="shrink-0 w-full sm:w-auto sm:pt-6">
          <ShareSheet
            title={major.name.replace(/\.$/, '')}
            summary={
              isV2
                ? 'BLS wages and LLM Risk for careers linked to this major — from dear[CC] Field report.'
                : 'BLS salaries, openings, and AI exposure for careers linked to this major — from dear[CC] Field report.'
            }
          />
        </div>
      </div>

      {all.length === 0 ? (
        <p className="text-muted">No occupations found for this major.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm overflow-x-auto pb-1 -mx-1 px-1">
            <span className="text-muted">Sort:</span>
            <SortChip
              active={sortField === 'entrySalary'}
              label="Entry Salary"
              onClick={() => onSort('entrySalary')}
            />
            <SortChip
              active={sortField === 'openPositions'}
              label="Openings"
              onClick={() => onSort('openPositions')}
            />
            <SortChip
              active={sortField === 'graduatesPerOpening'}
              label="Competition"
              onClick={() => onSort('graduatesPerOpening')}
            />
            <SortChip
              active={sortField === aiSortField}
              label={isV2 ? 'LLM Risk' : 'AI Risk'}
              onClick={() => onSort(aiSortField)}
            />
          </div>

          {relevant.length > 0 && (
            <OccupationTable
              title="Primary occupations"
              occupations={relevant}
              sortField={sortField}
              onSort={onSort}
              aiMode={aiMode}
              mapBase={mapBase}
              eloundouBySoc={eloundouBySoc}
            />
          )}
          {other.length > 0 && (
            <div className="mt-10">
              <OccupationTable
                title="Related occupations"
                occupations={other}
                sortField={sortField}
                onSort={onSort}
                aiMode={aiMode}
                mapBase={mapBase}
                eloundouBySoc={eloundouBySoc}
              />
            </div>
          )}

          <DigestSignup
            industry={major.category}
            role={`Student exploring ${major.name.replace(/\.$/, '')}`}
            focusAreas={[major.name.replace(/\.$/, ''), major.category, 'AI literacy']}
            sourceRef={`cip:${major.cip}`}
          />
        </>
      )}
    </div>
  )
}

function SortChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'text-muted hover:text-ink bg-white border border-border'
      }`}
    >
      {label}
    </button>
  )
}

function OccupationTable({
  title,
  occupations,
  sortField,
  onSort,
  aiMode,
  mapBase,
  eloundouBySoc,
}: {
  title: string
  occupations: Occupation[]
  sortField: SortField
  onSort: (f: SortField) => void
  aiMode: AiMode
  mapBase: string
  eloundouBySoc: Map<string, EloundouScore>
}) {
  const isV2 = aiMode === 'eloundou'
  const aiField: SortField = isV2 ? 'eloundouBeta' : 'karpathyExposure'

  return (
    <section>
      <h2 className="font-serif text-xl text-ink mb-4">{title}</h2>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {occupations.map((occ, i) => (
          <OccCard
            key={occ.soc}
            occ={occ}
            index={i}
            aiMode={aiMode}
            mapBase={mapBase}
            eloundou={eloundouBySoc.get(occ.soc)}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Occupation</th>
              <Th field="entrySalary" current={sortField} onSort={onSort}>
                Entry Salary
              </Th>
              <Th field="openPositions" current={sortField} onSort={onSort}>
                Openings
              </Th>
              <Th field="graduatesPerOpening" current={sortField} onSort={onSort}>
                Competition
              </Th>
              <Th field={aiField} current={sortField} onSort={onSort}>
                {isV2 ? 'LLM Risk' : 'AI Risk'}
              </Th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {occupations.map((occ, i) => (
              <OccRow
                key={occ.soc}
                occ={occ}
                index={i}
                aiMode={aiMode}
                mapBase={mapBase}
                eloundou={eloundouBySoc.get(occ.soc)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Th({
  children,
  field,
  current,
  onSort,
}: {
  children: string
  field: SortField
  current: SortField
  onSort: (f: SortField) => void
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`hover:text-ink transition-colors ${
          current === field ? 'text-primary' : ''
        }`}
      >
        {children}
      </button>
    </th>
  )
}

function OccRow({
  occ,
  index,
  aiMode,
  mapBase,
  eloundou,
}: {
  occ: Occupation
  index: number
  aiMode: AiMode
  mapBase: string
  eloundou?: EloundouScore
}) {
  const competition = occ.competitionLevel as CompetitionLevel | null
  const compMeta = competition ? COMPETITION_COPY[competition] : null
  const isV2 = aiMode === 'eloundou'

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
      className="border-t border-border hover:bg-surface/80 group"
    >
      <td className="px-4 py-4">
        <div className="font-medium text-ink">{occ.title}</div>
        <div className="text-xs text-muted font-mono mt-0.5">SOC {occ.soc}</div>
      </td>
      <td className="px-4 py-4">
        <div className="font-mono text-ink">{formatSalary(occ.entrySalary)}</div>
        <div className="text-xs text-muted mt-0.5">
          median {formatSalary(occ.medianSalary)}
        </div>
      </td>
      <td className="px-4 py-4 font-mono text-ink/80">
        {formatNumber(occ.openPositions)}
      </td>
      <td className="px-4 py-4">
        {compMeta ? (
          <div title={compMeta.blurb}>
            <span style={{ color: compMeta.color }} className="font-medium">
              {compMeta.label}
            </span>
            <div className="text-xs text-muted font-mono mt-0.5">
              {formatRatio(occ.graduatesPerOpening)} grads/opening
            </div>
          </div>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-4">
        {isV2 ? <EloundouCell score={eloundou} /> : <KarpathyCell occ={occ} />}
      </td>
      <td className="px-4 py-4 text-right">
        <Link
          to={`${mapBase}/${occ.soc}`}
          className="text-primary hover:text-primary-bright text-xs font-medium"
        >
          Map →
        </Link>
      </td>
    </motion.tr>
  )
}

function OccCard({
  occ,
  index,
  aiMode,
  mapBase,
  eloundou,
}: {
  occ: Occupation
  index: number
  aiMode: AiMode
  mapBase: string
  eloundou?: EloundouScore
}) {
  const competition = occ.competitionLevel as CompetitionLevel | null
  const compMeta = competition ? COMPETITION_COPY[competition] : null
  const isV2 = aiMode === 'eloundou'

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
      className="rounded-xl border border-border bg-white p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-ink leading-snug">{occ.title}</h3>
          <p className="text-xs text-muted font-mono mt-0.5">SOC {occ.soc}</p>
        </div>
        <Link
          to={`${mapBase}/${occ.soc}`}
          className="shrink-0 text-primary text-sm font-medium py-1"
        >
          Map →
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Entry salary</dt>
          <dd className="font-mono text-ink mt-0.5">{formatSalary(occ.entrySalary)}</dd>
          <p className="text-[11px] text-muted mt-0.5">
            median {formatSalary(occ.medianSalary)}
          </p>
        </div>
        <div>
          <dt className="text-xs text-muted">Openings</dt>
          <dd className="font-mono text-ink mt-0.5">{formatNumber(occ.openPositions)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Competition</dt>
          <dd className="mt-0.5">
            {compMeta ? (
              <>
                <span style={{ color: compMeta.color }} className="font-medium">
                  {compMeta.label}
                </span>
                <p className="text-[11px] text-muted font-mono mt-0.5">
                  {formatRatio(occ.graduatesPerOpening)} grads/opening
                </p>
              </>
            ) : (
              <span className="text-muted">—</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{isV2 ? 'LLM Risk' : 'AI Risk'}</dt>
          <dd className="mt-0.5">
            {isV2 ? <EloundouCell score={eloundou} /> : <KarpathyCell occ={occ} />}
          </dd>
        </div>
      </dl>
    </motion.article>
  )
}

function KarpathyCell({ occ }: { occ: Occupation }) {
  const band = aiBandFromScore(occ.karpathyExposure)
  const aiBlurb =
    occ.karpathyRationale ||
    AI_BAND_COPY[band] ||
    'Band-level explanation; no per-title rationale available.'

  return (
    <div title={aiBlurb}>
      <span className="font-mono text-ink">
        {occ.karpathyExposure != null ? `${occ.karpathyExposure}/10` : '—'}
      </span>
      <div className="text-xs text-muted mt-0.5">{band}</div>
    </div>
  )
}

function EloundouCell({ score }: { score?: EloundouScore }) {
  if (!score || score.gptBeta == null) {
    return <span className="text-muted" title="No Eloundou match for this SOC">—</span>
  }
  const tip = [
    ELOUNDOU_COPY,
    `α ${formatShare(score.gptAlpha)} · β ${formatShare(score.gptBeta)} · γ ${formatShare(score.gptGamma)}`,
    score.humanBeta != null ? `Human β ${formatShare(score.humanBeta)}` : null,
    `Averaged from ${score.onetCount} O*NET code(s)`,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div title={tip}>
      <span className="font-mono text-ink">{formatShare(score.gptBeta)}</span>
      <div
        className="text-xs mt-0.5 font-medium"
        style={{ color: score.band ? ELOUNDOU_BAND_COLORS[score.band] : undefined }}
      >
        {score.band ?? '—'}
      </div>
      <div className="text-[10px] text-muted font-mono mt-0.5">
        α {formatShare(score.gptAlpha)} · γ {formatShare(score.gptGamma)}
      </div>
    </div>
  )
}

function compareOcc(
  a: Occupation,
  b: Occupation,
  field: SortField,
  direction: SortDirection,
  eloundouBySoc: Map<string, EloundouScore>,
): number {
  const av =
    field === 'eloundouBeta'
      ? (eloundouBySoc.get(a.soc)?.gptBeta ?? null)
      : a[field as keyof Occupation]
  const bv =
    field === 'eloundouBeta'
      ? (eloundouBySoc.get(b.soc)?.gptBeta ?? null)
      : b[field as keyof Occupation]

  const aNum = typeof av === 'number' ? av : null
  const bNum = typeof bv === 'number' ? bv : null
  const aMissing = aNum == null || Number.isNaN(aNum)
  const bMissing = bNum == null || Number.isNaN(bNum)
  if (aMissing && bMissing) return a.title.localeCompare(b.title)
  if (aMissing) return 1
  if (bMissing) return -1
  const cmp = aNum === bNum ? a.title.localeCompare(b.title) : aNum - bNum
  return direction === 'asc' ? cmp : -cmp
}
