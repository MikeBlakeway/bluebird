import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { JobEvent } from '@bluebird/types'
import { useJobTimeline } from '@/hooks/use-job-timeline'
import { useExport } from '@/hooks/use-export'

// Mock useJobEvents to capture onEvent callbacks and simulate SSE completions
const mockUseJobEvents = vi.fn(
  (
    _jobId: string | null | undefined,
    options?: { onEvent?: (event: { stage: string; data?: unknown }) => void }
  ) => {
    if (options?.onEvent) {
      mockUseJobEvents.lastOnEvent = options.onEvent
    }

    return {
      event: null,
      state: 'connected',
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      isConnected: true,
    }
  }
) as unknown as typeof import('@/hooks/use-job-events').useJobEvents & {
  lastOnEvent?: (event: { stage: string; data?: unknown }) => void
}

vi.mock('@/hooks/use-job-events', () => ({
  useJobEvents: (
    jobId: string | null | undefined,
    options?: { onEvent?: (event: unknown) => void }
  ) => mockUseJobEvents(jobId, options),
}))

// Simple EventSource mock to drive SSEClient
class MockEventSource {
  public onopen: ((event: Event) => void) | null = null
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: Event) => void) | null = null
  public readonly url: string
  public closed = false

  constructor(url: string) {
    this.url = url
    mockEventSourceInstances.push(this)
  }

  emitOpen() {
    this.onopen?.(new Event('open'))
  }

  emitMessage(data: JobEvent) {
    const payload = new MessageEvent('message', { data: JSON.stringify(data) })
    this.onmessage?.(payload)
  }

  emitError(message = 'error') {
    this.onerror?.(new Event(message))
  }

  close() {
    this.closed = true
  }
}

const mockEventSourceInstances: MockEventSource[] = []
let originalEventSource: typeof EventSource | undefined

// Global fetch mock for export API calls
const fetchMock = vi.fn()

beforeEach(() => {
  mockEventSourceInstances.length = 0
  originalEventSource = global.EventSource
  global.EventSource = MockEventSource as unknown as typeof EventSource
  global.fetch = fetchMock as unknown as typeof fetch
  fetchMock.mockReset()
})

afterEach(() => {
  // Restore EventSource
  if (originalEventSource) {
    global.EventSource = originalEventSource
  }
  vi.restoreAllMocks()
})

describe('preview flow integration', () => {
  it('streams SSE job events through the timeline (plan → render → complete)', async () => {
    const { result } = renderHook(() => useJobTimeline('job-preview-1'))

    await waitFor(() => {
      expect(mockEventSourceInstances.length).toBeGreaterThan(0)
    })

    // Simulate SSE connection open
    act(() => {
      mockEventSourceInstances[0]?.emitOpen()
    })

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    const now = new Date().toISOString()

    // planning stage
    act(() => {
      mockEventSourceInstances[0]?.emitMessage({
        jobId: 'job-preview-1',
        stage: 'planning',
        progress: 0.5,
        timestamp: now,
      })
    })

    await waitFor(() => {
      expect(result.current.currentStage).toBe('planning')
    })

    // render stage
    act(() => {
      mockEventSourceInstances[0]?.emitMessage({
        jobId: 'job-preview-1',
        stage: 'music-render',
        progress: 1,
        timestamp: now,
      })
    })

    await waitFor(() => {
      expect(result.current.stages.get('music-render')?.status).toBe('complete')
    })

    // completion
    act(() => {
      mockEventSourceInstances[0]?.emitMessage({
        jobId: 'job-preview-1',
        stage: 'completed',
        progress: 1,
        timestamp: now,
      })
    })

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })

    expect(result.current.stages.get('planning')?.status).toBe('complete')
    expect(result.current.stages.get('music-render')?.status).toBe('complete')
    expect(result.current.overallProgress).toBeGreaterThan(0)
  })

  it('starts export via API and handles completion job event', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ jobId: 'export-job-1' }),
    })

    const { result } = renderHook(() =>
      useExport({ projectId: 'proj-1', takeId: 'take-1', planId: 'plan-1' })
    )

    await act(async () => {
      await result.current.exportComposition({
        format: 'wav',
        sampleRate: 48000,
        includeStems: true,
      })
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/export/preview',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Idempotency-Key': expect.stringContaining('proj-1:take-1'),
        }),
      })
    )

    // Simulate SSE completion event flowing through useJobEvents mock
    act(() => {
      mockUseJobEvents.lastOnEvent?.({
        stage: 'completed',
        data: { downloadUrls: { master: 'https://cdn.local/master.wav' } },
      })
    })

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })

    expect(result.current.downloadUrls.master).toBe('https://cdn.local/master.wav')
    expect(result.current.error).toBeNull()
  })
})
