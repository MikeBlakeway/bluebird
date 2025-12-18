/**
 * useKeyboardShortcuts Hook
 *
 * Centralized keyboard shortcut handling for the studio editor.
 * Supports shortcuts for transport controls, section operations, navigation,
 * and help panel display.
 */

'use client'

import { useEffect } from 'react'
import { isTextEntryActiveElement } from '@/lib/keyboard-utils'

export interface UseKeyboardShortcutsOptions {
  /**
   * Transport controls
   */
  onPlayPause?: () => void | Promise<void>

  /**
   * Section controls (operate on focusedSectionIdx)
   */
  onLockUnlock?: (sectionIdx: number) => void
  onRegenerate?: (sectionIdx: number) => void | Promise<void>
  onNavigateUp?: () => void
  onNavigateDown?: () => void

  /**
   * Global controls
   */
  onCancel?: () => void
  onShowHelp?: () => void

  /**
   * State
   */
  focusedSectionIdx?: number
  sectionCount?: number
  isJobActive?: boolean // Disable certain shortcuts during jobs
}

/**
 * Keyboard shortcut mappings:
 * - Space: Play/Pause
 * - L: Lock/Unlock focused section
 * - R: Regenerate focused section
 * - A/B: Switch A/B version (handled separately in useABComparison)
 * - ↑/↓: Navigate sections
 * - Esc: Cancel active job
 * - ?: Show shortcuts panel
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const {
    onPlayPause,
    onLockUnlock,
    onRegenerate,
    onNavigateUp,
    onNavigateDown,
    onCancel,
    onShowHelp,
    focusedSectionIdx = 0,
    sectionCount = 0,
    isJobActive = false,
  } = options

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if event already handled
      if (e.defaultPrevented) return

      // Ignore if modifier keys are pressed (except Shift for ?)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // Ignore if typing in text field
      if (isTextEntryActiveElement()) return

      const key = e.key.toLowerCase()

      // Space: Play/Pause (prevent page scroll)
      if (key === ' ' || key === 'spacebar') {
        e.preventDefault()
        onPlayPause?.()
        return
      }

      // L: Lock/Unlock focused section
      if (key === 'l') {
        e.preventDefault()
        if (focusedSectionIdx !== undefined) {
          onLockUnlock?.(focusedSectionIdx)
        }
        return
      }

      // R: Regenerate focused section
      if (key === 'r') {
        e.preventDefault()
        if (focusedSectionIdx !== undefined && !isJobActive) {
          void onRegenerate?.(focusedSectionIdx)
        }
        return
      }

      // Arrow Up: Navigate to previous section
      if (key === 'arrowup') {
        e.preventDefault()
        onNavigateUp?.()
        return
      }

      // Arrow Down: Navigate to next section
      if (key === 'arrowdown') {
        e.preventDefault()
        onNavigateDown?.()
        return
      }

      // Escape: Cancel active job
      if (key === 'escape') {
        e.preventDefault()
        if (isJobActive) {
          onCancel?.()
        }
        return
      }

      // ?: Show shortcuts panel (? is Shift+/)
      if (key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault()
        onShowHelp?.()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    onPlayPause,
    onLockUnlock,
    onRegenerate,
    onNavigateUp,
    onNavigateDown,
    onCancel,
    onShowHelp,
    focusedSectionIdx,
    sectionCount,
    isJobActive,
  ])
}
