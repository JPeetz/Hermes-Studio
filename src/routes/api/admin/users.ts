/**
 * GET   /api/admin/users — list users, roles, and profile bindings
 * PATCH /api/admin/users — update a user's role and/or profile bindings
 *
 * Issue #8 Phase 2: the role/binding store (user-profiles.ts) previously had
 * no HTTP surface at all — promotions required a manual Redis write. Only
 * super admins may use these endpoints, and only in multi-user mode
 * (HERMES_USERS set); in single-user mode there are no users to manage.
 *
 * Usernames and passwords themselves live in the HERMES_USERS env var —
 * this API manages roles and profile bindings, not credentials.
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getUserIdFromRequest,
  isAuthenticated,
} from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import {
  isMultiUserMode,
  listConfiguredUsernames,
  superAdminUsernames,
} from '../../../server/user-credentials'
import {
  getUserProfile,
  updateUserProfile,
} from '../../../server/user-profiles'

function requireSuperAdmin(request: Request): Response | { userId: string } {
  if (!isAuthenticated(request)) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (!isMultiUserMode()) {
    return json(
      {
        ok: false,
        error:
          'Multi-user mode is not enabled. Set HERMES_USERS (and optionally HERMES_SUPER_ADMINS) to manage users.',
      },
      { status: 400 },
    )
  }
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return json(
      { ok: false, error: 'Session has no user identity — log in again' },
      { status: 401 },
    )
  }
  if (getUserProfile(userId).role !== 'super_admin') {
    return json({ ok: false, error: 'Requires super_admin' }, { status: 403 })
  }
  return { userId }
}

export const Route = createFileRoute('/api/admin/users')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const gate = requireSuperAdmin(request)
        if (gate instanceof Response) return gate

        const envSupers = superAdminUsernames()
        const users = listConfiguredUsernames().map((username) => {
          const profile = getUserProfile(username)
          return {
            userId: username,
            role: profile.role,
            profileIds: profile.profileIds,
            // super_admin re-granted at every login via HERMES_SUPER_ADMINS —
            // demoting such a user here won't stick past their next login.
            envSuperAdmin: envSupers.has(username),
          }
        })
        return json({ ok: true, users })
      },

      PATCH: async ({ request }) => {
        const gate = requireSuperAdmin(request)
        if (gate instanceof Response) return gate
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => null)) as {
          userId?: unknown
          role?: unknown
          profileIds?: unknown
        } | null
        const targetId =
          body && typeof body.userId === 'string' ? body.userId.trim() : ''
        if (!targetId) {
          return json(
            { ok: false, error: 'userId is required' },
            { status: 400 },
          )
        }
        if (!listConfiguredUsernames().includes(targetId)) {
          return json(
            {
              ok: false,
              error: `Unknown user: ${targetId} (users are defined in HERMES_USERS)`,
            },
            { status: 404 },
          )
        }

        const updates: {
          role?: 'super_admin' | 'regular_admin'
          profileIds?: Array<string>
        } = {}
        if (body?.role !== undefined) {
          if (body.role !== 'super_admin' && body.role !== 'regular_admin') {
            return json(
              { ok: false, error: 'role must be super_admin or regular_admin' },
              { status: 400 },
            )
          }
          updates.role = body.role
        }
        if (body?.profileIds !== undefined) {
          if (
            !Array.isArray(body.profileIds) ||
            body.profileIds.some((id) => typeof id !== 'string')
          ) {
            return json(
              { ok: false, error: 'profileIds must be an array of strings' },
              { status: 400 },
            )
          }
          updates.profileIds = (body.profileIds as Array<string>).map((id) =>
            id.trim(),
          )
        }
        if (updates.role === undefined && updates.profileIds === undefined) {
          return json(
            {
              ok: false,
              error: 'Nothing to update — pass role and/or profileIds',
            },
            { status: 400 },
          )
        }

        const profile = updateUserProfile(targetId, updates)
        return json({
          ok: true,
          user: {
            userId: profile.userId,
            role: profile.role,
            profileIds: profile.profileIds,
            envSuperAdmin: superAdminUsernames().has(profile.userId),
          },
        })
      },
    },
  },
})
