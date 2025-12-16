/**
 * StageIndicator Component
 *
 * Visualizes a single stage in the job timeline with status icon,
 * label, progress bar (if active), and duration/error information.
 */

import { Circle, PlayCircle } from 'lucide-react'
import { Progress } from '@heroui/react'
import type { StageState } from '@/hooks/use-job-timeline'
import type { StageDefinition } from '@/lib/timeline-stages'

// ============================================================================
// Types
// ============================================================================

export interface StageIndicatorProps {
  stage: StageDefinition
  state: StageState
  compact?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function StageIndicator({ stage, state, compact = false }: StageIndicatorProps) {
  const Icon = stage.icon
  const isActive = state.status === 'active'
  const isComplete = state.status === 'complete'
  const isFailed = state.status === 'failed'
  const isPending = state.status === 'pending'

  // Determine status icon
  const StatusIcon = () => {
    if (isPending) {
      return <Circle className="w-4 h-4 text-default-400" />
    }
    if (isActive) {
      return <PlayCircle className="w-4 h-4 text-primary animate-pulse" />
    }
    if (isComplete) {
      return <Icon className="w-4 h-4 text-success" />
    }
    if (isFailed) {
      return <Icon className="w-4 h-4 text-danger" />
    }
    return null
  }

  // Format duration
  const formatDuration = (ms: number | undefined): string => {
    if (!ms) return ''
    const seconds = Math.round(ms / 1000)
    return `${seconds}s`
  }

  // Compact layout for horizontal timeline
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1 min-w-[60px]">
        <StatusIcon />
        <span
          className={`text-xs ${
            isActive ? 'font-semibold text-primary' : isPending ? 'text-default-400' : ''
          }`}
        >
          {stage.label}
        </span>
      </div>
    )
  }

  // Full layout for vertical timeline
  return (
    <div className="flex items-start gap-3 py-2">
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <StatusIcon />
      </div>

      {/* Stage Info */}
      <div className="flex-grow min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-medium ${
                isActive ? 'text-primary' : isPending ? 'text-default-400' : ''
              }`}
            >
              {stage.label}
            </span>
            {state.duration !== undefined && (
              <span className="text-xs text-default-500">{formatDuration(state.duration)}</span>
            )}
          </div>
        </div>

        {/* Description (only for active/failed stages) */}
        {(isActive || isFailed) && (
          <p className="text-sm text-default-500 mb-2">{stage.description}</p>
        )}

        {/* Progress bar for active stage */}
        {isActive && state.progress > 0 && (
          <Progress
            aria-label={`${stage.label} progress`}
            value={state.progress * 100}
            color="primary"
            size="sm"
            isStriped
            classNames={{
              base: 'max-w-md',
            }}
          />
        )}

        {/* Message */}
        {state.message && <p className="text-sm text-default-600 mt-1 italic">{state.message}</p>}

        {/* Error message */}
        {state.error && (
          <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded-md">
            <p className="text-sm text-danger-700">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
