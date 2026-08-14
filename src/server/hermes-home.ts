import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Resolve the Hermes home dir, mirroring the agent's own resolution
 * (hermes_cli/_startup_fast.py `_resolved_home`): HERMES_HOME env wins,
 * otherwise ~/.hermes. On Windows the real home is %LOCALAPPDATA%\hermes
 * which the user sets via the HERMES_HOME user env var.
 */
export function hermesHome(): string {
  return process.env.HERMES_HOME?.trim() || join(homedir(), '.hermes')
}
