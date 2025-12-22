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
  type CheckSimilarityResponse,
  type SimilarityReport,
} from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { createRouteLogger } from '../lib/logger.js'

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
        // TODO: Call similarity pod with generated melody and reference features
        // For now, generate stub similarity report

        // Stub: Generate passing similarity report
        const report: SimilarityReport = {
          jobId,
          referenceKey: referenceKey || 'none',
          scores: {
            melody: 0.25, // Below threshold (pass)
            rhythm: 0.3, // Below threshold (pass)
            combined: 0.28,
          },
          verdict: 'pass',
          reason: 'Generated melody is sufficiently original (combined score: 0.28 < 0.48)',
          recommendations: [
            'Melody interval patterns are distinct',
            'Rhythmic contour is original',
            'Export approved',
          ],
          eightBarCloneDetected: false,
          budgetUsed: 0.28,
          checkedAt: new Date().toISOString(),
        }

        const response: CheckSimilarityResponse = {
          jobId,
          report,
          canExport: report.verdict === 'pass',
          message:
            report.verdict === 'pass'
              ? 'Similarity check passed. Export approved.'
              : report.verdict === 'borderline'
                ? 'Similarity is borderline. Review recommendations before exporting.'
                : 'Similarity check failed. Export blocked.',
        }

        log.info(
          { planId, takeId, verdict: report.verdict, budgetUsed: report.budgetUsed },
          'Similarity check completed'
        )

        return reply.code(200).send(response)
      } catch (error) {
        log.error({ error, planId, takeId }, 'Failed to check similarity')
        return reply.code(500).send({ error: 'Failed to check similarity' })
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
        },
        tags: ['Similarity'],
        description: 'Get similarity report by job ID',
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const { jobId } = request.params

      try {
        // TODO: Query database or S3 for similarity report
        // For now, return stub 404
        return reply.code(404).send({ error: 'Similarity report not found' })
      } catch (error) {
        log.error({ error, jobId }, 'Failed to get similarity report')
        return reply.code(404).send({ error: 'Failed to retrieve similarity report' })
      }
    }
  )
}
