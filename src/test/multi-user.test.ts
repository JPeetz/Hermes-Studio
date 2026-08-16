import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isMultiUserMode,
  listConfiguredUsernames,
  superAdminUsernames,
  verifyUserPassword,
} from '../server/user-credentials'
import {
  addProfileBinding,
  canAccessProfileScoped,
  canAccessTask,
  canSeeTaskEvent,
  filterAccessibleProfiles,
  getAccessibleProfiles,
  updateUserProfile,
} from '../server/user-profiles'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('user-credentials (Issue #8 Phase 2a)', () => {
  it('is single-user mode when HERMES_USERS is unset', () => {
    expect(isMultiUserMode()).toBe(false)
    expect(listConfiguredUsernames()).toEqual([])
  })

  it('parses HERMES_USERS pairs, splitting on the first colon only', () => {
    vi.stubEnv('HERMES_USERS', 'alice:s3cret, bob:pw:with:colons ,broken')
    expect(isMultiUserMode()).toBe(true)
    expect(listConfiguredUsernames()).toEqual(['alice', 'bob'])
    expect(verifyUserPassword('alice', 's3cret')).toBe(true)
    expect(verifyUserPassword('bob', 'pw:with:colons')).toBe(true)
    expect(verifyUserPassword('alice', 'wrong')).toBe(false)
    expect(verifyUserPassword('nobody', 's3cret')).toBe(false)
  })

  it('reads super admin usernames from HERMES_SUPER_ADMINS', () => {
    vi.stubEnv('HERMES_SUPER_ADMINS', 'alice, carol')
    const supers = superAdminUsernames()
    expect(supers.has('alice')).toBe(true)
    expect(supers.has('carol')).toBe(true)
    expect(supers.has('bob')).toBe(false)
  })
})

describe('canAccessTask in multi-user mode (fail closed)', () => {
  it('denies identity-less requests when HERMES_USERS is set', () => {
    vi.stubEnv('HERMES_USERS', 'alice:pw')
    expect(canAccessTask(null, { createdBy: 'alice' })).toBe(false)
    expect(canAccessTask(undefined, { createdBy: 'alice' })).toBe(false)
  })

  it('still allows identity-less requests in single-user mode', () => {
    expect(canAccessTask(null, { createdBy: 'anyone' })).toBe(true)
  })
})

describe('profile-bound task access (Issue #8 Phase 2d)', () => {
  it('grants a regular admin access via a bound profile', () => {
    updateUserProfile('binder', { role: 'regular_admin', profileIds: [] })
    addProfileBinding('binder', 'profile-x')
    expect(
      canAccessTask('binder', { createdBy: 'other', profileId: 'profile-x' }),
    ).toBe(true)
    expect(
      canAccessTask('binder', { createdBy: 'other', profileId: 'profile-y' }),
    ).toBe(false)
    expect(canAccessTask('binder', { createdBy: 'other' })).toBe(false)
  })

  it('returns null (= all profiles) for super admins, not []', () => {
    updateUserProfile('root-user', { role: 'super_admin' })
    expect(getAccessibleProfiles('root-user')).toBeNull()
    updateUserProfile('plain-user', {
      role: 'regular_admin',
      profileIds: ['p1'],
    })
    expect(getAccessibleProfiles('plain-user')).toEqual(['p1'])
  })
})

describe('canSeeTaskEvent (Issue #8 Phase 2b)', () => {
  it('passes non-task events through untouched', () => {
    expect(canSeeTaskEvent('anyone', 'tool', {})).toBe(true)
    expect(canSeeTaskEvent(null, 'user_message', {})).toBe(true)
  })

  it('lets owners and super admins see task events', () => {
    updateUserProfile('ev-super', { role: 'super_admin' })
    updateUserProfile('ev-owner', { role: 'regular_admin', profileIds: [] })
    const payload = { taskId: 't1', createdBy: 'ev-owner', profileId: null }
    expect(canSeeTaskEvent('ev-owner', 'task.created', payload)).toBe(true)
    expect(canSeeTaskEvent('ev-super', 'task.created', payload)).toBe(true)
  })

  it('hides foreign task events from regular admins', () => {
    updateUserProfile('ev-other', { role: 'regular_admin', profileIds: [] })
    expect(
      canSeeTaskEvent('ev-other', 'task.moved', {
        taskId: 't1',
        createdBy: 'someone-else',
      }),
    ).toBe(false)
  })

  it('fails closed on legacy payloads without createdBy', () => {
    updateUserProfile('ev-legacy', { role: 'regular_admin', profileIds: [] })
    expect(canSeeTaskEvent('ev-legacy', 'task.deleted', { taskId: 't9' })).toBe(
      false,
    )
    updateUserProfile('ev-root', { role: 'super_admin' })
    expect(canSeeTaskEvent('ev-root', 'task.deleted', { taskId: 't9' })).toBe(
      true,
    )
  })

  it('grants event visibility through profile bindings', () => {
    updateUserProfile('ev-bound', {
      role: 'regular_admin',
      profileIds: ['team-a'],
    })
    expect(
      canSeeTaskEvent('ev-bound', 'task.created', {
        taskId: 't2',
        createdBy: 'someone-else',
        profileId: 'team-a',
      }),
    ).toBe(true)
  })

  it('denies identity-less callers in multi-user mode', () => {
    vi.stubEnv('HERMES_USERS', 'alice:pw')
    expect(
      canSeeTaskEvent(undefined, 'task.created', {
        taskId: 't3',
        createdBy: 'alice',
      }),
    ).toBe(false)
  })
})

describe('profile visibility (Issue #8 — the issue\'s literal ask)', () => {
  it('is unrestricted in single-user mode, with or without an identity', () => {
    const profiles = [{ name: 'default' }, { name: 'research' }]
    expect(canAccessProfileScoped(null, 'research')).toBe(true)
    expect(canAccessProfileScoped(undefined, 'research')).toBe(true)
    expect(filterAccessibleProfiles(null, profiles)).toEqual(profiles)
  })

  it('fails closed for identity-less requests in multi-user mode', () => {
    vi.stubEnv('HERMES_USERS', 'alice:pw')
    expect(canAccessProfileScoped(null, 'research')).toBe(false)
    expect(filterAccessibleProfiles(null, [{ name: 'research' }])).toEqual([])
  })

  it('shows a regular admin only the profiles bound to their account', () => {
    vi.stubEnv('HERMES_USERS', 'bob:pw')
    updateUserProfile('profile-bob', { role: 'regular_admin', profileIds: [] })
    addProfileBinding('profile-bob', 'research')

    expect(canAccessProfileScoped('profile-bob', 'research')).toBe(true)
    expect(canAccessProfileScoped('profile-bob', 'secret')).toBe(false)
    expect(
      filterAccessibleProfiles('profile-bob', [
        { name: 'default' },
        { name: 'research' },
        { name: 'secret' },
      ]),
    ).toEqual([{ name: 'research' }])
  })

  it('shows a super admin every profile — null must not read as "none"', () => {
    vi.stubEnv('HERMES_USERS', 'alice:pw')
    updateUserProfile('profile-alice', { role: 'super_admin', profileIds: [] })

    expect(getAccessibleProfiles('profile-alice')).toBeNull()
    expect(canAccessProfileScoped('profile-alice', 'anything')).toBe(true)
    const all = [{ name: 'default' }, { name: 'research' }]
    expect(filterAccessibleProfiles('profile-alice', all)).toEqual(all)
  })
})
