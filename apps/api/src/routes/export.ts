/**
 * Export Routes (Sprint 1)
 *
 * Endpoints for exporting audio previews and final mixes.
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ProjectIdSchema } from '@bluebird/types'
import { requireAuth } from '../lib/middleware.js'
import { enqueueExportJob } from '../lib/queue.js'

const ExportPreviewRequestSchema = z.object({
  projectId: ProjectIdSchema,
  takeId: z.string().min(1),
  format: z.enum(['wav', 'mp3']).default('mp3'),
  includeStems: z.boolean().default(false),
})

export function registerExportRoutes(fastify: FastifyInstance) {
  /**
   * POST /export/preview
   * Export preview with presigned URLs for download
   */
  fastify.post('/export/preview', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = ExportPreviewRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid request', details: parsed.error })
    }

    const { projectId, takeId, format, includeStems } = parsed.data

    const jobId = `export:${projectId}:${takeId}:${Date.now()}`

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
  })

  /**
   * GET /export/:takeId/status
   * Check export status and get presigned URLs when ready
   */
  fastify.get('/export/:takeId/status', { preHandler: requireAuth }, async (request, reply) => {
    const { takeId } = request.params as { takeId: string }

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
  })
}
