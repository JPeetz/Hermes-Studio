// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ds/card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>hello</Card>)
    expect(screen.getByText('hello')).toBeTruthy()
  })

  it('applies default variant classes', () => {
    const { container } = render(<Card>content</Card>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('--theme-card')
    expect(el.className).toContain('--theme-border')
  })

  it('applies panel variant', () => {
    const { container } = render(<Card variant="panel">content</Card>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('--theme-panel')
  })

  it('applies subtle variant', () => {
    const { container } = render(<Card variant="subtle">content</Card>)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('--theme-accent-subtle')
  })

  it('renders header slot', () => {
    render(<Card header={<span>Header</span>}>body</Card>)
    expect(screen.getByText('Header')).toBeTruthy()
  })

  it('renders footer slot', () => {
    render(<Card footer={<span>Footer</span>}>body</Card>)
    expect(screen.getByText('Footer')).toBeTruthy()
  })

  it('forwards className', () => {
    const { container } = render(<Card className="custom-class">body</Card>)
    expect((container.firstChild as HTMLElement).className).toContain('custom-class')
  })
})
