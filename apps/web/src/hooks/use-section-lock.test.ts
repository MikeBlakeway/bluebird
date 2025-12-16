/**
 * Tests for useSectionLock Hook
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSectionLock } from './use-section-lock'

// ============================================================================
// Mock localStorage
// ============================================================================

const mockStorage: Record<string, string> = {}

beforeEach(() => {
  // Clear mock storage before each test
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key])

  // Mock localStorage methods
  global.localStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete mockStorage[key]
    }),
    clear: vi.fn(() => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    }),
    length: Object.keys(mockStorage).length,
    key: vi.fn((index: number) => Object.keys(mockStorage)[index] || null),
  }
})

// ============================================================================
// Tests
// ============================================================================

describe('useSectionLock', () => {
  const defaultOptions = {
    takeId: 'take_test123',
    sectionCount: 5,
  }

  it('initializes with empty locked sections', () => {
    const { result } = renderHook(() => useSectionLock(defaultOptions))

    expect(result.current.lockedSections.size).toBe(0)
    expect(result.current.isLocked(0)).toBe(false)
    expect(result.current.isLocked(1)).toBe(false)
  })

  it('loads locked sections from localStorage on mount', () => {
    // Pre-populate localStorage
    mockStorage['bluebird:section-locks:take_test123'] = JSON.stringify([0, 2, 4])

    const { result } = renderHook(() => useSectionLock(defaultOptions))

    expect(result.current.lockedSections.size).toBe(3)
    expect(result.current.isLocked(0)).toBe(true)
    expect(result.current.isLocked(2)).toBe(true)
    expect(result.current.isLocked(4)).toBe(true)
    expect(result.current.isLocked(1)).toBe(false)
    expect(result.current.isLocked(3)).toBe(false)
  })

  it('toggleLock adds section to Set when not locked', () => {
    const { result } = renderHook(() => useSectionLock(defaultOptions))

    act(() => {
      result.current.toggleLock(1)
    })

    expect(result.current.isLocked(1)).toBe(true)
    expect(result.current.lockedSections.size).toBe(1)
  })

  it('toggleLock removes section from Set when locked', () => {
    // Start with section 1 locked
    mockStorage['bluebird:section-locks:take_test123'] = JSON.stringify([1])

    const { result } = renderHook(() => useSectionLock(defaultOptions))

    expect(result.current.isLocked(1)).toBe(true)

    act(() => {
      result.current.toggleLock(1)
    })

    expect(result.current.isLocked(1)).toBe(false)
    expect(result.current.lockedSections.size).toBe(0)
  })

  it('lockSection locks a specific section', () => {
    const { result } = renderHook(() => useSectionLock(defaultOptions))

    act(() => {
      result.current.lockSection(2)
    })

    expect(result.current.isLocked(2)).toBe(true)
  })

  it('unlockSection unlocks a specific section', () => {
    mockStorage['bluebird:section-locks:take_test123'] = JSON.stringify([2])

    const { result } = renderHook(() => useSectionLock(defaultOptions))

    expect(result.current.isLocked(2)).toBe(true)

    act(() => {
      result.current.unlockSection(2)
    })

    expect(result.current.isLocked(2)).toBe(false)
  })

  it('lockAll locks all sections', () => {
    const { result } = renderHook(() => useSectionLock(defaultOptions))

    act(() => {
      result.current.lockAll()
    })

    expect(result.current.lockedSections.size).toBe(5)
    expect(result.current.isLocked(0)).toBe(true)
    expect(result.current.isLocked(1)).toBe(true)
    expect(result.current.isLocked(2)).toBe(true)
    expect(result.current.isLocked(3)).toBe(true)
    expect(result.current.isLocked(4)).toBe(true)
  })

  it('unlockAll clears all locks', () => {
    mockStorage['bluebird:section-locks:take_test123'] = JSON.stringify([0, 1, 2, 3, 4])

    const { result } = renderHook(() => useSectionLock(defaultOptions))

    expect(result.current.lockedSections.size).toBe(5)

    act(() => {
      result.current.unlockAll()
    })

    expect(result.current.lockedSections.size).toBe(0)
  })

  it('persists to localStorage after toggle', () => {
    const { result } = renderHook(() => useSectionLock(defaultOptions))

    act(() => {
      result.current.toggleLock(1)
    })

    // Check localStorage was updated
    const stored = mockStorage['bluebird:section-locks:take_test123']
    expect(stored).toBeDefined()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(JSON.parse(stored!)).toEqual([1])
  })

  it('different takeIds have independent lock states', () => {
    mockStorage['bluebird:section-locks:take_abc'] = JSON.stringify([0, 1])
    mockStorage['bluebird:section-locks:take_xyz'] = JSON.stringify([2, 3])

    const { result: result1 } = renderHook(() =>
      useSectionLock({ takeId: 'take_abc', sectionCount: 5 })
    )
    const { result: result2 } = renderHook(() =>
      useSectionLock({ takeId: 'take_xyz', sectionCount: 5 })
    )

    expect(result1.current.isLocked(0)).toBe(true)
    expect(result1.current.isLocked(2)).toBe(false)

    expect(result2.current.isLocked(0)).toBe(false)
    expect(result2.current.isLocked(2)).toBe(true)
  })

  it('handles invalid localStorage data gracefully', () => {
    // Invalid JSON
    mockStorage['bluebird:section-locks:take_test123'] = 'invalid-json'

    const { result } = renderHook(() => useSectionLock(defaultOptions))

    // Should fallback to empty Set
    expect(result.current.lockedSections.size).toBe(0)
  })
})
