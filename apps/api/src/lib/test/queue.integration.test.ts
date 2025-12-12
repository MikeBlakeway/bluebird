import { test, describe, expect, beforeAll, afterAll } from 'vitest'
import { enqueuePlanJob, getJobStatus, planQueue, closeQueues } from '../queue.js'
import { closeWorkers } from '../worker.js'
import { ProjectIdSchema, JobIdSchema } from '@bluebird/types'

describe('Queue Integration', () => {
  beforeAll(async () => {
    // Ensure queues are clean
    await planQueue.drain()
  })

  afterAll(async () => {
    await closeWorkers()
    await closeQueues()
  })

  test('should enqueue and process a plan job', async () => {
    const projectId = ProjectIdSchema.parse('cuid123456789testproject01234')
    const jobId = JobIdSchema.parse('test-queue-job-123')

    // Enqueue job
    await enqueuePlanJob({
      projectId,
      jobId,
      lyrics: 'Test lyrics for queue integration',
      genre: 'pop',
      seed: 42,
      isPro: false,
    })

    // Verify job was queued
    const queuedJob = await planQueue.getJob(jobId)
    expect(queuedJob).toBeDefined()
    expect(queuedJob?.data.lyrics).toBe('Test lyrics for queue integration')

    // Wait for worker to process (with timeout)
    let attempts = 0
    let status = await getJobStatus(jobId)

    while (attempts < 20 && status?.state !== 'completed' && status?.state !== 'failed') {
      await new Promise((resolve) => setTimeout(resolve, 500)) // Wait 500ms
      status = await getJobStatus(jobId)
      attempts++
    }

    // Verify job completed
    expect(status).toBeDefined()
    expect(status?.state).toBe('completed')
    expect(status?.progress).toBe(100)
  }, 15000) // 15s timeout for worker processing

  test('should handle job priority correctly', async () => {
    const projectId = ProjectIdSchema.parse('cuid123456789testproject01235')

    // Enqueue standard priority job
    await enqueuePlanJob({
      projectId,
      jobId: JobIdSchema.parse('test-priority-standard'),
      lyrics: 'Standard priority job',
      genre: 'rock',
      isPro: false,
    })

    // Enqueue pro priority job
    await enqueuePlanJob({
      projectId,
      jobId: JobIdSchema.parse('test-priority-pro'),
      lyrics: 'Pro priority job',
      genre: 'rock',
      isPro: true,
    })

    const standardJob = await planQueue.getJob('test-priority-standard')
    const proJob = await planQueue.getJob('test-priority-pro')

    expect(standardJob?.opts.priority).toBe(1)
    expect(proJob?.opts.priority).toBe(10)
  })

  test('should use jobId as idempotency key', async () => {
    const projectId = ProjectIdSchema.parse('cuid123456789testproject01236')
    const jobId = JobIdSchema.parse('test-idempotency-key')

    // Enqueue same job twice
    await enqueuePlanJob({
      projectId,
      jobId,
      lyrics: 'Idempotency test',
      genre: 'jazz',
    })

    await enqueuePlanJob({
      projectId,
      jobId,
      lyrics: 'Idempotency test (duplicate)',
      genre: 'jazz',
    })

    // Should only have one job (BullMQ deduplicates by jobId)
    const job = await planQueue.getJob(jobId)
    expect(job).toBeDefined()

    // Original data should be preserved (duplicate rejected)
    expect(job?.data.lyrics).toBe('Idempotency test')
  })
})
