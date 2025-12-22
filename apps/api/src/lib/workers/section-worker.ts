/**
 * Section Regeneration Worker (Sprint 2, Task 2.10)
 *
 * Processes jobs from the 'section' queue:
 * 1. Receives section regeneration request (projectId, planId, sectionId)
 * 2. Loads arrangement plan from database
 * 3. Enqueues child jobs for:
 *    - Each instrument in the section (to music queue)
 *    - Vocals for the section (to vocal queue)
 * 4. Emits SSE progress events
 * 5. Coordinates completion of all child jobs
 *
 * This worker enables per-section regeneration with target P50 latency ≤20s
 */

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES, type SectionJobData, enqueueMusicJob, enqueueVoiceJob } from '../queue.js'
import { publishJobEvent } from '../events.js'
import { prisma } from '../db.js'
import { ArrangementSpecSchema, type JobStage } from '@bluebird/types'
import { getQueueConnection } from '../redis.js'
import { createJobLogger } from '../logger.js'

// Get shared Redis connection
const redisConnection = getQueueConnection()

const now = () => new Date().toISOString()

async function sendEvent(jobId: string, stage: JobStage, progress: number, message?: string) {
  await publishJobEvent({
    jobId,
    stage,
    progress,
    message,
    timestamp: now(),
  })
}

/**
 * Process a section regeneration job
 */
async function processSectionJob(job: Job<SectionJobData>): Promise<void> {
  const { projectId, planId, sectionId, regen } = job.data
  const jobId = job.id ?? 'unknown'
  const log = createJobLogger(jobId, 'section')

  log.info({ projectId, planId, sectionId, regen }, 'Processing section regeneration job')

  // Parse sectionId to get index (format: "section-0", "section-1", etc.)
  const parts = sectionId.split('-')
  const sectionIdx = parseInt(parts[1] ?? '0')
  if (isNaN(sectionIdx)) {
    throw new Error(`Invalid sectionId format: ${sectionId}`)
  }

  await job.updateProgress(5)
  await sendEvent(jobId, 'queued', 0.05, `Loading arrangement plan`)

  // Fetch arrangement plan from database
  const take = await prisma.take.findUnique({
    where: { jobId: planId },
    select: { id: true, plan: true },
  })

  if (!take || !take.plan) {
    throw new Error(`Plan not found for planId: ${planId}`)
  }

  const parseResult = ArrangementSpecSchema.safeParse(take.plan)
  if (!parseResult.success) {
    throw new Error(`Invalid arrangement plan: ${parseResult.error.message}`)
  }
  const arrangement = parseResult.data

  const section = arrangement.sections[sectionIdx]
  if (!section) {
    throw new Error(`Section ${sectionIdx} not found in arrangement`)
  }

  log.debug({ sectionType: section.type, bars: section.bars }, 'Section loaded')

  // Enqueue music jobs for each instrument
  const instruments = arrangement.instrumentation
  const musicJobIds: string[] = []

  await job.updateProgress(10)
  await sendEvent(jobId, 'music-render', 0.1, `Queueing music stems (0/${instruments.length})`)

  for (let i = 0; i < instruments.length; i++) {
    const instrument = instruments[i]
    if (!instrument) continue // Skip if instrument is undefined
    const musicJobId = `${planId}:${sectionIdx}:${instrument}:${Date.now()}`

    await enqueueMusicJob({
      projectId,
      jobId: musicJobId,
      sectionIndex: sectionIdx,
      instrument,
      seed: arrangement.seed ?? Math.floor(Math.random() * 1000000),
      isPro: job.data.isPro ?? false,
    })

    musicJobIds.push(musicJobId)

    const progress = 0.1 + ((i + 1) / instruments.length) * 0.4
    await job.updateProgress(progress * 100)
    await sendEvent(
      jobId,
      'music-render',
      progress,
      `Queueing music stems (${i + 1}/${instruments.length})`
    )
  }

  log.info({ musicJobCount: musicJobIds.length }, 'Music jobs enqueued')

  // Enqueue vocal job
  await job.updateProgress(60)
  await sendEvent(jobId, 'vocal-render', 0.6, `Queueing vocals`)

  // Extract lyrics for this section from the arrangement
  // For now, use placeholder lyrics (will be implemented when VocalScore is integrated)
  const sectionLyrics = `Section ${sectionIdx} lyrics placeholder`
  const vocalJobId = `${planId}:${sectionIdx}:vocals:${Date.now()}`

  await enqueueVoiceJob({
    projectId,
    jobId: vocalJobId,
    sectionIndex: sectionIdx,
    lyrics: sectionLyrics,
    seed: arrangement.seed ?? Math.floor(Math.random() * 1000000),
    isPro: job.data.isPro ?? false,
  })

  log.info({ vocalJobId }, 'Vocal job enqueued')

  // For MVP: Mark as completed after enqueuing child jobs
  // Future enhancement: Wait for all child jobs to complete before marking as done
  await job.updateProgress(100)
  await sendEvent(jobId, 'completed', 1.0, `Section ${sectionId} regeneration queued`)

  log.info('Section regeneration job completed (child jobs enqueued)')
}

// Create and export the worker
export const sectionWorker = new Worker<SectionJobData>(QUEUE_NAMES.SECTION, processSectionJob, {
  connection: redisConnection,
  concurrency: 3,
  limiter: {
    max: 15,
    duration: 60000, // 15 jobs per minute
  },
})

// Worker event handlers
sectionWorker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`[SECTION-WORKER] Job ${job.id} completed`)
})

sectionWorker.on('failed', (job, error) => {
  // eslint-disable-next-line no-console
  console.error(`[SECTION-WORKER] Job ${job?.id} failed:`, error)
})

sectionWorker.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error('[SECTION-WORKER] Worker error:', error)
})

/**
 * Close the section worker gracefully
 */
export async function closeSectionWorker(): Promise<void> {
  await sectionWorker.close()
}
