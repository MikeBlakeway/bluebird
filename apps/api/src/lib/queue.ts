/**
 * Queue configuration and initialization for BullMQ.
 * Handles job queuing with priorities, DLQ, and idempotency.
 */

import { Queue, QueueOptions } from 'bullmq'
import IORedis from 'ioredis'
import type { ProjectId, JobId } from '@bluebird/types'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Queue names (aligned with pod responsibilities)
export const QUEUE_NAMES = {
  PLAN: 'plan',
  ANALYZE: 'analyze',
  MELODY: 'melody',
  SYNTH: 'synth',
  VOCAL: 'vocal',
  MIX: 'mix',
  CHECK: 'check',
  EXPORT: 'export',
} as const

// Priority levels (higher = more urgent)
export const PRIORITY = {
  PRO: 10,
  STANDARD: 1,
} as const

// Job data types
export interface PlanJobData {
  projectId: ProjectId
  jobId: JobId
  lyrics: string
  genre: string
  seed?: number
  isPro?: boolean
}

export interface AnalyzeJobData {
  projectId: ProjectId
  jobId: JobId
  lyrics: string
}

// Create Redis connection (shared across queues)
const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
})

// Common queue options
const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5s, then 25s, then 125s
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // Keep completed jobs for 24 hours
      count: 1000, // Keep at most 1000 completed jobs
    },
    removeOnFail: false, // Keep failed jobs for debugging (DLQ)
  },
}

// Initialize queues
export const planQueue = new Queue<PlanJobData>(QUEUE_NAMES.PLAN, defaultQueueOptions)
export const analyzeQueue = new Queue<AnalyzeJobData>(QUEUE_NAMES.ANALYZE, defaultQueueOptions)

/**
 * Enqueue a song planning job.
 * Uses jobId as idempotency key to prevent duplicate processing.
 */
export async function enqueuePlanJob(data: PlanJobData): Promise<void> {
  await planQueue.add('plan-song', data, {
    jobId: data.jobId, // Use as idempotency key
    priority: data.isPro ? PRIORITY.PRO : PRIORITY.STANDARD,
  })
}

/**
 * Enqueue a lyrics analysis job.
 */
export async function enqueueAnalyzeJob(data: AnalyzeJobData): Promise<void> {
  await analyzeQueue.add('analyze-lyrics', data, {
    jobId: data.jobId,
    priority: PRIORITY.STANDARD,
  })
}

/**
 * Get job status by ID.
 */
export async function getJobStatus(jobId: JobId): Promise<{
  state: string
  progress: number
  data?: unknown
  failedReason?: string
} | null> {
  // Try all queues to find the job
  const queues = [planQueue, analyzeQueue]

  for (const queue of queues) {
    const job = await queue.getJob(jobId)
    if (job) {
      const state = await job.getState()
      return {
        state,
        progress: job.progress as number,
        data: job.data,
        failedReason: job.failedReason,
      }
    }
  }

  return null
}

/**
 * Close all queue connections gracefully.
 */
export async function closeQueues(): Promise<void> {
  await Promise.all([planQueue.close(), analyzeQueue.close(), redisConnection.quit()])
}
