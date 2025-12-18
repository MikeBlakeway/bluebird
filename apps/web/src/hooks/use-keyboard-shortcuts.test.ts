/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'

describe('useKeyboardShortcuts', () => {
  let callbacks: {
    onPlayPause: ReturnType<typeof vi.fn<[], void>>
    onLockUnlock: ReturnType<typeof vi.fn<[sectionIdx: number], void>>
    onRegenerate: ReturnType<typeof vi.fn<[sectionIdx: number], void>>
    onNavigateUp: ReturnType<typeof vi.fn<[], void>>
    onNavigateDown: ReturnType<typeof vi.fn<[], void>>
    onCancel: ReturnType<typeof vi.fn<[], void>>
    onShowHelp: ReturnType<typeof vi.fn<[], void>>
  }

  beforeEach(() => {
    callbacks = {
      onPlayPause: vi.fn<[], void>(),
      onLockUnlock: vi.fn<[sectionIdx: number], void>(),
      onRegenerate: vi.fn<[sectionIdx: number], void>(),
      onNavigateUp: vi.fn<[], void>(),
      onNavigateDown: vi.fn<[], void>(),
      onCancel: vi.fn<[], void>(),
      onShowHelp: vi.fn<[], void>(),
    }
  })

  const simulateKeyPress = (key: string, options: Partial<KeyboardEventInit> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    })
    window.dispatchEvent(event)
  }

  it('should call onPlayPause when Space key is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress(' ')
    expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1)
  })

  it('should call onPlayPause when Spacebar key is pressed (older browsers)', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress('Spacebar')
    expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1)
  })

  it('should call onLockUnlock with focused section index when L is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 1,
        sectionCount: 3,
      })
    )

    simulateKeyPress('l')
    expect(callbacks.onLockUnlock).toHaveBeenCalledWith(1)
  })

  it('should call onLockUnlock with focused section index when L (uppercase) is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 2,
        sectionCount: 3,
      })
    )

    simulateKeyPress('L')
    expect(callbacks.onLockUnlock).toHaveBeenCalledWith(2)
  })

  it('should call onRegenerate with focused section index when R is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
        isJobActive: false,
      })
    )

    simulateKeyPress('r')
    expect(callbacks.onRegenerate).toHaveBeenCalledWith(0)
  })

  it('should NOT call onRegenerate when job is active', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
        isJobActive: true,
      })
    )

    simulateKeyPress('r')
    expect(callbacks.onRegenerate).not.toHaveBeenCalled()
  })

  it('should call onNavigateUp when ArrowUp is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 1,
        sectionCount: 3,
      })
    )

    simulateKeyPress('ArrowUp')
    expect(callbacks.onNavigateUp).toHaveBeenCalledTimes(1)
  })

  it('should call onNavigateDown when ArrowDown is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 1,
        sectionCount: 3,
      })
    )

    simulateKeyPress('ArrowDown')
    expect(callbacks.onNavigateDown).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when Escape is pressed and job is active', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
        isJobActive: true,
      })
    )

    simulateKeyPress('Escape')
    expect(callbacks.onCancel).toHaveBeenCalledTimes(1)
  })

  it('should NOT call onCancel when Escape is pressed and no job is active', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
        isJobActive: false,
      })
    )

    simulateKeyPress('Escape')
    expect(callbacks.onCancel).not.toHaveBeenCalled()
  })

  it('should call onShowHelp when ? key is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress('?', { shiftKey: true })
    expect(callbacks.onShowHelp).toHaveBeenCalledTimes(1)
  })

  it('should call onShowHelp when Shift+/ is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress('/', { shiftKey: true })
    expect(callbacks.onShowHelp).toHaveBeenCalledTimes(1)
  })

  it('should ignore shortcuts when typing in an input field', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress(' ')
    simulateKeyPress('l')
    simulateKeyPress('r')

    expect(callbacks.onPlayPause).not.toHaveBeenCalled()
    expect(callbacks.onLockUnlock).not.toHaveBeenCalled()
    expect(callbacks.onRegenerate).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('should ignore shortcuts when typing in a textarea', () => {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()

    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress(' ')
    expect(callbacks.onPlayPause).not.toHaveBeenCalled()

    document.body.removeChild(textarea)
  })

  it('should ignore shortcuts when Ctrl is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress(' ', { ctrlKey: true })
    expect(callbacks.onPlayPause).not.toHaveBeenCalled()
  })

  it('should ignore shortcuts when Meta (Cmd) is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress(' ', { metaKey: true })
    expect(callbacks.onPlayPause).not.toHaveBeenCalled()
  })

  it('should ignore shortcuts when Alt is pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    simulateKeyPress(' ', { altKey: true })
    expect(callbacks.onPlayPause).not.toHaveBeenCalled()
  })

  it('should cleanup event listener on unmount', () => {
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({
        ...callbacks,
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    unmount()

    // After unmount, shortcuts should not work
    simulateKeyPress(' ')
    expect(callbacks.onPlayPause).not.toHaveBeenCalled()
  })

  it('should work with callbacks being undefined', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        focusedSectionIdx: 0,
        sectionCount: 3,
      })
    )

    // Should not throw errors
    simulateKeyPress(' ')
    simulateKeyPress('l')
    simulateKeyPress('r')
  })
})
