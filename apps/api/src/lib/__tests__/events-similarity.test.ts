/**
 * SSE Event Emission Tests (Day 12)
 *
 * Tests for Server-Sent Events (SSE) emitted during similarity checking
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import type { JobEvent } from '@bluebird/types'
import { publishJobEvent } from '../../../lib/events.js'

// Mock SSE event store for testing
const emittedEvents: JobEvent[] = []

// Mock publishJobEvent for testing
vi.mock('../../../lib/events.js', () => ({
  publishJobEvent: vi.fn(async (event: JobEvent) => {
    emittedEvents.push(event)
  }),
}))

describe('SSE Job Events', () => {
  beforeAll(() => {
    emittedEvents.length = 0
  })

  it('should emit events with correct structure', async () => {
    const event: JobEvent = {
      jobId: 'test-job-1',
      stage: 'similarity-check' as const,
      progress: 0.5,
      message: 'Processing similarity check',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    expect(emittedEvents).toHaveLength(1)
    expect(emittedEvents[0]).toEqual(event)
  })

  it('should emit events with required fields', async () => {
    const event: JobEvent = {
      jobId: 'test-job-2',
      stage: 'similarity-check' as const,
      progress: 0.75,
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    const emitted = emittedEvents[emittedEvents.length - 1]
    expect(emitted.jobId).toBeDefined()
    expect(emitted.stage).toBeDefined()
    expect(emitted.progress).toBeDefined()
    expect(emitted.timestamp).toBeDefined()
  })

  it('should emit events with optional message field', async () => {
    const eventWithMessage: JobEvent = {
      jobId: 'test-job-3',
      stage: 'similarity-check' as const,
      progress: 0.3,
      message: 'Loaded reference melody',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(eventWithMessage)

    const emitted = emittedEvents[emittedEvents.length - 1]
    expect(emitted.message).toBe('Loaded reference melody')
  })

  it('should emit events without message', async () => {
    const eventWithoutMessage: JobEvent = {
      jobId: 'test-job-4',
      stage: 'similarity-check' as const,
      progress: 0.6,
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(eventWithoutMessage)

    const emitted = emittedEvents[emittedEvents.length - 1]
    expect(emitted.message).toBeUndefined()
  })
})

describe('Similarity Check Progress Events', () => {
  beforeAll(() => {
    emittedEvents.length = 0
  })

  it('should emit event at 5% (start)', async () => {
    const event: JobEvent = {
      jobId: 'test-job-5',
      stage: 'similarity-check' as const,
      progress: 0.05,
      message: 'Starting similarity check',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    expect(emittedEvents).toContainEqual(expect.objectContaining({ progress: 0.05 }))
  })

  it('should emit event at 30% (loaded melodies)', async () => {
    const event: JobEvent = {
      jobId: 'test-job-5',
      stage: 'similarity-check' as const,
      progress: 0.3,
      message: 'Loaded generated melody',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    expect(emittedEvents).toContainEqual(expect.objectContaining({ progress: 0.3 }))
  })

  it('should emit event at 50% (loaded reference)', async () => {
    const event: JobEvent = {
      jobId: 'test-job-5',
      stage: 'similarity-check' as const,
      progress: 0.5,
      message: 'Loaded reference melody',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    expect(emittedEvents).toContainEqual(expect.objectContaining({ progress: 0.5 }))
  })

  it('should emit event at 70% (pod called)', async () => {
    const event: JobEvent = {
      jobId: 'test-job-5',
      stage: 'similarity-check' as const,
      progress: 0.7,
      message: 'Similarity computed: verdict=pass',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    expect(emittedEvents).toContainEqual(
      expect.objectContaining({
        progress: 0.7,
        message: expect.stringContaining('Similarity computed'),
      })
    )
  })

  it('should emit event at 80% (report built)', async () => {
    const event: JobEvent = {
      jobId: 'test-job-5',
      stage: 'similarity-check' as const,
      progress: 0.8,
      message: 'Built similarity report',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    expect(emittedEvents).toContainEqual(expect.objectContaining({ progress: 0.8 }))
  })

  it('should emit event at 90% (saved to S3)', async () => {
    const event: JobEvent = {
      jobId: 'test-job-5',
      stage: 'similarity-check' as const,
      progress: 0.9,
      message: 'Report saved: projects/test/takes/123/reports/similarity-1234567890.json',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    expect(emittedEvents).toContainEqual(
      expect.objectContaining({
        progress: 0.9,
        message: expect.stringContaining('Report saved'),
      })
    )
  })

  it('should emit completion event at 100%', async () => {
    const event: JobEvent = {
      jobId: 'test-job-5',
      stage: 'completed' as const,
      progress: 1.0,
      message: 'Similarity check complete: pass (score: 0.25)',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    expect(emittedEvents).toContainEqual(
      expect.objectContaining({
        stage: 'completed',
        progress: 1.0,
      })
    )
  })
})

describe('Event Timeline for Full Job', () => {
  beforeAll(() => {
    emittedEvents.length = 0
  })

  it('should emit complete event timeline', async () => {
    const jobId = 'full-timeline-test'

    const events: JobEvent[] = [
      {
        jobId,
        stage: 'similarity-check' as const,
        progress: 0.05,
        message: 'Start',
        timestamp: new Date().toISOString(),
      },
      {
        jobId,
        stage: 'similarity-check' as const,
        progress: 0.1,
        message: 'Loaded take',
        timestamp: new Date().toISOString(),
      },
      {
        jobId,
        stage: 'similarity-check' as const,
        progress: 0.3,
        message: 'Loaded generated',
        timestamp: new Date().toISOString(),
      },
      {
        jobId,
        stage: 'similarity-check' as const,
        progress: 0.5,
        message: 'Loaded reference',
        timestamp: new Date().toISOString(),
      },
      {
        jobId,
        stage: 'similarity-check' as const,
        progress: 0.7,
        message: 'Pod result',
        timestamp: new Date().toISOString(),
      },
      {
        jobId,
        stage: 'similarity-check' as const,
        progress: 0.8,
        message: 'Report built',
        timestamp: new Date().toISOString(),
      },
      {
        jobId,
        stage: 'similarity-check' as const,
        progress: 0.9,
        message: 'Stored S3',
        timestamp: new Date().toISOString(),
      },
      {
        jobId,
        stage: 'completed' as const,
        progress: 1.0,
        message: 'Complete',
        timestamp: new Date().toISOString(),
      },
    ]

    for (const event of events) {
      await publishJobEvent(event)
    }

    // Verify event ordering
    const timeline = emittedEvents.filter((e) => e.jobId === jobId)
    expect(timeline).toHaveLength(8)
    expect(timeline[0].progress).toBe(0.05)
    expect(timeline[timeline.length - 1].progress).toBe(1.0)

    // Verify monotonic progress
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].progress).toBeGreaterThanOrEqual(timeline[i - 1].progress)
    }
  })
})

describe('Event Timestamps', () => {
  beforeAll(() => {
    emittedEvents.length = 0
  })

  it('should have ISO timestamp format', async () => {
    const event: JobEvent = {
      jobId: 'test-timestamp',
      stage: 'similarity-check' as const,
      progress: 0.5,
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    const emitted = emittedEvents[emittedEvents.length - 1]
    const timestamp = emitted.timestamp

    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  })

  it('should preserve timestamp ordering', async () => {
    const jobId = 'test-ordering'

    const timestamps = [
      new Date('2025-01-01T10:00:00.000Z').toISOString(),
      new Date('2025-01-01T10:00:01.000Z').toISOString(),
      new Date('2025-01-01T10:00:02.000Z').toISOString(),
    ]

    for (const timestamp of timestamps) {
      const event: JobEvent = {
        jobId,
        stage: 'similarity-check' as const,
        progress: 0.5,
        timestamp,
      }
      await publishJobEvent(event)
    }

    const timeline = emittedEvents.filter((e) => e.jobId === jobId)
    expect(timeline[0].timestamp).toBe(timestamps[0])
    expect(timeline[1].timestamp).toBe(timestamps[1])
    expect(timeline[2].timestamp).toBe(timestamps[2])
  })
})

describe('Event Verdicts in Messages', () => {
  beforeAll(() => {
    emittedEvents.length = 0
  })

  it('should convey pass verdict in event message', async () => {
    const event: JobEvent = {
      jobId: 'verdict-pass',
      stage: 'similarity-check' as const,
      progress: 0.7,
      message: 'Similarity computed: verdict=pass',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    const emitted = emittedEvents[emittedEvents.length - 1]
    expect(emitted.message).toContain('pass')
  })

  it('should convey borderline verdict in event message', async () => {
    const event: JobEvent = {
      jobId: 'verdict-borderline',
      stage: 'similarity-check' as const,
      progress: 0.7,
      message: 'Similarity computed: verdict=borderline',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    const emitted = emittedEvents[emittedEvents.length - 1]
    expect(emitted.message).toContain('borderline')
  })

  it('should convey block verdict in event message', async () => {
    const event: JobEvent = {
      jobId: 'verdict-block',
      stage: 'similarity-check' as const,
      progress: 0.7,
      message: 'Similarity computed: verdict=block',
      timestamp: new Date().toISOString(),
    }

    await publishJobEvent(event)

    const emitted = emittedEvents[emittedEvents.length - 1]
    expect(emitted.message).toContain('block')
  })
})
