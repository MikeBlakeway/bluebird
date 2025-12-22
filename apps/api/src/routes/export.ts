/**
 * Export Routes (Sprint 1)
 *
 * Endpoints for exporting audio previews and final mixes.
 */

import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { TakeIdSchema, ExportPreviewRequestSchema } from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { enqueueExportJob } from '../lib/queue.js'
import { createRouteLogger } from '../lib/logger.js'

const ExportStatusParamsSchema = z.object({
  takeId: TakeIdSchema,
})

const log = createRouteLogger('/export', 'routes')

export function registerExportRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  /**
   * POST /export/preview
   * Export preview with presigned URLs for download
   */
  app.post(
    '/export/preview',
    {
      schema: {
        body: ExportPreviewRequestSchema,
        response: {
          200: z.object({
            jobId: z.string(),
            status: z.literal('queued'),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
        tags: ['Export'],
        description: 'Export preview',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { projectId, takeId, format, includeStems } = request.body

      try {
        const jobId = request.idempotencyKey ?? `export:${projectId}:${takeId}:${Date.now()}`

        // Enqueue export job
        await enqueueExportJob({
          projectId,
          jobId,
          takeId,
          format,
          includeStems,
          isPro: false, // TODO: Check user tier
        })

        return reply.code(200).send({
          jobId,
          status: 'queued' as const,
          message: `Export queued for take ${takeId} (${format})`,
        })
      } catch (error) {
        log.error({ error, projectId, takeId }, 'Failed to enqueue export job')
        return reply.code(500).send({ error: 'Failed to queue export job' })
      }
    }
  )

  /**
   * GET /export/:takeId/status
   * Check export status and get presigned URLs when ready
   */
  app.get(
    '/export/:takeId/status',
    {
      schema: {
        params: ExportStatusParamsSchema,
        response: {
          200: z.object({
            takeId: z.string(),
            status: z.string(),
            urls: z.object({
              master: z.string(),
              stems: z.array(z.string()),
            }),
            expiresAt: z.string(),
          }),
          400: z.object({ error: z.string() }),
        },
        tags: ['Export'],
        description: 'Get export status',
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const { takeId } = request.params

      // TODO: Query database for export status and S3 URLs
      // For now, return placeholder

      return reply.code(200).send({
        takeId,
        status: 'completed',
        urls: {
          master: `https://cdn.bluebird.local/exports/${takeId}/master.mp3`,
          stems: [],
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    }
  )
}
