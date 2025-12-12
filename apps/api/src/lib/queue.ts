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

export interface MusicJobData {
  projectId: ProjectId
  jobId: JobId
  sectionIndex: number
  instrument: string
  seed: number
  isPro?: boolean
}

export interface VoiceJobData {
  projectId: ProjectId
  jobId: JobId
  sectionIndex: number
  lyrics: string
  seed: number
  isPro?: boolean
}

export interface MixJobData {
  projectId: ProjectId
  jobId: JobId
  takeId: string
  targetLUFS: number
  truePeakLimit: number
  isPro?: boolean
}

export interface ExportJobData {
  projectId: ProjectId
  jobId: JobId
  takeId: string
  format: 'wav' | 'mp3'
  includeStems: boolean
  isPro?: boolean
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
export const musicQueue = new Queue<MusicJobData>(QUEUE_NAMES.SYNTH, defaultQueueOptions)
export const voiceQueue = new Queue<VoiceJobData>(QUEUE_NAMES.VOCAL, defaultQueueOptions)
export const mixQueue = new Queue<MixJobData>(QUEUE_NAMES.MIX, defaultQueueOptions)
export const exportQueue = new Queue<ExportJobData>(QUEUE_NAMES.EXPORT, defaultQueueOptions)

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
 * Enqueue a music stem rendering job.
 */
export async function enqueueMusicJob(data: MusicJobData): Promise<void> {
  await musicQueue.add('render-music', data, {
    jobId: data.jobId,
    priority: data.isPro ? PRIORITY.PRO : PRIORITY.STANDARD,
  })
}

/**
 * Enqueue a vocal rendering job.
 */
export async function enqueueVoiceJob(data: VoiceJobData): Promise<void> {
  await voiceQueue.add('render-voice', data, {
    jobId: data.jobId,
    priority: data.isPro ? PRIORITY.PRO : PRIORITY.STANDARD,
  })
}

/**
 * Enqueue a mix job.
 */
export async function enqueueMixJob(data: MixJobData): Promise<void> {
  await mixQueue.add('mix-stems', data, {
    jobId: data.jobId,
    priority: data.isPro ? PRIORITY.PRO : PRIORITY.STANDARD,
  })
}

/**
 * Enqueue an export job.
 */
export async function enqueueExportJob(data: ExportJobData): Promise<void> {
  await exportQueue.add('export-preview', data, {
    jobId: data.jobId,
    priority: data.isPro ? PRIORITY.PRO : PRIORITY.STANDARD,
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
  const queues = [planQueue, analyzeQueue, musicQueue, voiceQueue, mixQueue, exportQueue]

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
  const closePromises = [
    planQueue.close(),
    analyzeQueue.close(),
    musicQueue.close(),
    voiceQueue.close(),
    mixQueue.close(),
    exportQueue.close(),
  ]

  // Only quit Redis if connection is still active
  if (redisConnection.status === 'ready' || redisConnection.status === 'connecting') {
    closePromises.push(redisConnection.quit().then(() => undefined))
  }

  await Promise.all(closePromises)
}
