import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Fuse from 'fuse.js'
import { motion, AnimatePresence } from 'framer-motion'
import type { Major } from '../types'

interface MajorSearchProps {
  majors: Major[]
  size?: 'lg' | 'md'
  autoFocus?: boolean
  /** Base path for results, e.g. `/results` or `/v2/results` */
  resultsBase?: string
}

export function MajorSearch({
  majors,
  size = 'lg',
  autoFocus = false,
  resultsBase = '/results',
}: MajorSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fuse = useMemo(
    () =>
      new Fuse(majors, {
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'category', weight: 0.2 },
          { name: 'cip', weight: 0.1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [majors],
  )

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return majors.slice(0, 8)
    return fuse.search(q, { limit: 10 }).map((r) => r.item)
  }, [fuse, majors, query])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setActive(0)
  }, [query])

  function select(major: Major) {
    setQuery(major.name)
    setOpen(false)
    navigate(`${resultsBase}/${major.cip}`)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = results[active]
      if (pick) select(pick)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const pad = size === 'lg' ? 'py-4 text-lg pl-12 pr-4' : 'py-2.5 text-sm pl-10 pr-3'
  const iconLeft = size === 'lg' ? 'left-4' : 'left-3'

  return (
    <div ref={rootRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <svg
          className={`absolute ${iconLeft} top-1/2 -translate-y-1/2 text-muted pointer-events-none`}
          width={size === 'lg' ? 20 : 16}
          height={size === 'lg' ? 20 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a major — e.g. Mechanical Engineering"
          className={`w-full rounded-xl bg-white border border-border-bright text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm ${pad}`}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="major-results"
          role="combobox"
        />
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            id="major-results"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 w-full max-h-80 overflow-auto rounded-xl border border-border-bright bg-white shadow-xl"
          >
            {results.map((major, i) => (
              <li key={major.cip} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => select(major)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    i === active ? 'bg-primary/10 text-ink' : 'text-ink/80 hover:bg-surface'
                  }`}
                >
                  <div className="font-medium">{major.name.replace(/\.$/, '')}</div>
                  <div className="text-xs text-muted mt-0.5 font-mono">
                    {major.category} · CIP {major.cip}
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
