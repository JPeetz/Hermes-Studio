import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Regression guard for the /api/events auth gap.
 *
 * /api/events shipped with no auth check at all, streaming every event on the
 * bus — including task events, which carry task ids and titles — to any
 * unauthenticated caller. The test suite was green the whole time, because
 * nothing asserted anything about which routes actually call the auth helpers.
 *
 * So walk src/routes/api instead and require every route to reference a guard,
 * or to be listed in PUBLIC_ROUTES with a written reason. A new unauthenticated
 * API route now fails the build rather than waiting for someone to notice.
 */

const API_ROOT = path.resolve(__dirname, '../routes/api')

/** Either guard is acceptable; requireLocalOrAuth also permits loopback. */
const AUTH_GUARDS = ['isAuthenticated', 'requireLocalOrAuth']

/**
 * Routes that must stay reachable without a session, with the reason. Adding
 * to this list is a deliberate act — that is the point of the list.
 */
const PUBLIC_ROUTES: Record<string, string> = {
  'auth.ts': 'the login route itself — it mints the session',
  'oauth.device-code.ts': 'OAuth device flow starts before a session exists',
  'oauth.poll-token.ts': 'OAuth device flow polls before a session exists',
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
  text: fs.readFileSync(full, 'utf8'),
}))

describe('API route auth coverage', () => {
  it('finds route files to check', () => {
    expect(routeFiles.length).toBeGreaterThan(20)
  })

  it('every API route checks auth, or is an explicit public route', () => {
    const offenders = routeFiles
      .filter(({ rel }) => !(rel in PUBLIC_ROUTES))
      .filter(({ text }) => !AUTH_GUARDS.some((guard) => text.includes(guard)))
      .map(({ rel }) => rel)

    expect(
      offenders,
      `These API routes have no auth guard. Add isAuthenticated()/requireLocalOrAuth(), ` +
        `or add the file to PUBLIC_ROUTES with a reason:\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })

  it('the public-route allowlist has no stale entries', () => {
    const present = new Set(routeFiles.map(({ rel }) => rel))
    const stale = Object.keys(PUBLIC_ROUTES).filter((rel) => !present.has(rel))

    expect(stale, `PUBLIC_ROUTES names files that no longer exist`).toEqual([])
  })
})
