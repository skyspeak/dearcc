import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { forwardPartnerEnroll } from './api/_lib/forwardEnroll.js'

/** Load .env.local keys into process.env for the local subscribe middleware. */
function loadLocalEnv() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

function subscribeDevApi(): Plugin {
  return {
    name: 'field-report-subscribe-api',
    configureServer(server) {
      loadLocalEnv()
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url?.split('?')[0] !== '/api/subscribe') {
          next()
          return
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(Buffer.from(chunk))
        let body: Record<string, unknown> = {}
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'invalid json' }))
          return
        }
        try {
          const result = await forwardPartnerEnroll({
            email: typeof body.email === 'string' ? body.email : '',
            industry: typeof body.industry === 'string' ? body.industry : null,
            role: typeof body.role === 'string' ? body.role : null,
            focusAreas: Array.isArray(body.focusAreas) ? (body.focusAreas as string[]) : null,
            sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : null,
          })
          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result.json))
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'enrollment failed' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), subscribeDevApi()],
})
