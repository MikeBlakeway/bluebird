/**
 * Mix Worker (Sprint 1 Task 1.3)
 *
 * Processes jobs from the 'mix' queue:
 * 1. Fetches all section stems from S3 (music + vocals)
 * 2. Sums stems with basic mixing (gain adjustments, alignment)
 * 3. Applies LUFS normalization
 * 4. Applies true-peak limiting
 * 5. Writes master WAV to S3
 * 6. Emits SSE progress events
 * 7. Updates Take record
 */

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES, type MixJobData } from '../queue.js'
import { downloadFromS3, uploadToS3, getS3Paths } from '../s3.js'
import { publishJobEvent } from '../events.js'
import { prisma } from '../db.js'
import { ArrangementSpecSchema, type JobStage } from '@bluebird/types'
import { getQueueConnection } from '../redis.js'
import { mixStemsToMaster } from '../mix.js'
import { createJobLogger, logger } from '../logger.js'

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
 * Process a mix job
 */
async function processMixJob(job: Job<MixJobData>): Promise<void> {
  const { projectId, jobId, takeId, targetLUFS, truePeakLimit } = job.data

  // eslint-disable-next-line no-console
  const log = createJobLogger(jobId, 'mix')
  log.info({ projectId, takeId }, 'Processing mix job')

  await job.updateProgress(5)
  await sendEvent(jobId, 'mixing', 0.05, 'Starting mix process')

  // Step 1: Fetch arrangement plan from database (Progress: 10%)
  const take = await prisma.take.findUnique({
    where: { id: takeId },
    select: { id: true, jobId: true, plan: true },
  })

  if (!take) {
    throw new Error(`Take not found: ${takeId}`)
  }

  if (!take.plan) {
    throw new Error(`No plan found for take: ${take.id}`)
  }

  // Validate arrangement plan with Zod for type safety
  const parseResult = ArrangementSpecSchema.safeParse(take.plan)
  if (!parseResult.success) {
    throw new Error(`Invalid arrangement plan: ${parseResult.error.message}`)
  }
  const arrangement = parseResult.data

  await job.updateProgress(10)
  await sendEvent(jobId, 'mixing', 0.1, 'Loaded arrangement plan')

  // Step 2: Download all stems from S3 (Progress: 20-50%)
  const s3Paths = getS3Paths(projectId, takeId)
  const stemBuffers: Buffer[] = []
  const sectionCount = arrangement.sections.length

  for (let i = 0; i < sectionCount; i++) {
    const section = arrangement.sections[i]
    if (!section) continue

    // Download music stem
    const musicKey = s3Paths.section(i).music('main')
    try {
      const musicBuffer = await downloadFromS3(musicKey)
      stemBuffers.push(musicBuffer)
    } catch (_error) {
      // eslint-disable-next-line no-console
      log.warn({ sectionIndex: i, s3Key: musicKey }, 'Music stem not found')
    }

    // Download vocal stem
    const vocalKey = s3Paths.section(i).vocals('main')
    try {
      const vocalBuffer = await downloadFromS3(vocalKey)
      stemBuffers.push(vocalBuffer)
    } catch (_error) {
      // eslint-disable-next-line no-console
      log.warn({ sectionIndex: i, s3Key: vocalKey }, 'Vocal stem not found')
    }

    const progressPercent = 0.2 + (i / sectionCount) * 0.3 // 20% to 50%
    await job.updateProgress(Math.floor(progressPercent * 100))
    await sendEvent(
      jobId,
      'mixing',
      progressPercent,
      `Downloaded stems for section ${i + 1}/${sectionCount}`
    )
  }

  if (stemBuffers.length === 0) {
    throw new Error('No stems found to mix')
  }

  await sendEvent(jobId, 'mixing', 0.5, `Downloaded ${stemBuffers.length} stems`)

  // Step 3: Mix stems to master (Progress: 60%)
  const masterBuffer = await mixStemsToMaster({
    stems: stemBuffers,
    targetLUFS,
    truePeakLimit,
    bpm: arrangement.bpm,
  })

  await job.updateProgress(60)
  await sendEvent(jobId, 'mixing', 0.6, 'Mixed and mastered audio')

  // Step 4: Upload master to S3 (Progress: 80%)
  const masterKey = s3Paths.mix.master
  await uploadToS3(masterKey, masterBuffer, 'audio/wav')

  await job.updateProgress(80)
  await sendEvent(jobId, 'mixing', 0.8, `Uploaded master: ${masterKey}`)

  // Step 5: Update Take record (Progress: 100%)
  await prisma.take.update({
    where: { id: take.id },
    data: {
      updatedAt: new Date(),
    },
  })

  await job.updateProgress(100)
  await sendEvent(jobId, 'completed', 1.0, 'Mix complete')

  log.info({ masterKey }, 'Mix job completed')
}

/**
 * Mix worker - processes jobs from the 'mix' queue
 */
export const mixWorker = new Worker<MixJobData>(QUEUE_NAMES.MIX, processMixJob, {
  connection: redisConnection,
  concurrency: 2, // Process 2 mix jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 60000, // per 60 seconds
  },
})

mixWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id, queue: 'mix' }, 'Mix worker job completed')
})

mixWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message, queue: 'mix' }, 'Mix worker job failed')
})

/**
 * Graceful shutdown
 */
export async function closeMixWorker(): Promise<void> {
  await mixWorker.close()
}
