import IORedis from 'ioredis'
import { JobEvent, JobEventSchema, JobId } from '@bluebird/types'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const redisOptions = {
  maxRetriesPerRequest: null as number | null,
  enableReadyCheck: false,
}

const channelForJob = (jobId: JobId) => `job-events:${jobId}`

const publisher = new IORedis(REDIS_URL, redisOptions)

export async function publishJobEvent(event: JobEvent): Promise<void> {
  await publisher.publish(channelForJob(event.jobId), JSON.stringify(event))
}

export function createJobEventSubscriber(jobId: JobId) {
  const subscriber = new IORedis(REDIS_URL, redisOptions)
  const channel = channelForJob(jobId)

  return {
    subscribe: async (onEvent: (event: JobEvent) => void) => {
      await subscriber.subscribe(channel)

      const handler = (channelName: string, payload: string) => {
        if (channelName !== channel) return
        try {
          const parsed = JobEventSchema.parse(JSON.parse(payload))
          onEvent(parsed)
        } catch (err) {
          // ignore malformed messages to keep stream alive
        }
      }

      subscriber.on('message', handler)

      const unsubscribe = async () => {
        subscriber.off('message', handler)
        await subscriber.unsubscribe(channel)
        subscriber.disconnect()
      }

      return unsubscribe
    },
  }
}

export async function closeEventBus(): Promise<void> {
  await publisher.quit()
}
