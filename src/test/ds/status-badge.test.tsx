// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/ds/status-badge'

describe('StatusBadge', () => {
  it('shows default label for running', () => {
    render(<StatusBadge status="running" />)
    expect(screen.getByText('Running')).toBeTruthy()
  })

  it('shows default label for success', () => {
    render(<StatusBadge status="success" />)
    expect(screen.getByText('Success')).toBeTruthy()
  })

  it('shows default label for error', () => {
    render(<StatusBadge status="error" />)
    expect(screen.getByText('Error')).toBeTruthy()
  })

  it('shows default label for warning', () => {
    render(<StatusBadge status="warning" />)
    expect(screen.getByText('Warning')).toBeTruthy()
  })

  it('shows default label for idle', () => {
    render(<StatusBadge status="idle" />)
    expect(screen.getByText('Idle')).toBeTruthy()
  })

  it('shows default label for pending', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeTruthy()
  })

  it('uses custom label when provided', () => {
    render(<StatusBadge status="success" label="Done" />)
    expect(screen.getByText('Done')).toBeTruthy()
    expect(screen.queryByText('Success')).toBeFalsy()
  })
})
