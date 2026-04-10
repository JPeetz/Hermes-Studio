# Hermes Studio — Developer Log

Running log of development sessions. Most recent at top.

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
- Task 6: Cron Job Manager UI
  - Backend: GET/POST/PUT/DELETE /api/jobs endpoints
  - UI: list cron jobs, create/edit (expression + command), enable/disable toggle, delete
  - Already has /api/hermes-jobs route — check its capabilities

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
