/**
 * Similarity Check Routes (Sprint 2)
 *
 * Endpoints for checking melody/rhythm similarity against reference audio.
 */

import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  CheckSimilarityRequestSchema,
  CheckSimilarityResponseSchema,
  SimilarityReportSchema,
  type SimilarityReport,
} from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { createRouteLogger } from '../lib/logger.js'
import { enqueueSimilarityJob } from '../lib/queue.js'
import { downloadJsonFromS3, getS3Paths } from '../lib/s3.js'
import { prisma } from '../lib/db.js'

const log = createRouteLogger('/check/similarity', 'routes')

export function registerSimilarityRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  /**
   * POST /check/similarity
   * Check similarity between generated melody and reference audio.
   * Export-gating decision based on interval n-grams and rhythmic DTW.
   */
  app.post(
    '/check/similarity',
    {
      schema: {
        body: CheckSimilarityRequestSchema,
        response: {
          200: CheckSimilarityResponseSchema,
          202: z.object({
            jobId: z.string(),
            report: z.null(),
            canExport: z.boolean(),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
        tags: ['Similarity'],
        description: 'Check similarity for export gating',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { planId, takeId, referenceKey } = request.body
      const jobId = request.idempotencyKey ?? `similarity:${planId}:${takeId}:${Date.now()}`

      try {
        // Enqueue similarity check job
        await enqueueSimilarityJob({
          projectId: planId.split(':')[0] ?? planId, // Extract projectId from planId
          jobId,
          takeId,
          referenceKey,
          budgetThreshold: 0.48, // Default threshold (block >= 0.48)
          isPro: false, // TODO: Get from user context
        })

        const response = {
          jobId,
          report: null, // Will be available after worker completes
          canExport: false, // Unknown until check completes
          message: 'Similarity check queued. Subscribe to SSE for updates.',
        }

        log.info({ planId, takeId, jobId }, 'Similarity check job queued')

        return reply.code(202).send(response)
      } catch (error) {
        log.error({ error, planId, takeId }, 'Failed to queue similarity check')
        return reply.code(500).send({ error: 'Failed to queue similarity check' })
      }
    }
  )

  /**
   * GET /check/similarity/:jobId
   * Get similarity report by job ID.
   */
  app.get(
    '/check/similarity/:jobId',
    {
      schema: {
        params: z.object({
          jobId: z.string(),
        }),
        response: {
          200: z.object({
            report: SimilarityReportSchema,
          }),
          404: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
        tags: ['Similarity'],
        description: 'Get similarity report by job ID',
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const { jobId } = request.params

      try {
        // Try to find the Take by searching for the jobId in similarity reports
        const take = await prisma.take.findFirst({
          where: {
            jobId,
          },
          select: {
            id: true,
            projectId: true,
          },
        })

        if (!take) {
          return reply.code(404).send({ error: 'Similarity report not found' })
        }

        // Get S3 paths for this take
        const s3Paths = getS3Paths(take.projectId, take.id)

        // Try to find the most recent similarity report
        // TODO: List all reports and return the latest one
        // For now, try a known key pattern: reports/similarity-{timestamp}.json
        const reportKey = `${s3Paths.base}/reports/similarity-latest.json`

        try {
          const report = await downloadJsonFromS3<SimilarityReport>(reportKey)

          log.info({ jobId, reportKey, verdict: report.verdict }, 'Retrieved similarity report')

          return reply.code(200).send({ report })
        } catch (_reportError) {
          // Report not found in S3
          return reply.code(404).send({ error: 'Similarity report not yet available' })
        }
      } catch (_error) {
        log.error({ _error, jobId }, 'Failed to get similarity report')
        return reply.code(500).send({ error: 'Failed to retrieve similarity report' })
      }
    }
  )
}
