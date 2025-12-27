/**
 * Similarity Check Worker (Days 10-12)
 *
 * Processes jobs from the 'check' queue:
 * 1. Loads generated melody MIDI from Take record
 * 2. Loads reference melody features (if available)
 * 3. Calls similarity pod HTTP endpoint
 * 4. Stores similarity report in S3
 * 5. Emits SSE progress events
 * 6. Updates Take record with cached report (optional)
 */

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES, type SimilarityJobData } from '../queue.js'
import { checkSimilarityViaPod } from '../similarity.js'
import { uploadJsonToS3, getS3Paths } from '../s3.js'
import { publishJobEvent } from '../events.js'
import { prisma } from '../db.js'
import { type JobStage, type SimilarityReport } from '@bluebird/types'
import { getQueueConnection } from '../redis.js'
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
 * Process a similarity check job
 */
async function processSimilarityJob(job: Job<SimilarityJobData>): Promise<void> {
  const { projectId, jobId, takeId, referenceKey } = job.data

  const log = createJobLogger(jobId, 'similarity')
  log.info({ projectId, takeId, referenceKey }, 'Processing similarity check job')

  await job.updateProgress(5)
  await sendEvent(jobId, 'similarity-check', 0.05, 'Starting similarity check')

  // 1. Fetch Take record from database
  const take = await prisma.take.findUnique({
    where: { id: takeId },
    select: {
      id: true,
      jobId: true,
      plan: true,
      projectId: true,
    },
  })

  if (!take) {
    throw new Error(`Take not found for takeId: ${takeId}`)
  }

  await job.updateProgress(10)
  await sendEvent(jobId, 'similarity-check', 0.1, 'Loaded take record')

  // 2. Load generated melody MIDI
  // TODO: In real implementation, melody MIDI should be stored to S3 after melody generation
  // For now, generate stub MIDI from arrangement (placeholder)
  const generatedMelody = [60, 62, 64, 65, 67, 69, 71, 72] // Stub: C major scale
  const generatedOnsets = [0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75] // Stub: quarter notes

  await job.updateProgress(30)
  await sendEvent(jobId, 'similarity-check', 0.3, 'Loaded generated melody')

  // 3. Load reference melody features
  // TODO: Load reference melody MIDI from S3 if referenceKey provided
  // For now, use stub reference melody
  const referenceMelody = referenceKey
    ? [60, 61, 62, 63, 64, 65, 66, 67] // Stub: chromatic scale (different)
    : null
  const referenceOnsets = referenceKey ? [0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75] : null

  if (!referenceMelody) {
    log.info('No reference melody provided, skipping similarity check')
    await job.updateProgress(100)
    await sendEvent(jobId, 'completed', 1.0, 'No reference melody provided')
    return
  }

  await job.updateProgress(50)
  await sendEvent(jobId, 'similarity-check', 0.5, 'Loaded reference melody')

  // 4. Call similarity pod via HTTP
  log.info('Calling similarity pod')
  const podResult = await checkSimilarityViaPod({
    referenceMelody,
    generatedMelody,
    referenceOnsets: referenceOnsets || undefined,
    generatedOnsets: generatedOnsets || undefined,
  })

  await job.updateProgress(70)
  await sendEvent(
    jobId,
    'similarity-check',
    0.7,
    `Similarity computed: verdict=${podResult.verdict}`
  )

  // 5. Build similarity report
  const report: SimilarityReport = {
    jobId,
    referenceKey: referenceKey || 'none',
    scores: {
      melody: podResult.scores.melody,
      rhythm: podResult.scores.rhythm,
      combined: podResult.scores.combined,
    },
    verdict: podResult.verdict,
    reason:
      podResult.verdict === 'pass'
        ? `Generated melody is sufficiently original (combined score: ${podResult.scores.combined.toFixed(2)} < 0.35)`
        : podResult.verdict === 'borderline'
          ? `Similarity is borderline (combined score: ${podResult.scores.combined.toFixed(2)}). Review recommended.`
          : `Similarity too high (combined score: ${podResult.scores.combined.toFixed(2)} >= 0.48). Export blocked.`,
    recommendations: podResult.recommendations,
    eightBarCloneDetected: false, // TODO: Implement 8-bar clone detection in pod
    budgetUsed: podResult.scores.combined,
    checkedAt: new Date().toISOString(),
  }

  await job.updateProgress(80)
  await sendEvent(jobId, 'similarity-check', 0.8, 'Built similarity report')

  // 6. Store report in S3
  const s3Paths = getS3Paths(projectId, takeId)
  const timestamp = Date.now().toString()
  const reportKey = s3Paths.reports.similarity(timestamp)

  await uploadJsonToS3(reportKey, report)

  log.info({ reportKey, verdict: report.verdict }, 'Similarity report stored in S3')

  await job.updateProgress(90)
  await sendEvent(jobId, 'similarity-check', 0.9, `Report saved: ${reportKey}`)

  // 7. Optional: Cache report in database for faster export checks
  // await prisma.take.update({
  //   where: { id: takeId },
  //   data: {
  //     similarityReport: report as any,
  //     updatedAt: new Date(),
  //   },
  // })

  // 8. Mark complete
  await job.updateProgress(100)
  await sendEvent(
    jobId,
    'completed',
    1.0,
    `Similarity check complete: ${report.verdict} (score: ${report.budgetUsed?.toFixed(2) || 'N/A'})`
  )

  log.info({ verdict: report.verdict, budgetUsed: report.budgetUsed }, 'Similarity check complete')
}

/**
 * Create and export the similarity worker
 */
export const worker = new Worker<SimilarityJobData>(QUEUE_NAMES.CHECK, processSimilarityJob, {
  connection: redisConnection,
  concurrency: 2, // Can check 2 melodies concurrently
  limiter: {
    max: 10, // Max 10 checks per minute
    duration: 60000,
  },
})

// Event handlers
worker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, 'Similarity check job completed')
})

worker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error: error.message }, 'Similarity check job failed')
})

worker.on('error', (error) => {
  logger.error({ error: error.message }, 'Similarity worker error')
})

/**
 * Gracefully close the worker
 */
export async function closeSimilarityWorker(): Promise<void> {
  await worker.close()
  logger.info('Similarity worker closed')
}
