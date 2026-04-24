/**
 * Conductor types — mission orchestration with sub-agent workers.
 */

export type ConductorPhase = 'home' | 'preview' | 'active' | 'complete'
export type MissionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'aborted'
export type WorkerStatus = 'pending' | 'running' | 'done' | 'error'

export interface MissionWorker {
  id: string
  sessionKey: string
  label: string
  personaEmoji: string
  personaName: string
  model: string | null
  status: WorkerStatus
  totalTokens: number
  output: string | null
}

export interface Mission {
  id: string
  goal: string
  status: MissionStatus
  workers: MissionWorker[]
  tasks: string[]
  templateId: string | null
  createdAt: number
  updatedAt: number
  completedAt: number | null
  totalTokens: number
  totalCostUsd: number
}

export interface MissionEvent {
  id: string
  missionId: string
  type: string
  data: Record<string, unknown>
  timestamp: number
}

export interface CreateMissionInput {
  goal: string
  templateId?: string | null
  workers?: Array<{
    label: string
    personaName: string
    personaEmoji: string
    model?: string | null
  }>
}
