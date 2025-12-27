/**
 * Export Routes (Sprint 1/2)
 *
 * Endpoints for exporting audio previews and final mastered bundles.
 */

import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  TakeIdSchema,
  ExportFinalRequestSchema,
  ExportFinalResponseSchema,
  type ExportFinalResponse,
  type ExportBundle,
} from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { enqueueExportJob } from '../lib/queue.js'
import { getPresignedUrl } from '../lib/s3.js'
import { createRouteLogger } from '../lib/logger.js'

const ExportStatusParamsSchema = z.object({
  takeId: TakeIdSchema,
})

// Unwrapped schemas for Fastify compatibility
const ExportPreviewRequestBody = z.object({
  projectId: z.string().cuid2(),
  takeId: z.string().min(1),
  format: z.enum(['wav', 'mp3']),
  includeStems: z.boolean(),
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
        body: ExportPreviewRequestBody,
        response: {
          200: z.object({
            jobId: z.string(),
            status: z.literal('queued'),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
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

  /**
   * POST /export
   * Export final mastered bundle (master + stems + metadata + similarity report).
   * Requires similarity check to pass unless explicitly bypassed.
   */
  app.post(
    '/export',
    {
      schema: {
        body: ExportFinalRequestSchema,
        response: {
          200: ExportFinalResponseSchema,
          400: z.object({ error: z.string() }),
          403: z.object({ error: z.string(), reason: z.string() }),
          500: z.object({ error: z.string() }),
        },
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { planId, takeId, format, includeStems, sampleRate, bitDepth, requireSimilarityCheck } =
        request.body

      const jobId = request.idempotencyKey ?? `export:final:${planId}:${takeId}:${Date.now()}`

      try {
        // Similarity gating
        if (requireSimilarityCheck) {
          const enforce = process.env.SIMILARITY_ENFORCE === 'true'
          const { getMelodiesForTake } = await import('../lib/melodyStore.js')
          const melodies = await getMelodiesForTake(planId, takeId)

          if (melodies) {
            const { checkSimilarityViaPod } = await import('../lib/similarity.js')
            const result = await checkSimilarityViaPod({
              referenceMelody: melodies.referenceMelody,
              generatedMelody: melodies.generatedMelody,
              referenceOnsets: melodies.referenceOnsets,
              generatedOnsets: melodies.generatedOnsets,
            })

            if (result.verdict !== 'pass') {
              return reply.code(403).send({
                error: 'Export blocked due to similarity',
                reason: `verdict=${result.verdict}; combined=${result.scores.combined.toFixed(3)}`,
              })
            }
          } else if (enforce) {
            return reply
              .code(400)
              .send({ error: 'Similarity check required but melodies unavailable' })
          }
        }

        // TODO: Generate presigned URLs for master and stems
        // For now, generate stub URLs
        const masterKey = `projects/stub/takes/${takeId}/export/master.${format}`
        const masterUrl = await getPresignedUrl(masterKey, 3600)

        const bundle: ExportBundle = {
          jobId,
          projectId: planId, // Use actual planId instead of stub
          master: {
            format,
            sampleRate,
            bitDepth,
            key: masterKey,
            url: masterUrl,
          },
          stems: includeStems
            ? [
                {
                  name: 'vocals',
                  format,
                  key: `projects/stub/takes/${takeId}/export/vocals.${format}`,
                  url: await getPresignedUrl(
                    `projects/stub/takes/${takeId}/export/vocals.${format}`,
                    3600
                  ),
                },
                {
                  name: 'music',
                  format,
                  key: `projects/stub/takes/${takeId}/export/music.${format}`,
                  url: await getPresignedUrl(
                    `projects/stub/takes/${takeId}/export/music.${format}`,
                    3600
                  ),
                },
              ]
            : [],
          metadata: {
            title: 'Untitled Song',
            artist: 'Bluebird AI',
            duration: 180.0,
            bpm: 120,
            key: 'C',
          },
          createdAt: new Date().toISOString(),
        }

        const response: ExportFinalResponse = {
          jobId,
          bundle,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
          message: 'Export bundle generated successfully. Download URLs valid for 1 hour.',
        }

        log.info(
          { planId, takeId, format, includeStems, sampleRate, bitDepth },
          'Generated export bundle'
        )

        return reply.code(200).send(response)
      } catch (error) {
        log.error({ error, planId, takeId }, 'Failed to generate export bundle')
        return reply.code(500).send({ error: 'Failed to generate export bundle' })
      }
    }
  )
}
