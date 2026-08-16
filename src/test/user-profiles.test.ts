import { describe, expect, it } from 'vitest'
import {
  canAccessTask,
  updateUserProfile,
} from '../server/user-profiles'

describe('canAccessTask() (Issue #8)', () => {
  it('allows access in single-user mode (no userId)', () => {
    expect(canAccessTask(null, { createdBy: 'someone' })).toBe(true)
    expect(canAccessTask(undefined, { createdBy: 'someone' })).toBe(true)
  })

  it('allows a regular admin to access their own task', () => {
    expect(canAccessTask('user-a', { createdBy: 'user-a' })).toBe(true)
  })

  it('denies a regular admin access to a foreign task', () => {
    expect(canAccessTask('user-a', { createdBy: 'user-b' })).toBe(false)
  })

  it('denies a regular admin access to a task with no creator', () => {
    expect(canAccessTask('user-a', {})).toBe(false)
    expect(canAccessTask('user-a', { createdBy: null })).toBe(false)
  })

  it('allows a super admin to access any task', () => {
    updateUserProfile('boss-user', { role: 'super_admin' })
    expect(canAccessTask('boss-user', { createdBy: 'user-b' })).toBe(true)
    expect(canAccessTask('boss-user', {})).toBe(true)
  })
})
