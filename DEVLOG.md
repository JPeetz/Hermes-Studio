# Hermes Studio — Developer Log

Running log of development sessions. Most recent at top.

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
