/**
 * Local `~/.hermes/config.yaml` I/O.
 *
 * Extracted so the settings routes share one implementation instead of each
 * keeping a private copy (`hermes-config.ts` and `mcp/servers.ts` both had
 * one). Filesystem only — the gateway is never involved, which is exactly why
 * the Config panel keeps working on Hermes Agent v0.19+, where `/api/config`
 * moved off the gateway onto the agent's dashboard backend (issue #23).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import YAML from 'yaml'

export const HERMES_HOME = path.join(os.homedir(), '.hermes')
export const CONFIG_PATH = path.join(HERMES_HOME, 'config.yaml')

export function readConfig(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return (YAML.parse(raw) as Record<string, unknown>) || {}
  } catch {
    return {}
  }
}

export function writeConfig(config: Record<string, unknown>): void {
  fs.mkdirSync(HERMES_HOME, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, YAML.stringify(config), 'utf-8')
}

/** Recursively merge `source` into `target`, in place. */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      deepMerge(
        target[key] as Record<string, unknown>,
        value as Record<string, unknown>,
      )
    } else {
      target[key] = value
    }
  }
}

/**
 * Set (or, for null/undefined, delete) a dot-path leaf, creating intermediate
 * objects as needed.
 */
export function setConfigPath(
  config: Record<string, unknown>,
  dotPath: string,
  value: unknown,
): void {
  const segments = dotPath.split('.').filter(Boolean)
  if (segments.length === 0) return
  let node = config
  for (const segment of segments.slice(0, -1)) {
    const next = node[segment]
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      node[segment] = {}
    }
    node = node[segment] as Record<string, unknown>
  }
  const leaf = segments[segments.length - 1]
  if (value === null || value === undefined) {
    delete node[leaf]
  } else {
    node[leaf] = value
  }
}
