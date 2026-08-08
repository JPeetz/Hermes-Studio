/**
 * POST /api/tasks/:taskId/move — move task to a new column
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated, getUserIdFromRequest } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { getTask, moveTask } from '../../../server/task-store'
import { canAccessTask } from '../../../server/user-profiles'
import type { TaskColumn } from '../../../types/task'

const VALID_COLUMNS: TaskColumn[] = ['backlog', 'todo', 'in_progress', 'review', 'done']

export const Route = createFileRoute('/api/tasks/$taskId/move')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

        const column = typeof body.column === 'string' ? body.column : ''
        if (!VALID_COLUMNS.includes(column as TaskColumn)) {
          return json(
            { ok: false, error: `column must be one of: ${VALID_COLUMNS.join(', ')}` },
            { status: 400 },
          )
        }

        const existing = getTask(params.taskId)
        // 404 (not 403) on foreign tasks so task ids don't leak (Issue #8)
        if (!existing || !canAccessTask(getUserIdFromRequest(request), existing)) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }

        const task = moveTask(params.taskId, column as TaskColumn)
        if (!task) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true, task })
      },
    },
  },
})
