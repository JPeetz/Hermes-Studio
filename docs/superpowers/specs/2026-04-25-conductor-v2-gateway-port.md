# Conductor V2 — Gateway Port Design Spec

**Date:** 2026-04-25
**Status:** Approved
**Scope:** Replace v1.19.0 stub Conductor with real upstream gateway conductor port

---

## Problem

The v1.19.0 Conductor was built from a plan spec without studying the actual upstream hermes-workspace code. The result is a basic static card UI with no animations, no real gateway integration, no live SSE streaming, and no configuration options. The upstream Conductor has an animated SVG virtual office, real Hermes Agent orchestration, live worker monitoring, and extensive configuration — none of which was ported.

## Goal

Replace the stub Conductor with a faithful adapted port of the upstream gateway conductor. The Hermes gateway does actual orchestration (decomposing goals, spawning workers). Our UI monitors, displays, and controls it with an animated office view.

---

## Architecture

**Approach:** Gateway-first adapted port. Decomposed into focused component files matching Hermes Studio conventions. OfficeView SVG canvas gets a pragmatic color exception (self-contained color system); all surrounding UI chrome uses `var(--theme-*)`.

**What stays:**
- Task store + Kanban board (`/tasks`) — independent, unchanged
- Operations aggregator + dashboard (`/operations`) — updated to query live gateway sessions
- Sidebar navigation — already has links
- Template store — conductor templates stay

**What gets replaced:**
- `src/server/mission-store.ts` + its 4 API routes → deleted
- `src/screens/conductor/*` (all 9 files) → replaced with ~15 focused component files
- `src/types/conductor.ts` → rewritten to match upstream types
- `src/lib/missions-api.ts` → deleted (gateway-native API calls)

**What gets added:**
- `POST /api/conductor-spawn` — server route that creates Hermes cron job for orchestrator
- `POST /api/conductor-stop` — server route that kills mission worker sessions
- `src/screens/conductor/hooks/use-conductor-gateway.ts` — main hook
- `src/screens/conductor/components/office-view.tsx` — animated SVG office
- ~12 more component files

**Data flow:**
```
User sets goal + settings → POST /api/conductor-spawn → Hermes creates cron job
→ Orchestrator session decomposes goal → spawns worker sessions
→ UI polls GET /api/sessions to discover workers
→ UI opens SSE streams per worker for live output
→ Workers complete → UI transitions to complete phase
→ Mission archived to localStorage history
```

---

## Component Decomposition

### Hook (the engine)
- `use-conductor-gateway.ts` — All state management, session polling, worker tracking, mission lifecycle, history persistence. Adapted from upstream's 1283-line hook.

### Screen orchestrator
- `conductor-screen.tsx` — Phase router (home → active → complete), settings drawer toggle, wires hook to child components.

### Phase components
- `conductor-home.tsx` — Goal textarea, quick actions (Research/Build/Review/Deploy), settings summary, recent missions list, mission history panel with restore/export.
- `conductor-active.tsx` — OfficeView + event log + cost tracker + abort/pause controls.
- `conductor-complete.tsx` — Summary card (duration, tokens, status), worker output panels, retry/new mission buttons, file browser for output path.

### Shared components
- `office-view.tsx` — SVG animated office. Three layouts (Grid, Roundtable, War Room). Agent desks with monitors, speech bubbles, status glows, social spots. Self-contained color system. ~800 lines.
- `conductor-settings.tsx` — Settings panel: orchestrator model, worker model, projects dir, max parallel (1-5), supervised toggle. localStorage persisted.
- `mission-timeline.tsx` — Vertical timeline of mission events.
- `mission-event-log.tsx` — Scrollable live event stream.
- `cost-tracker.tsx` — Token count + estimated USD per worker and total.
- `mission-history-card.tsx` — Card for past mission in history list.
- `export-mission.tsx` — Export mission results as Markdown.

### API routes (server)
- `src/routes/api/conductor-spawn.ts` — POST: creates orchestrator cron job via Hermes gateway.
- `src/routes/api/conductor-stop.ts` — POST: kills session keys.

### Types
- `src/types/conductor.ts` — Rewritten: ConductorSettings, ConductorWorker, ConductorTask, MissionHistoryEntry, StreamEvent, PersistedMission, MissionPhase.

### Deleted files
- `src/server/mission-store.ts`
- `src/routes/api/missions/index.ts`
- `src/routes/api/missions/$missionId.ts`
- `src/routes/api/missions/$missionId.abort.ts`
- `src/routes/api/missions/$missionId.events.ts`
- `src/lib/missions-api.ts`
- `src/test/mission-store.test.ts`
- `src/test/operations-aggregator.test.ts`

---

## OfficeView Visual Design

### Layout modes (user-selectable)
- **Grid** — 4x3 desk grid, traditional office layout
- **Roundtable** — Desks arranged in a circle, conference style
- **War Room** — Two facing rows of 6 desks

### Per-agent desk elements
- Desk surface with legs (SVG rectangles)
- Monitor showing current task text or status, with status-colored glow border
- Agent avatar (emoji or initial) seated at desk
- Speech bubble with truncated last output or social activity
- Status dot (emerald=active, blue=spawning, amber=paused, red=error, grey=idle) with pulse animation for active/spawning
- Model badge (Opus/Sonnet/Codex/Flash color-coded pill)

### Social spots (decorative, layout-specific positions)
- Coffee machine, water cooler, plant, snack station — SVG icons at fixed positions

### Idle agent behavior
- Agents cycle through social activity lines every ~16 seconds: "Grabbing coffee", "Checking messages", "Stretching", "Chatting with team", "Reading docs", "Getting water"

### Animation
- CSS keyframe pulse on active/spawning status dots
- Status glow classes added to `styles.css`
- Phase counter via `setInterval` driving speech bubble rotation
- No framer-motion dependency — pure CSS animations + SVG

### Color system (pragmatic exception)
- SVG fills use hex colors directly (desk: `#f8fafc`, monitor: `#0f172a`, legs: `#a7b4c6`)
- Status colors: emerald `#10b981`, blue `#3b82f6`, amber `#f59e0b`, red `#ef4444`, slate `#94a3b8`
- Agent accent colors from upstream's `AGENT_ACCENT_COLORS` array
- Surrounding container/chrome uses `var(--theme-*)` as normal

### Interaction
- Click agent desk → opens output panel for that agent
- Header shows mission name, agent count, layout toggle buttons

---

## Gateway Integration & Mission Lifecycle

### Spawn flow
1. User enters goal + configures settings
2. Frontend calls `POST /api/conductor-spawn` with `{ goal, orchestratorModel, workerModel, projectsDir, maxParallel, supervised }`
3. Server creates Hermes cron job with orchestrator prompt
4. Server returns `{ ok, sessionKey, sessionKeyPrefix, jobId }`
5. Frontend enters `decomposing` phase, polls `GET /api/sessions`
6. Once workers appear (or 15s timeout), transitions to `running`

### Live monitoring
- Polls `GET /api/sessions` every 3s for worker status
- Worker staleness: >10s with tokens = complete, >120s = stale
- Worker outputs fetched via `GET /api/history?sessionKey=...&limit=10` (5s while running, 2s for final)
- Tasks auto-extracted from orchestrator plan text via regex

### Completion detection
- `workersLookComplete()`: all workers have tokens > 0 AND no update in 8+ seconds
- OR: no active workers remaining after at least one existed
- Transitions to `complete`, records `completedAt`

### Abort/Stop
- `POST /api/conductor-stop` with `{ sessionKeys }` — kills all workers
- Sets error status, transitions to complete

### Pause/Resume
- `POST /api/agent-pause` with `{ sessionKey, pause }` per agent
- Tracks accumulated paused time for duration accuracy

### Persistence (localStorage)
- Active mission → `conductor:active-mission` (on every state change)
- On reload: restores `complete`/`idle`, discards `running`/`decomposing` (stale)
- Settings → `conductor-settings`
- History → `conductor:history` (max 50 entries, deduplicated)

### Timeout handling
- No activity for 60s → timeout warning
- User can dismiss or abort

---

## Settings & Configuration

### Settings panel (slide-out drawer)
- **Orchestrator Model** — Dropdown from `GET /api/models`
- **Worker Model** — Dropdown, same source
- **Projects Directory** — Text input for working directory path
- **Max Parallel** — Slider, 1-5
- **Supervised** — Toggle for approval-gated orchestration

### Quick Actions (home screen)
- Research, Build, Review, Deploy — pre-fill goal textarea with role-specific prompt prefix

### Persistence
- All settings in `localStorage['conductor-settings']`
- Defaults: `{ orchestratorModel: '', workerModel: '', projectsDir: '', maxParallel: 1, supervised: false }`
- Empty model strings = Hermes default

---

## Changes to Existing Code

### Operations aggregator
- Updated to query live gateway sessions instead of deleted mission-store
- Filter for `conductor-*` labeled sessions from `GET /api/sessions`

### Tasks / Kanban
- No changes. Cross-link from conductor→tasks can be re-added as frontend call in `sendMission` (future enhancement).

### Template store
- No changes. 4 conductor templates stay. Quick actions are separate (prompt prefixes).

### CSS additions to `styles.css`
- `@keyframes office-pulse` — status dot pulse
- `.office-status-glow-active`, `.office-status-glow-starting`, `.office-status-glow-paused`, `.office-status-glow-error`, `.office-status-glow-idle`

### Tests
- Delete `mission-store.test.ts` (10 tests) and `operations-aggregator.test.ts` (3 tests)
- Add: conductor-spawn route test, conductor-stop route test, operations aggregator v2 test
- Net: roughly same count, testing real integration points
