/**
 * Remix Routes (Sprint 2)
 *
 * Endpoints for reference audio upload and feature extraction.
 */

import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
  UploadReferenceAudioRequestSchema,
  UploadReferenceAudioResponseSchema,
  RemixFeaturesSchema,
  type UploadReferenceAudioResponse,
} from '@bluebird/types'
import { requireAuth, requireIdempotencyKey } from '../lib/middleware.js'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../lib/s3.js'
import { createRouteLogger } from '../lib/logger.js'

const S3_BUCKET = process.env.S3_BUCKET || 'bluebird'
const log = createRouteLogger('/remix', 'routes')

export function registerRemixRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  /**
   * POST /remix/reference/upload
   * Generate presigned URL for reference audio upload and trigger feature extraction.
   */
  app.post(
    '/remix/reference/upload',
    {
      schema: {
        body: UploadReferenceAudioRequestSchema,
        response: {
          200: UploadReferenceAudioResponseSchema,
          400: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
        tags: ['Remix'],
        description: 'Upload reference audio for remix feature extraction',
      },
      preHandler: [requireAuth, requireIdempotencyKey],
    },
    async (request, reply) => {
      const { projectId, planId, fileName, fileSize, mimeType, durationSec } = request.body

      try {
        // Generate S3 key for reference audio
        const referenceKey = `projects/${projectId}/takes/${planId}/reference/${fileName}`

        // Generate presigned upload URL (15 minutes expiration)
        const uploadCommand = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: referenceKey,
          ContentType: mimeType,
          ContentLength: fileSize,
        })

        const uploadUrl = await getSignedUrl(s3Client, uploadCommand, { expiresIn: 900 })

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

        // TODO: Enqueue feature extraction job after upload completes
        // For now, return pending status
        const response: UploadReferenceAudioResponse = {
          uploadUrl,
          referenceKey,
          expiresAt,
          status: 'pending',
          message: 'Upload URL generated. Feature extraction will begin after upload completes.',
        }

        log.info(
          { projectId, planId, referenceKey, durationSec },
          'Generated presigned upload URL for reference audio'
        )

        return reply.code(200).send(response)
      } catch (error) {
        log.error({ error, projectId, planId }, 'Failed to generate presigned upload URL')
        return reply.code(500).send({ error: 'Failed to generate upload URL' })
      }
    }
  )

  /**
   * GET /remix/reference/:projectId/:planId/features
   * Get extracted features for a reference audio (if extraction complete).
   */
  app.get(
    '/remix/reference/:projectId/:planId/features',
    {
      schema: {
        params: z.object({
          projectId: z.string(),
          planId: z.string(),
        }),
        response: {
          200: z.object({
            status: z.enum(['pending', 'processing', 'completed', 'failed']),
            features: RemixFeaturesSchema.optional(),
            message: z.string().optional(),
          }),
          404: z.object({ error: z.string() }),
        },
        tags: ['Remix'],
        description: 'Get reference audio feature extraction status',
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const { projectId, planId } = request.params

      try {
        // TODO: Query database or S3 for feature extraction status
        // For now, return stub response
        return reply.code(200).send({
          status: 'pending',
          message: 'Feature extraction not yet implemented',
        })
      } catch (error) {
        log.error({ error, projectId, planId }, 'Failed to get feature extraction status')
        return reply.code(404).send({ error: 'Features not found' })
      }
    }
  )
}
