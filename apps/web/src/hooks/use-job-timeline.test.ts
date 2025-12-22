/**
 * useJobTimeline Hook Tests
 *
 * Note: These tests focus on the hook's state management logic.
 * SSE integration is tested separately in the SSE client tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { JobEvent } from '@bluebird/types'
import { useJobTimeline } from './use-job-timeline'

// Mock SSEClient - simple mock that allows manual event triggering
let mockOnEvent: ((event: JobEvent) => void) | null = null
let mockOnStateChange: ((state: string) => void) | null = null

vi.mock('@/lib/sse-client', () => {
  return {
    SSEClient: class MockSSEClient {
      connect = vi.fn(() => {
        if (mockOnStateChange) mockOnStateChange('connected')
      })
      disconnect = vi.fn()
      getState = vi.fn(() => 'connected')
      isConnected = vi.fn(() => true)

      constructor(config: {
        onEvent: (event: JobEvent) => void
        onStateChange?: (state: string) => void
      }) {
        mockOnEvent = config.onEvent
        mockOnStateChange = config.onStateChange || null
      }
    },
  }
})

// Helper to emit events
function emitEvent(event: JobEvent) {
  if (mockOnEvent) {
    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      mockOnEvent!(event)
    })
  }
}

describe('useJobTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnEvent = null
    mockOnStateChange = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default state when no jobId provided', () => {
    const { result } = renderHook(() => useJobTimeline(null))

    expect(result.current.jobId).toBe('')
    expect(result.current.currentStage).toBeNull()
    expect(result.current.overallProgress).toBe(0)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should initialize all stages as pending', () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    expect(result.current.stages.size).toBeGreaterThan(0)
    result.current.stages.forEach((state) => {
      expect(state.status).toBe('pending')
      expect(state.progress).toBe(0)
    })
  })

  it('should process job events and update state', async () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    // Emit planning event
    const planningEvent: JobEvent = {
      jobId: 'test-job-id',
      stage: 'planning',
      progress: 0.5,
      timestamp: new Date().toISOString(),
    }

    emitEvent(planningEvent)

    await waitFor(() => {
      expect(result.current.currentStage).toBe('planning')
    })

    const planningState = result.current.stages.get('planning')
    expect(planningState?.status).toBe('active')
    expect(planningState?.progress).toBe(0.5)
  })

  it('should mark previous stages as complete when advancing', async () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    // Jump to music-render stage
    const musicEvent: JobEvent = {
      jobId: 'test-job-id',
      stage: 'music-render',
      progress: 0.3,
      timestamp: new Date().toISOString(),
    }

    emitEvent(musicEvent)

    await waitFor(() => {
      expect(result.current.currentStage).toBe('music-render')
    })

    // Previous stages should be complete
    expect(result.current.stages.get('queued')?.status).toBe('complete')
    expect(result.current.stages.get('analyzing')?.status).toBe('complete')
    expect(result.current.stages.get('planning')?.status).toBe('complete')
    expect(result.current.stages.get('melody-gen')?.status).toBe('complete')

    // Current stage should be active
    expect(result.current.stages.get('music-render')?.status).toBe('active')

    // Future stages should be pending
    expect(result.current.stages.get('vocal-render')?.status).toBe('pending')
  })

  it('should calculate overall progress correctly', async () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    // First stage 50% complete
    emitEvent({
      jobId: 'test-job-id',
      stage: 'queued',
      progress: 0.5,
      timestamp: new Date().toISOString(),
    })

    await waitFor(() => {
      expect(result.current.overallProgress).toBeGreaterThan(0)
    })

    const firstProgress = result.current.overallProgress

    // Move to second stage
    emitEvent({
      jobId: 'test-job-id',
      stage: 'analyzing',
      progress: 0.5,
      timestamp: new Date().toISOString(),
    })

    await waitFor(() => {
      expect(result.current.overallProgress).toBeGreaterThan(firstProgress)
    })
  })

  it('should handle completion correctly', async () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    emitEvent({
      jobId: 'test-job-id',
      stage: 'completed',
      progress: 1,
      timestamp: new Date().toISOString(),
    })

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })

    expect(result.current.currentStage).toBe('completed')
    expect(result.current.error).toBeNull()
  })

  it('should handle failure correctly', async () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    const errorMessage = 'Job failed due to timeout'
    emitEvent({
      jobId: 'test-job-id',
      stage: 'failed',
      progress: 0,
      timestamp: new Date().toISOString(),
      error: errorMessage,
    })

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true)
    })

    expect(result.current.currentStage).toBe('failed')
    expect(result.current.error).toBe(errorMessage)
    expect(result.current.stages.get('failed')?.status).toBe('failed')
  })

  it('should calculate ETA based on remaining stages', async () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    // Start at planning stage (50% complete)
    emitEvent({
      jobId: 'test-job-id',
      stage: 'planning',
      progress: 0.5,
      timestamp: new Date().toISOString(),
    })

    await waitFor(() => {
      expect(result.current.estimatedTimeRemaining).toBeGreaterThan(0)
    })

    const etaAtPlanning = result.current.estimatedTimeRemaining

    // Move to music-render
    emitEvent({
      jobId: 'test-job-id',
      stage: 'music-render',
      progress: 0.2,
      timestamp: new Date().toISOString(),
    })

    await waitFor(() => {
      expect(result.current.estimatedTimeRemaining).toBeLessThan(etaAtPlanning)
    })
  })

  it('should track stage durations', async () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected')
    })

    emitEvent({
      jobId: 'test-job-id',
      stage: 'planning',
      progress: 1,
      timestamp: new Date().toISOString(),
      duration: 11500,
    })

    await waitFor(() => {
      const planningState = result.current.stages.get('planning')
      expect(planningState?.duration).toBe(11500)
    })
  })

  it('should provide reconnect function', () => {
    const { result } = renderHook(() => useJobTimeline('test-job-id'))

    expect(result.current.reconnect).toBeDefined()
    expect(typeof result.current.reconnect).toBe('function')
  })
})
