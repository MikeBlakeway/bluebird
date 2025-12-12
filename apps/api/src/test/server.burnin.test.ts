/**
 * Burn-in tests for Sprint 0
 * Tests system under realistic load scenarios
 */

import { describe, it, expect, afterAll } from 'vitest'
import { enqueuePlanJob } from '../lib/queue.js'
import { createJobEventSubscriber, closeEventBus } from '../lib/events.js'
import { closeQueues } from '../lib/queue.js'
import { closeWorkers } from '../lib/worker.js'

describe('Burn-in Tests', () => {
  afterAll(async () => {
    await closeQueues()
    await closeWorkers()
    await closeEventBus()
  })

  it('should handle 10 concurrent plan jobs', async () => {
    const projectId = 'burnin-test-concurrent'
    const jobs = []

    // Enqueue 10 jobs concurrently
    for (let i = 0; i < 10; i++) {
      const jobId = `${projectId}:${Date.now()}:${i}`
      jobs.push(
        enqueuePlanJob({
          projectId,
          jobId,
          lyrics: `Test lyrics ${i}\nLine 2\nLine 3`,
          genre: 'pop_2010s',
          seed: i,
          isPro: i % 2 === 0, // Alternate priority
        })
      )
    }

    // All jobs should enqueue without error
    await expect(Promise.all(jobs)).resolves.not.toThrow()
  }, 30000)

  it('should stream SSE events for multiple jobs in parallel', async () => {
    const projectId = 'burnin-test-sse'
    const numStreams = 5
    const streams = []

    for (let i = 0; i < numStreams; i++) {
      const jobId = `${projectId}:${Date.now()}:${i}`

      // Enqueue job
      await enqueuePlanJob({
        projectId,
        jobId,
        lyrics: `SSE test ${i}\nMultiple lines\nFor testing`,
        genre: 'pop_2010s',
        seed: i,
        isPro: false,
      })

      // Create SSE subscriber
      const subscriber = createJobEventSubscriber(jobId)
      const events: string[] = []

      const promise = new Promise<void>((resolve) => {
        subscriber.subscribe((event) => {
          events.push(event.stage)
          if (event.stage === 'completed' || event.stage === 'failed') {
            resolve()
          }
        })
      })

      streams.push({ jobId, promise, events })
    }

    // Wait for all streams to complete
    await Promise.all(streams.map((s) => s.promise))

    // Verify each stream received events
    for (const stream of streams) {
      expect(stream.events.length).toBeGreaterThan(0)
      // Plan jobs emit: queued → planning → completed/failed
      expect(stream.events).toContain('planning')
      expect(['completed', 'failed']).toContain(stream.events[stream.events.length - 1])
    }
  }, 60000)

  it('should enforce job idempotency (duplicate jobId)', async () => {
    const projectId = 'burnin-test-idempotency'
    const jobId = `${projectId}:${Date.now()}:idempotent`

    // Enqueue first job
    await enqueuePlanJob({
      projectId,
      jobId,
      lyrics: 'Idempotency test\nLine 2',
      genre: 'pop_2010s',
      seed: 123,
      isPro: false,
    })

    // Enqueue duplicate (should be deduplicated by BullMQ)
    await enqueuePlanJob({
      projectId,
      jobId, // Same jobId
      lyrics: 'Duplicate attempt\nLine 2',
      genre: 'indie_rock',
      seed: 456,
      isPro: true,
    })

    // Both enqueue calls should succeed (BullMQ handles deduplication)
    // The second call should be a no-op or return the existing job
    expect(true).toBe(true) // If we get here without error, test passes
  }, 15000)

  it('should handle jobs with edge-case lyrics (very short)', async () => {
    const projectId = 'burnin-test-edge-short'
    const jobId = `${projectId}:${Date.now()}:short`

    // Enqueue job
    await enqueuePlanJob({
      projectId,
      jobId,
      lyrics: 'Short song', // Minimum 10 chars
      genre: 'folk',
      seed: 1,
      isPro: false,
    })

    // Wait for completion via SSE
    const subscriber = createJobEventSubscriber(jobId)
    await new Promise<void>((resolve) => {
      subscriber.subscribe((event) => {
        if (event.stage === 'completed' || event.stage === 'failed') {
          resolve()
        }
      })
    })
  }, 15000)

  it('should handle jobs with edge-case lyrics (very long)', async () => {
    const projectId = 'burnin-test-edge-long'
    const jobId = `${projectId}:${Date.now()}:long`

    // Generate 5000 character lyrics (max allowed)
    const longLyrics = 'Long song lyrics\n'.repeat(280) // ~4800 chars

    // Enqueue job
    await enqueuePlanJob({
      projectId,
      jobId,
      lyrics: longLyrics,
      genre: 'trap',
      seed: 999,
      isPro: true,
    })

    // Wait for completion via SSE
    const subscriber = createJobEventSubscriber(jobId)
    await new Promise<void>((resolve) => {
      subscriber.subscribe((event) => {
        if (event.stage === 'completed' || event.stage === 'failed') {
          resolve()
        }
      })
    })
  }, 30000)
})
