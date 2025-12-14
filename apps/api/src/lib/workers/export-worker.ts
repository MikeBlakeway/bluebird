/**
 * Export Worker (Sprint 1)
 *
 * BullMQ worker that processes export jobs to generate downloadable audio files.
 * Converts master WAV to requested format (MP3/WAV) and optionally bundles stems.
 * Generates presigned S3 URLs for secure downloads.
 */

import { Worker } from 'bullmq'
import type { Job } from 'bullmq'
import { publishJobEvent } from '../events.js'
import { getQueueConnection } from '../redis.js'
import { QUEUE_NAMES } from '../queue.js'
import type { ExportJobData } from '../queue.js'
import { prisma } from '../db.js'
import { downloadFromS3, uploadToS3, getPresignedUrl } from '../s3.js'
import type { ProjectId } from '@bluebird/types'
import { createJobLogger, logger } from '../logger.js'

/**
 * Generate S3 key for export file
 */
function getExportPath(projectId: ProjectId, takeId: string, filename: string): string {
  return `projects/${projectId}/takes/${takeId}/exports/${filename}`
}

/**
 * Convert WAV to MP3 (stub for MVP)
 * TODO: Implement proper MP3 encoding using ffmpeg or similar
 */
async function convertToMP3(wavBuffer: Buffer): Promise<Buffer> {
  logger.warn('MP3 encoding not yet implemented; returning WAV')
  return wavBuffer
}

/**
 * Process export job: convert master to requested format and generate download URLs
 */
async function processExportJob(job: Job<ExportJobData>): Promise<void> {
  const { projectId, jobId, takeId, format, includeStems } = job.data
  const log = createJobLogger(jobId, 'export')

  try {
    log.info({ takeId, format, includeStems }, 'Processing export job')

    // Update job progress
    await job.updateProgress(0)
    await publishJobEvent({
      jobId,
      stage: 'exporting',
      progress: 0,
      message: 'Starting export...',
      timestamp: new Date().toISOString(),
    })

    // Fetch master WAV from S3
    await job.updateProgress(10)
    await publishJobEvent({
      jobId,
      stage: 'exporting',
      progress: 0.1,
      message: 'Fetching master track...',
      timestamp: new Date().toISOString(),
    })

    const masterPath = `projects/${projectId}/takes/${takeId}/mix/master.wav`
    // eslint-disable-next-line no-console
    log.debug({ masterPath }, 'Fetching master from S3')
    const masterBuffer = await downloadFromS3(masterPath)

    // Convert to requested format
    await job.updateProgress(30)
    await publishJobEvent({
      jobId,
      stage: 'exporting',
      progress: 0.3,
      message: `Converting to ${format.toUpperCase()}...`,
      timestamp: new Date().toISOString(),
    })

    let exportBuffer: Buffer
    let exportFilename: string

    if (format === 'mp3') {
      exportBuffer = await convertToMP3(masterBuffer)
      exportFilename = 'master.mp3'
    } else {
      // WAV - just use the master buffer directly
      exportBuffer = masterBuffer
      exportFilename = 'master.wav'
    }

    // Upload converted file to S3
    await job.updateProgress(50)
    await publishJobEvent({
      jobId,
      stage: 'exporting',
      progress: 0.5,
      message: 'Uploading export...',
      timestamp: new Date().toISOString(),
    })

    const exportPath = getExportPath(projectId, takeId, exportFilename)
    // eslint-disable-next-line no-console
    log.debug({ exportPath }, 'Uploading export to S3')
    await uploadToS3(exportPath, exportBuffer, 'audio/wav') // TODO: Use correct MIME type for MP3

    // Generate presigned URL (30 min expiry)
    await job.updateProgress(70)
    await publishJobEvent({
      jobId,
      stage: 'exporting',
      progress: 0.7,
      message: 'Generating download link...',
      timestamp: new Date().toISOString(),
    })

    const downloadUrl = await getPresignedUrl(exportPath, 30 * 60) // 30 minutes

    // Handle stems if requested
    const stemUrls: Array<{ name: string; url: string }> = []

    if (includeStems) {
      await job.updateProgress(80)
      await publishJobEvent({
        jobId,
        stage: 'exporting',
        progress: 0.8,
        message: 'Bundling stems...',
        timestamp: new Date().toISOString(),
      })

      // Fetch arrangement to know which stems exist
      const take = await prisma.take.findUnique({
        where: { id: takeId },
        select: { plan: true },
      })

      if (!take?.plan) {
        throw new Error('Take plan not found')
      }

      // Type-safe validation of arrangement plan
      const plan = take.plan as { sections?: Array<{ index: number }> }

      if (plan.sections) {
        // For MVP, just generate presigned URLs for existing stems
        // TODO: Bundle into zip file for easier download
        for (const section of plan.sections) {
          const sectionIdx = section.index

          // Generate presigned URLs for music stems (example: drums, bass, etc.)
          // In real implementation, read from arrangement instrumentation
          const stemNames = ['drums', 'bass', 'guitar']

          for (const stem of stemNames) {
            const stemPath = `projects/${projectId}/takes/${takeId}/sections/${sectionIdx}/music/${stem}.wav`
            try {
              const stemUrl = await getPresignedUrl(stemPath, 30 * 60)
              stemUrls.push({ name: `${stem}_section${sectionIdx}.wav`, url: stemUrl })
            } catch (_error) {
              // Stem might not exist; skip it
              // eslint-disable-next-line no-console
              log.warn({ stemPath }, 'Stem not found in S3')
            }
          }
        }
      }
    }

    // Update Take record with export metadata
    await job.updateProgress(90)
    await publishJobEvent({
      jobId,
      stage: 'exporting',
      progress: 0.9,
      message: 'Saving export metadata...',
      timestamp: new Date().toISOString(),
    })

    await prisma.take.update({
      where: { id: takeId },
      data: {
        status: 'completed',
        updatedAt: new Date(),
      },
    })

    // Store export manifest in database
    // TODO: Add Export table to schema to store download URLs and expiry
    // eslint-disable-next-line no-console
    log.info({ takeId, downloadUrl }, 'Export completed')
    // eslint-disable-next-line no-console

    // eslint-disable-next-line no-console
    log.debug({ stemCount: stemUrls.length }, 'Stem URLs generated')

    // Complete job
    await job.updateProgress(100)
    await publishJobEvent({
      jobId,
      stage: 'completed',
      progress: 1.0,
      message: 'Export ready for download',
      timestamp: new Date().toISOString(),
    })

    log.info({ jobId }, 'Export job completed successfully')
  } catch (error) {
    log.error({ jobId, error }, 'Export job failed')
    await publishJobEvent({
      jobId,
      stage: 'failed',
      progress: 0,
      message: error instanceof Error ? error.message : 'Export failed',
      timestamp: new Date().toISOString(),
    })
    throw error
  }
}

/**
 * Export Worker
 */
export const exportWorker = new Worker<ExportJobData>(QUEUE_NAMES.EXPORT, processExportJob, {
  connection: getQueueConnection(),
  concurrency: 2, // Process 2 export jobs concurrently
  limiter: {
    max: 10, // Maximum 10 jobs
    duration: 60 * 1000, // per 60 seconds
  },
})

exportWorker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  logger.debug({ jobId: job.id, queue: 'export' }, 'Export worker job completed')
})

exportWorker.on('failed', (job, error) => {
  // eslint-disable-next-line no-console
  logger.error(
    { jobId: job?.id, error: error.message, queue: 'export' },
    'Export worker job failed'
  )
})

/**
 * Close export worker gracefully
 */
export async function closeExportWorker(): Promise<void> {
  logger.info({ queue: 'export' }, 'Closing export worker')
  await exportWorker.close()
  logger.info({ queue: 'export' }, 'Export worker closed')
}
