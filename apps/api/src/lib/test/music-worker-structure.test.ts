/**
 * Music Worker Structure Tests
 *
 * Basic tests to ensure the music worker is properly structured.
 * Full integration tests will be added in Sprint 1 Task 1.5.
 */

import { describe, it, expect } from 'vitest'

describe('Music Worker Structure', () => {
  it('should export music worker and close function', async () => {
    const module = await import('../workers/music-worker.js')

    expect(module.musicWorker).toBeDefined()
    expect(module.closeMusicWorker).toBeDefined()
    expect(typeof module.closeMusicWorker).toBe('function')
  })

  it('should have worker with expected properties', async () => {
    const { musicWorker } = await import('../workers/music-worker.js')

    expect(musicWorker).toHaveProperty('name')
    expect(musicWorker).toHaveProperty('opts')
    expect(musicWorker).toHaveProperty('on')
    expect(musicWorker).toHaveProperty('close')
  })

  it('should be configured for synth queue', async () => {
    const { musicWorker } = await import('../workers/music-worker.js')

    // Worker name should match the queue it processes
    expect(musicWorker.name).toBe('synth')
  })

  it('should have concurrency configuration', async () => {
    const { musicWorker } = await import('../workers/music-worker.js')

    expect(musicWorker.opts).toHaveProperty('concurrency')
    expect(musicWorker.opts.concurrency).toBe(2)
  })

  it('should have rate limiter configuration', async () => {
    const { musicWorker } = await import('../workers/music-worker.js')

    expect(musicWorker.opts).toHaveProperty('limiter')
    expect(musicWorker.opts.limiter).toHaveProperty('max')
    expect(musicWorker.opts.limiter).toHaveProperty('duration')
    expect(musicWorker.opts.limiter?.max).toBe(10)
    expect(musicWorker.opts.limiter?.duration).toBe(60000)
  })
})
