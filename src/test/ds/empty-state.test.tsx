// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/ds/empty-state'

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState icon={<span>icon</span>} title="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeTruthy()
  })

  it('renders icon', () => {
    render(<EmptyState icon={<span>myicon</span>} title="T" />)
    expect(screen.getByText('myicon')).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(<EmptyState icon={<span />} title="T" description="Try adding one" />)
    expect(screen.getByText('Try adding one')).toBeTruthy()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState icon={<span />} title="T" action={<button>Create</button>} />
    )
    expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy()
  })

  it('does not render description when omitted', () => {
    const { container } = render(<EmptyState icon={<span />} title="T" />)
    expect(container.querySelectorAll('p').length).toBe(0)
  })
})
