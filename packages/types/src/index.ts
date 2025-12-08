import { z } from 'zod';

// ============================================================================
// Primitive Types
// ============================================================================

export const IdSchema = z.string().cuid();
export type Id = z.infer<typeof IdSchema>;

export const ProjectIdSchema = z.string().cuid();
export type ProjectId = z.infer<typeof ProjectIdSchema>;

// JobId can be custom format like "project:timestamp:seed", not just CUID
export const JobIdSchema = z.string().min(1);
export type JobId = z.infer<typeof JobIdSchema>;

export const TakeIdSchema = z.string().cuid();
export type TakeId = z.infer<typeof TakeIdSchema>;

// ============================================================================
// Planning & Arrangement
// ============================================================================

export const SectionSchema = z.object({
  index: z.number().int().min(0),
  type: z.enum(['intro', 'verse', 'chorus', 'bridge', 'outro']),
  bars: z.number().int().min(4).max(32),
  energyLevel: z.number().min(0).max(1),
});
export type Section = z.infer<typeof SectionSchema>;

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
});
export type ArrangementSpec = z.infer<typeof ArrangementSpecSchema>;

export const VocalLineSchema = z.object({
  lineNumber: z.number().int().min(0),
  text: z.string(),
  syllables: z.array(z.string()),
  artistId: z.string().optional(),
  styleNotes: z.string().optional(),
});
export type VocalLine = z.infer<typeof VocalLineSchema>;

export const VocalScoreSchema = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  lines: z.array(VocalLineSchema),
  overallStyle: z.string().optional(),
});
export type VocalScore = z.infer<typeof VocalScoreSchema>;

// ============================================================================
// Analyzer (Lyrics Parsing)
// ============================================================================

export const AnalysisResultSchema = z.object({
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
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const AnalyzeRequestSchema = z.object({
  projectId: ProjectIdSchema,
  lyrics: z.string().min(10).max(5000),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// ============================================================================
// Remix & Reference
// ============================================================================

export const RemixFeaturesSchema = z.object({
  projectId: ProjectIdSchema,
  bpm: z.number().optional(),
  key: z.string().optional(),
  contourVector: z.array(z.number()).optional(),
  rhythmPattern: z.array(z.number()).optional(),
  intervalNgrams: z.record(z.number()).optional(),
  energyProfile: z.array(z.number()).optional(),
});
export type RemixFeatures = z.infer<typeof RemixFeaturesSchema>;

// ============================================================================
// Similarity Checking
// ============================================================================

export const SimilarityScoreSchema = z.object({
  melody: z.number().min(0).max(1),
  rhythm: z.number().min(0).max(1),
  combined: z.number().min(0).max(1),
});
export type SimilarityScore = z.infer<typeof SimilarityScoreSchema>;

export const SimilarityVerdictSchema = z.enum(['pass', 'borderline', 'block']);
export type SimilarityVerdict = z.infer<typeof SimilarityVerdictSchema>;

export const SimilarityReportSchema = z.object({
  jobId: JobIdSchema,
  referenceKey: z.string(),
  scores: SimilarityScoreSchema,
  verdict: SimilarityVerdictSchema,
  reason: z.string(),
  recommendations: z.array(z.string()).optional(),
  checkedAt: z.string().datetime(),
});
export type SimilarityReport = z.infer<typeof SimilarityReportSchema>;

// ============================================================================
// Export & Delivery
// ============================================================================

export const ExportFormatSchema = z.enum(['wav', 'mp3', 'flac']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const ExportBundleSchema = z.object({
  jobId: JobIdSchema,
  projectId: ProjectIdSchema,
  master: z.object({
    format: ExportFormatSchema,
    sampleRate: z.number().int(),
    bitDepth: z.number().int(),
    key: z.string(), // S3 path
  }),
  stems: z.array(
    z.object({
      name: z.string(),
      format: ExportFormatSchema,
      key: z.string(),
    })
  ),
  metadata: z.object({
    title: z.string(),
    artist: z.string().optional(),
    duration: z.number(),
  }),
  similarityReport: SimilarityReportSchema.optional(),
  createdAt: z.string().datetime(),
});
export type ExportBundle = z.infer<typeof ExportBundleSchema>;

// ============================================================================
// Job Events (SSE)
// ============================================================================

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
]);
export type JobStage = z.infer<typeof JobStageSchema>;

export const JobEventSchema = z.object({
  jobId: JobIdSchema,
  stage: JobStageSchema,
  progress: z.number().min(0).max(1),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
  duration: z.number().optional(), // milliseconds
  error: z.string().optional(),
});
export type JobEvent = z.infer<typeof JobEventSchema>;

// ============================================================================
// Authentication & User
// ============================================================================

export const UserSchema = z.object({
  id: IdSchema,
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const MagicLinkRequestSchema = z.object({
  email: z.string().email(),
});
export type MagicLinkRequest = z.infer<typeof MagicLinkRequestSchema>;

export const MagicLinkResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type MagicLinkResponse = z.infer<typeof MagicLinkResponseSchema>;

export const VerifyMagicLinkRequestSchema = z.object({
  token: z.string(),
});
export type VerifyMagicLinkRequest = z.infer<typeof VerifyMagicLinkRequestSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const JWTPayloadSchema = z.object({
  userId: IdSchema,
  email: z.string().email(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// ============================================================================
// Project
// ============================================================================

export const ProjectSchema = z.object({
  id: ProjectIdSchema,
  userId: IdSchema,
  name: z.string().min(1).max(255),
  lyrics: z.string().min(10).max(5000),
  genre: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255),
  lyrics: z.string().min(10).max(5000),
  genre: z.string().min(1).max(100),
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const UpdateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  lyrics: z.string().min(10).max(5000).optional(),
  genre: z.string().min(1).max(100).optional(),
});
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;

// ============================================================================
// API Request/Response
// ============================================================================

export const PlanSongRequestSchema = z.object({
  projectId: ProjectIdSchema,
  lyrics: z.string().min(10).max(5000),
  genre: z.string().min(1),
  referenceKey: z.string().optional(), // S3 path to reference audio features
  seed: z.number().int().optional(),
});
export type PlanSongRequest = z.infer<typeof PlanSongRequestSchema>;

export const PlanSongResponseSchema = z.object({
  jobId: JobIdSchema,
  projectId: ProjectIdSchema,
  status: z.string(),
  plan: ArrangementSpecSchema.optional(),
  vocalization: VocalScoreSchema.optional(),
});
export type PlanSongResponse = z.infer<typeof PlanSongResponseSchema>;

export const RenderPreviewRequestSchema = z.object({
  jobId: JobIdSchema,
  arrangement: ArrangementSpecSchema,
  vocals: VocalScoreSchema,
  seed: z.number().int().optional(),
});
export type RenderPreviewRequest = z.infer<typeof RenderPreviewRequestSchema>;

export const CheckSimilarityRequestSchema = z.object({
  jobId: JobIdSchema,
  referenceKey: z.string(),
  melody: z.array(z.number()),
  rhythm: z.array(z.number()),
});
export type CheckSimilarityRequest = z.infer<typeof CheckSimilarityRequestSchema>;

export const ExportRequestSchema = z.object({
  jobId: JobIdSchema,
  format: ExportFormatSchema,
  includeStemsTar: z.boolean().default(false),
  sampleRate: z.number().int().default(48000),
  bitDepth: z.number().int().default(24),
});
export type ExportRequest = z.infer<typeof ExportRequestSchema>;
