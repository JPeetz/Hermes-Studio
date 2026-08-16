/**
 * GET  /api/admin/orphan-tasks — list tasks nobody can see
 * POST /api/admin/orphan-tasks — reassign them to a real user
 *
 * Issue #8 Phase 2d, the migration half.
 *
 * Tasks created before per-user identity existed carry the placeholder
 * `createdBy` values 'user' or 'unknown' (task-store still defaults to 'user'
 * when no creator is supplied, e.g. for conductor/crew-generated tasks). Those
 * strings match no configured username, so once multi-user mode is switched on
 * `canAccessTask()` hides them from every regular admin — permanently, with no
 * way to claim them from the UI. Only a super admin can see them at all, which
 * is safe but leaves the board looking like data was lost.
 *
 * This is the deliberate way out: a super admin sees exactly what is stranded
 * and hands each batch to a real account. Super-admin only, multi-user only —
 * in single-user mode nothing is hidden and there is nothing to migrate.
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getUserIdFromRequest,
  isAuthenticated,
} from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { listTasks, updateTaskOwner } from '../../../server/task-store'
import {
  isMultiUserMode,
  listConfiguredUsernames,
} from '../../../server/user-credentials'
import { getUserProfile } from '../../../server/user-profiles'

/** createdBy values that predate per-user identity and match no real account. */
export const ORPHAN_CREATOR_IDS = new Set(['user', 'unknown', ''])

function requireSuperAdmin(request: Request): Response | { userId: string } {
  if (!isAuthenticated(request)) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (!isMultiUserMode()) {
    return json(
      {
        ok: false,
        error:
          'Multi-user mode is not enabled — no tasks are hidden, so there is nothing to migrate.',
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

function isOrphan(createdBy: string | undefined | null): boolean {
  if (!createdBy) return true
  if (ORPHAN_CREATOR_IDS.has(createdBy)) return true
  // A creator who is no longer in HERMES_USERS is equally unreachable.
  return !listConfiguredUsernames().includes(createdBy)
}

export const Route = createFileRoute('/api/admin/orphan-tasks')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const gate = requireSuperAdmin(request)
        if (gate instanceof Response) return gate

        const orphans = listTasks()
          .filter((task) => isOrphan(task.createdBy))
          .map((task) => ({
            id: task.id,
            title: task.title,
            column: task.column,
            createdBy: task.createdBy,
            profileId: task.profileId ?? null,
            createdAt: task.createdAt,
          }))

        return json({
          ok: true,
          orphans,
          assignableUsers: listConfiguredUsernames(),
        })
      },

      POST: async ({ request }) => {
        const gate = requireSuperAdmin(request)
        if (gate instanceof Response) return gate
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => null)) as {
          taskIds?: unknown
          createdBy?: unknown
        } | null

        const targetUser =
          body && typeof body.createdBy === 'string'
            ? body.createdBy.trim()
            : ''
        if (!targetUser) {
          return json(
            { ok: false, error: 'createdBy is required' },
            { status: 400 },
          )
        }
        if (!listConfiguredUsernames().includes(targetUser)) {
          return json(
            {
              ok: false,
              error: `Unknown user: ${targetUser} (users are defined in HERMES_USERS)`,
            },
            { status: 404 },
          )
        }

        if (
          !Array.isArray(body?.taskIds) ||
          body.taskIds.some((id) => typeof id !== 'string')
        ) {
          return json(
            { ok: false, error: 'taskIds must be an array of strings' },
            { status: 400 },
          )
        }

        // Only ever reassign tasks that are actually stranded. Without this a
        // super admin could quietly take ownership of another user's tasks
        // through the migration endpoint.
        const reassigned: Array<string> = []
        const skipped: Array<string> = []
        for (const taskId of body.taskIds as Array<string>) {
          const updated = updateTaskOwner(taskId, targetUser, isOrphan)
          if (updated) reassigned.push(taskId)
          else skipped.push(taskId)
        }

        return json({ ok: true, reassigned, skipped, createdBy: targetUser })
      },
    },
  },
})
