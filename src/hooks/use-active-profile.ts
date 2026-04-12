/**
 * useActiveProfile — returns the currently active Hermes profile name.
 *
 * Fetches from /api/profiles/list (which already exists) and returns the
 * active profile name for use in profile-scoped file views.
 * Refreshes every 30s so profile switches are reflected without reload.
 */
import { useQuery } from '@tanstack/react-query'

interface ProfilesResponse {
  profiles?: Array<{ name: string; active: boolean }>
  activeProfile?: string
}

async function fetchActiveProfile(): Promise<string> {
  try {
    const res = await fetch('/api/profiles/list')
    if (!res.ok) return 'default'
    const data = (await res.json()) as ProfilesResponse
    // The list endpoint returns { activeProfile: string, profiles: [...] }
    if (typeof data.activeProfile === 'string') return data.activeProfile
    // Fallback: scan list for active flag
    const active = data.profiles?.find((p) => p.active)
    return active?.name ?? 'default'
  } catch {
    return 'default'
  }
}

export function useActiveProfile(): string {
  const { data } = useQuery({
    queryKey: ['active-profile'],
    queryFn: fetchActiveProfile,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
  return data ?? 'default'
}
