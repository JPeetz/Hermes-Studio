# Contributing to Hermes Workspace

Thanks for your interest in contributing! Here's how to get started.

## Quick Start

1. Fork the repo and clone your fork
2. Install dependencies: `pnpm install`
3. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env — set HERMES_API_URL (default: http://127.0.0.1:8642)
   ```
4. Start [Hermes Agent](https://github.com/NousResearch/hermes-agent) API server
5. Run dev server: `pnpm dev`
6. Make your changes on a feature branch
7. Open a PR against `main`

## Development

```bash
# Install dependencies
pnpm install

# Dev server (default: localhost:3000)
pnpm dev

# Type check
npx tsc --noEmit

# Lint
pnpm lint

# Build for production
pnpm build
```

## Environment Variables

See `.env.example` for all options. Key ones:

- `HERMES_API_URL` — Hermes Agent gateway backend (default: `http://127.0.0.1:8642`)
- `HERMES_PASSWORD` — Optional password protection for the web UI
- `HERMES_ALLOWED_HOSTS` — Comma-separated hostnames for non-localhost access
- `HERMES_DASHBOARD_URL` — Optional. Hermes Agent's own web-dashboard backend
  (default port 9119). On Agent v0.19+ the `/api/skills`, `/api/memory` and
  `/api/config` routes live there, not on the gateway — set this (plus
  `HERMES_DASHBOARD_SESSION_TOKEN`, the same value the dashboard was started
  with) to let Studio reach them. Leave unset to use Studio's local
  `~/.hermes` fallbacks.
- `HERMES_DASHBOARD_SESSION_TOKEN` — Session token shared with the agent
  dashboard process (`HERMES_DASHBOARD_TOKEN` also accepted). Server-side
  only; never exposed to the browser.

## Guidelines

- **One PR per feature/fix** — keep them focused
- **Test your changes** — make sure the app builds (`npx tsc --noEmit`) and runs
- **Describe what you changed** — clear PR title + description
- **No secrets** — never commit API keys, tokens, or passwords
- **Follow existing patterns** — match the code style you see
