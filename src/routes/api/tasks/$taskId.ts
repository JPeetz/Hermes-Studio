/**
 * GET    /api/tasks/:taskId  — get single task
 * PATCH  /api/tasks/:taskId  — update task fields
 * DELETE /api/tasks/:taskId  — delete task
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { getTask, updateTask, deleteTask } from '../../../server/task-store'
import type { TaskColumn, TaskPriority } from '../../../types/task'

const VALID_COLUMNS: TaskColumn[] = ['backlog', 'todo', 'in_progress', 'review', 'done']
const VALID_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low']

export const Route = createFileRoute('/api/tasks/$taskId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const task = getTask(params.taskId)
        if (!task) {
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

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

        const updates: Parameters<typeof updateTask>[1] = {}

        if (typeof body.title === 'string') updates.title = body.title
        if (typeof body.description === 'string') updates.description = body.description
        if (typeof body.column === 'string' && VALID_COLUMNS.includes(body.column as TaskColumn)) {
          updates.column = body.column as TaskColumn
        }
        if (typeof body.priority === 'string' && VALID_PRIORITIES.includes(body.priority as TaskPriority)) {
          updates.priority = body.priority as TaskPriority
        }
        if (typeof body.assignee === 'string' || body.assignee === null) {
          updates.assignee = body.assignee as string | null
        }
        if (Array.isArray(body.tags)) {
          updates.tags = (body.tags as unknown[]).filter((t) => typeof t === 'string') as string[]
        }
        if (typeof body.dueDate === 'string' || body.dueDate === null) {
          updates.dueDate = body.dueDate as string | null
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
        const deleted = deleteTask(params.taskId)
        if (!deleted) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true })
      },
    },
  },
})
