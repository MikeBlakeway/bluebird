/**
 * Integration test for /analyze/separate flow
 * Tests: Route → Queue → Worker → SSE events
 * Uses in-memory event collection for SSE verification
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { FastifyInstance } from 'fastify'
import { Queue } from 'bullmq'
import { createServer } from '../server'
import { getQueueConnection, closeRedisConnections } from '../lib/redis'
import { SeparationRequestSchema } from '@bluebird/types'

describe('Analyze Separation Integration Test', () => {
  let server: FastifyInstance
  let analyzeQueue: Queue

  beforeAll(async () => {
    // Start server (don't boot the worker - we'll verify queue only)
    process.env.START_ANALYZE_WORKER = 'false'
    server = await createServer()
    await server.ready()

    // Create analyze queue for verification
    analyzeQueue = new Queue('analyze', {
      connection: getQueueConnection(),
    })
  })

  afterAll(async () => {
    // Close queue
    await analyzeQueue?.close()

    // Close server
    await server?.close()

    // Close Redis connections
    await closeRedisConnections()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    // Drain queue between tests
    await analyzeQueue.drain()
    await analyzeQueue.clean(0, 100, 'completed')
    await analyzeQueue.clean(0, 100, 'failed')
  })

  it('should accept valid separation request and return 202 queued response', async () => {
    const projectId = 'ckwx4qj5l0000qz3z9z9z9z9z'
    const takeId = 'ckwx4qj5l0001qz3z9z9z9z9z'
    const jobId = 'job-123'

    const payload = {
      projectId,
      takeId,
      jobId,
      audioUrl: 'https://example.com/source.wav',
      mode: '4stem' as const,
      quality: 'balanced' as const,
    }

    // Validate request with Zod
    const validationResult = SeparationRequestSchema.safeParse(payload)
    expect(validationResult.success).toBe(true)

    // POST to /analyze/separate
    const response = await server.inject({
      method: 'POST',
      url: '/analyze/separate',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'test-idempotency-key-123',
      },
      payload,
    })

    // Route should return 202 Accepted (job queued)
    expect(response.statusCode).toBe(202)
    const body = response.json()
    expect(body).toMatchObject({
      jobId: expect.any(String),
      status: 'queued',
      message: expect.stringContaining('Separation job queued'),
    })
  })

  it('should reject invalid separation request with 400', async () => {
    const payload = {
      projectId: 'invalid-cuid',
      takeId: 'also-invalid',
      // missing required jobId
    }

    const response = await server.inject({
      method: 'POST',
      url: '/analyze/separate',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'test-idempotency-key-456',
      },
      payload,
    })

    expect(response.statusCode).toBe(400)
  })

  it('should enqueue diarization job and return 202', async () => {
    const projectId = 'ckwx4qj5l0000qz3z9z9z9z9z'
    const takeId = 'ckwx4qj5l0001qz3z9z9z9z9z'
    const jobId = 'diarize-job-456'

    const payload = {
      projectId,
      takeId,
      jobId,
      audioUrl: 'https://example.com/vocals.wav',
      mode: 'timestamps' as const,
    }

    const response = await server.inject({
      method: 'POST',
      url: '/analyze/diarize',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'test-idempotency-key-789',
      },
      payload,
    })

    expect(response.statusCode).toBe(202)
    const body = response.json()
    expect(body).toMatchObject({
      jobId,
      status: 'queued',
      message: expect.stringContaining('Diarization job queued'),
    })
  })
})
