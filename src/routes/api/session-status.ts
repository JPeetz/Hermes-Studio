import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'
import {
  ensureGatewayProbed,
  getGatewayCapabilities,
  getSession,
  listSessions,
} from '../../server/hermes-api'
import { hermesHome } from '../../server/hermes-home'
import { isSyntheticSessionKey } from '../../server/session-utils'
import { isAuthenticated } from '@/server/auth-middleware'

/** Read the configured default model/provider from ~/.hermes/config.yaml. */
function readLocalConfig(): { model: string; provider: string } {
  try {
    const raw = fs.readFileSync(
      path.join(hermesHome(), 'config.yaml'),
      'utf-8',
    )
    const config = (YAML.parse(raw) as Record<string, unknown>) || {}
    const modelField = config.model
    if (typeof modelField === 'string') {
      return { model: modelField, provider: (config.provider as string) || '' }
    }
    if (modelField && typeof modelField === 'object') {
      const nested = modelField as Record<string, unknown>
      return {
        model: (nested.default as string) || '',
        provider:
          (nested.provider as string) || (config.provider as string) || '',
      }
    }
    return { model: '', provider: (config.provider as string) || '' }
  } catch {
    return { model: '', provider: '' }
  }
}

export const Route = createFileRoute('/api/session-status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        await ensureGatewayProbed()
        try {
          const capabilities = getGatewayCapabilities()
          if (!capabilities.sessions) {
            return json({
              ok: true,
              payload: {
                status: 'idle',
                sessionKey: 'new',
                sessionLabel: '',
                model: '',
                modelProvider: '',
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                sessions: [],
              },
            })
          }
          const url = new URL(request.url)
          const requestedKey = url.searchParams.get('sessionKey')?.trim() || ''
          let sessionKey = requestedKey || 'new'

          if (isSyntheticSessionKey(sessionKey)) {
            const sessions = await listSessions(1, 0)
            if (sessions.length === 0) {
              return json({
                ok: true,
                payload: {
                  status: 'idle',
                  sessionKey: 'new',
                  sessionLabel: '',
                  model: '',
                  modelProvider: '',
                  inputTokens: 0,
                  outputTokens: 0,
                  totalTokens: 0,
                  sessions: [],
                },
              })
            }
            sessionKey = sessions[0].id
          }

          const session = await getSession(sessionKey)
          const localConfig = readLocalConfig()
          // The gateway persists its virtual model name ("hermes-agent") on the
          // session row; surface the real configured model instead.
          const sessionModel = session.model ?? ''
          const model =
            sessionModel && sessionModel !== 'hermes-agent'
              ? sessionModel
              : localConfig.model
          const modelProvider = localConfig.provider

          const inputTokens = session.input_tokens ?? 0
          const outputTokens = session.output_tokens ?? 0

          return json({
            ok: true,
            payload: {
              status: session.ended_at ? 'ended' : 'idle',
              sessionKey: session.id,
              sessionLabel: session.title ?? '',
              model,
              modelProvider,
              inputTokens,
              outputTokens,
              totalTokens: inputTokens + outputTokens,
              sessions: [
                {
                  key: session.id,
                  agentId: session.id,
                  label: session.title ?? session.id,
                  model,
                  modelProvider,
                  updatedAt: session.last_active ?? session.started_at ?? 0,
                  usage: {
                    input: inputTokens,
                    output: outputTokens,
                  },
                },
              ],
            },
          })
        } catch (err) {
          return json(
            {
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            },
            { status: 503 },
          )
        }
      },
    },
  },
})
