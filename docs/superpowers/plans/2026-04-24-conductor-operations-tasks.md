# Conductor + Operations + Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port Conductor (mission orchestration), Operations (live agent dashboard), and Tasks (Kanban board) from upstream hermes-workspace into Hermes Studio, adapted to fit the existing architecture, design system, and feature set.

**Architecture:** Adapted port — upstream's data models and API contracts are preserved so the hermes-agent backend works without changes, but stores use file-backed persistence (matching crew-store.ts pattern), UI uses DS components with `var(--theme-*)` CSS variables exclusively, and features integrate with existing Crews, Audit Trail, Agent Library, and unified Template system.

**Tech Stack:** React 19, TanStack Router (file-based), TanStack React Query, Zustand, Vitest, `var(--theme-*)` CSS variables, DS components (Card, StatusBadge, etc.), HugeIcons, file-backed JSON stores in `.runtime/`, SSE via chat-event-bus.

**CSS Rule:** All screen-level components MUST use `var(--theme-*)` CSS variables and DS components. NO Tailwind palette classes (e.g. `bg-blue-500`, `text-gray-400`) on screens. Dark-only theme.

---

## File Structure

### New files to create

**Types:**
- `src/types/task.ts` — HermesTask, TaskColumn, TaskPriority types
- `src/types/conductor.ts` — Mission, MissionWorker, MissionEvent, ConductorPhase types
- `src/types/operation.ts` — OperationAgent, OperationAgentStatus types

**Server stores:**
- `src/server/task-store.ts` — File-backed task persistence (.runtime/tasks.json)
- `src/server/mission-store.ts` — File-backed mission persistence (.runtime/missions.json, .runtime/mission-events.json)
- `src/server/operations-aggregator.ts` — Read-only aggregator across crews, missions, and sessions

**API routes:**
- `src/routes/api/tasks/index.ts` — GET (list) + POST (create)
- `src/routes/api/tasks/$taskId.ts` — GET + PATCH + DELETE
- `src/routes/api/tasks/$taskId.move.ts` — POST (move to column)
- `src/routes/api/missions/index.ts` — GET (list) + POST (create + spawn)
- `src/routes/api/missions/$missionId.ts` — GET + DELETE
- `src/routes/api/missions/$missionId.abort.ts` — POST (abort mission)
- `src/routes/api/missions/$missionId.events.ts` — GET (paginated event log)
- `src/routes/api/operations/index.ts` — GET (aggregated agent overview)

**Client API helpers:**
- `src/lib/tasks-api.ts` — Client-side fetch helpers for tasks
- `src/lib/missions-api.ts` — Client-side fetch helpers for missions
- `src/lib/operations-api.ts` — Client-side fetch helpers for operations

**UI route files (TanStack Router):**
- `src/routes/tasks.tsx` — /tasks route entry
- `src/routes/conductor.tsx` — /conductor route entry
- `src/routes/operations.tsx` — /operations route entry

**Screens:**
- `src/screens/tasks/tasks-screen.tsx` — Main tasks Kanban board
- `src/screens/tasks/components/task-column.tsx` — Single Kanban column
- `src/screens/tasks/components/task-card.tsx` — Draggable task card
- `src/screens/tasks/components/task-dialog.tsx` — Create/edit task modal
- `src/screens/conductor/conductor-screen.tsx` — Main conductor screen (phase-based)
- `src/screens/conductor/components/mission-home.tsx` — Goal input + template picker + history
- `src/screens/conductor/components/mission-preview.tsx` — Plan review before launch
- `src/screens/conductor/components/mission-active.tsx` — Live worker grid + event log
- `src/screens/conductor/components/mission-complete.tsx` — Summary + artifacts
- `src/screens/conductor/components/worker-card.tsx` — Individual agent status card
- `src/screens/conductor/components/mission-event-log.tsx` — Scrollable event timeline
- `src/screens/conductor/components/cost-tracker.tsx` — Token/cost display
- `src/screens/operations/operations-screen.tsx` — Global operations dashboard
- `src/screens/operations/components/agent-grid.tsx` — Card grid layout
- `src/screens/operations/components/agent-card.tsx` — Single agent overview card
- `src/screens/operations/components/agent-outputs.tsx` — Expanded output view

**Tests:**
- `src/test/task-store.test.ts`
- `src/test/mission-store.test.ts`
- `src/test/operations-aggregator.test.ts`

### Existing files to modify

- `src/types/template.ts` — Add `templateType` field and `conductorConfig` to CrewTemplate
- `src/server/template-store.ts` — Add built-in conductor templates
- `src/screens/chat/components/chat-sidebar.tsx` — Add Conductor, Operations, Tasks nav items
- `src/components/workspace-shell.tsx` — Add mobile page titles for new routes
- `src/screens/crews/crew-detail-screen.tsx` — Add Operations tab

---

## Task 1: Task Types

**Files:**
- Create: `src/types/task.ts`

- [ ] **Step 1: Create task type definitions**

```typescript
// src/types/task.ts

/**
 * Task types — Kanban board task management.
 */

export type TaskColumn = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskSourceType = 'manual' | 'conductor' | 'crew'

export interface HermesTask {
  id: string
  title: string
  description: string
  column: TaskColumn
  priority: TaskPriority
  assignee: string | null
  tags: string[]
  dueDate: string | null
  position: number
  sourceType: TaskSourceType
  sourceId: string | null
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface CreateTaskInput {
  title: string
  description?: string
  column?: TaskColumn
  priority?: TaskPriority
  assignee?: string | null
  tags?: string[]
  dueDate?: string | null
  sourceType?: TaskSourceType
  sourceId?: string | null
  createdBy?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  column?: TaskColumn
  priority?: TaskPriority
  assignee?: string | null
  tags?: string[]
  dueDate?: string | null
  position?: number
}

export const TASK_COLUMNS: readonly TaskColumn[] = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const

export const TASK_COLUMN_LABELS: Record<TaskColumn, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}
```

- [ ] **Step 2: Verify file is valid TypeScript**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit src/types/task.ts 2>&1 | head -20`
Expected: No errors (or only errors about missing tsconfig paths that resolve in full build)

- [ ] **Step 3: Commit**

```bash
git add src/types/task.ts
git commit -m "feat(tasks): add task type definitions"
```

---

## Task 2: Conductor Types

**Files:**
- Create: `src/types/conductor.ts`

- [ ] **Step 1: Create conductor type definitions**

```typescript
// src/types/conductor.ts

/**
 * Conductor types — mission orchestration with sub-agent workers.
 */

export type ConductorPhase = 'home' | 'preview' | 'active' | 'complete'
export type MissionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'aborted'
export type WorkerStatus = 'pending' | 'running' | 'done' | 'error'

export interface MissionWorker {
  id: string
  sessionKey: string
  label: string
  personaEmoji: string
  personaName: string
  model: string | null
  status: WorkerStatus
  totalTokens: number
  output: string | null
}

export interface Mission {
  id: string
  goal: string
  status: MissionStatus
  workers: MissionWorker[]
  tasks: string[]
  templateId: string | null
  createdAt: number
  updatedAt: number
  completedAt: number | null
  totalTokens: number
  totalCostUsd: number
}

export interface MissionEvent {
  id: string
  missionId: string
  type: string
  data: Record<string, unknown>
  timestamp: number
}

export interface CreateMissionInput {
  goal: string
  templateId?: string | null
  workers?: Array<{
    label: string
    personaName: string
    personaEmoji: string
    model?: string | null
  }>
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/conductor.ts
git commit -m "feat(conductor): add mission and worker type definitions"
```

---

## Task 3: Operation Types

**Files:**
- Create: `src/types/operation.ts`

- [ ] **Step 1: Create operation type definitions**

```typescript
// src/types/operation.ts

/**
 * Operation types — aggregated agent status across crews, missions, and standalone sessions.
 */

export type OperationAgentStatus = 'online' | 'offline' | 'error' | 'unknown'

export interface OperationAgent {
  id: string
  name: string
  emoji: string
  model: string | null
  profileName: string | null
  sessionKey: string
  status: OperationAgentStatus
  lastActivity: string | null
  totalTokens: number
  totalCostUsd: number
  taskCount: number
  crewId: string | null
  crewName: string | null
  missionId: string | null
  missionGoal: string | null
  source: 'crew' | 'conductor' | 'standalone'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/operation.ts
git commit -m "feat(operations): add operation agent type definitions"
```

---

## Task 4: Extend Template Types

**Files:**
- Modify: `src/types/template.ts`

- [ ] **Step 1: Add templateType and conductor category to template types**

In `src/types/template.ts`, add `'conductor'` to the category union and add `templateType` + `conductorConfig` to the interface:

```typescript
// src/types/template.ts

/**
 * Crew template types — pre-built crew configurations for quick setup.
 */

export type CrewTemplateCategory =
  | 'research'
  | 'engineering'
  | 'creative'
  | 'operations'
  | 'conductor'

export interface CrewTemplateMember {
  /** Lowercase persona name, e.g. 'kai' */
  persona: string
  role: 'coordinator' | 'executor' | 'reviewer' | 'specialist'
}

export interface ConductorTemplateConfig {
  maxParallel: number
  supervised: boolean
}

export interface CrewTemplate {
  id: string
  name: string
  description: string
  /** Single emoji for visual identity */
  icon: string
  category: CrewTemplateCategory
  defaultGoal: string
  defaultMembers: CrewTemplateMember[]
  isBuiltIn: boolean
  tags: string[]
  /** Undefined for built-ins; epoch ms for user templates */
  createdAt?: number
  /** 'crew' for traditional crews, 'conductor' for mission templates */
  templateType: 'crew' | 'conductor'
  /** Configuration for conductor-type templates */
  conductorConfig?: ConductorTemplateConfig
}
```

- [ ] **Step 2: Verify no type errors**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit 2>&1 | head -30`
Expected: Errors about missing `templateType` in existing template data — these get fixed in Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/types/template.ts
git commit -m "feat(templates): add templateType and conductorConfig to CrewTemplate"
```

---

## Task 5: Extend Template Store with Conductor Templates

**Files:**
- Modify: `src/server/template-store.ts`

- [ ] **Step 1: Read the current template-store.ts to understand built-in template format**

Read the full file before making changes.

- [ ] **Step 2: Add templateType: 'crew' default to all existing built-in templates**

Every existing built-in template needs `templateType: 'crew'` added to its definition. Find the array of built-in templates and add the field to each entry.

- [ ] **Step 3: Add built-in conductor templates**

Add these 4 conductor templates to the built-in templates array:

```typescript
{
  id: 'conductor-research',
  name: 'Research Mission',
  description: 'Deep research on a topic with parallel investigators and a synthesizer',
  icon: '🔬',
  category: 'conductor' as const,
  defaultGoal: 'Research and synthesize findings on...',
  defaultMembers: [
    { persona: 'kai', role: 'coordinator' as const },
    { persona: 'nova', role: 'executor' as const },
  ],
  isBuiltIn: true,
  tags: ['research', 'analysis', 'conductor'],
  templateType: 'conductor' as const,
  conductorConfig: { maxParallel: 2, supervised: false },
},
{
  id: 'conductor-build',
  name: 'Build Mission',
  description: 'Plan, implement, and review a feature with specialized workers',
  icon: '🏗️',
  category: 'conductor' as const,
  defaultGoal: 'Build and deliver...',
  defaultMembers: [
    { persona: 'kai', role: 'coordinator' as const },
    { persona: 'roger', role: 'executor' as const },
    { persona: 'quinn', role: 'reviewer' as const },
  ],
  isBuiltIn: true,
  tags: ['build', 'development', 'conductor'],
  templateType: 'conductor' as const,
  conductorConfig: { maxParallel: 2, supervised: false },
},
{
  id: 'conductor-review',
  name: 'Review Mission',
  description: 'Audit code, docs, or architecture with parallel reviewers',
  icon: '🔍',
  category: 'conductor' as const,
  defaultGoal: 'Review and audit...',
  defaultMembers: [
    { persona: 'quinn', role: 'reviewer' as const },
    { persona: 'nova', role: 'specialist' as const },
  ],
  isBuiltIn: true,
  tags: ['review', 'audit', 'conductor'],
  templateType: 'conductor' as const,
  conductorConfig: { maxParallel: 2, supervised: true },
},
{
  id: 'conductor-deploy',
  name: 'Deploy Mission',
  description: 'Deploy and verify infrastructure or application changes',
  icon: '🚀',
  category: 'conductor' as const,
  defaultGoal: 'Deploy and verify...',
  defaultMembers: [
    { persona: 'kai', role: 'coordinator' as const },
    { persona: 'roger', role: 'executor' as const },
  ],
  isBuiltIn: true,
  tags: ['deploy', 'infrastructure', 'conductor'],
  templateType: 'conductor' as const,
  conductorConfig: { maxParallel: 1, supervised: true },
},
```

- [ ] **Step 4: Ensure user-created templates get templateType defaulted to 'crew'**

In the create-template function, default `templateType` to `'crew'` if not provided.

- [ ] **Step 5: Run existing tests**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run src/test/ 2>&1 | tail -20`
Expected: All existing tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/server/template-store.ts
git commit -m "feat(templates): add conductor templates and templateType defaults"
```

---

## Task 6: Task Store

**Files:**
- Create: `src/server/task-store.ts`
- Create: `src/test/task-store.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/task-store.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'task-store-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpDir, { recursive: true, force: true })
})

async function getStore() {
  return import('@/server/task-store')
}

describe('task-store', () => {
  it('listTasks() returns empty array initially', async () => {
    const { listTasks } = await getStore()
    expect(listTasks()).toEqual([])
  })

  it('createTask() creates a task with defaults', async () => {
    const { createTask, getTask } = await getStore()
    const task = createTask({ title: 'Test task' })
    expect(task.id).toBeTruthy()
    expect(task.title).toBe('Test task')
    expect(task.column).toBe('backlog')
    expect(task.priority).toBe('medium')
    expect(task.sourceType).toBe('manual')
    expect(task.assignee).toBeNull()
    expect(getTask(task.id)).toEqual(task)
  })

  it('createTask() trims whitespace', async () => {
    const { createTask } = await getStore()
    const task = createTask({ title: '  Trimmed  ', description: '  Desc  ' })
    expect(task.title).toBe('Trimmed')
    expect(task.description).toBe('Desc')
  })

  it('listTasks() returns newest-first order', async () => {
    const { createTask, listTasks } = await getStore()
    const a = createTask({ title: 'A' })
    await new Promise((r) => setTimeout(r, 5))
    const b = createTask({ title: 'B' })
    const list = listTasks()
    expect(list[0].id).toBe(b.id)
    expect(list[1].id).toBe(a.id)
  })

  it('listTasks() filters by column', async () => {
    const { createTask, listTasks } = await getStore()
    createTask({ title: 'Backlog', column: 'backlog' })
    createTask({ title: 'Todo', column: 'todo' })
    const filtered = listTasks({ column: 'todo' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('Todo')
  })

  it('listTasks() filters by sourceType', async () => {
    const { createTask, listTasks } = await getStore()
    createTask({ title: 'Manual' })
    createTask({ title: 'From Conductor', sourceType: 'conductor', sourceId: 'mission-1' })
    const filtered = listTasks({ sourceType: 'conductor' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('From Conductor')
  })

  it('updateTask() modifies task fields', async () => {
    const { createTask, updateTask, getTask } = await getStore()
    const task = createTask({ title: 'Old' })
    const updated = updateTask(task.id, { title: 'New', priority: 'high' })
    expect(updated?.title).toBe('New')
    expect(updated?.priority).toBe('high')
    expect(getTask(task.id)?.title).toBe('New')
  })

  it('updateTask() returns null for unknown id', async () => {
    const { updateTask } = await getStore()
    expect(updateTask('nonexistent', { title: 'X' })).toBeNull()
  })

  it('moveTask() changes column', async () => {
    const { createTask, moveTask, getTask } = await getStore()
    const task = createTask({ title: 'Movable' })
    moveTask(task.id, 'in_progress')
    expect(getTask(task.id)?.column).toBe('in_progress')
  })

  it('deleteTask() removes the task', async () => {
    const { createTask, deleteTask, getTask } = await getStore()
    const task = createTask({ title: 'ToDelete' })
    deleteTask(task.id)
    expect(getTask(task.id)).toBeNull()
  })

  it('getTask() returns null for unknown id', async () => {
    const { getTask } = await getStore()
    expect(getTask('unknown')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run src/test/task-store.test.ts 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Implement task-store.ts**

```typescript
// src/server/task-store.ts

/**
 * Task store — file-backed persistence for Kanban board tasks.
 *
 * Follows the same pattern as crew-store.ts: in-memory cache with
 * deferred disk writes to .runtime/tasks.json.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  HermesTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskColumn,
  TaskSourceType,
} from '../types/task'

const DATA_DIR = join(process.cwd(), '.runtime')
const TASKS_FILE = join(DATA_DIR, 'tasks.json')

// ─── Types ───────────────────────────────────────────────────────────────────

type StoreData = { tasks: Record<string, HermesTask> }

export interface TaskFilter {
  column?: TaskColumn
  assignee?: string
  priority?: 'high' | 'medium' | 'low'
  sourceType?: TaskSourceType
  sourceId?: string
}

// ─── In-memory cache ─────────────────────────────────────────────────────────

let store: StoreData = { tasks: {} }

// ─── Disk persistence ────────────────────────────────────────────────────────

function loadFromDisk(): void {
  try {
    if (existsSync(TASKS_FILE)) {
      const raw = readFileSync(TASKS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as StoreData
      if (parsed?.tasks && typeof parsed.tasks === 'object') {
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
    writeFileSync(TASKS_FILE, JSON.stringify(store, null, 2))
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

export function listTasks(filter?: TaskFilter): HermesTask[] {
  let tasks = Object.values(store.tasks)

  if (filter?.column) tasks = tasks.filter((t) => t.column === filter.column)
  if (filter?.assignee) tasks = tasks.filter((t) => t.assignee === filter.assignee)
  if (filter?.priority) tasks = tasks.filter((t) => t.priority === filter.priority)
  if (filter?.sourceType) tasks = tasks.filter((t) => t.sourceType === filter.sourceType)
  if (filter?.sourceId) tasks = tasks.filter((t) => t.sourceId === filter.sourceId)

  return tasks.sort((a, b) => b.createdAt - a.createdAt)
}

export function getTask(taskId: string): HermesTask | null {
  return store.tasks[taskId] ?? null
}

export function createTask(input: CreateTaskInput): HermesTask {
  const now = Date.now()
  const task: HermesTask = {
    id: randomUUID(),
    title: (input.title ?? '').trim(),
    description: (input.description ?? '').trim(),
    column: input.column ?? 'backlog',
    priority: input.priority ?? 'medium',
    assignee: input.assignee ?? null,
    tags: input.tags ?? [],
    dueDate: input.dueDate ?? null,
    position: now,
    sourceType: input.sourceType ?? 'manual',
    sourceId: input.sourceId ?? null,
    createdBy: input.createdBy ?? 'user',
    createdAt: now,
    updatedAt: now,
  }
  store.tasks[task.id] = task
  saveToDisk()
  return task
}

export function updateTask(
  taskId: string,
  updates: UpdateTaskInput,
): HermesTask | null {
  const task = store.tasks[taskId]
  if (!task) return null
  if (updates.title !== undefined) task.title = updates.title.trim()
  if (updates.description !== undefined) task.description = updates.description.trim()
  if (updates.column !== undefined) task.column = updates.column
  if (updates.priority !== undefined) task.priority = updates.priority
  if (updates.assignee !== undefined) task.assignee = updates.assignee
  if (updates.tags !== undefined) task.tags = updates.tags
  if (updates.dueDate !== undefined) task.dueDate = updates.dueDate
  if (updates.position !== undefined) task.position = updates.position
  task.updatedAt = Date.now()
  scheduleSave()
  return task
}

export function moveTask(taskId: string, column: TaskColumn): HermesTask | null {
  return updateTask(taskId, { column })
}

export function deleteTask(taskId: string): boolean {
  if (!store.tasks[taskId]) return false
  delete store.tasks[taskId]
  saveToDisk()
  return true
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run src/test/task-store.test.ts 2>&1 | tail -20`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/task-store.ts src/test/task-store.test.ts
git commit -m "feat(tasks): add task store with file-backed persistence"
```

---

## Task 7: Mission Store

**Files:**
- Create: `src/server/mission-store.ts`
- Create: `src/test/mission-store.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/mission-store.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'mission-store-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpDir, { recursive: true, force: true })
})

async function getStore() {
  return import('@/server/mission-store')
}

describe('mission-store', () => {
  it('listMissions() returns empty array initially', async () => {
    const { listMissions } = await getStore()
    expect(listMissions()).toEqual([])
  })

  it('createMission() creates a mission with defaults', async () => {
    const { createMission, getMission } = await getStore()
    const mission = createMission({ goal: 'Test goal' })
    expect(mission.id).toBeTruthy()
    expect(mission.goal).toBe('Test goal')
    expect(mission.status).toBe('idle')
    expect(mission.workers).toEqual([])
    expect(mission.tasks).toEqual([])
    expect(mission.totalTokens).toBe(0)
    expect(mission.totalCostUsd).toBe(0)
    expect(getMission(mission.id)).toEqual(mission)
  })

  it('updateMission() modifies mission fields', async () => {
    const { createMission, updateMission } = await getStore()
    const mission = createMission({ goal: 'Original' })
    const updated = updateMission(mission.id, { status: 'running' })
    expect(updated?.status).toBe('running')
  })

  it('updateMission() returns null for unknown id', async () => {
    const { updateMission } = await getStore()
    expect(updateMission('nonexistent', { status: 'running' })).toBeNull()
  })

  it('completeMission() sets status and completedAt', async () => {
    const { createMission, completeMission, getMission } = await getStore()
    const mission = createMission({ goal: 'Complete me' })
    completeMission(mission.id)
    const completed = getMission(mission.id)
    expect(completed?.status).toBe('completed')
    expect(completed?.completedAt).toBeGreaterThan(0)
  })

  it('abortMission() sets status to aborted', async () => {
    const { createMission, abortMission, getMission } = await getStore()
    const mission = createMission({ goal: 'Abort me' })
    abortMission(mission.id)
    expect(getMission(mission.id)?.status).toBe('aborted')
  })

  it('deleteMission() removes the mission', async () => {
    const { createMission, deleteMission, getMission } = await getStore()
    const mission = createMission({ goal: 'Delete me' })
    deleteMission(mission.id)
    expect(getMission(mission.id)).toBeNull()
  })

  it('appendMissionEvent() stores events', async () => {
    const { createMission, appendMissionEvent, getMissionEvents } = await getStore()
    const mission = createMission({ goal: 'Event test' })
    appendMissionEvent(mission.id, 'worker.spawned', { workerId: 'w1' })
    appendMissionEvent(mission.id, 'worker.output', { workerId: 'w1', text: 'hello' })
    const events = getMissionEvents(mission.id)
    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('worker.spawned')
    expect(events[1].type).toBe('worker.output')
  })

  it('addWorker() adds a worker to the mission', async () => {
    const { createMission, addWorker, getMission } = await getStore()
    const mission = createMission({ goal: 'Worker test' })
    addWorker(mission.id, {
      sessionKey: 'sess-1',
      label: 'Researcher',
      personaEmoji: '🔬',
      personaName: 'nova',
      model: null,
    })
    const updated = getMission(mission.id)
    expect(updated?.workers).toHaveLength(1)
    expect(updated?.workers[0].label).toBe('Researcher')
    expect(updated?.workers[0].status).toBe('pending')
  })

  it('updateWorkerStatus() changes worker status and tokens', async () => {
    const { createMission, addWorker, updateWorkerStatus, getMission } = await getStore()
    const mission = createMission({ goal: 'Status test' })
    addWorker(mission.id, {
      sessionKey: 'sess-1',
      label: 'Worker',
      personaEmoji: '🤖',
      personaName: 'kai',
      model: null,
    })
    updateWorkerStatus(mission.id, 'sess-1', 'running', 500)
    const updated = getMission(mission.id)
    expect(updated?.workers[0].status).toBe('running')
    expect(updated?.workers[0].totalTokens).toBe(500)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run src/test/mission-store.test.ts 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Implement mission-store.ts**

```typescript
// src/server/mission-store.ts

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

// ─── Types ───────────────────────────────────────────────────────────────────

type MissionsData = { missions: Record<string, Mission> }
type EventsData = { events: MissionEvent[] }

// ─── In-memory cache ─────────────────────────────────────────────────────────

let missionsStore: MissionsData = { missions: {} }
let eventsStore: EventsData = { events: [] }

// ─── Disk persistence ────────────────────────────────────────────────────────

function loadFromDisk(): void {
  try {
    if (existsSync(MISSIONS_FILE)) {
      const raw = readFileSync(MISSIONS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as MissionsData
      if (parsed?.missions && typeof parsed.missions === 'object') {
        missionsStore = parsed
      }
    }
  } catch {
    // corrupt file — start fresh
  }
  try {
    if (existsSync(EVENTS_FILE)) {
      const raw = readFileSync(EVENTS_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as EventsData
      if (Array.isArray(parsed?.events)) {
        eventsStore = parsed
      }
    }
  } catch {
    // corrupt file — start fresh
  }
}

function saveMissionsToDisk(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(MISSIONS_FILE, JSON.stringify(missionsStore, null, 2))
  } catch {
    // ignore
  }
}

function saveEventsToDisk(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(EVENTS_FILE, JSON.stringify(eventsStore, null, 2))
  } catch {
    // ignore
  }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(): void {
  if (_saveTimer) return
  _saveTimer = setTimeout(() => {
    _saveTimer = null
    saveMissionsToDisk()
  }, 1_000)
}

// Bootstrap on module load
loadFromDisk()

// ─── Public API: Missions ────────────────────────────────────────────────────

export function listMissions(): Mission[] {
  return Object.values(missionsStore.missions).sort(
    (a, b) => b.createdAt - a.createdAt,
  )
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
  // Also clean up events for this mission
  eventsStore.events = eventsStore.events.filter(
    (e) => e.missionId !== missionId,
  )
  saveMissionsToDisk()
  saveEventsToDisk()
  return true
}

// ─── Public API: Workers ─────────────────────────────────────────────────────

export function addWorker(
  missionId: string,
  worker: {
    sessionKey: string
    label: string
    personaEmoji: string
    personaName: string
    model: string | null
  },
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

// ─── Public API: Events ──────────────────────────────────────────────────────

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run src/test/mission-store.test.ts 2>&1 | tail -20`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/mission-store.ts src/test/mission-store.test.ts
git commit -m "feat(conductor): add mission store with file-backed persistence"
```

---

## Task 8: Operations Aggregator

**Files:**
- Create: `src/server/operations-aggregator.ts`
- Create: `src/test/operations-aggregator.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/operations-aggregator.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ops-aggregator-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('operations-aggregator', () => {
  it('getOperationsOverview() returns empty array with no crews or missions', async () => {
    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const agents = getOperationsOverview()
    expect(agents).toEqual([])
  })

  it('getOperationsOverview() includes crew members as agents', async () => {
    const { createCrew } = await import('@/server/crew-store')
    createCrew({
      name: 'Test Crew',
      goal: 'Testing',
      members: [
        {
          sessionKey: 'sess-1',
          role: 'executor',
          persona: 'kai',
          displayName: '🤖 Kai',
          roleLabel: 'Developer',
          color: 'blue',
          model: 'claude-sonnet-4-20250514',
          profileName: null,
        },
      ],
    })
    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const agents = getOperationsOverview()
    expect(agents).toHaveLength(1)
    expect(agents[0].name).toBe('Kai')
    expect(agents[0].source).toBe('crew')
    expect(agents[0].crewName).toBe('Test Crew')
  })

  it('getOperationsOverview() includes conductor workers as agents', async () => {
    const { createMission, addWorker } = await import('@/server/mission-store')
    const mission = createMission({ goal: 'Test mission' })
    addWorker(mission.id, {
      sessionKey: 'sess-2',
      label: 'Researcher',
      personaEmoji: '🔬',
      personaName: 'nova',
      model: null,
    })
    const { getOperationsOverview } = await import('@/server/operations-aggregator')
    const agents = getOperationsOverview()
    expect(agents).toHaveLength(1)
    expect(agents[0].name).toBe('nova')
    expect(agents[0].source).toBe('conductor')
    expect(agents[0].missionGoal).toBe('Test mission')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run src/test/operations-aggregator.test.ts 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: Implement operations-aggregator.ts**

```typescript
// src/server/operations-aggregator.ts

/**
 * Operations aggregator — read-only view across crews, missions, and standalone sessions.
 *
 * No persistence of its own. Queries crew-store and mission-store to build
 * a unified OperationAgent[] list.
 */

import type { OperationAgent, OperationAgentStatus } from '../types/operation'
import { listCrews } from './crew-store'
import { listMissions } from './mission-store'
import type { CrewMemberStatus } from './crew-store'
import type { WorkerStatus } from '../types/conductor'

function crewStatusToOpStatus(status: CrewMemberStatus): OperationAgentStatus {
  switch (status) {
    case 'running':
      return 'online'
    case 'idle':
    case 'done':
      return 'offline'
    case 'error':
      return 'error'
    default:
      return 'unknown'
  }
}

function workerStatusToOpStatus(status: WorkerStatus): OperationAgentStatus {
  switch (status) {
    case 'running':
      return 'online'
    case 'pending':
      return 'unknown'
    case 'done':
      return 'offline'
    case 'error':
      return 'error'
    default:
      return 'unknown'
  }
}

export function getOperationsOverview(): OperationAgent[] {
  const agents: OperationAgent[] = []

  // Crew members
  for (const crew of listCrews()) {
    for (const member of crew.members) {
      // Strip emoji prefix from displayName (e.g. "🤖 Kai" → "Kai")
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

  // Conductor mission workers
  for (const mission of listMissions()) {
    for (const worker of mission.workers) {
      agents.push({
        id: worker.id,
        name: worker.personaName,
        emoji: worker.personaEmoji,
        model: worker.model,
        profileName: null,
        sessionKey: worker.sessionKey,
        status: workerStatusToOpStatus(worker.status),
        lastActivity: null,
        totalTokens: worker.totalTokens,
        totalCostUsd: 0,
        taskCount: 0,
        crewId: null,
        crewName: null,
        missionId: mission.id,
        missionGoal: mission.goal,
        source: 'conductor',
      })
    }
  }

  return agents
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run src/test/operations-aggregator.test.ts 2>&1 | tail -20`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/operations-aggregator.ts src/test/operations-aggregator.test.ts
git commit -m "feat(operations): add operations aggregator"
```

---

## Task 9: Tasks API Routes

**Files:**
- Create: `src/routes/api/tasks/index.ts`
- Create: `src/routes/api/tasks/$taskId.ts`
- Create: `src/routes/api/tasks/$taskId.move.ts`

- [ ] **Step 1: Create tasks list/create route**

```typescript
// src/routes/api/tasks/index.ts

/**
 * GET  /api/tasks   — list tasks (optional filters: column, assignee, priority, sourceType, sourceId)
 * POST /api/tasks   — create a task
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { listTasks, createTask } from '../../../server/task-store'
import type { TaskColumn, TaskPriority, TaskSourceType } from '../../../types/task'

const VALID_COLUMNS: TaskColumn[] = ['backlog', 'todo', 'in_progress', 'review', 'done']
const VALID_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low']
const VALID_SOURCES: TaskSourceType[] = ['manual', 'conductor', 'crew']

export const Route = createFileRoute('/api/tasks/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const url = new URL(request.url)
        const column = url.searchParams.get('column') as TaskColumn | null
        const assignee = url.searchParams.get('assignee')
        const priority = url.searchParams.get('priority') as TaskPriority | null
        const sourceType = url.searchParams.get('sourceType') as TaskSourceType | null
        const sourceId = url.searchParams.get('sourceId')

        const filter: Record<string, unknown> = {}
        if (column && VALID_COLUMNS.includes(column)) filter.column = column
        if (assignee) filter.assignee = assignee
        if (priority && VALID_PRIORITIES.includes(priority)) filter.priority = priority
        if (sourceType && VALID_SOURCES.includes(sourceType)) filter.sourceType = sourceType
        if (sourceId) filter.sourceId = sourceId

        return json({ ok: true, tasks: listTasks(filter as any) })
      },

      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const title = typeof body.title === 'string' ? body.title.trim() : ''
        if (!title) {
          return json({ ok: false, error: 'title is required' }, { status: 400 })
        }

        const task = createTask({
          title,
          description: typeof body.description === 'string' ? body.description : undefined,
          column: VALID_COLUMNS.includes(body.column as TaskColumn) ? (body.column as TaskColumn) : undefined,
          priority: VALID_PRIORITIES.includes(body.priority as TaskPriority) ? (body.priority as TaskPriority) : undefined,
          assignee: typeof body.assignee === 'string' ? body.assignee : undefined,
          tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : undefined,
          dueDate: typeof body.dueDate === 'string' ? body.dueDate : undefined,
          sourceType: VALID_SOURCES.includes(body.sourceType as TaskSourceType) ? (body.sourceType as TaskSourceType) : undefined,
          sourceId: typeof body.sourceId === 'string' ? body.sourceId : undefined,
          createdBy: typeof body.createdBy === 'string' ? body.createdBy : undefined,
        })
        return json({ ok: true, task }, { status: 201 })
      },
    },
  },
})
```

- [ ] **Step 2: Create task detail route (GET/PATCH/DELETE)**

```typescript
// src/routes/api/tasks/$taskId.ts

/**
 * GET    /api/tasks/:taskId   — get single task
 * PATCH  /api/tasks/:taskId   — update task fields
 * DELETE /api/tasks/:taskId   — delete task
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { getTask, updateTask, deleteTask } from '../../../server/task-store'
import type { TaskColumn, TaskPriority } from '../../../types/task'

const VALID_COLUMNS: TaskColumn[] = ['backlog', 'todo', 'in_progress', 'review', 'done']
const VALID_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low']

export const Route = createFileRoute('/api/tasks/$taskId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const task = getTask(params.taskId)
        if (!task) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true, task })
      },

      PATCH: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const updates: Record<string, unknown> = {}
        if (typeof body.title === 'string') updates.title = body.title
        if (typeof body.description === 'string') updates.description = body.description
        if (VALID_COLUMNS.includes(body.column as TaskColumn)) updates.column = body.column
        if (VALID_PRIORITIES.includes(body.priority as TaskPriority)) updates.priority = body.priority
        if (body.assignee === null || typeof body.assignee === 'string') updates.assignee = body.assignee
        if (Array.isArray(body.tags)) updates.tags = body.tags.filter((t): t is string => typeof t === 'string')
        if (body.dueDate === null || typeof body.dueDate === 'string') updates.dueDate = body.dueDate

        const task = updateTask(params.taskId, updates as any)
        if (!task) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true, task })
      },

      DELETE: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const deleted = deleteTask(params.taskId)
        if (!deleted) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true })
      },
    },
  },
})
```

- [ ] **Step 3: Create task move route**

```typescript
// src/routes/api/tasks/$taskId.move.ts

/**
 * POST /api/tasks/:taskId/move — move task to a new column
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { moveTask } from '../../../server/task-store'
import type { TaskColumn } from '../../../types/task'

const VALID_COLUMNS: TaskColumn[] = ['backlog', 'todo', 'in_progress', 'review', 'done']

export const Route = createFileRoute('/api/tasks/$taskId/move')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const column = body.column as TaskColumn
        if (!VALID_COLUMNS.includes(column)) {
          return json({ ok: false, error: 'Invalid column' }, { status: 400 })
        }

        const task = moveTask(params.taskId, column)
        if (!task) {
          return json({ ok: false, error: 'Task not found' }, { status: 404 })
        }
        return json({ ok: true, task })
      },
    },
  },
})
```

- [ ] **Step 4: Run full test suite to check for regressions**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/tasks/
git commit -m "feat(tasks): add tasks API routes (CRUD + move)"
```

---

## Task 10: Missions API Routes

**Files:**
- Create: `src/routes/api/missions/index.ts`
- Create: `src/routes/api/missions/$missionId.ts`
- Create: `src/routes/api/missions/$missionId.abort.ts`
- Create: `src/routes/api/missions/$missionId.events.ts`

- [ ] **Step 1: Create missions list/create route**

```typescript
// src/routes/api/missions/index.ts

/**
 * GET  /api/missions   — list all missions
 * POST /api/missions   — create a new mission
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { listMissions, createMission } from '../../../server/mission-store'

export const Route = createFileRoute('/api/missions/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        return json({ ok: true, missions: listMissions() })
      },

      POST: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const goal = typeof body.goal === 'string' ? body.goal.trim() : ''
        if (!goal) {
          return json({ ok: false, error: 'goal is required' }, { status: 400 })
        }

        const templateId = typeof body.templateId === 'string' ? body.templateId : undefined

        const mission = createMission({ goal, templateId })
        return json({ ok: true, mission }, { status: 201 })
      },
    },
  },
})
```

- [ ] **Step 2: Create mission detail route (GET/DELETE)**

```typescript
// src/routes/api/missions/$missionId.ts

/**
 * GET    /api/missions/:missionId   — get mission with workers
 * DELETE /api/missions/:missionId   — delete completed/aborted mission
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { getMission, deleteMission, getMissionEvents } from '../../../server/mission-store'

export const Route = createFileRoute('/api/missions/$missionId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const mission = getMission(params.missionId)
        if (!mission) {
          return json({ ok: false, error: 'Mission not found' }, { status: 404 })
        }
        return json({ ok: true, mission })
      },

      DELETE: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const deleted = deleteMission(params.missionId)
        if (!deleted) {
          return json({ ok: false, error: 'Mission not found' }, { status: 404 })
        }
        return json({ ok: true })
      },
    },
  },
})
```

- [ ] **Step 3: Create mission abort route**

```typescript
// src/routes/api/missions/$missionId.abort.ts

/**
 * POST /api/missions/:missionId/abort — abort a running mission
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { requireJsonContentType } from '../../../server/rate-limit'
import { abortMission, appendMissionEvent } from '../../../server/mission-store'
import { publishChatEvent } from '../../../server/chat-event-bus'

export const Route = createFileRoute('/api/missions/$missionId/abort')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const csrfCheck = requireJsonContentType(request)
        if (csrfCheck) return csrfCheck

        const mission = abortMission(params.missionId)
        if (!mission) {
          return json({ ok: false, error: 'Mission not found' }, { status: 404 })
        }

        appendMissionEvent(params.missionId, 'mission.aborted', {
          missionId: params.missionId,
        })

        publishChatEvent('mission.aborted', {
          sessionKey: 'all',
          missionId: params.missionId,
        })

        return json({ ok: true, mission })
      },
    },
  },
})
```

- [ ] **Step 4: Create mission events route**

```typescript
// src/routes/api/missions/$missionId.events.ts

/**
 * GET /api/missions/:missionId/events — get paginated mission event log
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { getMissionEvents } from '../../../server/mission-store'

export const Route = createFileRoute('/api/missions/$missionId/events')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        const url = new URL(request.url)
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
        const offset = parseInt(url.searchParams.get('offset') || '0', 10)

        const events = getMissionEvents(params.missionId, limit, offset)
        return json({ ok: true, events })
      },
    },
  },
})
```

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/missions/
git commit -m "feat(conductor): add missions API routes (CRUD + abort + events)"
```

---

## Task 11: Operations API Route

**Files:**
- Create: `src/routes/api/operations/index.ts`

- [ ] **Step 1: Create operations overview route**

```typescript
// src/routes/api/operations/index.ts

/**
 * GET /api/operations — aggregated agent overview across all sources
 */
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { isAuthenticated } from '../../../server/auth-middleware'
import { getOperationsOverview } from '../../../server/operations-aggregator'

export const Route = createFileRoute('/api/operations/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        }
        return json({ ok: true, agents: getOperationsOverview() })
      },
    },
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api/operations/
git commit -m "feat(operations): add operations API route"
```

---

## Task 12: Client API Helpers

**Files:**
- Create: `src/lib/tasks-api.ts`
- Create: `src/lib/missions-api.ts`
- Create: `src/lib/operations-api.ts`

- [ ] **Step 1: Create tasks client API**

```typescript
// src/lib/tasks-api.ts

/**
 * Client-side API helpers for task management.
 */

import type { HermesTask, CreateTaskInput, UpdateTaskInput, TaskColumn } from '@/types/task'
import type { TaskFilter } from '@/server/task-store'

export async function fetchTasks(filter?: TaskFilter): Promise<HermesTask[]> {
  const params = new URLSearchParams()
  if (filter?.column) params.set('column', filter.column)
  if (filter?.assignee) params.set('assignee', filter.assignee)
  if (filter?.priority) params.set('priority', filter.priority)
  if (filter?.sourceType) params.set('sourceType', filter.sourceType)
  if (filter?.sourceId) params.set('sourceId', filter.sourceId)
  const qs = params.toString()
  const res = await fetch(`/api/tasks${qs ? `?${qs}` : ''}`)
  const data = (await res.json()) as { ok: boolean; tasks?: HermesTask[] }
  return data.tasks ?? []
}

export async function fetchTask(taskId: string): Promise<HermesTask | null> {
  const res = await fetch(`/api/tasks/${taskId}`)
  if (!res.ok) return null
  const data = (await res.json()) as { ok: boolean; task?: HermesTask }
  return data.task ?? null
}

export async function createTask(input: CreateTaskInput): Promise<HermesTask> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json()) as { ok: boolean; task?: HermesTask; error?: string }
  if (!data.ok || !data.task) throw new Error(data.error ?? 'Failed to create task')
  return data.task
}

export async function updateTask(taskId: string, updates: UpdateTaskInput): Promise<HermesTask> {
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const data = (await res.json()) as { ok: boolean; task?: HermesTask; error?: string }
  if (!data.ok || !data.task) throw new Error(data.error ?? 'Failed to update task')
  return data.task
}

export async function moveTask(taskId: string, column: TaskColumn): Promise<HermesTask> {
  const res = await fetch(`/api/tasks/${taskId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column }),
  })
  const data = (await res.json()) as { ok: boolean; task?: HermesTask; error?: string }
  if (!data.ok || !data.task) throw new Error(data.error ?? 'Failed to move task')
  return data.task
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Failed to delete task')
  }
}
```

- [ ] **Step 2: Create missions client API**

```typescript
// src/lib/missions-api.ts

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
```

- [ ] **Step 3: Create operations client API**

```typescript
// src/lib/operations-api.ts

/**
 * Client-side API helpers for operations dashboard.
 */

import type { OperationAgent } from '@/types/operation'

export async function fetchOperationsOverview(): Promise<OperationAgent[]> {
  const res = await fetch('/api/operations')
  const data = (await res.json()) as { ok: boolean; agents?: OperationAgent[] }
  return data.agents ?? []
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/tasks-api.ts src/lib/missions-api.ts src/lib/operations-api.ts
git commit -m "feat: add client API helpers for tasks, missions, and operations"
```

---

## Task 13: Tasks Kanban Screen

**Files:**
- Create: `src/routes/tasks.tsx`
- Create: `src/screens/tasks/tasks-screen.tsx`
- Create: `src/screens/tasks/components/task-column.tsx`
- Create: `src/screens/tasks/components/task-card.tsx`
- Create: `src/screens/tasks/components/task-dialog.tsx`

- [ ] **Step 1: Create the route file**

```typescript
// src/routes/tasks.tsx

import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { TasksScreen } from '@/screens/tasks/tasks-screen'

export const Route = createFileRoute('/tasks')({
  component: function TasksRoute() {
    usePageTitle('Tasks')
    return <TasksScreen />
  },
})
```

- [ ] **Step 2: Create the task card component**

```typescript
// src/screens/tasks/components/task-card.tsx

import { Card } from '@/components/ds/card'
import { StatusBadge } from '@/components/ds/status-badge'
import type { HermesTask } from '@/types/task'
import type { Status } from '@/components/ds/status-badge'

interface TaskCardProps {
  task: HermesTask
  onEdit: (task: HermesTask) => void
  onDragStart: (e: React.DragEvent, taskId: string) => void
}

const priorityToStatus: Record<string, Status> = {
  high: 'error',
  medium: 'warning',
  low: 'idle',
}

const sourceIcons: Record<string, string> = {
  manual: '✏️',
  conductor: '🎯',
  crew: '👥',
}

export function TaskCard({ task, onEdit, onDragStart }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onEdit(task)}
      className="cursor-pointer"
    >
      <Card className="hover:border-[var(--theme-accent-border)] transition-colors">
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-sm font-medium leading-snug"
            style={{ color: 'var(--theme-text)' }}
          >
            {task.title}
          </span>
          <span className="shrink-0 text-xs">{sourceIcons[task.sourceType] || '✏️'}</span>
        </div>

        {task.description && (
          <p
            className="mt-1 text-xs line-clamp-2"
            style={{ color: 'var(--theme-muted)' }}
          >
            {task.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <StatusBadge
            status={priorityToStatus[task.priority] || 'idle'}
            label={task.priority}
            size="sm"
          />
          {task.assignee && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--theme-accent-subtle)',
                color: 'var(--theme-accent)',
              }}
            >
              {task.assignee}
            </span>
          )}
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--theme-hover)',
                color: 'var(--theme-muted)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create the task column component**

```typescript
// src/screens/tasks/components/task-column.tsx

import type { HermesTask, TaskColumn as TaskColumnType } from '@/types/task'
import { TASK_COLUMN_LABELS } from '@/types/task'
import { TaskCard } from './task-card'

interface TaskColumnProps {
  column: TaskColumnType
  tasks: HermesTask[]
  onEdit: (task: HermesTask) => void
  onDragStart: (e: React.DragEvent, taskId: string) => void
  onDrop: (e: React.DragEvent, column: TaskColumnType) => void
}

export function TaskColumn({ column, tasks, onEdit, onDragStart, onDrop }: TaskColumnProps) {
  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[320px] flex-1"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, column)}
    >
      <div
        className="flex items-center gap-2 px-2 py-2 mb-2"
        style={{ borderBottom: '2px solid var(--theme-border)' }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--theme-muted)' }}
        >
          {TASK_COLUMN_LABELS[column]}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            background: 'var(--theme-hover)',
            color: 'var(--theme-muted)',
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto px-1 pb-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create the task dialog component**

```typescript
// src/screens/tasks/components/task-dialog.tsx

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { HermesTask, CreateTaskInput, TaskPriority, TaskColumn } from '@/types/task'
import { TASK_COLUMNS, TASK_COLUMN_LABELS } from '@/types/task'

interface TaskDialogProps {
  open: boolean
  onClose: () => void
  onSave: (input: CreateTaskInput) => void
  task?: HermesTask | null
}

const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low']

export function TaskDialog({ open, onClose, onSave, task }: TaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [column, setColumn] = useState<TaskColumn>('backlog')
  const [assignee, setAssignee] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
      setPriority(task.priority)
      setColumn(task.column)
      setAssignee(task.assignee ?? '')
      setTagsInput(task.tags.join(', '))
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setColumn('backlog')
      setAssignee('')
      setTagsInput('')
    }
  }, [task, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      column,
      assignee: assignee.trim() || undefined,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
    onClose()
  }

  const inputStyle = {
    background: 'var(--theme-input)',
    borderColor: 'var(--theme-border)',
    color: 'var(--theme-text)',
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle style={{ color: 'var(--theme-text)' }}>
          {task ? 'Edit Task' : 'New Task'}
        </DialogTitle>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={inputStyle}
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm resize-none"
            style={inputStyle}
            rows={3}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--theme-muted)' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                style={inputStyle}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs mb-1 block" style={{ color: 'var(--theme-muted)' }}>
                Column
              </label>
              <select
                value={column}
                onChange={(e) => setColumn(e.target.value as TaskColumn)}
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                style={inputStyle}
              >
                {TASK_COLUMNS.map((c) => (
                  <option key={c} value={c}>{TASK_COLUMN_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="text"
            placeholder="Assignee (optional)"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={inputStyle}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {task ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 5: Create the main tasks screen**

```typescript
// src/screens/tasks/tasks-screen.tsx

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { StatusBadge } from '@/components/ds/status-badge'
import { Button } from '@/components/ui/button'
import { TaskColumn } from './components/task-column'
import { TaskDialog } from './components/task-dialog'
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  moveTask as apiMoveTask,
} from '@/lib/tasks-api'
import type { HermesTask, CreateTaskInput, TaskColumn as TaskColumnType } from '@/types/task'
import { TASK_COLUMNS } from '@/types/task'

export function TasksScreen() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<HermesTask | null>(null)
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetchTasks(),
    refetchInterval: 3_000,
  })

  const createMutation = useMutation({
    mutationFn: apiCreateTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateTaskInput> }) =>
      apiUpdateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, column }: { id: string; column: TaskColumnType }) =>
      apiMoveTask(id, column),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleSave = useCallback(
    (input: CreateTaskInput) => {
      if (editingTask) {
        updateMutation.mutate({ id: editingTask.id, updates: input })
      } else {
        createMutation.mutate(input)
      }
      setEditingTask(null)
    },
    [editingTask, createMutation, updateMutation],
  )

  const handleEdit = useCallback((task: HermesTask) => {
    setEditingTask(task)
    setDialogOpen(true)
  }, [])

  const handleDragStart = useCallback((_e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId)
  }, [])

  const handleDrop = useCallback(
    (_e: React.DragEvent, column: TaskColumnType) => {
      if (dragTaskId) {
        moveMutation.mutate({ id: dragTaskId, column })
        setDragTaskId(null)
      }
    },
    [dragTaskId, moveMutation],
  )

  const tasksByColumn = TASK_COLUMNS.reduce(
    (acc, col) => {
      acc[col] = tasks.filter((t) => t.column === col)
      return acc
    },
    {} as Record<TaskColumnType, HermesTask[]>,
  )

  const totalTasks = tasks.length
  const inProgress = tasks.filter((t) => t.column === 'in_progress').length
  const done = tasks.filter((t) => t.column === 'done').length
  const completionPct = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--theme-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            Tasks
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
              {totalTasks} total
            </span>
            <StatusBadge status="running" label={`${inProgress} active`} size="sm" />
            <span className="text-xs" style={{ color: 'var(--theme-success)' }}>
              {completionPct}% done
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingTask(null)
            setDialogOpen(true)
          }}
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          <span className="ml-1.5">New Task</span>
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <StatusBadge status="running" label="Loading tasks..." />
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max">
            {TASK_COLUMNS.map((col) => (
              <TaskColumn
                key={col}
                column={col}
                tasks={tasksByColumn[col]}
                onEdit={handleEdit}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingTask(null)
        }}
        onSave={handleSave}
        task={editingTask}
      />
    </div>
  )
}
```

- [ ] **Step 6: Verify build compiles**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit 2>&1 | tail -20`
Expected: No errors (or only pre-existing errors unrelated to new code)

- [ ] **Step 7: Commit**

```bash
git add src/routes/tasks.tsx src/screens/tasks/
git commit -m "feat(tasks): add Kanban board UI with drag-and-drop"
```

---

## Task 14: Conductor Screen

**Files:**
- Create: `src/routes/conductor.tsx`
- Create: `src/screens/conductor/conductor-screen.tsx`
- Create: `src/screens/conductor/components/mission-home.tsx`
- Create: `src/screens/conductor/components/mission-preview.tsx`
- Create: `src/screens/conductor/components/mission-active.tsx`
- Create: `src/screens/conductor/components/mission-complete.tsx`
- Create: `src/screens/conductor/components/worker-card.tsx`
- Create: `src/screens/conductor/components/mission-event-log.tsx`
- Create: `src/screens/conductor/components/cost-tracker.tsx`

- [ ] **Step 1: Create the route file**

```typescript
// src/routes/conductor.tsx

import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { ConductorScreen } from '@/screens/conductor/conductor-screen'

export const Route = createFileRoute('/conductor')({
  component: function ConductorRoute() {
    usePageTitle('Conductor')
    return <ConductorScreen />
  },
})
```

- [ ] **Step 2: Create cost tracker component**

```typescript
// src/screens/conductor/components/cost-tracker.tsx

interface CostTrackerProps {
  totalTokens: number
  totalCostUsd: number
}

export function CostTracker({ totalTokens, totalCostUsd }: CostTrackerProps) {
  const formattedTokens = totalTokens >= 1000
    ? `${(totalTokens / 1000).toFixed(1)}k`
    : String(totalTokens)

  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 rounded-md text-xs"
      style={{
        background: 'var(--theme-card)',
        border: '1px solid var(--theme-border)',
        color: 'var(--theme-muted)',
      }}
    >
      <span>Tokens: <strong style={{ color: 'var(--theme-text)' }}>{formattedTokens}</strong></span>
      <span>Cost: <strong style={{ color: 'var(--theme-text)' }}>${totalCostUsd.toFixed(4)}</strong></span>
    </div>
  )
}
```

- [ ] **Step 3: Create worker card component**

```typescript
// src/screens/conductor/components/worker-card.tsx

import { Card } from '@/components/ds/card'
import { StatusBadge, type Status } from '@/components/ds/status-badge'
import type { MissionWorker } from '@/types/conductor'

interface WorkerCardProps {
  worker: MissionWorker
}

const workerStatusMap: Record<string, Status> = {
  pending: 'pending',
  running: 'running',
  done: 'success',
  error: 'error',
}

export function WorkerCard({ worker }: WorkerCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{worker.personaEmoji}</span>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
              {worker.label}
            </div>
            <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
              {worker.personaName}
              {worker.model && ` \u00b7 ${worker.model}`}
            </div>
          </div>
        </div>
        <StatusBadge status={workerStatusMap[worker.status] || 'idle'} size="sm" />
      </div>
      {worker.totalTokens > 0 && (
        <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
          {worker.totalTokens.toLocaleString()} tokens
        </div>
      )}
      {worker.output && (
        <div
          className="text-xs mt-1 p-2 rounded max-h-24 overflow-y-auto"
          style={{
            background: 'var(--theme-panel)',
            color: 'var(--theme-text)',
          }}
        >
          {worker.output}
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 4: Create mission event log component**

```typescript
// src/screens/conductor/components/mission-event-log.tsx

import type { MissionEvent } from '@/types/conductor'

interface MissionEventLogProps {
  events: MissionEvent[]
}

export function MissionEventLog({ events }: MissionEventLogProps) {
  if (events.length === 0) {
    return (
      <div className="text-sm py-4 text-center" style={{ color: 'var(--theme-muted)' }}>
        No events yet
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-2 px-2 py-1 text-xs rounded"
          style={{ background: 'var(--theme-panel)' }}
        >
          <span style={{ color: 'var(--theme-muted)' }}>
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
          <span
            className="font-mono px-1 rounded"
            style={{
              background: 'var(--theme-hover)',
              color: 'var(--theme-accent)',
            }}
          >
            {event.type}
          </span>
          <span style={{ color: 'var(--theme-text)' }} className="truncate flex-1">
            {JSON.stringify(event.data)}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create mission home component**

```typescript
// src/screens/conductor/components/mission-home.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ds/card'
import { StatusBadge } from '@/components/ds/status-badge'
import { fetchTemplates } from '@/lib/templates-api'
import { fetchMissions } from '@/lib/missions-api'
import type { Mission } from '@/types/conductor'

interface MissionHomeProps {
  onStartMission: (goal: string, templateId?: string) => void
  onViewMission: (mission: Mission) => void
}

export function MissionHome({ onStartMission, onViewMission }: MissionHomeProps) {
  const [goal, setGoal] = useState('')

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })
  const conductorTemplates = templates.filter((t) => t.templateType === 'conductor')

  const { data: missions = [] } = useQuery({
    queryKey: ['missions'],
    queryFn: fetchMissions,
    refetchInterval: 5_000,
  })

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Goal input */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
          New Mission
        </h2>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe your mission goal..."
          className="w-full rounded-lg border px-4 py-3 text-sm resize-none"
          style={{
            background: 'var(--theme-input)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text)',
          }}
          rows={4}
        />
        <Button disabled={!goal.trim()} onClick={() => onStartMission(goal.trim())}>
          Launch Mission
        </Button>
      </div>

      {/* Conductor templates */}
      {conductorTemplates.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-muted)' }}>
            Quick Start Templates
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {conductorTemplates.map((t) => (
              <Card
                key={t.id}
                className="cursor-pointer hover:border-[var(--theme-accent-border)] transition-colors"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setGoal(t.defaultGoal)
                    onStartMission(t.defaultGoal, t.id)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.icon}</span>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                        {t.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                        {t.description}
                      </div>
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent missions */}
      {missions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-muted)' }}>
            Recent Missions
          </h3>
          {missions.slice(0, 10).map((m) => (
            <Card
              key={m.id}
              className="cursor-pointer hover:border-[var(--theme-accent-border)] transition-colors"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onViewMission(m)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      {m.goal}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                      {m.workers.length} workers &middot; {new Date(m.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge
                    status={
                      m.status === 'running' ? 'running'
                        : m.status === 'completed' ? 'success'
                        : m.status === 'aborted' ? 'error'
                        : 'idle'
                    }
                    label={m.status}
                    size="sm"
                  />
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create mission preview component**

```typescript
// src/screens/conductor/components/mission-preview.tsx

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ds/card'
import type { CrewTemplate } from '@/types/template'

interface MissionPreviewProps {
  goal: string
  template: CrewTemplate | null
  onConfirm: () => void
  onCancel: () => void
}

export function MissionPreview({ goal, template, onConfirm, onCancel }: MissionPreviewProps) {
  const workers = template?.defaultMembers ?? []

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
        Review Mission
      </h2>

      <Card>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--theme-muted)' }}>
            Goal
          </label>
          <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{goal}</p>
        </div>
      </Card>

      {template && (
        <Card>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: 'var(--theme-muted)' }}>
              Template: {template.icon} {template.name}
            </label>
            <div className="flex flex-col gap-1">
              {workers.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    background: 'var(--theme-accent-subtle)',
                    color: 'var(--theme-accent)',
                  }}>
                    {w.role}
                  </span>
                  <span>{w.persona}</span>
                </div>
              ))}
            </div>
            {template.conductorConfig && (
              <div className="text-xs mt-1" style={{ color: 'var(--theme-muted)' }}>
                Max parallel: {template.conductorConfig.maxParallel}
                {template.conductorConfig.supervised && ' \u00b7 Supervised'}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Launch</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create mission active component**

```typescript
// src/screens/conductor/components/mission-active.tsx

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ds/status-badge'
import { WorkerCard } from './worker-card'
import { MissionEventLog } from './mission-event-log'
import { CostTracker } from './cost-tracker'
import { fetchMission, fetchMissionEvents } from '@/lib/missions-api'
import type { Mission } from '@/types/conductor'

interface MissionActiveProps {
  missionId: string
  onAbort: () => void
}

export function MissionActive({ missionId, onAbort }: MissionActiveProps) {
  const { data: mission } = useQuery({
    queryKey: ['mission', missionId],
    queryFn: () => fetchMission(missionId),
    refetchInterval: 3_000,
  })

  const { data: events = [] } = useQuery({
    queryKey: ['mission-events', missionId],
    queryFn: () => fetchMissionEvents(missionId),
    refetchInterval: 3_000,
  })

  if (!mission) {
    return <StatusBadge status="running" label="Loading mission..." />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            {mission.goal}
          </h2>
          <StatusBadge
            status={mission.status === 'running' ? 'running' : 'idle'}
            label={mission.status}
          />
        </div>
        <div className="flex items-center gap-3">
          <CostTracker totalTokens={mission.totalTokens} totalCostUsd={mission.totalCostUsd} />
          {mission.status === 'running' && (
            <Button variant="ghost" onClick={onAbort} className="text-[var(--theme-danger)]">
              Abort
            </Button>
          )}
        </div>
      </div>

      {/* Workers grid */}
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-muted)' }}>
          Workers ({mission.workers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mission.workers.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      </div>

      {/* Event log */}
      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-muted)' }}>
          Event Log
        </h3>
        <MissionEventLog events={events} />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create mission complete component**

```typescript
// src/screens/conductor/components/mission-complete.tsx

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ds/card'
import { StatusBadge } from '@/components/ds/status-badge'
import { CostTracker } from './cost-tracker'
import { WorkerCard } from './worker-card'
import { fetchMission } from '@/lib/missions-api'

interface MissionCompleteProps {
  missionId: string
  onNewMission: () => void
}

export function MissionComplete({ missionId, onNewMission }: MissionCompleteProps) {
  const { data: mission } = useQuery({
    queryKey: ['mission', missionId],
    queryFn: () => fetchMission(missionId),
  })

  if (!mission) {
    return <StatusBadge status="running" label="Loading..." />
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            Mission {mission.status === 'completed' ? 'Complete' : 'Aborted'}
          </h2>
          <StatusBadge
            status={mission.status === 'completed' ? 'success' : 'error'}
            label={mission.status}
          />
        </div>
        <CostTracker totalTokens={mission.totalTokens} totalCostUsd={mission.totalCostUsd} />
      </div>

      <Card>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--theme-muted)' }}>
            Goal
          </label>
          <p className="text-sm" style={{ color: 'var(--theme-text)' }}>{mission.goal}</p>
          {mission.completedAt && (
            <p className="text-xs mt-1" style={{ color: 'var(--theme-muted)' }}>
              Duration: {Math.round((mission.completedAt - mission.createdAt) / 1000)}s
            </p>
          )}
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--theme-muted)' }}>
          Workers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mission.workers.map((w) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      </div>

      <Button onClick={onNewMission}>New Mission</Button>
    </div>
  )
}
```

- [ ] **Step 9: Create the main conductor screen**

```typescript
// src/screens/conductor/conductor-screen.tsx

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MissionHome } from './components/mission-home'
import { MissionPreview } from './components/mission-preview'
import { MissionActive } from './components/mission-active'
import { MissionComplete } from './components/mission-complete'
import { createMission, abortMission as apiAbortMission } from '@/lib/missions-api'
import { fetchTemplates } from '@/lib/templates-api'
import type { ConductorPhase, Mission } from '@/types/conductor'

export function ConductorScreen() {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<ConductorPhase>('home')
  const [currentGoal, setCurrentGoal] = useState('')
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null)

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })

  const createMutation = useMutation({
    mutationFn: createMission,
    onSuccess: (mission) => {
      setActiveMissionId(mission.id)
      setPhase('active')
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  const abortMutation = useMutation({
    mutationFn: (id: string) => apiAbortMission(id),
    onSuccess: () => {
      setPhase('complete')
      queryClient.invalidateQueries({ queryKey: ['missions'] })
    },
  })

  const handleStartMission = useCallback(
    (goal: string, templateId?: string) => {
      setCurrentGoal(goal)
      setCurrentTemplateId(templateId ?? null)
      if (templateId) {
        setPhase('preview')
      } else {
        createMutation.mutate({ goal })
      }
    },
    [createMutation],
  )

  const handleViewMission = useCallback((mission: Mission) => {
    setActiveMissionId(mission.id)
    if (mission.status === 'running') {
      setPhase('active')
    } else {
      setPhase('complete')
    }
  }, [])

  const handleConfirmPreview = useCallback(() => {
    createMutation.mutate({
      goal: currentGoal,
      templateId: currentTemplateId ?? undefined,
    })
  }, [currentGoal, currentTemplateId, createMutation])

  const handleAbort = useCallback(() => {
    if (activeMissionId) {
      abortMutation.mutate(activeMissionId)
    }
  }, [activeMissionId, abortMutation])

  const handleNewMission = useCallback(() => {
    setPhase('home')
    setActiveMissionId(null)
    setCurrentGoal('')
    setCurrentTemplateId(null)
  }, [])

  const selectedTemplate = currentTemplateId
    ? templates.find((t) => t.id === currentTemplateId) ?? null
    : null

  return (
    <div
      className="flex flex-col h-full overflow-y-auto p-6"
      style={{ background: 'var(--theme-bg)' }}
    >
      {phase === 'home' && (
        <MissionHome
          onStartMission={handleStartMission}
          onViewMission={handleViewMission}
        />
      )}
      {phase === 'preview' && (
        <MissionPreview
          goal={currentGoal}
          template={selectedTemplate}
          onConfirm={handleConfirmPreview}
          onCancel={handleNewMission}
        />
      )}
      {phase === 'active' && activeMissionId && (
        <MissionActive missionId={activeMissionId} onAbort={handleAbort} />
      )}
      {phase === 'complete' && activeMissionId && (
        <MissionComplete missionId={activeMissionId} onNewMission={handleNewMission} />
      )}
    </div>
  )
}
```

- [ ] **Step 10: Verify build compiles**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit 2>&1 | tail -20`
Expected: No errors related to new files

- [ ] **Step 11: Commit**

```bash
git add src/routes/conductor.tsx src/screens/conductor/
git commit -m "feat(conductor): add conductor screen with phase-based mission UI"
```

---

## Task 15: Operations Screen

**Files:**
- Create: `src/routes/operations.tsx`
- Create: `src/screens/operations/operations-screen.tsx`
- Create: `src/screens/operations/components/agent-grid.tsx`
- Create: `src/screens/operations/components/agent-card.tsx`
- Create: `src/screens/operations/components/agent-outputs.tsx`

- [ ] **Step 1: Create the route file**

```typescript
// src/routes/operations.tsx

import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { OperationsScreen } from '@/screens/operations/operations-screen'

export const Route = createFileRoute('/operations')({
  component: function OperationsRoute() {
    usePageTitle('Operations')
    return <OperationsScreen />
  },
})
```

- [ ] **Step 2: Create agent card component**

```typescript
// src/screens/operations/components/agent-card.tsx

import { Card } from '@/components/ds/card'
import { StatusBadge, type Status } from '@/components/ds/status-badge'
import type { OperationAgent } from '@/types/operation'
import { Link } from '@tanstack/react-router'

interface AgentCardProps {
  agent: OperationAgent
}

const opStatusMap: Record<string, Status> = {
  online: 'running',
  offline: 'idle',
  error: 'error',
  unknown: 'pending',
}

export function AgentCard({ agent }: AgentCardProps) {
  const linkTo = agent.crewId
    ? `/crews/${agent.crewId}`
    : agent.missionId
      ? '/conductor'
      : undefined

  const content = (
    <Card className="hover:border-[var(--theme-accent-border)] transition-colors h-full">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{agent.emoji}</span>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
              {agent.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
              {agent.model ?? 'default model'}
            </div>
          </div>
        </div>
        <StatusBadge status={opStatusMap[agent.status] || 'idle'} size="sm" />
      </div>

      <div className="mt-2 flex flex-col gap-0.5 text-xs" style={{ color: 'var(--theme-muted)' }}>
        {agent.crewName && <span>Crew: {agent.crewName}</span>}
        {agent.missionGoal && (
          <span className="truncate">Mission: {agent.missionGoal}</span>
        )}
        {agent.totalTokens > 0 && (
          <span>{agent.totalTokens.toLocaleString()} tokens</span>
        )}
        {agent.lastActivity && (
          <span>Last: {new Date(agent.lastActivity).toLocaleTimeString()}</span>
        )}
      </div>
    </Card>
  )

  if (linkTo) {
    return <Link to={linkTo} className="block">{content}</Link>
  }
  return content
}
```

- [ ] **Step 3: Create agent grid component**

```typescript
// src/screens/operations/components/agent-grid.tsx

import type { OperationAgent } from '@/types/operation'
import { AgentCard } from './agent-card'

interface AgentGridProps {
  agents: OperationAgent[]
}

export function AgentGrid({ agents }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 text-sm"
        style={{ color: 'var(--theme-muted)' }}
      >
        No agents running. Start a Crew or Conductor mission to see agents here.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create agent outputs component**

```typescript
// src/screens/operations/components/agent-outputs.tsx

import { Card } from '@/components/ds/card'
import { StatusBadge, type Status } from '@/components/ds/status-badge'
import type { OperationAgent } from '@/types/operation'

interface AgentOutputsProps {
  agents: OperationAgent[]
}

const opStatusMap: Record<string, Status> = {
  online: 'running',
  offline: 'idle',
  error: 'error',
  unknown: 'pending',
}

export function AgentOutputs({ agents }: AgentOutputsProps) {
  if (agents.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 text-sm"
        style={{ color: 'var(--theme-muted)' }}
      >
        No agent outputs to display.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {agents.map((agent) => (
        <Card key={agent.id}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{agent.emoji}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                {agent.name}
              </span>
              {agent.crewName && (
                <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                  ({agent.crewName})
                </span>
              )}
              {agent.missionGoal && (
                <span className="text-xs truncate max-w-48" style={{ color: 'var(--theme-muted)' }}>
                  ({agent.missionGoal})
                </span>
              )}
            </div>
            <StatusBadge status={opStatusMap[agent.status] || 'idle'} size="sm" />
          </div>
          <div
            className="text-xs p-3 rounded max-h-48 overflow-y-auto"
            style={{
              background: 'var(--theme-panel)',
              color: 'var(--theme-text)',
            }}
          >
            {agent.lastActivity
              ? `Last activity: ${agent.lastActivity}`
              : 'No output yet'}
          </div>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Create main operations screen**

```typescript
// src/screens/operations/operations-screen.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@/components/ds/status-badge'
import { Button } from '@/components/ui/button'
import { AgentGrid } from './components/agent-grid'
import { AgentOutputs } from './components/agent-outputs'
import { fetchOperationsOverview } from '@/lib/operations-api'
import type { OperationAgentStatus } from '@/types/operation'

type ViewMode = 'grid' | 'outputs'

export function OperationsScreen() {
  const [view, setView] = useState<ViewMode>('grid')
  const [statusFilter, setStatusFilter] = useState<OperationAgentStatus | 'all'>('all')

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['operations'],
    queryFn: fetchOperationsOverview,
    refetchInterval: 3_000,
  })

  const filteredAgents = statusFilter === 'all'
    ? agents
    : agents.filter((a) => a.status === statusFilter)

  const onlineCount = agents.filter((a) => a.status === 'online').length
  const totalCost = agents.reduce((sum, a) => sum + a.totalCostUsd, 0)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--theme-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
            Operations
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
              {agents.length} agents
            </span>
            <StatusBadge status="running" label={`${onlineCount} online`} size="sm" />
            {totalCost > 0 && (
              <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                ${totalCost.toFixed(4)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OperationAgentStatus | 'all')}
            className="rounded-md border px-2 py-1 text-xs"
            style={{
              background: 'var(--theme-input)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <option value="all">All</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="error">Error</option>
          </select>
          <div
            className="flex rounded-md border overflow-hidden"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="rounded-none"
            >
              Grid
            </Button>
            <Button
              variant={view === 'outputs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('outputs')}
              className="rounded-none"
            >
              Outputs
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <StatusBadge status="running" label="Loading agents..." />
          </div>
        ) : view === 'grid' ? (
          <AgentGrid agents={filteredAgents} />
        ) : (
          <AgentOutputs agents={filteredAgents} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify build compiles**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit 2>&1 | tail -20`
Expected: No errors related to new files

- [ ] **Step 7: Commit**

```bash
git add src/routes/operations.tsx src/screens/operations/
git commit -m "feat(operations): add operations dashboard with grid and outputs views"
```

---

## Task 16: Sidebar Navigation

**Files:**
- Modify: `src/screens/chat/components/chat-sidebar.tsx`
- Modify: `src/components/workspace-shell.tsx`

- [ ] **Step 1: Read the sidebar nav definitions section**

Read lines 720-850 of `src/screens/chat/components/chat-sidebar.tsx` to find the exact `mainItems` array.

- [ ] **Step 2: Add icon imports at top of file**

Add these imports alongside the existing HugeIcons imports at the top of `src/screens/chat/components/chat-sidebar.tsx`:

```typescript
import {
  // ... existing imports ...
  Target01Icon,
  SatelliteIcon,
  TaskDaily01Icon,
} from '@hugeicons/core-free-icons'
```

Note: If these exact icon names don't exist in the `@hugeicons/core-free-icons` package, use alternatives that are available. Check imports first.

- [ ] **Step 3: Add active state checks**

In the route active states section (around line 515-533), add:

```typescript
const isConductorActive = pathname === '/conductor'
const isOperationsActive = pathname === '/operations'
const isTasksActive = pathname === '/tasks'
```

- [ ] **Step 4: Add nav items to mainItems array**

Add these three items to the `mainItems` array, after the `Crews` entry and before `Agents`:

```typescript
{
  kind: 'link',
  to: '/conductor',
  icon: Target01Icon,
  label: 'Conductor',
  active: isConductorActive,
},
{
  kind: 'link',
  to: '/operations',
  icon: SatelliteIcon,
  label: 'Operations',
  active: isOperationsActive,
},
{
  kind: 'link',
  to: '/tasks',
  icon: TaskDaily01Icon,
  label: 'Tasks',
  active: isTasksActive,
},
```

- [ ] **Step 5: Add mobile page titles to workspace-shell.tsx**

In `src/components/workspace-shell.tsx`, find the `mobilePageTitle` block (around line 128-145) and add these cases:

```typescript
if (pathname.startsWith('/conductor')) return 'Conductor'
if (pathname.startsWith('/operations')) return 'Operations'
if (pathname.startsWith('/tasks')) return 'Tasks'
```

- [ ] **Step 6: Verify build compiles**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run 2>&1 | tail -20`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/screens/chat/components/chat-sidebar.tsx src/components/workspace-shell.tsx
git commit -m "feat: add Conductor, Operations, and Tasks to sidebar navigation"
```

---

## Task 17: Integration — Audit Trail Events

**Files:**
- Modify: `src/server/task-store.ts`
- Modify: `src/server/mission-store.ts`

- [ ] **Step 1: Add audit event emission to task-store**

In `src/server/task-store.ts`, add this import at the top:

```typescript
import { publishChatEvent } from './chat-event-bus'
```

Then add `publishChatEvent` calls to `createTask`, `moveTask`, and `deleteTask`:

In `createTask`, after `saveToDisk()`:
```typescript
publishChatEvent('task.created', { sessionKey: 'all', taskId: task.id, title: task.title, sourceType: task.sourceType })
```

In `moveTask`, after the `updateTask` call (if successful):
```typescript
if (result) {
  publishChatEvent('task.moved', { sessionKey: 'all', taskId, column })
}
return result
```

In `deleteTask`, before `return true`:
```typescript
publishChatEvent('task.deleted', { sessionKey: 'all', taskId })
```

- [ ] **Step 2: Add audit event emission to mission-store**

In `src/server/mission-store.ts`, add this import at the top:

```typescript
import { publishChatEvent } from './chat-event-bus'
```

Add `publishChatEvent` calls to `createMission`, `completeMission`, and `abortMission`:

In `createMission`, after `saveMissionsToDisk()`:
```typescript
publishChatEvent('mission.created', { sessionKey: 'all', missionId: mission.id, goal: mission.goal })
```

In `completeMission`, after `saveMissionsToDisk()`:
```typescript
publishChatEvent('mission.completed', { sessionKey: 'all', missionId })
```

In `abortMission`, after `saveMissionsToDisk()`:
```typescript
publishChatEvent('mission.aborted', { sessionKey: 'all', missionId })
```

- [ ] **Step 3: Run tests to verify no regressions**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run 2>&1 | tail -20`
Expected: All tests pass (publishChatEvent may need mocking in tests — if tests fail, mock `chat-event-bus` module in the test setup)

- [ ] **Step 4: Commit**

```bash
git add src/server/task-store.ts src/server/mission-store.ts
git commit -m "feat: wire task and mission events into audit trail via chat-event-bus"
```

---

## Task 18: Integration — Cross-Link Task Creation

**Files:**
- Modify: `src/routes/api/missions/index.ts` (POST handler)

- [ ] **Step 1: Add task auto-creation when a mission is created**

In `src/routes/api/missions/index.ts`, import the task store:

```typescript
import { createTask } from '../../../server/task-store'
```

In the POST handler, after `createMission()`, auto-create a task:

```typescript
const mission = createMission({ goal, templateId })

// Cross-link: create a task on the Kanban board for this mission
createTask({
  title: `Mission: ${goal.slice(0, 80)}`,
  description: goal,
  column: 'todo',
  sourceType: 'conductor',
  sourceId: mission.id,
  createdBy: 'conductor',
})

return json({ ok: true, mission }, { status: 201 })
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/api/missions/index.ts
git commit -m "feat: auto-create task on Kanban board when conductor mission is created"
```

---

## Task 19: Integration — Crew Detail Operations Tab

**Files:**
- Modify: `src/screens/crews/crew-detail-screen.tsx`

- [ ] **Step 1: Read crew detail screen to understand its tab structure**

Read the full file to find where tabs are defined and how to add a new one.

- [ ] **Step 2: Add an Operations tab**

This task depends on the exact structure found in step 1. The goal is to add an "Operations" tab that shows a filtered view of the operations data for that specific crew. It should:

- Import `fetchOperationsOverview` from `@/lib/operations-api`
- Use `useQuery` to fetch operations data
- Filter agents where `agent.crewId === crewId`
- Render using the `AgentGrid` component from `src/screens/operations/components/agent-grid.tsx`

The exact code depends on how the existing tabs are structured, so read the file first.

- [ ] **Step 3: Verify build compiles**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit 2>&1 | tail -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/screens/crews/crew-detail-screen.tsx
git commit -m "feat(crews): add Operations tab to crew detail screen"
```

---

## Task 20: Run Full Test Suite & Final Verification

- [ ] **Step 1: Run all unit tests**

Run: `cd /home/jpeetz/Hermes-Studio && npx vitest run 2>&1 | tail -30`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript compilation**

Run: `cd /home/jpeetz/Hermes-Studio && npx tsc --noEmit 2>&1 | tail -30`
Expected: No new errors introduced by our changes

- [ ] **Step 3: Start the dev server and verify routes load**

Run: `cd /home/jpeetz/Hermes-Studio && npx vinxi dev &` then test:
- `curl -s http://localhost:3000/api/tasks | head -1` → should return JSON with `ok: true`
- `curl -s http://localhost:3000/api/missions | head -1` → should return JSON with `ok: true`
- `curl -s http://localhost:3000/api/operations | head -1` → should return JSON with `ok: true`

Kill the dev server after verification.

- [ ] **Step 4: Commit any remaining fixes**

If any issues were found and fixed, commit them:

```bash
git add -A
git commit -m "fix: address issues found during final verification"
```
