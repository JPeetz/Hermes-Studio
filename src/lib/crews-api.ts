/**
 * Client-side API helpers for crew management.
 */

export type CrewMemberStatus = 'idle' | 'running' | 'done' | 'error'
export type CrewMemberRole = 'coordinator' | 'executor' | 'reviewer' | 'specialist'
export type CrewStatus = 'draft' | 'active' | 'paused' | 'complete'

export interface CrewMember {
  id: string
  sessionKey: string
  role: CrewMemberRole
  persona: string
  displayName: string
  roleLabel: string
  color: string
  model: string | null
  /** Profile name that scopes this agent's file explorer workspace */
  profileName: string | null
  status: CrewMemberStatus
  lastActivity: string | null
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

export interface CreateCrewInput {
  name: string
  goal: string
  members: Array<{
    persona: string
    role: CrewMemberRole
    model?: string | null
    profileName?: string | null
  }>
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchCrews(): Promise<Crew[]> {
  const res = await fetch('/api/crews')
  const data = (await res.json()) as { ok: boolean; crews?: Crew[] }
  return data.crews ?? []
}

export async function fetchCrew(crewId: string): Promise<Crew | null> {
  const res = await fetch(`/api/crews/${crewId}`)
  if (!res.ok) return null
  const data = (await res.json()) as { ok: boolean; crew?: Crew }
  return data.crew ?? null
}

export async function createCrew(input: CreateCrewInput): Promise<Crew> {
  const res = await fetch('/api/crews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json()) as { ok: boolean; crew?: Crew; error?: string }
  if (!data.ok || !data.crew) throw new Error(data.error ?? 'Failed to create crew')
  return data.crew
}

export async function updateCrew(
  crewId: string,
  updates: Partial<Pick<Crew, 'name' | 'goal' | 'status'>>,
): Promise<Crew> {
  const res = await fetch(`/api/crews/${crewId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const data = (await res.json()) as { ok: boolean; crew?: Crew; error?: string }
  if (!data.ok || !data.crew) throw new Error(data.error ?? 'Failed to update crew')
  return data.crew
}

export async function deleteCrew(crewId: string): Promise<void> {
  const res = await fetch(`/api/crews/${crewId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Failed to delete crew')
  }
}

export async function dispatchTask(
  crewId: string,
  task: string,
  target: 'all' | string = 'all',
): Promise<{ dispatched: string[] }> {
  const res = await fetch(`/api/crews/${crewId}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, target }),
  })
  const data = (await res.json()) as {
    ok: boolean
    dispatched?: string[]
    error?: string
  }
  if (!data.ok) throw new Error(data.error ?? 'Dispatch failed')
  return { dispatched: data.dispatched ?? [] }
}

export async function cloneCrew(crewId: string): Promise<Crew> {
  const res = await fetch(`/api/crews/${crewId}/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const data = (await res.json()) as { ok: boolean; crew?: Crew; error?: string }
  if (!data.ok || !data.crew) throw new Error(data.error ?? 'Failed to clone crew')
  return data.crew
}

export async function updateMemberStatus(
  crewId: string,
  memberSessionKey: string,
  memberStatus: CrewMemberStatus,
  lastActivity?: string,
): Promise<void> {
  await fetch(`/api/crews/${crewId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberSessionKey, memberStatus, lastActivity }),
  })
}
