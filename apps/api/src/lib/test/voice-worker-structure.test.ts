/**
 * Voice Worker Structure Tests
 *
 * Verifies voice-worker.ts exports and configuration
 */

import { describe, it, expect } from 'vitest'
import { voiceWorker, closeVoiceWorker } from '../workers/voice-worker.js'
import { QUEUE_NAMES } from '../queue.js'

describe('Voice Worker Structure', () => {
  it('should export voiceWorker instance', () => {
    expect(voiceWorker).toBeDefined()
    expect(voiceWorker).toHaveProperty('name')
    expect(voiceWorker.name).toBe(QUEUE_NAMES.VOCAL)
  })

  it('should export closeVoiceWorker function', () => {
    expect(closeVoiceWorker).toBeDefined()
    expect(typeof closeVoiceWorker).toBe('function')
  })

  it('should be configured with correct queue name', () => {
    expect(voiceWorker.name).toBe('vocal')
  })

  it('should have worker properties', () => {
    expect(voiceWorker).toHaveProperty('opts')
    expect(voiceWorker.opts).toHaveProperty('concurrency')
    expect(voiceWorker.opts).toHaveProperty('limiter')
  })

  it('should have correct concurrency configuration', () => {
    expect(voiceWorker.opts.concurrency).toBe(2)
  })

  it('should have correct rate limiter configuration', () => {
    const limiter = voiceWorker.opts.limiter
    expect(limiter).toBeDefined()
    if (limiter) {
      expect(limiter.max).toBe(10)
      expect(limiter.duration).toBe(60000)
    }
  })
})
