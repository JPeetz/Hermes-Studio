import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createFileRoute } from '@tanstack/react-router'
import YAML from 'yaml'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import {
  HERMES_API,
  ensureGatewayProbed,
  getCapabilities,
} from '../../../server/gateway-capabilities'
import { gatewayFetch } from '../../../server/gateway-session'
import { createCapabilityUnavailablePayload } from '@/lib/feature-gates'

type AuthResult = Response | true

// ─── Local config file I/O (mirrors hermes-config.ts) ────────────────────────

const HERMES_HOME = path.join(os.homedir(), '.hermes')
const CONFIG_PATH = path.join(HERMES_HOME, 'config.yaml')

function readConfig(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return (YAML.parse(raw) as Record<string, unknown>) || {}
  } catch {
    return {}
  }
}

function writeConfig(config: Record<string, unknown>): void {
  fs.mkdirSync(HERMES_HOME, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, YAML.stringify(config), 'utf-8')
}

/** Convert a flat McpServerRecord array to the mcp_servers dict shape for config.yaml */
function serversToConfigDict(
  servers: Array<McpServerRecord>,
): Record<string, unknown> {
  const dict: Record<string, unknown> = {}
  for (const s of servers) {
    const entry: Record<string, unknown> = {}
    if (s.transport === 'http') {
      if (s.url) entry.url = s.url
      if (s.headers && Object.keys(s.headers).length > 0) entry.headers = s.headers
    } else {
      if (s.command) entry.command = s.command
      if (s.args && s.args.length > 0) entry.args = s.args
      if (s.env && Object.keys(s.env).length > 0) entry.env = s.env
    }
    if (typeof s.timeout === 'number') entry.timeout = s.timeout
    if (typeof s.connectTimeout === 'number')
      entry.connect_timeout = s.connectTimeout
    if (s.auth !== undefined && s.auth !== null) entry.auth = s.auth
    dict[s.name] = entry
  }
  return dict
}

type McpServerRecord = {
  name: string
  transport: 'stdio' | 'http'
  command?: string
  args?: Array<string>
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
  timeout?: number
  connectTimeout?: number
  auth?: unknown
}

function authHeaders(): Record<string, string> {
  return {}
}

function toStringRecord(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined && entry !== null)
    .map(([key, entry]) => [key, String(entry)] as const)

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function readServers(payload: unknown): Array<McpServerRecord> {
  const root =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {}

  const config =
    root.config && typeof root.config === 'object'
      ? (root.config as Record<string, unknown>)
      : root

  const rawServers = config.mcp_servers
  if (
    !rawServers ||
    typeof rawServers !== 'object' ||
    Array.isArray(rawServers)
  ) {
    return []
  }

  return Object.entries(rawServers as Record<string, unknown>).flatMap(
    ([name, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return []
      const record = value as Record<string, unknown>
      const command =
        typeof record.command === 'string' ? record.command : undefined
      const url = typeof record.url === 'string' ? record.url : undefined
      const transport = url ? 'http' : 'stdio'

      return [
        {
          name,
          transport,
          command,
          args: Array.isArray(record.args)
            ? record.args.map((entry) => String(entry))
            : undefined,
          env: toStringRecord(record.env),
          url,
          headers: toStringRecord(record.headers),
          timeout:
            typeof record.timeout === 'number' ? record.timeout : undefined,
          connectTimeout:
            typeof record.connect_timeout === 'number'
              ? record.connect_timeout
              : undefined,
          auth: record.auth,
        } satisfies McpServerRecord,
      ]
    },
  )
}

export const Route = createFileRoute('/api/mcp/servers')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authResult = isAuthenticated(request) as AuthResult
        if (authResult !== true) return authResult

        await ensureGatewayProbed()
        if (!getCapabilities().config) {
          return Response.json({
            ...createCapabilityUnavailablePayload('config', {
              message:
                'Gateway config API unavailable. You can still draft MCP config snippets locally.',
            }),
            servers: [],
          })
        }

        try {
          const response = await gatewayFetch(`${HERMES_API}/api/config`, {
            headers: authHeaders(),
          })

          if (!response.ok) {
            return Response.json({
              servers: [],
              ok: false,
              message: `Failed to load MCP servers from gateway config (${response.status}).`,
            })
          }

          const payload = (await response.json().catch(() => ({}))) as unknown
          return Response.json({ ok: true, servers: readServers(payload) })
        } catch {
          return Response.json({
            servers: [],
            ok: false,
            message: 'Could not reach Hermes gateway config endpoint.',
          })
        }
      },

      PUT: async ({ request }) => {
        const authResult = isAuthenticated(request) as AuthResult
        if (authResult !== true) return authResult
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request
          .json()
          .catch(() => ({}))) as Record<string, unknown>

        if (!Array.isArray(body.servers)) {
          return Response.json(
            { ok: false, error: 'servers must be an array' },
            { status: 400 },
          )
        }

        const servers: Array<McpServerRecord> = []
        for (const item of body.servers as unknown[]) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) continue
          const s = item as Record<string, unknown>
          if (typeof s.name !== 'string' || !s.name.trim()) continue
          const transport =
            s.transport === 'http' || s.transport === 'stdio'
              ? s.transport
              : 'stdio'
          servers.push({
            name: s.name.trim(),
            transport,
            command:
              transport === 'stdio' && typeof s.command === 'string'
                ? s.command
                : undefined,
            args:
              transport === 'stdio' && Array.isArray(s.args)
                ? (s.args as unknown[]).map(String)
                : undefined,
            env:
              transport === 'stdio'
                ? toStringRecord(s.env)
                : undefined,
            url:
              transport === 'http' && typeof s.url === 'string'
                ? s.url
                : undefined,
            headers:
              transport === 'http'
                ? toStringRecord(s.headers)
                : undefined,
            timeout:
              typeof s.timeout === 'number' ? s.timeout : undefined,
            connectTimeout:
              typeof s.connectTimeout === 'number'
                ? s.connectTimeout
                : undefined,
            auth: s.auth,
          })
        }

        try {
          const config = readConfig()
          config.mcp_servers =
            servers.length > 0 ? serversToConfigDict(servers) : {}
          writeConfig(config)
          return Response.json({
            ok: true,
            message:
              'MCP servers saved to config.yaml. Reload Hermes to apply changes.',
            servers,
          })
        } catch (err) {
          return Response.json(
            {
              ok: false,
              error: `Failed to write config: ${err instanceof Error ? err.message : String(err)}`,
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
