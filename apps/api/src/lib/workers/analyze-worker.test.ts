import { describe, expect, it, vi } from 'vitest'
import {
  processSeparationJob,
  processDiarizationJob,
  type ProgressUpdater,
} from './analyze-worker.js'
import {
  SeparationRequestSchema,
  DiarizationRequestSchema,
  SeparationResultSchema,
  DiarizationResultSchema,
} from '@bluebird/types'

const baseSeparation = SeparationRequestSchema.parse({
  projectId: 'ckproj1234567890abcdefghi',
  takeId: 'cktake1234567890abcdefghi',
  jobId: 'job_sep',
  audioUrl: 'https://example.com/audio.wav',
  mode: '4stem',
  quality: 'balanced',
})

const baseDiarization = DiarizationRequestSchema.parse({
  projectId: 'ckproj1234567890abcdefghi',
  takeId: 'cktake1234567890abcdefghi',
  jobId: 'job_dia',
  audioUrl: 'https://example.com/audio.wav',
  mode: 'timestamps',
})

describe('analyze worker processors', () => {
  it('processSeparationJob calls pod and emits progress', async () => {
    const emit = vi.fn(async () => {})
    const progress: number[] = []
    const updateProgress: ProgressUpdater = async (p) => {
      progress.push(p)
    }

    const mockResponse = SeparationResultSchema.parse({
      jobId: baseSeparation.jobId,
      stems: { vocals: 's3://vocals.wav' },
      processingTime: 1.2,
      metadata: { duration: 10, sampleRate: 48000, channels: 2 },
    })

    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => mockResponse,
    })) as unknown as typeof fetch

    await processSeparationJob(baseSeparation, updateProgress, fetchFn, emit)

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalled()
    expect(progress).toEqual([5, 40, 80, 100])
  })

  it('processDiarizationJob calls pod and emits progress', async () => {
    const emit = vi.fn(async () => {})
    const progress: number[] = []
    const updateProgress: ProgressUpdater = async (p) => {
      progress.push(p)
    }

    const mockResponse = DiarizationResultSchema.parse({
      jobId: baseDiarization.jobId,
      speakers: [
        {
          speakerId: 'spk1',
          segments: [{ start: 0, end: 1, confidence: 0.9 }],
          audioUrl: undefined,
        },
      ],
      totalSpeakers: 1,
      processingTime: 0.5,
    })

    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => mockResponse,
    })) as unknown as typeof fetch

    await processDiarizationJob(baseDiarization, updateProgress, fetchFn, emit)

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalled()
    expect(progress).toEqual([10, 40, 70, 100])
  })

  it('processSeparationJob validates pod response', async () => {
    const emit = vi.fn(async () => {})
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({ invalid: true }),
    })) as unknown as typeof fetch

    await expect(
      processSeparationJob(baseSeparation, async () => {}, fetchFn, emit)
    ).rejects.toThrow('Invalid separation response')
  })
})
