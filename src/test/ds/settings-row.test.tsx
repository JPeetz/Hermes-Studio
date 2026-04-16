// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsRow } from '@/components/ds/settings-row'

describe('SettingsRow', () => {
  it('renders the label', () => {
    render(<SettingsRow label="My Setting"><input /></SettingsRow>)
    expect(screen.getByText('My Setting')).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(<SettingsRow label="L" description="Help text"><input /></SettingsRow>)
    expect(screen.getByText('Help text')).toBeTruthy()
  })

  it('renders children in the control slot', () => {
    render(<SettingsRow label="L"><button>Save</button></SettingsRow>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('applies danger border when danger=true', () => {
    const { container } = render(
      <SettingsRow label="L" danger><input /></SettingsRow>
    )
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('--theme-danger')
  })

  it('does not apply danger border by default', () => {
    const { container } = render(<SettingsRow label="L"><input /></SettingsRow>)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toContain('--theme-danger')
  })
})
