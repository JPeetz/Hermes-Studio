/**
 * GET  /api/crews/templates  — list all templates (built-in + user)
 * POST /api/crews/templates  — create a user template
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../../server/auth-middleware'
import { requireJsonContentType } from '../../../../server/rate-limit'
import {
  listTemplates,
  createUserTemplate,
} from '../../../../server/template-store'
import type { CrewTemplateCategory } from '../../../../types/template'

const VALID_CATEGORIES: CrewTemplateCategory[] = [
  'research',
  'engineering',
  'creative',
  'operations',
]

const VALID_ROLES = ['coordinator', 'executor', 'reviewer', 'specialist'] as const

export const Route = createFileRoute('/api/crews/templates/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        return json({ ok: true, templates: listTemplates() })
      },

      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >

        const name =
          typeof body.name === 'string' ? body.name.trim() : ''
        if (!name) {
          return json(
            { ok: false, error: 'name is required' },
            { status: 400 },
          )
        }

        const category = body.category as string
        if (!VALID_CATEGORIES.includes(category as CrewTemplateCategory)) {
          return json(
            { ok: false, error: 'Invalid category' },
            { status: 400 },
          )
        }

        if (!Array.isArray(body.defaultMembers) || body.defaultMembers.length === 0) {
          return json(
            { ok: false, error: 'defaultMembers must be a non-empty array' },
            { status: 400 },
          )
        }

        const defaultMembers: Array<{ persona: string; role: typeof VALID_ROLES[number] }> = []
        for (const m of body.defaultMembers as unknown[]) {
          if (
            typeof m !== 'object' ||
            m === null ||
            typeof (m as Record<string, unknown>).persona !== 'string' ||
            !VALID_ROLES.includes((m as Record<string, unknown>).role as typeof VALID_ROLES[number])
          ) {
            return json(
              { ok: false, error: 'Each member must have persona (string) and valid role' },
              { status: 400 },
            )
          }
          defaultMembers.push({
            persona: ((m as Record<string, unknown>).persona as string).toLowerCase(),
            role: (m as Record<string, unknown>).role as typeof VALID_ROLES[number],
          })
        }

        const template = createUserTemplate({
          name,
          description: typeof body.description === 'string' ? body.description.trim() : '',
          icon: typeof body.icon === 'string' ? body.icon : '🤖',
          category: category as CrewTemplateCategory,
          defaultGoal: typeof body.defaultGoal === 'string' ? body.defaultGoal.trim() : '',
          defaultMembers,
          tags: Array.isArray(body.tags)
            ? (body.tags as unknown[]).filter((t): t is string => typeof t === 'string')
            : [],
        })

        return json({ ok: true, template }, { status: 201 })
      },
    },
  },
})
