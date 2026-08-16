export type EnhancedFeature =
  | 'sessions'
  | 'skills'
  | 'memory'
  | 'config'
  | 'jobs'

const FEATURE_LABELS: Record<EnhancedFeature, string> = {
  sessions: 'Sessions',
  skills: 'Skills',
  memory: 'Memory',
  config: 'Configuration',
  jobs: 'Jobs',
}

function normalizeFeature(
  feature: EnhancedFeature | string,
): EnhancedFeature | null {
  const normalized = feature.trim().toLowerCase()
  if (
    normalized === 'sessions' ||
    normalized === 'skills' ||
    normalized === 'memory' ||
    normalized === 'config' ||
    normalized === 'jobs'
  ) {
    return normalized
  }

  return null
}

export function getFeatureLabel(feature: EnhancedFeature | string): string {
  const normalized = normalizeFeature(feature)
  if (!normalized) return feature
  return FEATURE_LABELS[normalized]
}

/** Dashboard-backend state, as reported by /api/gateway-status. */
export type DashboardStatus = {
  configured: boolean
  unauthorized: boolean
}

export function getUnavailableReason(
  feature: EnhancedFeature | string,
  dashboard?: DashboardStatus,
): string {
  const normalized = normalizeFeature(feature)
  const label = getFeatureLabel(feature)
  // Hermes v0.19 moved these off the gateway onto the agent's own dashboard
  // backend — "upgrade your gateway" is the wrong advice for them (issue #23).
  if (
    normalized === 'skills' ||
    normalized === 'memory' ||
    normalized === 'config'
  ) {
    // Telling someone to set HERMES_DASHBOARD_URL when they already have is
    // the most confusing thing this string can do, so split the three cases.
    if (dashboard?.configured && dashboard.unauthorized) {
      return `${label} is on the Hermes Agent dashboard server, but it rejected our session token. The dashboard regenerates its token on every restart unless the agent is started with HERMES_DASHBOARD_SESSION_TOKEN set — set the same value on both sides. Local ~/.hermes data keeps working either way.`
    }
    if (dashboard?.configured) {
      return `${label} is not being served by the configured Hermes Agent dashboard. Check that HERMES_DASHBOARD_URL points at the dashboard (default http://127.0.0.1:9119) and that the agent is recent enough to serve /api/${normalized}. Local ~/.hermes data keeps working either way.`
    }
    return `${label} lives on the Hermes Agent dashboard server on current agents. Point HERMES_DASHBOARD_URL at it (default http://127.0.0.1:9119, token via HERMES_DASHBOARD_SESSION_TOKEN) — local ~/.hermes data keeps working either way.`
  }
  return `${label} requires a Hermes gateway with enhanced API support.`
}

export function createCapabilityUnavailablePayload(
  feature: EnhancedFeature,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ok: false,
    code: 'capability_unavailable',
    capability: feature,
    source: 'portable',
    message: getUnavailableReason(feature),
    ...extra,
  }
}
