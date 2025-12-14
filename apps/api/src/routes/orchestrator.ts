import { FastifyInstance, FastifyReply } from 'fastify'
import { PlanSongRequestSchema, type PlanSongResponse } from '@bluebird/types'
import { enqueuePlanJob } from '../lib/queue.js'
import { publishJobEvent } from '../lib/events.js'
import { requireAuth, requireIdempotencyKey, type AuthenticatedRequest } from '../lib/middleware.js'
import { createRouteLogger } from '../lib/logger.js'

const log = createRouteLogger('/plan/song', 'POST')

/**
 * POST /plan/song
 * Main orchestrator endpoint for song planning.
 * Takes lyrics + metadata, runs analyzer → planner pipeline, returns arrangement plan.
 * Supports idempotency via Idempotency-Key header (future: will persist to DB).
 */
export async function planSongHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // Require auth
  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  // Parse request
  const parsed = PlanSongRequestSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Invalid request', details: parsed.error.format() })
  }

  const { projectId, lyrics, genre, seed } = parsed.data
  const idempotencyKey = request.idempotencyKey

  try {
    // Generate jobId (format: project:timestamp:seed)
    // Use idempotency key as jobId if provided, otherwise generate
    const jobId = idempotencyKey || `${projectId}:${Date.now()}:${seed || 0}`

    // Enqueue plan job (worker will process asynchronously)
    await enqueuePlanJob({
      projectId,
      jobId,
      lyrics,
      genre,
      seed,
      isPro: false, // TODO: Check user tier from request.user
    })

    await publishJobEvent({
      jobId,
      stage: 'queued',
      progress: 0,
      timestamp: new Date().toISOString(),
      message: 'Job enqueued',
    })

    // Build response
    const response: PlanSongResponse = {
      jobId,
      projectId,
      status: 'queued',
      // plan will be available after worker processes the job
    }

    return reply.code(202).send(response)
  } catch (error) {
    log.error({ error, projectId }, 'Failed to plan song')
    return reply.code(400).send({
      message: error instanceof Error ? error.message : 'Failed to plan song',
    })
  }
}

export function registerOrchestratorRoutes(fastify: FastifyInstance) {
  fastify.post('/plan/song', { preHandler: [requireAuth, requireIdempotencyKey] }, planSongHandler)
}
