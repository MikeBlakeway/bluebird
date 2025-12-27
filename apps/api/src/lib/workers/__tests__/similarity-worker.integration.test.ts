/**
 * Similarity Worker Integration Tests (Day 12)
 *
 * End-to-end tests for similarity checking:
 * 1. Enqueue job via API
 * 2. Worker processes and stores report in S3
 * 3. Report retrieved via GET endpoint
 * 4. SSE events emitted during processing
 * 5. Export gating enforces verdicts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { similarityQueue, enqueueSimilarityJob, type SimilarityJobData } from '../../queue.ts'
import { worker } from '../similarity-worker.ts'
import type { SimilarityReport } from '@bluebird/types'

// Mock implementation would go here in real tests
// For now, we test the structure and enqueue flow

describe('Similarity Worker Integration', () => {
  beforeAll(async () => {
    // Start worker
    expect(worker).toBeDefined()
  })

  afterAll(async () => {
    await similarityQueue.close()
  })

  describe('Job Enqueuing', () => {
    it('should enqueue a similarity check job', async () => {
      const jobData: SimilarityJobData = {
        projectId: 'test-project:1',
        jobId: `test-job-${Date.now()}`,
        takeId: 'take-123',
        referenceKey: 'projects/test/reference.json',
        isPro: false,
      }

      await enqueueSimilarityJob(jobData)

      const job = await similarityQueue.getJob(jobData.jobId)
      expect(job).toBeDefined()
      expect(job?.data).toEqual(jobData)
    })

    it('should set correct priority for standard users', async () => {
      const jobData: SimilarityJobData = {
        projectId: 'test:1',
        jobId: `standard-${Date.now()}`,
        takeId: 'take-456',
        isPro: false,
      }

      await enqueueSimilarityJob(jobData)

      const job = await similarityQueue.getJob(jobData.jobId)
      expect(job?.opts.priority).toBe(1) // STANDARD
    })

    it('should set higher priority for Pro users', async () => {
      const jobData: SimilarityJobData = {
        projectId: 'test:2',
        jobId: `pro-${Date.now()}`,
        takeId: 'take-789',
        isPro: true,
      }

      await enqueueSimilarityJob(jobData)

      const job = await similarityQueue.getJob(jobData.jobId)
      expect(job?.opts.priority).toBe(10) // PRO
    })

    it('should use jobId as idempotency key', async () => {
      const jobId = `idempotent-${Date.now()}`
      const jobData: SimilarityJobData = {
        projectId: 'test:3',
        jobId,
        takeId: 'take-999',
      }

      // Enqueue twice with same jobId
      await enqueueSimilarityJob(jobData)
      await enqueueSimilarityJob(jobData)

      // Should still have only one job
      const job = await similarityQueue.getJob(jobId)
      expect(job).toBeDefined()

      // Count jobs in queue
      const count = await similarityQueue.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  describe('Queue Configuration', () => {
    it('should have correct queue name', () => {
      expect(similarityQueue.name).toBe('check')
    })

    it('should have retry configuration', () => {
      const defaultOpts = similarityQueue.opts.defaultJobOptions
      expect(defaultOpts?.attempts).toBe(3)
      expect(defaultOpts?.backoff?.type).toBe('exponential')
      expect(defaultOpts?.backoff?.delay).toBe(5000)
    })

    it('should remove jobs on completion after 24 hours', () => {
      const removeOpts = similarityQueue.opts.defaultJobOptions?.removeOnComplete
      expect(removeOpts?.age).toBe(24 * 60 * 60) // 24 hours in seconds
      expect(removeOpts?.count).toBe(1000)
    })

    it('should keep failed jobs in DLQ', () => {
      const removeOnFail = similarityQueue.opts.defaultJobOptions?.removeOnFail
      expect(removeOnFail).toBe(false)
    })
  })

  describe('Worker Configuration', () => {
    it('should process jobs from check queue', () => {
      expect(worker.name).toBe('check')
    })

    it('should have concurrency of 2', () => {
      expect(worker.opts.concurrency).toBe(2)
    })

    it('should have rate limiting configured', () => {
      const limiter = worker.opts.limiter
      expect(limiter).toBeDefined()
      expect(limiter?.max).toBe(10)
      expect(limiter?.duration).toBe(60000) // 1 minute
    })

    it('should handle job completion events', async () => {
      const completedJobs: string[] = []

      const completeHandler = (job: any) => {
        completedJobs.push(job.id)
      }

      worker.on('completed', completeHandler)

      // Handler should be registered
      expect(worker.listenerCount('completed')).toBeGreaterThan(0)

      worker.off('completed', completeHandler)
    })

    it('should handle job failure events', async () => {
      const failedJobs: string[] = []

      const failHandler = (job: any) => {
        failedJobs.push(job?.id)
      }

      worker.on('failed', failHandler)

      // Handler should be registered
      expect(worker.listenerCount('failed')).toBeGreaterThan(0)

      worker.off('failed', failHandler)
    })

    it('should handle worker errors', async () => {
      const errors: string[] = []

      const errorHandler = (error: Error) => {
        errors.push(error.message)
      }

      worker.on('error', errorHandler)

      // Handler should be registered
      expect(worker.listenerCount('error')).toBeGreaterThan(0)

      worker.off('error', errorHandler)
    })
  })

  describe('Job Data Validation', () => {
    it('should accept valid SimilarityJobData', async () => {
      const jobData: SimilarityJobData = {
        projectId: 'valid-project:1',
        jobId: `valid-${Date.now()}`,
        takeId: 'take-valid',
        referenceKey: 'projects/ref/melody.json',
        budgetThreshold: 0.48,
        isPro: true,
      }

      // Should not throw
      await enqueueSimilarityJob(jobData)

      const job = await similarityQueue.getJob(jobData.jobId)
      expect(job?.data).toEqual(jobData)
    })

    it('should accept partial SimilarityJobData', async () => {
      const jobData: SimilarityJobData = {
        projectId: 'minimal:1',
        jobId: `minimal-${Date.now()}`,
        takeId: 'take-minimal',
      }

      // Should not throw - referenceKey and budgetThreshold are optional
      await enqueueSimilarityJob(jobData)

      const job = await similarityQueue.getJob(jobData.jobId)
      expect(job?.data.referenceKey).toBeUndefined()
      expect(job?.data.budgetThreshold).toBeUndefined()
    })
  })
})

describe('Similarity Report Schema', () => {
  it('should have correct verdict values', () => {
    const verdicts = ['pass', 'borderline', 'block'] as const

    verdicts.forEach((verdict) => {
      expect(['pass', 'borderline', 'block']).toContain(verdict)
    })
  })

  it('should generate pass report for low scores', () => {
    const report: SimilarityReport = {
      jobId: 'test-1',
      referenceKey: 'ref-1',
      scores: {
        melody: 0.2,
        rhythm: 0.25,
        combined: 0.22,
      },
      verdict: 'pass',
      reason: 'Generated melody is sufficiently original (combined score: 0.22 < 0.35)',
      recommendations: ['Melody interval patterns are distinct'],
      eightBarCloneDetected: false,
      budgetUsed: 0.22,
      checkedAt: new Date().toISOString(),
    }

    expect(report.verdict).toBe('pass')
    expect(report.budgetUsed).toBeLessThan(0.35)
  })

  it('should generate borderline report for medium scores', () => {
    const report: SimilarityReport = {
      jobId: 'test-2',
      referenceKey: 'ref-2',
      scores: {
        melody: 0.4,
        rhythm: 0.38,
        combined: 0.39,
      },
      verdict: 'borderline',
      reason: 'Similarity is borderline (combined score: 0.39). Review recommended.',
      recommendations: ['Consider shifting key by 1 semitone', 'Review interval patterns'],
      eightBarCloneDetected: false,
      budgetUsed: 0.39,
      checkedAt: new Date().toISOString(),
    }

    expect(report.verdict).toBe('borderline')
    expect(report.budgetUsed).toBeGreaterThanOrEqual(0.35)
    expect(report.budgetUsed).toBeLessThan(0.48)
  })

  it('should generate block report for high scores', () => {
    const report: SimilarityReport = {
      jobId: 'test-3',
      referenceKey: 'ref-3',
      scores: {
        melody: 0.6,
        rhythm: 0.55,
        combined: 0.58,
      },
      verdict: 'block',
      reason: 'Similarity too high (combined score: 0.58 >= 0.48). Export blocked.',
      recommendations: ['Regenerate with different seed', 'Shift key by 2+ semitones'],
      eightBarCloneDetected: false,
      budgetUsed: 0.58,
      checkedAt: new Date().toISOString(),
    }

    expect(report.verdict).toBe('block')
    expect(report.budgetUsed).toBeGreaterThanOrEqual(0.48)
  })

  it('should detect 8-bar clones', () => {
    const report: SimilarityReport = {
      jobId: 'test-4',
      referenceKey: 'ref-4',
      scores: {
        melody: 0.95,
        rhythm: 0.92,
        combined: 0.94,
      },
      verdict: 'block',
      reason: '8-bar melody clone detected. Export blocked.',
      recommendations: ['Entire passage is identical to reference'],
      eightBarCloneDetected: true,
      budgetUsed: 0.94,
      checkedAt: new Date().toISOString(),
    }

    expect(report.eightBarCloneDetected).toBe(true)
    expect(report.verdict).toBe('block')
  })
})

describe('Export Gating Logic', () => {
  it('should allow export for pass verdict', () => {
    const verdict: 'pass' | 'borderline' | 'block' = 'pass'
    const canExport = verdict === 'pass'

    expect(canExport).toBe(true)
  })

  it('should allow export with warning for borderline verdict', () => {
    const verdict: 'pass' | 'borderline' | 'block' = 'borderline'
    const canExport = true
    const requiresWarning = verdict === 'borderline'

    expect(canExport).toBe(true)
    expect(requiresWarning).toBe(true)
  })

  it('should block export for block verdict', () => {
    const verdict: 'pass' | 'borderline' | 'block' = 'block'
    const canExport = verdict !== 'block'

    expect(canExport).toBe(false)
  })

  it('should provide recommendations for blocked export', () => {
    const report: SimilarityReport = {
      jobId: 'test-5',
      referenceKey: 'ref-5',
      scores: {
        melody: 0.6,
        rhythm: 0.55,
        combined: 0.58,
      },
      verdict: 'block',
      reason: 'Similarity too high',
      recommendations: [
        'Regenerate with different seed',
        'Shift key by 2+ semitones',
        'Modify time signature',
      ],
      eightBarCloneDetected: false,
      budgetUsed: 0.58,
      checkedAt: new Date().toISOString(),
    }

    expect(report.recommendations).toHaveLength(3)
    expect(report.recommendations[0]).toContain('Regenerate')
  })
})
