/**
 * Shared Redis connection pool for BullMQ queues, workers, and pub/sub.
 * Reduces memory overhead by reusing connections instead of creating separate instances.
 */

import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const redisOptions = {
  maxRetriesPerRequest: null as number | null,
  enableReadyCheck: false,
  lazyConnect: false,
  // Connection pool settings
  enableOfflineQueue: true,
  maxLoadingRetryTime: 10000,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
}

// Shared connection for BullMQ queues and workers
let queueConnection: IORedis | null = null

// Shared connection for pub/sub events
let publisherConnection: IORedis | null = null

/**
 * Get or create the shared queue/worker connection.
 */
export function getQueueConnection(): IORedis {
  if (!queueConnection) {
    queueConnection = new IORedis(REDIS_URL, redisOptions)

    queueConnection.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[REDIS QUEUE] Connection error:', err)
    })

    queueConnection.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[REDIS QUEUE] Connected')
    })
  }

  return queueConnection
}

/**
 * Get or create the shared publisher connection.
 */
export function getPublisherConnection(): IORedis {
  if (!publisherConnection) {
    publisherConnection = new IORedis(REDIS_URL, redisOptions)

    publisherConnection.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[REDIS PUBLISHER] Connection error:', err)
    })

    publisherConnection.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[REDIS PUBLISHER] Connected')
    })
  }

  return publisherConnection
}

/**
 * Create a new subscriber connection (required for each subscriber).
 * Note: Redis pub/sub requires a dedicated connection per subscriber.
 */
export function createSubscriberConnection(): IORedis {
  const subscriber = new IORedis(REDIS_URL, redisOptions)

  subscriber.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[REDIS SUBSCRIBER] Connection error:', err)
  })

  return subscriber
}

/**
 * Close all Redis connections gracefully.
 */
export async function closeRedisConnections(): Promise<void> {
  const closePromises: Promise<void>[] = []

  if (queueConnection) {
    closePromises.push(queueConnection.quit().then(() => {}))
    queueConnection = null
  }

  if (publisherConnection) {
    closePromises.push(publisherConnection.quit().then(() => {}))
    publisherConnection = null
  }

  await Promise.all(closePromises)
}
