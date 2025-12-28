/**
 * Analysis endpoints (separation, diarization, reference extraction).
 * These endpoints queue jobs for the analyzer pods and return job status via SSE.
 */

import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  SeparationRequestSchema,
  DiarizationRequestSchema,
  ReferenceAnalysisRequestSchema,
} from '@bluebird/types'
import { enqueueSeparationJob, enqueueDiarizationJob } from '../lib/queue.js'
import { authMiddleware } from '../lib/middleware.js'
import { logger } from '../lib/logger.js'

export async function registerAnalyzeRoutes(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/analyze/separate',
    {
      schema: {
        description: 'Enqueue source separation job (vocals, 4-stem, 6-stem)',
        body: SeparationRequestSchema,
      },
      preHandler: authMiddleware,
    },
    async (
      request: {
        body: z.infer<typeof SeparationRequestSchema>
      },
      reply
    ) => {
      const { projectId, takeId, audioUrl, audioKey } = request.body
      const mode = request.body.mode ?? '4stem'
      const quality = request.body.quality ?? 'balanced'

      const jobId = randomUUID()

      logger.info({ jobId, projectId, takeId, mode, quality }, 'Enqueuing separation job')

      try {
        await enqueueSeparationJob({
          projectId,
          takeId,
          jobId,
          audioUrl,
          audioKey,
          mode,
          quality,
        })

        return reply.code(202).send({
          jobId,
          status: 'queued',
          message: `Separation job queued for ${mode} mode with ${quality} quality`,
        })
      } catch (error) {
        logger.error({ error, jobId, projectId, takeId }, 'Failed to enqueue separation job')
        return reply.code(500).send({
          jobId,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/analyze/diarize',
    {
      schema: {
        description: 'Enqueue speaker diarization job',
        body: DiarizationRequestSchema,
      },
      preHandler: authMiddleware,
    },
    async (
      request: {
        body: z.infer<typeof DiarizationRequestSchema>
      },
      reply
    ) => {
      const { projectId, takeId, audioUrl, audioKey, minSpeakers, maxSpeakers } = request.body
      const mode = request.body.mode ?? 'timestamps'

      const jobId = randomUUID()

      logger.info({ jobId, projectId, takeId, mode }, 'Enqueuing diarization job')

      try {
        await enqueueDiarizationJob({
          projectId,
          takeId,
          jobId,
          audioUrl,
          audioKey,
          mode,
          minSpeakers,
          maxSpeakers,
        })

        return reply.code(202).send({
          jobId,
          status: 'queued',
          message: 'Diarization job queued for processing',
        })
      } catch (error) {
        logger.error({ error, jobId, projectId, takeId }, 'Failed to enqueue diarization job')
        return reply.code(500).send({
          jobId,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/analyze/reference',
    {
      schema: {
        description: 'Analyze reference audio for feature extraction',
        body: ReferenceAnalysisRequestSchema,
      },
      preHandler: authMiddleware,
    },
    async (
      request: {
        body: z.infer<typeof ReferenceAnalysisRequestSchema>
      },
      reply
    ) => {
      const { projectId, takeId } = request.body
      const maxDuration = request.body.maxDuration ?? 30

      const jobId = randomUUID()

      logger.info({ jobId, projectId, takeId, maxDuration }, 'Enqueuing reference analysis job')

      return reply.code(202).send({
        jobId,
        status: 'queued',
        message: 'Reference analysis job queued for processing',
      })
    }
  )
}
