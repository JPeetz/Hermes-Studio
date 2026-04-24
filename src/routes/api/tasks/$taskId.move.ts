/**
 * POST /api/tasks/:taskId/move — move task to a new column
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { moveTask } from '../../../server/task-store'
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

        const task = moveTask(params.taskId, column as TaskColumn)
        if (!task) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true, task })
      },
    },
  },
})
