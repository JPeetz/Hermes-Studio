/**
 * Jobs API client — talks to Hermes FastAPI /api/jobs endpoints.
 */

const HERMES_API = '/api/hermes-jobs'

export type HermesJob = {
  id: string
  name: string
  prompt: string
  schedule: Record<string, unknown>
  schedule_display?: string
  enabled: boolean
  state: string
  next_run_at?: string | null
  last_run_at?: string | null
  last_run_success?: boolean | null
  created_at?: string
  updated_at?: string
  deliver?: Array<string>
  skills?: Array<string>
  repeat?: { times?: number; completed?: number }
  run_count?: number
}

export type JobOutput = {
  filename: string
  timestamp: string
  content: string
  size: number
}

export async function fetchJobs(): Promise<Array<HermesJob>> {
  const res = await fetch(`${HERMES_API}?include_disabled=true`)
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`)
  const data = await res.json()
  return data.jobs ?? []
}

export async function createJob(input: {
  schedule: string
  prompt: string
  name?: string
  deliver?: Array<string>
  skills?: Array<string>
  repeat?: number
}): Promise<HermesJob> {
  const res = await fetch(HERMES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Failed to create job: ${res.status}`)
  }
  return (await res.json()).job
}

export async function updateJob(
  jobId: string,
  updates: Record<string, unknown>,
): Promise<HermesJob> {
  const res = await fetch(`${HERMES_API}/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`Failed to update job: ${res.status}`)
  return (await res.json()).job
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await fetch(`${HERMES_API}/${jobId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete job: ${res.status}`)
}

export async function pauseJob(jobId: string): Promise<HermesJob> {
  const res = await fetch(`${HERMES_API}/${jobId}?action=pause`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Failed to pause job: ${res.status}`)
  return (await res.json()).job
}

export async function resumeJob(jobId: string): Promise<HermesJob> {
  const res = await fetch(`${HERMES_API}/${jobId}?action=resume`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Failed to resume job: ${res.status}`)
  return (await res.json()).job
}

export async function triggerJob(jobId: string): Promise<HermesJob> {
  const res = await fetch(`${HERMES_API}/${jobId}?action=run`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`Failed to trigger job: ${res.status}`)
  return (await res.json()).job
}

export async function fetchJobOutput(
  jobId: string,
  limit = 10,
): Promise<Array<JobOutput>> {
  const res = await fetch(`${HERMES_API}/${jobId}?action=output&limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch output: ${res.status}`)
  return (await res.json()).outputs ?? []
}

export type RunEvent = {
  event: string
  run_id: string
  timestamp: number
  // tool events
  name?: string
  input?: string
  output?: string
  // message events
  delta?: string
  // run completion
  error?: string
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number }
}

/**
 * Start an ad-hoc agent run via /v1/runs.
 * Returns the run_id to subscribe to events at /api/hermes-runs/:runId/events.
 */
export async function startRun(prompt: string): Promise<string> {
  const res = await fetch('/api/hermes-runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: prompt }),
  })
  if (!res.ok) throw new Error(`Failed to start run: ${res.status}`)
  const data = await res.json()
  return data.run_id as string
}
