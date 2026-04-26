/**
 * Gateway session types and fetch helpers for conductor integration.
 *
 * Adapted from upstream hermes-workspace gateway-api.ts.
 * Only the subset needed by the conductor hook is included here.
 */

export type GatewaySessionUsage = {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  tokens?: number
  cost?: number
}

export type GatewaySessionMessage = {
  role?: string
  content?: Array<{ type?: string; text?: string }>
  text?: string
}

export type GatewaySession = {
  key?: string
  friendlyId?: string
  kind?: string
  status?: string
  state?: string
  model?: string
  label?: string
  title?: string
  derivedTitle?: string
  task?: string
  initialMessage?: string
  progress?: number
  tokenCount?: number
  totalTokens?: number
  contextTokens?: number
  maxTokens?: number
  contextWindow?: number
  cost?: number
  createdAt?: number | string
  startedAt?: number | string
  updatedAt?: number | string
  lastMessage?: GatewaySessionMessage | null
  messages?: unknown[]
  usage?: GatewaySessionUsage
  [key: string]: unknown
}

export type GatewaySessionsResponse = {
  sessions?: Array<GatewaySession>
}

export async function fetchSessions(): Promise<GatewaySessionsResponse> {
  const res = await fetch('/api/sessions')
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to fetch sessions (${res.status})`)
  }
  return (await res.json()) as GatewaySessionsResponse
}
