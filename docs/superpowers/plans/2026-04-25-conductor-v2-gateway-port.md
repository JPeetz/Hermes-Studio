# Conductor V2 — Gateway Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub v1.19.0 Conductor with a faithful adapted port of the upstream gateway conductor — animated SVG office, real Hermes gateway orchestration, live worker monitoring, settings, and mission history.

**Architecture:** Gateway-first adapted port. The hook (`use-conductor-gateway`) drives all state; the screen routes between phases (home → active → complete). OfficeView gets a pragmatic SVG color exception; all surrounding chrome uses `var(--theme-*)`. Server routes spawn Hermes cron jobs and kill sessions.

**Tech Stack:** React 19, TypeScript, TanStack Router/Query, CSS keyframe animations, SVG, localStorage persistence

**Spec:** `docs/superpowers/specs/2026-04-25-conductor-v2-gateway-port.md`

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `src/lib/gateway-api.ts` | Gateway session types + `fetchSessions()` client helper |
| `src/types/conductor.ts` | Rewritten conductor types |
| `src/routes/api/conductor-spawn.ts` | POST: create Hermes orchestrator cron job |
| `src/routes/api/conductor-stop.ts` | POST: kill worker session keys |
| `src/screens/conductor/hooks/use-conductor-gateway.ts` | Main hook — all state, polling, lifecycle, history |
| `src/screens/conductor/conductor-screen.tsx` | Screen orchestrator — phase router, settings drawer |
| `src/screens/conductor/components/agent-avatar.tsx` | Pixel-art SVG robot avatars + accent colors |
| `src/screens/conductor/components/office-view.tsx` | Animated SVG office with 3 layouts |
| `src/screens/conductor/components/conductor-home.tsx` | Home phase — goal input, quick actions, history |
| `src/screens/conductor/components/conductor-active.tsx` | Active phase — office + workers + controls |
| `src/screens/conductor/components/conductor-complete.tsx` | Complete phase — summary, outputs, retry |
| `src/screens/conductor/components/conductor-settings.tsx` | Settings drawer — models, dir, parallel, supervised |
| `src/screens/conductor/components/cost-tracker.tsx` | Token count + estimated USD display |
| `src/screens/conductor/components/mission-event-log.tsx` | Scrollable cycling status + event stream |

### Modified files
| File | Change |
|------|--------|
| `src/server/operations-aggregator.ts` | Replace mission-store import with live gateway session query |
| `src/styles.css` | Add office animation keyframes + glow classes |

### Deleted files
| File | Reason |
|------|--------|
| `src/server/mission-store.ts` | Replaced by gateway-native approach |
| `src/routes/api/missions/index.ts` | No longer needed |
| `src/routes/api/missions/$missionId.ts` | No longer needed |
| `src/routes/api/missions/$missionId.abort.ts` | No longer needed |
| `src/routes/api/missions/$missionId.events.ts` | No longer needed |
| `src/lib/missions-api.ts` | No longer needed |
| `src/test/mission-store.test.ts` | Tests for deleted code |
| `src/test/operations-aggregator.test.ts` | Will be rewritten |
| `src/screens/conductor/components/mission-home.tsx` | Replaced |
| `src/screens/conductor/components/mission-preview.tsx` | Replaced |
| `src/screens/conductor/components/mission-active.tsx` | Replaced |
| `src/screens/conductor/components/mission-complete.tsx` | Replaced |
| `src/screens/conductor/components/worker-card.tsx` | Replaced |
| `src/screens/conductor/components/mission-event-log.tsx` | Replaced (rewritten) |
| `src/screens/conductor/components/cost-tracker.tsx` | Replaced (rewritten) |

---

### Task 1: Delete old files and create gateway API types

**Files:**
- Delete: `src/server/mission-store.ts`, `src/routes/api/missions/index.ts`, `src/routes/api/missions/$missionId.ts`, `src/routes/api/missions/$missionId.abort.ts`, `src/routes/api/missions/$missionId.events.ts`, `src/lib/missions-api.ts`, `src/test/mission-store.test.ts`, `src/test/operations-aggregator.test.ts`, `src/screens/conductor/components/mission-home.tsx`, `src/screens/conductor/components/mission-preview.tsx`, `src/screens/conductor/components/mission-active.tsx`, `src/screens/conductor/components/mission-complete.tsx`, `src/screens/conductor/components/worker-card.tsx`, `src/screens/conductor/components/mission-event-log.tsx`, `src/screens/conductor/components/cost-tracker.tsx`
- Create: `src/lib/gateway-api.ts`
- Rewrite: `src/types/conductor.ts`

- [ ] **Step 1: Delete all old conductor files**

```bash
rm -f src/server/mission-store.ts
rm -f src/routes/api/missions/index.ts
rm -f src/routes/api/missions/\$missionId.ts
rm -f src/routes/api/missions/\$missionId.abort.ts
rm -f src/routes/api/missions/\$missionId.events.ts
rm -f src/lib/missions-api.ts
rm -f src/test/mission-store.test.ts
rm -f src/test/operations-aggregator.test.ts
rm -f src/screens/conductor/components/mission-home.tsx
rm -f src/screens/conductor/components/mission-preview.tsx
rm -f src/screens/conductor/components/mission-active.tsx
rm -f src/screens/conductor/components/mission-complete.tsx
rm -f src/screens/conductor/components/worker-card.tsx
rm -f src/screens/conductor/components/mission-event-log.tsx
rm -f src/screens/conductor/components/cost-tracker.tsx
rmdir src/routes/api/missions 2>/dev/null || true
```

- [ ] **Step 2: Create `src/lib/gateway-api.ts`**

This provides the `GatewaySession` type and `fetchSessions()` helper used by the conductor hook. Adapted from upstream's `src/lib/gateway-api.ts`.

```typescript
/**
 * Gateway session types and fetch helpers for conductor integration.
 *
 * Adapted from upstream hermes-workspace gateway-api.ts.
 * Only the subset needed by the conductor hook is included here.
 */

export type GatewaySessionUsage = {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  tokens?: number
  cost?: number
}

export type GatewaySessionMessage = {
  role?: string
  content?: Array<{ type?: string; text?: string }>
  text?: string
}

export type GatewaySession = {
  key?: string
  friendlyId?: string
  kind?: string
  status?: string
  state?: string
  model?: string
  label?: string
  title?: string
  derivedTitle?: string
  task?: string
  initialMessage?: string
  progress?: number
  tokenCount?: number
  totalTokens?: number
  contextTokens?: number
  maxTokens?: number
  contextWindow?: number
  cost?: number
  createdAt?: number | string
  startedAt?: number | string
  updatedAt?: number | string
  lastMessage?: GatewaySessionMessage | null
  messages?: unknown[]
  usage?: GatewaySessionUsage
  [key: string]: unknown
}

export type GatewaySessionsResponse = {
  sessions?: Array<GatewaySession>
}

export async function fetchSessions(): Promise<GatewaySessionsResponse> {
  const res = await fetch('/api/sessions')
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to fetch sessions (${res.status})`)
  }
  return (await res.json()) as GatewaySessionsResponse
}
```

- [ ] **Step 3: Rewrite `src/types/conductor.ts`**

Replace the entire file with gateway-native types adapted from the upstream hook's type definitions.

```typescript
/**
 * Conductor types — gateway-native mission orchestration.
 *
 * These types match the upstream gateway conductor, NOT the old
 * file-backed mission-store types that were deleted.
 */

export type MissionPhase = 'idle' | 'decomposing' | 'running' | 'complete'

export type ConductorSettings = {
  orchestratorModel: string
  workerModel: string
  projectsDir: string
  maxParallel: number
  supervised: boolean
}

export type ConductorWorkerStatus = 'running' | 'complete' | 'stale' | 'idle'

export type ConductorWorker = {
  key: string
  label: string
  model: string | null
  status: ConductorWorkerStatus
  updatedAt: string | null
  displayName: string
  totalTokens: number
  contextTokens: number
  tokenUsageLabel: string
  raw: import('@/lib/gateway-api').GatewaySession
}

export type ConductorTask = {
  id: string
  title: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  workerKey: string | null
  output: string | null
}

export type MissionHistoryWorkerDetail = {
  label: string
  model: string
  totalTokens: number
  personaEmoji: string
  personaName: string
}

export type MissionHistoryEntry = {
  id: string
  goal: string
  startedAt: string
  completedAt: string
  workerCount: number
  totalTokens: number
  status: 'completed' | 'failed'
  projectPath: string | null
  outputPath?: string | null
  workerSummary?: string[]
  outputText?: string
  streamText?: string
  completeSummary?: string
  workerDetails?: MissionHistoryWorkerDetail[]
  error?: string | null
}

export type StreamEvent =
  | { type: 'assistant'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool'; name?: string; phase?: string; data?: Record<string, unknown> }
  | { type: 'done'; state?: string; message?: string }
  | { type: 'error'; message: string }
  | { type: 'started'; runId?: string; sessionKey?: string }

export type PersistedMission = {
  goal: string
  phase: MissionPhase
  missionStartedAt: string | null
  isPaused: boolean
  pausedElapsedMs: number
  accumulatedPausedMs: number
  pauseStartedAt: string | null
  workerKeys: string[]
  workerLabels: string[]
  workerOutputs: Record<string, string>
  streamText: string
  planText: string
  completedAt: string | null
  tasks: ConductorTask[]
}

/** Default settings — empty model strings = Hermes default */
export const DEFAULT_CONDUCTOR_SETTINGS: ConductorSettings = {
  orchestratorModel: '',
  workerModel: '',
  projectsDir: '',
  maxParallel: 1,
  supervised: false,
}
```

- [ ] **Step 4: Verify TypeScript compiles (types only)**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit src/types/conductor.ts src/lib/gateway-api.ts 2>&1 | head -20`

Expected: No errors (or only errors from files that import deleted modules — those are expected at this stage).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(conductor-v2): delete old mission-store files, add gateway types

Remove the file-backed mission-store and all its API routes, client lib,
and tests. Add gateway-api types and rewrite conductor types for the
gateway-native conductor."
```

---

### Task 2: Server API routes — conductor-spawn and conductor-stop

**Files:**
- Create: `src/routes/api/conductor-spawn.ts`
- Create: `src/routes/api/conductor-stop.ts`

- [ ] **Step 1: Create `src/routes/api/conductor-spawn.ts`**

Adapted from upstream. Creates a one-shot Hermes cron job with orchestrator prompt. Uses our existing `gateway-capabilities.ts` for `HERMES_API`, `BEARER_TOKEN`, `dashboardFetch`, `ensureGatewayProbed` and `rate-limit.ts` for `requireJsonContentType`.

```typescript
/**
 * Conductor mission spawn — Hermes-backed.
 *
 * Spawns a one-shot Hermes job whose prompt is the orchestrator instructions.
 * The orchestrator session, when it runs, uses the create_task / delegate
 * tools to spawn worker agents. The Conductor UI then polls /api/sessions
 * + /api/history to track workers.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import { requireJsonContentType } from '../../server/rate-limit'
import {
  HERMES_API,
  BEARER_TOKEN,
  dashboardFetch,
  ensureGatewayProbed,
} from '../../server/gateway-capabilities'

let cachedSkill: string | null = null

type ConductorSpawnBody = {
  goal?: unknown
  orchestratorModel?: unknown
  workerModel?: unknown
  projectsDir?: unknown
  maxParallel?: unknown
  supervised?: unknown
}

function repoRoot(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    return resolve(here, '..', '..', '..')
  } catch {
    return process.cwd()
  }
}

function loadDispatchSkill(): string {
  if (cachedSkill !== null) return cachedSkill
  const candidates = [
    resolve(repoRoot(), 'skills/workspace-dispatch/SKILL.md'),
    resolve(process.cwd(), 'skills/workspace-dispatch/SKILL.md'),
    resolve(process.env.HOME ?? '~', '.hermes/skills/workspace-dispatch/SKILL.md'),
    resolve(
      process.env.HOME ?? '~',
      '.ocplatform/workspace/skills/workspace-dispatch/SKILL.md',
    ),
  ]
  for (const p of candidates) {
    try {
      cachedSkill = readFileSync(p, 'utf-8')
      return cachedSkill
    } catch {
      continue
    }
  }
  cachedSkill = ''
  return cachedSkill
}

function readOptionalString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readMaxParallel(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1
  return Math.min(5, Math.max(1, Math.round(value)))
}

function buildOrchestratorPrompt(
  goal: string,
  skill: string,
  options: {
    orchestratorModel: string
    workerModel: string
    projectsDir: string
    maxParallel: number
    supervised: boolean
  },
): string {
  const outputBase = options.projectsDir || '/tmp'
  const outputPrefix =
    outputBase === '/tmp' ? '/tmp/dispatch-<slug>' : `${outputBase}/dispatch-<slug>`

  return [
    'You are a mission orchestrator. Execute this mission autonomously.',
    '',
    '## Dispatch Skill Instructions',
    '',
    skill || '(workspace-dispatch skill not found locally; proceed using create_task to spawn workers)',
    '',
    '## Mission',
    '',
    `Goal: ${goal}`,
    ...(options.orchestratorModel
      ? ['', `Use model: ${options.orchestratorModel} for the orchestrator`]
      : []),
    ...(options.workerModel
      ? ['', `Use model: ${options.workerModel} for all workers`]
      : []),
    ...(options.maxParallel > 1
      ? [
          '',
          `Run up to ${options.maxParallel} workers in parallel when tasks are independent`,
        ]
      : [
          '',
          'Spawn workers one at a time. Do NOT wait for workers to finish — the UI handles tracking.',
        ]),
    ...(options.supervised
      ? ['', 'Supervised mode is enabled. Require approval before each task.']
      : []),
    '',
    '## Critical Rules',
    '- Use create_task / delegate_task to create worker agents for each task',
    '- Do NOT do the work yourself — spawn workers',
    '- For simple tasks (single file, quick mockup), use ONLY 1 task with 1 worker — do not over-decompose',
    '- Do NOT ask for confirmation — start immediately',
    '- Label workers as "worker-<task-slug>" so the UI can track them',
    '- Each worker gets a self-contained prompt with the task + exit criteria',
    `- Workers should write output to ${outputPrefix} directories`,
    '- After spawning all workers, report your plan summary and finish. The UI tracks worker completion automatically.',
    '- Report a summary when all tasks are done',
  ].join('\n')
}

function authHeaders(): Record<string, string> {
  return BEARER_TOKEN ? { Authorization: `Bearer ${BEARER_TOKEN}` } : {}
}

function nowPlusSecondsIso(seconds: number): string {
  const t = new Date(Date.now() + seconds * 1000)
  return t.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

async function createHermesJob(payload: {
  name: string
  schedule: string
  prompt: string
  deliver?: string
}): Promise<{ id?: string; name?: string; error?: string }> {
  const body = JSON.stringify({
    name: payload.name,
    schedule: payload.schedule,
    prompt: payload.prompt,
    deliver: payload.deliver ?? 'local',
  })
  const capabilities = await ensureGatewayProbed()
  const res = capabilities.dashboard.available
    ? await dashboardFetch('/api/cron/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
    : await fetch(`${HERMES_API}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body,
      })
  const text = await res.text()
  let data: { job?: { id?: string; name?: string }; error?: string } = {}
  try {
    data = JSON.parse(text)
  } catch {
    return { error: text || `HTTP ${res.status}` }
  }
  if (!res.ok || data.error) {
    return { error: data.error || `HTTP ${res.status}` }
  }
  return { id: data.job?.id, name: data.job?.name }
}

export const Route = createFileRoute('/api/conductor-spawn')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        try {
          const body = (await request
            .json()
            .catch(() => ({}))) as ConductorSpawnBody
          const goal = readOptionalString(body.goal)
          const orchestratorModel = readOptionalString(body.orchestratorModel)
          const workerModel = readOptionalString(body.workerModel)
          const projectsDir = readOptionalString(body.projectsDir)
          const maxParallel = readMaxParallel(body.maxParallel)
          const supervised = body.supervised === true

          if (!goal) {
            return json({ ok: false, error: 'goal required' }, { status: 400 })
          }

          const skill = loadDispatchSkill()
          const prompt = buildOrchestratorPrompt(goal, skill, {
            orchestratorModel,
            workerModel,
            projectsDir,
            maxParallel,
            supervised,
          })

          const jobName = `conductor-${Date.now()}`
          const result = await createHermesJob({
            name: jobName,
            schedule: nowPlusSecondsIso(5),
            prompt,
            deliver: 'local',
          })

          if (result.error) {
            return json(
              { ok: false, error: result.error },
              { status: 502 },
            )
          }

          const jobId = result.id ?? jobName
          return json({
            ok: true,
            sessionKey: `cron_${jobId}_pending`,
            sessionKeyPrefix: `cron_${jobId}_`,
            jobId,
            jobName: result.name ?? jobName,
            runId: null,
          })
        } catch (error) {
          return json(
            {
              ok: false,
              error:
                error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
```

- [ ] **Step 2: Create `src/routes/api/conductor-stop.ts`**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../server/auth-middleware'
import { requireJsonContentType } from '../../server/rate-limit'
import { deleteSession, ensureGatewayProbed } from '../../server/hermes-api'

export const Route = createFileRoute('/api/conductor-stop')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        try {
          await ensureGatewayProbed()
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
          const sessionKeys = Array.isArray(body.sessionKeys)
            ? body.sessionKeys.filter(
                (value): value is string =>
                  typeof value === 'string' && value.trim().length > 0,
              )
            : []

          let deleted = 0
          for (const sessionKey of sessionKeys) {
            try {
              await deleteSession(sessionKey)
              deleted += 1
            } catch {
              // Ignore per-session delete errors so one bad key doesn't block the rest.
            }
          }

          return json({ ok: true, deleted })
        } catch (error) {
          return json(
            {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
```

- [ ] **Step 3: Verify routes parse**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit src/routes/api/conductor-spawn.ts src/routes/api/conductor-stop.ts 2>&1 | head -20`

Expected: No errors (or only downstream errors from imports that are fine).

- [ ] **Step 4: Commit**

```bash
git add src/routes/api/conductor-spawn.ts src/routes/api/conductor-stop.ts
git commit -m "feat(conductor-v2): add conductor-spawn and conductor-stop API routes

POST /api/conductor-spawn creates a one-shot Hermes cron job with
orchestrator prompt. POST /api/conductor-stop kills worker sessions."
```

---

### Task 3: CSS animations for office view

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add office animation keyframes to `src/styles.css`**

Append the following to the end of `src/styles.css`:

```css
/* ── Office View Animations ── */

@keyframes office-idle-float {
  0%, 100% { transform: translateY(-3px); }
  50% { transform: translateY(3px); }
}

@keyframes office-status-glow-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.38), 0 0 14px 2px rgba(16, 185, 129, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0), 0 0 22px 6px rgba(16, 185, 129, 0.38); }
}

@keyframes office-status-glow-amber {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.32), 0 0 12px 2px rgba(245, 158, 11, 0.26); }
  50% { box-shadow: 0 0 0 7px rgba(245, 158, 11, 0), 0 0 18px 4px rgba(245, 158, 11, 0.34); }
}

@keyframes office-status-glow-blue {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3), 0 0 12px 2px rgba(59, 130, 246, 0.25); }
  50% { box-shadow: 0 0 0 7px rgba(59, 130, 246, 0), 0 0 18px 4px rgba(59, 130, 246, 0.32); }
}

@keyframes office-status-glow-neutral {
  0%, 100% { box-shadow: 0 0 0 0 rgba(115, 115, 115, 0.18), 0 0 10px 2px rgba(115, 115, 115, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(115, 115, 115, 0), 0 0 14px 3px rgba(115, 115, 115, 0.24); }
}

@keyframes office-status-glow-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.34), 0 0 12px 2px rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 0 0 7px rgba(239, 68, 68, 0), 0 0 19px 5px rgba(239, 68, 68, 0.36); }
}

.office-agent-stationary {
  animation: office-idle-float 3s ease-in-out infinite;
}

.office-status-glow-active {
  animation: office-status-glow-green 2.2s ease-in-out infinite;
}

.office-status-glow-idle {
  animation: office-status-glow-neutral 2.6s ease-in-out infinite;
}

.office-status-glow-starting {
  animation: office-status-glow-blue 2.4s ease-in-out infinite;
}

.office-status-glow-paused {
  animation: office-status-glow-amber 2.6s ease-in-out infinite;
}

.office-status-glow-error {
  animation: office-status-glow-red 2.2s ease-in-out infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles.css
git commit -m "feat(conductor-v2): add office animation keyframes to styles.css

Add CSS keyframe animations for agent idle float, status glow pulses
(green, amber, blue, neutral, red), and corresponding utility classes."
```

---

### Task 4: Agent avatar component

**Files:**
- Create: `src/screens/conductor/components/agent-avatar.tsx`

- [ ] **Step 1: Create the agent avatar component**

This is a direct port from upstream `agent-avatar.tsx`. Pixel-art SVG robot avatars with 10 variants and 10 accent color entries.

```typescript
/**
 * Pixel-art SVG robot avatars for conductor agents.
 *
 * Ported from upstream hermes-workspace agent-avatar.tsx.
 * 10 variants with different body shapes + detail overlays.
 * AGENT_ACCENT_COLORS provides per-agent color theming.
 */

type AgentAccentColor = {
  bar: string
  border: string
  avatar: string
  text: string
  ring: string
  hex: string
}

export const AGENT_AVATARS = ['🔍', '✍️', '📝', '🧪', '🎨', '📊', '🛡️', '⚡', '🔬', '🎯'] as const
export const AGENT_AVATAR_COUNT = 10

const LEGACY_AGENT_AVATAR_INDEX = new Map<string, number>(
  AGENT_AVATARS.map((avatar, index) => [avatar, index]),
)

export function normalizeAgentAvatarIndex(value: unknown, fallbackIndex = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.trunc(value)
    if (normalized >= 0) return normalized % AGENT_AVATAR_COUNT
  }
  if (typeof value === 'string') {
    const legacy = LEGACY_AGENT_AVATAR_INDEX.get(value.trim())
    if (legacy !== undefined) return legacy
  }
  const fallback = Math.trunc(fallbackIndex)
  return ((fallback % AGENT_AVATAR_COUNT) + AGENT_AVATAR_COUNT) % AGENT_AVATAR_COUNT
}

export function darkenHexColor(color: string, amount = 0.2): string {
  const hex = color.trim()
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex
  const expanded =
    normalized.length === 3
      ? normalized.split('').map((char) => `${char}${char}`).join('')
      : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return color

  const r = Math.round(parseInt(expanded.slice(0, 2), 16) * (1 - amount))
  const g = Math.round(parseInt(expanded.slice(2, 4), 16) * (1 - amount))
  const b = Math.round(parseInt(expanded.slice(4, 6), 16) * (1 - amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export interface AgentAvatarProps {
  index: number
  color: string
  size?: number
  className?: string
}

export function AgentAvatar({
  index,
  color,
  size = 40,
  className,
}: AgentAvatarProps) {
  const variant = normalizeAgentAvatarIndex(index, 0)
  const shade = darkenHexColor(color, 0.2)
  const outline = darkenHexColor(color, 0.35)
  const eye = '#f8fafc'

  const baseParts = (() => {
    switch (variant) {
      case 2:
        return {
          head: (
            <>
              <rect x="16" y="9" width="16" height="12" fill={color} />
              <rect x="14" y="11" width="20" height="8" fill={color} />
              <rect x="30" y="9" width="2" height="12" fill={shade} />
              <rect x="14" y="17" width="20" height="2" fill={shade} />
              <rect x="16" y="19" width="16" height="2" fill={shade} />
            </>
          ),
          body: { x: 14, y: 22, w: 20, h: 14 },
          arms: { leftX: 9, rightX: 35, y: 24, w: 4, h: 10 },
          legs: { y: 36, w: 5, h: 6, leftX: 17, rightX: 26 },
        }
      case 3:
        return {
          head: (
            <>
              <rect x="15" y="10" width="18" height="11" fill={color} />
              <rect x="31" y="10" width="2" height="11" fill={shade} />
              <rect x="14" y="19" width="20" height="3" fill={shade} />
            </>
          ),
          body: { x: 12, y: 22, w: 24, h: 15 },
          arms: { leftX: 7, rightX: 37, y: 24, w: 5, h: 11 },
          legs: { y: 37, w: 6, h: 5, leftX: 16, rightX: 26 },
        }
      case 4:
        return {
          head: (
            <>
              <rect x="18" y="9" width="12" height="14" fill={color} />
              <rect x="28" y="9" width="2" height="14" fill={shade} />
              <rect x="18" y="21" width="12" height="2" fill={shade} />
            </>
          ),
          body: { x: 17, y: 23, w: 14, h: 15 },
          arms: { leftX: 12, rightX: 32, y: 25, w: 4, h: 10 },
          legs: { y: 38, w: 4, h: 5, leftX: 19, rightX: 25 },
        }
      case 8:
        return {
          head: (
            <>
              <rect x="17" y="12" width="14" height="11" fill={color} />
              <rect x="29" y="12" width="2" height="11" fill={shade} />
              <rect x="17" y="21" width="14" height="2" fill={shade} />
            </>
          ),
          body: { x: 16, y: 23, w: 16, h: 12 },
          arms: { leftX: 12, rightX: 32, y: 25, w: 3, h: 8 },
          legs: { y: 35, w: 4, h: 6, leftX: 18, rightX: 25 },
        }
      default:
        return {
          head: (
            <>
              <rect x="16" y="10" width="16" height="12" fill={color} />
              <rect x="30" y="10" width="2" height="12" fill={shade} />
              <rect x="16" y="20" width="16" height="2" fill={shade} />
            </>
          ),
          body: { x: 14, y: 22, w: 20, h: 14 },
          arms: { leftX: 10, rightX: 34, y: 24, w: 4, h: 10 },
          legs: { y: 36, w: 5, h: 6, leftX: 17, rightX: 26 },
        }
    }
  })()

  const bodyParts = (
    <>
      {baseParts.head}
      <rect x={baseParts.body.x} y={baseParts.body.y} width={baseParts.body.w} height={baseParts.body.h} fill={color} />
      <rect x={baseParts.body.x + baseParts.body.w - 2} y={baseParts.body.y} width="2" height={baseParts.body.h} fill={shade} />
      <rect x={baseParts.body.x} y={baseParts.body.y + baseParts.body.h - 2} width={baseParts.body.w} height="2" fill={shade} />
      <rect x={baseParts.arms.leftX} y={baseParts.arms.y} width={baseParts.arms.w} height={baseParts.arms.h} fill={color} />
      <rect x={baseParts.arms.rightX} y={baseParts.arms.y} width={baseParts.arms.w} height={baseParts.arms.h} fill={color} />
      <rect x={baseParts.arms.leftX + Math.max(0, baseParts.arms.w - 1)} y={baseParts.arms.y} width="1" height={baseParts.arms.h} fill={shade} />
      <rect x={baseParts.arms.rightX + Math.max(0, baseParts.arms.w - 1)} y={baseParts.arms.y} width="1" height={baseParts.arms.h} fill={shade} />
      <rect x={baseParts.legs.leftX} y={baseParts.legs.y} width={baseParts.legs.w} height={baseParts.legs.h} fill={color} />
      <rect x={baseParts.legs.rightX} y={baseParts.legs.y} width={baseParts.legs.w} height={baseParts.legs.h} fill={color} />
      <rect x={baseParts.legs.leftX + Math.max(0, baseParts.legs.w - 1)} y={baseParts.legs.y} width="1" height={baseParts.legs.h} fill={shade} />
      <rect x={baseParts.legs.rightX + Math.max(0, baseParts.legs.w - 1)} y={baseParts.legs.y} width="1" height={baseParts.legs.h} fill={shade} />
    </>
  )

  const details = (() => {
    switch (variant) {
      case 0:
        return (
          <>
            <rect x="23" y="6" width="2" height="4" fill={color} />
            <circle cx="24" cy="5" r="1.5" fill={eye} />
            <circle cx="20" cy="16" r="1.6" fill={eye} />
            <circle cx="28" cy="16" r="1.6" fill={eye} />
            <rect x="19" y="20" width="10" height="2" fill={outline} />
            <rect x="18" y="28" width="12" height="2" fill={shade} />
          </>
        )
      case 1:
        return (
          <>
            <rect x="17" y="14" width="14" height="5" fill={eye} opacity="0.95" />
            <rect x="17" y="18" width="14" height="1" fill={shade} />
            <rect x="19" y="28" width="10" height="2" fill={shade} />
            <rect x="13" y="15" width="3" height="2" fill={shade} />
            <rect x="32" y="15" width="3" height="2" fill={shade} />
          </>
        )
      case 2:
        return (
          <>
            <circle cx="19" cy="16" r="2.2" fill={eye} />
            <circle cx="29" cy="16" r="2.2" fill={eye} />
            <rect x="20" y="20" width="8" height="2" fill={shade} />
            <rect x="20" y="29" width="8" height="2" fill={shade} />
          </>
        )
      case 3:
        return (
          <>
            <rect x="18" y="15" width="4" height="2" fill={eye} />
            <rect x="26" y="15" width="4" height="2" fill={eye} />
            <rect x="16" y="18" width="16" height="2" fill={outline} />
            <rect x="18" y="28" width="12" height="2" fill={outline} />
            <rect x="16" y="31" width="16" height="2" fill={shade} />
          </>
        )
      case 4:
        return (
          <>
            <circle cx="21" cy="16" r="1.7" fill={eye} />
            <circle cx="27" cy="16" r="1.7" fill={eye} />
            <rect x="22" y="20" width="4" height="1" fill={shade} />
            <rect x="20" y="29" width="8" height="2" fill={shade} />
            <rect x="21" y="32" width="6" height="1" fill={outline} />
          </>
        )
      case 5:
        return (
          <>
            <rect x="18" y="5" width="2" height="5" fill={color} />
            <rect x="28" y="5" width="2" height="5" fill={color} />
            <circle cx="19" cy="4" r="1.6" fill={eye} />
            <circle cx="29" cy="4" r="1.6" fill={eye} />
            <circle cx="20" cy="16" r="1.6" fill={eye} />
            <circle cx="28" cy="16" r="1.6" fill={eye} />
            <rect x="19" y="20" width="10" height="2" fill={shade} />
            <rect x="18" y="28" width="12" height="2" fill={shade} />
          </>
        )
      case 6:
        return (
          <>
            <circle cx="24" cy="16" r="3.2" fill={eye} />
            <circle cx="24" cy="16" r="1.3" fill={shade} />
            <rect x="18" y="20" width="12" height="2" fill={outline} />
            <rect x="17" y="28" width="2" height="2" fill={shade} />
            <rect x="19" y="30" width="2" height="2" fill={shade} />
            <rect x="21" y="28" width="2" height="2" fill={shade} />
            <rect x="23" y="30" width="2" height="2" fill={shade} />
            <rect x="25" y="28" width="2" height="2" fill={shade} />
            <rect x="27" y="30" width="2" height="2" fill={shade} />
            <rect x="29" y="28" width="2" height="2" fill={shade} />
          </>
        )
      case 7:
        return (
          <>
            <rect x="21" y="7" width="6" height="3" fill={color} />
            <rect x="22" y="5" width="4" height="2" fill={color} />
            <rect x="18" y="15" width="4" height="2" fill={eye} />
            <rect x="26" y="15" width="4" height="2" fill={eye} />
            <rect x="17" y="18" width="14" height="2" fill={outline} />
            <rect x="19" y="28" width="10" height="2" fill={outline} />
          </>
        )
      case 8:
        return (
          <>
            <circle cx="20" cy="17" r="2.3" fill={eye} />
            <circle cx="28" cy="17" r="2.3" fill={eye} />
            <rect x="21" y="21" width="6" height="1" fill={shade} />
            <rect x="20" y="27" width="8" height="2" fill={shade} />
          </>
        )
      case 9:
      default:
        return (
          <>
            <circle cx="19" cy="16" r="2.4" fill={eye} />
            <circle cx="29" cy="16" r="1.4" fill={eye} />
            <rect x="17" y="20" width="4" height="1" fill={shade} />
            <rect x="23" y="20" width="3" height="1" fill={shade} />
            <rect x="28" y="20" width="2" height="1" fill={shade} />
            <rect x="18" y="28" width="2" height="2" fill={outline} />
            <rect x="20" y="30" width="2" height="2" fill={outline} />
            <rect x="22" y="28" width="2" height="2" fill={outline} />
            <rect x="24" y="30" width="2" height="2" fill={outline} />
            <rect x="26" y="28" width="2" height="2" fill={outline} />
            <rect x="28" y="30" width="2" height="2" fill={outline} />
            <rect x="31" y="24" width="2" height="4" fill={shade} />
          </>
        )
    }
  })()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
      className={className}
      shapeRendering="crispEdges"
    >
      <rect x="5" y="5" width="38" height="38" fill={color} opacity="0.08" />
      <rect x="7" y="7" width="34" height="34" fill="white" opacity="0.92" />
      <rect x="7" y="7" width="34" height="34" fill="none" stroke={outline} strokeWidth="1" />
      {bodyParts}
      {details}
    </svg>
  )
}

export const AGENT_ACCENT_COLORS: AgentAccentColor[] = [
  { bar: 'bg-orange-500', border: 'border-orange-500', avatar: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-500/20' },
  { bar: 'bg-blue-500', border: 'border-blue-500', avatar: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-500/20' },
  { bar: 'bg-violet-500', border: 'border-violet-500', avatar: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-500/20' },
  { bar: 'bg-emerald-500', border: 'border-emerald-500', avatar: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-500/20' },
  { bar: 'bg-rose-500', border: 'border-rose-500', avatar: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-500/20' },
  { bar: 'bg-amber-500', border: 'border-amber-500', avatar: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-500/20' },
  { bar: 'bg-cyan-500', border: 'border-cyan-500', avatar: 'bg-cyan-100', text: 'text-cyan-600', ring: 'ring-cyan-500/20' },
  { bar: 'bg-fuchsia-500', border: 'border-fuchsia-500', avatar: 'bg-fuchsia-100', text: 'text-fuchsia-600', ring: 'ring-fuchsia-500/20' },
  { bar: 'bg-lime-500', border: 'border-lime-500', avatar: 'bg-lime-100', text: 'text-lime-700', ring: 'ring-lime-500/20' },
  { bar: 'bg-sky-500', border: 'border-sky-500', avatar: 'bg-sky-100', text: 'text-sky-600', ring: 'ring-sky-500/20' },
].map((accent, index) => ({
  ...accent,
  hex: ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#d946ef', '#84cc16', '#0ea5e9'][index] ?? '#f97316',
}))

export const AGENT_NAMES = ['Nova', 'Pixel', 'Blaze', 'Echo', 'Sage', 'Drift', 'Flux', 'Volt']
export const AGENT_EMOJIS = ['🤖', '⚡', '🔥', '🌊', '🌿', '💫', '🔮', '⭐']

export function getAgentPersona(index: number) {
  return {
    name: AGENT_NAMES[index % AGENT_NAMES.length],
    emoji: AGENT_EMOJIS[index % AGENT_EMOJIS.length],
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/conductor/components/agent-avatar.tsx
git commit -m "feat(conductor-v2): add pixel-art agent avatar component

10 SVG robot variants with per-agent accent colors, persona names/emojis.
Ported from upstream hermes-workspace agent-avatar.tsx."
```

---

### Task 5: Office view component

**Files:**
- Create: `src/screens/conductor/components/office-view.tsx`

This is the largest visual component. Port the full upstream OfficeView with 3 layouts (Grid, Roundtable, War Room), desk SVGs, social spots, agent wandering, speech bubbles, and status glows.

- [ ] **Step 1: Create the office view component**

Create `src/screens/conductor/components/office-view.tsx` — a faithful adapted port of the upstream's 892-line OfficeView. The file is too large to inline completely here. Port the following from `upstream:/tmp/hermes-workspace/src/screens/gateway/components/office-view.tsx`:

1. **All type definitions**: `AgentWorkingStatus`, `AgentWorkingRow`, `OfficeViewProps`, `OfficeLayoutTemplate`, `SocialSpotType`, `SocialSpot`
2. **All desk position arrays**: `GRID_DESK_POSITIONS`, `ROUNDTABLE_DESK_POSITIONS`, `WARROOM_DESK_POSITIONS`
3. **All social spot arrays**: `GRID_SOCIAL_SPOTS`, `ROUNDTABLE_SOCIAL_SPOTS`, `WARROOM_SOCIAL_SPOTS`
4. **Lookup maps**: `DESK_POSITIONS_BY_TEMPLATE`, `SOCIAL_SPOTS_BY_TEMPLATE`, `LAYOUT_TEMPLATE_OPTIONS`
5. **Helper functions**: `truncateSpeech`, `getSpeechLine`, `getStatusDotClass`, `getAgentStatusGlowClass`, `getAgentStatusGlowColor`, `truncateMonitorText`, `getDeskMonitorText`, `getAgentEmoji`, `getAgentStatusMeta`
6. **SVG furniture**: `DeskSVG`, `CoffeeMachineSVG`, `WaterCoolerSVG`, `SnackBarSVG`, `PlantSVG`
7. **Main `OfficeView` component**: Layout picker, tick animation, agent position calculation with wandering, SVG canvas with desks/spots, HTML overlay for agents with speech bubbles and avatars, mobile card list fallback, header with badges, footer legend

**Key adaptations from upstream:**
- Change `clawsuite:office-layout` localStorage key to `hermes-studio:office-layout`
- Change "ClawSuite Office" header text to "Mission Control"
- Import `AgentAvatar`, `AGENT_ACCENT_COLORS` from `./agent-avatar`
- Use `cn()` from `@/lib/utils`
- Export `AgentWorkingRow` and `AgentWorkingStatus` types for use by conductor screen

The implementer MUST read the upstream file at `/tmp/hermes-workspace/src/screens/gateway/components/office-view.tsx` (892 lines) and port it faithfully with the adaptations listed above. No functionality should be omitted.

- [ ] **Step 2: Verify the component compiles**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit src/screens/conductor/components/office-view.tsx 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/screens/conductor/components/office-view.tsx
git commit -m "feat(conductor-v2): add animated SVG office view component

Three layouts (Grid, Roundtable, War Room), desk/monitor/chair SVGs,
social spots (coffee, water, plant, snacks), agent wandering animations,
speech bubbles, status glow effects, mobile card fallback.
Ported from upstream hermes-workspace office-view.tsx."
```

---

### Task 6: Main conductor hook — use-conductor-gateway

**Files:**
- Create: `src/screens/conductor/hooks/use-conductor-gateway.ts`

This is the engine — all state management, session polling, worker tracking, mission lifecycle, history persistence. ~1000+ lines adapted from the upstream's 1283-line hook.

- [ ] **Step 1: Create the hooks directory and file**

```bash
mkdir -p src/screens/conductor/hooks
```

- [ ] **Step 2: Create `src/screens/conductor/hooks/use-conductor-gateway.ts`**

The implementer MUST read the upstream file at `/tmp/hermes-workspace/src/screens/gateway/hooks/use-conductor-gateway.ts` (1283 lines) and port it faithfully.

**Key adaptations from upstream:**
- Import `fetchSessions` and `GatewaySession` from `@/lib/gateway-api` (our new file, NOT `../../lib/gateway-api`)
- Import types from `@/types/conductor` instead of defining them inline
- All helper functions (lines 1-632) port directly: `extractTasksFromPlan`, `readString`, `readNumber`, `readRecord`, `toIso`, `loadPersistedMission`, `loadConductorSettings`, `persistConductorSettings`, `loadMissionHistory`, `appendMissionHistory`, `persistMission`, `clearPersistedMission`, `clearMissionHistoryStorage`, `readContextTokens`, `deriveWorkerStatus`, `workersLookComplete`, `prettifyCronLabel`, `formatDisplayName`, `formatTokenUsage`, `toWorker`, `extractHistoryMessageText`, `getLastAssistantMessage`, `extractProjectPath`, `buildMissionOutputPath`, `summarizeWorkers`, `buildCompleteSummary`, `buildMissionOutputText`, `fetchWorkerOutput`
- The main `useConductorGateway()` function (lines 634-1283) ports directly with all its state, queries, effects, and mutations
- Export: `useConductorGateway`, `ConductorSettings`, `ConductorWorker`, `ConductorTask`, `MissionHistoryEntry`, `MissionHistoryWorkerDetail`

The hook returns:
```typescript
{
  phase, goal, orchestratorSessionKey, streamText, planText,
  streamEvents, streamError, timeoutWarning, dismissTimeoutWarning,
  missionStartedAt, isPaused, pausedElapsedMs, pausedAtMs,
  missionElapsedMs, completedAt, tasks, workers, activeWorkers,
  missionHistory, hasPersistedMission, selectedHistoryEntry,
  setSelectedHistoryEntry, recentSessions, missionWorkerKeys,
  workerOutputs, conductorSettings, setConductorSettings,
  sendMission, pauseAgent, isSending, isPausing,
  resetMission, resetSavedState, stopMission, retryMission,
  refreshWorkers, isRefreshingWorkers,
}
```

- [ ] **Step 3: Verify the hook compiles**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit src/screens/conductor/hooks/use-conductor-gateway.ts 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add src/screens/conductor/hooks/use-conductor-gateway.ts
git commit -m "feat(conductor-v2): add use-conductor-gateway hook

All state management, session polling, worker tracking, mission lifecycle,
localStorage persistence, mission history. ~1000 lines adapted from
upstream hermes-workspace use-conductor-gateway.ts."
```

---

### Task 7: Cost tracker and mission event log components

**Files:**
- Create: `src/screens/conductor/components/cost-tracker.tsx`
- Create: `src/screens/conductor/components/mission-event-log.tsx`

- [ ] **Step 1: Create `src/screens/conductor/components/cost-tracker.tsx`**

Adapted from the upstream `MissionCostSection` component in `conductor.tsx`.

```typescript
/**
 * Mission cost tracker — token count + estimated USD per worker and total.
 *
 * Adapted from upstream conductor.tsx MissionCostSection.
 */
import { cn } from '@/lib/utils'

const BLENDED_COST_PER_MILLION_TOKENS = 5

export function estimateTokenCost(totalTokens: number): number {
  return (Math.max(0, totalTokens) / 1_000_000) * BLENDED_COST_PER_MILLION_TOKENS
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(value >= 0.1 ? 2 : 3)}`
}

export type CostWorker = {
  id: string
  label: string
  totalTokens: number
  personaEmoji: string
  personaName: string
}

export function CostTracker({
  totalTokens,
  workers,
  expanded,
  onToggle,
}: {
  totalTokens: number
  workers: CostWorker[]
  expanded: boolean
  onToggle: () => void
}) {
  const estimatedCost = estimateTokenCost(totalTokens)

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-muted)' }}>Mission Cost</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--theme-muted-2)' }}>Approximate at $5 / 1M tokens blended.</p>
        </div>
        <span
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium"
          style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card2)', color: 'var(--theme-text)' }}
        >
          {expanded ? 'Hide' : 'Show'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cn('transition-transform duration-200', expanded ? 'rotate-180' : 'rotate-0')}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {expanded ? (
        <div className="space-y-4 px-5 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-muted)' }}>Total Tokens</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--theme-text)' }}>{totalTokens.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--theme-muted)' }}>Estimated Cost</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--theme-text)' }}>{formatUsd(estimatedCost)}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
            <div className="flex items-center justify-between border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-muted)' }}>
              <span>Workers</span>
              <span>Cost</span>
            </div>
            {workers.length > 0 ? (
              <div>
                {workers.map((worker) => (
                  <div key={worker.id} className="flex items-center gap-3 border-t px-4 py-3 text-sm" style={{ borderColor: 'var(--theme-border)' }}>
                    <span className="font-medium" style={{ color: 'var(--theme-text)' }}>{worker.personaEmoji} {worker.personaName}</span>
                    <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--theme-muted)' }}>{worker.label}</span>
                    <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>{worker.totalTokens.toLocaleString()} tok</span>
                    <span className="min-w-[4.5rem] text-right font-medium" style={{ color: 'var(--theme-text)' }}>{formatUsd(estimateTokenCost(worker.totalTokens))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm" style={{ color: 'var(--theme-muted)' }}>Per-worker token details were not captured.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/screens/conductor/components/mission-event-log.tsx`**

Cycling status indicator and event display adapted from upstream.

```typescript
/**
 * Mission event log — cycling status indicator for active missions.
 *
 * Adapted from upstream conductor.tsx CyclingStatus/PlanningIndicator.
 */
import { useEffect, useState } from 'react'

const PLANNING_STEPS = ['Planning the mission…', 'Analyzing requirements…', 'Preparing agents…', 'Writing the spec…']
const WORKING_STEPS = [
  '📋 Reviewing the brief…',
  '🔍 Scanning existing patterns…',
  '✏️ Drafting the implementation…',
  '☕ Grabbing a coffee…',
  '🧠 Thinking through edge cases…',
  '🎨 Polishing the design…',
  '🔧 Wiring up components…',
  '📐 Checking the layout…',
  '🚀 Almost there…',
]

export function CyclingStatus({
  steps,
  intervalMs = 3000,
  isPaused = false,
}: {
  steps: string[]
  intervalMs?: number
  isPaused?: boolean
}) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (isPaused) return
    const timer = window.setInterval(() => setStep((current) => (current + 1) % steps.length), intervalMs)
    return () => window.clearInterval(timer)
  }, [isPaused, steps.length, intervalMs])

  if (isPaused) {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="flex size-3.5 items-center justify-center rounded-full border border-amber-400/60 bg-amber-500/10 text-[9px] text-amber-300">
          ||
        </div>
        <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>Paused</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="size-3.5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      <p className="text-sm transition-opacity duration-500" style={{ color: 'var(--theme-muted)' }}>{steps[step]}</p>
    </div>
  )
}

export function PlanningIndicator() {
  return <CyclingStatus steps={PLANNING_STEPS} intervalMs={2500} />
}

export function WorkingIndicator({ isPaused = false }: { isPaused?: boolean }) {
  return <CyclingStatus steps={WORKING_STEPS} intervalMs={3500} isPaused={isPaused} />
}
```

- [ ] **Step 3: Commit**

```bash
git add src/screens/conductor/components/cost-tracker.tsx src/screens/conductor/components/mission-event-log.tsx
git commit -m "feat(conductor-v2): add cost tracker and mission event log components

CostTracker shows token count + estimated USD per worker and total.
CyclingStatus/PlanningIndicator/WorkingIndicator show animated status."
```

---

### Task 8: Conductor settings component

**Files:**
- Create: `src/screens/conductor/components/conductor-settings.tsx`

- [ ] **Step 1: Create the settings drawer component**

Adapted from the upstream conductor.tsx settings drawer. Model dropdown, projects dir, max parallel slider, supervised toggle.

```typescript
/**
 * Conductor settings — slide-out drawer for orchestrator/worker model,
 * projects directory, max parallel, and supervised mode.
 *
 * Adapted from upstream conductor.tsx settings panel.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ConductorSettings } from '@/types/conductor'
import { cn } from '@/lib/utils'

type AvailableModel = {
  id?: string
  provider?: string
  name?: string
}

function getModelDisplayName(model: AvailableModel | undefined, modelId: string | null | undefined): string {
  if (!modelId) return 'Default (auto)'
  return model?.name?.trim() || model?.id?.trim() || modelId
}

function getProviderLabel(provider: string | null | undefined): string {
  const raw = provider?.trim()
  if (!raw) return 'Unknown'
  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function groupModelsByProvider(models: AvailableModel[]) {
  const groups = new Map<string, AvailableModel[]>()
  for (const model of models) {
    const provider = getProviderLabel(model.provider)
    const existing = groups.get(provider)
    if (existing) {
      existing.push(model)
    } else {
      groups.set(provider, [model])
    }
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([provider, providerModels]) => ({
      provider,
      models: [...providerModels].sort((a, b) =>
        getModelDisplayName(a, a.id).localeCompare(getModelDisplayName(b, b.id)),
      ),
    }))
}

function ModelSelectorDropdown({
  label,
  value,
  onChange,
  models,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (nextValue: string) => void
  models: AvailableModel[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const selectedModel = models.find((m) => (m.id ?? '') === value)
  const groupedModels = useMemo(() => groupModelsByProvider(models), [models])

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>{label}</span>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => !disabled && setOpen((c) => !c)}
          className={cn(
            'inline-flex min-h-[3rem] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition-colors',
            disabled ? 'cursor-not-allowed opacity-60' : '',
          )}
          style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
          disabled={disabled}
        >
          <span className="inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card2)', color: 'var(--theme-text)' }}>
            <span className={cn('size-2 rounded-full', value ? 'bg-emerald-500' : 'bg-neutral-400')} />
            <span className="truncate">{getModelDisplayName(selectedModel, value)}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cn('shrink-0 transition-transform', open && 'rotate-180')} style={{ color: 'var(--theme-muted)' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open ? (
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-full overflow-hidden rounded-2xl border shadow-lg" style={{ borderColor: 'var(--theme-border2)', background: 'var(--theme-card)' }}>
            <div className="max-h-80 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
                className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors', !value ? 'bg-emerald-500/10' : '')}
                style={{ color: 'var(--theme-text)' }}
              >
                <span className={cn('size-2 rounded-full', !value ? 'bg-emerald-500' : 'bg-neutral-400')} />
                <span className="min-w-0 flex-1 truncate">Default (auto)</span>
              </button>
              {groupedModels.map((group) => (
                <div key={group.provider} className="mt-2 first:mt-3">
                  <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--theme-muted)' }}>
                    {group.provider}
                  </div>
                  {group.models.map((model) => {
                    const modelId = model.id ?? ''
                    const active = modelId === value
                    return (
                      <button
                        key={`${group.provider}-${modelId}`}
                        type="button"
                        onClick={() => { onChange(modelId); setOpen(false) }}
                        className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors', active ? 'bg-emerald-500/10' : '')}
                        style={{ color: 'var(--theme-text)' }}
                      >
                        <span className={cn('size-2 rounded-full', active ? 'bg-emerald-500' : 'bg-neutral-400')} />
                        <span className="min-w-0 flex-1 truncate">{getModelDisplayName(model, modelId)}</span>
                        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-card2)', color: 'var(--theme-muted)' }}>
                          {group.provider}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ConductorSettingsDrawer({
  open,
  onClose,
  settings,
  onUpdate,
}: {
  open: boolean
  onClose: () => void
  settings: ConductorSettings
  onUpdate: (patch: Partial<ConductorSettings>) => void
}) {
  const modelsQuery = useQuery({
    queryKey: ['conductor', 'models'],
    queryFn: async () => {
      const res = await fetch('/api/models')
      const data = (await res.json()) as { ok?: boolean; models?: AvailableModel[] }
      return data.models ?? []
    },
    enabled: open,
    staleTime: 60_000,
  })
  const availableModels = modelsQuery.data ?? []

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-md flex-col overflow-y-auto border-l p-6" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>Conductor Settings</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 transition-colors" style={{ color: 'var(--theme-muted)' }}>✕</button>
        </div>

        <div className="mt-6 space-y-6">
          <ModelSelectorDropdown
            label="Orchestrator Model"
            value={settings.orchestratorModel}
            onChange={(v) => onUpdate({ orchestratorModel: v })}
            models={availableModels}
          />

          <ModelSelectorDropdown
            label="Worker Model"
            value={settings.workerModel}
            onChange={(v) => onUpdate({ workerModel: v })}
            models={availableModels}
          />

          <div className="space-y-2">
            <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>Projects Directory</span>
            <input
              type="text"
              value={settings.projectsDir}
              onChange={(e) => onUpdate({ projectsDir: e.target.value })}
              placeholder="/tmp"
              className="w-full rounded-2xl border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
            />
            <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>Where workers write output. Empty = /tmp.</p>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>Max Parallel Workers</span>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                value={settings.maxParallel}
                onChange={(e) => onUpdate({ maxParallel: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="w-8 text-center text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{settings.maxParallel}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>Supervised Mode</span>
              <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>Require approval before each task.</p>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ supervised: !settings.supervised })}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                settings.supervised ? 'bg-emerald-500' : 'bg-neutral-600',
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform',
                settings.supervised && 'translate-x-5',
              )} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/conductor/components/conductor-settings.tsx
git commit -m "feat(conductor-v2): add conductor settings drawer

Model selection (orchestrator + worker), projects directory, max parallel
slider (1-5), supervised toggle. Fetches models from /api/models."
```

---

### Task 9: Conductor home, active, and complete phase components

**Files:**
- Create: `src/screens/conductor/components/conductor-home.tsx`
- Create: `src/screens/conductor/components/conductor-active.tsx`
- Create: `src/screens/conductor/components/conductor-complete.tsx`

- [ ] **Step 1: Create `src/screens/conductor/components/conductor-home.tsx`**

The implementer MUST read the upstream file at `/tmp/hermes-workspace/src/screens/gateway/conductor.tsx` lines 1194-1500+ (the home phase rendering) and port it faithfully.

Key elements:
- Goal textarea with placeholder
- Quick action buttons (Research, Build, Review, Deploy) that prefix the goal
- OfficeView showing recent sessions or placeholder agents
- Recent missions list with filter (all/completed/failed) and pagination
- Mission history detail view (when a history entry is selected)
- Settings button + New Mission button in header
- All styling uses `var(--theme-*)` CSS variables via inline `style` props

Props received from conductor-screen:
```typescript
type ConductorHomeProps = {
  conductor: ReturnType<typeof useConductorGateway>
  goalDraft: string
  setGoalDraft: (v: string) => void
  onSubmit: () => void
  onSettingsOpen: () => void
}
```

- [ ] **Step 2: Create `src/screens/conductor/components/conductor-active.tsx`**

Port from upstream conductor.tsx active phase (lines ~1550-1900+). Key elements:
- OfficeView showing active workers mapped to `AgentWorkingRow[]`
- Progress bar (completed/total workers percentage)
- Worker cards with status dot, persona, model badge, token count, elapsed time, output markdown
- Abort button (calls `conductor.stopMission()`)
- Pause/Resume button (calls `conductor.pauseAgent()`)
- Timeout warning banner (60s no activity → dismissible warning)
- WorkingIndicator cycling status
- Duration timer updating every second

Props:
```typescript
type ConductorActiveProps = {
  conductor: ReturnType<typeof useConductorGateway>
}
```

- [ ] **Step 3: Create `src/screens/conductor/components/conductor-complete.tsx`**

Port from upstream conductor.tsx complete phase. Key elements:
- Summary card: status (complete/failed), goal, duration, worker count, token count
- Worker output panels with markdown rendering
- CostTracker section
- Output path display (extracted from worker outputs)
- Retry Mission button (calls `conductor.retryMission()`)
- New Mission button (calls `conductor.resetMission()`)
- Continue Mission modal (combine previous output + new instructions)

Props:
```typescript
type ConductorCompleteProps = {
  conductor: ReturnType<typeof useConductorGateway>
  onNewMission: () => void
}
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/conductor/components/conductor-home.tsx src/screens/conductor/components/conductor-active.tsx src/screens/conductor/components/conductor-complete.tsx
git commit -m "feat(conductor-v2): add home, active, and complete phase components

Home: goal input, quick actions, office view, mission history.
Active: live office view, worker cards, abort/pause, timeout warning.
Complete: summary, worker outputs, cost tracker, retry/new/continue."
```

---

### Task 10: Conductor screen orchestrator

**Files:**
- Rewrite: `src/screens/conductor/conductor-screen.tsx`

- [ ] **Step 1: Rewrite the conductor screen**

Replace the entire file. This is the top-level component that wires the hook to phase components.

```typescript
/**
 * Conductor screen — phase router wiring use-conductor-gateway to child components.
 *
 * Phases: home → decomposing/running (active) → complete
 */
import { useMemo, useState } from 'react'
import { useConductorGateway } from './hooks/use-conductor-gateway'
import { ConductorHome } from './components/conductor-home'
import { ConductorActive } from './components/conductor-active'
import { ConductorComplete } from './components/conductor-complete'
import { ConductorSettingsDrawer } from './components/conductor-settings'

type ScreenPhase = 'home' | 'active' | 'complete'

export function ConductorScreen() {
  const conductor = useConductorGateway()
  const [goalDraft, setGoalDraft] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const screenPhase: ScreenPhase = useMemo(() => {
    if (conductor.phase === 'idle') return 'home'
    if (conductor.phase === 'decomposing' || conductor.phase === 'running') return 'active'
    return 'complete'
  }, [conductor.phase])

  const handleSubmit = async () => {
    const trimmed = goalDraft.trim()
    if (!trimmed) return
    await conductor.sendMission(trimmed)
  }

  const handleNewMission = () => {
    conductor.resetMission()
    setGoalDraft('')
  }

  const updateSettings = (patch: Partial<typeof conductor.conductorSettings>) => {
    conductor.setConductorSettings({ ...conductor.conductorSettings, ...patch })
  }

  return (
    <>
      <div
        className="flex h-full flex-col overflow-y-auto"
        style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
      >
        {screenPhase === 'home' && (
          <ConductorHome
            conductor={conductor}
            goalDraft={goalDraft}
            setGoalDraft={setGoalDraft}
            onSubmit={handleSubmit}
            onSettingsOpen={() => setSettingsOpen(true)}
          />
        )}
        {screenPhase === 'active' && (
          <ConductorActive conductor={conductor} />
        )}
        {screenPhase === 'complete' && (
          <ConductorComplete conductor={conductor} onNewMission={handleNewMission} />
        )}
      </div>
      <ConductorSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={conductor.conductorSettings}
        onUpdate={updateSettings}
      />
    </>
  )
}
```

- [ ] **Step 2: Verify the route file still works**

Check that `src/routes/conductor.tsx` still imports `ConductorScreen` correctly (it should — the import path hasn't changed).

Run: `cat src/routes/conductor.tsx`

Expected: Imports `ConductorScreen` from `@/screens/conductor/conductor-screen` — no change needed.

- [ ] **Step 3: Commit**

```bash
git add src/screens/conductor/conductor-screen.tsx
git commit -m "feat(conductor-v2): rewrite conductor screen orchestrator

Phase router wiring use-conductor-gateway to ConductorHome,
ConductorActive, ConductorComplete, and ConductorSettingsDrawer."
```

---

### Task 11: Update operations aggregator

**Files:**
- Modify: `src/server/operations-aggregator.ts`

- [ ] **Step 1: Rewrite `src/server/operations-aggregator.ts`**

Replace the mission-store import with live gateway session query. The aggregator now queries crews (unchanged) and live gateway sessions matching `conductor-*` or `worker-*` labels.

```typescript
/**
 * Operations aggregator — read-only view across crews and live conductor sessions.
 *
 * No persistence of its own. Queries crew-store for crew agents and
 * the Hermes sessions API for conductor workers.
 */
import type { OperationAgent, OperationAgentStatus } from '../types/operation'
import { listCrews } from './crew-store'
import type { CrewMemberStatus } from './crew-store'
import { listSessions } from './hermes-api'

function crewStatusToOpStatus(status: CrewMemberStatus): OperationAgentStatus {
  switch (status) {
    case 'running': return 'online'
    case 'idle':
    case 'done': return 'offline'
    case 'error': return 'error'
    default: return 'unknown'
  }
}

function sessionStatusToOpStatus(updatedAt: string | number | undefined, totalTokens: number): OperationAgentStatus {
  if (!updatedAt) return 'unknown'
  const updatedMs = typeof updatedAt === 'string' ? new Date(updatedAt).getTime() : updatedAt
  const staleness = Date.now() - updatedMs
  if (totalTokens > 0 && staleness > 30_000) return 'offline'
  if (staleness > 120_000) return 'error'
  if (totalTokens > 0) return 'online'
  return 'unknown'
}

export async function getOperationsOverview(): Promise<OperationAgent[]> {
  const agents: OperationAgent[] = []

  // Crew agents — unchanged
  for (const crew of listCrews()) {
    for (const member of crew.members) {
      const nameMatch = member.displayName.match(/^(?:\S+\s+)?(.+)$/)
      const cleanName = nameMatch ? nameMatch[1].trim() : member.displayName

      agents.push({
        id: member.id,
        name: cleanName,
        emoji: member.displayName.split(' ')[0] || '🤖',
        model: member.model,
        profileName: member.profileName,
        sessionKey: member.sessionKey,
        status: crewStatusToOpStatus(member.status),
        lastActivity: member.lastActivity,
        totalTokens: 0,
        totalCostUsd: 0,
        taskCount: 0,
        crewId: crew.id,
        crewName: crew.name,
        missionId: null,
        missionGoal: null,
        source: 'crew',
      })
    }
  }

  // Live conductor sessions from gateway
  try {
    const sessions = await listSessions()
    const cutoff = Date.now() - 24 * 60 * 60_000
    for (const session of sessions) {
      const label = session.title ?? session.id ?? ''
      const key = session.id ?? ''
      // Match conductor worker sessions
      if (!label.startsWith('worker-') && !label.startsWith('conductor-') && !key.includes(':subagent:')) {
        continue
      }
      const updatedAt = session.last_active ?? session.started_at
      if (updatedAt && typeof updatedAt === 'number' && updatedAt * 1000 < cutoff) continue

      const totalTokens = (session.input_tokens ?? 0) + (session.output_tokens ?? 0)
      const cleanLabel = label.replace(/^worker-/, '').replace(/[-_]+/g, ' ')

      agents.push({
        id: key,
        name: cleanLabel || 'Worker',
        emoji: '🤖',
        model: session.model ?? null,
        profileName: null,
        sessionKey: key,
        status: sessionStatusToOpStatus(updatedAt, totalTokens),
        lastActivity: updatedAt ? (typeof updatedAt === 'number' ? updatedAt * 1000 : null) : null,
        totalTokens,
        totalCostUsd: 0,
        taskCount: 0,
        crewId: null,
        crewName: null,
        missionId: null,
        missionGoal: null,
        source: 'conductor',
      })
    }
  } catch {
    // Gateway may be unavailable — return crew agents only
  }

  return agents
}
```

**Note:** The function signature changed from sync to async (`getOperationsOverview` now returns `Promise<OperationAgent[]>`). The implementer must also update the route that calls this function (likely `src/routes/api/operations.ts` or similar) to await the result.

- [ ] **Step 2: Update the operations API route to await the async aggregator**

Find the route file that calls `getOperationsOverview()` and add `await`:

```bash
grep -rn "getOperationsOverview" src/routes/
```

Update the found file to use `await getOperationsOverview()` instead of `getOperationsOverview()`.

- [ ] **Step 3: Commit**

```bash
git add src/server/operations-aggregator.ts
git add src/routes/api/operations.ts  # or wherever the route is
git commit -m "feat(conductor-v2): update operations aggregator for live gateway sessions

Replace mission-store import with live Hermes session queries for
conductor workers. Function is now async."
```

---

### Task 12: Tests

**Files:**
- Create: `src/test/conductor-spawn.test.ts`
- Create: `src/test/conductor-stop.test.ts`
- Create: `src/test/operations-aggregator.test.ts`

- [ ] **Step 1: Create `src/test/conductor-spawn.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('conductor-spawn route', () => {
  it('rejects empty goal', async () => {
    const res = await fetch('http://localhost:3000/api/conductor-spawn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: '' }),
    })
    // May be 400 or 401 depending on auth — verify response is JSON
    const data = await res.json()
    expect(data.ok).toBe(false)
  })

  it('rejects non-JSON content type', async () => {
    const res = await fetch('http://localhost:3000/api/conductor-spawn', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'hello',
    })
    expect(res.ok).toBe(false)
  })
})
```

- [ ] **Step 2: Create `src/test/conductor-stop.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'

describe('conductor-stop route', () => {
  it('rejects non-JSON content type', async () => {
    const res = await fetch('http://localhost:3000/api/conductor-stop', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'hello',
    })
    expect(res.ok).toBe(false)
  })

  it('handles empty session keys gracefully', async () => {
    const res = await fetch('http://localhost:3000/api/conductor-stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionKeys: [] }),
    })
    // May be 401 if no auth — but should not crash
    const data = await res.json()
    expect(typeof data.ok).toBe('boolean')
  })
})
```

- [ ] **Step 3: Create `src/test/operations-aggregator.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'

// Mock hermes-api before importing aggregator
vi.mock('../server/hermes-api', () => ({
  listSessions: vi.fn().mockResolvedValue([]),
  ensureGatewayProbed: vi.fn().mockResolvedValue({ core: { available: true }, dashboard: { available: false } }),
}))

// Mock crew-store
vi.mock('../server/crew-store', () => ({
  listCrews: vi.fn().mockReturnValue([]),
}))

describe('operations-aggregator', () => {
  it('returns empty array when no crews or sessions', async () => {
    const { getOperationsOverview } = await import('../server/operations-aggregator')
    const result = await getOperationsOverview()
    expect(result).toEqual([])
  })

  it('includes crew agents with source=crew', async () => {
    const { listCrews } = await import('../server/crew-store')
    vi.mocked(listCrews).mockReturnValue([{
      id: 'crew-1',
      name: 'Test Crew',
      members: [{
        id: 'member-1',
        displayName: '🤖 Agent One',
        model: 'sonnet',
        profileName: 'default',
        sessionKey: 'session-1',
        status: 'running' as const,
        lastActivity: Date.now(),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }])

    const { getOperationsOverview } = await import('../server/operations-aggregator')
    const result = await getOperationsOverview()
    expect(result.length).toBe(1)
    expect(result[0].source).toBe('crew')
    expect(result[0].status).toBe('online')
  })
})
```

- [ ] **Step 4: Run tests**

Run: `cd /home/jpeetz/Hermes-Studio && pnpm test 2>&1 | tail -30`

Expected: New tests pass, total test count stays roughly similar (old 13 tests deleted, ~6+ new tests added).

- [ ] **Step 5: Commit**

```bash
git add src/test/conductor-spawn.test.ts src/test/conductor-stop.test.ts src/test/operations-aggregator.test.ts
git commit -m "test(conductor-v2): add tests for spawn, stop, and operations aggregator

Replace deleted mission-store and operations-aggregator tests with
gateway-native integration tests."
```

---

### Task 13: Integration verification and cleanup

**Files:**
- Verify: all new files compile
- Verify: dev server starts
- Verify: /conductor route loads

- [ ] **Step 1: Run TypeScript check**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit 2>&1 | head -40`

Fix any type errors.

- [ ] **Step 2: Start dev server and verify**

Run: `cd /home/jpeetz/Hermes-Studio && pnpm dev &`

Wait 10s, then:

Run: `curl -s http://localhost:3000/conductor | head -5`

Expected: HTML response (the SPA shell).

- [ ] **Step 3: Run full test suite**

Run: `cd /home/jpeetz/Hermes-Studio && pnpm test 2>&1 | tail -30`

Expected: All tests pass.

- [ ] **Step 4: Verify no leftover imports of deleted modules**

Run: `grep -rn "missions-api\|mission-store" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test."`

Expected: No results (all references to deleted modules should be gone).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(conductor-v2): integration verification and cleanup

Verify all conductor v2 files compile, dev server starts, tests pass,
and no leftover references to deleted mission-store modules."
```

---

### Task 14: Update version and documentation

**Files:**
- Modify: `package.json` (bump version to 1.20.0)
- Modify: `CHANGELOG.md`
- Modify: `DEVLOG.md`
- Modify: `README.md`

- [ ] **Step 1: Bump version to 1.20.0**

In `package.json`, change `"version": "1.19.0"` to `"version": "1.20.0"`.

- [ ] **Step 2: Add CHANGELOG entry**

Prepend to `CHANGELOG.md`:

```markdown
## [1.20.0] — 2026-04-25

### Conductor V2 — Gateway Port

**Replaced** the stub v1.19.0 Conductor with a faithful adapted port of the upstream gateway conductor:

- **Animated SVG Office** — Three layouts (Grid, Roundtable, War Room) with desk/monitor/chair SVGs, agent wandering to social spots, speech bubbles, status glow animations
- **Pixel-Art Agent Avatars** — 10 unique robot variants with per-agent accent colors
- **Real Gateway Integration** — Spawns Hermes cron jobs for orchestration, polls live sessions for worker tracking
- **Live Worker Monitoring** — Session polling every 3s, output fetching, staleness detection, completion detection
- **Mission Settings** — Orchestrator/worker model selection, projects directory, max parallel (1-5), supervised mode
- **Mission History** — localStorage-persisted history with restore, output preview, cost breakdown
- **Cost Tracking** — Token count + estimated USD per worker and total ($5/1M blended)
- **Quick Actions** — Research, Build, Review, Deploy one-click goal prefixes
- **Mission Controls** — Abort, pause/resume, retry, continue with new instructions

**Deleted:** File-backed mission-store, 5 mission API routes, missions-api client lib

**Updated:** Operations aggregator queries live gateway sessions instead of deleted mission-store
```

- [ ] **Step 3: Add DEVLOG session entry**

Append a session entry to `DEVLOG.md` documenting the Conductor V2 implementation.

- [ ] **Step 4: Commit**

```bash
git add package.json CHANGELOG.md DEVLOG.md README.md
git commit -m "docs: bump to v1.20.0, add Conductor V2 changelog and devlog"
```

---

## Execution Notes

### Import path conventions
- Server imports: `../../server/auth-middleware`, `../../server/gateway-capabilities`, `../../server/hermes-api`, `../../server/rate-limit`
- Alias imports: `@/lib/utils`, `@/lib/gateway-api`, `@/types/conductor`
- Relative component imports within conductor: `./components/office-view`, `./hooks/use-conductor-gateway`

### Styling rules
- **OfficeView SVG** uses hex colors directly (pragmatic exception per spec)
- **All surrounding UI** uses `var(--theme-*)` via `style` props — NEVER Tailwind palette classes on screen-level components
- CSS animation classes added to `styles.css`, referenced by class name in OfficeView

### Key upstream files to reference
- `/tmp/hermes-workspace/src/screens/gateway/hooks/use-conductor-gateway.ts` (1283 lines) — main hook
- `/tmp/hermes-workspace/src/screens/gateway/components/office-view.tsx` (892 lines) — SVG office
- `/tmp/hermes-workspace/src/screens/gateway/components/agent-avatar.tsx` (318 lines) — avatars
- `/tmp/hermes-workspace/src/screens/gateway/conductor.tsx` (2499 lines) — all UI phases
- `/tmp/hermes-workspace/src/routes/api/conductor-spawn.ts` (263 lines) — spawn route
- `/tmp/hermes-workspace/src/routes/api/conductor-stop.ts` (51 lines) — stop route
