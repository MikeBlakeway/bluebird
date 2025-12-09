import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { JobEvent, JobId, JobIdSchema, JobStage } from '@bluebird/types'
import { createJobEventSubscriber } from '../lib/events.js'
import { getJobStatus } from '../lib/queue.js'

interface Params {
  jobId: JobId
}

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

const send = (reply: FastifyReply, event: JobEvent) => {
  reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)
}

export async function jobEventsHandler(
  request: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply
): Promise<void> {
  const parsed = JobIdSchema.safeParse(request.params.jobId)
  if (!parsed.success) {
    reply.code(400).send({ error: 'Invalid jobId' })
    return
  }

  const jobId = parsed.data

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

  const heartbeat = setInterval(() => {
    reply.raw.write(': heartbeat\n\n')
  }, 15000)

  request.raw.on('close', async () => {
    clearInterval(heartbeat)
    if (unsubscribe) {
      await unsubscribe()
    }
    reply.raw.end()
  })
}

export function registerJobRoutes(fastify: FastifyInstance) {
  fastify.get('/jobs/:jobId/events', jobEventsHandler)
}
