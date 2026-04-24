/**
 * Client-side API helpers for operations dashboard.
 */

import type { OperationAgent } from '@/types/operation'

export async function fetchOperationsOverview(): Promise<OperationAgent[]> {
  const res = await fetch('/api/operations')
  const data = (await res.json()) as { ok: boolean; agents?: OperationAgent[] }
  return data.agents ?? []
}
