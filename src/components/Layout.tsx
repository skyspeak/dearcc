import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'
import { MajorSearch } from './MajorSearch'
import { useData } from '../data/DataContext'

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { majors, loading } = useData()
  const isV2 = pathname.startsWith('/v2')
  const isPlan = pathname.startsWith('/plan')
  const home = isV2 ? '/v2' : '/'
  const isHome = pathname === '/' || pathname === '/v2'
  const resultsBase = isV2 ? '/v2/results' : '/results'
  const showGlobalSearch = !isHome && !isPlan && !loading && majors.length > 0

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {isV2 && (
        <div className="bg-ink text-white text-xs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="leading-snug min-w-0">
              <span className="font-mono text-primary-bright">/v2</span>
              <span className="sm:hidden"> · LLM Risk preview</span>
              <span className="hidden sm:inline">
                {' — '}
                AI column = <span className="font-medium">LLM Risk</span> (Eloundou et al.
                GPT-4 exposure, GPTs-are-GPTs), not Frey &amp; Osborne / Karpathy.
              </span>
            </span>
            <Link to="/" className="underline text-white/80 hover:text-white shrink-0">
              Switch to v1
            </Link>
          </div>
        </div>
      )}

      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div
          className={`mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 ${
            showGlobalSearch
              ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6'
              : 'flex items-center gap-3 sm:gap-6'
          }`}
        >
          <Link to={home} className="no-underline shrink-0 self-start sm:self-auto">
            <BrandMark size="sm" compact={showGlobalSearch} />
          </Link>

          {showGlobalSearch ? (
            <div className="w-full min-w-0 sm:flex-1 sm:max-w-xl sm:ml-auto">
              <MajorSearch
                majors={majors}
                size="md"
                resultsBase={resultsBase}
                placeholder="Search a major…"
              />
            </div>
          ) : (
            <p className="hidden sm:block text-xs text-muted max-w-xs text-right leading-snug ml-auto">
              {isPlan
                ? 'Game Plan · gap analysis & roadmap'
                : isV2
                  ? 'v2 preview · LLM Risk index'
                  : 'Salaries, openings & AI-exposure for every U.S. major.'}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 min-w-0">{children}</main>

      <footer className="border-t border-border mt-auto bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between text-sm">
          <div className="min-w-0">
            <p className="font-serif text-ink/70">
              © {new Date().getFullYear()} dear[CC] Field report
            </p>
            <p className="text-muted mt-2 max-w-2xl leading-relaxed text-xs sm:text-sm">
              Salaries & openings: BLS OEWS May 2024. Growth: 10-year BLS projections
              (2024–2034). Competition: IPEDS completions ÷ BLS openings.{' '}
              {isV2 ? (
                <>
                  AI exposure (v2): Eloundou et al. (2023){' '}
                  <a
                    className="underline hover:text-ink"
                    href="https://github.com/openai/GPTs-are-GPTs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GPTs-are-GPTs
                  </a>{' '}
                  GPT-4 β = E1 + 0.5·E2, aggregated O*NET → SOC.
                </>
              ) : (
                <>
                  AI exposure: Karpathy/BLS OOH (LLM-scored 2025) + Frey & Osborne (2013
                  baseline).
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted text-xs">
            <a
              className="hover:text-ink underline"
              href="https://www.bls.gov/oes/"
              target="_blank"
              rel="noopener noreferrer"
            >
              BLS OEWS
            </a>
            {isV2 ? (
              <a
                className="hover:text-ink underline"
                href="https://github.com/openai/GPTs-are-GPTs"
                target="_blank"
                rel="noopener noreferrer"
              >
                GPTs-are-GPTs
              </a>
            ) : (
              <a
                className="hover:text-ink underline"
                href="https://www.bls.gov/emp/"
                target="_blank"
                rel="noopener noreferrer"
              >
                BLS Projections
              </a>
            )}
            <a
              className="hover:text-ink underline"
              href="https://www.onetcenter.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              O*NET
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
