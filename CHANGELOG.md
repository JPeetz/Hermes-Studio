# Changelog

All notable changes to Hermes Studio are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.15.1] — 2026-04-13

### Fixed
- **Settings icon crash (React error #130)** — `CheckmarkCircle02Icon` from `@hugeicons/core-free-icons` is an icon data object, not a React component. It was rendered directly as JSX (`<CheckmarkCircle02Icon />`) inside the skill-key-confirmed banner on the Settings page, causing React error #130. Wrapped with `<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />` — the correct pattern for all hugeicons.

---

## [1.15.0] — 2026-04-13

### Added
- **Test Suite** (Task #19) — full CI-grade test coverage with visible status badges
  - **Unit tests (vitest):** `vitest.config.ts` with standalone node environment and `@` alias; 6 tests for `cn()` utility; 9 tests for `crew-store` with temp-dir isolation via `vi.spyOn(process, 'cwd')`; 8 tests for `event-store` covering sequence numbers, `getEventsSince`, `queryAuditEvents` filters — all 23 pass
  - **E2E tests (Playwright):** `playwright.config.ts` with `webServer` auto-start; `tests/e2e/smoke.spec.ts` — 6 smoke tests (homepage, `/api/auth-check`, `/api/ping`, chat/crews/audit pages render without error boundary)
  - **CI (GitHub Actions):** `.github/workflows/ci.yml` — two jobs (`unit-tests` → `e2e-tests`); Playwright report uploaded on failure
  - README: `[![CI](...)]` badge + `🧪 Test Suite` feature bullet

---

## [1.14.0] — 2026-04-13

### Added
- **Clone Crew** (Task #21) — duplicate any crew with one click
  - `POST /api/crews/:crewId/clone` — reads source crew, mints fresh sessions for all members in parallel, creates new crew named `"Copy of <original>"`
  - `CrewCard` gains a `Copy01Icon` clone button (appears on hover); `cloneMutation` added to `CrewsScreen` with success toast
  - Detail header clone button navigates to the new crew on success
  - `cloneCrew()` client helper added to `crews-api.ts`

---

## [1.13.0] — 2026-04-13

### Added
- **Audit Trail** (Task #18) — cross-session timeline of all agent/tool actions at `/audit`
  - `queryAuditEvents()` in `event-store.ts` — cross-session SQLite query with filters: session key, event types, date range, pagination; returns distinct session key list for picker
  - `GET /api/audit/` — defaults to `tool`, `user_message`, `approval` events; supports `sessionKey`, `types`, `since`, `until`, `limit`, `offset`; max 500 results
  - `audit-trail-screen.tsx` — chronological timeline (newest-first), auto-refresh every 15 s, session filter dropdown, event type toggles (Tool/User/Approval), date range presets (1h/6h/24h/7d/All), expandable tool-call cards with syntax-highlighted args+result, 50-event pagination
  - `TimelineIcon` audit nav item added to sidebar and mobile shell

---

## [1.12.0] — 2026-04-12

### Added
- **Agent Library** (Task #12 extended) — create and manage custom agents with system prompts
  - `AgentDefinition` type: `id`, `name`, `emoji`, `color`, `roleLabel`, `systemPrompt`, `model`, `tags`, `isBuiltIn`
  - `agent-definitions-store.ts` — file-backed CRUD persisting to `.runtime/agent-definitions.json`; built-in agents derived at runtime from `AGENT_PERSONAS` (never written to disk)
  - `GET/POST /api/agents` and `GET/PATCH/DELETE /api/agents/:id` — create/edit/delete with 403 protection for built-ins
  - `agent-library-screen.tsx` — search, All/Built-in/Custom filter tabs, agent cards, Create/Edit/Delete/Duplicate actions
  - `agent-editor-dialog.tsx` — emoji picker (24 options), color swatches (16 colors), system prompt textarea, model override, tags
  - Crew builder and template gallery fetch unified agent list; custom agents appear in persona pickers
  - "Agents" nav item added to sidebar

---

## [1.11.0] — 2026-04-12

### Added
- **Complete MCP Server Management** (Task #17) — direct config write to `~/.hermes/config.yaml`
  - `PUT /api/mcp/servers` — converts `McpServerRecord[]` → `mcp_servers` YAML dict and writes to config; auto-triggers reload endpoint after save
  - Settings MCP screen: "Save to Config" button replaces copy-YAML instruction; `isDirty` banner shows save/reload state; YAML section demoted to "Manual fallback"

---

## [1.10.0] — 2026-04-12

### Added
- **Cost & Token Tracking** (Task #16) — usage per crew with estimated API cost
  - `cost-store.ts` — file-backed cumulative totals in `.runtime/costs.json`; built-in price table for Anthropic, OpenAI, and Google models with fuzzy matching; `recordMemberUsage()` upserts and re-derives crew-level sums
  - `GET/POST/DELETE /api/crews/:crewId/usage`; `fetchAndRecordUsage()` chains context-usage fetch → record → cache invalidation after each run
  - `cost-panel.tsx` — **Usage** tab: KPI strip (total tokens, input/output split, estimated cost), per-agent table with model badges, reset button; portable-mode gracefully shows dashes

### Fixed
- `GET /api/context-usage` — `inputTokens` and `outputTokens` were computed but not returned; added to all three return paths

---

## [1.9.0] — 2026-04-12

### Added
- **Crew & Agent Templates Gallery** (Task #15) — pre-built crew configurations to jump-start any crew
  - `template-store.ts` — 7 hardcoded built-in templates + user templates in `.runtime/templates.json`
  - `GET /api/crews/templates`, `POST /api/crews/templates`, `DELETE /api/crews/templates/:id` (403 on built-in delete)
  - `templates-gallery.tsx` — modal with category filter tabs (All / Research / Engineering / Creative / Operations); "Use Template" pre-fills New Crew dialog
  - **Built-in templates:** Research Team, Deep Dive, Full-Stack Squad, Code Review Crew, Content Studio, Ops Team, Sprint Team

---

## [1.8.0] — 2026-04-12

### Added
- **Visual Workflow Builder** (Task #14) — DAG-structured task pipeline editor on every crew's Workflow tab
  - Pure SVG canvas with pan (pointer capture), zoom (0.2×–4×), node drag, connect mode, auto-layout (Kahn's BFS topological layers)
  - Nodes: label, prompt, assignee, status tint; edges: cubic bezier with arrowhead, click-to-delete
  - Execution engine: dispatches layer-by-layer in parallel via existing `dispatchTask()` API; real-time status per node; halts on error
  - `workflow-store.ts` persists to `.runtime/workflows.json`; `PUT /api/crews/:crewId/workflow` runs DFS cycle detection (400 on cycle)
- **Crew Metrics Dashboard** (Task #13) — `StatsStrip` at top of Crews list: Crews / Active / Paused / Complete / Agents / Running chips + `RecentActivityFeed` showing latest member activity across all crews; zero new API calls
- **Knowledge Graph Split-Pane** (Task #12 improvement) — graph promoted from hidden dialog to a Pages/Graph toggle in the browser header; graph fills the right pane instead of a fixed-height dialog; clicking a node switches back to Pages view

---

## [1.7.0] — 2026-04-12

### Added
- **Hermes v0.8.0 Compatibility** — audited and closed 4 compatibility gaps after gateway update
  - Config schema migration (v13→v16): `stt.model` → provider-specific, `display.interim_assistant_messages`, `display.tool_progress_overrides` → `display.platforms`
  - "Status messages" toggle in Display settings (`display.interim_assistant_messages`)
  - Per-platform `tool_progress` override editor (all/new only/verbose/off per platform)
  - Agent behavior: session reset mode selector + conditional "Reset hour" and "Idle timeout" inputs
- **Live Job Run Streaming** — "Run now" in the Jobs UI now opens a live SSE event log
  - `POST /api/hermes-runs` → proxies to `/v1/runs`; `GET /api/hermes-runs/:runId/events` → SSE passthrough
  - `JobCard` subscribes to `EventSource`, accumulates events with human-readable labels, auto-expands on trigger; falls back to fire-and-forget if the runs endpoint is unavailable

---

## [1.6.0] — 2026-04-12

### Added
- **Force-Directed Knowledge Graph** — replaced static circular layout with a physics-based interactive canvas
  - D3-force simulation: link force (distance 120), charge repulsion (−300), center gravity; nodes draggable with fixed position on release
  - Node radius scales with link count (5–16 px); edge labels rendered at midpoint; click-to-select highlights connected subgraph; zoom & pan via `transform`
- **Per-Agent Profile-Scoped File Views** — each agent workspace shows only files within its profile directory; file browser `rootPath` derived from active profile, preventing cross-agent file leakage

---

## [1.5.0] — 2026-04-10

### Added
- **Session Persistence** (Task 8) — chat history survives server restarts in portable mode
  - `local-session-store.ts` now fully wired: all four `/api/sessions` verbs (GET/POST/PATCH/DELETE) and `/api/history` route use the local store when the Hermes gateway is unavailable
  - `send-stream.ts` saves user and assistant messages to the local store on every exchange in portable mode
  - Optional **Redis backend** activated by setting `REDIS_URL` env var — falls back to file store gracefully if Redis is unreachable
  - Redis key schema: `hermes:studio:sessions` (hash) and `hermes:studio:messages:{id}` (list), both with 30-day TTL
  - In-memory store with 2-second debounced file writes to `.runtime/local-sessions.json`
  - 500-message cap per session enforced on both file and Redis backends
  - `ioredis` added as optional dependency; lazy-loaded only when `REDIS_URL` is set
  - `.env.example` updated with `REDIS_URL` documentation

---

## [1.4.0] — 2026-04-10

### Added
- **Permissions & Toolsets Settings** (Task 7) — new "Permissions & Toolsets" section in Settings
  - **Approvals** — configure `approvals.mode` (manual/auto/off) and `approvals.timeout` from the UI; no config.yaml editing required
  - **Toolsets** — view active toolsets as removable tags; add custom toolsets with an inline input + Enter/Add button; changes saved to `~/.hermes/config.yaml`
  - **Security** — toggle `security.redact_secrets`, `security.tirith_enabled` (Tirith policy engine), and `security.website_blocklist.enabled`
  - **Code Execution** — configure `code_execution.timeout` and `code_execution.max_tool_calls` numeric limits
  - **Agent Reasoning** — set `agent.reasoning_effort` (low/medium/high) and toggle `agent.verbose` mode
  - All fields use the existing `PATCH /api/hermes-config` endpoint; changes persist to `~/.hermes/config.yaml` immediately
  - `LockIcon` added to the settings icon imports

---

## [1.3.0] — 2026-04-10

### Added
- **Cron Job Manager UI** (Task 6) — full scheduled task management from the browser
  - `GET /api/hermes-jobs` and `GET /api/hermes-jobs/$jobId` proxy routes forward to Hermes gateway `/api/jobs`
  - `POST /api/hermes-jobs` creates new jobs; `PATCH` updates; `DELETE` deletes
  - `POST /api/hermes-jobs/$jobId?action=pause|resume|run` for lifecycle control
  - `GET /api/hermes-jobs/$jobId?action=output` fetches run history
  - `JobsScreen` — job list with search, status indicators (active/paused/completed), next run time, last run result
  - `CreateJobDialog` — schedule presets (every 15m/30m/1h/6h/daily/weekly) or custom cron; prompt; skills; delivery channels (local/telegram/discord); repeat count
  - `EditJobDialog` — pre-populated form for updating existing jobs; smart schedule display fallback
  - Expand any job card inline to view recent run outputs with timestamps and content preview
  - Pause/resume/trigger-now/delete/edit actions per job card
  - Auto-refresh every 30 seconds via React Query
  - Feature-gated: shows `BackendUnavailableState` when gateway doesn't expose `/api/jobs`
  - `HermesJob` and `JobOutput` types in `src/lib/jobs-api.ts`

---

## [1.2.0] — 2026-04-09

### Added
- **Skill Installation UI** (Task 5) — fully functional install/uninstall/toggle from the browser
  - `POST /api/skills` now implements the `toggle` action via a local prefs file (`~/.hermes/skills/.studio-prefs.json`); `enabled` state survives server restarts without gateway support
  - `GET /api/skills` merges local prefs to reflect accurate `enabled` state per skill
  - `POST /api/skills/install` now tries the Hermes gateway native endpoint first, then falls back to `clawhub` CLI, then returns a clear install hint (`pip install skillhub`) when clawhub is missing — the install command is auto-copied to clipboard
  - Install/uninstall buttons show ⏳ loading spinner while action is in progress
  - "Installing... may take up to 2 minutes" progress hint shown during install
  - clawhub-missing banner with `pip install skillhub` instructions shown inline (dismissible)
  - Success toasts on install and uninstall completion

### Fixed
- **Security: path traversal in `POST /api/skills/uninstall`** — `skillId` is now validated to ensure the resolved path stays within `~/.hermes/skills/`
- Branding: "Hermes Workspace Marketplace" → "Hermes Studio Marketplace" in skills browser header
- Branding: "Hermes Workspace" → "Hermes Studio" in security badge

---

## [1.1.0] — 2026-04-09

### Added
- **Execution Approvals UI** — full approve/deny/always-allow flow for dangerous-command requests
  - `approvals-store.ts` rewritten: real in-memory Map with sessionStorage persistence, dedup, `addApproval`, `respondToApproval`, `getPendingApprovals`, `clearResolvedApprovals`
  - `send-stream.ts` now forwards `approval.required`, `tool.approval`, `exec.approval` gateway SSE events to the client as an `approval` event
  - New API routes: `POST /api/approvals/:approvalId/approve` and `/deny` — dual strategy (native gateway endpoint → chat command fallback)
  - `use-streaming-message.ts` handles `case 'approval'` in the SSE event switch, dispatches to `onApprovalRequest` callback
  - `chat-screen.tsx` wires `onApprovalRequest` through both `useRealtimeChatHistory` and `useStreamingMessage`
  - "Always Allow" button added alongside Approve/Deny in the approval banner UI
  - Approve sends `scope` body param (`once` | `session` | `always`) to the approve endpoint

---

## [1.0.0] — 2026-04-10

### Added
- Initial release of Hermes Studio, forked from hermes-workspace v1.0.0
- React 19 + TypeScript + Tailwind CSS 4 + TanStack Router
- Real-time SSE streaming chat with tool call rendering
- Multi-session management with persistent history (enhanced mode)
- Memory browser — browse, search, edit agent memory files
- Skills explorer — 2,000+ skills with search/filtering
- File browser with Monaco editor integration
- Full PTY terminal with persistent sessions
- 8-theme system (Official, Classic, Slate, Mono — light/dark variants)
- Mobile-first PWA with full feature parity
- Multi-profile management
- Knowledge browser with wikilinks and full-text search
- MCP server config inspection and reload
- Docker Compose + Tailscale remote access support
- Renamed from hermes-workspace → Hermes Studio throughout
- Updated LICENSE with dual attribution (JPeetz + original outsourc-e)

---
