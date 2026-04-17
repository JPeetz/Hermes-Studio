// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionHeader } from '@/components/ds/section-header'

describe('SectionHeader', () => {
  it('renders title', () => {
    render(<SectionHeader title="My Section" />)
    expect(screen.getByText('My Section')).toBeTruthy()
  })

  it('renders subtitle when provided', () => {
    render(<SectionHeader title="T" subtitle="Sub text" />)
    expect(screen.getByText('Sub text')).toBeTruthy()
  })

  it('renders action slot', () => {
    render(<SectionHeader title="T" action={<button>Add</button>} />)
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy()
  })

  it('renders divider by default', () => {
    const { container } = render(<SectionHeader title="T" />)
    expect(container.querySelector('.border-b')).toBeTruthy()
  })

  it('hides divider when divider=false', () => {
    const { container } = render(<SectionHeader title="T" divider={false} />)
    expect(container.querySelector('.border-b')).toBeFalsy()
  })
})
