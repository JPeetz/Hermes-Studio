/**
 * User profile and role management for multi-user Hermes Studio.
 * Tracks user roles (super_admin vs regular_admin) and profile bindings.
 */
import { getRedisClient, getRedisClientSync } from './redis-client'

export type UserRole = 'super_admin' | 'regular_admin'

export interface UserProfile {
  userId: string
  role: UserRole
  profileIds: string[] // Profiles this user can access
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
 * Get all profiles a user can access.
 */
export function getAccessibleProfiles(userId: string): string[] {
  const profile = getUserProfile(userId)
  if (profile.role === 'super_admin') return [] // null = all profiles
  return profile.profileIds
}

/**
 * Check if a user may act on a task. Super admins may act on any task;
 * regular admins only on tasks they created. A missing userId means
 * single-user mode, where no per-user filtering applies — mirrors the
 * list filtering in /api/tasks (Issue #8).
 */
export function canAccessTask(
  userId: string | null | undefined,
  task: { createdBy?: string | null },
): boolean {
  if (!userId) return true
  const profile = getUserProfile(userId)
  if (profile.role === 'super_admin') return true
  return task.createdBy === userId
}
