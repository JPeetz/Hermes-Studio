/**
 * Multi-user credentials (Issue #8, Phase 2a).
 *
 * Single-user mode (default): only HERMES_PASSWORD is set — one shared
 * password, no identity, no per-user task filtering. Unchanged behavior.
 *
 * Multi-user mode: HERMES_USERS is set to a comma-separated list of
 * username:password pairs (password may contain colons; the split is on the
 * FIRST colon only):
 *
 *   HERMES_USERS='alice:s3cret,bob:hunter2'
 *   HERMES_SUPER_ADMINS='alice'
 *
 * In this mode logins require a username, every session token carries the
 * userId, and task access fails CLOSED for requests with no identity —
 * misconfiguration must not silently reopen the all-tasks leak the issue
 * reported. Usernames in HERMES_SUPER_ADMINS are (re-)granted the
 * super_admin role at login; other users keep their stored role, defaulting
 * to regular_admin.
 */
import { timingSafeEqual } from 'node:crypto'

function parseUsers(): Map<string, string> {
  const raw = process.env.HERMES_USERS ?? ''
  const users = new Map<string, string>()
  for (const entry of raw.split(',')) {
    const trimmed = entry.trim()
    if (!trimmed) continue
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx <= 0) continue
    const username = trimmed.slice(0, colonIdx).trim()
    const password = trimmed.slice(colonIdx + 1)
    if (username && password) users.set(username, password)
  }
  return users
}

export function isMultiUserMode(): boolean {
  return parseUsers().size > 0
}

export function listConfiguredUsernames(): Array<string> {
  return Array.from(parseUsers().keys())
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  try {
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

/** Verify a username/password pair against HERMES_USERS. */
export function verifyUserPassword(
  username: string,
  password: string,
): boolean {
  const users = parseUsers()
  const expected = users.get(username)
  if (!expected) {
    // Compare against a dummy value so unknown usernames cost the same time.
    timingSafeStringEqual(password, 'hermes-studio-dummy-password')
    return false
  }
  return timingSafeStringEqual(password, expected)
}

/** Usernames granted super_admin at login via HERMES_SUPER_ADMINS. */
export function superAdminUsernames(): Set<string> {
  return new Set(
    (process.env.HERMES_SUPER_ADMINS ?? '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean),
  )
}
