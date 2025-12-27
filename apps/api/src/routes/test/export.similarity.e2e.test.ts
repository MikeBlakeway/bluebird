/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Fastify from 'fastify'
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod'
import { registerExportRoutes } from '../export.js'

// Mock auth and idempotency to simplify testing
vi.mock('../../lib/middleware.js', () => ({
  requireAuth: async (req: any, _reply: any) => {
    req.user = { userId: 'test-user-123', email: 'test@example.com' }
  },
  requireIdempotencyKey: async (req: any, _reply: any) => {
    req.idempotencyKey = req.headers['idempotency-key'] ?? 'test-idem-12345678'
  },
}))

// Mock DB lookup for take → project
vi.mock('../../lib/db.js', async () => {
  return {
    prisma: {
      take: {
        findUnique: vi.fn().mockResolvedValue({ projectId: 'proj-test-1234567890' }),
      },
    },
  }
})

// Mock S3 interactions: return reference features and generated melody JSON
vi.mock('../../lib/s3.js', async () => {
  const actual = await vi.importActual<any>('../../lib/s3.js')
  return {
    ...actual,
    downloadJsonFromS3: vi.fn(async (key: string) => {
      if (key.endsWith('/features/remix.json')) {
        return {
          projectId: 'proj-test-1234567890',
          contourVector: [60, 62, 64, 65, 67, 69],
          rhythmPattern: [0, 0.5, 1.0, 1.5, 2.0, 2.5],
        }
      }
      if (key.endsWith('/features/melody.json')) {
        return {
          melody: [60, 62, 64, 65, 67, 69],
          onsets: [0, 0.5, 1.0, 1.5, 2.0, 2.5],
        }
      }
      throw new Error('Unexpected S3 key: ' + key)
    }),
    getPresignedUrl: vi.fn(
      async (key: string) => `https://example.local/${encodeURIComponent(key)}`
    ),
  }
})

// Mock similarity pod client to return variable verdicts
vi.mock('../../lib/similarity.js', () => ({
  checkSimilarityViaPod: vi.fn(async () => ({
    scores: { melody: 1.0, rhythm: 1.0, combined: 1.0 },
    verdict: 'block',
    recommendations: ['Shift key +1', 'Regenerate chorus melody'],
  })),
}))

// Mock melodyStore to return valid melodies
vi.mock('../../lib/melodyStore.js', () => ({
  getMelodiesForTake: vi.fn(async () => ({
    referenceMelody: [60, 62, 64, 65, 67, 69],
    referenceOnsets: [0, 0.5, 1.0, 1.5, 2.0, 2.5],
    generatedMelody: [60, 62, 64, 65, 67, 69],
    generatedOnsets: [0, 0.5, 1.0, 1.5, 2.0, 2.5],
  })),
}))

describe('POST /export similarity gating', () => {
  let app: ReturnType<typeof Fastify>

  beforeEach(async () => {
    app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    registerExportRoutes(app)
    await app.ready()
  })

  it('returns 403 when similarity verdict is non-pass', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/export',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'test-idem-12345678',
      },
      payload: {
        planId: 'cltest123456789012345',
        takeId: 'cltest234567890123456',
        format: 'wav',
        includeStems: false,
        sampleRate: 48000,
        bitDepth: 24,
        requireSimilarityCheck: true,
      },
    })

    expect(res.statusCode).toBe(403)
    const json = JSON.parse(res.body)
    expect(json.error).toBe('Export blocked due to similarity')
    expect(json.reason).toMatch(/verdict=block/)
  })

  it('returns 200 when similarity passes', async () => {
    const sim = await import('../../lib/similarity.js')
    ;(sim.checkSimilarityViaPod as any).mockResolvedValueOnce({
      scores: { melody: 0.2, rhythm: 0.1, combined: 0.14 },
      verdict: 'pass',
      recommendations: [],
    })

    const res = await app.inject({
      method: 'POST',
      url: '/export',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': 'test-idem-12345678',
      },
      payload: {
        planId: 'cltest123456789012345',
        takeId: 'cltest234567890123456',
        format: 'mp3',
        includeStems: true,
        sampleRate: 48000,
        bitDepth: 24,
        requireSimilarityCheck: true,
      },
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.jobId).toBeDefined()
    expect(json.bundle).toBeDefined()
    expect(json.bundle.master.url).toMatch(/^https:\/\/example\.local\//)
  })
})
