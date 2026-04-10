# Changelog

All notable changes to Hermes Studio are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
