# Design System Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify Hermes Studio's visual design by building 6 canonical DS components and migrating all screens to use them and `var(--theme-*)` CSS variables exclusively.

**Architecture:** A thin `src/components/ds/` library of 6 presentational components (Card, SettingsRow, SectionHeader, StatusBadge, ListItem, EmptyState) replaces the 3 inconsistent styling paradigms currently spread across screens. Phase 1 builds the foundation; Phase 2 fixes theme-breaking screens; Phase 3 finishes the consistency pass.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, `@hugeicons/react` + `@hugeicons/core-free-icons`, vitest + @testing-library/react (already installed)

**Reference implementations (already correct — match these):**
- `src/screens/dashboard/dashboard-screen.tsx`
- `src/screens/agents/agent-library-screen.tsx`

---

## File Map

### Created
- `src/components/ds/card.tsx`
- `src/components/ds/settings-row.tsx`
- `src/components/ds/section-header.tsx`
- `src/components/ds/status-badge.tsx`
- `src/components/ds/list-item.tsx`
- `src/components/ds/empty-state.tsx`
- `src/components/ds/index.ts`
- `src/test/ds/card.test.tsx`
- `src/test/ds/settings-row.test.tsx`
- `src/test/ds/section-header.test.tsx`
- `src/test/ds/status-badge.test.tsx`
- `src/test/ds/list-item.test.tsx`
- `src/test/ds/empty-state.test.tsx`

### Modified
- `vitest.config.ts` — include `.test.tsx`, add React plugin
- `src/styles.css` — add `--theme-hover` to all 9 themes
- `src/routes/settings/index.tsx` — full CSS + component migration
- `src/screens/settings/providers-screen.tsx` — CSS + component migration
- `src/screens/settings/components/provider-wizard.tsx` — CSS fix
- `src/screens/chat/components/chat-composer.tsx` — CSS fix
- `src/screens/chat/components/chat-header.tsx` — CSS fix
- `src/screens/memory/memory-browser-screen.tsx` — CSS + component migration
- `src/screens/memory/knowledge-browser-screen.tsx` — CSS + component migration
- `src/screens/profiles/profiles-screen.tsx` — CSS fix
- `src/screens/skills/skills-screen.tsx` — CSS + component migration
- `src/screens/skills/workspace-skills-screen.tsx` — CSS fix
- `src/screens/jobs/jobs-screen.tsx` — StatusBadge + ListItem migration
- `src/screens/audit/audit-trail-screen.tsx` — spot-check
- `src/screens/crews/crews-screen.tsx` — spot-check
- `src/screens/files/files-screen.tsx` — CSS fix

---

## CSS Variable Canonical Mapping (reference throughout all tasks)

| Replace this | With this |
|---|---|
| `bg-white` | `bg-[var(--theme-card)]` |
| `bg-primary-50` | `bg-[var(--theme-bg)]` |
| `bg-primary-100` | `bg-[var(--theme-panel)]` |
| `border-primary-200` | `border-[var(--theme-border)]` |
| `border-primary-300` | `border-[var(--theme-border)]` |
| `text-primary-900` | `text-[var(--theme-text)]` |
| `text-black` | `text-[var(--theme-text)]` |
| `text-neutral-400` | `text-[var(--theme-muted)]` |
| `bg-accent-500` | `bg-[var(--theme-accent)]` |
| `hover:bg-primary-100` | `hover:bg-[var(--theme-hover)]` |
| `bg-white/5`, `bg-white/10` | `bg-[var(--theme-accent-subtle)]` |
| `border-neutral-200` | `border-[var(--theme-border)]` |
| `dark:bg-neutral-900` | remove — `--theme-card` already handles dark |
| `dark:border-neutral-800` | remove — `--theme-border` already handles dark |
| `bg-surface` | `bg-[var(--theme-bg)]` |

---

## PHASE 1 — Foundation

---

### Task 1: Prepare vitest for TSX + add --theme-hover

**Files:**
- Modify: `vitest.config.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Update vitest.config.ts to handle .tsx test files**

Replace the entire file:

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.ts', 'src/test/**/*.test.tsx'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Run existing tests to confirm they still pass**

```bash
cd ~/Hermes-Studio && npm test
```

Expected: 23 tests pass (same as before).

- [ ] **Step 3: Add --theme-hover to styles.css**

Open `src/styles.css`. For every theme block (`[data-theme='hermes-os']`, `[data-theme='hermes-official']`, `[data-theme='hermes-classic']`, `[data-theme='hermes-slate']`, `[data-theme='hermes-mono']`, `[data-theme='hermes-official-light']`, `[data-theme='hermes-classic-light']`, `[data-theme='hermes-slate-light']`, `[data-theme='hermes-mono-light']`), find the `--theme-card2` line and add `--theme-hover` immediately after it with the same value. Example for `hermes-os`:

```css
[data-theme='hermes-os'] {
  /* ... existing vars ... */
  --theme-card2: #121e30;
  --theme-hover: #121e30;   /* ← add this line after --theme-card2 */
  /* ... rest ... */
}
```

Repeat for all 9 themes, setting `--theme-hover` to the same value as `--theme-card2` in each.

- [ ] **Step 4: Verify all 9 themes got the new variable**

```bash
grep -c 'theme-hover' ~/Hermes-Studio/src/styles.css
```

Expected output: `9`

- [ ] **Step 5: Commit**

```bash
cd ~/Hermes-Studio && git add vitest.config.ts src/styles.css && git commit -m "chore(ds): add --theme-hover token to all themes, enable tsx in vitest"
```

---

### Task 2: Card component

**Files:**
- Create: `src/components/ds/card.tsx`
- Create: `src/test/ds/card.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/ds/card.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'Card|FAIL|pass'
```

Expected: `Cannot find module '@/components/ds/card'`

- [ ] **Step 3: Implement Card**

Create `src/components/ds/card.tsx`:

```tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  variant?: 'default' | 'panel' | 'subtle'
  header?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}

const variantStyles = {
  default: 'bg-[var(--theme-card)] border-[var(--theme-border)]',
  panel:   'bg-[var(--theme-panel)] border-[var(--theme-border)]',
  subtle:  'bg-[var(--theme-accent-subtle)] border-[var(--theme-accent-border)]',
}

export function Card({ variant = 'default', header, footer, className, children }: CardProps) {
  return (
    <div className={cn('rounded-lg border', variantStyles[variant], className)}>
      {header && (
        <div className="border-b border-[var(--theme-border)] px-4 py-3">
          {header}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="border-t border-[var(--theme-border)] px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'Card|pass|fail'
```

Expected: 7 Card tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Hermes-Studio && git add src/components/ds/card.tsx src/test/ds/card.test.tsx && git commit -m "feat(ds): Card component"
```

---

### Task 3: SettingsRow component

**Files:**
- Create: `src/components/ds/settings-row.tsx`
- Create: `src/test/ds/settings-row.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/ds/settings-row.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'SettingsRow|fail'
```

Expected: `Cannot find module '@/components/ds/settings-row'`

- [ ] **Step 3: Implement SettingsRow**

Create `src/components/ds/settings-row.tsx`:

```tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SettingsRowProps {
  label: string
  description?: string
  danger?: boolean
  children: ReactNode
}

export function SettingsRow({ label, description, danger = false, children }: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 border-l-2',
        danger ? 'border-l-[var(--theme-danger)]' : 'border-l-transparent',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--theme-text)]">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-[var(--theme-muted)]">{description}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'SettingsRow|pass|fail'
```

Expected: 5 SettingsRow tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Hermes-Studio && git add src/components/ds/settings-row.tsx src/test/ds/settings-row.test.tsx && git commit -m "feat(ds): SettingsRow component"
```

---

### Task 4: SectionHeader component

**Files:**
- Create: `src/components/ds/section-header.tsx`
- Create: `src/test/ds/section-header.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/ds/section-header.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'SectionHeader|fail'
```

- [ ] **Step 3: Implement SectionHeader**

Create `src/components/ds/section-header.tsx`:

```tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  divider?: boolean
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  action,
  divider = true,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--theme-muted)]">
          {title}
        </h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {divider && <div className="mt-2 border-b border-[var(--theme-border)]" />}
      {subtitle && (
        <p className="mt-2 text-xs text-[var(--theme-muted)]">{subtitle}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'SectionHeader|pass|fail'
```

Expected: 5 SectionHeader tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Hermes-Studio && git add src/components/ds/section-header.tsx src/test/ds/section-header.test.tsx && git commit -m "feat(ds): SectionHeader component"
```

---

### Task 5: StatusBadge component

**Files:**
- Create: `src/components/ds/status-badge.tsx`
- Create: `src/test/ds/status-badge.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/ds/status-badge.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'StatusBadge|fail'
```

- [ ] **Step 3: Implement StatusBadge**

Create `src/components/ds/status-badge.tsx`:

```tsx
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Loading03Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Alert02Icon,
  MinusSignCircleIcon,
  Clock01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

export type Status = 'running' | 'success' | 'error' | 'warning' | 'idle' | 'pending'

interface StatusBadgeProps {
  status: Status
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<
  Status,
  { icon: object; colorVar: string; defaultLabel: string; spin?: boolean }
> = {
  running: { icon: Loading03Icon,          colorVar: 'var(--theme-active)',   defaultLabel: 'Running', spin: true },
  success: { icon: CheckmarkCircle01Icon,  colorVar: 'var(--theme-success)',  defaultLabel: 'Success' },
  error:   { icon: Cancel01Icon,           colorVar: 'var(--theme-danger)',   defaultLabel: 'Error' },
  warning: { icon: Alert02Icon,            colorVar: 'var(--theme-warning)',  defaultLabel: 'Warning' },
  idle:    { icon: MinusSignCircleIcon,    colorVar: 'var(--theme-muted)',    defaultLabel: 'Idle' },
  pending: { icon: Clock01Icon,            colorVar: 'var(--theme-muted)',    defaultLabel: 'Pending' },
}

export function StatusBadge({ status, label, size = 'sm', className }: StatusBadgeProps) {
  const { icon, colorVar, defaultLabel, spin } = statusConfig[status]
  const iconSize = size === 'sm' ? 14 : 16
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      style={{ color: colorVar }}
    >
      <span className={cn(spin && 'animate-spin')}>
        <HugeiconsIcon icon={icon} size={iconSize} />
      </span>
      <span className={textClass}>{label ?? defaultLabel}</span>
    </span>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'StatusBadge|pass|fail'
```

Expected: 7 StatusBadge tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Hermes-Studio && git add src/components/ds/status-badge.tsx src/test/ds/status-badge.test.tsx && git commit -m "feat(ds): StatusBadge component"
```

---

### Task 6: ListItem component

**Files:**
- Create: `src/components/ds/list-item.tsx`
- Create: `src/test/ds/list-item.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/ds/list-item.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'ListItem|fail'
```

- [ ] **Step 3: Implement ListItem**

Create `src/components/ds/list-item.tsx`:

```tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ListItemProps {
  icon?: ReactNode
  label: string
  description?: string
  meta?: ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
}

export function ListItem({
  icon,
  label,
  description,
  meta,
  onClick,
  active = false,
  className,
}: ListItemProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
        active
          ? 'bg-[var(--theme-accent-subtle)]'
          : 'hover:bg-[var(--theme-hover)]',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {icon && (
        <span className="mt-0.5 shrink-0 text-[var(--theme-muted)]">{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-[var(--theme-text)]">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block truncate text-xs text-[var(--theme-muted)]">
            {description}
          </span>
        )}
      </span>
      {meta && <span className="ml-2 shrink-0">{meta}</span>}
    </Tag>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'ListItem|pass|fail'
```

Expected: 7 ListItem tests pass.

- [ ] **Step 5: Commit**

```bash
cd ~/Hermes-Studio && git add src/components/ds/list-item.tsx src/test/ds/list-item.test.tsx && git commit -m "feat(ds): ListItem component"
```

---

### Task 7: EmptyState component

**Files:**
- Create: `src/components/ds/empty-state.tsx`
- Create: `src/test/ds/empty-state.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/ds/empty-state.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose 2>&1 | grep -E 'EmptyState|fail'
```

- [ ] **Step 3: Implement EmptyState**

Create `src/components/ds/empty-state.tsx`:

```tsx
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className,
      )}
    >
      <div className="mb-4 text-[var(--theme-muted)] opacity-40">{icon}</div>
      <h3 className="mb-1 text-sm font-medium text-[var(--theme-text)]">{title}</h3>
      {description && (
        <p className="mb-4 max-w-xs text-xs text-[var(--theme-muted)]">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
cd ~/Hermes-Studio && npm test -- --reporter=verbose
```

Expected: all 23 original tests + 37 new DS tests = **60 tests pass**.

- [ ] **Step 5: Commit**

```bash
cd ~/Hermes-Studio && git add src/components/ds/empty-state.tsx src/test/ds/empty-state.test.tsx && git commit -m "feat(ds): EmptyState component"
```

---

### Task 8: Barrel export + Phase 1 build verification

**Files:**
- Create: `src/components/ds/index.ts`

- [ ] **Step 1: Create barrel export**

Create `src/components/ds/index.ts`:

```typescript
export { Card } from './card'
export { SettingsRow } from './settings-row'
export { SectionHeader } from './section-header'
export { StatusBadge } from './status-badge'
export type { Status } from './status-badge'
export { ListItem } from './list-item'
export { EmptyState } from './empty-state'
```

- [ ] **Step 2: Verify TypeScript is clean for all new files**

```bash
cd ~/Hermes-Studio && npx tsc --noEmit 2>&1 | grep 'components/ds'
```

Expected: no output (no errors in ds/ files).

- [ ] **Step 3: Verify build is clean**

```bash
cd ~/Hermes-Studio && npm run build 2>&1 | tail -3
```

Expected: `✓ built in X.XXs`

- [ ] **Step 4: Commit**

```bash
cd ~/Hermes-Studio && git add src/components/ds/index.ts && git commit -m "feat(ds): barrel export — Phase 1 foundation complete"
```

---

## PHASE 2 — Critical screens (theme-breaking in dark mode)

---

### Task 9: Migrate src/routes/settings/index.tsx

This is the largest file (~3000 lines). It uses `primary-*` palette throughout and has no DS components. The approach is: replace palette classes with CSS vars, then wrap grouped settings rows in `<Card>` + `<SettingsRow>`, and replace section titles with `<SectionHeader>`.

**Files:**
- Modify: `src/routes/settings/index.tsx`

- [ ] **Step 1: Add DS imports to the top of the file**

Find the existing imports block at the top of `src/routes/settings/index.tsx`. Add after the last import line:

```tsx
import { Card, SettingsRow, SectionHeader } from '@/components/ds'
```

- [ ] **Step 2: Run grep to baseline all broken classes**

```bash
grep -n 'bg-primary-\|border-primary-\|text-primary-9\|text-black\|bg-white\|bg-surface\|bg-accent-500' ~/Hermes-Studio/src/routes/settings/index.tsx | wc -l
```

Note the count. After the migration, re-running this should return 0.

- [ ] **Step 3: Apply CSS variable replacements**

Use these exact sed replacements in order:

```bash
cd ~/Hermes-Studio
sed -i \
  -e 's/bg-primary-50\/80/bg-\[var(--theme-panel)\]/g' \
  -e 's/bg-primary-50/bg-\[var(--theme-bg)\]/g' \
  -e 's/bg-primary-100/bg-\[var(--theme-panel)\]/g' \
  -e 's/border-primary-200/border-\[var(--theme-border)\]/g' \
  -e 's/border-primary-300/border-\[var(--theme-border)\]/g' \
  -e 's/text-primary-900/text-\[var(--theme-text)\]/g' \
  -e 's/text-primary-700/text-\[var(--theme-text)\]/g' \
  -e 's/text-primary-600/text-\[var(--theme-muted)\]/g' \
  -e 's/bg-accent-500/bg-\[var(--theme-accent)\]/g' \
  -e 's/text-black/text-\[var(--theme-text)\]/g' \
  -e 's/bg-white/bg-\[var(--theme-card)\]/g' \
  -e 's/bg-surface/bg-\[var(--theme-bg)\]/g' \
  src/routes/settings/index.tsx
```

- [ ] **Step 4: Verify replacements landed correctly**

```bash
grep -n 'bg-primary-\|border-primary-\|text-primary-9\|text-black\|bg-white\b\|bg-surface\|bg-accent-500' ~/Hermes-Studio/src/routes/settings/index.tsx | wc -l
```

Expected: `0`

- [ ] **Step 5: Migrate section headers to SectionHeader**

In `src/routes/settings/index.tsx`, find all section title patterns. They look like:

```tsx
<div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-muted)]">
  General
</div>
```

or variations on that theme. Replace each with:

```tsx
<SectionHeader title="General" />
```

The title text is whatever was in the existing heading. Do this for every section heading in the file.

- [ ] **Step 6: Migrate settings rows to SettingsRow**

Settings rows in the file look like:

```tsx
<div className="flex items-center justify-between px-4 py-3">
  <div>
    <div className="text-sm font-medium ...">Label text</div>
    <div className="text-xs text-[var(--theme-muted)]">Description</div>
  </div>
  <div>{/* control */}</div>
</div>
```

Replace each with:

```tsx
<SettingsRow label="Label text" description="Description">
  {/* control */}
</SettingsRow>
```

For rows with no description, omit the `description` prop. For rows that control a destructive action (e.g. "Reset all settings", "Delete profile"), add `danger`.

- [ ] **Step 7: Wrap settings groups in Card**

Groups of `<SettingsRow>` that are visually separated from each other should be wrapped in a `<Card>`:

```tsx
<Card>
  <SettingsRow label="Approval mode" description="...">
    {/* select */}
  </SettingsRow>
  <SettingsRow label="Timeout" description="...">
    {/* input */}
  </SettingsRow>
</Card>
```

- [ ] **Step 8: TypeScript check**

```bash
cd ~/Hermes-Studio && npx tsc --noEmit 2>&1 | grep 'settings/index'
```

Expected: no output. Fix any type errors before continuing.

- [ ] **Step 9: Build check**

```bash
cd ~/Hermes-Studio && npm run build 2>&1 | tail -3
```

Expected: `✓ built in X.XXs`

- [ ] **Step 10: Commit**

```bash
cd ~/Hermes-Studio && git add src/routes/settings/index.tsx && git commit -m "refactor(settings): migrate to DS components and CSS vars"
```

---

### Task 10: Migrate providers-screen.tsx + provider-wizard.tsx

**Files:**
- Modify: `src/screens/settings/providers-screen.tsx`
- Modify: `src/screens/settings/components/provider-wizard.tsx`

- [ ] **Step 1: Add DS imports to providers-screen.tsx**

```tsx
import { Card, SettingsRow, SectionHeader } from '@/components/ds'
```

- [ ] **Step 2: Apply CSS var replacements to both files**

```bash
cd ~/Hermes-Studio
for f in src/screens/settings/providers-screen.tsx src/screens/settings/components/provider-wizard.tsx; do
  sed -i \
    -e 's/bg-primary-50\/80/bg-\[var(--theme-panel)\]/g' \
    -e 's/bg-primary-50/bg-\[var(--theme-bg)\]/g' \
    -e 's/bg-primary-100/bg-\[var(--theme-panel)\]/g' \
    -e 's/border-primary-200/border-\[var(--theme-border)\]/g' \
    -e 's/border-primary-300/border-\[var(--theme-border)\]/g' \
    -e 's/text-primary-900/text-\[var(--theme-text)\]/g' \
    -e 's/text-primary-700/text-\[var(--theme-text)\]/g' \
    -e 's/bg-accent-500/bg-\[var(--theme-accent)\]/g' \
    -e 's/text-black/text-\[var(--theme-text)\]/g' \
    -e 's/bg-white/bg-\[var(--theme-card)\]/g' \
    -e 's/border-neutral-200/border-\[var(--theme-border)\]/g' \
    -e 's/dark:bg-neutral-900//g' \
    -e 's/dark:border-neutral-800//g' \
    "$f"
done
```

- [ ] **Step 3: Replace provider cards and rows with DS components**

In `providers-screen.tsx`, provider entries are displayed as cards. Replace the outer container div of each provider card with `<Card>`. Replace any label+control rows within provider settings with `<SettingsRow>`.

- [ ] **Step 4: Fix input and textarea backgrounds in provider-wizard.tsx**

Find all `<input>` and `<textarea>` elements in `provider-wizard.tsx` that have inline or class-based background styles. Apply consistent classes:

```tsx
className="w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
```

Apply this same pattern to every `<input>` and `<textarea>` in the wizard.

- [ ] **Step 5: TypeScript + build check**

```bash
cd ~/Hermes-Studio && npx tsc --noEmit 2>&1 | grep -E 'providers|provider-wizard' && npm run build 2>&1 | tail -3
```

Expected: no TS errors, clean build.

- [ ] **Step 6: Commit**

```bash
cd ~/Hermes-Studio && git add src/screens/settings/providers-screen.tsx src/screens/settings/components/provider-wizard.tsx && git commit -m "refactor(providers): migrate to DS components and CSS vars"
```

---

### Task 11: Fix chat-composer.tsx + chat-header.tsx

**Files:**
- Modify: `src/screens/chat/components/chat-composer.tsx`
- Modify: `src/screens/chat/components/chat-header.tsx`

- [ ] **Step 1: Apply CSS var replacements**

```bash
cd ~/Hermes-Studio
for f in src/screens/chat/components/chat-composer.tsx src/screens/chat/components/chat-header.tsx; do
  sed -i \
    -e 's/bg-neutral-100/bg-\[var(--theme-panel)\]/g' \
    -e 's/bg-white\/10/bg-\[var(--theme-accent-subtle)\]/g' \
    -e 's/bg-white\/5/bg-\[var(--theme-accent-subtle)\]/g' \
    -e 's/bg-white/bg-\[var(--theme-card)\]/g' \
    -e 's/border-neutral-200/border-\[var(--theme-border)\]/g' \
    -e 's/hover:bg-primary-100/hover:bg-\[var(--theme-hover)\]/g' \
    -e 's/active:bg-white\/10/active:bg-\[var(--theme-hover)\]/g' \
    -e 's/dark:bg-neutral-900//g' \
    -e 's/dark:bg-white\/10//g' \
    "$f"
done
```

- [ ] **Step 2: Manually review both files for any remaining hardcoded colors**

```bash
grep -n 'bg-white\|bg-neutral\|border-neutral\|text-black\|primary-\|bg-gray' \
  ~/Hermes-Studio/src/screens/chat/components/chat-composer.tsx \
  ~/Hermes-Studio/src/screens/chat/components/chat-header.tsx
```

Expected: no output. Fix any remaining hits manually.

- [ ] **Step 3: TypeScript + build check**

```bash
cd ~/Hermes-Studio && npx tsc --noEmit 2>&1 | grep 'chat-composer\|chat-header' && npm run build 2>&1 | tail -3
```

- [ ] **Step 4: Commit**

```bash
cd ~/Hermes-Studio && git add src/screens/chat/components/chat-composer.tsx src/screens/chat/components/chat-header.tsx && git commit -m "fix(chat): remove hardcoded colors from composer and header"
```

---

### Task 12: Migrate memory-browser-screen.tsx + knowledge-browser-screen.tsx

**Files:**
- Modify: `src/screens/memory/memory-browser-screen.tsx`
- Modify: `src/screens/memory/knowledge-browser-screen.tsx`

- [ ] **Step 1: Add DS imports to both files**

At the top of each file, add:

```tsx
import { Card, ListItem, EmptyState, SectionHeader } from '@/components/ds'
```

- [ ] **Step 2: Apply CSS var replacements to both files**

```bash
cd ~/Hermes-Studio
for f in src/screens/memory/memory-browser-screen.tsx src/screens/memory/knowledge-browser-screen.tsx; do
  sed -i \
    -e 's/border-primary-200 bg-primary-50\/80/border-\[var(--theme-border)\] bg-\[var(--theme-panel)\]/g' \
    -e 's/border-primary-200 bg-primary-50/border-\[var(--theme-border)\] bg-\[var(--theme-bg)\]/g' \
    -e 's/bg-primary-50\/80/bg-\[var(--theme-panel)\]/g' \
    -e 's/bg-primary-50/bg-\[var(--theme-bg)\]/g' \
    -e 's/bg-primary-100/bg-\[var(--theme-panel)\]/g' \
    -e 's/border-primary-200/border-\[var(--theme-border)\]/g' \
    -e 's/text-primary-900/text-\[var(--theme-text)\]/g' \
    -e 's/text-black/text-\[var(--theme-text)\]/g' \
    -e 's/bg-accent-500/bg-\[var(--theme-accent)\]/g' \
    -e 's/dark:border-neutral-800//g' \
    -e 's/dark:bg-neutral-950//g' \
    "$f"
done
```

- [ ] **Step 3: Replace ad-hoc list rows with ListItem**

In both files, find list entries that display a memory file or knowledge page. They look like:

```tsx
<div
  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-..."
  onClick={() => selectItem(item)}
>
  <SomeIcon size={14} />
  <span className="text-sm truncate">{item.name}</span>
  <span className="ml-auto text-xs text-...">{item.modified}</span>
</div>
```

Replace each with:

```tsx
<ListItem
  icon={<HugeiconsIcon icon={SomeIcon} size={14} />}
  label={item.name}
  meta={<span className="text-xs text-[var(--theme-muted)]">{item.modified}</span>}
  onClick={() => selectItem(item)}
  active={selectedItem?.id === item.id}
/>
```

- [ ] **Step 4: Replace ad-hoc empty states with EmptyState**

In `memory-browser-screen.tsx`, find the "no memories" placeholder and replace with:

```tsx
<EmptyState
  icon={<HugeiconsIcon icon={File01Icon} size={40} />}
  title="No memory files"
  description="Memory files will appear here when the agent creates them."
/>
```

In `knowledge-browser-screen.tsx`, find the "no pages" placeholder and replace with:

```tsx
<EmptyState
  icon={<HugeiconsIcon icon={BookOpenIcon} size={40} />}
  title="No knowledge pages"
  description="Add markdown files to the agent's knowledge directory to see them here."
/>
```

`File01Icon` is already imported in memory-browser-screen.tsx. For `BookOpenIcon`, check it exists first:
```bash
node -e "import('@hugeicons/core-free-icons').then(m => console.log('BookOpenIcon' in m))"
```
If it returns `false`, use `NoteIcon` or `FileTextIcon` — whichever exists in the package.

- [ ] **Step 5: TypeScript + build check**

```bash
cd ~/Hermes-Studio && npx tsc --noEmit 2>&1 | grep 'memory-browser\|knowledge-browser' && npm run build 2>&1 | tail -3
```

- [ ] **Step 6: Commit**

```bash
cd ~/Hermes-Studio && git add src/screens/memory/memory-browser-screen.tsx src/screens/memory/knowledge-browser-screen.tsx && git commit -m "refactor(memory): migrate to DS components and CSS vars"
```

---

## PHASE 3 — Consistency pass

---

### Task 13: Fix profiles-screen.tsx

**Files:**
- Modify: `src/screens/profiles/profiles-screen.tsx`

- [ ] **Step 1: Apply CSS var replacements**

```bash
cd ~/Hermes-Studio
sed -i \
  -e 's/border-white/border-\[var(--theme-border)\]/g' \
  -e 's/border-primary-50/border-\[var(--theme-border)\]/g' \
  -e 's/border-primary-200/border-\[var(--theme-border)\]/g' \
  -e 's/bg-primary-100\/60/bg-\[var(--theme-panel)\]/g' \
  -e 's/bg-primary-50\/80/bg-\[var(--theme-panel)\]/g' \
  -e 's/bg-primary-50/bg-\[var(--theme-bg)\]/g' \
  -e 's/text-primary-700/text-\[var(--theme-text)\]/g' \
  -e 's/text-primary-600/text-\[var(--theme-muted)\]/g' \
  -e 's/bg-emerald-500/bg-\[var(--theme-success)\]/g' \
  src/screens/profiles/profiles-screen.tsx
```

- [ ] **Step 2: Verify no remaining palette classes**

```bash
grep -n 'bg-primary-\|border-primary-\|border-white\b\|text-primary-\|bg-emerald' ~/Hermes-Studio/src/screens/profiles/profiles-screen.tsx
```

Expected: no output.

- [ ] **Step 3: TypeScript + build check**

```bash
cd ~/Hermes-Studio && npx tsc --noEmit 2>&1 | grep 'profiles-screen' && npm run build 2>&1 | tail -3
```

- [ ] **Step 4: Commit**

```bash
cd ~/Hermes-Studio && git add src/screens/profiles/profiles-screen.tsx && git commit -m "fix(profiles): remove hardcoded palette colors"
```

---

### Task 14: Migrate skills-screen.tsx + workspace-skills-screen.tsx

**Files:**
- Modify: `src/screens/skills/skills-screen.tsx`
- Modify: `src/screens/skills/workspace-skills-screen.tsx`

- [ ] **Step 1: Add DS imports**

Add to the imports of both files:

```tsx
import { Card, EmptyState } from '@/components/ds'
```

- [ ] **Step 2: Apply CSS var replacements**

```bash
cd ~/Hermes-Studio
for f in src/screens/skills/skills-screen.tsx src/screens/skills/workspace-skills-screen.tsx; do
  sed -i \
    -e 's/border-primary-200 bg-primary-50\/80/border-\[var(--theme-border)\] bg-\[var(--theme-panel)\]/g' \
    -e 's/border-primary-200 bg-primary-50/border-\[var(--theme-border)\] bg-\[var(--theme-bg)\]/g' \
    -e 's/bg-primary-50\/80/bg-\[var(--theme-panel)\]/g' \
    -e 's/bg-primary-50/bg-\[var(--theme-bg)\]/g' \
    -e 's/border-primary-200/border-\[var(--theme-border)\]/g' \
    -e 's/text-primary-900/text-\[var(--theme-text)\]/g' \
    "$f"
done
```

- [ ] **Step 3: Replace skill cards with Card component**

Skill list items that are displayed as bordered cards — replace their container div with `<Card>`:

```tsx
// Before
<div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-4">
  ...
</div>

// After
<Card>
  ...
</Card>
```

- [ ] **Step 4: Replace empty state**

Find the "no skills" empty state div in both files and replace with:

```tsx
<EmptyState
  icon={<HugeiconsIcon icon={PuzzleIcon} size={40} />}
  title="No skills found"
  description="Install skills from the marketplace to extend agent capabilities."
/>
```

`PuzzleIcon` is already imported in skills-screen.tsx. Use it.

- [ ] **Step 5: TypeScript + build check**

```bash
cd ~/Hermes-Studio && npx tsc --noEmit 2>&1 | grep 'skills-screen\|workspace-skills' && npm run build 2>&1 | tail -3
```

- [ ] **Step 6: Commit**

```bash
cd ~/Hermes-Studio && git add src/screens/skills/skills-screen.tsx src/screens/skills/workspace-skills-screen.tsx && git commit -m "refactor(skills): migrate to DS components and CSS vars"
```

---

### Task 15: Migrate jobs-screen.tsx

**Files:**
- Modify: `src/screens/jobs/jobs-screen.tsx`

- [ ] **Step 1: Add DS imports**

```tsx
import { StatusBadge, ListItem, EmptyState } from '@/components/ds'
import type { Status } from '@/components/ds'
```

- [ ] **Step 2: Replace emoji status strings with StatusBadge**

Find all occurrences of emoji-based status formatting in the run event log. They look like:

```tsx
const label =
  ev.status === 'complete' ? `✓ ${ev.name}` :
  ev.status === 'error'    ? `✗ ${ev.name} failed` :
                             `⚙ ${ev.name}...`
```

Replace the entire label-building pattern with a `<StatusBadge>` component rendered inline:

```tsx
const statusForEvent = (ev: RunEvent): Status =>
  ev.status === 'complete' ? 'success' :
  ev.status === 'error'    ? 'error' :
  ev.phase === 'start'     ? 'pending' : 'running'

// In JSX, replace the emoji string span with:
<StatusBadge status={statusForEvent(ev)} label={ev.name} />
```

- [ ] **Step 3: Replace run history list rows with ListItem**

Find run history entries rendered as divs with icon + text. Replace with:

```tsx
<ListItem
  icon={<StatusBadge status={run.status === 'success' ? 'success' : 'error'} />}
  label={run.summary ?? 'Run completed'}
  description={new Date(run.completedAt).toLocaleString()}
  meta={run.duration ? <span className="text-xs text-[var(--theme-muted)]">{run.duration}</span> : undefined}
/>
```

- [ ] **Step 4: Replace empty run history state**

Find the "no run history" placeholder and replace with:

```tsx
<EmptyState
  icon={<HugeiconsIcon icon={Clock01Icon} size={32} />}
  title="No runs yet"
  description="Trigger this job to see run history here."
/>
```

Import `Clock01Icon` from `@hugeicons/core-free-icons` if not already imported.

- [ ] **Step 5: Fix remaining CSS**

```bash
cd ~/Hermes-Studio
grep -n 'bg-white\|primary-\|text-black\|border-neutral' src/screens/jobs/jobs-screen.tsx
```

Fix any remaining hits manually.

- [ ] **Step 6: TypeScript + build check**

```bash
cd ~/Hermes-Studio && npx tsc --noEmit 2>&1 | grep 'jobs-screen' && npm run build 2>&1 | tail -3
```

- [ ] **Step 7: Commit**

```bash
cd ~/Hermes-Studio && git add src/screens/jobs/jobs-screen.tsx && git commit -m "refactor(jobs): StatusBadge + ListItem + EmptyState migration"
```

---

### Task 16: Spot-check remaining screens

**Files:**
- Modify: `src/screens/audit/audit-trail-screen.tsx`
- Modify: `src/screens/crews/crews-screen.tsx`
- Modify: `src/screens/files/files-screen.tsx`
- Any other screen files with hits

- [ ] **Step 1: Grep all screen files for broken patterns**

```bash
grep -rn 'bg-white\b\|bg-primary-\|border-primary-\|text-black\|border-neutral-2\|bg-accent-500\|bg-neutral-1' \
  ~/Hermes-Studio/src/screens/ \
  ~/Hermes-Studio/src/components/ \
  --include='*.tsx' \
  | grep -v 'components/ds/'
```

Note every hit with file and line number.

- [ ] **Step 2: Fix hits in files-screen.tsx**

Apply CSS var replacements:

```bash
cd ~/Hermes-Studio
sed -i \
  -e 's/bg-white/bg-\[var(--theme-card)\]/g' \
  -e 's/dark:bg-neutral-900//g' \
  src/screens/files/files-screen.tsx
```

- [ ] **Step 3: Fix hits in audit-trail-screen.tsx**

```bash
cd ~/Hermes-Studio
sed -i \
  -e 's/bg-white\b/bg-\[var(--theme-card)\]/g' \
  -e 's/border-primary-200/border-\[var(--theme-border)\]/g' \
  -e 's/bg-primary-50/bg-\[var(--theme-bg)\]/g' \
  -e 's/text-primary-900/text-\[var(--theme-text)\]/g' \
  src/screens/audit/audit-trail-screen.tsx
```

- [ ] **Step 4: Fix hits in crews-screen.tsx**

```bash
cd ~/Hermes-Studio
sed -i \
  -e 's/bg-white\b/bg-\[var(--theme-card)\]/g' \
  -e 's/border-primary-200/border-\[var(--theme-border)\]/g' \
  -e 's/bg-primary-50/bg-\[var(--theme-bg)\]/g' \
  src/screens/crews/crews-screen.tsx
```

- [ ] **Step 5: Fix any remaining hits from Step 1 manually**

For each remaining line from the Step 1 grep, apply the canonical mapping from the table at the top of this plan.

- [ ] **Step 6: Final grep — confirm zero remaining broken patterns**

```bash
grep -rn 'bg-white\b\|bg-primary-\|border-primary-\|text-black\b\|border-neutral-2\|bg-accent-500\|bg-neutral-1' \
  ~/Hermes-Studio/src/screens/ \
  ~/Hermes-Studio/src/components/ \
  --include='*.tsx' \
  | grep -v 'components/ds/' \
  | grep -v 'node_modules'
```

Expected: **no output**.

- [ ] **Step 7: Full test suite**

```bash
cd ~/Hermes-Studio && npm test
```

Expected: 60 tests pass.

- [ ] **Step 8: Final build**

```bash
cd ~/Hermes-Studio && npm run build 2>&1 | tail -3
```

Expected: `✓ built in X.XXs`

- [ ] **Step 9: Commit**

```bash
cd ~/Hermes-Studio && git add -u && git commit -m "fix(ds): consistency pass — all screens migrated to CSS vars and DS components"
```

---

### Task 17: Update DEVLOG and memory + final push

**Files:**
- Modify: `DEVLOG.md`
- Modify: `docs/superpowers/specs/2026-04-16-design-system-consistency.md`

- [ ] **Step 1: Add DEVLOG entry**

Prepend a new session entry at the top of `DEVLOG.md`:

```markdown
## 2026-04-16 — Session 17

### What was done

**Design System Consistency (Tasks #DS-1 through #DS-6 + screen migration)**

Built a canonical 6-component design system library in `src/components/ds/` and migrated all screens to use it.

**New components (`src/components/ds/`):**
- `Card` — base surface primitive (3 variants: default, panel, subtle)
- `SettingsRow` — label + description + control slot; optional danger border
- `SectionHeader` — section title with optional subtitle, action, and divider
- `StatusBadge` — hugeicon + label in semantic theme color; replaces all emoji status indicators
- `ListItem` — icon + label + description + meta row with consistent hover state
- `EmptyState` — centred icon + title + description + action; used by every empty screen

**CSS fixes:**
- Added `--theme-hover` to all 9 theme blocks in `styles.css`
- Replaced 300+ broken Tailwind palette classes (`bg-primary-*`, `border-primary-*`, `text-black`, `bg-white`) with `var(--theme-*)` CSS variables across all screens
- Screens migrated: settings/index.tsx, providers-screen.tsx, provider-wizard.tsx, chat-composer.tsx, chat-header.tsx, memory-browser-screen.tsx, knowledge-browser-screen.tsx, profiles-screen.tsx, skills-screen.tsx, workspace-skills-screen.tsx, jobs-screen.tsx, audit-trail-screen.tsx, crews-screen.tsx, files-screen.tsx

**Tests:** 37 new unit tests for DS components (vitest + @testing-library/react + jsdom); all 60 tests pass.

**The Rule (for future dev):** Never use Tailwind color classes on screen-level components. Always use `var(--theme-*)`. See `docs/superpowers/specs/2026-04-16-design-system-consistency.md`.

### Version bump: 1.15.1 → 1.16.0
```

- [ ] **Step 2: Bump version in package.json**

```bash
cd ~/Hermes-Studio && npm version minor --no-git-tag-version
```

- [ ] **Step 3: Update spec status**

In `docs/superpowers/specs/2026-04-16-design-system-consistency.md`, change line:

```
**Status:** Approved
```

to:

```
**Status:** Implemented (v1.16.0)
```

- [ ] **Step 4: Final commit and push**

```bash
cd ~/Hermes-Studio && git add DEVLOG.md package.json docs/superpowers/specs/2026-04-16-design-system-consistency.md && git commit -m "$(cat <<'EOF'
feat(ds): design system v1.0 — 6 DS components + full screen migration (v1.16.0)

- Card, SettingsRow, SectionHeader, StatusBadge, ListItem, EmptyState in src/components/ds/
- --theme-hover added to all 9 themes
- 300+ broken palette class replacements across 14 screen files
- 37 new unit tests; 60 total passing
- The Rule documented for future development

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
git push
```
