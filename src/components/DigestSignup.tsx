import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'

export type DigestSignupProps = {
  /** Major CIP category or similar — personalization industry */
  industry?: string
  /** Occupation title or student framing — personalization role */
  role?: string
  focusAreas?: string[]
  /** Attribution crumb, e.g. cip:11.0701 or soc:15-1252 */
  sourceRef?: string
}

type Status = 'idle' | 'sending' | 'sent' | 'skipped' | 'error'

export function DigestSignup({
  industry,
  role,
  focusAreas,
  sourceRef,
}: DigestSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          industry: industry ?? null,
          role: role ?? null,
          focusAreas: focusAreas ?? null,
          sourceRef: sourceRef ?? null,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        skipped?: string
        ok?: boolean
      }
      if (!res.ok) {
        throw new Error(data.error ?? `request failed (${res.status})`)
      }
      setStatus(data.skipped === 'already_enrolled' ? 'skipped' : 'sent')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="mt-14 border-t border-border pt-12"
    >
      <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">
        Next
      </p>
      <h2 className="font-serif text-2xl sm:text-3xl text-ink tracking-tight">
        dear
        <span className="text-primary">[</span>
        <span className="text-primary">CC</span>
        <span className="text-primary">]</span> The Letter
      </h2>
      <p className="mt-3 text-muted max-w-xl leading-relaxed">
        You just mapped the labor market. Get a 15-minute Sunday email — real AI
        news, picks for your path, and one thing to build.
      </p>

      {status === 'sent' || status === 'skipped' ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 max-w-lg rounded-xl border border-border bg-surface px-5 py-4 text-ink"
        >
          {status === 'skipped' ? (
            <>
              <p className="font-medium">{email}</p>
              <p className="mt-1 text-sm text-muted">
                You&apos;re already on the list — check your inbox for this
                week&apos;s letter.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">You&apos;re in.</p>
              <p className="mt-1 text-sm text-muted">
                Check <span className="text-ink">{email}</span> for your first
                letter. Sundays at 7pm in your timezone.
              </p>
            </>
          )}
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg"
        >
          <label className="sr-only" htmlFor="letter-email">
            Email
          </label>
          <input
            id="letter-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            disabled={status === 'sending'}
            className="flex-1 rounded-xl border border-border-bright bg-white px-4 py-3 text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="shrink-0 rounded-xl bg-primary px-5 py-3 font-medium text-white hover:bg-primary-bright disabled:opacity-50 transition-colors"
          >
            {status === 'sending' ? 'Sending…' : 'Send my first letter'}
          </button>
        </form>
      )}

      {status === 'sending' && (
        <p className="mt-3 text-xs text-muted max-w-lg">
          Writing your first letter — usually under a minute.
        </p>
      )}

      {status === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {errorMsg ?? 'Something went wrong. Try again in a minute.'}
        </p>
      )}

      {status === 'idle' && (
        <p className="mt-3 text-xs text-muted">
          One-click unsubscribe. From dear[CC].
        </p>
      )}
    </motion.section>
  )
}
