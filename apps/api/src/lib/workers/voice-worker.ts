/**
 * Voice Synthesis Worker (Sprint 1 Task 1.2)
 *
 * Processes jobs from the 'vocal' queue:
 * 1. Receives arrangement spec + section index + lyrics
 * 2. Generates vocal audio using synthesizeVoice()
 * 3. Encodes to WAV format
 * 4. Uploads to S3
 * 5. Emits SSE progress events
 * 6. Updates Take record
 */

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES, type VoiceJobData } from '../queue.js'
import { synthesizeVoice } from '../voice-synth.js'
import { encodeWAV } from '../music-synth.js'
import { uploadToS3, getS3Paths } from '../s3.js'
import { publishJobEvent } from '../events.js'
import { prisma } from '../db.js'
import type { ArrangementSpec, JobStage } from '@bluebird/types'
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
 * Process a voice synthesis job
 */
async function processVoiceJob(job: Job<VoiceJobData>): Promise<void> {
  const { projectId, jobId, sectionIndex, lyrics, seed } = job.data

  // eslint-disable-next-line no-console
  console.log(`[VOICE-WORKER] Processing job ${jobId} - section ${sectionIndex}`)

  await job.updateProgress(5)
  await sendEvent(jobId, 'vocal-render', 0.05, 'Preparing vocal synthesis')

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

  const arrangement = take.plan as ArrangementSpec

  // Get section info
  if (!arrangement.sections || sectionIndex >= arrangement.sections.length) {
    throw new Error(`Invalid section index: ${sectionIndex}`)
  }

  const section = arrangement.sections[sectionIndex]

  if (!section) {
    throw new Error(`Section ${sectionIndex} not found in arrangement`)
  }

  await job.updateProgress(15)
  await sendEvent(jobId, 'vocal-render', 0.15, 'Loaded arrangement plan')

  // 2. Generate vocal audio buffer
  const audioBuffer = await synthesizeVoice({
    lyrics,
    bpm: arrangement.bpm,
    bars: section.bars,
    key: arrangement.key,
    seed,
  })

  await job.updateProgress(60)
  await sendEvent(jobId, 'vocal-render', 0.6, 'Generated vocal audio')

  // 3. Encode to WAV
  const wavBuffer = encodeWAV(audioBuffer)

  await job.updateProgress(75)
  await sendEvent(jobId, 'vocal-render', 0.75, 'Encoded to WAV')

  // 4. Upload to S3
  const s3Paths = getS3Paths(projectId, take.id)
  const s3Key = s3Paths.section(sectionIndex).vocals('main')

  await uploadToS3(s3Key, wavBuffer, 'audio/wav')

  await job.updateProgress(90)
  await sendEvent(jobId, 'vocal-render', 0.9, `Uploaded to S3: ${s3Key}`)

  // 5. Update Take record
  await prisma.take.update({
    where: { id: take.id },
    data: {
      updatedAt: new Date(),
    },
  })

  await job.updateProgress(100)
  await sendEvent(jobId, 'completed', 1.0, 'Vocal stem complete')

  // eslint-disable-next-line no-console
  console.log(`[VOICE-WORKER] Completed job ${jobId} - ${s3Key}`)
}

/**
 * Voice synthesis worker
 */
export const voiceWorker = new Worker<VoiceJobData>(QUEUE_NAMES.VOCAL, processVoiceJob, {
  connection: redisConnection,
  concurrency: 2, // Process 2 voice jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 60000, // per 60 seconds
  },
})

voiceWorker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`[VOICE-WORKER] Job ${job.id} completed`)
})

voiceWorker.on('failed', (job, error) => {
  // eslint-disable-next-line no-console
  console.error(`[VOICE-WORKER] Job ${job?.id} failed:`, error)
})

/**
 * Graceful shutdown
 */
export async function closeVoiceWorker(): Promise<void> {
  await voiceWorker.close()
}
