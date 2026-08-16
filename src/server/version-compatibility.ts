/**
 * Hermes Agent version detection and compatibility checking.
 * Ensures Studio is compatible with the running Hermes gateway version.
 */

import { HERMES_API, BEARER_TOKEN } from './gateway-capabilities'

export interface VersionInfo {
  version?: string
  commit?: string
  timestamp?: string
  pythonVersion?: string
}

const VERSION_CACHE: { info: VersionInfo | null; timestamp: number } = {
  info: null,
  timestamp: 0,
}
const CACHE_TTL_MS = 60_000 // Cache version for 1 minute

/**
 * Fetch version info from the Hermes gateway.
 * Tries multiple endpoints for compatibility with different versions.
 */
async function fetchVersionInfo(): Promise<VersionInfo | null> {
  const authHeaders: Record<string, string> = BEARER_TOKEN
    ? { Authorization: `Bearer ${BEARER_TOKEN}` }
    : {}

  // Try different version endpoints for compatibility
  const endpoints = [
    '/version', // Common endpoint
    '/api/version', // Alternative
    '/health', // Health may include version info
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${HERMES_API}${endpoint}`, {
        headers: authHeaders,
        signal: AbortSignal.timeout(3000),
      })

      if (res.ok) {
        const data = (await res.json()) as unknown
        if (typeof data === 'object' && data !== null) {
          const obj = data as Record<string, unknown>

          // Extract version from various possible locations
          const version =
            typeof obj.version === 'string'
              ? obj.version
              : typeof obj.v === 'string'
                ? obj.v
                : null

          if (version) {
            return {
              version,
              commit: typeof obj.commit === 'string' ? obj.commit : undefined,
              timestamp: typeof obj.timestamp === 'string' ? obj.timestamp : undefined,
            }
          }
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return null
}

/**
 * Parse semantic version string (e.g., "0.18.0") into numbers.
 */
function parseVersion(versionStr: string): { major: number; minor: number; patch: number } | null {
  const match = versionStr.match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  }
}

/**
 * Compare two versions: returns -1, 0, or 1
 */
function compareVersions(
  v1: { major: number; minor: number; patch: number },
  v2: { major: number; minor: number; patch: number },
): number {
  if (v1.major !== v2.major) return v1.major - v2.major
  if (v1.minor !== v2.minor) return v1.minor - v2.minor
  return v1.patch - v2.patch
}

/**
 * Check if a version is compatible.
 * Returns: { compatible: boolean, warnings: string[] }
 */
export function checkCompatibility(versionStr: string): {
  compatible: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  const parsed = parseVersion(versionStr)

  if (!parsed) {
    warnings.push(`Could not parse version string: "${versionStr}"`)
    return { compatible: true, warnings } // Assume compatible if we can't parse
  }

  // Define minimum and known-good versions
  const minimumVersion = { major: 0, minor: 8, patch: 0 }
  const recommendedVersion = { major: 0, minor: 18, patch: 0 }

  // Check minimum version
  if (compareVersions(parsed, minimumVersion) < 0) {
    warnings.push(
      `Hermes Agent ${versionStr} is below the minimum supported version ${minimumVersion.major}.${minimumVersion.minor}.${minimumVersion.patch}. Some features may not work.`,
    )
  }

  // Check for older versions
  if (compareVersions(parsed, recommendedVersion) < 0) {
    const majorDiff = recommendedVersion.major - parsed.major
    const minorDiff = recommendedVersion.minor - parsed.minor
    const versionGap = majorDiff > 0 ? majorDiff : minorDiff

    if (versionGap >= 2) {
      warnings.push(
        `Hermes Agent is ${versionGap} minor versions behind recommended (${recommendedVersion.major}.${recommendedVersion.minor}.${recommendedVersion.patch}). Please update for latest features and fixes.`,
      )
    }
  }

  return {
    compatible: warnings.length === 0,
    warnings,
  }
}

/**
 * Get version info from cache or fetch from gateway.
 */
export async function getVersionInfo(): Promise<VersionInfo | null> {
  const now = Date.now()
  if (VERSION_CACHE.info && now - VERSION_CACHE.timestamp < CACHE_TTL_MS) {
    return VERSION_CACHE.info
  }

  const info = await fetchVersionInfo()
  VERSION_CACHE.info = info
  VERSION_CACHE.timestamp = now

  if (info?.version) {
    const compat = checkCompatibility(info.version)
    if (!compat.compatible || compat.warnings.length > 0) {
      console.log(
        `[version] Hermes Agent ${info.version}: ${compat.warnings.join('; ')}`,
      )
    } else {
      console.log(`[version] Hermes Agent ${info.version} compatible`)
    }
  }

  return info
}

/**
 * Force a version check (bypass cache).
 */
export async function checkVersionNow(): Promise<VersionInfo | null> {
  VERSION_CACHE.timestamp = 0
  return getVersionInfo()
}
