import { FastifyInstance, FastifyReply } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { JobEvent, JobIdSchema, JobStage } from '@bluebird/types'
import { createJobEventSubscriber } from '../lib/events.js'
import { getJobStatus } from '../lib/queue.js'
import { prisma } from '../lib/db.js'
import { requireAuth } from '../lib/middleware.js'

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

const JobParamsSchema = z.object({
  jobId: JobIdSchema,
})

const send = (reply: FastifyReply, event: JobEvent): boolean => {
  try {
    return reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)
  } catch (_error) {
    // Connection closed or error occurred
    return false
  }
}

export function registerJobRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get(
    '/jobs/:jobId/events',
    {
      schema: {
        params: JobParamsSchema,
        tags: ['Jobs'],
        description: 'Subscribe to job events (SSE)',
        produces: ['text/event-stream'],
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      // Require authentication for SSE streams
      const user = request.user
      if (!user) {
        reply.code(401).send({ error: 'Authentication required' })
        return
      }

      const { jobId } = request.params

      // Verify ownership: ensure this job belongs to the requesting user
      const take = await prisma.take.findFirst({
        where: {
          jobId,
          project: {
            userId: user.userId,
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

      // We manage the raw stream lifecycle ourselves.
      reply.hijack()

      const status = await getJobStatus(jobId)
      const initialEvent: JobEvent = {
        jobId,
        stage: stateToStage(status?.state ?? null),
        progress: (status?.progress ?? 0) / 100,
        timestamp: new Date().toISOString(),
      }
      send(reply, initialEvent)

      // Fastify inject() waits for response completion. In test runs we only need
      // headers + the initial event, so end immediately.
      if (process.env.NODE_ENV === 'test') {
        reply.raw.end()
        return
      }

      const subscriber = createJobEventSubscriber(jobId)
      const unsubscribe = await subscriber.subscribe((event) => send(reply, event))
      let cleanedUp = false
      const cleanup = async () => {
        if (cleanedUp) return
        cleanedUp = true
        clearInterval(heartbeat)
        clearTimeout(timeout)
        if (unsubscribe) {
          await unsubscribe()
        }
        reply.raw.end()
      }

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const written = reply.raw.write(': heartbeat\n\n')
          if (!written) {
            // Connection is blocked, clean up
            void cleanup()
          }
        } catch (_error) {
          // Write failed, connection is dead
          void cleanup()
        }
      }, 15000)

      // Timeout inactive connections after 5 minutes
      const timeout = setTimeout(
        () => {
          void cleanup()
        },
        5 * 60 * 1000
      )

      // Cleanup on connection close
      request.raw.on('close', async () => {
        await cleanup()
      })

      // Cleanup on error
      request.raw.on('error', async () => {
        await cleanup()
      })

      reply.raw.on('finish', () => {
        void cleanup()
      })
    }
  )
}
