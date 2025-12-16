/**
 * Tests for useRegenSection hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRegenSection } from './use-regen-section'
import { useClient } from './use-client'

// Mock useClient hook
vi.mock('./use-client', () => ({
  useClient: vi.fn(),
}))

describe('useRegenSection', () => {
  const mockRenderSection = vi.fn()
  const mockClient = {
    renderSection: mockRenderSection,
  }

  const defaultOptions = {
    takeId: 'take-123',
    projectId: 'proj-456',
    planId: 'plan-789',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(useClient as any).mockReturnValue(mockClient)
  })

  it('should initialize with null regeneratingSection', () => {
    const { result } = renderHook(() => useRegenSection(defaultOptions))

    expect(result.current.regeneratingSection).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should call client.renderSection with correct params', async () => {
    mockRenderSection.mockResolvedValue({ jobId: 'job-999' })

    const { result } = renderHook(() => useRegenSection(defaultOptions))

    await act(async () => {
      await result.current.regenerateSection(2)
    })

    expect(mockRenderSection).toHaveBeenCalledWith({
      projectId: 'proj-456',
      planId: 'plan-789',
      sectionId: 'section-2',
      regen: true,
    })
  })

  it('should set regeneratingSection during call', async () => {
    let resolvePromise: (value: { jobId: string }) => void
    const promise = new Promise<{ jobId: string }>((resolve) => {
      resolvePromise = resolve
    })
    mockRenderSection.mockReturnValue(promise)

    const { result } = renderHook(() => useRegenSection(defaultOptions))

    // Start regeneration
    act(() => {
      result.current.regenerateSection(2)
    })

    // Should be regenerating immediately
    await waitFor(() => {
      expect(result.current.regeneratingSection).toBe(2)
    })

    // Complete the request
    act(() => {
      resolvePromise({ jobId: 'job-999' })
    })

    // Should still be regenerating (cleared by SSE, not by this hook)
    await waitFor(() => {
      expect(result.current.regeneratingSection).toBe(2)
    })
  })

  it('should track isRegenerating for specific section', async () => {
    mockRenderSection.mockResolvedValue({ jobId: 'job-999' })

    const { result } = renderHook(() => useRegenSection(defaultOptions))

    expect(result.current.isRegenerating(2)).toBe(false)

    await act(async () => {
      await result.current.regenerateSection(2)
    })

    expect(result.current.isRegenerating(2)).toBe(true)
    expect(result.current.isRegenerating(0)).toBe(false)
    expect(result.current.isRegenerating(3)).toBe(false)
  })

  it('should handle errors gracefully', async () => {
    const error = new Error('Network error')
    mockRenderSection.mockRejectedValue(error)

    const { result } = renderHook(() => useRegenSection(defaultOptions))

    await act(async () => {
      await result.current.regenerateSection(2)
    })

    expect(result.current.error).toBe(error)
    expect(result.current.regeneratingSection).toBeNull() // Cleared on error
  })

  it('should call onSuccess callback', async () => {
    const onSuccess = vi.fn()
    mockRenderSection.mockResolvedValue({ jobId: 'job-999' })

    const { result } = renderHook(() =>
      useRegenSection({
        ...defaultOptions,
        onSuccess,
      })
    )

    await act(async () => {
      await result.current.regenerateSection(2)
    })

    expect(onSuccess).toHaveBeenCalledWith('job-999')
  })

  it('should call onError callback', async () => {
    const onError = vi.fn()
    const error = new Error('Network error')
    mockRenderSection.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useRegenSection({
        ...defaultOptions,
        onError,
      })
    )

    await act(async () => {
      await result.current.regenerateSection(2)
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should clear error on new regeneration attempt', async () => {
    const error = new Error('Network error')
    mockRenderSection.mockRejectedValueOnce(error).mockResolvedValueOnce({ jobId: 'job-999' })

    const { result } = renderHook(() => useRegenSection(defaultOptions))

    // First attempt fails
    await act(async () => {
      await result.current.regenerateSection(2)
    })
    expect(result.current.error).toBe(error)

    // Second attempt succeeds
    await act(async () => {
      await result.current.regenerateSection(2)
    })
    expect(result.current.error).toBeNull()
  })

  it('should convert non-Error objects to Error', async () => {
    mockRenderSection.mockRejectedValue('String error')

    const { result } = renderHook(() => useRegenSection(defaultOptions))

    await act(async () => {
      await result.current.regenerateSection(2)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('String error')
  })

  it('should clear regeneratingSection manually', async () => {
    mockRenderSection.mockResolvedValue({ jobId: 'job-999' })

    const { result } = renderHook(() => useRegenSection(defaultOptions))

    await act(async () => {
      await result.current.regenerateSection(2)
    })

    expect(result.current.regeneratingSection).toBe(2)

    act(() => {
      result.current.clearRegenerating()
    })

    expect(result.current.regeneratingSection).toBeNull()
  })

  it('should format sectionId correctly', async () => {
    mockRenderSection.mockResolvedValue({ jobId: 'job-999' })

    const { result } = renderHook(() => useRegenSection(defaultOptions))

    await act(async () => {
      await result.current.regenerateSection(0)
    })
    expect(mockRenderSection).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: 'section-0' })
    )

    vi.clearAllMocks()

    await act(async () => {
      await result.current.regenerateSection(15)
    })
    expect(mockRenderSection).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: 'section-15' })
    )
  })

  it('should maintain stable callback references', () => {
    const { result, rerender } = renderHook(() => useRegenSection(defaultOptions))

    const initialRegenerate = result.current.regenerateSection
    const initialIsRegenerating = result.current.isRegenerating
    const initialClear = result.current.clearRegenerating

    rerender()

    // Callbacks should be stable (same reference)
    expect(result.current.regenerateSection).toBe(initialRegenerate)
    expect(result.current.isRegenerating).toBe(initialIsRegenerating)
    expect(result.current.clearRegenerating).toBe(initialClear)
  })
})
