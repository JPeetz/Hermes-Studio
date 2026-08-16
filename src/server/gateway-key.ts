/**
 * Gateway API key discovery.
 *
 * The Hermes gateway requires its `API_SERVER_KEY` as a bearer token on
 * `/v1/models` and most other endpoints. Studio historically only read
 * `HERMES_API_TOKEN` from its own environment, which is usually unset —
 * every request then 401'd and the model picker rendered empty.
 *
 * This module discovers candidate keys server-side:
 *   1. `HERMES_API_TOKEN` env var (explicit override, highest priority)
 *   2. `API_SERVER_KEY` in `~/.hermes/.env`
 *   3. `API_SERVER_KEY` in each `~/.hermes/profiles/<name>/.env`
 *      (a gateway started with `--profile <name>` loads its key from there)
 *
 * SECURITY: key values are never logged, never returned to the client, and
 * never included in error messages. Only presence/absence is observable.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Hermes' own home directory — where the gateway keeps `.env` and profiles. */
function resolveHermesRoot(): string {
  const envHome = (process.env.HERMES_HOME ?? '').trim()
  if (envHome) return envHome

  if (process.platform === 'win32') {
    const localAppData = (process.env.LOCALAPPDATA ?? '').trim()
    const base = localAppData || path.join(os.homedir(), 'AppData', 'Local')
    return path.join(base, 'hermes')
  }

  return path.join(os.homedir(), '.hermes')
}

function readEnvKey(envPath: string, keyName: string): string {
  try {
    const raw = fs.readFileSync(envPath, 'utf-8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      if (!trimmed.startsWith(`${keyName}=`)) continue
      let value = trimmed.slice(keyName.length + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      return value
    }
  } catch {
    // File missing or unreadable — not an error, just no candidate.
  }
  return ''
}

/** Ordered, de-duplicated list of candidate gateway keys. Never log these. */
export function gatewayKeyCandidates(): Array<string> {
  const candidates: Array<string> = []
  const push = (value: string) => {
    if (value && !candidates.includes(value)) candidates.push(value)
  }

  push((process.env.HERMES_API_TOKEN || '').trim())

  const hermesHome = resolveHermesRoot()
  push(readEnvKey(path.join(hermesHome, '.env'), 'API_SERVER_KEY'))

  try {
    const profilesDir = path.join(hermesHome, 'profiles')
    for (const name of fs.readdirSync(profilesDir).sort()) {
      push(readEnvKey(path.join(profilesDir, name, '.env'), 'API_SERVER_KEY'))
    }
  } catch {
    // No profiles directory — fine.
  }

  return candidates
}

/**
 * Probe candidates against the gateway and return the first key it accepts.
 * Returns:
 *   { token, unauthorized: false } — a working key (or gateway needs no key)
 *   { token: '', unauthorized: true } — gateway rejects every candidate
 *   { token: <first candidate>, unauthorized: false } — gateway unreachable;
 *     keep the best guess so a later retry can succeed.
 */
export async function resolveGatewayKey(
  apiUrl: string,
  timeoutMs = 3000,
): Promise<{ token: string; unauthorized: boolean }> {
  const candidates = gatewayKeyCandidates()
  const attempts = candidates.length > 0 ? candidates : ['']

  for (const token of attempts) {
    try {
      const res = await fetch(`${apiUrl}/v1/models`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (res.status !== 401 && res.status !== 403) {
        return { token, unauthorized: false }
      }
    } catch {
      // Gateway unreachable — do not mark unauthorized; keep best guess.
      return { token: candidates[0] ?? '', unauthorized: false }
    }
  }

  return { token: '', unauthorized: true }
}
