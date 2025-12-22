/**
 * Tests for useABComparison Hook
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useABComparison } from './use-ab-comparison'

describe('useABComparison', () => {
  it('defaults focused section to 0 and version A', () => {
    const { result } = renderHook(() => useABComparison({ sectionCount: 3 }))

    expect(result.current.focusedSectionIdx).toBe(0)
    expect(result.current.getSectionVersion(0)).toBe('A')
    expect(result.current.getSectionVersion(1)).toBe('A')
  })

  it('switches version via setSectionVersion and calls callback', async () => {
    const onSwitchVersion = vi.fn()
    const { result } = renderHook(() => useABComparison({ sectionCount: 3, onSwitchVersion }))

    await act(async () => {
      await result.current.setSectionVersion(1, 'B')
    })

    expect(result.current.getSectionVersion(1)).toBe('B')
    expect(onSwitchVersion).toHaveBeenCalledWith(1, 'B')
  })

  it('handles keyboard shortcuts A/B for focused section', () => {
    const onSwitchVersion = vi.fn()
    const { result } = renderHook(() => useABComparison({ sectionCount: 3, onSwitchVersion }))

    act(() => {
      result.current.setFocusedSectionIdx(2)
    })

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))
    })

    expect(onSwitchVersion).toHaveBeenCalledWith(2, 'B')
  })

  it('does not trigger keyboard shortcuts when typing in an input', () => {
    const onSwitchVersion = vi.fn()
    renderHook(() => useABComparison({ sectionCount: 3, onSwitchVersion }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))
    })

    expect(onSwitchVersion).not.toHaveBeenCalled()

    input.blur()
    input.remove()
  })
})
