/**
 * useABComparison Hook
 *
 * Tracks a focused section and allows switching its playback version (A/B)
 * via UI actions and keyboard shortcuts.
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PlaybackVersion } from '@/lib/audio-engine'

export interface UseABComparisonOptions {
  sectionCount: number
  initialFocusedSectionIdx?: number
  onSwitchVersion?: (sectionIdx: number, version: PlaybackVersion) => void | Promise<void>
}

export interface UseABComparisonReturn {
  focusedSectionIdx: number
  setFocusedSectionIdx: (sectionIdx: number) => void
  getSectionVersion: (sectionIdx: number) => PlaybackVersion
  setSectionVersion: (sectionIdx: number, version: PlaybackVersion) => Promise<void>
}

function isTextEntryActiveElement(): boolean {
  const el = document.activeElement
  if (!el) return false

  if (el instanceof HTMLInputElement) return true
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLSelectElement) return true

  if (el instanceof HTMLElement && el.isContentEditable) return true

  if (el instanceof HTMLElement) {
    const role = el.getAttribute('role')
    if (role === 'textbox') return true
  }

  return false
}

export function useABComparison(options: UseABComparisonOptions): UseABComparisonReturn {
  const [focusedSectionIdx, setFocusedSectionIdx] = useState(options.initialFocusedSectionIdx ?? 0)

  const [versionsBySection, setVersionsBySection] = useState<Record<number, PlaybackVersion>>({})

  const clampSectionIdx = useCallback(
    (idx: number) => Math.max(0, Math.min(options.sectionCount - 1, idx)),
    [options.sectionCount]
  )

  const getSectionVersion = useCallback(
    (sectionIdx: number): PlaybackVersion => versionsBySection[sectionIdx] ?? 'A',
    [versionsBySection]
  )

  const setSectionVersion = useCallback(
    async (sectionIdx: number, version: PlaybackVersion) => {
      const idx = clampSectionIdx(sectionIdx)

      setVersionsBySection((prev) => {
        if (prev[idx] === version) return prev
        return { ...prev, [idx]: version }
      })

      await options.onSwitchVersion?.(idx, version)
    },
    [clampSectionIdx, options]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTextEntryActiveElement()) return

      const key = e.key.toLowerCase()
      if (key === 'a') {
        void setSectionVersion(focusedSectionIdx, 'A')
      } else if (key === 'b') {
        void setSectionVersion(focusedSectionIdx, 'B')
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusedSectionIdx, setSectionVersion])

  // Ensure focused section stays within bounds if sectionCount changes.
  useEffect(() => {
    setFocusedSectionIdx((prev) => clampSectionIdx(prev))
  }, [clampSectionIdx])

  return useMemo(
    () => ({
      focusedSectionIdx,
      setFocusedSectionIdx: (idx: number) => setFocusedSectionIdx(clampSectionIdx(idx)),
      getSectionVersion,
      setSectionVersion,
    }),
    [clampSectionIdx, focusedSectionIdx, getSectionVersion, setSectionVersion]
  )
}
