/**
 * Operations aggregator — read-only view across crews and live conductor sessions.
 *
 * No persistence of its own. Queries crew-store for crew agents and
 * the Hermes sessions API for conductor workers.
 */

import type { OperationAgent, OperationAgentStatus } from '../types/operation'
import { listCrews } from './crew-store'
import type { CrewMemberStatus } from './crew-store'
import { listSessions } from './hermes-api'

function crewStatusToOpStatus(status: CrewMemberStatus): OperationAgentStatus {
  switch (status) {
    case 'running': return 'online'
    case 'idle':
    case 'done': return 'offline'
    case 'error': return 'error'
    default: return 'unknown'
  }
}

function sessionStatusToOpStatus(updatedAt: number | undefined | null, totalTokens: number): OperationAgentStatus {
  if (!updatedAt) return 'unknown'
  const staleness = Date.now() - updatedAt * 1000
  if (totalTokens > 0 && staleness > 30_000) return 'offline'
  if (staleness > 120_000) return 'error'
  if (totalTokens > 0) return 'online'
  return 'unknown'
}

export async function getOperationsOverview(): Promise<OperationAgent[]> {
  const agents: OperationAgent[] = []

  // Crew agents — unchanged
  for (const crew of listCrews()) {
    for (const member of crew.members) {
      const nameMatch = member.displayName.match(/^(?:\S+\s+)?(.+)$/)
      const cleanName = nameMatch ? nameMatch[1].trim() : member.displayName

      agents.push({
        id: member.id,
        name: cleanName,
        emoji: member.displayName.split(' ')[0] || '🤖',
        model: member.model,
        profileName: member.profileName,
        sessionKey: member.sessionKey,
        status: crewStatusToOpStatus(member.status),
        lastActivity: member.lastActivity,
        totalTokens: 0,
        totalCostUsd: 0,
        taskCount: 0,
        crewId: crew.id,
        crewName: crew.name,
        missionId: null,
        missionGoal: null,
        source: 'crew',
      })
    }
  }

  // Live conductor sessions from gateway
  try {
    const sessions = await listSessions()
    const cutoff = Date.now() - 24 * 60 * 60_000
    for (const session of sessions) {
      const label = session.title ?? session.id ?? ''
      const key = session.id ?? ''
      // Match conductor worker sessions
      if (!label.startsWith('worker-') && !label.startsWith('conductor-') && !key.includes(':subagent:')) {
        continue
      }
      const updatedAt = session.last_active ?? session.started_at
      if (updatedAt && updatedAt * 1000 < cutoff) continue

      const totalTokens = (session.input_tokens ?? 0) + (session.output_tokens ?? 0)
      const cleanLabel = label.replace(/^worker-/, '').replace(/[-_]+/g, ' ')

      agents.push({
        id: key,
        name: cleanLabel || 'Worker',
        emoji: '🤖',
        model: session.model ?? null,
        profileName: null,
        sessionKey: key,
        status: sessionStatusToOpStatus(updatedAt, totalTokens),
        lastActivity: updatedAt ? updatedAt * 1000 : null,
        totalTokens,
        totalCostUsd: 0,
        taskCount: 0,
        crewId: null,
        crewName: null,
        missionId: null,
        missionGoal: null,
        source: 'conductor',
      })
    }
  } catch {
    // Gateway may be unavailable — return crew agents only
  }

  return agents
}
