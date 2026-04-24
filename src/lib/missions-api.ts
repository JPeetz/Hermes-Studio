/**
 * Client-side API helpers for conductor missions.
 */

import type { Mission, MissionEvent, CreateMissionInput } from '@/types/conductor'

export async function fetchMissions(): Promise<Mission[]> {
  const res = await fetch('/api/missions')
  const data = (await res.json()) as { ok: boolean; missions?: Mission[] }
  return data.missions ?? []
}

export async function fetchMission(missionId: string): Promise<Mission | null> {
  const res = await fetch(`/api/missions/${missionId}`)
  if (!res.ok) return null
  const data = (await res.json()) as { ok: boolean; mission?: Mission }
  return data.mission ?? null
}

export async function createMission(input: CreateMissionInput): Promise<Mission> {
  const res = await fetch('/api/missions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json()) as { ok: boolean; mission?: Mission; error?: string }
  if (!data.ok || !data.mission) throw new Error(data.error ?? 'Failed to create mission')
  return data.mission
}

export async function abortMission(missionId: string): Promise<Mission> {
  const res = await fetch(`/api/missions/${missionId}/abort`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const data = (await res.json()) as { ok: boolean; mission?: Mission; error?: string }
  if (!data.ok || !data.mission) throw new Error(data.error ?? 'Failed to abort mission')
  return data.mission
}

export async function deleteMission(missionId: string): Promise<void> {
  const res = await fetch(`/api/missions/${missionId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Failed to delete mission')
  }
}

export async function fetchMissionEvents(
  missionId: string,
  limit = 50,
  offset = 0,
): Promise<MissionEvent[]> {
  const res = await fetch(`/api/missions/${missionId}/events?limit=${limit}&offset=${offset}`)
  const data = (await res.json()) as { ok: boolean; events?: MissionEvent[] }
  return data.events ?? []
}
