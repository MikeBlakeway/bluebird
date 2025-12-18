import { useCallback, useState } from 'react'
import { useJobEvents } from './use-job-events'

export interface ExportState {
  isLoading: boolean
  isComplete: boolean
  error: Error | null
  jobId: string | null
  downloadUrls: {
    master?: string
    stems?: string[]
  }
}

export interface UseExportOptions {
  projectId: string
  takeId: string
  planId?: string
}

export function useExport({ projectId, takeId, planId }: UseExportOptions) {
  const [state, setState] = useState<ExportState>({
    isLoading: false,
    isComplete: false,
    error: null,
    jobId: null,
    downloadUrls: {},
  })

  const handleJobEvent = useCallback(
    (event: {
      stage: string
      data?: { downloadUrls?: { master?: string; stems?: string[] }; error?: string }
    }) => {
      if (event.stage === 'completed') {
        // Parse download URLs from job completion data
        const downloadUrls = event.data?.downloadUrls
        if (downloadUrls) {
          setState((prev) => ({
            ...prev,
            downloadUrls,
            isComplete: true,
            isLoading: false,
          }))
        } else {
          setState((prev) => ({
            ...prev,
            isComplete: true,
            isLoading: false,
          }))
        }
      }

      if (event.stage === 'failed') {
        const errorMsg = event.data?.error || 'Unknown error'
        setState((prev) => ({
          ...prev,
          error: new Error(`Export failed: ${errorMsg}`),
          isLoading: false,
        }))
      }
    },
    []
  )

  // Subscribe to job events if we have an active job
  useJobEvents(state.jobId, {
    onEvent: handleJobEvent,
  })

  const exportComposition = useCallback(
    async (options: {
      format: 'wav' | 'mp3'
      sampleRate: 48000 | 44100
      includeStems: boolean
    }) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          downloadUrls: {},
          isComplete: false,
        }))

        const payload = {
          projectId,
          takeId,
          planId,
          format: options.format,
          sampleRate: options.sampleRate,
          includeStems: options.includeStems,
        }

        const response = await fetch('/api/export/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': `${projectId}:${takeId}:${Date.now()}`,
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`)
        }

        const data = (await response.json()) as {
          jobId: string
          downloadUrls?: { master?: string; stems?: string[] }
        }

        if (data.jobId) {
          setState((prev) => ({
            ...prev,
            jobId: data.jobId,
          }))
        }

        // If response includes download URLs directly, use them
        if (data.downloadUrls) {
          setState((prev) => ({
            ...prev,
            downloadUrls: data.downloadUrls || {},
            isComplete: true,
            isLoading: false,
          }))
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error('Export failed'),
          isLoading: false,
        }))
      }
    },
    [projectId, takeId, planId]
  )

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isComplete: false,
      error: null,
      jobId: null,
      downloadUrls: {},
    })
  }, [])

  return {
    ...state,
    exportComposition,
    reset,
  }
}
