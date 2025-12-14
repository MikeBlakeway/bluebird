/**
 * React Hook for SSE Job Events
 *
 * Provides a simple way to subscribe to job events in React components
 * with automatic cleanup and reconnection handling.
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { JobEvent } from '@bluebird/types'
import { SSEClient, type ConnectionState } from '@/lib/sse-client'

// ============================================================================
// Types
// ============================================================================

export interface UseJobEventsOptions {
  /** Base URL of the API (default: from env or localhost:4000) */
  baseURL?: string
  /** Enable auto-connect on mount (default: true) */
  autoConnect?: boolean
  /** Callback for job events */
  onEvent?: (event: JobEvent) => void
  /** Callback for connection state changes */
  onStateChange?: (state: ConnectionState) => void
  /** Callback for errors */
  onError?: (error: Error) => void
}

export interface UseJobEventsResult {
  /** Latest job event */
  event: JobEvent | null
  /** Connection state */
  state: ConnectionState
  /** Latest error */
  error: Error | null
  /** Manual connect function */
  connect: () => void
  /** Manual disconnect function */
  disconnect: () => void
  /** Whether connected */
  isConnected: boolean
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Subscribe to job events via SSE
 *
 * @example
 * ```tsx
 * function JobStatus({ jobId }: { jobId: string }) {
 *   const { event, state, error } = useJobEvents(jobId)
 *
 *   if (error) return <div>Error: {error.message}</div>
 *   if (state === 'connecting') return <div>Connecting...</div>
 *
 *   return (
 *     <div>
 *       <p>Status: {event?.status}</p>
 *       <p>Stage: {event?.stage}</p>
 *       <p>Progress: {event?.progress}%</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useJobEvents(
  jobId: string | null | undefined,
  options: UseJobEventsOptions = {}
): UseJobEventsResult {
  const {
    baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    autoConnect = true,
    onEvent,
    onStateChange,
    onError,
  } = options

  const [event, setEvent] = useState<JobEvent | null>(null)
  const [state, setState] = useState<ConnectionState>('disconnected')
  const [error, setError] = useState<Error | null>(null)

  const clientRef = useRef<SSEClient | null>(null)
  const optionsRef = useRef({ onEvent, onStateChange, onError })

  // Keep options ref up to date
  useEffect(() => {
    optionsRef.current = { onEvent, onStateChange, onError }
  }, [onEvent, onStateChange, onError])

  const connect = useCallback(() => {
    if (!jobId || clientRef.current) {
      return
    }

    const url = `${baseURL}/jobs/${jobId}/events`

    clientRef.current = new SSEClient({
      url,
      onEvent: (evt: JobEvent) => {
        setEvent(evt)
        setError(null)
        optionsRef.current.onEvent?.(evt)
      },
      onStateChange: (st: ConnectionState) => {
        setState(st)
        optionsRef.current.onStateChange?.(st)
      },
      onError: (err: Error) => {
        setError(err)
        optionsRef.current.onError?.(err)
      },
    })

    clientRef.current.connect()
  }, [jobId, baseURL])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect()
      clientRef.current = null
    }
    setState('disconnected')
  }, [])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && jobId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [jobId, autoConnect, connect, disconnect])

  return {
    event,
    state,
    error,
    connect,
    disconnect,
    isConnected: state === 'connected',
  }
}
