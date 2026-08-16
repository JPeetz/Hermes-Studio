/**
 * GET    /api/tasks/:taskId  — get single task
 * PATCH  /api/tasks/:taskId  — update task fields
 * DELETE /api/tasks/:taskId  — delete task
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getUserIdFromRequest,
  isAuthenticated,
} from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { deleteTask, getTask, updateTask } from '../../../server/task-store'
import { canAccessProfile, canAccessTask } from '../../../server/user-profiles'
import type { TaskColumn, TaskPriority } from '../../../types/task'

const VALID_COLUMNS: Array<TaskColumn> = [
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
]
const VALID_PRIORITIES: Array<TaskPriority> = ['high', 'medium', 'low']

export const Route = createFileRoute('/api/tasks/$taskId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const task = getTask(params.taskId)
        // 404 (not 403) on foreign tasks so task ids don't leak (Issue #8)
        if (!task || !canAccessTask(getUserIdFromRequest(request), task)) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true, task })
      },

      PATCH: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const existing = getTask(params.taskId)
        if (
          !existing ||
          !canAccessTask(getUserIdFromRequest(request), existing)
        ) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }

        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >

        const updates: Parameters<typeof updateTask>[1] = {}

        if (typeof body.title === 'string') updates.title = body.title
        if (typeof body.description === 'string')
          updates.description = body.description
        if (
          typeof body.column === 'string' &&
          VALID_COLUMNS.includes(body.column as TaskColumn)
        ) {
          updates.column = body.column as TaskColumn
        }
        if (
          typeof body.priority === 'string' &&
          VALID_PRIORITIES.includes(body.priority as TaskPriority)
        ) {
          updates.priority = body.priority as TaskPriority
        }
        if (typeof body.assignee === 'string' || body.assignee === null) {
          updates.assignee = body.assignee
        }
        if (Array.isArray(body.tags)) {
          updates.tags = (body.tags as Array<unknown>).filter(
            (t) => typeof t === 'string',
          )
        }
        if (typeof body.dueDate === 'string' || body.dueDate === null) {
          updates.dueDate = body.dueDate
        }

        // Re-binding a task's profile (Issue #8 Phase 2d). Same rule as
        // creation: you may only move a task into a profile you can access,
        // otherwise re-binding would be a way to hand your own tasks to a
        // profile you have no rights over. null unbinds.
        if (typeof body.profileId === 'string' && body.profileId.trim()) {
          const profileId = body.profileId.trim()
          const userId = getUserIdFromRequest(request)
          if (userId && !canAccessProfile(userId, profileId)) {
            return json(
              { ok: false, error: 'No access to that profile' },
              { status: 403 },
            )
          }
          updates.profileId = profileId
        } else if (body.profileId === null) {
          updates.profileId = null
        }

        const task = updateTask(params.taskId, updates)
        if (!task) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true, task })
      },

      DELETE: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const existing = getTask(params.taskId)
        if (
          !existing ||
          !canAccessTask(getUserIdFromRequest(request), existing)
        ) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        const deleted = deleteTask(params.taskId)
        if (!deleted) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true })
      },
    },
  },
})
