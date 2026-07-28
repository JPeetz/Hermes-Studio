# Changelog

## [clean] - 2026-07-28

### Fixed
- **Vite middleware auth bypass**: Removed the `configureServer` middleware that intercepted `/api/connection-status` with bare `fetch()` calls (no auth headers). This caused the gateway to reject requests with `401 no_cookie` even when `HERMES_DASHBOARD_USERNAME`/`HERMES_DASHBOARD_PASSWORD` were configured.
- The fix allows the request to pass through to the TanStack server route handler, which properly uses `gatewayFetch()` with session cookie authentication.

### Security
- Removed all sensitive credentials (API tokens, passwords) from version control.
- `.env` is properly gitignored and excluded from source tree.

### Changed
- `vite.config.ts`: Added `gatewayFetch` import from `./src/server/gateway-session`; removed the Vite middleware intercept block for `/api/connection-status`.
- `pnpm-lock.yaml`: Updated dependency resolutions.
- Added `pnpm-workspace.yaml`.

### Upstream
This is a fork of [JPeetz/Hermes-Studio](https://github.com/JPeetz/Hermes-Studio) (MIT license).
Changes are on the `clean` branch, based on upstream `main` at commit `356b3d5`.
