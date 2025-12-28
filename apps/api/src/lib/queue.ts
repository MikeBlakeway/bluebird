/**
 * Queue configuration and initialization for BullMQ.
 * Handles job queuing with priorities, DLQ, and idempotency.
 */

import { Queue, QueueOptions } from 'bullmq'
import type { ProjectId, JobId } from '@bluebird/types'
import { getQueueConnection } from './redis'

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
  SECTION: 'section',
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

export interface SectionJobData {
  projectId: ProjectId
  planId: JobId
  sectionId: string
  regen: boolean
  isPro?: boolean
}

export interface SimilarityJobData {
  projectId: ProjectId
  jobId: JobId
  takeId: string
  referenceKey?: string // S3 key for reference melody features
  budgetThreshold?: number // Max allowed similarity (default: 0.48)
  isPro?: boolean
}

export interface SeparationJobData {
  projectId: ProjectId
  takeId: string
  jobId: JobId
  audioUrl?: string
  audioKey?: string
  mode?: 'vocals' | '4stem' | '6stem'
  quality?: 'fast' | 'balanced' | 'best'
  isPro?: boolean
}

export interface DiarizationJobData {
  projectId: ProjectId
  takeId: string
  jobId: JobId
  audioUrl?: string
  audioKey?: string
  mode?: 'timestamps' | 'separation'
  minSpeakers?: number
  maxSpeakers?: number
  isPro?: boolean
}

// Get shared Redis connection
const redisConnection = getQueueConnection()

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
export const analyzeQueue = new Queue<SeparationJobData | DiarizationJobData>(
  QUEUE_NAMES.ANALYZE,
  defaultQueueOptions
)
export const musicQueue = new Queue<MusicJobData>(QUEUE_NAMES.SYNTH, defaultQueueOptions)
export const voiceQueue = new Queue<VoiceJobData>(QUEUE_NAMES.VOCAL, defaultQueueOptions)
export const mixQueue = new Queue<MixJobData>(QUEUE_NAMES.MIX, defaultQueueOptions)
export const exportQueue = new Queue<ExportJobData>(QUEUE_NAMES.EXPORT, defaultQueueOptions)
export const sectionQueue = new Queue<SectionJobData>(QUEUE_NAMES.SECTION, defaultQueueOptions)
export const similarityQueue = new Queue<SimilarityJobData>(QUEUE_NAMES.CHECK, defaultQueueOptions)

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
 * Enqueue a source separation job (delegates to separation pod).
 */
export async function enqueueSeparationJob(data: SeparationJobData): Promise<void> {
  await analyzeQueue.add('separate-audio', data, {
    jobId: data.jobId,
    priority: data.isPro ? PRIORITY.PRO : PRIORITY.STANDARD,
  })
}

/**
 * Enqueue a speaker diarization job (delegates to diarization pod).
 */
export async function enqueueDiarizationJob(data: DiarizationJobData): Promise<void> {
  await analyzeQueue.add('diarize-audio', data, {
    jobId: data.jobId,
    priority: data.isPro ? PRIORITY.PRO : PRIORITY.STANDARD,
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
 * Enqueue a section regeneration job.
 */
export async function enqueueSectionJob(data: SectionJobData): Promise<string> {
  const jobId = `${data.projectId}:section-regen:${data.sectionId}:${Date.now()}`
  await sectionQueue.add('regenerate-section', data, {
    jobId,
    priority: data.isPro ? PRIORITY.PRO : PRIORITY.STANDARD,
  })
  return jobId
}

/**
 * Enqueue a similarity check job.
 */
export async function enqueueSimilarityJob(data: SimilarityJobData): Promise<void> {
  await similarityQueue.add('check-similarity', data, {
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
  const queues = [
    planQueue,
    analyzeQueue,
    musicQueue,
    voiceQueue,
    mixQueue,
    exportQueue,
    sectionQueue,
    similarityQueue,
  ]

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
    sectionQueue.close(),
    similarityQueue.close(),
  ]

  // Note: Redis connection is shared and managed by redis.ts
  // Do not close it here - use closeRedisConnections() instead

  await Promise.all(closePromises)
}
