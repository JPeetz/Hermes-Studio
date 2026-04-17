import { describe, it, expect } from 'vitest'
import {
  parseEntries,
  buildMemoryContent,
  appendCorrection,
  removeEntry,
} from '@/lib/memory-parser'

describe('parseEntries()', () => {
  it('returns empty array for empty string', () => {
    expect(parseEntries('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(parseEntries('   \n\n  ')).toEqual([])
  })

  it('parses a single entry', () => {
    const result = parseEntries('User prefers concise answers')
    expect(result).toHaveLength(1)
    expect(result[0].body).toBe('User prefers concise answers')
    expect(result[0].isCorrection).toBe(false)
  })

  it('parses multiple §-delimited entries', () => {
    const raw = 'Entry one\n§\nEntry two\n§\nEntry three'
    const result = parseEntries(raw)
    expect(result).toHaveLength(3)
    expect(result[0].body).toBe('Entry one')
    expect(result[1].body).toBe('Entry two')
    expect(result[2].body).toBe('Entry three')
  })

  it('assigns sequential index values', () => {
    const raw = 'A\n§\nB\n§\nC'
    const result = parseEntries(raw)
    expect(result.map((e) => e.index)).toEqual([0, 1, 2])
  })

  it('filters empty chunks between delimiters', () => {
    const raw = 'A\n§\n\n§\nB'
    const result = parseEntries(raw)
    expect(result).toHaveLength(2)
  })

  it('trims surrounding whitespace from entries', () => {
    const raw = '  \n  hello world  \n  '
    const result = parseEntries(raw)
    expect(result[0].body).toBe('hello world')
  })

  it('detects CORRECTION: prefix (exact case)', () => {
    const raw = 'CORRECTION: do not do X'
    const result = parseEntries(raw)
    expect(result[0].isCorrection).toBe(true)
    expect(result[0].body).toBe('do not do X')
  })

  it('detects CORRECTION: prefix (lowercase)', () => {
    const raw = 'correction: stop doing Y'
    const result = parseEntries(raw)
    expect(result[0].isCorrection).toBe(true)
    expect(result[0].body).toBe('stop doing Y')
  })

  it('detects CORRECTION: prefix (mixed case)', () => {
    const raw = 'Correction: avoid Z'
    const result = parseEntries(raw)
    expect(result[0].isCorrection).toBe(true)
  })

  it('strips CORRECTION: from body correctly', () => {
    const raw = 'CORRECTION:   lots of leading space'
    const result = parseEntries(raw)
    expect(result[0].body).toBe('lots of leading space')
  })

  it('non-CORRECTION entry has isCorrection = false', () => {
    const raw = 'User likes bullet points'
    expect(parseEntries(raw)[0].isCorrection).toBe(false)
  })

  it('preserves raw text on entry', () => {
    const raw = 'CORRECTION: do not ramble'
    const result = parseEntries(raw)
    expect(result[0].raw).toBe('CORRECTION: do not ramble')
  })

  it('handles mixed patterns and corrections', () => {
    const raw = 'Pattern A\n§\nCORRECTION: Fix B\n§\nPattern C'
    const result = parseEntries(raw)
    expect(result[0].isCorrection).toBe(false)
    expect(result[1].isCorrection).toBe(true)
    expect(result[2].isCorrection).toBe(false)
  })
})

describe('buildMemoryContent()', () => {
  it('returns empty string for empty array', () => {
    expect(buildMemoryContent([])).toBe('')
  })

  it('serialises a single entry', () => {
    const entries = parseEntries('hello')
    expect(buildMemoryContent(entries)).toBe('hello')
  })

  it('joins multiple entries with §', () => {
    const entries = parseEntries('A\n§\nB\n§\nC')
    const result = buildMemoryContent(entries)
    expect(result).toContain('§')
    expect(result.split('§').length).toBe(3)
  })

  it('round-trips through parseEntries → buildMemoryContent', () => {
    const original = 'Entry one\n§\nCORRECTION: Fix two\n§\nEntry three'
    const entries = parseEntries(original)
    const rebuilt = buildMemoryContent(entries)
    expect(parseEntries(rebuilt)).toHaveLength(3)
  })
})

describe('appendCorrection()', () => {
  it('appends a CORRECTION: entry to non-empty content', () => {
    const result = appendCorrection('Existing entry', 'New fix')
    expect(result).toContain('§')
    expect(result).toContain('CORRECTION: New fix')
  })

  it('creates a standalone entry when content is empty', () => {
    const result = appendCorrection('', 'New fix')
    expect(result).toBe('CORRECTION: New fix')
    expect(result).not.toContain('§')
  })

  it('trims the input text', () => {
    const result = appendCorrection('', '  padded text  ')
    expect(result).toBe('CORRECTION: padded text')
  })
})

describe('removeEntry()', () => {
  it('removes the entry at the given index', () => {
    const raw = 'A\n§\nB\n§\nC'
    const result = removeEntry(raw, 1)
    const remaining = parseEntries(result)
    expect(remaining).toHaveLength(2)
    expect(remaining.map((e) => e.body)).toEqual(['A', 'C'])
  })

  it('handles removing the only entry', () => {
    const result = removeEntry('Only entry', 0)
    expect(parseEntries(result)).toHaveLength(0)
  })

  it('does nothing when index is out of range', () => {
    const raw = 'A\n§\nB'
    const result = removeEntry(raw, 99)
    expect(parseEntries(result)).toHaveLength(2)
  })
})
