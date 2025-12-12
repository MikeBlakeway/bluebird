/**
 * Music Synthesis Worker (Sprint 1)
 *
 * Processes jobs from the 'music' queue:
 * 1. Receives arrangement spec + section index + instrument
 * 2. Generates audio stem using synthesizeMusic()
 * 3. Encodes to WAV format
 * 4. Uploads to S3
 * 5. Emits SSE progress events
 * 6. Updates Take record
 */

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES, type MusicJobData } from '../queue.js'
import { synthesizeMusic, encodeWAV } from '../music-synth.js'
import { uploadToS3, getS3Paths } from '../s3.js'
import { publishJobEvent } from '../events.js'
import { prisma } from '../db.js'
import { ArrangementSpecSchema, type JobStage } from '@bluebird/types'
import { getQueueConnection } from '../redis.js'

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
 * Process a music synthesis job
 */
async function processMusicJob(job: Job<MusicJobData>): Promise<void> {
  const { projectId, jobId, sectionIndex, instrument, seed } = job.data

  // eslint-disable-next-line no-console
  console.log(
    `[MUSIC-WORKER] Processing job ${jobId} - section ${sectionIndex}, instrument ${instrument}`
  )

  await job.updateProgress(5)
  await sendEvent(jobId, 'music-render', 0.05, `Synthesizing ${instrument}`)

  // 1. Fetch arrangement plan from database
  const take = await prisma.take.findUnique({
    where: { jobId },
    select: { id: true, plan: true },
  })

  if (!take) {
    throw new Error(`Take not found for jobId: ${jobId}`)
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

  await job.updateProgress(15)
  await sendEvent(jobId, 'music-render', 0.15, `Loaded arrangement plan`)

  // 2. Generate audio buffer
  const audioBuffer = await synthesizeMusic({
    arrangement,
    sectionIndex,
    instrument,
    seed,
  })

  await job.updateProgress(60)
  await sendEvent(jobId, 'music-render', 0.6, `Generated ${instrument} audio`)

  // 3. Encode to WAV
  const wavBuffer = encodeWAV(audioBuffer)

  await job.updateProgress(75)
  await sendEvent(jobId, 'music-render', 0.75, `Encoded to WAV`)

  // 4. Upload to S3
  const s3Paths = getS3Paths(projectId, take.id)
  const s3Key = s3Paths.section(sectionIndex).music(instrument)

  await uploadToS3(s3Key, wavBuffer, 'audio/wav')

  await job.updateProgress(90)
  await sendEvent(jobId, 'music-render', 0.9, `Uploaded to S3: ${s3Key}`)

  // 5. Update Take record (mark section music as complete)
  // For now, just update the timestamp - full section tracking can be added later
  await prisma.take.update({
    where: { id: take.id },
    data: {
      updatedAt: new Date(),
    },
  })

  await job.updateProgress(100)
  await sendEvent(jobId, 'completed', 1.0, `Music stem complete: ${instrument}`)

  // eslint-disable-next-line no-console
  console.log(`[MUSIC-WORKER] Completed job ${jobId} - ${s3Key}`)
}

/**
 * Music synthesis worker
 */
export const musicWorker = new Worker<MusicJobData>(QUEUE_NAMES.SYNTH, processMusicJob, {
  connection: redisConnection,
  concurrency: 2, // Process 2 music jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 60000, // per 60 seconds
  },
})

musicWorker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`[MUSIC-WORKER] Job ${job.id} completed`)
})

musicWorker.on('failed', (job, error) => {
  // eslint-disable-next-line no-console
  console.error(`[MUSIC-WORKER] Job ${job?.id} failed:`, error)
})

/**
 * Graceful shutdown
 */
export async function closeMusicWorker(): Promise<void> {
  await musicWorker.close()
}
