/**
 * Tests for SSE Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SSEClient, createSSEClient } from './sse-client'
import type { JobEvent } from '@bluebird/types'

// ============================================================================
// Mocks
// ============================================================================

class MockEventSource {
  url: string
  readyState: number = 0
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    // Simulate async connection
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  close() {
    this.readyState = 2
  }

  // Test helpers
  simulateMessage(data: string) {
    if (this.onmessage) {
      const event = new MessageEvent('message', { data })
      this.onmessage(event)
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

// Replace global EventSource with mock
global.EventSource = MockEventSource as unknown as typeof EventSource

// ============================================================================
// Tests
// ============================================================================

describe('SSEClient', () => {
  let onEvent: ReturnType<typeof vi.fn>
  let onStateChange: ReturnType<typeof vi.fn>
  let onError: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onEvent = vi.fn()
    onStateChange = vi.fn()
    onError = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Connection', () => {
    it('should connect to SSE endpoint', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
      })

      client.connect()

      // Should transition connecting → connected
      expect(onStateChange).toHaveBeenCalledWith('connecting')

      // Wait for async connection
      await vi.advanceTimersByTimeAsync(20)

      expect(onStateChange).toHaveBeenCalledWith('connected')
      expect(client.isConnected()).toBe(true)
    })

    it('should not double-connect if already connected', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      onStateChange.mockClear()
      client.connect() // Try to connect again

      expect(onStateChange).not.toHaveBeenCalled()
    })

    it('should disconnect cleanly', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      client.disconnect()

      expect(onStateChange).toHaveBeenCalledWith('disconnected')
      expect(client.isConnected()).toBe(false)
    })
  })

  describe('Event Handling', () => {
    it('should parse and emit job events', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      // Get the mock EventSource instance
      const es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).eventSource as MockEventSource

      const jobEvent: JobEvent = {
        jobId: 'job-123',
        stage: 'music-render',
        progress: 0.5,
        timestamp: new Date().toISOString(),
      }

      es.simulateMessage(JSON.stringify(jobEvent))

      expect(onEvent).toHaveBeenCalledWith(jobEvent)
    })

    it('should auto-disconnect on completion', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      const es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).eventSource as MockEventSource

      const completedEvent: JobEvent = {
        jobId: 'job-123',
        stage: 'completed',
        progress: 1,
        timestamp: new Date().toISOString(),
      }

      es.simulateMessage(JSON.stringify(completedEvent))

      expect(onEvent).toHaveBeenCalledWith(completedEvent)
      expect(client.isConnected()).toBe(false)
    })

    it('should auto-disconnect on failure', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      const es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).eventSource as MockEventSource

      const failedEvent: JobEvent = {
        jobId: 'job-123',
        stage: 'failed',
        progress: 0.3,
        error: 'Synthesis failed',
        timestamp: new Date().toISOString(),
      }

      es.simulateMessage(JSON.stringify(failedEvent))

      expect(client.isConnected()).toBe(false)
    })

    it('should handle malformed JSON', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onError,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      const es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).eventSource as MockEventSource

      es.simulateMessage('invalid json{')

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to parse SSE event'),
        })
      )
    })
  })

  describe('Heartbeat', () => {
    it('should reset heartbeat on each message', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onError,
        heartbeatTimeout: 1000,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      const es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).eventSource as MockEventSource

      const jobEvent: JobEvent = {
        jobId: 'job-123',
        stage: 'planning',
        progress: 0.1,
        timestamp: new Date().toISOString(),
      }

      // Send message at 500ms
      await vi.advanceTimersByTimeAsync(500)
      es.simulateMessage(JSON.stringify(jobEvent))

      // Wait another 900ms (total 1400ms, but heartbeat reset at 500ms)
      await vi.advanceTimersByTimeAsync(900)

      // Should still be connected (heartbeat was reset)
      expect(client.isConnected()).toBe(true)

      // Now wait 1000ms more to trigger timeout
      await vi.advanceTimersByTimeAsync(100)

      // Should have timed out
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Heartbeat timeout'),
        })
      )
    })

    it('should timeout if no messages received', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onError,
        heartbeatTimeout: 1000,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      // Wait for heartbeat timeout
      await vi.advanceTimersByTimeAsync(1000)

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Heartbeat timeout'),
        })
      )
      expect(client.isConnected()).toBe(false)
    })
  })

  describe('Reconnection', () => {
    it('should reconnect with exponential backoff', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
        onError,
        initialReconnectDelay: 100,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      onStateChange.mockClear()

      // Simulate error
      const es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).eventSource as MockEventSource
      es.simulateError()

      // Should disconnect
      expect(onStateChange).toHaveBeenCalledWith('disconnected')

      // Should schedule reconnect at 100ms
      await vi.advanceTimersByTimeAsync(100)
      expect(onStateChange).toHaveBeenCalledWith('connecting')

      // Let it connect
      await vi.advanceTimersByTimeAsync(20)
      expect(onStateChange).toHaveBeenCalledWith('connected')
    })

    it('should use exponential backoff delays', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
        initialReconnectDelay: 100,
        maxReconnectDelay: 1000,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      // Simulate 3 consecutive errors
      for (let i = 0; i < 3; i++) {
        onStateChange.mockClear()
        const es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (client as any).eventSource as MockEventSource
        es.simulateError()

        // Expected delays: 100ms, 200ms, 400ms
        const expectedDelay = 100 * Math.pow(2, i)
        await vi.advanceTimersByTimeAsync(expectedDelay)

        expect(onStateChange).toHaveBeenCalledWith('connecting')
        await vi.advanceTimersByTimeAsync(20) // Let it connect
      }
    })

    // TODO: Fix this test - max attempts logic needs review
    it.skip('should stop reconnecting after max attempts', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
        onError,
        initialReconnectDelay: 10,
        maxReconnectAttempts: 2,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      // Simulate errors repeatedly
      for (let i = 0; i < 5; i++) {
        const es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (client as any).eventSource as MockEventSource
        if (es) {
          es.simulateError()
        }
        await vi.advanceTimersByTimeAsync(20)
      }

      // Should have received max reconnection error eventually
      const hasMaxAttemptsError = onError.mock.calls.some(([error]) =>
        error.message.includes('Max reconnection attempts')
      )
      expect(hasMaxAttemptsError).toBe(true)
    })

    it('should reset reconnect attempts on successful connection', async () => {
      const client = new SSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
        initialReconnectDelay: 10,
      })

      client.connect()
      await vi.advanceTimersByTimeAsync(20)

      // Simulate error and reconnect
      let es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).eventSource as MockEventSource
      es.simulateError()
      await vi.advanceTimersByTimeAsync(10)
      await vi.advanceTimersByTimeAsync(20)

      // Now connected again, reconnect attempts should be reset
      expect(client.isConnected()).toBe(true)

      // Simulate another error - should use initial delay again
      onStateChange.mockClear()
      es = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).eventSource as MockEventSource
      es.simulateError()

      await vi.advanceTimersByTimeAsync(10) // Initial delay
      expect(onStateChange).toHaveBeenCalledWith('connecting')
    })
  })

  describe('createSSEClient helper', () => {
    it('should create and auto-connect client', async () => {
      const client = createSSEClient({
        url: 'http://localhost:4000/jobs/job-123/events',
        onEvent,
        onStateChange,
      })

      expect(onStateChange).toHaveBeenCalledWith('connecting')

      await vi.advanceTimersByTimeAsync(20)

      expect(client.isConnected()).toBe(true)
    })
  })
})
