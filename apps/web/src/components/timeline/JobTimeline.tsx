/**
 * JobTimeline Component
 *
 * Real-time visualization of job progress through stages using SSE events.
 * Shows overall progress, current stage, and estimated time remaining.
 */

import { useMemo } from 'react'
import { Card, CardHeader, CardBody, Button, Progress, Skeleton } from '@heroui/react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useJobTimeline } from '@/hooks/use-job-timeline'
import { StageIndicator } from './StageIndicator'
import { STAGES } from '@/lib/timeline-stages'

// ============================================================================
// Types
// ============================================================================

export interface JobTimelineProps {
  jobId: string | null
  onComplete?: (takeId: string) => void
  onError?: (error: Error) => void
  showHeader?: boolean
  compact?: boolean
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function JobTimeline({
  jobId,
  onComplete,
  onError,
  showHeader = true,
  compact = false,
  className = '',
}: JobTimelineProps) {
  const timeline = useJobTimeline(jobId)

  // Call callbacks when appropriate
  useMemo(() => {
    if (timeline.isComplete) {
      if (timeline.currentStage === 'completed' && onComplete) {
        // In a real implementation, we'd get takeId from the event
        // For now, we'll pass the jobId as a placeholder
        onComplete(timeline.jobId)
      } else if (timeline.error && onError) {
        onError(new Error(timeline.error))
      }
    }
  }, [
    timeline.isComplete,
    timeline.currentStage,
    timeline.error,
    timeline.jobId,
    onComplete,
    onError,
  ])

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.round(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  // Show skeleton while connecting
  if (!jobId || timeline.connectionState === 'connecting') {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="flex-col items-start gap-2">
            <Skeleton className="w-1/3 h-6 rounded-lg" />
            <Skeleton className="w-1/2 h-4 rounded-lg" />
          </CardHeader>
        )}
        <CardBody className="gap-3">
          {STAGES.slice(0, 5).map((stage) => (
            <div key={stage.id} className="flex items-center gap-3">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="flex-grow h-4 rounded-lg" />
            </div>
          ))}
        </CardBody>
      </Card>
    )
  }

  // Connection error state
  if (timeline.connectionState === 'error' && !timeline.isComplete) {
    return (
      <Card className={className}>
        <CardBody className="flex flex-col items-center justify-center gap-4 p-8">
          <AlertCircle className="w-12 h-12 text-danger" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">Connection Error</h3>
            <p className="text-sm text-default-500 mb-4">
              {timeline.error || 'Failed to connect to job stream'}
            </p>
            <Button
              color="primary"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={timeline.reconnect}
            >
              Retry Connection
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  // Compact horizontal layout
  if (compact) {
    return (
      <Card className={className}>
        <CardBody className="py-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            {STAGES.filter((s) => s.id !== 'completed' && s.id !== 'failed').map((stage) => {
              const state = timeline.stages.get(stage.id)
              if (!state) return null
              return <StageIndicator key={stage.id} stage={stage} state={state} compact />
            })}
          </div>
          <Progress
            aria-label="Overall progress"
            value={timeline.overallProgress * 100}
            color="primary"
            size="sm"
            className="mt-3"
          />
        </CardBody>
      </Card>
    )
  }

  // Full vertical layout
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex-col items-start gap-1 pb-2">
          <h3 className="text-lg font-semibold">Job Progress</h3>
          <div className="flex items-center gap-3 text-sm text-default-500">
            <span>Overall: {Math.round(timeline.overallProgress * 100)}%</span>
            {!timeline.isComplete && timeline.estimatedTimeRemaining > 0 && (
              <>
                <span>·</span>
                <span>ETA: {formatTimeRemaining(timeline.estimatedTimeRemaining)}</span>
              </>
            )}
          </div>
        </CardHeader>
      )}

      <CardBody className="gap-0 pt-2">
        {/* Overall progress bar */}
        <div className="mb-4">
          <Progress
            aria-label="Overall progress"
            value={timeline.overallProgress * 100}
            color={timeline.isComplete ? (timeline.error ? 'danger' : 'success') : 'primary'}
            size="md"
            showValueLabel
            classNames={{
              base: 'max-w-full',
            }}
          />
        </div>

        {/* Stage indicators */}
        <div className="space-y-0 border-l-2 border-default-200 pl-2">
          {STAGES.filter((s) => s.id !== 'completed' && s.id !== 'failed').map((stage) => {
            const state = timeline.stages.get(stage.id)
            if (!state) return null
            return <StageIndicator key={stage.id} stage={stage} state={state} />
          })}
        </div>

        {/* Terminal state indicator */}
        {timeline.isComplete && timeline.currentStage && (
          <div className="mt-4 pt-4 border-t border-default-200">
            {(() => {
              const terminalStage = STAGES.find((s) => s.id === timeline.currentStage)
              const terminalState = timeline.stages.get(timeline.currentStage)
              if (!terminalStage || !terminalState) return null
              return <StageIndicator stage={terminalStage} state={terminalState} />
            })()}
          </div>
        )}

        {/* Retry button for failed jobs */}
        {timeline.isComplete && timeline.error && (
          <div className="mt-4">
            <Button
              color="primary"
              variant="flat"
              startContent={<RefreshCw className="w-4 h-4" />}
              onPress={() => {
                if (onError) {
                  onError(new Error(timeline.error || 'Job failed'))
                }
              }}
              fullWidth
            >
              Retry
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
