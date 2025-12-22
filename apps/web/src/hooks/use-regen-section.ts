/**
 * useRegenSection Hook (Sprint 2, Task 2.10)
 *
 * Manages section regeneration state and API calls.
 * Provides methods to regenerate individual sections and track loading state.
 * Emits toast notifications on success/error.
 *
 * Example:
 * ```tsx
 * const { regenerateSection, isRegenerating } = useRegenSection({
 *   takeId: 'take-123',
 *   projectId: 'proj-456',
 *   planId: 'plan-789',
 *   onSuccess: (jobId) => console.log('Started:', jobId),
 *   onError: (error) => console.error('Failed:', error),
 * })
 *
 * await regenerateSection(2) // Regenerate section 2
 * isRegenerating(2) // true while regenerating
 * ```
 */

import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useClient } from './use-client'
import type { RenderSectionRequest } from '@bluebird/types'

export interface UseRegenSectionOptions {
  takeId: string
  projectId: string
  planId: string
  onSuccess?: (jobId: string) => void
  onError?: (error: Error) => void
}

export interface UseRegenSectionReturn {
  regenerateSection: (sectionIdx: number) => Promise<void>
  regeneratingSection: number | null
  error: Error | null
  isRegenerating: (sectionIdx: number) => boolean
  clearRegenerating: () => void
}

/**
 * Hook for managing section regeneration.
 *
 * Handles API calls to regenerate individual sections and tracks loading state.
 * Integrates with client.renderSection() and provides callbacks for success/error.
 */
export function useRegenSection(options: UseRegenSectionOptions): UseRegenSectionReturn {
  const [regeneratingSection, setRegeneratingSection] = useState<number | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const client = useClient()

  const regenerateSection = useCallback(
    async (sectionIdx: number) => {
      setError(null)
      setRegeneratingSection(sectionIdx)

      try {
        const request: RenderSectionRequest = {
          projectId: options.projectId,
          planId: options.planId,
          sectionId: `section-${sectionIdx}`,
          regen: true,
        }

        const response = await client.renderSection(request)

        if (options.onSuccess) {
          options.onSuccess(response.jobId)
        }

        // Emit success toast
        toast.success(`Regenerating section ${sectionIdx + 1}...`, {
          autoClose: 3000,
          position: 'bottom-right',
        })

        // Don't clear regeneratingSection here - let SSE 'completed' event do it
        // This ensures the loading state persists until the job finishes
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setRegeneratingSection(null) // Clear on error

        // Emit error toast
        toast.error(`Failed to regenerate section: ${error.message}`, {
          autoClose: 5000,
          position: 'bottom-right',
        })

        if (options.onError) {
          options.onError(error)
        }
      }
    },
    [options, client]
  )

  const isRegenerating = useCallback(
    (sectionIdx: number) => {
      return regeneratingSection === sectionIdx
    },
    [regeneratingSection]
  )

  const clearRegenerating = useCallback(() => {
    setRegeneratingSection(null)
  }, [])

  return {
    regenerateSection,
    regeneratingSection,
    error,
    isRegenerating,
    clearRegenerating,
  }
}
