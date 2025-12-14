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
  ExportBundle,
  ExportRequest,
  JobEvent,
  MagicLinkRequest,
  MagicLinkResponse,
  PlanSongRequest,
  PlanSongResponse,
  Project,
  RenderPreviewRequest,
  UpdateProjectRequest,
  VerifyMagicLinkRequest,
} from '@bluebird/types'

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

export interface JobResponse {
  jobId: string
  status: string
  message?: string
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
    return this.post<MagicLinkResponse>('/auth/magic-link', request)
  }

  /**
   * Verify a magic link token and get auth response
   */
  async verifyMagicLink(request: VerifyMagicLinkRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/verify', request)

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
    return this.post<Project>('/projects', request)
  }

  /**
   * Get a project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    return this.get<Project>(`/projects/${projectId}`)
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, request: UpdateProjectRequest): Promise<Project> {
    return this.patch<Project>(`/projects/${projectId}`, request)
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
    return this.get<Project[]>('/projects')
  }

  // ==========================================================================
  // Analyzer Methods
  // ==========================================================================

  /**
   * Analyze lyrics to extract structure and features
   */
  async analyzeLyrics(request: AnalyzeRequest): Promise<AnalysisResult> {
    return this.post<AnalysisResult>('/analyze', request)
  }

  // ==========================================================================
  // Planning Methods
  // ==========================================================================

  /**
   * Plan a song (arrangement + vocal score)
   */
  async planSong(request: PlanSongRequest): Promise<PlanSongResponse> {
    return this.post<PlanSongResponse>('/plan/song', request)
  }

  // ==========================================================================
  // Render Methods
  // ==========================================================================

  /**
   * Render a preview (music + vocals + mix)
   */
  async renderPreview(request: RenderPreviewRequest): Promise<JobResponse> {
    return this.post<JobResponse>('/render/preview', request)
  }

  /**
   * Render a single section
   */
  async renderSection(request: {
    takeId: string
    sectionIndex: number
    seed?: number
  }): Promise<JobResponse> {
    return this.post<JobResponse>('/render/section', request)
  }

  // ==========================================================================
  // Mix Methods
  // ==========================================================================

  /**
   * Create a final mix
   */
  async mixFinal(request: { takeId: string }): Promise<JobResponse> {
    return this.post<JobResponse>('/mix/final', request)
  }

  // ==========================================================================
  // Export Methods
  // ==========================================================================

  /**
   * Export a preview
   */
  async exportPreview(request: ExportRequest): Promise<ExportBundle> {
    return this.post<ExportBundle>('/export', request)
  }

  // ==========================================================================
  // Job Methods
  // ==========================================================================

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<JobEvent> {
    return this.get<JobEvent>(`/jobs/${jobId}`)
  }

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

  private async request<T>(method: string, path: string, body?: unknown, attempt = 1): Promise<T> {
    const url = `${this.baseURL}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
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
        body: body ? JSON.stringify(body) : undefined,
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
        return undefined as T
      }

      return (await response.json()) as T
    } catch (error) {
      // Retry logic for transient failures
      if (attempt < this.retries && this.isRetryableError(error)) {
        const delay = this.getBackoffDelay(attempt)
        await this.sleep(delay)
        return this.request<T>(method, path, body, attempt + 1)
      }

      throw error
    }
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  private async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  private async delete(path: string): Promise<undefined> {
    return this.request<undefined>('DELETE', path)
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
  ExportBundle,
  ExportRequest,
  JobEvent,
  MagicLinkRequest,
  MagicLinkResponse,
  PlanSongRequest,
  PlanSongResponse,
  Project,
  RenderPreviewRequest,
  UpdateProjectRequest,
  VerifyMagicLinkRequest,
}
