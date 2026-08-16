/**
 * User profile and role management for multi-user Hermes Studio.
 * Tracks user roles (super_admin vs regular_admin) and profile bindings.
 */
import { getRedisClient, getRedisClientSync } from './redis-client'
import { isMultiUserMode } from './user-credentials'

export type UserRole = 'super_admin' | 'regular_admin'

export interface UserProfile {
  userId: string
  role: UserRole
  profileIds: Array<string> // Profiles this user can access
}

const USERS_KEY = 'hermes:studio:users'
const USER_PREFIX = 'hermes:studio:user:'

// In-memory cache of users, backed by Redis
const userCache = new Map<string, UserProfile>()

// Load users from Redis on startup
void getRedisClient().then(async (client) => {
  if (!client) return
  try {
    const userIds = await client.smembers(USERS_KEY)
    for (const userId of userIds) {
      const data = await client.get(`${USER_PREFIX}${userId}`)
      if (data) {
        try {
          userCache.set(userId, JSON.parse(data))
        } catch {
          // Skip corrupted entries
        }
      }
    }
    if (userIds.length > 0) {
      console.log(`[auth] Loaded ${userIds.length} user profile(s) from Redis`)
    }
  } catch {
    // Redis unavailable
  }
})

/**
 * Get or create a user profile.
 * If user doesn't exist, defaults to regular_admin with no profile bindings.
 */
export function getUserProfile(userId: string): UserProfile {
  if (userCache.has(userId)) {
    return userCache.get(userId)!
  }
  // Default: regular_admin with empty profile list
  return {
    userId,
    role: 'regular_admin',
    profileIds: [],
  }
}

/**
 * Update a user's role and profile bindings.
 */
export function updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
  const current = getUserProfile(userId)
  const updated: UserProfile = {
    ...current,
    ...updates,
    userId, // Never change userId
  }

  userCache.set(userId, updated)

  // Persist to Redis
  const client = getRedisClientSync()
  if (client) {
    void client.sadd(USERS_KEY, userId)
    void client.set(`${USER_PREFIX}${userId}`, JSON.stringify(updated))
  }

  return updated
}

/**
 * Add a profile to a user's bindings.
 */
export function addProfileBinding(userId: string, profileId: string): UserProfile {
  const profile = getUserProfile(userId)
  if (!profile.profileIds.includes(profileId)) {
    profile.profileIds.push(profileId)
  }
  return updateUserProfile(userId, profile)
}

/**
 * Remove a profile from a user's bindings.
 */
export function removeProfileBinding(userId: string, profileId: string): UserProfile {
  const profile = getUserProfile(userId)
  profile.profileIds = profile.profileIds.filter((id) => id !== profileId)
  return updateUserProfile(userId, profile)
}

/**
 * Check if a user can access a specific profile.
 * Super admins can access any profile; regular admins only access bound profiles.
 */
export function canAccessProfile(userId: string, profileId: string): boolean {
  const profile = getUserProfile(userId)
  if (profile.role === 'super_admin') return true
  return profile.profileIds.includes(profileId)
}

/**
 * Get all profiles a user can access. `null` means unrestricted (super
 * admin) — callers must treat null as "all", never as "none". The previous
 * `[]` sentinel read as "no access" to naive callers and would have
 * silently inverted the rule (Issue #8 Phase 2).
 */
export function getAccessibleProfiles(userId: string): Array<string> | null {
  const profile = getUserProfile(userId)
  if (profile.role === 'super_admin') return null
  return profile.profileIds
}

/**
 * Identity-aware profile check for the /api/profiles/* routes, with the same
 * open/closed rule as canAccessTask(): single-user installs keep the legacy
 * behaviour (everything visible), multi-user installs fail closed.
 *
 * The issue's expected behaviour is "regular administrators should only see
 * profiles bound to their account", but nothing enforced it: every
 * /api/profiles route checked only isAuthenticated, and getAccessibleProfiles
 * had no production callers at all. Task-level filtering was correct while any
 * regular admin could still list, read, rename, delete and activate every
 * profile in the install.
 */
export function canAccessProfileScoped(
  userId: string | null | undefined,
  profileId: string,
): boolean {
  if (!userId) return !isMultiUserMode()
  return canAccessProfile(userId, profileId)
}

/**
 * Filter a list of profile names to those the user may see. `null` from
 * getAccessibleProfiles() means unrestricted — returning `[]` for a super
 * admin would invert the rule and hide everything from the one account that
 * is supposed to see all of it.
 */
export function filterAccessibleProfiles<T extends { name: string }>(
  userId: string | null | undefined,
  profiles: Array<T>,
): Array<T> {
  if (!userId) return isMultiUserMode() ? [] : profiles
  const allowed = getAccessibleProfiles(userId)
  if (allowed === null) return profiles
  const allowedSet = new Set(allowed)
  return profiles.filter((p) => allowedSet.has(p.name))
}

/**
 * Check if a user may act on a task. Super admins may act on any task;
 * regular admins on tasks they created or tasks belonging to a profile
 * bound to their account (Issue #8 Phase 2).
 *
 * A missing userId means:
 *  - single-user mode: no per-user filtering — allow (legacy behavior);
 *  - multi-user mode (HERMES_USERS set): DENY. Identity should always be
 *    present here; failing open would silently reopen the all-tasks leak.
 */
export function canAccessTask(
  userId: string | null | undefined,
  task: { createdBy?: string | null; profileId?: string | null },
): boolean {
  if (!userId) return !isMultiUserMode()
  const profile = getUserProfile(userId)
  if (profile.role === 'super_admin') return true
  if (task.createdBy === userId) return true
  if (task.profileId && profile.profileIds.includes(task.profileId)) return true
  return false
}

/**
 * Whether a user may see a task event (task.created/moved/deleted) on the
 * event surfaces (/api/chat-events, /api/events/replay, /api/audit). Task
 * events are published under the shared session key 'all', so without this
 * check any authenticated user would watch every user's task activity
 * (Issue #8 Phase 2).
 *
 * Payloads carry createdBy/profileId since Phase 2; older stored events
 * don't — those are visible only to super admins / single-user mode
 * (fail closed for regular admins).
 */
export function canSeeTaskEvent(
  userId: string | null | undefined,
  eventType: string,
  payload: unknown,
): boolean {
  if (!eventType.startsWith('task.')) return true
  if (!userId) return !isMultiUserMode()
  const profile = getUserProfile(userId)
  if (profile.role === 'super_admin') return true
  if (!payload || typeof payload !== 'object') return false
  const record = payload as { createdBy?: unknown; profileId?: unknown }
  if (typeof record.createdBy !== 'string') return false
  return canAccessTask(userId, {
    createdBy: record.createdBy,
    profileId: typeof record.profileId === 'string' ? record.profileId : null,
  })
}
