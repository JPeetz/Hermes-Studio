/**
 * session-utils.ts
 *
 * Pure helper functions for working with Hermes session metadata.
 * Extracted from session-history-screen so they can be unit-tested.
 */

import type { SessionMeta } from '@/screens/chat/types'

export type RichSession = SessionMeta & {
  totalTokens: number
  cost: number
  messageCount: number
  toolCallCount: number
}

/**
 * Normalise a raw session object (from /api/sessions) into RichSession.
 * Handles both Hermes-native shapes and local-storage shapes.
 */
export function normalise(raw: Record<string, unknown>): RichSession {
  const usage = raw.usage as
    | { promptTokens?: number; completionTokens?: number }
    | undefined
  return {
    ...(raw as unknown as SessionMeta),
    key: (raw.key || raw.id || raw.sessionKey || '') as string,
    friendlyId: (raw.friendlyId || raw.id || raw.key || '') as string,
    totalTokens:
      (raw.totalTokens as number) ||
      (raw.tokenCount as number) ||
      (usage
        ? (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0)
        : 0),
    cost: (raw.cost as number) || 0,
    messageCount:
      (raw.messageCount as number) || (raw.message_count as number) || 0,
    toolCallCount:
      (raw.toolCallCount as number) || (raw.tool_call_count as number) || 0,
    updatedAt:
      (raw.updatedAt as number) ||
      (raw.startedAt as number) ||
      (raw.createdAt as number) ||
      0,
  } as RichSession
}

/**
 * Format a token count for display (e.g. 1500 → "1.5k", 2000000 → "2.0m").
 */
export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

/**
 * Format a cost in USD for display.
 * Returns "—" for zero / falsy values.
 */
export function fmtCost(n: number): string {
  if (!n) return '—'
  return `$${n.toFixed(4)}`
}

/**
 * Format a Unix timestamp (seconds or milliseconds) for display.
 * Returns "—" for missing / zero values.
 */
export function fmtDate(ts?: number): string {
  if (!ts) return '—'
  const ms = ts < 1e12 ? ts * 1000 : ts
  return new Date(ms).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Resolve the best human-readable title for a session.
 * Priority: derivedTitle → title → label → friendlyId → key
 */
export function sessionTitle(s: SessionMeta): string {
  return (
    (s as Record<string, unknown>).derivedTitle as string ||
    s.title ||
    (s as Record<string, unknown>).label as string ||
    s.friendlyId ||
    s.key
  )
}
