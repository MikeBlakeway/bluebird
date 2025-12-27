/**
 * Similarity Worker Tests (Day 12)
 *
 * Tests for similarity check job processing
 */

import { describe, it, expect, afterAll } from 'vitest'
import { worker, closeSimilarityWorker } from '../similarity-worker.js'
import { similarityQueue } from '../../queue.js'

describe('Similarity Worker', () => {
  afterAll(async () => {
    await closeSimilarityWorker()
    await similarityQueue.close()
  })

  it('should export a worker instance', () => {
    expect(worker).toBeDefined()
    expect(worker.name).toBe('check')
  })

  it('should export a closeWorker function', () => {
    expect(closeSimilarityWorker).toBeDefined()
    expect(typeof closeSimilarityWorker).toBe('function')
  })

  it('should have correct concurrency', () => {
    expect(worker.opts.concurrency).toBe(2)
  })

  it('should have rate limiting configured', () => {
    expect(worker.opts.limiter).toBeDefined()
    expect(worker.opts.limiter?.max).toBe(10)
    expect(worker.opts.limiter?.duration).toBe(60000)
  })
})
