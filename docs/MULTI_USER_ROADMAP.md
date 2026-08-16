# Multi-User Access Control Roadmap

**Status:** Phase 1 + Phase 2 core implemented (2026-08-13) — see "Phase 2 delivered" below; remaining: management UI, session/chat isolation  
**Issue:** #8 — Kanban board shows all tasks to all users  
**Date:** 2026-07-03 (updated 2026-08-13)

## Phase 2 delivered (2026-08-13)

- **Per-user identity (2a):** `HERMES_USERS='alice:pw1,bob:pw2'` enables
  multi-user logins (username + password, `src/server/user-credentials.ts`);
  `/api/auth` associates the session token with the userId;
  `HERMES_SUPER_ADMINS='alice'` grants super_admin at login. Multi-user mode
  counts as password protection even without `HERMES_PASSWORD`, and the
  legacy shared password is rejected in this mode. Login form gains a
  username field (driven by `multiUser` from `/api/auth-check`).
- **Fail-closed defaults:** in multi-user mode, requests with no resolvable
  identity are denied on `/api/tasks` (list + create) and by
  `canAccessTask()` — a misconfiguration can no longer silently reopen the
  all-tasks leak.
- **Event-surface leak closure (2b):** task events now carry
  `createdBy`/`profileId` and are filtered per user by `canSeeTaskEvent()` on
  all four event surfaces — `/api/events`, `/api/chat-events`,
  `/api/events/replay`, and `/api/audit`. Legacy stored events without
  ownership are visible only to super admins.

  > `/api/events` was the last one closed. An earlier revision of this document
  > claimed its auth was "fixed in a separate branch"; that was wrong — no such
  > branch existed, and the route had been unauthenticated and unfiltered since
  > the initial release, streaming every user's task activity to any caller. It
  > is fixed here, and covered by route-level tests so a green suite can no
  > longer hide it.
- **Admin surface (2c):** `GET/PATCH /api/admin/users` (super_admin only) —
  list users from `HERMES_USERS`, set roles, manage profile bindings.
- **Profile-bound tasks (2d):** tasks accept an optional `profileId`
  (validated against the creator's bindings); regular admins see tasks they
  created OR tasks of profiles bound to their account.
  `getAccessibleProfiles()` now returns `null` for "all" (was a misleading
  `[]`).

Remaining: user management UI in settings (roles/bindings are API-only),
extending isolation to sessions/chat (item 4 below), and a migration story
for orphan tasks (`createdBy: 'user' | 'unknown'` — super admins see them).

## What's Implemented (Phase 1)

### User Identity & Role Tracking (`src/server/user-profiles.ts`)

- `UserProfile` type with userId, role, and profileIds
- `getUserProfile(userId)` — get or create user profile
- `updateUserProfile()` — update role and bindings
- `addProfileBinding() / removeProfileBinding()` — manage profile access
- `canAccessProfile()` — check if user can access a specific profile
- Redis-backed persistence (survives restarts)

### Auth Middleware Extensions (`src/server/auth-middleware.ts`)

- Token-to-userId mapping for session tracking
- `storeSessionToken(token, userId)` — associate user with session
- `getUserIdFromToken(token)` — retrieve user from session
- `getUserIdFromRequest(request)` — extract user from request (token or env var)
- Backward compatible with existing password-only auth

### Tasks API Role Filtering (`src/routes/api/tasks/index.ts`)

- Regular admins see only tasks they created
- Super admins see all tasks
- User ID extracted from session or `HERMES_USER_ID` env var
- POST handler automatically assigns task to current user

## Current Limitations & Next Steps (Phase 2)

### 1. **No Profile Binding to Tasks** (CRITICAL)

Current: Tasks use `createdBy` (username string) as proxy for ownership.  
Better: Add `profileId` field to tasks so they can be associated with specific profiles.

```typescript
// In types/task.ts, add:
export interface HermesTask {
  id: string
  profileId?: string // Which profile this task belongs to
  // ... other fields
}
```

Then update task filtering:
```typescript
// In /api/tasks GET handler:
if (userProfile.role !== 'super_admin') {
  tasks = tasks.filter(t => userProfile.profileIds.includes(t.profileId))
}
```

### 2. **No User Authentication/Creation UI**

Current: Users created only via environment variables or direct API calls.  
Needed: Login/signup flow that:
- Allows creating multiple user accounts
- Stores passwords securely (bcrypt)
- Issues session tokens
- Tracks which admin created/assigned each user

Suggested location: `src/routes/api/auth/index.ts` (extend existing auth endpoint)

### 3. **No Profile Binding UI**

Current: Profile bindings set only via API (`addProfileBinding`).  
Needed: Settings page that:
- Shows super_admin the list of users and their role
- Shows all users which profiles they can access
- Allows admins to assign profiles to users
- Audit log of who changed what when

### 4. **Role Isolation in Other APIs**

Current: Only `/api/tasks` implements filtering.  
Needed: Apply same pattern to:
- `/api/sessions` — filter sessions by profile
- `/api/chat` — filter chat history by profile
- Any profile-bound data endpoints

### 5. **One-User Fallback**

Current: Deployments with no users configured allow all access.  
Better: Explicitly define "single-user" vs "multi-user" mode at startup.

```typescript
// In auth-middleware.ts or startup:
export function isMultiUserMode(): boolean {
  return process.env.HERMES_MULTI_USER === 'true' || hasAnyUsers()
}
```

If multi-user mode is on, reject requests with no valid user ID.

## Implementation Priority

1. **High:** Add profileId to tasks (breaks backward compat but necessary)
2. **High:** Create user account management API
3. **Medium:** Build admin UI for profile binding
4. **Medium:** Apply role filtering to other endpoints
5. **Low:** One-user fallback mode detection

## Testing

### Manual Testing (Current)

```bash
# Set user ID for testing
export HERMES_USER_ID=alice

# Create task as alice
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Alice task"}'

# List tasks as alice (should see only her own)
curl http://localhost:3000/api/tasks

# Switch user
export HERMES_USER_ID=bob
curl http://localhost:3000/api/tasks  # Should see 0 tasks

# Set as super_admin (requires API extension)
# curl -X POST http://localhost:3000/api/admin/users/bob/role -d '{"role":"super_admin"}'
# curl http://localhost:3000/api/tasks  # Should see alice's task
```

### Unit Tests Needed

- `user-profiles.ts`: Profile binding operations
- Task filtering with different roles
- Token-to-user mapping persistence
- Multi-user vs single-user mode detection

## Related Documentation

- GitHub Issue #8: "Kanban board shows all tasks to all users regardless of account role"
- Current auth system: `src/server/auth-middleware.ts`
- Task types: `src/types/task.ts`

## References

This is a common pattern in multi-tenant SaaS:
- **Stripe:** Workspace -> Organization -> Users with roles
- **Notion:** Workspace -> Pages -> Users with permissions
- **Linear:** Team -> Cycles -> Members with access levels

The key is: **Users -> Roles -> Resources** binding chain.
