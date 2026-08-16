import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getUserIdFromRequest,
  isAuthenticated,
} from '../../../server/auth-middleware'
import { canAccessProfileScoped } from '../../../server/user-profiles'
import { readProfile } from '../../../server/profiles-browser'

export const Route = createFileRoute('/api/profiles/read')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const url = new URL(request.url)
          const name = (url.searchParams.get('name') || '').trim() || 'default'
          if (!canAccessProfileScoped(getUserIdFromRequest(request), name)) {
            // 404, not 403 — matches the task routes, so profile names of
            // other accounts are not enumerable (Issue #8).
            return json({ error: 'Profile not found' }, { status: 404 })
          }
          return json({ profile: readProfile(name) })
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to read profile',
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
