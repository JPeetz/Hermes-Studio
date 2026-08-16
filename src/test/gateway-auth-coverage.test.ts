import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Regression guard for issue #17: every server-side fetch to the Hermes
 * gateway must carry the discovered bearer token, and nothing may re-read the
 * raw env vars that the canonical discovery in gateway-key.ts /
 * gateway-capabilities.ts owns (shadow copies are how the unauthenticated
 * call sites crept in).
 */

const SRC_ROOT = path.resolve(__dirname, '..')

function walk(dir: string): Array<string> {
  const out: Array<string> = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

const files = walk(SRC_ROOT).map((full) => ({
  rel: path.relative(SRC_ROOT, full),
  text: fs.readFileSync(full, 'utf8'),
}))

describe('gateway auth coverage (issue #17)', () => {
  it('HERMES_API_TOKEN is only read by the canonical key discovery', () => {
    const offenders = files
      .filter((f) => f.text.includes('process.env.HERMES_API_TOKEN'))
      .map((f) => f.rel)
      .filter(
        (rel) => rel !== 'server/gateway-key.ts' && !rel.startsWith('test/'),
      )
    expect(offenders).toEqual([])
  })

  /*
   * Deliberately NOT asserted here yet:
   *
   *   - `process.env.HERMES_API_URL` is still read directly by
   *     routes/api/models.ts and routes/settings/index.tsx.
   *   - hermes-jobs.ts, hermes-jobs.$jobId.ts and hermes-runs.ts still fetch
   *     the gateway with no auth header.
   *
   * Those are exactly the call sites PR #19 fixes, by the reporter of issue
   * #17. Asserting them here would make this branch depend on that one and
   * would duplicate its work. Once #19 lands, add:
   *
   *   it('HERMES_API_URL is only read by gateway-capabilities', ...)
   *   it('every file fetching the gateway references an auth-header helper', ...)
   *
   * following the same shape as the checks above and below.
   */

  it('split-capability fetches use the target headers, not bare ones', () => {
    // The check above only recognizes `fetch(`${HERMES_API}` — it is blind to
    // the shape this split introduces, `fetch(`${target.base}`. Without this
    // second check the guard would quietly stop guarding the newest call sites.
    const offenders = files
      .filter((f) => f.text.includes('fetch(`${target.base}'))
      .filter((f) => !f.text.includes('headers: target.headers'))
      .filter((f) => !f.text.includes('...target.headers'))
      .map((f) => f.rel)
    expect(offenders).toEqual([])
  })

  it('getCapabilityTarget callers always supply a credentialed fallback', () => {
    // `getCapabilityTarget()` returns null when neither server exposes the
    // capability. Falling back to a bare `{ base: HERMES_API }` without
    // headers is how an unauthenticated call site reappears.
    const offenders = files
      .filter(
        (f) =>
          f.rel !== 'server/gateway-capabilities.ts' &&
          !f.rel.startsWith('test/') &&
          f.text.includes('getCapabilityTarget('),
      )
      .filter(
        (f) =>
          !f.text.includes('getAuthHeaders()') &&
          !f.text.includes('hermesAuthHeaders()'),
      )
      .map((f) => f.rel)
    expect(offenders).toEqual([])
  })
})
