/**
 * Bluebird API Client
 *
 * Typed client for backend API communication with automatic retries,
 * error handling, and auth token management.
 */

import type {
  AnalyzeRequest,
  AnalysisResult,
  AuthResponse,
  CreateProjectRequest,
  ExportPreviewRequest,
  JobResponse,
  MagicLinkRequest,
  MagicLinkResponse,
  MixFinalRequest,
  PlanSongRequest,
  PlanSongResponse,
  Project,
  RenderMusicRequest,
  RenderPreviewRequest,
  RenderVoiceRequest,
  UpdateProjectRequest,
  VerifyMagicLinkRequest,
} from '@bluebird/types'

import {
  AnalyzeRequestSchema,
  AnalysisResultSchema,
  AuthResponseSchema,
  CreateProjectRequestSchema,
  JobResponseSchema,
  MagicLinkRequestSchema,
  MagicLinkResponseSchema,
  MixFinalRequestSchema,
  PlanSongRequestSchema,
  PlanSongResponseSchema,
  ProjectSchema,
  RenderMusicRequestSchema,
  RenderPreviewRequestSchema,
  RenderVoiceRequestSchema,
  UpdateProjectRequestSchema,
  VerifyMagicLinkRequestSchema,
  ExportPreviewRequestSchema,
} from '@bluebird/types'

import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export interface ClientConfig {
  baseURL?: string
  authToken?: string
  timeout?: number
  retries?: number
  onTokenRefresh?: (token: string) => void
}

export class BluebirdAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'BluebirdAPIError'
  }
}

// ============================================================================
// Client
// ============================================================================

export class BluebirdClient {
  private baseURL: string
  private authToken?: string
  private timeout: number
  private retries: number
  private onTokenRefresh?: (token: string) => void

  constructor(config: ClientConfig = {}) {
    this.baseURL = config.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    this.authToken = config.authToken
    this.timeout = config.timeout || 30000
    this.retries = config.retries || 3
    this.onTokenRefresh = config.onTokenRefresh
  }

  // ==========================================================================
  // Auth Methods
  // ==========================================================================

  /**
   * Request a magic link to be sent to the user's email
   */
  async requestMagicLink(request: MagicLinkRequest): Promise<MagicLinkResponse> {
    const parsed = MagicLinkRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/auth/magic-link', parsed.data, MagicLinkResponseSchema)
  }

  /**
   * Verify a magic link token and get auth response
   */
  async verifyMagicLink(request: VerifyMagicLinkRequest): Promise<AuthResponse> {
    const parsed = VerifyMagicLinkRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    const response = await this.post('/auth/verify', parsed.data, AuthResponseSchema)

    // Store token and notify callback
    if (response.token) {
      this.setAuthToken(response.token)
    }

    return response
  }

  /**
   * Set the authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token
    if (this.onTokenRefresh) {
      this.onTokenRefresh(token)
    }
  }

  /**
   * Clear the authentication token
   */
  clearAuthToken(): void {
    this.authToken = undefined
  }

  // ==========================================================================
  // Project Methods
  // ==========================================================================

  /**
   * Create a new project
   */
  async createProject(request: CreateProjectRequest): Promise<Project> {
    const parsed = CreateProjectRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/projects', parsed.data, ProjectSchema)
  }

  /**
   * Get a project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    return this.get(`/projects/${projectId}`, ProjectSchema)
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, request: UpdateProjectRequest): Promise<Project> {
    const parsed = UpdateProjectRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.patch(`/projects/${projectId}`, parsed.data, ProjectSchema)
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.delete(`/projects/${projectId}`)
  }

  /**
   * List all projects for the authenticated user
   */
  async listProjects(): Promise<Project[]> {
    return this.get('/projects', ProjectSchema.array())
  }

  // ==========================================================================
  // Analyzer Methods
  // ==========================================================================

  /**
   * Analyze lyrics to extract structure and features
   */
  async analyzeLyrics(request: AnalyzeRequest): Promise<AnalysisResult> {
    const parsed = AnalyzeRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/analyze', parsed.data, AnalysisResultSchema)
  }

  // ==========================================================================
  // Planning Methods
  // ==========================================================================

  /**
   * Plan a song (arrangement + vocal score)
   */
  async planSong(request: PlanSongRequest): Promise<PlanSongResponse> {
    const parsed = PlanSongRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/plan/song', parsed.data, PlanSongResponseSchema)
  }

  // ==========================================================================
  // Render Methods
  // ==========================================================================

  /**
   * Render a preview (music + vocals + mix)
   */
  async renderPreview(request: RenderPreviewRequest): Promise<JobResponse> {
    const parsed = RenderPreviewRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/render/preview', parsed.data, JobResponseSchema)
  }

  /** Render a music stem for a section + instrument */
  async renderMusic(request: RenderMusicRequest): Promise<JobResponse> {
    const parsed = RenderMusicRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/render/music', parsed.data, JobResponseSchema)
  }

  /** Render vocals for a section */
  async renderVocals(request: RenderVoiceRequest): Promise<JobResponse> {
    const parsed = RenderVoiceRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/render/vocals', parsed.data, JobResponseSchema)
  }

  // ==========================================================================
  // Mix Methods
  // ==========================================================================

  /**
   * Create a final mix
   */
  async mixFinal(request: MixFinalRequest): Promise<JobResponse> {
    const parsed = MixFinalRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/mix/final', parsed.data, JobResponseSchema)
  }

  // ==========================================================================
  // Export Methods
  // ==========================================================================

  /**
   * Export a preview
   */
  async exportPreview(request: ExportPreviewRequest): Promise<JobResponse> {
    const parsed = ExportPreviewRequestSchema.safeParse(request)
    if (!parsed.success) {
      throw new BluebirdAPIError('Invalid request', 400, parsed.error.format())
    }

    return this.post('/export/preview', parsed.data, JobResponseSchema)
  }

  // ==========================================================================
  // Job Methods
  // ==========================================================================

  /**
   * Create an EventSource for job events (SSE)
   * Note: This returns the URL; the caller creates the EventSource
   */
  getJobEventsURL(jobId: string): string {
    return `${this.baseURL}/jobs/${jobId}/events`
  }

  // ==========================================================================
  // Internal HTTP Methods
  // ==========================================================================

  private async request<T>(
    method: string,
    path: string,
    opts: {
      body?: unknown
      responseSchema: z.ZodType<T, z.ZodTypeDef, unknown>
      idempotencyKey?: string
    },
    attempt = 1
  ): Promise<T> {
    const url = `${this.baseURL}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (method === 'POST') {
      headers['Idempotency-Key'] = opts.idempotencyKey ?? this.createIdempotencyKey()
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method,
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorDetails: unknown
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        throw new BluebirdAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorDetails
        )
      }

      // Handle 204 No Content
      if (response.status === 204) {
        const parsed = opts.responseSchema.safeParse(undefined)
        if (!parsed.success) {
          throw new BluebirdAPIError('Invalid response from server', response.status, {
            zodError: parsed.error.format(),
          })
        }

        return parsed.data
      }

      const json: unknown = await response.json()

      const parsed = opts.responseSchema.safeParse(json)
      if (!parsed.success) {
        throw new BluebirdAPIError('Invalid response from server', response.status, {
          zodError: parsed.error.format(),
          response: json,
        })
      }
      return parsed.data
    } catch (error) {
      // Retry logic for transient failures
      if (attempt < this.retries && this.isRetryableError(error)) {
        const delay = this.getBackoffDelay(attempt)
        await this.sleep(delay)
        return this.request(method, path, opts, attempt + 1)
      }

      throw error
    }
  }

  private async get<T>(
    path: string,
    responseSchema: z.ZodType<T, z.ZodTypeDef, unknown>
  ): Promise<T> {
    return this.request('GET', path, { responseSchema })
  }

  private async post<T>(
    path: string,
    body: unknown,
    responseSchema: z.ZodType<T, z.ZodTypeDef, unknown>
  ): Promise<T> {
    return this.request('POST', path, { body, responseSchema })
  }

  private async patch<T>(
    path: string,
    body: unknown,
    responseSchema: z.ZodType<T, z.ZodTypeDef, unknown>
  ): Promise<T> {
    return this.request('PATCH', path, { body, responseSchema })
  }

  private async delete(path: string): Promise<undefined> {
    return this.request('DELETE', path, { responseSchema: z.undefined() })
  }

  private createIdempotencyKey(): string {
    const uuid = globalThis.crypto?.randomUUID?.()
    if (uuid) return uuid

    // Best-effort fallback for older runtimes.
    return `bb_${Date.now()}_${Math.random().toString(16).slice(2)}`
  }

  // ==========================================================================
  // Retry Helpers
  // ==========================================================================

  private isRetryableError(error: unknown): boolean {
    if (error instanceof BluebirdAPIError) {
      // Retry on 5xx errors and specific 4xx errors
      return (
        (error.statusCode !== undefined && error.statusCode >= 500) ||
        error.statusCode === 429 || // Rate limit
        error.statusCode === 408 // Request timeout
      )
    }

    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true
    }

    // Retry on AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return true
    }

    return false
  }

  private getBackoffDelay(attempt: number): number {
    // Exponential backoff: 500ms, 1s, 2s
    return Math.min(500 * Math.pow(2, attempt - 1), 5000)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default BluebirdClient

// Re-export types from @bluebird/types for convenience
export type {
  AnalyzeRequest,
  AnalysisResult,
  AuthResponse,
  CreateProjectRequest,
  ExportPreviewRequest,
  JobResponse,
  MagicLinkRequest,
  MagicLinkResponse,
  MixFinalRequest,
  PlanSongRequest,
  PlanSongResponse,
  Project,
  RenderMusicRequest,
  RenderPreviewRequest,
  RenderVoiceRequest,
  UpdateProjectRequest,
  VerifyMagicLinkRequest,
}
