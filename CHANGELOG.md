# Changelog

All notable changes to Hermes Studio are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.18.0] — 2026-04-17

### Added — Studio feature sprint (Tasks #13–#20)

- **Command Palette (Ctrl+K)** — global `Ctrl+K` / `Cmd+K` shortcut wired to the existing command palette; dispatches `hermes:toggle-sidebar` custom event; keyboard shortcut registered in `use-global-shortcuts`
- **System Health Panel** — `<SystemMetricsFooter />` fixed footer polls `GET /api/system-health` every 10 s; shows CPU %, memory, disk usage, and uptime with green/amber/red color thresholds; toggle via Settings → Display → "Show System Metrics Footer"
- **Token Usage Time-Series Chart** — 14-day rolling `AreaChart` (recharts) in the token usage modal breaks down daily input vs output tokens across all sessions; pre-fills missing days to zero
- **Event Store Analytics screen** — `/analytics` route backed by `GET /api/state-analytics`; aggregate event stats (total events, sessions, tool calls), 14-day stacked bar chart, top-15 tool frequency horizontal bars; all SQL aggregation done in SQLite via `json_extract` + `GROUP BY` — no raw payloads loaded into JS memory
- **Identity File Editor** — Settings → Identity section; tabbed editor for `SOUL.md`, `persona.md`, and `CLAUDE.md` under `~/.hermes/`; reads via `GET /api/files?action=read`, writes via `POST /api/files`; save/discard buttons with status feedback
- **Patterns & Corrections Viewer** — `/patterns` screen reads `memories/MEMORY.md` via `/api/memory/read`; parses `§`-delimited entries; Tab 1: searchable pattern cards; Tab 2: searchable correction cards with an add-new form and per-entry delete (rewrites full MEMORY.md)
- **Session History Archive** — `/session-history` two-pane layout; left pane: sortable session list (date, model, messages, tokens, cost) with aggregate stats bar; right pane: lazy-loaded message thread fetched from `GET /api/history?sessionKey=<key>`
- **Systemd Auto-start** — `scripts/hermes-studio.service` unit template + `scripts/install-systemd.sh` CLI script; `GET /api/systemd-status` reads live `systemctl --user` state; `POST /api/systemd-control` handles install/uninstall/start/stop/enable/disable; Settings → Auto-start UI with status indicators, action buttons, and `systemctl status` output display; graceful degradation on non-Linux

---

## [1.17.1] — 2026-04-17

### Fixed
- **WeChat Corp ID secret scanner alert** — placeholder `wx1234567890abcdef` in the WeCom settings entry matched GitHub's Tencent WeChat API App ID pattern; replaced with generic `your-corp-id`
- **CI rewritten for pnpm** — project uses pnpm (not npm); `npm install` was failing on `workspace:` protocol in transitive deps; CI now uses `pnpm/action-setup@v4`, `pnpm install --frozen-lockfile`, and `pnpm exec playwright`; `pnpm-lock.yaml` committed and lockfile caching enabled
- **`@playwright/test` missing from package.json** — test files imported from `@playwright/test` but it was not declared; added to devDependencies; TypeScript errors in `playwright.config.ts` and `tests/e2e/smoke.spec.ts` now resolved
- **`APPROVAL_RECEIPT_TTL_MS` undefined** — constant was declared as `APPROVAL_APPROVAL_RECEIPT_TTL_MS` (double-prefix typo) in `chat-screen.tsx` but referenced correctly; renamed
- **`toast.success` / `toast.error` in agent-library-screen** — `toast` is a plain function, not an object with `.success`/`.error` methods; converted to `toast(msg, { type: 'success' | 'error' })`
- **`hubQuery.data?.source` on `never`** — TanStack Query narrows `data` to `undefined` when `isPending`; accessing `.source` caused a TS error; cast to `HubSearchResponse | undefined`
- **`profileName` missing from crew-store test fixture** — field added to `CrewMember` after the test was written; added `profileName: null` to fixture
- **`forcedSession` possibly null** — `forcedSession?.friendlyId === x` does not narrow the type in the truthy branch; changed to explicit `forcedSession !== null && forcedSession.friendlyId === x`

---

## [1.17.0] — 2026-04-17

### Added — Hermes Agent v0.8.0 + v0.9.0 compatibility

Full UI surface for all features introduced in NousResearch/hermes-agent v0.8.0 and v0.9.0.

**Hermes v0.9.0 (2026-04)**
- **Fast Mode toggle** — lightning bolt button in the chat composer toolbar activates `/fast` priority queue (OpenAI/Anthropic); visual active state, tooltip, aria-pressed; wired to the existing `effectiveFastMode` send logic
- **`/fast`, `/compress`, `/debug` slash commands** — added to the slash-command autocomplete menu with descriptions
- **API Server Key setting** — new password field in Settings → Connection for `API_SERVER_KEY` required by non-loopback Hermes instances; stored in Zustand settings and passed through auth layer
- **Backup / Import** — Settings → Connection now has "Backup" (POST `/api/backup`) and "Import" (POST `/api/backup/import`) buttons; import uses a hidden file input; both surface errors via toast
- **BlueBubbles, WeChat, WeCom integrations** — three new entries in Settings → Integrations platform list (BlueBubbles iMessage via BlueBubbles server URL + password, WeChat via iLink Bot token, WeCom via Corp ID + agent secret)
- **Provider usage route** — new `GET /api/provider-usage` Studio route fetches Hermes `/api/usage` (which now captures rate-limit headers: requests remaining/limit/reset, tokens remaining/limit/reset) and maps it into the usage meter's `ProviderUsageEntry` format including `resetsAt` progress bars

**Hermes v0.8.0 (2026-03)**
- **Logs viewer** — new `/logs` screen with `ConsoleIcon` nav entry; fetches `GET /api/hermes-proxy/api/logs?level=INFO|WARNING&tail=500`; All/Errors filter tabs; search with clear button; color-coded lines (ERROR=red, WARNING=amber, DEBUG=muted, INFO=text); auto-scrolls to bottom on load; `EmptyState` for no data and error states
- **Cron delivery failure badge** — job cards now show a red badge (`X delivery failures`) when `delivery_failures > 0` (v0.8.0 tracks failed Telegram/Discord/Slack/Signal delivery attempts)
- **Pre-run script field** — collapsible "Pre-run script" section in Create Job dialog; monospace textarea, hidden when empty, `pre_run_script` included in job creation payload

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
