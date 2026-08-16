import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Regression guard for issue #23's dashboard probe.
 *
 * The Hermes Agent dashboard serves a single-page app, and its catch-all
 * answers ANY unknown path with `200 text/html` — verified against a live
 * v0.19 dashboard, where `/definitely-not-a-real-path` returns 200 HTML while
 * the real `/api/*` routes return JSON.
 *
 * The probe used to treat "not 401/404/403" as proof the capability existed,
 * so a dashboard whose routes had moved — or a mistyped HERMES_DASHBOARD_URL
 * pointing at any SPA — reported every capability as available and then fed
 * HTML to JSON.parse on the first real data call.
 */

const DASHBOARD = 'http://dashboard.test'
const GATEWAY = 'http://gateway.test'

function response(body: string, status: number, contentType: string): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': contentType },
  })
}

/**
 * Route by host: the gateway 404s the split capabilities (v0.19+ moved them
 * off it) so the dashboard branch is what decides the outcome.
 */
function stubFetch(dashboardReply: () => Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request) => {
      const url = String(input instanceof Request ? input.url : input)
      if (url.startsWith(DASHBOARD)) return Promise.resolve(dashboardReply())
      if (url.includes('/health'))
        return Promise.resolve(response('{}', 200, 'application/json'))
      return Promise.resolve(
        response('{"detail":"Not Found"}', 404, 'application/json'),
      )
    }),
  )
}

async function probeWith(dashboardReply: () => Response) {
  vi.resetModules()
  vi.stubEnv('HERMES_DASHBOARD_URL', DASHBOARD)
  vi.stubEnv('HERMES_DASHBOARD_SESSION_TOKEN', 'test-token')
  vi.stubEnv('HERMES_API_URL', GATEWAY)
  stubFetch(dashboardReply)

  const mod = await import('../server/gateway-capabilities')
  const capabilities = await mod.ensureGatewayProbed()
  return { capabilities, sources: mod.getCapabilitySources(), mod }
}

describe('dashboard capability probe (issue #23)', () => {
  beforeEach(() => {
    vi.stubEnv('HERMES_API_TOKEN', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('does NOT accept a 200 text/html SPA catch-all as a capability', async () => {
    const { capabilities, sources } = await probeWith(() =>
      response('<!doctype html><html><body>SPA</body></html>', 200, 'text/html'),
    )

    expect(capabilities.skills).toBe(false)
    expect(capabilities.memory).toBe(false)
    expect(capabilities.config).toBe(false)
    // and it must not have pointed data calls at the dashboard
    expect(sources.skills).toBeNull()
    expect(sources.memory).toBeNull()
    expect(sources.config).toBeNull()
  })

  it('accepts a real JSON response and routes data calls to the dashboard', async () => {
    const { capabilities, sources } = await probeWith(() =>
      response('{"skills":[]}', 200, 'application/json'),
    )

    expect(capabilities.skills).toBe(true)
    expect(sources.skills).toBe('dashboard')
  })

  it('reports the gateway tier as unauthorized when it rejects our key', async () => {
    // /api/connection-status used to recompute the tier itself with a union
    // that had no 'unauthorized' member, so a gateway rejecting our API key
    // surfaced as "Connected". It now delegates here; this pins the behaviour
    // it delegates to.
    vi.resetModules()
    vi.stubEnv('HERMES_API_URL', GATEWAY)
    vi.stubEnv('HERMES_DASHBOARD_URL', '')
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          response('{"detail":"Unauthorized"}', 401, 'application/json'),
        ),
      ),
    )

    const mod = await import('../server/gateway-capabilities')
    await mod.ensureGatewayProbed()

    expect(mod.isGatewayUnauthorized()).toBe(true)
    expect(mod.getConnectionStatus()).toBe('unauthorized')
  })

  it('treats a dashboard 401 as unauthorized without blaming the gateway', async () => {
    const { capabilities, mod } = await probeWith(() =>
      response('{"detail":"Unauthorized"}', 401, 'application/json'),
    )

    expect(mod.isDashboardUnauthorized()).toBe(true)
    // A bad dashboard token must never mark the gateway unauthorized — that
    // flag drives the whole app's connection status.
    expect(mod.isGatewayUnauthorized()).toBe(false)
    // The capability itself is absent: the gateway 404s it on v0.19+.
    expect(capabilities.skills).toBe(false)
  })
})
