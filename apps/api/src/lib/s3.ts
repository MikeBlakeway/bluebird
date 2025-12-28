/**
 * S3 client wrapper for MinIO/S3 storage.
 * Handles file uploads, downloads, and presigned URLs.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { ProjectId, TakeId } from '@bluebird/types'

const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000'
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin'
const S3_SECRET = process.env.S3_SECRET || 'minioadmin'
const S3_BUCKET = process.env.S3_BUCKET || 'bluebird'
const S3_REGION = process.env.S3_REGION || 'us-east-1'

// Create S3 client
export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET,
  },
  forcePathStyle: true, // Required for MinIO
})

/**
 * S3 path patterns for project artifacts
 */
export function getS3Paths(projectId: ProjectId, takeId: TakeId) {
  const base = `projects/${projectId}/takes/${takeId}`
  return {
    base,
    plan: `${base}/plan.json`,
    section: (idx: number) => ({
      music: (stem: string) => `${base}/sections/${idx}/music/${stem}.wav`,
      vocals: (part: string) => `${base}/sections/${idx}/vocals/${part}.wav`,
    }),
    mix: {
      master: `${base}/mix/master.wav`,
      masterMp3: `${base}/mix/master.mp3`,
    },
    reference: {
      audio: `${base}/reference/ref.wav`,
      features: `${base}/features/remix.json`,
    },
    features: {
      melody: `${base}/features/melody.json`,
    },
    reports: {
      similarity: (timestamp: string) => `${base}/reports/similarity-${timestamp}.json`,
    },
  }
}

/**
 * Upload a buffer to S3
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await s3Client.send(command)
}

/**
 * Download a file from S3
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  })

  const response = await s3Client.send(command)

  if (!response.Body) {
    throw new Error(`No body in S3 response for key: ${key}`)
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getPresignedUrl(key: string, expiresIn: number = 600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Upload JSON data to S3
 */
export async function uploadJsonToS3(key: string, data: unknown): Promise<void> {
  const buffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8')
  await uploadToS3(key, buffer, 'application/json')
}

/**
 * Download and parse JSON from S3
 */
export async function downloadJsonFromS3<T>(key: string): Promise<T> {
  const buffer = await downloadFromS3(key)
  return JSON.parse(buffer.toString('utf-8')) as T
}
