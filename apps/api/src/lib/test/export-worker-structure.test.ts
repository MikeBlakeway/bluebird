/**
 * Export Worker Structure Tests
 *
 * Validates that the export worker is properly configured and exported.
 */

import { describe, it, expect } from 'vitest'
import { exportWorker, closeExportWorker } from '../workers/export-worker'

describe('Export Worker Structure', () => {
  it('should export exportWorker', () => {
    expect(exportWorker).toBeDefined()
    expect(typeof exportWorker).toBe('object')
  })

  it('should export closeExportWorker function', () => {
    expect(closeExportWorker).toBeDefined()
    expect(typeof closeExportWorker).toBe('function')
  })

  it('should have correct queue name', () => {
    expect(exportWorker.name).toBe('export')
  })

  it('should have worker options defined', () => {
    expect(exportWorker.opts).toBeDefined()
  })

  it('should have concurrency set to 2', () => {
    expect(exportWorker.opts.concurrency).toBe(2)
  })

  it('should have rate limiter configured', () => {
    expect(exportWorker.opts.limiter).toBeDefined()
    expect(exportWorker.opts.limiter?.max).toBe(10)
    expect(exportWorker.opts.limiter?.duration).toBe(60 * 1000)
  })
})
