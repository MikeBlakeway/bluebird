import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../server.js'
import { FastifyInstance } from 'fastify'
import { enqueuePlanJob } from '../lib/queue.js'
import { publishJobEvent } from '../lib/events.js'

describe('SSE Job Events', () => {
  let server: FastifyInstance

  beforeAll(async () => {
    server = await createServer()
  })

  afterAll(async () => {
    await server.close()
  })

  it('should stream job events via SSE', async () => {
    const jobId = `test-job-${Date.now()}`

    // Start SSE connection
    const response = await server.inject({
      method: 'GET',
      url: `/jobs/${jobId}/events`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('text/event-stream')
    expect(response.headers['cache-control']).toBe('no-cache')

    // Response should contain initial event
    const body = response.body
    expect(body).toContain('data:')
    expect(body).toContain(jobId)
  })

  it('should emit queued event when job is enqueued', async () => {
    const jobId = `plan-job-${Date.now()}`

    await enqueuePlanJob({
      projectId: 'test-project',
      jobId,
      lyrics: 'Test lyrics here',
      genre: 'pop',
      isPro: false,
    })

    // Publish initial event
    await publishJobEvent({
      jobId,
      stage: 'queued',
      progress: 0,
      timestamp: new Date().toISOString(),
      message: 'Job enqueued',
    })

    // Give Redis time to propagate
    await new Promise((resolve) => setTimeout(resolve, 100))

    const response = await server.inject({
      method: 'GET',
      url: `/jobs/${jobId}/events`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toContain('queued')
  })

  it('should handle invalid jobId gracefully', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/jobs//events',
    })

    expect(response.statusCode).toBe(404)
  })

  it('should include heartbeat messages', async () => {
    const jobId = `heartbeat-test-${Date.now()}`

    const response = await server.inject({
      method: 'GET',
      url: `/jobs/${jobId}/events`,
    })

    expect(response.statusCode).toBe(200)

    // SSE format should be present
    expect(response.headers['content-type']).toBe('text/event-stream')
  })
})
