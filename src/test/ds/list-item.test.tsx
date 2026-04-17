// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ListItem } from '@/components/ds/list-item'

describe('ListItem', () => {
  it('renders label', () => {
    render(<ListItem label="My Item" />)
    expect(screen.getByText('My Item')).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(<ListItem label="L" description="Detail text" />)
    expect(screen.getByText('Detail text')).toBeTruthy()
  })

  it('renders meta slot', () => {
    render(<ListItem label="L" meta={<span>12:00</span>} />)
    expect(screen.getByText('12:00')).toBeTruthy()
  })

  it('renders as button when onClick provided', () => {
    const handler = vi.fn()
    render(<ListItem label="L" onClick={handler} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('renders as div when no onClick', () => {
    const { container } = render(<ListItem label="L" />)
    expect(container.querySelector('div')).toBeTruthy()
    expect(container.querySelector('button')).toBeFalsy()
  })

  it('calls onClick when clicked', () => {
    const handler = vi.fn()
    render(<ListItem label="L" onClick={handler} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('applies active style when active=true', () => {
    const { container } = render(<ListItem label="L" active />)
    expect((container.firstChild as HTMLElement).className).toContain('--theme-accent-subtle')
  })
})
