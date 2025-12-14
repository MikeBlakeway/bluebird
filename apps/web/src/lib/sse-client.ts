/**
 * SSE Client for Job Event Streaming
 *
 * Provides automatic reconnection, heartbeat detection, and exponential backoff
 * for real-time job status updates from the Bluebird API.
 */

import type { JobEvent } from '@bluebird/types'

// ============================================================================
// Types
// ============================================================================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface SSEClientConfig {
  /** URL of the SSE endpoint */
  url: string
  /** Callback for job events */
  onEvent: (event: JobEvent) => void
  /** Callback for connection state changes */
  onStateChange?: (state: ConnectionState) => void
  /** Callback for errors */
  onError?: (error: Error) => void
  /** Heartbeat timeout in milliseconds (default: 15000) */
  heartbeatTimeout?: number
  /** Maximum reconnection attempts (default: 10) */
  maxReconnectAttempts?: number
  /** Initial reconnection delay in milliseconds (default: 500) */
  initialReconnectDelay?: number
  /** Maximum reconnection delay in milliseconds (default: 8000) */
  maxReconnectDelay?: number
}

// ============================================================================
// SSE Client
// ============================================================================

export class SSEClient {
  private eventSource: EventSource | null = null
  private url: string
  private state: ConnectionState = 'disconnected'
  private reconnectAttempts = 0
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null

  private readonly onEvent: (event: JobEvent) => void
  private readonly onStateChange?: (state: ConnectionState) => void
  private readonly onError?: (error: Error) => void
  private readonly heartbeatTimeout: number
  private readonly maxReconnectAttempts: number
  private readonly initialReconnectDelay: number
  private readonly maxReconnectDelay: number

  constructor(config: SSEClientConfig) {
    this.url = config.url
    this.onEvent = config.onEvent
    this.onStateChange = config.onStateChange
    this.onError = config.onError
    this.heartbeatTimeout = config.heartbeatTimeout || 15000
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10
    this.initialReconnectDelay = config.initialReconnectDelay || 500
    this.maxReconnectDelay = config.maxReconnectDelay || 8000
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      return // Already connected
    }

    this.setState('connecting')
    this.eventSource = new EventSource(this.url)

    this.eventSource.onopen = () => {
      this.setState('connected')
      this.reconnectAttempts = 0
      this.resetHeartbeat()
    }

    this.eventSource.onmessage = (event) => {
      this.resetHeartbeat()

      try {
        const jobEvent = JSON.parse(event.data) as JobEvent
        this.onEvent(jobEvent)

        // Auto-disconnect on terminal states
        if (jobEvent.stage === 'completed' || jobEvent.stage === 'failed') {
          this.disconnect()
        }
      } catch (error) {
        const parseError = error instanceof Error ? error : new Error(String(error))
        this.handleError(new Error(`Failed to parse SSE event: ${parseError.message}`))
      }
    }

    this.eventSource.onerror = () => {
      this.handleError(new Error('SSE connection error'))
      this.disconnect()
      this.scheduleReconnect()
    }
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    this.clearHeartbeat()
    this.clearReconnectTimer()
    this.setState('disconnected')
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected'
  }

  // ==========================================================================
  // Internal Methods
  // ==========================================================================

  private setState(state: ConnectionState): void {
    this.state = state
    if (this.onStateChange) {
      this.onStateChange(state)
    }
  }

  private handleError(error: Error): void {
    this.setState('error')
    if (this.onError) {
      this.onError(error)
    }
  }

  private resetHeartbeat(): void {
    this.clearHeartbeat()
    this.heartbeatTimer = setTimeout(() => {
      this.handleError(new Error('Heartbeat timeout - no events received'))
      this.disconnect()
      this.scheduleReconnect()
    }, this.heartbeatTimeout)
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError(
        new Error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`)
      )
      return
    }

    const delay = this.getReconnectDelay()
    this.reconnectAttempts++

    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private getReconnectDelay(): number {
    // Exponential backoff: 500ms → 1s → 2s → 4s → 8s (max)
    const delay = Math.min(
      this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )
    return delay
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Create and connect to an SSE endpoint
 */
export function createSSEClient(config: SSEClientConfig): SSEClient {
  const client = new SSEClient(config)
  client.connect()
  return client
}
