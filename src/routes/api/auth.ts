import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'
import {
  createSessionCookie,
  generateSessionToken,
  isPasswordProtectionEnabled,
  storeSessionToken,
  verifyPassword,
} from '../../server/auth-middleware'
import {
  isMultiUserMode,
  superAdminUsernames,
  verifyUserPassword,
} from '../../server/user-credentials'
import { getUserProfile, updateUserProfile } from '../../server/user-profiles'
import {
  getClientIp,
  rateLimit,
  rateLimitResponse,
  requireJsonContentType,
} from '../../server/rate-limit'

const AuthSchema = z.object({
  password: z.string().max(1000),
  username: z.string().max(200).optional(),
})

export const Route = createFileRoute('/api/auth')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        // If no auth is configured at all, reject auth attempts
        if (!isPasswordProtectionEnabled() && !isMultiUserMode()) {
          return json(
            { ok: false, error: 'Authentication not required' },
            { status: 400 },
          )
        }

        // Rate limit: max 5 auth attempts per minute per IP
        const ip = getClientIp(request)
        if (!rateLimit(`auth:${ip}`, 5, 60_000)) {
          return rateLimitResponse()
        }

        try {
          const raw = await request.json().catch(() => ({}))
          const parsed = AuthSchema.safeParse(raw)

          if (!parsed.success) {
            return json(
              { ok: false, error: 'Invalid request' },
              { status: 400 },
            )
          }

          const { password, username } = parsed.data

          // Multi-user mode (HERMES_USERS set): logins are per-user so the
          // session carries an identity for task filtering (Issue #8). The
          // legacy shared HERMES_PASSWORD is rejected in this mode — a
          // shared login has no userId and would bypass isolation.
          let userId: string | undefined
          let valid = false
          if (isMultiUserMode()) {
            const name = (username ?? '').trim()
            valid = name.length > 0 && verifyUserPassword(name, password)
            if (valid) userId = name
          } else {
            valid = verifyPassword(password)
          }

          if (!valid) {
            // Add small delay to prevent brute force
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return json(
              {
                ok: false,
                error:
                  isMultiUserMode() && !(username ?? '').trim()
                    ? 'Username required'
                    : 'Invalid credentials',
              },
              { status: 401 },
            )
          }

          // Bootstrap roles: HERMES_SUPER_ADMINS grants super_admin at
          // login (idempotent); everyone else keeps their stored role.
          if (userId) {
            const shouldBeSuper = superAdminUsernames().has(userId)
            const profile = getUserProfile(userId)
            if (shouldBeSuper && profile.role !== 'super_admin') {
              updateUserProfile(userId, { role: 'super_admin' })
            }
          }

          // Generate session token — associated with the user in
          // multi-user mode so getUserIdFromRequest() resolves an identity.
          const token = generateSessionToken()
          storeSessionToken(token, userId)

          // Return success with Set-Cookie header
          return json(
            { ok: true },
            {
              status: 200,
              headers: {
                'Set-Cookie': createSessionCookie(token),
              },
            },
          )
        } catch (err) {
          if (import.meta.env.DEV) console.error('[/api/auth] Error:', err)
          return json(
            { ok: false, error: 'Authentication failed' },
            { status: 500 },
          )
        }
      },
    },
  },
})
