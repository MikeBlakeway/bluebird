/**
 * Render Routes (Sprint 1)
 *
 * Endpoints for rendering music and vocal stems.
 * Orchestrates synthesis workers and S3 storage.
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ProjectIdSchema, JobIdSchema } from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { enqueueMusicJob, enqueueVoiceJob } from '../lib/queue.js'

const RenderMusicRequestSchema = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  sectionIndex: z.number().int().min(0),
  instrument: z.string().min(1),
  seed: z.number().int().optional(),
})

const RenderVoiceRequestSchema = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  sectionIndex: z.number().int().min(0),
  lyrics: z.string().min(1),
  seed: z.number().int().optional(),
})

const RenderPreviewRequestSchema = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
})

export function registerRenderRoutes(fastify: FastifyInstance) {
  /**
   * POST /render/music
   * Render a music stem for a specific section and instrument
   */
  fastify.post(
    '/render/music',
    { preHandler: [requireAuth, requireIdempotencyKey] },
    async (request, reply) => {
      const parsed = RenderMusicRequestSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request', details: parsed.error })
      }

      const { projectId, jobId, sectionIndex, instrument, seed } = parsed.data

      // Enqueue music synthesis job
      await enqueueMusicJob({
        projectId,
        jobId,
        sectionIndex,
        instrument,
        seed: seed ?? Math.floor(Math.random() * 1000000),
        isPro: false, // TODO: Check user tier
      })

      return reply.code(200).send({
        jobId,
        status: 'queued' as const,
        message: `Music render queued for ${instrument} in section ${sectionIndex}`,
      })
    }
  )

  /**
   * POST /render/vocals
   * Render vocals for a specific section with lyrics
   */
  fastify.post(
    '/render/vocals',
    { preHandler: [requireAuth, requireIdempotencyKey] },
    async (request, reply) => {
      const parsed = RenderVoiceRequestSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request', details: parsed.error })
      }

      const { projectId, jobId, sectionIndex, lyrics, seed } = parsed.data

      // Enqueue voice synthesis job
      await enqueueVoiceJob({
        projectId,
        jobId,
        sectionIndex,
        lyrics,
        seed: seed ?? Math.floor(Math.random() * 1000000),
        isPro: false, // TODO: Check user tier
      })

      return reply.code(200).send({
        jobId,
        status: 'queued' as const,
        message: `Vocal render queued for section ${sectionIndex}`,
      })
    }
  )

  /**
   * POST /render/preview
   * Render complete preview (all sections, all stems)
   */
  fastify.post(
    '/render/preview',
    { preHandler: [requireAuth, requireIdempotencyKey] },
    async (request, reply) => {
      const parsed = RenderPreviewRequestSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid request', details: parsed.error })
      }

      const { jobId } = parsed.data

      // TODO: Enqueue orchestration job that coordinates:
      // 1. Render all music stems for all sections
      // 2. Render all vocal stems for all sections
      // 3. Mix stems together
      // 4. Export preview

      return reply.code(200).send({
        jobId,
        status: 'queued' as const,
        message: 'Preview render queued',
      })
    }
  )
}
