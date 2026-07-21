/** Forward Field Report signups to StayRelevant partner enroll. */

export type EnrollBody = {
  email: string
  industry?: string | null
  role?: string | null
  focusAreas?: string[] | null
  sourceRef?: string | null
}

export type ForwardResult = {
  status: number
  json: Record<string, unknown>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function forwardPartnerEnroll(body: EnrollBody): Promise<ForwardResult> {
  const email = body.email?.trim().toLowerCase() ?? ''
  if (!EMAIL_RE.test(email)) {
    return { status: 400, json: { error: 'invalid email' } }
  }

  const base = process.env.STAYRELEVANT_URL?.replace(/\/$/, '')
  const secret =
    process.env.STAYRELEVANT_PARTNER_SECRET ?? process.env.PARTNER_SECRET

  if (!base || !secret) {
    return {
      status: 503,
      json: { error: 'newsletter enroll not configured' },
    }
  }

  const industry =
    (typeof body.industry === 'string' && body.industry.trim()) ||
    'Higher education'
  const role =
    (typeof body.role === 'string' && body.role.trim()) ||
    'Student exploring careers'
  const focusAreas = Array.isArray(body.focusAreas)
    ? body.focusAreas.filter((v): v is string => typeof v === 'string').slice(0, 12)
    : []

  const res = await fetch(`${base}/api/partner/enroll`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      industry,
      role,
      focusAreas: focusAreas.length ? focusAreas : ['AI literacy', 'career planning'],
      source: 'field-report',
      sourceRef:
        typeof body.sourceRef === 'string' ? body.sourceRef.slice(0, 80) : null,
    }),
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { status: res.status, json }
}
