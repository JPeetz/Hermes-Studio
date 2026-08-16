import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getUserIdFromRequest,
  isAuthenticated,
} from '../../../server/auth-middleware'
import {
  getActiveProfileName,
  listProfiles,
} from '../../../server/profiles-browser'
import { filterAccessibleProfiles } from '../../../server/user-profiles'

export const Route = createFileRoute('/api/profiles/list')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          // Regular admins see only profiles bound to their account; super
          // admins see all. Single-user installs are unaffected (Issue #8).
          const userId = getUserIdFromRequest(request)
          return json({
            profiles: filterAccessibleProfiles(userId, listProfiles()),
            activeProfile: getActiveProfileName(),
          })
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to list profiles',
              profiles: [],
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
