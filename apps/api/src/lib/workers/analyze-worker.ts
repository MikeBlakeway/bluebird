import { Worker, type WorkerOptions } from 'bullmq'
import { fetch } from 'undici'
import { QUEUE_NAMES, SeparationJobData, DiarizationJobData } from '../queue.js'
import { getQueueConnection } from '../redis.js'
import { publishJobEvent } from '../events.js'
import { logger } from '../logger.js'
import {
  SeparationRequestSchema,
  SeparationResultSchema,
  DiarizationRequestSchema,
  DiarizationResultSchema,
  type JobEvent,
} from '@bluebird/types'

const connection = getQueueConnection()

export type ProgressUpdater = (progress: number) => Promise<void>

export async function emitJobEvent(
  jobId: string,
  stage: JobEvent['stage'],
  progress: number,
  message?: string
) {
  const event: JobEvent = {
    jobId,
    stage,
    progress,
    timestamp: new Date().toISOString(),
    message,
  }
  await publishJobEvent(event)
}

const SEPARATION_POD_URL = process.env.SEPARATION_POD_URL || 'http://localhost:8000/separate'
const DIARIZATION_POD_URL = process.env.DIARIZATION_POD_URL || 'http://localhost:8000/diarize'

export async function processSeparationJob(
  job: SeparationJobData,
  updateProgress: ProgressUpdater,
  fetchFn: typeof fetch,
  emit = emitJobEvent
) {
  const parsed = SeparationRequestSchema.safeParse(job)
  if (!parsed.success) {
    throw new Error(`Invalid separation job: ${parsed.error.message}`)
  }

  const { jobId, projectId, takeId, audioKey, audioUrl, mode, quality } = parsed.data
  logger.info(
    { jobId, projectId, takeId, audioKey, audioUrl, mode, quality },
    'Analyze: separation start'
  )

  await emit(jobId, 'analyzing', 0.05, 'Starting separation')
  await updateProgress(5)

  const response = await fetchFn(SEPARATION_POD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsed.data),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Separation pod failed (${response.status}): ${text}`)
  }

  const json = await response.json()
  const result = SeparationResultSchema.safeParse(json)
  if (!result.success) {
    throw new Error(`Invalid separation response: ${result.error.message}`)
  }

  await emit(jobId, 'analyzing', 0.4, 'Processing separation output')
  await updateProgress(40)
  await emit(jobId, 'analyzing', 0.8, 'Uploading stems to storage')
  await updateProgress(80)

  await emit(jobId, 'completed', 1.0, 'Separation complete')
  await updateProgress(100)
  logger.info({ jobId, stems: result.data.stems }, 'Analyze: separation complete')
}

export async function processDiarizationJob(
  job: DiarizationJobData,
  updateProgress: ProgressUpdater,
  fetchFn: typeof fetch,
  emit = emitJobEvent
) {
  const parsed = DiarizationRequestSchema.safeParse(job)
  if (!parsed.success) {
    throw new Error(`Invalid diarization job: ${parsed.error.message}`)
  }

  const { jobId, projectId, takeId, audioKey, audioUrl, mode, minSpeakers, maxSpeakers } =
    parsed.data
  logger.info(
    { jobId, projectId, takeId, audioKey, audioUrl, mode, minSpeakers, maxSpeakers },
    'Analyze: diarization start'
  )

  await emit(jobId, 'analyzing', 0.1, 'Starting diarization')
  await updateProgress(10)

  const response = await fetchFn(DIARIZATION_POD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parsed.data),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Diarization pod failed (${response.status}): ${text}`)
  }

  const json = await response.json()
  const result = DiarizationResultSchema.safeParse(json)
  if (!result.success) {
    throw new Error(`Invalid diarization response: ${result.error.message}`)
  }

  await emit(jobId, 'analyzing', 0.4, 'Detecting speakers')
  await updateProgress(40)
  await emit(jobId, 'analyzing', 0.7, 'Writing timestamps to storage')
  await updateProgress(70)

  await emit(jobId, 'completed', 1.0, 'Diarization complete')
  await updateProgress(100)
  logger.info({ jobId, speakers: result.data.totalSpeakers }, 'Analyze: diarization complete')
}

function createAnalyzeWorker() {
  return new Worker<SeparationJobData | DiarizationJobData>(
    QUEUE_NAMES.ANALYZE,
    async (job) => {
      try {
        await emitJobEvent(job.data.jobId, 'queued', 0)
        if (job.name === 'separate-audio') {
          await processSeparationJob(
            job.data as SeparationJobData,
            (p) => job.updateProgress(p),
            fetch,
            emitJobEvent
          )
        } else if (job.name === 'diarize-audio') {
          await processDiarizationJob(
            job.data as DiarizationJobData,
            (p) => job.updateProgress(p),
            fetch,
            emitJobEvent
          )
        } else {
          logger.warn({ jobId: job.data.jobId, name: job.name }, 'Analyze: unknown job type')
          await emitJobEvent(job.data.jobId, 'failed', 0, `Unknown analyze job type: ${job.name}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.error({ jobId: job.data.jobId, error: message }, 'Analyze worker failed')
        await emitJobEvent(job.data.jobId, 'failed', 0, message)
        throw err
      }
    },
    {
      connection,
      concurrency: 2,
      // Default job options are set at queue level; can override here if needed
      // limiter, settings, etc., can be adjusted per environment
    } as WorkerOptions
  )
}

const shouldStartWorker =
  process.env.NODE_ENV !== 'test' && process.env.START_ANALYZE_WORKER !== 'false'

export const analyzeWorker = shouldStartWorker ? createAnalyzeWorker() : null

if (analyzeWorker) {
  analyzeWorker.on('error', (err) => {
    logger.error(err, 'Analyze worker error')
  })
}
