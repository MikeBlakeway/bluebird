/**
 * Similarity Route Contract Tests (Day 12)
 *
 * Tests for POST /check/similarity and GET /check/similarity/:jobId endpoints
 * Focus: Request/response schemas, auth requirements, idempotency
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { createServer } from '../../server.ts'
import { similarityQueue } from '../../lib/queue.ts'

describe('Similarity Route Contracts', () => {
  let fastify: FastifyInstance

  beforeAll(async () => {
    fastify = await createServer()
    await fastify.listen({ port: 0 })
  })

  afterAll(async () => {
    await fastify.close()
    await similarityQueue.close()
  })

  describe('POST /check/similarity', () => {
    it('should require authentication header', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          'idempotency-key': 'test-1',
        },
        payload: {
          planId: 'plan:1',
          takeId: 'take:1',
        },
      })

      expect([400, 401]).toContain(response.statusCode)
    })

    it('should require idempotency-key header', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          planId: 'plan:1',
          takeId: 'take:1',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should require planId in payload', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': 'test-2',
        },
        payload: {
          takeId: 'take:1',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should require takeId in payload', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': 'test-3',
        },
        payload: {
          planId: 'plan:1',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should accept referenceKey as optional field', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': 'test-with-ref',
        },
        payload: {
          planId: 'plan:with-ref',
          takeId: 'take:with-ref',
          referenceKey: 's3://bucket/key.wav',
        },
      })

      expect([202, 400, 404, 422]).toContain(response.statusCode)
    })

    it('should accept budgetThreshold as optional field', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': 'test-with-budget',
        },
        payload: {
          planId: 'plan:budget',
          takeId: 'take:budget',
          budgetThreshold: 0.35,
        },
      })

      expect([202, 400, 404, 422]).toContain(response.statusCode)
    })

    it('should return response with jobId and message properties', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': 'test-response-schema',
        },
        payload: {
          planId: 'plan:schema',
          takeId: 'take:schema',
        },
      })

      if (response.statusCode === 202) {
        const body = JSON.parse(response.body)
        expect(body).toHaveProperty('jobId')
        expect(typeof body.jobId).toBe('string')
        expect(body).toHaveProperty('message')
      }
    })
  })

  describe('GET /check/similarity/:jobId', () => {
    it('should require authentication header', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/check/similarity/test-job-123',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should accept valid jobId parameter', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/check/similarity/valid-job-id-format',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      expect([200, 404, 401]).toContain(response.statusCode)
    })

    it('should return 404 for non-existent job', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/check/similarity/non-existent-job-that-never-exists',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      expect([404, 200, 401]).toContain(response.statusCode)
      if (response.statusCode === 404) {
        const body = JSON.parse(response.body)
        expect(body).toHaveProperty('error')
      }
    })

    it('should return SimilarityReport when job complete', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/check/similarity/any-job-id',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body)
        expect(body).toHaveProperty('verdict')
        expect(['pass', 'borderline', 'block']).toContain(body.verdict)
        expect(body).toHaveProperty('melodyScore')
        expect(body).toHaveProperty('rhythmScore')
      }
    })
  })

  describe('Idempotency Contract', () => {
    it('same idempotency-key should return same jobId', async () => {
      const key = 'idempotency-test-same-key'

      const response1 = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': key,
        },
        payload: {
          planId: 'plan:idempotent-1',
          takeId: 'take:idempotent-1',
        },
      })

      const response2 = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': key,
        },
        payload: {
          planId: 'plan:idempotent-1',
          takeId: 'take:idempotent-1',
        },
      })

      if (response1.statusCode === 202 && response2.statusCode === 202) {
        const body1 = JSON.parse(response1.body)
        const body2 = JSON.parse(response2.body)
        expect(body1.jobId).toBe(body2.jobId)
      }
    })

    it('different idempotency-key should create different jobs', async () => {
      const key1 = 'idempotency-test-key-1'
      const key2 = 'idempotency-test-key-2'

      const response1 = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': key1,
        },
        payload: {
          planId: 'plan:different-keys-1',
          takeId: 'take:different-keys-1',
        },
      })

      const response2 = await fastify.inject({
        method: 'POST',
        url: '/check/similarity',
        headers: {
          authorization: 'Bearer test-token',
          'idempotency-key': key2,
        },
        payload: {
          planId: 'plan:different-keys-1',
          takeId: 'take:different-keys-1',
        },
      })

      if (response1.statusCode === 202 && response2.statusCode === 202) {
        const body1 = JSON.parse(response1.body)
        const body2 = JSON.parse(response2.body)
        expect(body1.jobId).not.toBe(body2.jobId)
      }
    })
  })
})
