/**
 * useSectionLock Hook
 *
 * Manages lock state for sections in a take. Locked sections cannot be
 * regenerated, preserving user-approved content.
 *
 * State is persisted to localStorage for session continuity.
 */

import { useEffect, useState } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface UseSectionLockOptions {
  /** Take ID to scope lock state */
  takeId: string
  /** Total number of sections in the take */
  sectionCount: number
}

export interface UseSectionLockReturn {
  /** Set of locked section indices */
  lockedSections: Set<number>
  /** Check if a section is locked */
  isLocked: (sectionIdx: number) => boolean
  /** Toggle lock state for a section */
  toggleLock: (sectionIdx: number) => void
  /** Lock a specific section */
  lockSection: (sectionIdx: number) => void
  /** Unlock a specific section */
  unlockSection: (sectionIdx: number) => void
  /** Lock all sections */
  lockAll: () => void
  /** Unlock all sections */
  unlockAll: () => void
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_PREFIX = 'bluebird:section-locks'

// ============================================================================
// Utilities
// ============================================================================

function getStorageKey(takeId: string): string {
  return `${STORAGE_PREFIX}:${takeId}`
}

function loadLockedSections(takeId: string): Set<number> {
  try {
    const key = getStorageKey(takeId)
    const stored = localStorage.getItem(key)
    if (!stored) {
      return new Set()
    }
    const parsed = JSON.parse(stored) as number[]
    return new Set(parsed)
  } catch (error) {
    console.error('Failed to load locked sections from localStorage:', error)
    return new Set()
  }
}

function saveLockedSections(takeId: string, locked: Set<number>): void {
  try {
    const key = getStorageKey(takeId)
    const array = Array.from(locked)
    localStorage.setItem(key, JSON.stringify(array))
  } catch (error) {
    console.error('Failed to save locked sections to localStorage:', error)
    // Continue execution even if save fails (quota exceeded, etc.)
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useSectionLock(options: UseSectionLockOptions): UseSectionLockReturn {
  const { takeId, sectionCount } = options

  // Load initial state from localStorage
  const [lockedSections, setLockedSections] = useState<Set<number>>(() =>
    loadLockedSections(takeId)
  )

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveLockedSections(takeId, lockedSections)
  }, [takeId, lockedSections])

  // Query if a section is locked
  const isLocked = (sectionIdx: number): boolean => {
    return lockedSections.has(sectionIdx)
  }

  // Toggle lock state for a section
  const toggleLock = (sectionIdx: number): void => {
    setLockedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionIdx)) {
        next.delete(sectionIdx)
      } else {
        next.add(sectionIdx)
      }
      return next
    })
  }

  // Lock a specific section
  const lockSection = (sectionIdx: number): void => {
    setLockedSections((prev) => {
      const next = new Set(prev)
      next.add(sectionIdx)
      return next
    })
  }

  // Unlock a specific section
  const unlockSection = (sectionIdx: number): void => {
    setLockedSections((prev) => {
      const next = new Set(prev)
      next.delete(sectionIdx)
      return next
    })
  }

  // Lock all sections
  const lockAll = (): void => {
    const allIndices = Array.from({ length: sectionCount }, (_, i) => i)
    setLockedSections(new Set(allIndices))
  }

  // Unlock all sections
  const unlockAll = (): void => {
    setLockedSections(new Set())
  }

  return {
    lockedSections,
    isLocked,
    toggleLock,
    lockSection,
    unlockSection,
    lockAll,
    unlockAll,
  }
}
