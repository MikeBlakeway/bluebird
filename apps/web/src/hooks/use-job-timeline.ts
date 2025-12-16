/**
 * useJobTimeline Hook
 *
 * Manages SSE subscription and timeline state for a job.
 * Aggregates JobEvents into a timeline visualization state.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import type { JobEvent, JobStage } from '@bluebird/types'
import { SSEClient, type ConnectionState } from '@/lib/sse-client'
import { STAGES, getTotalEstimatedDuration } from '@/lib/timeline-stages'

// ============================================================================
// Types
// ============================================================================

export interface StageState {
  status: 'pending' | 'active' | 'complete' | 'failed'
  progress: number // 0-1
  message?: string
  startTime?: string // ISO datetime
  endTime?: string // ISO datetime
  duration?: number // milliseconds
  error?: string
}

export interface TimelineState {
  jobId: string
  stages: Map<JobStage, StageState>
  currentStage: JobStage | null
  overallProgress: number // 0-1
  totalDuration: number // milliseconds (actual)
  estimatedTimeRemaining: number // milliseconds
  error: string | null
  isComplete: boolean
  connectionState: ConnectionState
}

// ============================================================================
// Hook
// ============================================================================

export function useJobTimeline(jobId: string | null) {
  const [state, setState] = useState<TimelineState>(() => createInitialState(jobId || ''))
  const sseClientRef = useRef<SSEClient | null>(null)

  // Process incoming job events
  const handleJobEvent = useCallback((event: JobEvent) => {
    setState((currentState) => processJobEvent(currentState, event))
  }, [])

  // Handle connection state changes
  const handleStateChange = useCallback((connectionState: ConnectionState) => {
    setState((currentState) => ({
      ...currentState,
      connectionState,
    }))
  }, [])

  // Handle SSE errors
  const handleError = useCallback((error: Error) => {
    setState((currentState) => ({
      ...currentState,
      error: error.message,
      connectionState: 'error',
    }))
  }, [])

  // Connect to SSE when jobId is provided
  useEffect(() => {
    if (!jobId) {
      return
    }

    // Reset state for new job
    setState(createInitialState(jobId))

    // Create SSE client
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const sseClient = new SSEClient({
      url: `${apiUrl}/jobs/${jobId}/events`,
      onEvent: handleJobEvent,
      onStateChange: handleStateChange,
      onError: handleError,
    })

    sseClientRef.current = sseClient
    sseClient.connect()

    // Cleanup on unmount or jobId change
    return () => {
      sseClient.disconnect()
      sseClientRef.current = null
    }
  }, [jobId, handleJobEvent, handleStateChange, handleError])

  // Reconnect method for manual retry
  const reconnect = useCallback(() => {
    if (sseClientRef.current && jobId) {
      sseClientRef.current.disconnect()
      sseClientRef.current.connect()
    }
  }, [jobId])

  return {
    ...state,
    reconnect,
  }
}

// ============================================================================
// State Management
// ============================================================================

function createInitialState(jobId: string): TimelineState {
  const stages = new Map<JobStage, StageState>()

  // Initialize all stages as pending
  STAGES.forEach((stageDef) => {
    stages.set(stageDef.id, {
      status: 'pending',
      progress: 0,
    })
  })

  return {
    jobId,
    stages,
    currentStage: null,
    overallProgress: 0,
    totalDuration: 0,
    estimatedTimeRemaining: getTotalEstimatedDuration(),
    error: null,
    isComplete: false,
    connectionState: 'disconnected',
  }
}

function processJobEvent(currentState: TimelineState, event: JobEvent): TimelineState {
  // Clone state for immutability
  const newStages = new Map(currentState.stages)
  const newState = { ...currentState }

  // 1. Update current stage
  newState.currentStage = event.stage

  // 2. Update stage state
  const stageState = { ...(newStages.get(event.stage) || createStageState()) }

  stageState.status =
    event.stage === 'failed' ? 'failed' : event.progress === 1 ? 'complete' : 'active'
  stageState.progress = event.progress
  stageState.message = event.message
  stageState.error = event.error

  if (!stageState.startTime) {
    stageState.startTime = event.timestamp
  }
  if (event.progress === 1 || event.stage === 'failed') {
    stageState.endTime = event.timestamp
  }
  if (event.duration !== undefined) {
    stageState.duration = event.duration
  }

  newStages.set(event.stage, stageState)

  // 3. Mark previous stages as complete
  const stageOrder = STAGES.map((s) => s.id)
  const currentIndex = stageOrder.indexOf(event.stage)
  for (let i = 0; i < currentIndex; i++) {
    const prevStageId = stageOrder[i]
    if (!prevStageId) continue
    const prevStage = newStages.get(prevStageId)
    if (prevStage && prevStage.status !== 'failed') {
      newStages.set(prevStageId, {
        ...prevStage,
        status: 'complete',
        progress: 1,
      })
    }
  }

  // 4. Calculate overall progress
  newState.stages = newStages
  newState.overallProgress = calculateOverallProgress(newStages)

  // 5. Calculate actual total duration and ETA
  newState.totalDuration = calculateTotalDuration(newStages)
  newState.estimatedTimeRemaining = calculateETA(newStages, event.stage, event.progress)

  // 6. Update completion status
  newState.isComplete = event.stage === 'completed' || event.stage === 'failed'
  newState.error = event.error || null

  return newState
}

function createStageState(): StageState {
  return {
    status: 'pending',
    progress: 0,
  }
}

function calculateOverallProgress(stages: Map<JobStage, StageState>): number {
  const weights = STAGES.map((s) => s.estimatedDuration)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  if (totalWeight === 0) return 0

  let weightedProgress = 0
  STAGES.forEach((stage, idx) => {
    const state = stages.get(stage.id)
    const weight = weights[idx]
    if (state && weight !== undefined) {
      weightedProgress += state.progress * weight
    }
  })

  return weightedProgress / totalWeight
}

function calculateTotalDuration(stagesMap: Map<JobStage, StageState>): number {
  let total = 0
  stagesMap.forEach((state) => {
    if (state.duration !== undefined) {
      total += state.duration
    }
  })
  return total
}

function calculateETA(
  _stagesMap: Map<JobStage, StageState>,
  currentStage: JobStage,
  currentProgress: number
): number {
  // Get remaining estimated duration from current stage onwards
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage)
  if (currentIndex === -1) return 0

  let remainingTime = 0

  // Add remaining time for current stage
  const currentStageDef = STAGES[currentIndex]
  if (currentStageDef) {
    remainingTime += currentStageDef.estimatedDuration * (1 - currentProgress)
  }

  // Add estimated time for future stages
  for (let i = currentIndex + 1; i < STAGES.length; i++) {
    const stageDef = STAGES[i]
    if (stageDef && stageDef.id !== 'completed' && stageDef.id !== 'failed') {
      remainingTime += stageDef.estimatedDuration
    }
  }

  return remainingTime
}
