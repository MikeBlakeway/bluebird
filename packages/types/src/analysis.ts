import { z } from 'zod'
import { JobIdSchema, ProjectIdSchema, TakeIdSchema } from './primitives'

// Source Separation
export const SeparationModeSchema = z.enum(['vocals', '4stem', '6stem'])
export type SeparationMode = z.infer<typeof SeparationModeSchema>

export const SeparationQualitySchema = z.enum(['fast', 'balanced', 'best'])
export type SeparationQuality = z.infer<typeof SeparationQualitySchema>

export const SeparationRequestSchema = z.object({
  projectId: ProjectIdSchema,
  takeId: TakeIdSchema,
  jobId: JobIdSchema,
  audioUrl: z.string().url().optional(),
  audioKey: z.string().optional(), // S3 key alternative
  mode: SeparationModeSchema.default('4stem'),
  quality: SeparationQualitySchema.default('balanced'),
})
export type SeparationRequest = z.infer<typeof SeparationRequestSchema>

export const SeparationResultSchema = z.object({
  jobId: JobIdSchema,
  stems: z.object({
    vocals: z.string().optional(),
    drums: z.string().optional(),
    bass: z.string().optional(),
    other: z.string().optional(),
    piano: z.string().optional(), // 6stem only
    guitar: z.string().optional(), // 6stem only
  }),
  processingTime: z.number(),
  metadata: z.object({
    duration: z.number(),
    sampleRate: z.number().int(),
    channels: z.number().int(),
  }),
})
export type SeparationResult = z.infer<typeof SeparationResultSchema>

// Speaker Diarization
export const DiarizationModeSchema = z.enum(['timestamps', 'separation'])
export type DiarizationMode = z.infer<typeof DiarizationModeSchema>

export const DiarizationRequestSchema = z.object({
  projectId: ProjectIdSchema,
  takeId: TakeIdSchema,
  jobId: JobIdSchema,
  audioUrl: z.string().url().optional(),
  audioKey: z.string().optional(),
  mode: DiarizationModeSchema.default('timestamps'),
  minSpeakers: z.number().int().min(1).max(10).optional(),
  maxSpeakers: z.number().int().min(1).max(10).optional(),
})
export type DiarizationRequest = z.infer<typeof DiarizationRequestSchema>

export const SpeakerSegmentSchema = z.object({
  start: z.number(),
  end: z.number(),
  confidence: z.number(),
})

export const DiarizationResultSchema = z.object({
  jobId: JobIdSchema,
  speakers: z.array(
    z.object({
      speakerId: z.string(),
      segments: z.array(SpeakerSegmentSchema),
      audioUrl: z.string().url().optional(),
    })
  ),
  totalSpeakers: z.number().int(),
  processingTime: z.number(),
})
export type DiarizationResult = z.infer<typeof DiarizationResultSchema>

// Reference Feature Extraction
export const ReferenceAnalysisRequestSchema = z.object({
  projectId: ProjectIdSchema,
  takeId: TakeIdSchema,
  jobId: JobIdSchema,
  audioUrl: z.string().url(),
  maxDuration: z.number().int().min(1).max(30).default(30),
})
export type ReferenceAnalysisRequest = z.infer<typeof ReferenceAnalysisRequestSchema>

export const ReferenceFeaturesSchema = z.object({
  key: z.string(),
  bpm: z.number(),
  contour: z.array(z.number()),
  rhythm: z.array(z.number()),
  duration: z.number(),
  checksum: z.string(),
})
export type ReferenceFeatures = z.infer<typeof ReferenceFeaturesSchema>
