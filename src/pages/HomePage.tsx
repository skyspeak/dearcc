import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { MajorSearch } from '../components/MajorSearch'
import { BrandMark } from '../components/BrandMark'
import { formatNumber } from '../lib/format'
import type { AiMode } from '../types'

export function HomePage({ aiMode = 'default' }: { aiMode?: AiMode }) {
  const { majors, occupations, eloundouMeta, loading, error } = useData()
  const isV2 = aiMode === 'eloundou'
  const resultsBase = isV2 ? '/v2/results' : '/results'

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-24 pb-16 sm:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-3xl mx-auto"
      >
        <BrandMark size="lg" as="h1" />
        {isV2 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-mono text-primary">
            /v2 · LLM Risk
          </div>
        )}
        <p className="mt-5 sm:mt-6 text-lg sm:text-2xl text-ink/70 font-light leading-snug px-1">
          What&apos;s your degree actually worth?
        </p>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
          {isV2
            ? 'Same BLS wages — AI column uses Eloundou et al. (2023) GPT-4 exposure β from GPTs-are-GPTs, instead of Frey & Osborne / Karpathy.'
            : 'BLS salary data, projected annual openings, and AI-exposure scores — for every U.S. major.'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-8 sm:mt-12 flex justify-center px-0"
      >
        {loading ? (
          <p className="text-muted">Loading data...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <MajorSearch
            majors={majors}
            size="lg"
            autoFocus
            resultsBase={resultsBase}
            placeholder="Search a major…"
          />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-12 sm:mt-20 grid grid-cols-3 gap-3 sm:gap-10 max-w-lg mx-auto text-center"
      >
        <Stat value={formatNumber(occupations.length || 811)} label="Occupations" />
        <Stat value={formatNumber(majors.length || 1920)} label="Majors" />
        <Stat
          value={isV2 ? `${eloundouMeta?.coverage.pct ?? '—'}%` : '50'}
          label={isV2 ? 'LLM match' : 'States + DC'}
        />
      </motion.div>

      <p className="mt-10 sm:mt-12 text-center text-sm text-muted px-2">
        {isV2 ? (
          <>
            Comparing indexes?{' '}
            <Link to="/" className="text-primary hover:text-primary-bright underline">
              Back to v1
            </Link>
          </>
        ) : (
          <>
            Testing LLM Risk?{' '}
            <Link to="/v2" className="text-primary hover:text-primary-bright underline">
              Open /v2
            </Link>
          </>
        )}
      </p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-xl sm:text-3xl text-ink tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[10px] sm:text-sm text-muted mt-1 uppercase tracking-wider leading-tight">
        {label}
      </div>
    </div>
  )
}
