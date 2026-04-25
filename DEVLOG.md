# Hermes Studio — Developer Log

Running log of development sessions. Most recent at top.

---

## 2026-04-24 — Session 22

### What was done

**Conductor, Operations & Tasks — v1.19.0 (20 implementation tasks)**

Ported the Conductor, Operations, and Tasks features from upstream hermes-workspace using an "adapted port" approach: upstream data models and API contracts preserved, but stores rewritten with file-backed persistence (matching existing crew-store.ts pattern), UI rebuilt with the Hermes Studio design system (`var(--theme-*)` CSS variables, DS components, HugeIcons).

**Types & Templates (Tasks 1–2)**
- `src/types/task.ts` — HermesTask, TaskColumn, TaskPriority, TaskSourceType, column constants
- `src/types/conductor.ts` — Mission, MissionWorker, MissionEvent, ConductorPhase, MissionStatus, WorkerStatus
- `src/types/operation.ts` — OperationAgent, OperationAgentStatus
- `src/types/template.ts` — Extended with `templateType: 'crew' | 'conductor'`, `ConductorTemplateConfig`, 4 built-in conductor templates added to template-store

**Server Stores (Tasks 3–5)**
- `src/server/task-store.ts` — File-backed to `.runtime/tasks.json`; CRUD + move + filter; publishChatEvent on mutations
- `src/server/mission-store.ts` — File-backed to `.runtime/missions.json` + `.runtime/mission-events.json`; full lifecycle with workers and events; publishChatEvent on mutations
- `src/server/operations-aggregator.ts` — Read-only aggregator querying crew-store and mission-store

**API Routes (Tasks 6–8)**
- 8 new route files: tasks CRUD + move, missions CRUD + abort + events, operations overview
- Client API helpers: `tasks-api.ts`, `missions-api.ts`, `operations-api.ts`

**UI Screens (Tasks 9–16)**
- Tasks screen: 4 files — Kanban board with 5 columns, HTML5 drag-and-drop, task dialog, priority badges
- Conductor screen: 9 files — Phase state machine (home→preview→active→complete), worker cards, event log, cost tracker
- Operations screen: 5 files — Agent grid/outputs toggle, status filter, crew detail Operations tab

**Integration & Polish (Tasks 17–20)**
- Sidebar: Conductor, Operations, Tasks nav items added
- Cross-links: conductor missions auto-create tasks on Kanban board
- Audit trail: all store mutations emit events via publishChatEvent
- Workspace shell: mobile page titles for new routes
- Templates gallery: conductor category icon/label added

**Bug fixes during implementation:**
- `conductor-screen.tsx:100` — `CrewTemplate | null` passed where `CrewTemplate` expected; fixed MissionPreview props
- `task-card.tsx:34` — `style` prop on DS `Card` (doesn't accept it); moved to wrapping `<div>`
- `templates-gallery.tsx:30` — Missing conductor entry in category map; added
- Test failures from `publishChatEvent` requiring SQLite; added `vi.mock` for chat-event-bus in test files

**Test results:** 199 tests across 17 files, all passing. Zero regressions.

**Key technical decisions:**
- Unified template system (crew + conductor share one `CrewTemplate` type with `templateType` discriminator) instead of parallel template stores
- Operations aggregator is read-only (no separate store), combining crew-store + mission-store queries
- Cross-linking via `sourceType`/`sourceId` fields on tasks — conductor missions auto-create tasks, UI links back to conductor
- File-backed stores with in-memory cache + deferred disk writes (same pattern as crew-store.ts)
- All new screens use 3-second react-query polling for live updates

---

## 2026-04-17 — Session 21

### What was done

**Feature sprint completion — v1.18.0 (Tasks #13–#20)**

All 8 roadmap tasks from the backlog built in this session and the previous one. Zero TypeScript errors, 59/59 tests passing throughout.

**Task #13 — Command Palette (Ctrl+K)**
- `use-global-shortcuts` hook dispatches `hermes:toggle-sidebar` custom event on `Ctrl+K` / `Cmd+K`; no changes needed to the existing `CommandPalette` component

**Task #14 — System Health Panel**
- `<SystemMetricsFooter />` polls `GET /api/system-health` every 10 s
- Fixed bottom bar: CPU%, memory, disk, uptime; green <60%, amber 60–80%, red >80%
- Conditional render in `WorkspaceShell` behind `settings.showSystemMetricsFooter`

**Task #15 — Token Usage Time-Series Chart**
- 14-day `AreaChart` (recharts) added to `usage-details-modal.tsx`
- `buildDayBuckets()` pre-fills 14 days, groups sessions by timestamp
- recharts `Cell` not available in bundler mode — workaround: single `fill` prop on `Bar`

**Task #16 — Event Store Analytics**
- `getAnalytics()` added to `event-store.ts` using SQL (`json_extract`, `GROUP BY`, `strftime`) — never loads raw payloads into JS
- `GET /api/state-analytics` route + `AnalyticsScreen` at `/analytics`
- 4 stat cards, 14-day stacked bar chart, horizontal top-15 tool chart

**Task #17 — Identity File Editor**
- New `'identity'` section in Settings with tabbed editor for `SOUL.md`, `persona.md`, `CLAUDE.md`
- Reads via `GET /api/files?action=read`, writes via `POST /api/files`

**Task #18 — Patterns & Corrections Viewer**
- `PatternsCorrectionScreen` at `/patterns`
- Parser splits `MEMORY.md` on `§` delimiter; classifies by `CORRECTION:` prefix
- Two tabs: patterns (read-only cards) and corrections (cards + add form + delete)

**Task #19 — Session History Archive**
- `SessionHistoryScreen` at `/session-history`
- Two-pane: sortable session list (date/model/msgs/tokens/cost) + lazy message thread
- Aggregate stats bar; message bubbles for user/assistant

**Task #20 — Systemd Auto-start**
- `scripts/hermes-studio.service` unit template with `HERMES_INSTALL_DIR` placeholder
- `scripts/install-systemd.sh` CLI: install/uninstall/start/stop/enable/disable/status
- `GET /api/systemd-status` + `POST /api/systemd-control` API routes
- Settings → Auto-start UI: status indicators, action buttons, `systemctl status` output panel
- Graceful degradation on non-Linux platforms

**Docs + release**
- CHANGELOG.md: `[Unreleased]` promoted to `[1.18.0]` with full entry
- README.md: version badge bumped to 1.18.0; 8 new feature bullets; roadmap table updated (all 8 tasks → ✅ Shipped v1.18.0)
- `package.json` version bumped to `1.18.0`

**Key technical notes:**
- `routeTree.gen.ts` is `@ts-nocheck`; only `FileRoutesByPath` inside `declare module '@tanstack/react-router'` matters for compile-time checking — must add entries there for every new route
- recharts `Cell` not importable under `moduleResolution: bundler` despite being in type definitions
- `BrainIcon` was already imported in `chat-sidebar.tsx` (agent personas) — reused, not duplicated
- MEMORY.md uses `§` as entry separator (not `##` headings)

---

## 2026-04-17 — Session 20

### What was done

**Roadmap audit + task backlog creation**

Cross-referenced the README roadmap table against the actual codebase to determine true status of every listed item. Found 5 features marked as 🔜 Planned that were already shipped, and 2 marked as in-progress/coming soon that had no code. Corrected all statuses in the README.

**Actual status of roadmap items:**
- Audit Trail → ✅ v1.13.0 (was 🔜 Planned)
- Test Suite + CI Badges → ✅ v1.15.0 (was 🔜 Planned)
- Clone Crew → ✅ v1.14.0 (was 🔜 Planned)
- Setup Wizard → ✅ v1.16.0 (was 🔜 Planned)
- Command Palette → ⚠️ Partial — component exists, Ctrl+K binding missing
- System Health Panel → ⚠️ Partial — setting + layout reserved, no component
- Native Desktop App → ❌ No code (was 🔨 In Development — corrected to Planned)
- Cloud / Hosted → ❌ No code (was Coming Soon — corrected to Planned)

**Task backlog created (Tasks #13–#20):**
- #13 Wire Ctrl+K keybinding to Command Palette
- #14 Build System Health Panel footer component
- #15 Add Token Usage Time-Series Chart
- #16 Build State.db Analytics screen
- #17 Build Identity File Editor
- #18 Build Patterns & Corrections Viewer
- #19 Build Session History Archive
- #20 Add Systemd Auto-start support

---

## 2026-04-17 — Session 19

### What was done

**Bugfix sweep + CI infrastructure repair (v1.17.1)**

Resolved a GitHub secret scanner alert, cleared all TypeScript errors, and fixed a broken CI pipeline.

**Secret scanner:**
- `wx1234567890abcdef` in the WeCom settings placeholder matched Tencent WeChat App ID pattern → replaced with `your-corp-id`

**TypeScript errors (5 fixes, now 0 errors project-wide):**
- `chat-screen.tsx` — `APPROVAL_APPROVAL_RECEIPT_TTL_MS` double-prefix typo → `APPROVAL_RECEIPT_TTL_MS`
- `agent-library-screen.tsx` — `toast.success()`/`toast.error()` don't exist; `toast` is a plain function → `toast(msg, { type })`
- `skills-screen.tsx` — TanStack Query narrows `data` to `undefined` when `isPending`, making `.source` fail → cast to `HubSearchResponse | undefined`
- `crew-store.test.ts` — `profileName` was added to `CrewMember` after the test fixture was written → added `profileName: null`
- `chat/$sessionKey.tsx` — `forcedSession?.friendlyId === x` doesn't narrow type in the truthy branch → `forcedSession !== null && forcedSession.friendlyId === x`

**CI rewrite:**
- Project uses pnpm; CI was using `npm install` which fails with `workspace:` protocol errors in pnpm-installed deps
- Rewrote `.github/workflows/ci.yml` to use `pnpm/action-setup@v4`, `pnpm install --frozen-lockfile`, pnpm-cached Node setup, `pnpm exec playwright`
- Added `@playwright/test` to devDependencies (was missing; both `playwright.config.ts` and `tests/e2e/smoke.spec.ts` import from it)
- Committed `pnpm-lock.yaml` (was not tracked; CI now uses `--frozen-lockfile` for reproducibility)

**Cleanup:**
- Removed `feature/ds-consistency` worktree and local + remote branch
- Updated stale project memory file (5-day-old snapshot showed features as not-started that were long done)

**Result:** 59/59 unit tests passing, 0 TS errors, CI pipeline correctly wired end-to-end.

### Version bump: 1.17.0 → 1.17.1

---

## 2026-04-17 — Session 18

### What was done

**Hermes agent v0.8.0 + v0.9.0 compatibility audit — 12 tasks, all shipped**

Researched both release notes, planned 12 UI-surfaceable tasks, implemented and committed.

**Hermes v0.9.0 (UI changes):**
- **Fast Mode button** — `FlashIcon` toolbar button in `chat-composer.tsx`; wired to existing `fastMode` state + `effectiveFastMode` send logic (the state and `/fast` slash handler already existed; only the visible button was missing)
- **`/fast`, `/compress`, `/debug`** added to slash-command autocomplete in `slash-command-menu.tsx`
- **API_SERVER_KEY** — new password field in Settings → Connection (`use-settings.ts` + `settings-dialog.tsx`); for non-loopback Hermes instances
- **Backup / Import** — `triggerBackup()` (POST `/api/hermes-proxy/api/backup`) + `handleImport()` (POST `…/api/backup/import`) buttons added to Settings connection section; hidden `<input type="file">` for import
- **BlueBubbles, WeChat, WeCom** — three entries added to `CHAT_PLATFORMS` array in `routes/settings/index.tsx`; reuses existing generic `PlatformsSection` renderer, zero new components
- **`GET /api/provider-usage`** — new Studio route (`routes/api/provider-usage.ts`) fetches Hermes `/api/usage` (v0.9.0 rate-limit capture), maps to `ProviderUsageEntry[]` with `requests/tokens remaining + resetsAt` progress bars; previously the fetch 404'd silently

**Hermes v0.8.0 (UI changes):**
- **Logs viewer** — `src/screens/logs/logs-screen.tsx` (new); `src/routes/logs.tsx` (new); `ConsoleIcon` nav entry in `chat-sidebar.tsx` + `workspace-shell.tsx` title; fetches `/api/hermes-proxy/api/logs?level=&tail=500`; All/Errors tabs, search, color-coded lines, auto-scroll
- **Delivery failure badge** — red `X delivery failures` pill on job cards when `delivery_failures > 0`; `HermesJob` type extended in `jobs-api.ts`
- **Pre-run script** — collapsible textarea in Create Job dialog (`create-job-dialog.tsx`); `pre_run_script` wired through `createJob()` payload

**Key design decisions:**
- hermes-proxy catch-all (`/api/hermes-proxy/$`) forwarded backup and logs calls — no new Studio API routes needed for those
- Platform integrations reused the existing `CHAT_PLATFORMS` + `PlatformsSection` pattern — adding 3 platforms was 30 lines, no new components
- SSE breaking change assessment: `use-streaming-message.ts` already correctly handled named `event:` SSE; `jobs-screen.tsx` EventSource uses a different stream — no fix needed

### Version bump: 1.16.0 → 1.17.0

---

## 2026-04-16 — Session 17

### What was done

**Design System Consistency (Tasks #DS-1 through #DS-6 + screen migration)**

Built a canonical 6-component design system library in `src/components/ds/` and migrated all screens to use it.

**New components (`src/components/ds/`):**
- `Card` — base surface primitive (3 variants: default, panel, subtle)
- `SettingsRow` — label + description + control slot; optional danger border
- `SectionHeader` — section title with optional subtitle, action, and divider
- `StatusBadge` — hugeicon + label in semantic theme color; replaces all emoji status indicators
- `ListItem` — icon + label + description + meta row with consistent hover state
- `EmptyState` — centred icon + title + description + action; used by every empty screen

**CSS fixes:**
- Added `--theme-hover` to all 9 theme blocks in `styles.css`
- Replaced 300+ broken Tailwind palette classes (`bg-primary-*`, `border-primary-*`, `text-black`, `bg-white`) with `var(--theme-*)` CSS variables across all screens
- Screens migrated: settings/index.tsx, providers-screen.tsx, provider-wizard.tsx, chat-composer.tsx, chat-header.tsx, memory-browser-screen.tsx, knowledge-browser-screen.tsx, profiles-screen.tsx, skills-screen.tsx, workspace-skills-screen.tsx, jobs-screen.tsx, audit-trail-screen.tsx, crews-screen.tsx, files-screen.tsx

**Tests:** 37 new unit tests for DS components (vitest + @testing-library/react + jsdom); 59 total passing.

**The Rule (for future dev):** Never use Tailwind color classes on screen-level components. Always use `var(--theme-*)`. See `docs/superpowers/specs/2026-04-16-design-system-consistency.md`.

### Version bump: 1.15.1 → 1.16.0

---

## 2026-04-13 — Session 16

### What was done

**Task #19 — Test Suite with visible badges (vitest unit tests + Playwright e2e + CI badges)**

**Unit tests (vitest):**

- `vitest.config.ts` — standalone vitest config (separate from `vite.config.ts` to avoid TanStack Start plugin conflicts); `node` environment; `@` alias pointing to `src/`; includes `src/test/**/*.test.ts`
- `src/test/utils.test.ts` — 6 tests for `cn()` (empty args, joins, falsy filtering, Tailwind conflict resolution, clsx object/array syntax)
- `src/test/crew-store.test.ts` — 9 tests for `crew-store`; uses `vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)` + `vi.resetModules()` + dynamic import pattern to isolate module-level `DATA_DIR` per test; covers list, create, update, delete, getCrew, trim, ordering, member assignment
- `src/test/event-store.test.ts` — 8 tests for `event-store`; same temp-dir isolation pattern; covers appendEvent sequence numbers, getEventsSince, queryAuditEvents (all, by sessionKey, by eventTypes, session list)
- All 23 tests pass locally

**E2E tests (Playwright):**

- `playwright.config.ts` — `webServer` starts `node server-entry.js` on port 3000; reuses existing server outside CI; chromium only; retries on CI
- `tests/e2e/smoke.spec.ts` — 6 smoke tests: homepage loads, `/api/auth-check` returns JSON, `/api/ping` responds (200 or 503 — gateway may be offline in CI), chat/crews/audit pages render without React error boundary

**CI (GitHub Actions):**

- `.github/workflows/ci.yml` — rewrote from pnpm to npm; two jobs: `unit-tests` (runs `npm test`) and `e2e-tests` (builds, installs Playwright browsers, runs `npx playwright test`); e2e job requires unit-tests to pass first; uploads `playwright-report/` artifact on failure
- `package.json` — added `"test:e2e": "playwright test"` script

**Badge & version:**

- README — added `[![CI](…badge.svg)](…ci.yml)` badge; `🧪 Test Suite` feature bullet; version bump in badge
- Version: 1.14.0 → 1.15.0

---

## 2026-04-13 — Session 15

### What was done

**Task #21 — Clone Crew (duplicate an existing crew with one click)**

Inspired by xaspx/hermes-control-interface + karmsheel/mission-control-hermes.

**Server-side:**

- `src/routes/api/crews/$crewId.clone.ts` — new `POST /api/crews/:crewId/clone` handler; reads source crew from store, mints fresh sessions for all members in parallel (same mintSession logic as the create endpoint — supports both enhanced-hermes and portable/local modes), creates a new crew with name `"Copy of <original>"` and the same goal and member roster; returns 404 if source not found

**Client-side:**

- `src/lib/crews-api.ts` — added `cloneCrew(crewId)` client helper (POST with `Content-Type: application/json` for CSRF compliance)
- `src/screens/crews/crews-screen.tsx` — `CrewCard` gains a `Copy01Icon` clone button that appears on hover alongside the existing delete button; both buttons are now in a flex group; `cloneMutation` added to `CrewsScreen`; toast shows `"Cloned as 'Copy of …'"` on success
- `src/screens/crews/crew-detail-screen.tsx` — clone button (`Copy01Icon`) added between Dispatch Task and Delete in the detail header; `cloneMutation` navigates to the newly created crew's detail page on success
- `src/routeTree.gen.ts` — registered `ApiCrewsCrewIdCloneRoute` as a child of `ApiCrewsCrewIdRoute` across all required locations (import, route definition, ApiCrewsCrewIdRouteChildren interface + object, FileRoutesByFullPath/To/ById interfaces, FileRouteTypes unions, FileRoutesByPath declare module)

**Version:** 1.13.0 → 1.14.0

---

## 2026-04-13 — Session 14

### What was done

**Task #18 — Audit Trail (timeline of all agent/tool actions)**

New cross-session audit timeline accessible at `/audit` via the sidebar.

**Server-side additions:**

- `src/server/event-store.ts` — added `queryAuditEvents()`: flexible cross-session query over the SQLite events database; supports filtering by session key, event types, date range, and pagination; also returns the full list of distinct session keys for the session picker
- `src/routes/api/audit/index.ts` — new `GET /api/audit/` endpoint; defaults to querying `tool`, `user_message`, and `approval` events; supports `sessionKey`, `types`, `since`, `until`, `limit`, `offset` query params; max 500 results per request

**Client-side additions:**

- `src/screens/audit/audit-trail-screen.tsx` — full audit trail UI:
  - Chronological (newest-first) timeline of events, auto-refreshes every 15 seconds
  - Session filter dropdown populated from all known sessions
  - Event type toggles: Tool Call, User Message, Approval
  - Date range presets: Last hour, Last 6h, Last 24h, Last 7d, All time
  - Tool event cards show phase badge (start/calling/complete/error) with colour coding; click to expand inline and inspect full args + result (syntax highlighted in monospace, truncated at 2000 chars)
  - User message cards show the message text preview
  - Approval cards show tool name and status with amber accent
  - 50-event pages with Previous/Next pagination and count display
- `src/routes/audit.tsx` — TanStack Start route file for `/audit`
- `src/routeTree.gen.ts` — manually registered `AuditRoute` and `ApiAuditIndexRoute` across all required interface locations (FileRoutesByFullPath, FileRoutesByTo, FileRoutesById, FileRouteTypes full/to/id unions, RootRouteChildren, rootRouteChildren object, FileRoutesByPath declare module)
- `src/screens/chat/components/chat-sidebar.tsx` — added `TimelineIcon` import and Audit Trail nav item after Agents
- `src/components/workspace-shell.tsx` — added `/audit` → `'Audit Trail'` mobile page title

**Version:** 1.12.0 → 1.13.0

---

## 2026-04-13 — Session 13

### What was done

**Competitive research + roadmap expansion**

Researched all known public Hermes Agent web UI repositories to identify unique selling points and improvement opportunities. Repos reviewed:

- [nesquena/hermes-webui](https://github.com/nesquena/hermes-webui) — Vanilla JS, no build step, mobile-first, zero framework
- [Euraika-Labs/hermesagentwebui](https://github.com/Euraika-Labs/hermesagentwebui) — Full CI: lint + unit (vitest) + Playwright e2e, RC quality release, audit trails
- [Euraika-Labs/pan-ui](https://github.com/Euraika-Labs/pan-ui) — Setup wizard, systemd user service installer, extension system
- [joeynyc/hermes-hudui](https://github.com/joeynyc/hermes-hudui) — 13-tab consciousness monitor, WebSocket live updates, command palette, Patterns & Corrections tabs
- [xaspx/hermes-control-interface](https://github.com/xaspx/hermes-control-interface) — System metrics (CPU/RAM/disk), agent clone/create, maintenance tools panel, 7-day token chart
- [sanchomuzax/hermes-webui](https://github.com/sanchomuzax/hermes-webui) — Reads state.db directly for richer analytics; message-level conversation history inspector
- [Daniel-Parke/hermes-mission-control](https://github.com/Daniel-Parke/hermes-mission-control) — Agent personality file editor (USER.md, MEMORY.md, AGENT.md)
- [karmsheel/mission-control-hermes](https://github.com/karmsheel/mission-control-hermes) — Hackathon: task tracking, content pipelines, agent clone

**Added 11 new planned tasks (#19–#29) to the backlog with attribution notes:**

| Task | Attribution |
|------|-------------|
| #19 Test suite + CI badges | Inspired by Euraika-Labs/hermesagentwebui |
| #20 System health panel | Inspired by xaspx/hermes-control-interface |
| #21 Clone crew | Inspired by xaspx/hermes-control-interface + karmsheel/mission-control-hermes |
| #22 Setup wizard | Inspired by Euraika-Labs/pan-ui |
| #23 Systemd auto-start | Inspired by Euraika-Labs/pan-ui |
| #24 State.db analytics | Inspired by sanchomuzax/hermes-webui |
| #25 Command palette (Ctrl+K) | Inspired by joeynyc/hermes-hudui |
| #26 Identity file editor | Inspired by Daniel-Parke/hermes-mission-control |
| #27 Patterns & corrections viewer | Directly inspired by joeynyc/hermes-hudui |
| #28 Token usage time-series chart | Inspired by xaspx/hermes-control-interface; extended with 7d/30d/90d/1y/custom ranges |
| #29 Session history archive | Inspired by sanchomuzax/hermes-webui |

**Updated README roadmap** — corrected shipped versions (v1.7.0–v1.12.0) and added all 11 planned items.

---

## 2026-04-12 — Session 12

### What was done

**Custom Agent Creation & Template Modification**

Users can now create their own agents with custom system prompts, identities, and model overrides — and have them automatically appear in the crew builder and template gallery.

**New files:**
- `src/types/agent.ts` — `AgentDefinition` interface: `id`, `name`, `emoji`, `color`, `roleLabel`, `systemPrompt`, `model`, `tags`, `isBuiltIn`, `createdAt`, `updatedAt`; plus `CreateAgentInput` and `UpdateAgentInput` types
- `src/server/agent-definitions-store.ts` — file-backed CRUD store persisting to `.runtime/agent-definitions.json`; `getBuiltInAgents()` derives built-in entries from `AGENT_PERSONAS` with pre-written default system prompts; `listAgents()`, `getAgent()`, `createAgent()`, `updateAgent()`, `deleteAgent()`
- `src/routes/api/agents/index.ts` — `GET /api/agents` (list), `POST /api/agents` (create); validates name ≤ 40 chars, color against whitelist
- `src/routes/api/agents/$agentId.ts` — `GET`, `PATCH`, `DELETE`; returns 403 on attempts to mutate built-in agents
- `src/lib/agents-api.ts` — client helpers: `fetchAgents()`, `fetchAgent()`, `createAgent()`, `updateAgent()`, `deleteAgent()`
- `src/routes/agents.tsx` — page route at `/agents`
- `src/screens/agents/agent-library-screen.tsx` — Agent Library UI: search, filter (All/Built-in/Custom), agent cards showing emoji, color, role, tags, system prompt preview; Create/Edit/Delete/Duplicate actions; Delete protected for built-ins; stat header (N built-in, N custom)
- `src/screens/agents/agent-editor-dialog.tsx` — Create/Edit form: emoji picker grid (24 options), color picker swatch (16 colors), name, role label, system prompt textarea (monospace, resizable), model override, tags (comma-separated); supports both create and edit modes

**Modified files:**
- `src/routeTree.gen.ts` — registered `/agents`, `/api/agents/`, `/api/agents/$agentId` routes in all required TypeScript interfaces and route tree
- `src/screens/chat/components/chat-sidebar.tsx` — added `AiUserIcon` import, `isAgentsActive` state, "Agents" nav item in the main nav group (below Crews)
- `src/components/workspace-shell.tsx` — added `/agents` → `'Agents'` mobile page title mapping
- `src/screens/crews/components/create-crew-dialog.tsx` — fetches full agent list via `useQuery(['agents'])`; persona picker renders Built-in/Custom `<optgroup>` sections when custom agents exist; `addMember()` uses `agentOptions` for next-persona selection; color swatch uses `agent.color`/`agent.emoji` from unified list
- `src/screens/crews/components/templates-gallery.tsx` — fetches agents via `useQuery(['agents'])`; `TemplateCard` receives `agents` prop; member pills resolve emoji/name from full agent list (custom agents now display correctly)
- `src/routes/api/crews/index.ts` — calls `listAgents()` when minting crew members; resolves emoji, displayName, roleLabel, and model from custom agent if found, falls back to built-in persona; crew member records are now agent-aware

**Architecture notes:**
- Built-in agents are derived at runtime from `AGENT_PERSONAS` and never written to disk
- Custom agents use UUID IDs; built-in agent IDs follow `builtin-<name>` convention
- `GET /api/agents` returns built-ins first (stable order by persona array), then custom sorted newest-first
- The crew creation API is backwards-compatible: a crew member's `persona` field remains the lowercase name string; the API layer resolves display metadata from the full agent list at create time

### Version bump: 1.11.0 → 1.12.0

---

## 2026-04-12 — Session 11

### What was done

**Task #17 — MCP client protocol support (connect to external MCP servers)**

The MCP settings screen already existed (752-line UI with add/edit/delete and YAML generation), but it was a draft-only workflow — changes had to be manually copy-pasted into `config.yaml`. This task completes the integration by wiring the save pathway directly to the config file.

**Modified files:**
- `src/routes/api/mcp/servers.ts` — Added `PUT` handler:
  - Imports `fs`, `path`, `os`, `YAML` (same deps as `hermes-config.ts`)
  - Added `readConfig()`, `writeConfig()` helpers (local copies of the pattern from `hermes-config.ts`)
  - Added `serversToConfigDict()` — inverse of existing `readServers()`: converts `McpServerRecord[]` → `mcp_servers` dict for YAML
  - `PUT` accepts `{ servers: McpServerRecord[] }`, validates each entry, writes `config.mcp_servers` to `~/.hermes/config.yaml`, returns `{ ok, message, servers }`

- `src/screens/settings/mcp-settings-screen.tsx` — UI changes:
  - Added `saving` boolean state
  - Added `handleSaveToConfig()`: `PUT /api/mcp/servers` → on success: `setOriginalServers(servers)` + toast + auto-triggers `handleReload()` if reload is available
  - Updated `isDirty` banner: was "copy YAML instruction", now shows a "Save to Config" button (disabled while saving)
  - Updated header description: removed "until gateway config writes land" placeholder text
  - Updated YAML section label to "Manual fallback" with clear context

**Architecture:**
- Save writes to local `~/.hermes/config.yaml` (same file Hermes reads at startup)
- After save, auto-trigger of the existing `/api/mcp/reload` endpoint applies changes live without a full Hermes restart (where supported)
- YAML copy-paste fallback retained for environments where Hermes home is on a different machine

### Gotchas
- The `isDirty` copy-to-clipboard handler previously also called `setOriginalServers(servers)` — this was removed since the clipboard copy should not mark the local draft as "saved"
- `handleCopySnippet` and `handleSaveToConfig` both exist independently; save does NOT copy to clipboard

### Version bump: 1.10.0 → 1.11.0

---

## 2026-04-12 — Session 10

### What was done

**Task #16 — Cost tracking per crew**

Token usage and estimated API cost tracking per crew. A new **Usage** tab on every crew detail screen shows cumulative input/output tokens per agent and an estimated cost based on a built-in model price table.

**New files:**
- `src/types/cost.ts` — `MemberUsage`, `CrewUsage`, `CostStoreData` types
- `src/server/cost-store.ts` — file-backed store in `.runtime/costs.json`; price table for Anthropic/OpenAI/Google models with fuzzy matching; `recordMemberUsage()` upserts cumulative totals and re-derives crew-level sums; `deleteCrewUsage()` called on crew deletion
- `src/routes/api/crews/$crewId.usage.ts` — `GET` (fetch usage), `POST` (record member snapshot), `DELETE` (reset crew usage)
- `src/lib/cost-api.ts` — client helpers including `fetchAndRecordUsage()` which chains: fetch `/api/context-usage` for token data → POST to usage endpoint → invalidate `['crew-usage', crewId]` query
- `src/screens/crews/components/cost-panel.tsx` — Usage tab UI: KPI strip (total tokens, input/output split, est. cost), per-agent table with model badges, portable-mode notice, reset button

**Modified files:**
- `src/routes/api/context-usage.ts` — purely additive: added `inputTokens` and `outputTokens` to all three return paths; these were already computed (lines 118-119) but not returned
- `src/routes/api/crews/$crewId.ts` — added `deleteCrewUsage(params.crewId)` in DELETE handler (alongside existing `deleteWorkflow`)
- `src/screens/crews/crew-detail-screen.tsx` — added `'usage'` to tab union type; `BarChartIcon` import; `CostPanel` import; `fetchAndRecordUsage` called in `handleRunEnd` after status update; Usage tab in tab bar + body

**Architecture decisions:**
- Pull-on-done pattern: client queries Hermes session API after each `done` SSE event (no changes to `send-stream.ts`)
- Token data requires Hermes enhanced mode; portable mode gracefully shows dashes
- Cost store is separate from crew store to avoid bloating `crews.json`

### Price table models covered
Anthropic: claude-opus-4-6/4-5, claude-sonnet-4-6/4-5/4, claude-haiku-4-5/3.5, claude-3-opus
OpenAI: gpt-4.1, gpt-4.1-mini, gpt-4o, gpt-4o-mini, gpt-4-turbo, o1, o3-mini
Google: gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash

### Gotchas encountered
- `context-usage.ts` already computed `inputTokens`/`outputTokens` at lines 118-119 but never returned them — the fix was a two-line addition to the return JSON
- Zero-token entries (portable mode) are recorded if context-usage returns any data but filtered out of `fetchAndRecordUsage` with a guard (`if (inputTokens === 0 && outputTokens === 0) return`)

### Version bump: 1.9.0 → 1.10.0

---

## 2026-04-12 — Session 9

### What was done

**Task #15 — Agent/crew templates**

Pre-built crew configurations that let you jump-start any crew with a known-good composition. A Templates button opens a filterable gallery; selecting a template pre-fills the New Crew dialog and closes the gallery.

**New files:**
- `src/types/template.ts` — `CrewTemplate`, `CrewTemplateMember`, `CrewTemplateCategory` types
- `src/server/template-store.ts` — 7 hardcoded built-in templates + file-backed user templates in `.runtime/templates.json`; same in-memory/sync-write pattern as `crew-store.ts`
- `src/routes/api/crews/templates/index.ts` — `GET /api/crews/templates` (list), `POST /api/crews/templates` (create user template) with full validation
- `src/routes/api/crews/templates/$id.ts` — `DELETE /api/crews/templates/:id` with built-in protection (403 on attempts to delete built-ins)
- `src/lib/templates-api.ts` — `fetchTemplates()`, `createUserTemplate()`, `deleteUserTemplate()` client helpers
- `src/screens/crews/components/templates-gallery.tsx` — modal gallery with category filter tabs (All / Research / Engineering / Creative / Operations), template cards with persona chip row, "Use Template" and (for user templates) trash-icon delete buttons; TanStack Query `['crew-templates']` key

**Modified files:**
- `src/screens/crews/components/create-crew-dialog.tsx` — added `initialName?`, `initialGoal?`, `initialMembers?` props; `useEffect` reset now uses initial values so the dialog reflects the template on open
- `src/screens/crews/crews-screen.tsx` — added `galleryOpen`, `prefilledName/Goal/Members` state; `handleSelectTemplate()` chains gallery close → prefill → dialog open; **Templates** button added to header (uses `GridViewIcon`); `clearPrefill()` called on dialog close and after successful create

**Built-in templates (7):**

| id | name | category | members |
|---|---|---|---|
| `builtin-research-team` | Research Team | research | Luna (executor), Ada (reviewer), Kai (coordinator) |
| `builtin-deep-dive` | Deep Dive | research | Luna (executor), Roger (executor), Kai (coordinator) |
| `builtin-fullstack-squad` | Full-Stack Squad | engineering | Kai (coordinator), Roger, Sally, Max, Ada |
| `builtin-code-review` | Code Review Crew | engineering | Ada (executor), Luna (reviewer), Nova (specialist) |
| `builtin-content-studio` | Content Studio | creative | Bill (coordinator), Luna (executor), Roger (reviewer) |
| `builtin-ops-team` | Ops Team | operations | Max (coordinator), Sally, Kai (executors) |
| `builtin-sprint-team` | Sprint Team | operations | Kai (coordinator), Roger, Sally (executors), Ada (reviewer) |

### Gotchas encountered

- **`GridViewIcon`** — confirmed to exist in `@hugeicons/core-free-icons` CJS bundle before using; many similarly-named icons don't exist
- **`useEffect` dependency array in `CreateCrewDialog`** — `initialMembers` added to deps so resetting works correctly when the same dialog re-opens with a new template; the parent stores prefill in state (not computed inline) to avoid re-render loops
- **`clearPrefill()` called in two places** — `onOpenChange(false)` handler and `createMutation.onSuccess`; both paths are needed because users can close the dialog without submitting

### Version bump: 1.8.0 → 1.9.0

---

## 2026-04-12 — Session 8

### What was done

Three improvements across two tasks:

**Task #12 fix — Knowledge Graph: dialog → split-pane**
- The force-directed graph was buried inside a dialog triggered by a small "Graph view" button; most users never found it
- Replaced the dialog with a **Pages / Graph toggle** in the Knowledge browser header — both views share the left file-tree column; the right pane switches between page content and the graph canvas
- Graph data now fetched eagerly on mount (not lazy); clicking a graph node selects the page and auto-switches back to Pages view
- Dialog imports removed; `GraphCanvas` SVG height changed from fixed `h-[540px]` to `h-full` to fill the pane

**Task #13 — Crew/agent status dashboard (aggregate metrics)**
- Added `StatsStrip` component at the top of the Crews list screen (above the crew grid)
- Six stat chips: **Crews**, **Active** (green pulse when >0), **Paused**, **Complete**, **Agents**, **Running** (green pulse when >0)
- `RecentActivityFeed` below: surfaces latest `lastActivity` snippets from members across all crews, sorted by recency, max 6 entries
- Zero new API calls — all data derived from the `crews` query already polling every 10 s

**Task #14 — Visual Workflow Builder (DAG editor)**

Full implementation of a DAG-structured task pipeline editor as a new "Workflow" tab on every crew detail screen.

**New files:**
- `src/types/workflow.ts` — shared types: `WorkflowTask`, `WorkflowEdge`, `Workflow`
- `src/server/workflow-store.ts` — file-backed persistence at `.runtime/workflows.json`, one workflow per crew; same in-memory + deferred disk write pattern as crew-store
- `src/routes/api/crews/$crewId.workflow.ts` — GET / PUT / DELETE; PUT validates edge references and runs DFS cycle detection (400 on cycle)
- `src/lib/workflow-api.ts` — client fetch helpers
- `src/screens/crews/components/workflow-builder.tsx` — the canvas component + runner hook

**Modified files:**
- `src/screens/crews/crew-detail-screen.tsx` — added "Overview" / "Workflow" tab bar; Workflow tab renders `<WorkflowBuilder />`
- `src/routes/api/crews/$crewId.ts` — crew DELETE now also calls `deleteWorkflow()` to keep storage clean

**Canvas implementation (pure SVG, no new library deps):**
- Nodes: `<rect>` (176 × 68 px, r=8) with status tint overlay, task label, assignee text, status badge, input/output port circles
- Edges: cubic bezier `<path>` with SVG `<marker>` arrowhead; active edges highlight green; wide invisible hit path for click-to-delete
- Pan: pointer capture on SVG background drag
- Zoom: non-passive wheel listener (0.2×–4×) + toolbar +/−/⊙ buttons
- Node drag: `data-tid` attribute hit-test + pointer capture, delta converted via viewBox ratio

**Interactions:**
- **Add Task** — toolbar button opens modal: label, prompt (textarea), assignee (crew member select)
- **Connect mode** — toolbar toggle; click source node (highlights), click target node → creates directed edge; cycle check runs before adding; Esc cancels
- **Auto Layout** — Kahn's BFS topological layers; nodes spread left-to-right in columns, vertically centred per layer
- **Edit Task** — double-click node or "Edit Task" button in side panel; edit label/prompt/assignee
- **Delete Task** — removes node and all its connected edges
- **Delete Edge** — click edge (wide transparent hit area) or × button in side panel dependency list
- **Save** — explicit "Save" button; only enabled when dirty; persists to `.runtime/workflows.json` via PUT
- **Clear** — delete entire workflow with confirm()

**Execution engine (client-side, no new server state):**
- `topoLayers()` — Kahn's BFS producing `string[][]` where each inner array is a parallel execution layer
- "Run Workflow" dispatches layer 0 in parallel via existing `dispatchTask()` API; tracks sessionKey→taskId in a `pendingRef` Map
- Separate `EventSource('/api/chat-events')` opened while running; `run_end` / `done` events matched by sessionKey; on task completion the layer completion check fires
- When all tasks in a layer complete, the next layer dispatches automatically
- If any task errors: execution halts, error shown in toolbar, remaining layers skipped
- Per-node visual status updates in real time: idle → running (green border) → done (indigo) / error (red)

**TypeScript:** zero new errors (build passes clean; 4 pre-existing errors in unrelated files unchanged)

### Repo state
- Branch: `main`
- Version: 1.8.0

### Next session start
- Task #15: Agent/crew templates — pre-built configurations (nice-to-have)
- Task #16: Cost tracking per crew (nice-to-have)
- Task #17: MCP client protocol support — connect to external MCP servers (critical)
- Task #18: Audit trail — timeline of all agent/crew actions (critical)

---

## 2026-04-12 — Session 7

### What was done
- Hermes gateway updated (399 new commits, v0.8.0 → current; 78 new bundled skills)
- Compatibility audit against the update — identified 4 gaps
- Closed all 4 gaps

**Gap 1 — Config migration (v13 → v16)**
- Ran `hermes config migrate` to apply 3 version bumps:
  - v13→14: migrated legacy flat `stt.model` to provider-specific section
  - v14→15: added `display.interim_assistant_messages: true`
  - v15→16: renamed `display.tool_progress_overrides` → `display.platforms`
- The `--quiet` flag doesn't exist; migration was invoked via Python directly to work around a skill-config probe crash that exited before the version bump

**Gap 2 — Status messages toggle**
- Added "Status messages" `Switch` row to Display settings
- Reads/writes `display.interim_assistant_messages` — controls whether the gateway shows natural mid-turn assistant status messages
- Slotted between Streaming and Show reasoning rows in `src/routes/settings/index.tsx`

**Gap 3 — Live run streaming in Jobs UI**
- `POST /api/jobs/{job_id}/run` has no `run_id` return value; `/v1/runs` is a separate parallel runner
- Used `/v1/runs` as the "Run now" execution path for live feedback; scheduled cron runs still go through job system
- New Studio server routes:
  - `src/routes/api/hermes-runs.ts` — POST proxy to `/v1/runs`
  - `src/routes/api/hermes-runs.$runId.events.ts` — SSE passthrough proxy to `/v1/runs/{runId}/events`
- `src/lib/jobs-api.ts`: added `startRun(prompt)` → run_id, `RunEvent` type
- `src/screens/jobs/jobs-screen.tsx`:
  - `formatRunEventLabel()` maps backend event names to human labels
  - `JobCard` gains `activeRunId` state, `useEffect` subscribing to `EventSource`, live log + response text accumulator, auto-expand on trigger
  - "Run now" button calls `startRun()`, falls back to fire-and-forget on failure
  - Expanded panel switches between "Live run" (pulsing indicator + event log) and "Run history"
- Both routes registered in `src/routeTree.gen.ts` (7 locations: imports, constants, 3 interfaces, RoutesById, rootRouteChildren)

**Gap 4 — Session reset + per-platform display overrides in Settings**
- `AddPlatformOverride` component added: dropdown of 13 known platforms, add/remove overrides
- Agent Behavior section: session reset mode selector (`none`/`daily`/`idle`/`both`) + conditional "Reset hour" and "Idle timeout" inputs
- Display section: per-platform `tool_progress` overrides editor (all/new only/verbose/off per platform)

**TypeScript:** zero new errors (`npx tsc --noEmit` — only 5 pre-existing errors in unrelated files)

### Repo state
- Branch: `dev`
- Version: 1.7.0

### Next session start
- Task 6 (Feature 1 — Approvals UI): remaining items — "Approve for Session" scope button, resolved-approval receipt in message timeline, global approval badge in sidebar
- Task 7 (Feature 4 — Permissions & Config UI): `command_allowlist` editor, website blocklist domain editor, `quick_commands` editor, chat platform tokens in Integrations

---

## 2026-04-10 — Session 6

### What was done
- Completed Task 8: Session Persistence via Redis

**Research findings:**
- `local-session-store.ts` already existed with correct logic but was dead code — never imported by any API route
- All session/history routes returned empty data in portable mode (gateway unavailable)
- `send-stream.ts` streamed messages but never saved them anywhere in portable mode
- `ioredis` not previously installed; file-based `.runtime/local-sessions.json` approach was designed but inactive

**What was implemented:**
- `local-session-store.ts` extended with optional Redis backend:
  - `tryInitRedis()` — non-blocking async init; pings Redis and merges Redis data into in-memory store
  - `loadFromRedis()` / `saveSessionToRedis()` / `appendMessageToRedis()` / `deleteSessionFromRedis()` helpers
  - Redis key schema: `hermes:studio:sessions` (hash), `hermes:studio:messages:{id}` (list), 30-day TTL
  - Graceful fallback: if `REDIS_URL` unset or Redis unreachable, file store used transparently
- `/api/sessions` — all 4 verbs wired to local store when gateway unavailable:
  - GET: returns `listLocalSessions()` with session metadata
  - POST: calls `ensureLocalSession(friendlyId, model)` — persisted immediately
  - PATCH: calls `updateLocalSessionTitle(sessionKey, label)` — persistent rename
  - DELETE: calls `deleteLocalSession(sessionKey)` — removes from file + Redis
- `/api/history` — when gateway unavailable: resolves session key (explicit → latest → 'new'), returns `getLocalMessages().map(toLocalChatMessage)`
- `send-stream.ts` — portable mode now saves messages:
  - Before stream: `ensureLocalSession(key)` + `appendLocalMessage({ role: 'user', ... })`
  - After stream: `appendLocalMessage({ role: 'assistant', content: accumulated })`
- `ioredis` added as runtime dependency via `pnpm add ioredis`
- `.env.example` updated with `REDIS_URL=redis://localhost:6379` comment block

**Tests passed (standalone Node.js test script):**
- Session create + file written ✅
- Reload from disk after memory clear (server restart simulation) ✅
- Messages preserved across reload ✅
- Delete session ✅
- 500-message cap enforcement ✅
- TypeScript: zero errors ✅
- Build: clean ✅

### Repo state
- Branch: `dev` → merged to `main`
- Version: 1.5.0

### Next session start
- Task 9: Multi-Agent Orchestration Dashboard

---

## 2026-04-10 — Session 5

### What was done
- Completed Task 7: Permissions & Toolsets Settings UI

**Research findings:**
- `~/.hermes/config.yaml` has rich permissions/sandbox fields: `approvals`, `security`, `toolsets`, `code_execution`, `agent.reasoning_effort`, `agent.verbose`
- Existing settings page already has Agent Behavior (max_turns, gateway_timeout, tool_use_enforcement) but not these
- Existing `PATCH /api/hermes-config` deep-merges config changes — no new backend needed
- `HermesConfigSection` component already handles multi-view dispatch via `sectionContent` map

**What was implemented:**
- `'permissions'` added to `SettingsSectionId` type union
- `{ id: 'permissions', label: 'Permissions & Toolsets' }` added to `SETTINGS_NAV_ITEMS` (appears after "Agent Behavior")
- `HermesConfigSection activeView="permissions"` wired into content area
- `renderPermissions()` function with 4 sub-sections:
  - **Approvals**: mode (manual/auto/off) + timeout slider
  - **Toolsets**: list of active toolsets as removable tags + add-custom input
  - **Security**: redact_secrets, tirith_enabled, website_blocklist toggles
  - **Code Execution**: timeout + max_tool_calls number inputs
  - **Agent Reasoning**: reasoning_effort (low/medium/high) + verbose toggle
- State for `newToolset` input hoisted to `HermesConfigSection` component level (hooks rule compliance)
- `LockIcon` imported from `@hugeicons/core-free-icons`

**Tests passed:**
- TypeScript: zero errors ✅
- Build: clean (3.76s) ✅

### Repo state
- Branch: `dev`
- Version: 1.4.0

### Next session start
- Task 8: Session Persistence via Redis
  - Research what session state is currently stored and where
  - Design Redis adapter for session/history persistence
  - Implement Redis connection + session store

---

## 2026-04-10 — Session 4

### What was done
- Completed Task 6: Cron Job Manager UI (confirmed already shipped in codebase)
- Updated README.md: all "Hermes Workspace" → "Hermes Studio", clone URLs, Docker commands, roadmap, features section, star history chart, version badge 1.0.0 → 1.3.0
- Bumped package.json version: 1.0.0 → 1.3.0
- Updated CHANGELOG.md with v1.3.0 entry (Task 6)
- Committed and pushed to GitHub

**Task 6 research findings:**
- Jobs UI was already fully implemented in hermes-workspace and carried over cleanly
- `GET/POST /api/hermes-jobs` and `GET/POST/PATCH/DELETE /api/hermes-jobs/$jobId` proxy routes complete
- `jobs-api.ts` covers: fetchJobs, createJob, updateJob, deleteJob, pauseJob, resumeJob, triggerJob, fetchJobOutput
- `JobsScreen` wired into workspace-shell.tsx nav and mobile-tab-bar.tsx
- Feature gate: shows BackendUnavailableState if gateway lacks `/api/jobs`
- Auto-refresh every 30s via React Query; run history expandable per card

### Repo state
- Branch: `dev`
- Version: 1.3.0

### Next session start
- Task 7: Permissions & Sandbox Config UI ✅ (see Session 5)

---

## 2026-04-09 — Session 3

### What was done
- Completed Task 5: Skill Installation from web UI

**Research findings:**
- `POST /api/skills/install` and `POST /api/skills/uninstall` already existed and worked
- `POST /api/skills` (toggle) was a 501 Not Implemented stub
- `clawhub` CLI is NOT installed on this machine
- `GET /api/skills` correctly returns skill lists from gateway
- Full install/uninstall/toggle UI was already in `skills-screen.tsx` — wired to the endpoints

**What was implemented:**
- `POST /api/skills` toggle action: reads/writes `~/.hermes/skills/.studio-prefs.json` to track disabled skill IDs; does not require gateway
- `GET /api/skills` merges local prefs to report accurate `enabled` state
- `POST /api/skills/install`: now tries Hermes gateway native endpoint first, then clawhub CLI, then returns `installClawhub: 'pip install skillhub'` if clawhub is missing
- `POST /api/skills/uninstall`: added path traversal security guard
- UI: loading spinners (⏳) on action buttons while in progress
- UI: "Installing... may take up to 2 minutes" progress hint
- UI: clawhub-missing inline banner with `pip install skillhub` instructions + dismiss
- UI: success toasts on install/uninstall completion
- Branding: "Hermes Workspace" → "Hermes Studio" in header and security badge

**Tests passed:**
- Toggle disable/enable prefs file round-trip: ✅
- Install with missing clawhub → returns hint: ✅
- Uninstall path traversal attack blocked: ✅
- TypeScript: zero errors ✅
- Build: clean ✅
- Live API tests via pnpm dev: all 5 scenarios ✅

### Repo state
- Branch: `dev`
- Version: 1.2.0

### Next session start
- Task 6: Cron Job Manager UI ✅ (confirmed already shipped — see Session 4)
- Task 7: Permissions & Sandbox Config UI

---

## 2026-04-09 — Session 2

### What was done
- Completed Task 4: Execution Approvals UI (full end-to-end implementation)
- Deep-dived hermes gateway approval mechanism: agent blocks via threading.Event in tools/approval.py; resolved via `/approve` or `/deny` chat commands; gateway has no native HTTP approval endpoints (sessions capability is false)
- Rewrote `src/lib/approvals-store.ts` from no-op stub to real in-memory Map with sessionStorage persistence
- Updated `src/routes/api/send-stream.ts` to translate `approval.required` / `tool.approval` / `exec.approval` gateway SSE events → client `approval` event
- Created `src/routes/api/approvals.$approvalId.approve.ts` — dual strategy: native gateway endpoint first, then chat command `/approve [scope]` fallback
- Created `src/routes/api/approvals.$approvalId.deny.ts` — same pattern, sends `/deny`
- Updated `src/screens/chat/hooks/use-streaming-message.ts` — added `onApprovalRequest` option and `case 'approval'` SSE handler
- Updated `src/screens/chat/chat-screen.tsx` — extracted `handleApprovalRequest` shared callback, wired into both `useRealtimeChatHistory` and `useStreamingMessage`, added "Always Allow" button to approval banner UI, updated `resolvePendingApproval` to pass `scope` body param
- Updated `src/routeTree.gen.ts` — manually registered both new approval routes (TanStack Router codegen not running)
- TypeScript: zero errors (`npx tsc --noEmit` clean)
- Build: clean (`pnpm build` ✓ in 3.51s)

### Repo state
- Branch: `dev`
- Version: 1.1.0
- Package manager: pnpm

### Next session start
- Task 5: Skill installation from web UI
  - Add "Install" button to skills explorer that calls POST /api/skills/install
  - Show installation state (pending / installed / error) per skill
  - Possibly browse and install from hermes hub registry

---

## 2026-04-10 — Session 1

### What was done
- Forked hermes-workspace v1.0.0 (MIT) as Hermes Studio
- Stripped upstream git history, started clean `main` branch
- Removed internal planning docs (workspace-final-markdown-review.md, FUTURE-FEATURES.md)
- Updated package.json: name, description, author, homepage, repository
- Updated LICENSE: dual attribution JPeetz + outsourc-e
- Updated README: rebranded, added "What's different" section, acknowledgments
- Created `dev` branch for active development
- Pushed to https://github.com/JPeetz/Hermes-Studio
- Set 14 GitHub topics for discoverability
- Installed 59 custom openfang skills into ~/.hermes/skills/openfang/ (8 sub-categories)
- Fixed 4 skills missing SKILL.md (api-design, code-review-guide, moltspeak, writing-style)
- Installed superpowers plugin v5.0.7 for Claude Code

### Repo state
- Branch: `dev` (active development)
- Last commit: `f1b7ce2` feat: initial release of Hermes Studio v1.0.0
- Node: 24 local / 22 CI
- Package manager: pnpm

### Next session start
- Task 4: Execution Approvals UI
- Research hermes approval events in gateway API
- Check src/lib/approvals-store.ts and src/routes/api/send.ts (501 stub)
- Design modal: command shown → Allow once / Always allow / Deny

---
