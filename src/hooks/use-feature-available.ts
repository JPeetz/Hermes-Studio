import { useQuery } from '@tanstack/react-query'
import type { EnhancedFeature } from '@/lib/feature-gates'

interface GatewayStatus {
  capabilities: Record<string, boolean>
  hermesUrl: string
}

export function useFeatureAvailable(feature: EnhancedFeature): boolean {
  // Config is served locally (/api/hermes-config reads/writes config.yaml),
  // so it never depends on the gateway's optional config API.
  if (feature === 'config') return true

  const { data } = useQuery({
    queryKey: ['gateway-status'],
    queryFn: async () => {
      const res = await fetch('/api/gateway-status')
      if (!res.ok) return null
      return (await res.json()) as GatewayStatus
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return data?.capabilities?.[feature] === true
}
