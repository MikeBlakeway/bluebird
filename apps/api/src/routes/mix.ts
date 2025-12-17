/**
 * Mix Routes (Sprint 1)
 *
 * Endpoints for mixing and mastering audio stems.
 */

import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { MixFinalRequestSchema } from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { enqueueMixJob } from '../lib/queue.js'

export function registerMixRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  /**
   * POST /mix/final
   * Mix all stems and apply mastering (LUFS normalization, limiting)
   */
  app.post(
    '/mix/final',
    {
      schema: {
        body: MixFinalRequestSchema,
        response: {
          200: z.object({
            jobId: z.string(),
            status: z.literal('queued'),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
        },
        tags: ['Mix'],
        description: 'Mix final track',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { projectId, jobId, takeId, targetLUFS, truePeakLimit } = request.body

      // Enqueue mix job
      await enqueueMixJob({
        projectId,
        jobId,
        takeId,
        targetLUFS,
        truePeakLimit,
        isPro: false, // TODO: Check user tier
      })

      return reply.code(200).send({
        jobId,
        status: 'queued' as const,
        message: `Mix job queued for take ${takeId}`,
      })
    }
  )
}
