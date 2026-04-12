/**
 * GET  /api/crews        — list all crews
 * POST /api/crews        — create a crew (mints sessions for each member)
 */
import { randomUUID } from 'node:crypto'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { AGENT_PERSONAS } from '../../../lib/agent-personas'
import {
  createCrew,
  listCrews,
} from '../../../server/crew-store'
import {
  ensureGatewayProbed,
  getGatewayCapabilities,
} from '../../../server/hermes-api'
import {
  ensureLocalSession,
  toLocalSessionSummary,
} from '../../../server/local-session-store'
import { createSession } from '../../../server/hermes-api'

/**
 * Mint a session for a crew member.
 * Works in both enhanced-hermes and portable/local modes.
 */
async function mintSession(
  persona: string,
  model: string | null,
): Promise<string> {
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

  // Local fallback
  const local = ensureLocalSession(friendlyId, model ?? undefined)
  void toLocalSessionSummary(local)
  return local.id
}

export const Route = createFileRoute('/api/crews/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        return json({ ok: true, crews: listCrews() })
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
        const goal =
          typeof body.goal === 'string' ? body.goal.trim() : ''

        if (!name) {
          return json({ ok: false, error: 'name is required' }, { status: 400 })
        }

        const rawMembers = Array.isArray(body.members) ? body.members : []
        if (rawMembers.length === 0) {
          return json(
            { ok: false, error: 'at least one member is required' },
            { status: 400 },
          )
        }
        if (rawMembers.length > 8) {
          return json(
            { ok: false, error: 'maximum 8 members per crew' },
            { status: 400 },
          )
        }

        // Build members, minting sessions in parallel
        const members = await Promise.all(
          (rawMembers as Array<Record<string, unknown>>).map(async (m) => {
            const personaName =
              typeof m.persona === 'string' ? m.persona.toLowerCase() : 'kai'
            const personaDef =
              AGENT_PERSONAS.find(
                (p) => p.name.toLowerCase() === personaName,
              ) ?? AGENT_PERSONAS[6] // Kai fallback
            const model =
              typeof m.model === 'string' && m.model ? m.model : null
            const role =
              typeof m.role === 'string' ? m.role : 'executor'

            const sessionKey = await mintSession(personaDef.name.toLowerCase(), model)
            const profileName =
              typeof m.profileName === 'string' && m.profileName
                ? m.profileName
                : null

            return {
              sessionKey,
              role: role as import('../../../server/crew-store').CrewMemberRole,
              persona: personaDef.name.toLowerCase(),
              displayName: `${personaDef.emoji} ${personaDef.name}`,
              roleLabel: personaDef.role,
              color: personaDef.color,
              model,
              profileName,
            }
          }),
        )

        const crew = createCrew({ name, goal, members })
        return json({ ok: true, crew }, { status: 201 })
      },
    },
  },
})
