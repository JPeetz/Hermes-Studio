/**
 * DELETE /api/crews/templates/:id — delete a user template (built-ins protected)
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../../server/auth-middleware'
import { getTemplate, deleteUserTemplate } from '../../../../server/template-store'

export const Route = createFileRoute('/api/crews/templates/$id')({
  server: {
    handlers: {
      DELETE: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const template = getTemplate(params.id)
        if (!template) {
          return json({ ok: false, error: 'Template not found' }, { status: 404 })
        }
        if (template.isBuiltIn) {
          return json(
            { ok: false, error: 'Cannot delete built-in template' },
            { status: 403 },
          )
        }
        deleteUserTemplate(params.id)
        return json({ ok: true })
      },
    },
  },
})
