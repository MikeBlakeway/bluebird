/**
 * BullMQ worker skeleton.
 * Processes jobs from queues and updates job status.
 */

import { Worker, Job } from 'bullmq'
import { JobStage } from '@bluebird/types'
import { QUEUE_NAMES, type PlanJobData, type AnalyzeJobData } from './queue'
import { analyzeLyrics, detectRhymeScheme, estimateTempo, extractSeedPhrase } from './analyzer'
import { planArrangement } from './planner'
import { prisma } from './db'
import { publishJobEvent } from './events'
import { getQueueConnection } from './redis'
import { createJobLogger } from './logger'

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
 * Process a plan job: analyze lyrics → generate arrangement → persist to DB.
 */
async function processPlanJob(job: Job<PlanJobData>): Promise<void> {
  const { projectId, jobId, lyrics, genre, seed } = job.data
  const log = createJobLogger(jobId, 'plan')

  log.info({ projectId, genre, seed }, 'Processing plan job')

  // Update progress: analyzing (0-30%)
  await job.updateProgress(10)
  await sendEvent(jobId, 'analyzing', 0.1, 'Analyzing lyrics')

  // Analyze lyrics
  const lines = analyzeLyrics(lyrics)
  const rhymeScheme = detectRhymeScheme(lines)
  const estimatedTempo = estimateTempo(lines)
  const seedPhrase = extractSeedPhrase(lyrics)

  const analysisResult = {
    projectId,
    lyrics,
    lines,
    totalSyllables: lines.reduce((sum, line) => sum + line.syllables.length, 0),
    rhymeScheme: rhymeScheme.rhymeScheme,
    rhymingWords: rhymeScheme.rhymingWords,
    estimatedTempo,
    seedPhrase,
    analyzedAt: new Date().toISOString(),
  }

  await job.updateProgress(30)
  await sendEvent(jobId, 'analyzing', 0.3, 'Analysis complete')
  log.debug(
    {
      totalLines: lines.length,
      totalSyllables: analysisResult.totalSyllables,
      estimatedTempo,
      rhymeScheme: rhymeScheme.rhymeScheme,
    },
    'Lyrics analysis complete'
  )

  // Generate arrangement plan (30-70%)
  await job.updateProgress(50)
  await sendEvent(jobId, 'planning', 0.5, 'Planning arrangement')
  const arrangement = planArrangement(analysisResult, jobId, seed)
  await job.updateProgress(70)
  await sendEvent(jobId, 'planning', 0.7, 'Arrangement ready')
  log.debug({ arrangement }, 'Arrangement plan generated')

  // Persist to database (70-90%)
  try {
    // Ensure CLI user exists (for demo/CLI usage)
    await prisma.user.upsert({
      where: { email: 'cli@bluebird.local' },
      create: {
        email: 'cli@bluebird.local',
        name: 'CLI User',
      },
      update: {},
    })

    const cliUser = await prisma.user.findUnique({
      where: { email: 'cli@bluebird.local' },
    })

    if (!cliUser) {
      throw new Error('Failed to create CLI user')
    }

    // Ensure project exists (for demo/CLI usage)
    // First check if project exists to avoid unique constraint violation
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!existingProject) {
      await prisma.project.create({
        data: {
          id: projectId,
          userId: cliUser.id,
          name: `Project ${projectId.substring(0, 8)}`,
          lyrics,
          genre,
        },
      })
    }

    // Create or update take
    await prisma.take.upsert({
      where: { jobId },
      create: {
        jobId,
        projectId,
        status: 'planned',
        plan: arrangement,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        status: 'planned',
        plan: arrangement,
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    log.error({ error }, 'Database error while persisting plan')
    throw error
  }

  await job.updateProgress(90)
  await sendEvent(jobId, 'planning', 0.9, 'Persisted plan')

  // TODO (D9): Emit SSE event for 'completed'
  // TODO (Sprint 1): Enqueue music/vocal synthesis jobs

  await job.updateProgress(100)
  await sendEvent(jobId, 'completed', 1)
  log.info({ projectId }, 'Plan job completed successfully')
}

/**
 * Process an analyze job: parse lyrics → extract features.
 * Currently a stub - will be expanded when needed.
 */
async function processAnalyzeJob(job: Job<AnalyzeJobData>): Promise<void> {
  const { jobId } = job.data
  const log = createJobLogger(jobId, 'analyze')

  log.info('Processing analyze job')

  await job.updateProgress(50)

  // TODO: Implement standalone analysis when needed
  // For now, analysis is done inline in plan jobs

  await job.updateProgress(100)
  log.info('Analyze job completed')
}

// Initialize workers
export const planWorker = new Worker<PlanJobData>(QUEUE_NAMES.PLAN, processPlanJob, {
  connection: redisConnection,
  concurrency: 5, // Process up to 5 jobs concurrently
})

export const analyzeWorker = new Worker<AnalyzeJobData>(QUEUE_NAMES.ANALYZE, processAnalyzeJob, {
  connection: redisConnection,
  concurrency: 10, // Faster jobs, more concurrency
})

// Error handling
planWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`[WORKER] Plan job ${job.id} failed:`, err)
    void sendEvent(job.id as string, 'failed', job.progress as number, err.message)
  }
})

analyzeWorker.on('failed', (job, err) => {
  if (job) {
    console.error(`[WORKER] Analyze job ${job.id} failed:`, err)
  }
})

// Success logging
planWorker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`[WORKER] Plan job ${job.id} completed`)
})

analyzeWorker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`[WORKER] Analyze job ${job.id} completed`)
})

/**
 * Graceful shutdown.
 */
export async function closeWorkers(): Promise<void> {
  const closePromises = [planWorker.close(), analyzeWorker.close()]

  // Note: Redis connection is shared and managed by redis.ts
  // Do not close it here - use closeRedisConnections() instead

  await Promise.all(closePromises)
  // eslint-disable-next-line no-console
  console.log('[WORKER] All workers closed')
}

// Handle process termination
process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('[WORKER] SIGTERM received, closing workers...')
  await closeWorkers()
  process.exit(0)
})

process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('[WORKER] SIGINT received, closing workers...')
  await closeWorkers()
  process.exit(0)
})
