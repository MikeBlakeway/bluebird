/**
 * Mix Worker Structure Tests
 *
 * Verifies mix-worker.ts exports and configuration
 */

import { describe, it, expect } from 'vitest'
import { mixWorker, closeMixWorker } from '../workers/mix-worker.js'
import { QUEUE_NAMES } from '../queue.js'

describe('Mix Worker Structure', () => {
  it('should export mixWorker instance', () => {
    expect(mixWorker).toBeDefined()
    expect(mixWorker).toHaveProperty('name')
    expect(mixWorker.name).toBe(QUEUE_NAMES.MIX)
  })

  it('should export closeMixWorker function', () => {
    expect(closeMixWorker).toBeDefined()
    expect(typeof closeMixWorker).toBe('function')
  })

  it('should be configured with correct queue name', () => {
    expect(mixWorker.name).toBe('mix')
  })

  it('should have worker properties', () => {
    expect(mixWorker).toHaveProperty('opts')
    expect(mixWorker.opts).toHaveProperty('concurrency')
    expect(mixWorker.opts).toHaveProperty('limiter')
  })

  it('should have correct concurrency configuration', () => {
    expect(mixWorker.opts.concurrency).toBe(2)
  })

  it('should have correct rate limiter configuration', () => {
    const limiter = mixWorker.opts.limiter
    expect(limiter).toBeDefined()
    if (limiter) {
      expect(limiter.max).toBe(10)
      expect(limiter.duration).toBe(60000)
    }
  })
})
