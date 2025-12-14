/**
 * Mix Routes (Sprint 1)
 *
 * Endpoints for mixing and mastering audio stems.
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ProjectIdSchema, JobIdSchema } from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { enqueueMixJob } from '../lib/queue.js'

const MixFinalRequestSchema = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  takeId: z.string().min(1),
  targetLUFS: z.number().min(-24).max(-6).default(-14),
  truePeakLimit: z.number().min(-2).max(0).default(-1),
})

export function registerMixRoutes(fastify: FastifyInstance) {
  /**
   * POST /mix/final
   * Mix all stems and apply mastering (LUFS normalization, limiting)
   */
  fastify.post(
    '/mix/final',
    { preHandler: [requireAuth, requireIdempotencyKey] },
    async (request, reply) => {
      const parsed = MixFinalRequestSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request', details: parsed.error })
      }

      const { projectId, jobId, takeId, targetLUFS, truePeakLimit } = parsed.data

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
