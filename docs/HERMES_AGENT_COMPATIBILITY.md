# Hermes Agent Compatibility Guide

**Last Updated:** 2026-07-03  
**Studio Version:** 1.20.0+  
**Recommended Agent Version:** 0.18.0+  
**Minimum Agent Version:** 0.8.0

## Overview

Hermes Studio is designed to work with Hermes Agent v0.8.0 and later. However, for optimal compatibility and access to all features, **v0.18.0 or later is strongly recommended**.

This guide covers:
- Version compatibility matrix
- Known issues and workarounds
- Deployment best practices
- Troubleshooting version-related problems

## Version Compatibility Matrix

| Studio Version | Min Agent | Recommended Agent | Full Features |
|---|---|---|---|
| 1.20.0+ | 0.8.0 | 0.18.0+ | ✅ Yes |
| 1.19.0-1.20.0 | 0.8.0 | 0.15.0+ | ⚠️ Partial |
| 1.18.0-1.18.1 | 0.8.0 | 0.14.0+ | ⚠️ Partial |
| Earlier | 0.8.0 | 0.12.0+ | ❌ Limited |

## What's New in Agent v0.18.0

### API Changes

- **Response format:** Sessions API now returns `{ items: [...], total: N }` instead of `{ data: [...] }`
- **Session fields:** Added `last_active`, `end_reason`, improved `parent_session_id` tracking
- **Message pagination:** New `offset` parameter for historical message queries
- **Bearer token support:** All API endpoints now support `Authorization: Bearer <token>` header

### Features Added

- ✅ Session versioning and branching
- ✅ Memory snapshot system
- ✅ Crew session pooling
- ✅ Enhanced job scheduling
- ✅ Better error context in responses
- ✅ Version endpoint at `/version` for client detection

### Breaking Changes

1. **Sessions API response format** (CRITICAL)
   - OLD: `/api/sessions` → `Array<Session>`
   - NEW: `/api/sessions` → `{ items: Array<Session>, total: number, limit: number, offset: number }`
   - **Fix:** Studio automatically detects and adapts (see `src/routes/api/sessions.ts`)

2. **Chat completions streaming** (if applicable)
   - Response format simplified; check SSE event structure
   - **Fix:** Upgrade chat event handlers in `src/stores/chat-store.ts`

3. **Memory API** (new in 0.18)
   - New `/api/memory` endpoint for structured memory operations
   - Backward compatible: old file-based memory still works

## Deployment: Pinning the Version

### Docker Compose

To pin to a specific Hermes Agent version:

```bash
# Default: uses latest main branch
docker compose up

# Pin to v0.18.0
HERMES_AGENT_VERSION=0.18.0 docker compose up

# Pin version via .env file
echo "HERMES_AGENT_VERSION=0.18.0" >> .env
docker compose up
```

### Local Development

For local development, keep Hermes Agent updated:

```bash
cd ~/hermes-agent
git pull
pip install -e .
hermes gateway run  # or --gateway flag
```

## Troubleshooting

### "Sessions API not available" or 500 errors

**Symptom:** Session history page shows error, Kanban operations fail

**Cause:** Running against older Hermes Agent version (< 0.15.0)

**Solution:**
```bash
# Update to v0.18.0
cd hermes-agent && git pull && git checkout v0.18.0
pip install -e .

# Or in Docker:
HERMES_AGENT_VERSION=0.18.0 docker compose up
```

### "Response format mismatch" errors

**Symptom:** Browser console shows `Cannot read properties of undefined`

**Cause:** Sessions API response format differs from expected

**Solution:**
```bash
# Check your Agent version
curl http://localhost:8642/version

# If < 0.18, upgrade:
cd hermes-agent && git pull && git checkout v0.18.0
pip install -e .
```

### Memory/Skills/Config APIs report missing (Agent v0.19+)

**Symptom:** Startup log shows `missing=[skills, memory, config]` even on a
current agent; `curl http://127.0.0.1:8642/api/skills` returns 404.

**Cause:** Not a version problem. Hermes Agent v0.19 moved `/api/skills`,
`/api/memory`, and `/api/config` off the gateway's embedded API server
(port 8642) onto the agent's own web dashboard backend
(`hermes_cli/web_server.py`, separate process, default port 9119, its own
session auth). The capability probe on 8642 correctly finds them absent.

**Effect on Studio:** none that needs fixing — Studio's Skills, Memory, and
Settings/Providers panels are backed by your local `~/.hermes` files
(`skills/`, memory workspace, `config.yaml` + `.env`) and keep working.
These capabilities no longer gate the "Enhanced" connection tier.

#### Optional: point Studio at the dashboard backend

If you want Studio to read those routes from the dashboard instead of only
from local files, set two server-side env vars:

| Variable | Meaning |
|---|---|
| `HERMES_DASHBOARD_URL` | Base URL of the agent's dashboard, e.g. `http://127.0.0.1:9119`. Unset (the default) means Studio never contacts it. |
| `HERMES_DASHBOARD_SESSION_TOKEN` | Session token shared with the dashboard process. `HERMES_DASHBOARD_TOKEN` is also accepted. |

Studio sends the token as `X-Hermes-Session-Token` (the dashboard also accepts
`Authorization: Bearer`), probes `/api/skills|memory|config` on the dashboard
first, and falls back to the gateway for pre-v0.19 agents. A dashboard 401 is
tracked separately from a gateway 401, so a bad dashboard token never marks
your gateway as unauthorized.

> **The token is ephemeral by default.** The dashboard reads
> `HERMES_DASHBOARD_SESSION_TOKEN` from its own environment and otherwise
> generates a random one **per process** — so a value you hardcode in Studio
> goes stale the next time the agent restarts. Start the agent with the same
> variable set on both sides, or leave `HERMES_DASHBOARD_URL` unset and rely on
> the local-file path.

Both variables are read server-side only and are never inlined into the browser
bundle. Neither is required: with them unset, Skills/Memory/Config still work
from `~/.hermes`.

### Memory/Skills APIs unavailable (older agents)

**Symptom:** Memory editor shows "API not available" on an agent **< 0.19**

**Cause:** Agent built without optional features

**Solution:**
```bash
# Reinstall with all features
cd hermes-agent
pip install -e ".[dev]"  # Includes all extras
```

### Deployment fails to start

**Symptom:** Docker container exits with: `error: Cannot find commit/version`

**Cause:** Invalid `HERMES_AGENT_VERSION` specified

**Solution:**
```bash
# Verify version exists
git ls-remote --tags https://github.com/outsourc-e/hermes-agent.git | grep v0.18

# Use valid version or 'main' for latest
HERMES_AGENT_VERSION=main docker compose up
```

## API Response Format Examples

### Sessions List (v0.18.0+)

```json
{
  "items": [
    {
      "id": "session-123",
      "source": "telegram",
      "user_id": "alice",
      "model": "claude-3-sonnet",
      "title": "Research task",
      "message_count": 42,
      "started_at": 1709500000000,
      "last_active": 1709510000000,
      "input_tokens": 1500,
      "output_tokens": 2000
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Single Session (v0.18.0+)

```json
{
  "session": {
    "id": "session-123",
    "source": "telegram",
    "user_id": "alice",
    "model": "claude-3-sonnet",
    "title": "Research task",
    "message_count": 42,
    "started_at": 1709500000000,
    "last_active": 1709510000000,
    "end_reason": "user_completed",
    "parent_session_id": "session-122",
    "input_tokens": 1500,
    "output_tokens": 2000,
    "cost": 0.025
  }
}
```

## Version Detection

Studio automatically detects the Hermes Agent version and adapts accordingly:

```typescript
// In src/server/version-compatibility.ts
const info = await getVersionInfo()
const compat = checkCompatibility(info.version)

if (!compat.compatible) {
  console.warn(`Upgrade recommended: ${compat.warnings[0]}`)
}
```

## Performance Considerations

### Version 0.18.0 Improvements

- 15-20% faster session listing (pagination optimization)
- 30% smaller session response payload (truncated old messages)
- Connection pooling support (when `HERMES_CONNECTION_POOL_SIZE` set)
- Reduced memory usage in long-running gateways

### Memory Usage

| Agent Version | Min RAM | Recommended |
|---|---|---|
| 0.8.0 - 0.14.0 | 1 GB | 2 GB |
| 0.15.0 - 0.17.0 | 1 GB | 2 GB |
| 0.18.0+ | 1 GB | 2 GB (better GC) |

## Migration Path

### From 0.15.x to 0.18.0

1. **Backup sessions:**
   ```bash
   tar -czf hermes-sessions-backup-$(date +%s).tar.gz ~/.hermes
   ```

2. **Update Agent:**
   ```bash
   cd hermes-agent && git checkout v0.18.0 && pip install -e .
   ```

3. **Restart Studio:**
   ```bash
   pkill -f "node server-entry.js"
   npm run start
   ```

4. **Verify:**
   ```bash
   curl http://localhost:8642/version
   curl http://localhost:3000/api/sessions | jq '.items | length'
   ```

### From < 0.15.0 to 0.18.0

If you're running an Agent version older than 0.15.0, migration is more involved:

1. **Backup everything:**
   ```bash
   tar -czf hermes-full-backup-$(date +%s).tar.gz ~/.hermes /app/.runtime
   ```

2. **Check Agent version:**
   ```bash
   hermes --version
   ```

3. **Update Agent (may require config migration):**
   ```bash
   cd hermes-agent
   git pull
   git checkout v0.18.0
   pip install -e .
   hermes config migrate  # May prompt for input
   ```

4. **Test locally:**
   ```bash
   hermes gateway run
   # In another terminal:
   curl http://localhost:8642/health
   ```

5. **Restart Studio and verify all features**

## Support Matrix

### Known Issues

**Agent 0.17.x:**
- Crew session pooling not available
- Memory snapshots return stale data after first write
- **Workaround:** Upgrade to 0.18.0

**Agent 0.16.x:**
- Job scheduling has 5-second latency
- Message streaming may drop final event
- **Workaround:** Upgrade to 0.18.0

**Agent 0.15.x:**
- No pagination support for sessions
- Limited bearer token support
- **Workaround:** Upgrade to 0.18.0

### Unsupported Versions

- **< 0.8.0**: Core APIs not implemented; Studio won't start
- **0.8.0 - 0.14.0**: Works but many advanced features unavailable; update strongly recommended

## Contributing

If you encounter version-related issues:

1. **Check the version:**
   ```bash
   curl http://localhost:8642/version
   ```

2. **Enable debug logging:**
   ```bash
   DEBUG=hermes* npm run dev
   ```

3. **Report with version info:**
   - Studio version: `cat package.json | grep version`
   - Agent version: `curl http://localhost:8642/version`
   - Node version: `node --version`
   - Python version (if local): `python --version`

## References

- [Hermes Agent Releases](https://github.com/outsourc-e/hermes-agent/releases)
- [Hermes Agent Changelog](https://github.com/outsourc-e/hermes-agent/blob/main/CHANGELOG.md)
- [Studio Version Compatibility Module](../src/server/version-compatibility.ts)
- [Gateway Capabilities Detection](../src/server/gateway-capabilities.ts)
