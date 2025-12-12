import { FastifyInstance, FastifyReply } from 'fastify'
import { JobEvent, JobIdSchema, JobStage } from '@bluebird/types'
import { createJobEventSubscriber } from '../lib/events.js'
import { getJobStatus } from '../lib/queue.js'
import { prisma } from '../lib/db.js'
import type { AuthenticatedRequest } from '../lib/middleware.js'

const stateToStage = (state: string | null): JobStage => {
  if (!state) return 'queued'
  switch (state) {
    case 'waiting':
    case 'delayed':
    case 'paused':
      return 'queued'
    case 'active':
      return 'planning'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    default:
      return 'queued'
  }
}

const send = (reply: FastifyReply, event: JobEvent): boolean => {
  try {
    return reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)
  } catch (error) {
    // Connection closed or error occurred
    return false
  }
}

export async function jobEventsHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // Require authentication for SSE streams
  if (!request.user) {
    reply.code(401).send({ error: 'Authentication required' })
    return
  }

  // Type-safe params access using Fastify's typing
  const params = request.params as { jobId?: unknown }
  const parsed = JobIdSchema.safeParse(params.jobId)
  if (!parsed.success) {
    reply.code(400).send({ error: 'Invalid jobId' })
    return
  }

  const jobId = parsed.data

  // Verify ownership: ensure this job belongs to the requesting user
  const take = await prisma.take.findFirst({
    where: {
      jobId,
      project: {
        userId: request.user.userId,
      },
    },
    select: { id: true },
  })

  if (!take) {
    reply.code(404).send({ error: 'Job not found' })
    return
  }

  reply.raw.setHeader('Content-Type', 'text/event-stream')
  reply.raw.setHeader('Cache-Control', 'no-cache')
  reply.raw.setHeader('Connection', 'keep-alive')
  reply.raw.flushHeaders?.()

  const status = await getJobStatus(jobId)
  const initialEvent: JobEvent = {
    jobId,
    stage: stateToStage(status?.state ?? null),
    progress: (status?.progress ?? 0) / 100,
    timestamp: new Date().toISOString(),
  }
  send(reply, initialEvent)

  const subscriber = createJobEventSubscriber(jobId)
  const unsubscribe = await subscriber.subscribe((event) => send(reply, event))

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      const written = reply.raw.write(': heartbeat\n\n')
      if (!written) {
        // Connection is blocked, clean up
        clearInterval(heartbeat)
        if (unsubscribe) {
          void unsubscribe()
        }
      }
    } catch (error) {
      // Write failed, connection is dead
      clearInterval(heartbeat)
      if (unsubscribe) {
        void unsubscribe()
      }
    }
  }, 15000)

  // Timeout inactive connections after 5 minutes
  const timeout = setTimeout(
    () => {
      clearInterval(heartbeat)
      if (unsubscribe) {
        void unsubscribe()
      }
      reply.raw.end()
    },
    5 * 60 * 1000
  )

  // Cleanup on connection close
  request.raw.on('close', async () => {
    clearInterval(heartbeat)
    clearTimeout(timeout)
    if (unsubscribe) {
      await unsubscribe()
    }
    reply.raw.end()
  })

  // Cleanup on error
  request.raw.on('error', async () => {
    clearInterval(heartbeat)
    clearTimeout(timeout)
    if (unsubscribe) {
      await unsubscribe()
    }
    reply.raw.end()
  })
}

export function registerJobRoutes(fastify: FastifyInstance) {
  fastify.get('/jobs/:jobId/events', jobEventsHandler)
}
