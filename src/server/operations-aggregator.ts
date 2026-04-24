/**
 * Operations aggregator — read-only view across crews, missions, and standalone sessions.
 *
 * No persistence of its own. Queries crew-store and mission-store to build
 * a unified OperationAgent[] list.
 */

import type { OperationAgent, OperationAgentStatus } from '../types/operation'
import { listCrews } from './crew-store'
import type { CrewMemberStatus } from './crew-store'
import { listMissions } from './mission-store'
import type { WorkerStatus } from '../types/conductor'

function crewStatusToOpStatus(status: CrewMemberStatus): OperationAgentStatus {
  switch (status) {
    case 'running': return 'online'
    case 'idle':
    case 'done': return 'offline'
    case 'error': return 'error'
    default: return 'unknown'
  }
}

function workerStatusToOpStatus(status: WorkerStatus): OperationAgentStatus {
  switch (status) {
    case 'running': return 'online'
    case 'pending': return 'unknown'
    case 'done': return 'offline'
    case 'error': return 'error'
    default: return 'unknown'
  }
}

export function getOperationsOverview(): OperationAgent[] {
  const agents: OperationAgent[] = []

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

  for (const mission of listMissions()) {
    for (const worker of mission.workers) {
      agents.push({
        id: worker.id,
        name: worker.personaName,
        emoji: worker.personaEmoji,
        model: worker.model,
        profileName: null,
        sessionKey: worker.sessionKey,
        status: workerStatusToOpStatus(worker.status),
        lastActivity: null,
        totalTokens: worker.totalTokens,
        totalCostUsd: 0,
        taskCount: 0,
        crewId: null,
        crewName: null,
        missionId: mission.id,
        missionGoal: mission.goal,
        source: 'conductor',
      })
    }
  }

  return agents
}
