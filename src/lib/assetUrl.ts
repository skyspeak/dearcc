/** Resolve a public asset path against Vite's base (e.g. `/dearcc/` on GitHub Pages). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}
