/**
 * Operation types — aggregated agent status across crews, missions, and standalone sessions.
 */

export type OperationAgentStatus = 'online' | 'offline' | 'error' | 'unknown'

export interface OperationAgent {
  id: string
  name: string
  emoji: string
  model: string | null
  profileName: string | null
  sessionKey: string
  status: OperationAgentStatus
  lastActivity: string | null
  totalTokens: number
  totalCostUsd: number
  taskCount: number
  crewId: string | null
  crewName: string | null
  missionId: string | null
  missionGoal: string | null
  source: 'crew' | 'conductor' | 'standalone'
}
