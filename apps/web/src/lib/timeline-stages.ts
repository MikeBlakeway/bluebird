/**
 * Timeline Stage Definitions
 *
 * Defines the visual and temporal characteristics of each job stage
 * for the timeline visualization component.
 */

import type { JobStage } from '@bluebird/types'
import {
  Clock,
  Search,
  FileText,
  Music,
  Radio,
  Mic,
  Sliders,
  CheckCircle,
  Download,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface StageDefinition {
  id: JobStage
  label: string
  description: string
  estimatedDuration: number // milliseconds (from TTFP baseline)
  icon: LucideIcon
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

// ============================================================================
// Stage Definitions
// ============================================================================

/**
 * Timeline stage definitions with estimated durations from TTFP baseline
 * Total estimated duration: ~52s (TTFP target: 45s P50)
 */
export const STAGES: StageDefinition[] = [
  {
    id: 'queued',
    label: 'Queued',
    description: 'Waiting in queue',
    estimatedDuration: 500,
    icon: Clock,
    color: 'default',
  },
  {
    id: 'analyzing',
    label: 'Analyzing',
    description: 'Analyzing lyrics and requirements',
    estimatedDuration: 2000,
    icon: Search,
    color: 'primary',
  },
  {
    id: 'planning',
    label: 'Planning',
    description: 'Generating arrangement plan',
    estimatedDuration: 12000, // 12s from TTFP baseline
    icon: FileText,
    color: 'primary',
  },
  {
    id: 'melody-gen',
    label: 'Melody',
    description: 'Composing melody',
    estimatedDuration: 5000,
    icon: Music,
    color: 'primary',
  },
  {
    id: 'music-render',
    label: 'Music',
    description: 'Rendering instrumental tracks',
    estimatedDuration: 20000, // 20s from TTFP baseline
    icon: Radio,
    color: 'primary',
  },
  {
    id: 'vocal-render',
    label: 'Vocals',
    description: 'Synthesizing vocals',
    estimatedDuration: 8000, // 8s from TTFP baseline
    icon: Mic,
    color: 'primary',
  },
  {
    id: 'mixing',
    label: 'Mixing',
    description: 'Mixing and mastering',
    estimatedDuration: 2000, // 2s from TTFP baseline
    icon: Sliders,
    color: 'primary',
  },
  {
    id: 'similarity-check',
    label: 'Checking',
    description: 'Similarity analysis',
    estimatedDuration: 1000,
    icon: CheckCircle,
    color: 'primary',
  },
  {
    id: 'exporting',
    label: 'Exporting',
    description: 'Preparing final output',
    estimatedDuration: 1500,
    icon: Download,
    color: 'primary',
  },
  {
    id: 'completed',
    label: 'Complete',
    description: 'Job completed successfully',
    estimatedDuration: 0,
    icon: CheckCircle2,
    color: 'success',
  },
  {
    id: 'failed',
    label: 'Failed',
    description: 'Job failed',
    estimatedDuration: 0,
    icon: XCircle,
    color: 'danger',
  },
]

// ============================================================================
// Stage Utilities
// ============================================================================

/**
 * Get stage definition by ID
 */
export function getStageDefinition(stageId: JobStage): StageDefinition {
  const stage = STAGES.find((s) => s.id === stageId)
  if (!stage) {
    throw new Error(`Unknown stage: ${stageId}`)
  }
  return stage
}

/**
 * Get stage order index (0-based)
 */
export function getStageIndex(stageId: JobStage): number {
  return STAGES.findIndex((s) => s.id === stageId)
}

/**
 * Get total estimated duration for all non-terminal stages
 */
export function getTotalEstimatedDuration(): number {
  return STAGES.filter((s) => s.id !== 'completed' && s.id !== 'failed').reduce(
    (sum, s) => sum + s.estimatedDuration,
    0
  )
}

/**
 * Calculate cumulative duration up to a specific stage
 */
export function getCumulativeDuration(upToStage: JobStage): number {
  const index = getStageIndex(upToStage)
  return STAGES.slice(0, index + 1).reduce((sum, s) => sum + s.estimatedDuration, 0)
}
