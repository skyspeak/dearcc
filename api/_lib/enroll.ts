import { randomBytes } from 'node:crypto'
import { prisma } from './db.js'
import { sendLetterEmail } from './email.js'
import { buildWelcomeEmail } from './letter_email.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_FIELD = 200
const MAX_ARRAY = 12

export type EnrollInput = {
  email: string
  industry?: string | null
  role?: string | null
  name?: string | null
  focusAreas?: string[] | null
  sourceRef?: string | null
}

export type EnrollResult =
  | { ok: true; skipped: 'already_enrolled' }
  | { ok: true; welcomeSent: boolean }
  | { ok: false; error: string; status: number }

function cap(s: string, n = MAX_FIELD) {
  return s.slice(0, n)
}

function normalizeFocusAreas(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of input) {
    if (typeof v !== 'string') continue
    const t = cap(v.trim(), 100)
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
    if (out.length >= MAX_ARRAY) break
  }
  return out
}

export async function enrollSubscriber(input: EnrollInput): Promise<EnrollResult> {
  const email = input.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'invalid email', status: 400 }
  }

  if (!process.env.DATABASE_URL) {
    return { ok: false, error: 'letter enroll not configured', status: 503 }
  }

  const role =
    typeof input.role === 'string' && input.role.trim()
      ? cap(input.role.trim())
      : 'Student exploring careers'
  const industry =
    typeof input.industry === 'string' && input.industry.trim()
      ? cap(input.industry.trim())
      : 'Higher education'
  const name =
    typeof input.name === 'string' && input.name.trim() ? cap(input.name.trim()) : null
  const focusAreas = normalizeFocusAreas(input.focusAreas)
  const sourceRef =
    typeof input.sourceRef === 'string' ? input.sourceRef.trim().slice(0, 80) : null

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
  if (existing && !existing.unsubscribedAt && existing.welcomeSentAt) {
    return { ok: true, skipped: 'already_enrolled' }
  }

  const token = existing?.unsubscribeToken ?? randomBytes(24).toString('hex')

  const sub = await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      name,
      role,
      industry,
      focusAreas: focusAreas.length ? focusAreas : ['AI literacy', 'career planning'],
      unsubscribeToken: token,
      sourceRef,
    },
    update: {
      ...(name ? { name } : {}),
      role,
      industry,
      ...(focusAreas.length ? { focusAreas } : {}),
      ...(sourceRef ? { sourceRef } : {}),
      unsubscribedAt: null,
    },
  })

  let welcomeSent = Boolean(sub.welcomeSentAt)
  if (!sub.welcomeSentAt) {
    if (!process.env.RESEND_API_KEY) {
      return { ok: false, error: 'RESEND_API_KEY not configured', status: 503 }
    }
    const mail = buildWelcomeEmail({
      email: sub.email,
      role: sub.role,
      unsubscribeToken: sub.unsubscribeToken,
    })
    await sendLetterEmail({
      to: sub.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })
    await prisma.newsletterSubscriber.update({
      where: { id: sub.id },
      data: { welcomeSentAt: new Date() },
    })
    welcomeSent = true
  }

  return { ok: true, welcomeSent }
}
