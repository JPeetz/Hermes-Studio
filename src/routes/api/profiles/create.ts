import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getUserIdFromRequest,
  isAuthenticated,
} from '../../../server/auth-middleware'
import { addProfileBinding } from '../../../server/user-profiles'
import { createProfile } from '../../../server/profiles-browser'
import { requireJsonContentType } from '../../../server/rate-limit'

export const Route = createFileRoute('/api/profiles/create')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck
        try {
          const body = (await request.json()) as {
            name?: string
            cloneFrom?: string
            model?: string
            provider?: string
          }
          const profile = createProfile(body.name || '', {
            cloneFrom: body.cloneFrom,
            model: body.model,
            provider: body.provider,
          })
          // Bind the new profile to its creator, otherwise a regular admin
          // creates a profile and immediately cannot see it (Issue #8).
          const userId = getUserIdFromRequest(request)
          if (userId) {
            addProfileBinding(userId, (body.name || '').trim())
          }
          return json({ ok: true, profile })
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to create profile',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
