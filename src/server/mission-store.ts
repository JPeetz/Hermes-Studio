/**
 * Mission store — file-backed persistence for Conductor missions.
 *
 * Missions persist to .runtime/missions.json.
 * Mission events persist to .runtime/mission-events.json (append-only log).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  Mission,
  MissionEvent,
  MissionStatus,
  MissionWorker,
  WorkerStatus,
  CreateMissionInput,
} from '../types/conductor'

const DATA_DIR = join(process.cwd(), '.runtime')
const MISSIONS_FILE = join(DATA_DIR, 'missions.json')
const EVENTS_FILE = join(DATA_DIR, 'mission-events.json')

type MissionsData = { missions: Record<string, Mission> }
type EventsData = { events: MissionEvent[] }

let missionsStore: MissionsData = { missions: {} }
let eventsStore: EventsData = { events: [] }

function loadFromDisk(): void {
  try {
    if (existsSync(MISSIONS_FILE)) {
      const raw = readFileSync(MISSIONS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as MissionsData
      if (parsed?.missions && typeof parsed.missions === 'object') {
        missionsStore = parsed
      }
    }
  } catch { /* corrupt file — start fresh */ }
  try {
    if (existsSync(EVENTS_FILE)) {
      const raw = readFileSync(EVENTS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as EventsData
      if (Array.isArray(parsed?.events)) {
        eventsStore = parsed
      }
    }
  } catch { /* corrupt file — start fresh */ }
}

function saveMissionsToDisk(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(MISSIONS_FILE, JSON.stringify(missionsStore, null, 2))
  } catch { /* ignore */ }
}

function saveEventsToDisk(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(EVENTS_FILE, JSON.stringify(eventsStore, null, 2))
  } catch { /* ignore */ }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(): void {
  if (_saveTimer) return
  _saveTimer = setTimeout(() => { _saveTimer = null; saveMissionsToDisk() }, 1_000)
}

loadFromDisk()

export function listMissions(): Mission[] {
  return Object.values(missionsStore.missions).sort((a, b) => b.createdAt - a.createdAt)
}

export function getMission(missionId: string): Mission | null {
  return missionsStore.missions[missionId] ?? null
}

export function createMission(input: CreateMissionInput): Mission {
  const now = Date.now()
  const mission: Mission = {
    id: randomUUID(),
    goal: input.goal.trim(),
    status: 'idle',
    workers: [],
    tasks: [],
    templateId: input.templateId ?? null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    totalTokens: 0,
    totalCostUsd: 0,
  }
  missionsStore.missions[mission.id] = mission
  saveMissionsToDisk()
  return mission
}

export function updateMission(
  missionId: string,
  updates: Partial<Pick<Mission, 'status' | 'totalTokens' | 'totalCostUsd'>>,
): Mission | null {
  const mission = missionsStore.missions[missionId]
  if (!mission) return null
  Object.assign(mission, { ...updates, updatedAt: Date.now() })
  scheduleSave()
  return mission
}

export function completeMission(missionId: string): Mission | null {
  const mission = missionsStore.missions[missionId]
  if (!mission) return null
  mission.status = 'completed'
  mission.completedAt = Date.now()
  mission.updatedAt = Date.now()
  saveMissionsToDisk()
  return mission
}

export function abortMission(missionId: string): Mission | null {
  const mission = missionsStore.missions[missionId]
  if (!mission) return null
  mission.status = 'aborted'
  mission.completedAt = Date.now()
  mission.updatedAt = Date.now()
  saveMissionsToDisk()
  return mission
}

export function deleteMission(missionId: string): boolean {
  if (!missionsStore.missions[missionId]) return false
  delete missionsStore.missions[missionId]
  eventsStore.events = eventsStore.events.filter((e) => e.missionId !== missionId)
  saveMissionsToDisk()
  saveEventsToDisk()
  return true
}

export function addWorker(
  missionId: string,
  worker: { sessionKey: string; label: string; personaEmoji: string; personaName: string; model: string | null },
): MissionWorker | null {
  const mission = missionsStore.missions[missionId]
  if (!mission) return null
  const mw: MissionWorker = {
    id: randomUUID(),
    sessionKey: worker.sessionKey,
    label: worker.label,
    personaEmoji: worker.personaEmoji,
    personaName: worker.personaName,
    model: worker.model,
    status: 'pending',
    totalTokens: 0,
    output: null,
  }
  mission.workers.push(mw)
  mission.updatedAt = Date.now()
  scheduleSave()
  return mw
}

export function updateWorkerStatus(
  missionId: string,
  sessionKey: string,
  status: WorkerStatus,
  totalTokens?: number,
): void {
  const mission = missionsStore.missions[missionId]
  if (!mission) return
  const worker = mission.workers.find((w) => w.sessionKey === sessionKey)
  if (!worker) return
  worker.status = status
  if (totalTokens !== undefined) worker.totalTokens = totalTokens
  mission.updatedAt = Date.now()
  scheduleSave()
}

export function appendMissionEvent(
  missionId: string,
  type: string,
  data: Record<string, unknown>,
): MissionEvent {
  const event: MissionEvent = {
    id: randomUUID(),
    missionId,
    type,
    data,
    timestamp: Date.now(),
  }
  eventsStore.events.push(event)
  saveEventsToDisk()
  return event
}

export function getMissionEvents(
  missionId: string,
  limit?: number,
  offset?: number,
): MissionEvent[] {
  const filtered = eventsStore.events.filter((e) => e.missionId === missionId)
  const start = offset ?? 0
  const end = limit ? start + limit : undefined
  return filtered.slice(start, end)
}
