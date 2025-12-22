import { z } from 'zod'

// ============================================================================
// Primitive Types
// ============================================================================

/** Unique identifier (CUID2) used across entities. */
export const IdSchema = z.string().cuid2()
export type Id = z.infer<typeof IdSchema>

/** Identifier for a project (CUID2). */
export const ProjectIdSchema = z.string().cuid2()
export type ProjectId = z.infer<typeof ProjectIdSchema>

// JobId can be custom format like "project:timestamp:seed", not just CUID
/** Queue/job identifier; may be composite (project:timestamp:seed). */
export const JobIdSchema = z.string().min(1)
export type JobId = z.infer<typeof JobIdSchema>

/** Identifier for a generated take (CUID2). */
export const TakeIdSchema = z.string().cuid2()
export type TakeId = z.infer<typeof TakeIdSchema>

// ============================================================================
// Planning & Arrangement
// ============================================================================

/**
 * Single song section definition used by arrangement planning.
 */
export const SectionSchema = z.object({
  index: z.number().int().min(0),
  type: z.enum(['intro', 'verse', 'chorus', 'bridge', 'outro']),
  bars: z.number().int().min(4).max(32),
  energyLevel: z.number().min(0).max(1),
})
export type Section = z.infer<typeof SectionSchema>

/**
 * Canonical arrangement plan produced by the planner and consumed by renderers.
 * Includes tempo, key, section layout, instrumentation, and optional seed for determinism.
 */
export const ArrangementSpecSchema = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  bpm: z.number().int().min(60).max(200),
  key: z.string().min(1).max(3), // e.g., "C", "Cm", "F#"
  scale: z.enum(['major', 'minor', 'pentatonic']).default('major'),
  timeSignature: z.string().default('4/4'),
  sections: z.array(SectionSchema),
  instrumentation: z.array(z.string()),
  energyCurve: z.array(z.number().min(0).max(1)),
  seed: z.number().int().optional(),
})
export type ArrangementSpec = z.infer<typeof ArrangementSpecSchema>

/**
 * Per-line vocal mapping to AI artist/style, produced before vocal rendering.
 */
export const VocalLineSchema = z.object({
  lineNumber: z.number().int().min(0),
  text: z.string(),
  syllables: z.array(z.string()),
  artistId: z.string().optional(),
  styleNotes: z.string().optional(),
})
export type VocalLine = z.infer<typeof VocalLineSchema>

/**
 * Full vocal score for a project, pairing lyric lines with singer/style metadata.
 */
export const VocalScoreSchema = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  lines: z.array(VocalLineSchema),
  overallStyle: z.string().optional(),
})
export type VocalScore = z.infer<typeof VocalScoreSchema>

// ============================================================================
// Analyzer (Lyrics Parsing)
// ============================================================================

/** Parsed lyrics analysis result used by the planner. */
const AnalysisResultSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  lyrics: z.string(),
  lines: z.array(
    z.object({
      index: z.number().int().min(0),
      text: z.string(),
      syllables: z.array(z.string()),
      estimatedDuration: z.number(), // milliseconds
    })
  ),
  totalSyllables: z.number().int(),
  rhymeScheme: z.array(z.string()).optional(), // ["A", "A", "B", "B", etc.]
  rhymingWords: z.record(z.array(z.string())).optional(), // {"A": ["day", "way"], "B": [...]}
  estimatedTempo: z.number().optional(), // BPM guess
  seedPhrase: z.string().optional(), // Main hook/theme
  analyzedAt: z.string().datetime(),
})
export type AnalysisResult = z.infer<typeof AnalysisResultSchemaInternal>
export const AnalysisResultSchema: z.ZodType<AnalysisResult, z.ZodTypeDef, unknown> =
  AnalysisResultSchemaInternal

/** Request to analyze lyrics for structure/tempo. */
const AnalyzeRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  lyrics: z.string().min(10).max(5000),
})
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchemaInternal>
export const AnalyzeRequestSchema: z.ZodType<AnalyzeRequest, z.ZodTypeDef, unknown> =
  AnalyzeRequestSchemaInternal

// ============================================================================
// Remix & Reference
// ============================================================================

/**
 * Extracted audio features from a ≤30s reference clip used to guide remix/melody generation.
 */
export const RemixFeaturesSchema = z.object({
  projectId: ProjectIdSchema,
  bpm: z.number().optional(),
  key: z.string().optional(),
  contourVector: z.array(z.number()).optional(),
  rhythmPattern: z.array(z.number()).optional(),
  intervalNgrams: z.record(z.number()).optional(),
  energyProfile: z.array(z.number()).optional(),
})
export type RemixFeatures = z.infer<typeof RemixFeaturesSchema>

/** Request to upload reference audio for remix feature extraction. */
const UploadReferenceAudioRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  planId: JobIdSchema,
  fileName: z.string().min(1),
  fileSize: z.number().int().min(1).max(10485760), // 10MB max
  mimeType: z.string().regex(/^audio\//),
  durationSec: z.number().min(1).max(30),
})
export type UploadReferenceAudioRequest = z.infer<typeof UploadReferenceAudioRequestSchemaInternal>
export const UploadReferenceAudioRequestSchema: z.ZodType<
  UploadReferenceAudioRequest,
  z.ZodTypeDef,
  unknown
> = UploadReferenceAudioRequestSchemaInternal

/** Response to reference upload providing presigned URL and feature extraction status. */
const UploadReferenceAudioResponseSchemaInternal = z.object({
  uploadUrl: z.string().url(),
  referenceKey: z.string(),
  expiresAt: z.string().datetime(),
  features: RemixFeaturesSchema.optional(), // Populated after extraction completes
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  message: z.string().optional(),
})
export type UploadReferenceAudioResponse = z.infer<
  typeof UploadReferenceAudioResponseSchemaInternal
>
export const UploadReferenceAudioResponseSchema: z.ZodType<
  UploadReferenceAudioResponse,
  z.ZodTypeDef,
  unknown
> = UploadReferenceAudioResponseSchemaInternal

// ============================================================================
// Similarity Checking
// ============================================================================

/** Per-dimension similarity scores in the range [0,1]. */
export const SimilarityScoreSchema = z.object({
  melody: z.number().min(0).max(1),
  rhythm: z.number().min(0).max(1),
  combined: z.number().min(0).max(1),
})
export type SimilarityScore = z.infer<typeof SimilarityScoreSchema>

/** Export gating verdict categories. */
export const SimilarityVerdictSchema = z.enum(['pass', 'borderline', 'block'])
export type SimilarityVerdict = z.infer<typeof SimilarityVerdictSchema>

/**
 * Export-gating similarity report combining melody and rhythm scores with a verdict.
 */
const SimilarityReportSchemaInternal = z.object({
  jobId: JobIdSchema,
  referenceKey: z.string(),
  scores: SimilarityScoreSchema,
  verdict: SimilarityVerdictSchema,
  reason: z.string(),
  recommendations: z.array(z.string()).optional(),
  eightBarCloneDetected: z.boolean().default(false),
  budgetUsed: z.number().min(0).max(1).optional(),
  checkedAt: z.string().datetime(),
})
export type SimilarityReport = z.infer<typeof SimilarityReportSchemaInternal>
export const SimilarityReportSchema: z.ZodType<SimilarityReport, z.ZodTypeDef, unknown> =
  SimilarityReportSchemaInternal

/** Request to check similarity between generated melody and reference. */
const CheckSimilarityRequestSchemaInternal = z.object({
  planId: JobIdSchema,
  takeId: TakeIdSchema,
  referenceKey: z.string().optional(),
  budgetThreshold: z.number().min(0).max(1).default(0.48), // Default from agent instructions
})
export type CheckSimilarityRequest = z.infer<typeof CheckSimilarityRequestSchemaInternal>
export const CheckSimilarityRequestSchema: z.ZodType<
  CheckSimilarityRequest,
  z.ZodTypeDef,
  unknown
> = CheckSimilarityRequestSchemaInternal

/** Response to similarity check request including report and export eligibility. */
const CheckSimilarityResponseSchemaInternal = z.object({
  jobId: JobIdSchema,
  report: SimilarityReportSchema,
  canExport: z.boolean(),
  message: z.string().optional(),
})
export type CheckSimilarityResponse = z.infer<typeof CheckSimilarityResponseSchemaInternal>
export const CheckSimilarityResponseSchema: z.ZodType<
  CheckSimilarityResponse,
  z.ZodTypeDef,
  unknown
> = CheckSimilarityResponseSchemaInternal

// ============================================================================
// Export & Delivery
// ============================================================================

/** Supported user-facing export formats. */
export const ExportFormatSchema = z.enum(['wav', 'mp3', 'flac'])
export type ExportFormat = z.infer<typeof ExportFormatSchema>

/**
 * Final export payload containing master file, aligned stems, metadata, and optional similarity report.
 */
export const ExportBundleSchema = z.object({
  jobId: JobIdSchema,
  projectId: ProjectIdSchema,
  master: z.object({
    format: ExportFormatSchema,
    sampleRate: z.number().int(),
    bitDepth: z.number().int(),
    key: z.string(), // S3 path
    url: z.string().url(), // Presigned download URL
  }),
  stems: z.array(
    z.object({
      name: z.string(),
      format: ExportFormatSchema,
      key: z.string(),
      url: z.string().url(),
    })
  ),
  metadata: z.object({
    title: z.string(),
    artist: z.string().optional(),
    duration: z.number(),
    bpm: z.number().optional(),
    key: z.string().optional(),
  }),
  similarityReport: SimilarityReportSchema.optional(),
  cueSheet: z.string().optional(), // BWF markers in CUE format
  createdAt: z.string().datetime(),
})
export type ExportBundle = z.infer<typeof ExportBundleSchema>

/** Request to export final mastered bundle (master + stems + metadata). */
const ExportFinalRequestSchemaInternal = z.object({
  planId: JobIdSchema,
  takeId: TakeIdSchema,
  format: ExportFormatSchema.default('wav'),
  includeStems: z.boolean().default(false),
  sampleRate: z.number().int().default(48000),
  bitDepth: z.number().int().default(24),
  requireSimilarityCheck: z.boolean().default(true),
})
export type ExportFinalRequest = z.infer<typeof ExportFinalRequestSchemaInternal>
export const ExportFinalRequestSchema: z.ZodType<ExportFinalRequest, z.ZodTypeDef, unknown> =
  ExportFinalRequestSchemaInternal

/** Response to export final request providing download URLs and bundle metadata. */
const ExportFinalResponseSchemaInternal = z.object({
  jobId: JobIdSchema,
  bundle: ExportBundleSchema,
  expiresAt: z.string().datetime(),
  message: z.string().optional(),
})
export type ExportFinalResponse = z.infer<typeof ExportFinalResponseSchemaInternal>
export const ExportFinalResponseSchema: z.ZodType<ExportFinalResponse, z.ZodTypeDef, unknown> =
  ExportFinalResponseSchemaInternal

// ============================================================================
// Job Events (SSE)
// ============================================================================

/** Canonical job lifecycle stages used for SSE timeline. */
export const JobStageSchema = z.enum([
  'queued',
  'analyzing',
  'planning',
  'melody-gen',
  'music-render',
  'vocal-render',
  'mixing',
  'similarity-check',
  'exporting',
  'completed',
  'failed',
])
export type JobStage = z.infer<typeof JobStageSchema>

const JobEventSchemaInternal = z.object({
  jobId: JobIdSchema,
  stage: JobStageSchema,
  progress: z.number().min(0).max(1),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
  duration: z.number().optional(), // milliseconds
  error: z.string().optional(),
  // Additional context attributes for OTEL and debugging
  runId: z.string().optional(),
  planId: JobIdSchema.optional(),
  sectionId: z.string().optional(),
  seed: z.number().int().optional(),
})
export type JobEvent = z.infer<typeof JobEventSchemaInternal>
export const JobEventSchema: z.ZodType<JobEvent, z.ZodTypeDef, unknown> = JobEventSchemaInternal

// ============================================================================
// Pod-Facing DTOs (Inference Services)
// ============================================================================

/** Single melody note event used by pods for synthesis and F0 generation. */
export const MelodyNoteSchema = z.object({
  startTime: z.number().min(0), // seconds
  duration: z.number().min(0.05), // seconds
  pitch: z.number().int().min(0).max(127), // MIDI note number
  velocity: z.number().int().min(1).max(127).default(80),
  syllable: z.string().optional(),
})
export type MelodyNote = z.infer<typeof MelodyNoteSchema>

/** Complete melody sequence for a section or full song. */
export const MelodySequenceSchema = z.object({
  notes: z.array(MelodyNoteSchema),
  bpm: z.number().int().min(60).max(200),
  key: z.string(),
  timeSignature: z.string().default('4/4'),
  durationSeconds: z.number().min(0),
})
export type MelodySequence = z.infer<typeof MelodySequenceSchema>

/** Request to melody pod for procedural melody generation. */
const GenerateMelodyRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  planId: JobIdSchema,
  sectionIndex: z.number().int().min(0),
  arrangement: ArrangementSpecSchema,
  lyrics: z.array(z.string()),
  remixFeatures: RemixFeaturesSchema.optional(),
  seed: z.number().int(),
})
export type GenerateMelodyRequest = z.infer<typeof GenerateMelodyRequestSchemaInternal>
export const GenerateMelodyRequestSchema: z.ZodType<GenerateMelodyRequest, z.ZodTypeDef, unknown> =
  GenerateMelodyRequestSchemaInternal

/** Response from melody pod containing sequence and F0 contour. */
const GenerateMelodyResponseSchemaInternal = z.object({
  sequence: MelodySequenceSchema,
  f0Contour: z.array(z.number()), // Hz per frame, aligned to audio hop
  sampleRate: z.number().int().default(48000),
  hopLength: z.number().int().default(512),
})
export type GenerateMelodyResponse = z.infer<typeof GenerateMelodyResponseSchemaInternal>
export const GenerateMelodyResponseSchema: z.ZodType<
  GenerateMelodyResponse,
  z.ZodTypeDef,
  unknown
> = GenerateMelodyResponseSchemaInternal

/** Request to analyzer pod for reference audio feature extraction. */
const AnalyzeReferenceRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  referenceKey: z.string(), // S3 path to uploaded audio
  maxDurationSec: z.number().min(1).max(30).default(30),
})
export type AnalyzeReferenceRequest = z.infer<typeof AnalyzeReferenceRequestSchemaInternal>
export const AnalyzeReferenceRequestSchema: z.ZodType<
  AnalyzeReferenceRequest,
  z.ZodTypeDef,
  unknown
> = AnalyzeReferenceRequestSchemaInternal

/** Response from analyzer pod with extracted features. */
const AnalyzeReferenceResponseSchemaInternal = z.object({
  features: RemixFeaturesSchema,
  durationSec: z.number(),
  sampleRate: z.number().int(),
})
export type AnalyzeReferenceResponse = z.infer<typeof AnalyzeReferenceResponseSchemaInternal>
export const AnalyzeReferenceResponseSchema: z.ZodType<
  AnalyzeReferenceResponse,
  z.ZodTypeDef,
  unknown
> = AnalyzeReferenceResponseSchemaInternal

/** Request to similarity pod for melody/rhythm comparison. */
const CompareSimilarityRequestSchemaInternal = z.object({
  generatedKey: z.string(), // S3 path to generated audio/MIDI
  referenceKey: z.string(), // S3 path to reference features
  budgetThreshold: z.number().min(0).max(1).default(0.48),
})
export type CompareSimilarityRequest = z.infer<typeof CompareSimilarityRequestSchemaInternal>
export const CompareSimilarityRequestSchema: z.ZodType<
  CompareSimilarityRequest,
  z.ZodTypeDef,
  unknown
> = CompareSimilarityRequestSchemaInternal

/** Response from similarity pod with detailed comparison report. */
const CompareSimilarityResponseSchemaInternal = z.object({
  scores: SimilarityScoreSchema,
  verdict: SimilarityVerdictSchema,
  eightBarCloneDetected: z.boolean(),
  recommendations: z.array(z.string()),
  reason: z.string(),
})
export type CompareSimilarityResponse = z.infer<typeof CompareSimilarityResponseSchemaInternal>
export const CompareSimilarityResponseSchema: z.ZodType<
  CompareSimilarityResponse,
  z.ZodTypeDef,
  unknown
> = CompareSimilarityResponseSchemaInternal

// ============================================================================
// Authentication & User
// ============================================================================

/** Basic user profile returned by auth endpoints. */
const UserSchemaInternal = z.object({
  id: IdSchema,
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type User = z.infer<typeof UserSchemaInternal>
export const UserSchema: z.ZodType<User, z.ZodTypeDef, unknown> = UserSchemaInternal

/** Request payload to initiate magic-link login. */
const MagicLinkRequestSchemaInternal = z.object({
  email: z.string().email(),
})
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchemaInternal>
export const MagicLinkRequestSchema: z.ZodType<MagicLinkRequest, z.ZodTypeDef, unknown> =
  MagicLinkRequestSchemaInternal

/** Response confirming magic-link email dispatch. */
const MagicLinkResponseSchemaInternal = z.object({
  success: z.boolean(),
  message: z.string(),
})
export type MagicLinkResponse = z.infer<typeof MagicLinkResponseSchemaInternal>
export const MagicLinkResponseSchema: z.ZodType<MagicLinkResponse, z.ZodTypeDef, unknown> =
  MagicLinkResponseSchemaInternal

/** Token verification payload for magic-link login. */
const VerifyMagicLinkRequestSchemaInternal = z.object({
  token: z.string(),
})
export type VerifyMagicLinkRequest = z.infer<typeof VerifyMagicLinkRequestSchemaInternal>
export const VerifyMagicLinkRequestSchema: z.ZodType<
  VerifyMagicLinkRequest,
  z.ZodTypeDef,
  unknown
> = VerifyMagicLinkRequestSchemaInternal

/** Auth response carrying user profile and JWT. */
const AuthResponseSchemaInternal = z.object({
  user: UserSchema,
  token: z.string(),
})
export type AuthResponse = z.infer<typeof AuthResponseSchemaInternal>
export const AuthResponseSchema: z.ZodType<AuthResponse, z.ZodTypeDef, unknown> =
  AuthResponseSchemaInternal

/** JWT payload claims used by the API. */
export const JWTPayloadSchema = z.object({
  userId: IdSchema,
  email: z.string().email(),
  iat: z.number().optional(),
  exp: z.number().optional(),
})
export type JWTPayload = z.infer<typeof JWTPayloadSchema>

// ============================================================================
// Project
// ============================================================================

/** Project entity persisted in the database. */
const ProjectSchemaInternal = z.object({
  id: ProjectIdSchema,
  userId: IdSchema,
  name: z.string().min(1).max(255),
  lyrics: z.string().min(10).max(5000),
  genre: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Project = z.infer<typeof ProjectSchemaInternal>
export const ProjectSchema: z.ZodType<Project, z.ZodTypeDef, unknown> = ProjectSchemaInternal

/** Request payload to create a project from lyrics and genre. */
const CreateProjectRequestSchemaInternal = z.object({
  name: z.string().min(1).max(255),
  lyrics: z.string().min(10).max(5000),
  genre: z.string().min(1).max(100),
})
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchemaInternal>
export const CreateProjectRequestSchema: z.ZodType<CreateProjectRequest, z.ZodTypeDef, unknown> =
  CreateProjectRequestSchemaInternal

/** Partial update payload for a project. */
const UpdateProjectRequestSchemaInternal = z.object({
  name: z.string().min(1).max(255).optional(),
  lyrics: z.string().min(10).max(5000).optional(),
  genre: z.string().min(1).max(100).optional(),
})
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchemaInternal>
export const UpdateProjectRequestSchema: z.ZodType<UpdateProjectRequest, z.ZodTypeDef, unknown> =
  UpdateProjectRequestSchemaInternal

// ============================================================================
// API Request/Response
// ============================================================================

/** Request to plan a song (lyrics → arrangement + vocal score). */
const PlanSongRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  lyrics: z.string().min(10).max(5000),
  genre: z.string().min(1),
  referenceKey: z.string().optional(), // S3 path to reference audio features
  seed: z.number().int().optional(),
})
export type PlanSongRequest = z.infer<typeof PlanSongRequestSchemaInternal>
export const PlanSongRequestSchema: z.ZodType<PlanSongRequest, z.ZodTypeDef, unknown> =
  PlanSongRequestSchemaInternal

/** Response containing planned arrangement and vocalization references. */
const PlanSongResponseSchemaInternal = z.object({
  jobId: JobIdSchema,
  projectId: ProjectIdSchema,
  status: z.string(),
  plan: ArrangementSpecSchema.optional(),
  vocalization: VocalScoreSchema.optional(),
})
export type PlanSongResponse = z.infer<typeof PlanSongResponseSchemaInternal>
export const PlanSongResponseSchema: z.ZodType<PlanSongResponse, z.ZodTypeDef, unknown> =
  PlanSongResponseSchemaInternal

/** Request to render a full preview for a project. */
const RenderPreviewRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
})
export type RenderPreviewRequest = z.infer<typeof RenderPreviewRequestSchemaInternal>
export const RenderPreviewRequestSchema: z.ZodType<RenderPreviewRequest, z.ZodTypeDef, unknown> =
  RenderPreviewRequestSchemaInternal

/** Request to render music for a specific section/instrument. */
const RenderMusicRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  sectionIndex: z.number().int().min(0),
  instrument: z.string().min(1),
  seed: z.number().int().optional(),
})
export type RenderMusicRequest = z.infer<typeof RenderMusicRequestSchemaInternal>
export const RenderMusicRequestSchema: z.ZodType<RenderMusicRequest, z.ZodTypeDef, unknown> =
  RenderMusicRequestSchemaInternal

/** Request to render vocals for a specific section. */
const RenderVoiceRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  sectionIndex: z.number().int().min(0),
  lyrics: z.string().min(1),
  seed: z.number().int().optional(),
})
export type RenderVoiceRequest = z.infer<typeof RenderVoiceRequestSchemaInternal>
export const RenderVoiceRequestSchema: z.ZodType<RenderVoiceRequest, z.ZodTypeDef, unknown> =
  RenderVoiceRequestSchemaInternal

/** Request to regenerate a single section (music/vocals). */
const RenderSectionRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  planId: JobIdSchema,
  sectionId: z.string().min(1),
  regen: z.boolean().default(true),
})
export type RenderSectionRequest = z.infer<typeof RenderSectionRequestSchemaInternal>
export const RenderSectionRequestSchema: z.ZodType<RenderSectionRequest, z.ZodTypeDef, unknown> =
  RenderSectionRequestSchemaInternal

/** Request to attach a reference audio (feature extraction) to a plan. */
const UploadReferenceRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  planId: JobIdSchema,
  referenceUrl: z.string().url().optional(),
  durationSec: z.number().min(1).max(30),
})
export type UploadReferenceRequest = z.infer<typeof UploadReferenceRequestSchemaInternal>
export const UploadReferenceRequestSchema: z.ZodType<
  UploadReferenceRequest,
  z.ZodTypeDef,
  unknown
> = UploadReferenceRequestSchemaInternal

/** Request to export a take (master/stems) after preview approval. */
const ExportTakeRequestSchemaInternal = z.object({
  planId: JobIdSchema,
  includeStems: z.boolean().default(false),
  format: z.array(z.enum(['wav24', 'mp3_320'])).default(['mp3_320']),
  includeMarkers: z.boolean().default(true),
})
export type ExportTakeRequest = z.infer<typeof ExportTakeRequestSchemaInternal>
export const ExportTakeRequestSchema: z.ZodType<ExportTakeRequest, z.ZodTypeDef, unknown> =
  ExportTakeRequestSchemaInternal

/** Generic job submission response with status and optional message. */
const JobResponseSchemaInternal = z.object({
  jobId: JobIdSchema,
  status: z.string(),
  message: z.string().optional(),
})
export type JobResponse = z.infer<typeof JobResponseSchemaInternal>
export const JobResponseSchema: z.ZodType<JobResponse, z.ZodTypeDef, unknown> =
  JobResponseSchemaInternal

/** Request to produce final mastered mix with LUFS/TP targets. */
const MixFinalRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  takeId: z.string().min(1),
  targetLUFS: z.number().min(-24).max(-6).default(-14),
  truePeakLimit: z.number().min(-2).max(0).default(-1),
})
export type MixFinalRequest = z.infer<typeof MixFinalRequestSchemaInternal>
export const MixFinalRequestSchema: z.ZodType<MixFinalRequest, z.ZodTypeDef, unknown> =
  MixFinalRequestSchemaInternal

/** Request to export a preview (mp3/wav) optionally including stems. */
const ExportPreviewRequestSchemaInternal = z.object({
  projectId: ProjectIdSchema,
  takeId: z.string().min(1),
  format: z.enum(['wav', 'mp3']).default('mp3'),
  includeStems: z.boolean().default(false),
})
export type ExportPreviewRequest = z.infer<typeof ExportPreviewRequestSchemaInternal>
export const ExportPreviewRequestSchema: z.ZodType<ExportPreviewRequest, z.ZodTypeDef, unknown> =
  ExportPreviewRequestSchemaInternal
