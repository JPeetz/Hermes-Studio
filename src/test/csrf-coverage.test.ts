import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { rejectCrossSiteMutation } from '../server/rate-limit'

/**
 * Regression guard for CSRF coverage on mutating API routes.
 *
 * 15 of the 48 mutating route handlers shipped with no CSRF defense at all,
 * including the three that spawn processes (start-agent, start-hermes,
 * systemd-control) and the one that downloads and writes executable skill
 * content (skills/install). The suite was green throughout, because nothing
 * asserted which routes actually call a guard.
 *
 * So walk src/routes/api and require every file declaring a POST/PUT/PATCH/
 * DELETE handler to reference one of the guards. A new unguarded mutating
 * route now fails the build.
 */

const API_ROOT = path.resolve(__dirname, '../routes/api')

/**
 * Either guard is acceptable:
 *  - requireJsonContentType — for routes guaranteed a JSON body;
 *  - rejectCrossSiteMutation — Sec-Fetch-Site check, for bodiless mutations
 *    and for the proxy, which forwards arbitrary (incl. multipart) bodies.
 */
const CSRF_GUARDS = ['requireJsonContentType(', 'rejectCrossSiteMutation(']

const MUTATING = /^\s*(POST|PUT|PATCH|DELETE):/m

/**
 * Check the code, not the prose. A bare substring search is satisfied by a
 * guard that has been commented out — exactly the state a regression would
 * leave behind — so strip comments before looking, and match the call form
 * `guard(` rather than the bare name.
 */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Not `:` first, so `https://…` inside a string survives.
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function walk(dir: string): Array<string> {
  const out: Array<string> = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full))
    } else if (entry.name.endsWith('.ts')) {
      out.push(full)
    }
  }
  return out
}

const routeFiles = walk(API_ROOT).map((full) => ({
  rel: path.relative(API_ROOT, full),
  text: stripComments(fs.readFileSync(full, 'utf8')),
}))

const mutatingRoutes = routeFiles.filter((f) => MUTATING.test(f.text))

describe('CSRF coverage on mutating API routes', () => {
  it('finds mutating routes to check', () => {
    expect(mutatingRoutes.length).toBeGreaterThan(20)
  })

  it('every mutating route references a CSRF guard', () => {
    const offenders = mutatingRoutes
      .filter(({ text }) => !CSRF_GUARDS.some((g) => text.includes(g)))
      .map(({ rel }) => rel)

    expect(
      offenders,
      `These routes have a POST/PUT/PATCH/DELETE handler and no CSRF guard. ` +
        `Add requireJsonContentType() if the route always receives a JSON body, ` +
        `otherwise rejectCrossSiteMutation():\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })

  it('routes that spawn processes or fetch remote code are rate limited', () => {
    // These are the routes where an unbounded loop is not just noisy: each
    // request starts a process, writes to disk, or pulls remote content.
    const MUST_RATE_LIMIT = [
      'start-agent.ts',
      'start-hermes.ts',
      'systemd-control.ts',
      'skills/install.ts',
      'skills/uninstall.ts',
      'mcp/reload.ts',
    ]
    const byRel = new Map(routeFiles.map((f) => [f.rel, f.text]))

    const missing = MUST_RATE_LIMIT.filter((rel) => {
      const text = byRel.get(rel)
      // A renamed/removed file should fail loudly, not silently pass.
      if (text === undefined) return true
      return !text.includes('rateLimit(')
    })

    expect(missing, `These routes must call rateLimit()`).toEqual([])
  })
})

/**
 * The coverage checks above only prove a route *references* a guard. They say
 * nothing about whether the guard works, so assert the behaviour directly.
 */
describe('rejectCrossSiteMutation()', () => {
  const post = (headers: Record<string, string> = {}) =>
    new Request('https://studio.local/api/start-agent', {
      method: 'POST',
      headers,
    })

  it('rejects a cross-site mutation with 403', () => {
    const res = rejectCrossSiteMutation(post({ 'sec-fetch-site': 'cross-site' }))
    expect(res?.status).toBe(403)
  })

  it('rejects a same-site (sibling subdomain) mutation with 403', () => {
    const res = rejectCrossSiteMutation(post({ 'sec-fetch-site': 'same-site' }))
    expect(res?.status).toBe(403)
  })

  it('allows the app’s own same-origin mutation', () => {
    expect(
      rejectCrossSiteMutation(post({ 'sec-fetch-site': 'same-origin' })),
    ).toBeNull()
  })

  it('allows non-browser clients, which send no Sec-Fetch-Site at all', () => {
    // curl, the CLI and scripts must keep working — this is why the guard
    // allows an absent header rather than requiring same-origin.
    expect(rejectCrossSiteMutation(post())).toBeNull()
  })

  it('allows a user-initiated navigation (`none`)', () => {
    expect(rejectCrossSiteMutation(post({ 'sec-fetch-site': 'none' }))).toBeNull()
  })

  it('never blocks safe methods, even cross-site', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const req = new Request('https://studio.local/api/start-agent', {
        method,
        headers: { 'sec-fetch-site': 'cross-site' },
      })
      expect(rejectCrossSiteMutation(req), method).toBeNull()
    }
  })
})
