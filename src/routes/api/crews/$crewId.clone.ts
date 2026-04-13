/**
 * POST /api/crews/:crewId/clone
 *
 * Duplicates an existing crew — mints fresh sessions for every member and
 * saves the new crew as "Copy of <original name>" in draft status.
 *
 * Response:
 *   { ok: true, crew: Crew }
 *
 * Inspired by xaspx/hermes-control-interface + karmsheel/mission-control-hermes
 */
import { randomUUID } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { getCrew, createCrew } from '../../../server/crew-store'
import {
  ensureGatewayProbed,
  getGatewayCapabilities,
  createSession,
} from '../../../server/hermes-api'
import {
  ensureLocalSession,
  toLocalSessionSummary,
} from '../../../server/local-session-store'

async function mintSession(persona: string, model: string | null): Promise<string> {
  const friendlyId = `crew-${persona}-${randomUUID().slice(0, 8)}`
  await ensureGatewayProbed()
  if (getGatewayCapabilities().sessions) {
    try {
      const session = await createSession({
        id: friendlyId,
        title: `Crew: ${persona.charAt(0).toUpperCase() + persona.slice(1)}`,
        model: model ?? undefined,
      })
      return session.id
    } catch {
      // fall through to local
    }
  }
  const local = ensureLocalSession(friendlyId, model ?? undefined)
  void toLocalSessionSummary(local)
  return local.id
}

export const Route = createFileRoute('/api/crews/$crewId/clone')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const source = getCrew(params.crewId)
        if (!source) {
          return json({ ok: false, error: 'Crew not found' }, { status: 404 })
        }

        // Mint fresh sessions for every member in parallel
        const members = await Promise.all(
          source.members.map(async (m) => {
            const personaForSession = m.displayName
              .replace(/^[^\s]+\s*/, '')  // strip leading emoji+space
              .toLowerCase()
            const sessionKey = await mintSession(personaForSession || m.persona, m.model)
            return {
              sessionKey,
              role: m.role,
              persona: m.persona,
              displayName: m.displayName,
              roleLabel: m.roleLabel,
              color: m.color,
              model: m.model,
              profileName: m.profileName,
            }
          }),
        )

        const crew = createCrew({
          name: `Copy of ${source.name}`,
          goal: source.goal,
          members,
        })

        return json({ ok: true, crew }, { status: 201 })
      },
    },
  },
})
