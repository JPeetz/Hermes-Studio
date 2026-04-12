/**
 * Crew store — file-backed persistence for multi-agent crews.
 *
 * A crew is a named group of chat sessions (agents) working toward a shared
 * goal. This module owns the crews.json file in .runtime/ and exposes a
 * synchronous in-memory API with deferred disk writes, matching the pattern
 * established by local-session-store.ts.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const DATA_DIR = join(process.cwd(), '.runtime')
const CREWS_FILE = join(DATA_DIR, 'crews.json')

// ─── Types ───────────────────────────────────────────────────────────────────

export type CrewMemberStatus = 'idle' | 'running' | 'done' | 'error'
export type CrewMemberRole = 'coordinator' | 'executor' | 'reviewer' | 'specialist'
export type CrewStatus = 'draft' | 'active' | 'paused' | 'complete'

export interface CrewMember {
  id: string
  sessionKey: string
  role: CrewMemberRole
  persona: string        // 'roger', 'sally', etc.
  displayName: string    // '🎨 Roger'
  roleLabel: string      // 'Frontend Developer'
  color: string          // Tailwind color class
  model: string | null
  /** Optional profile name — scopes this agent's file explorer to that profile's workspace */
  profileName: string | null
  status: CrewMemberStatus
  lastActivity: string | null  // ISO string of latest message preview
}

export interface Crew {
  id: string
  name: string
  goal: string
  status: CrewStatus
  createdAt: number
  updatedAt: number
  members: CrewMember[]
}

type StoreData = { crews: Record<string, Crew> }

// ─── In-memory cache ─────────────────────────────────────────────────────────

let store: StoreData = { crews: {} }

// ─── Disk persistence ────────────────────────────────────────────────────────

function loadFromDisk(): void {
  try {
    if (existsSync(CREWS_FILE)) {
      const raw = readFileSync(CREWS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as StoreData
      if (parsed?.crews && typeof parsed.crews === 'object') {
        store = parsed
      }
    }
  } catch {
    // corrupt file — start fresh
  }
}

function saveToDisk(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(CREWS_FILE, JSON.stringify(store, null, 2))
  } catch {
    // ignore write failure — in-memory is still consistent
  }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(): void {
  if (_saveTimer) return
  _saveTimer = setTimeout(() => {
    _saveTimer = null
    saveToDisk()
  }, 1_000)
}

// Bootstrap on module load
loadFromDisk()

// ─── Public API ──────────────────────────────────────────────────────────────

export function listCrews(): Crew[] {
  return Object.values(store.crews).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getCrew(crewId: string): Crew | null {
  return store.crews[crewId] ?? null
}

export function createCrew(input: {
  name: string
  goal: string
  members: Array<Omit<CrewMember, 'id' | 'status' | 'lastActivity'> & { profileName?: string | null }>
}): Crew {
  const now = Date.now()
  const crew: Crew = {
    id: randomUUID(),
    name: input.name.trim(),
    goal: input.goal.trim(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    members: input.members.map((m) => ({
      ...m,
      id: randomUUID(),
      profileName: m.profileName ?? null,
      status: 'idle',
      lastActivity: null,
    })),
  }
  store.crews[crew.id] = crew
  saveToDisk()  // sync write — important for correctness on first create
  return crew
}

export function updateCrew(
  crewId: string,
  updates: Partial<Pick<Crew, 'name' | 'goal' | 'status'>>,
): Crew | null {
  const crew = store.crews[crewId]
  if (!crew) return null
  Object.assign(crew, { ...updates, updatedAt: Date.now() })
  scheduleSave()
  return crew
}

export function updateMemberStatus(
  crewId: string,
  sessionKey: string,
  status: CrewMemberStatus,
  lastActivity?: string,
): void {
  const crew = store.crews[crewId]
  if (!crew) return
  const member = crew.members.find((m) => m.sessionKey === sessionKey)
  if (!member) return
  member.status = status
  if (lastActivity !== undefined) member.lastActivity = lastActivity
  crew.updatedAt = Date.now()
  scheduleSave()
}

export function deleteCrew(crewId: string): boolean {
  if (!store.crews[crewId]) return false
  delete store.crews[crewId]
  saveToDisk()
  return true
}
