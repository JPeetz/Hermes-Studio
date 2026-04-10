# Changelog

All notable changes to Hermes Studio are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
- Branding: "Hermes Workspace" → "Hermes Studio" in security scan badge

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

### Planned
- Execution Approvals UI (Task 4)
- Skill installation from web UI (Task 5)
- Cron job manager (Task 6)
- Permissions & sandbox config UI (Task 7)
- Session persistence via Redis (Task 8)
- Multi-agent orchestration dashboard (Task 9)

---
