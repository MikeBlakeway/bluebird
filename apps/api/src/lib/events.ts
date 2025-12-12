import { JobEvent, JobEventSchema, JobId } from '@bluebird/types'
import { getPublisherConnection, createSubscriberConnection } from './redis.js'

const channelForJob = (jobId: JobId) => `job-events:${jobId}`

// Get shared publisher connection
const publisher = getPublisherConnection()

export async function publishJobEvent(event: JobEvent): Promise<void> {
  await publisher.publish(channelForJob(event.jobId), JSON.stringify(event))
}

export function createJobEventSubscriber(jobId: JobId) {
  // Each subscriber needs its own connection (Redis pub/sub requirement)
  const subscriber = createSubscriberConnection()
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
  // Note: Publisher connection is shared and managed by redis.ts
  // Do not close it here - use closeRedisConnections() instead
}
