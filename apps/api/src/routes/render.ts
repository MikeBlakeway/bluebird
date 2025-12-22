/**
 * Render Routes (Sprint 1)
 *
 * Endpoints for rendering music and vocal stems.
 * Orchestrates synthesis workers and S3 storage.
 */

import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  RenderMusicRequestSchema,
  RenderVoiceRequestSchema,
  RenderPreviewRequestSchema,
  RenderSectionRequestSchema,
} from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { enqueueMusicJob, enqueueVoiceJob, enqueueSectionJob } from '../lib/queue.js'

export function registerRenderRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  /**
   * POST /render/music
   * Render a music stem for a specific section and instrument
   */
  app.post(
    '/render/music',
    {
      schema: {
        body: RenderMusicRequestSchema,
        response: {
          200: z.object({
            jobId: z.string(),
            status: z.literal('queued'),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
        },
        tags: ['Render'],
        description: 'Render music stem',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { projectId, jobId, sectionIndex, instrument, seed } = request.body

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
  app.post(
    '/render/vocals',
    {
      schema: {
        body: RenderVoiceRequestSchema,
        response: {
          200: z.object({
            jobId: z.string(),
            status: z.literal('queued'),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
        },
        tags: ['Render'],
        description: 'Render vocals',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { projectId, jobId, sectionIndex, lyrics, seed } = request.body

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
  app.post(
    '/render/preview',
    {
      schema: {
        body: RenderPreviewRequestSchema,
        response: {
          200: z.object({
            jobId: z.string(),
            status: z.literal('queued'),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
        },
        tags: ['Render'],
        description: 'Render preview',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { jobId } = request.body

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

  /**
   * POST /render/section
   * Regenerate a specific section (music + vocals)
   */
  app.post(
    '/render/section',
    {
      schema: {
        body: RenderSectionRequestSchema,
        response: {
          200: z.object({
            jobId: z.string(),
            status: z.literal('queued'),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
        },
        tags: ['Render'],
        description: 'Regenerate section',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { projectId, planId, sectionId, regen } = request.body

      // Enqueue section regeneration job
      const jobId = await enqueueSectionJob({
        projectId,
        planId,
        sectionId,
        regen,
        isPro: false, // TODO: Check user tier
      })

      return reply.code(200).send({
        jobId,
        status: 'queued' as const,
        message: `Section regeneration queued for ${sectionId}`,
      })
    }
  )
}
