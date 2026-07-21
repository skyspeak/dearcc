// POST /api/subscribe — email capture → StayRelevant partner/enroll

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { forwardPartnerEnroll } from './_lib/forwardEnroll.js'

export const config = { maxDuration: 300 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
    const result = await forwardPartnerEnroll({
      email: typeof body.email === 'string' ? body.email : '',
      industry: typeof body.industry === 'string' ? body.industry : null,
      role: typeof body.role === 'string' ? body.role : null,
      focusAreas: Array.isArray(body.focusAreas) ? body.focusAreas : null,
      sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : null,
    })
    res.status(result.status).json(result.json)
  } catch {
    res.status(500).json({ error: 'enrollment failed' })
  }
}
