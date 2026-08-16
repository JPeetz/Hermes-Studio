import { useQuery } from '@tanstack/react-query'
import type { DashboardStatus, EnhancedFeature } from '@/lib/feature-gates'

interface GatewayStatus {
  capabilities: Record<string, boolean>
  hermesUrl: string
  /**
   * Which server each split capability was found on, and the state of the
   * dashboard backend. /api/gateway-status has always sent these; nothing read
   * them, so the UI could not tell "no dashboard configured" apart from
   * "dashboard configured but rejecting our token" (issue #23).
   */
  capabilitySources?: Record<string, 'gateway' | 'dashboard' | null>
  dashboard?: {
    configured: boolean
    unauthorized: boolean
    url: string | null
  }
}

function useGatewayStatus() {
  return useQuery({
    queryKey: ['gateway-status'],
    queryFn: async () => {
      const res = await fetch('/api/gateway-status')
      if (!res.ok) return null
      return (await res.json()) as GatewayStatus
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useFeatureAvailable(feature: EnhancedFeature): boolean {
  const { data } = useGatewayStatus()

  return data?.capabilities?.[feature] === true
}

/**
 * Dashboard-backend state for unavailable-reason copy. Defaults to
 * "not configured" until the status query resolves, which matches the
 * pre-existing advice rather than briefly showing a token error.
 */
export function useDashboardStatus(): DashboardStatus {
  const { data } = useGatewayStatus()

  return {
    configured: data?.dashboard?.configured === true,
    unauthorized: data?.dashboard?.unauthorized === true,
  }
}
