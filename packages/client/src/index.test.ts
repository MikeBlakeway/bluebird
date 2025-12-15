/**
 * Unit tests for Bluebird API Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createId } from '@paralleldrive/cuid2'
import BluebirdClient, { BluebirdAPIError } from './index'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('BluebirdClient', () => {
  let client: BluebirdClient
  const userId = createId()
  const projectId = createId()
  const jobId = 'job-123'

  beforeEach(() => {
    vi.clearAllMocks()
    client = new BluebirdClient({
      baseURL: 'http://test-api.com',
      retries: 2,
      timeout: 1000,
    })
  })

  describe('Constructor', () => {
    it('should use provided baseURL', () => {
      const customClient = new BluebirdClient({ baseURL: 'http://custom.com' })
      expect(customClient.getJobEventsURL('test-123')).toBe(
        'http://custom.com/jobs/test-123/events'
      )
    })

    it('should use default baseURL if not provided', () => {
      const defaultClient = new BluebirdClient()
      expect(defaultClient.getJobEventsURL('test-123')).toContain('/jobs/test-123/events')
    })
  })

  describe('Debug logging', () => {
    it('should call custom logger when debug is enabled', async () => {
      const logger = vi.fn()
      const debugClient = new BluebirdClient({
        baseURL: 'http://test-api.com',
        debug: true,
        logger,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ success: true, message: 'Email sent' }),
      })

      await debugClient.requestMagicLink({ email: 'test@example.com' })

      expect(logger).toHaveBeenCalled()
      expect(logger.mock.calls.some((c) => c[0]?.message === 'HTTP request')).toBe(true)
      expect(logger.mock.calls.some((c) => c[0]?.message === 'HTTP response')).toBe(true)
    })
  })

  describe('Job Events (SSE)', () => {
    it('should validate SSE payloads and call onEvent', () => {
      class FakeEventSource {
        public onopen: null | (() => void) = null
        public onmessage: null | ((e: { data: string }) => void) = null
        public onerror: null | (() => void) = null

        constructor(
          public url: string,
          public init?: { withCredentials?: boolean }
        ) {}

        emitMessage(data: unknown) {
          this.onmessage?.({ data: JSON.stringify(data) })
        }
      }

      const prev = globalThis.EventSource
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      globalThis.EventSource = FakeEventSource as any

      try {
        const onEvent = vi.fn()
        const onError = vi.fn()

        const es = client.createJobEventsSource('job-123', {
          withCredentials: true,
          onEvent,
          onError,
        }) as unknown as FakeEventSource

        es.emitMessage({
          jobId: 'job-123',
          stage: 'queued',
          progress: 0,
          timestamp: new Date().toISOString(),
        })

        expect(onEvent).toHaveBeenCalledTimes(1)
        expect(onError).not.toHaveBeenCalled()
      } finally {
        globalThis.EventSource = prev
      }
    })
  })

  describe('Auth Methods', () => {
    it('should request magic link', async () => {
      const mockResponse = { success: true, message: 'Email sent' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.requestMagicLink({ email: 'test@example.com' })

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/auth/magic-link',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      )
    })

    it('should verify magic link and set token', async () => {
      const mockResponse = {
        user: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'jwt-token-123',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const onTokenRefresh = vi.fn()
      const clientWithCallback = new BluebirdClient({
        baseURL: 'http://test-api.com',
        onTokenRefresh,
      })

      const result = await clientWithCallback.verifyMagicLink({ token: 'magic-123' })

      expect(result).toEqual(mockResponse)
      expect(onTokenRefresh).toHaveBeenCalledWith('jwt-token-123')
    })

    it('should include auth token in headers when set', async () => {
      client.setAuthToken('test-token')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await client.listProjects()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })
  })

  describe('Project Methods', () => {
    it('should create a project', async () => {
      const mockProject = {
        id: projectId,
        userId,
        name: 'My Song',
        lyrics: 'Test lyrics here',
        genre: 'Pop',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      })

      const result = await client.createProject({
        name: 'My Song',
        lyrics: 'Test lyrics here',
        genre: 'Pop',
      })

      expect(result).toEqual(mockProject)
    })

    it('should get a project by ID', async () => {
      const mockProject = {
        id: projectId,
        userId,
        name: 'My Song',
        lyrics: 'Test lyrics',
        genre: 'Pop',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      })

      const result = await client.getProject(projectId)

      expect(result).toEqual(mockProject)
      expect(mockFetch).toHaveBeenCalledWith(
        `http://test-api.com/projects/${projectId}`,
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should update a project', async () => {
      const mockProject = {
        id: projectId,
        userId,
        name: 'Updated Song',
        lyrics: 'Updated lyrics',
        genre: 'Rock',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      })

      const result = await client.updateProject(projectId, { name: 'Updated Song' })

      expect(result).toEqual(mockProject)
    })

    it('should delete a project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await client.deleteProject(projectId)

      expect(mockFetch).toHaveBeenCalledWith(
        `http://test-api.com/projects/${projectId}`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should list projects', async () => {
      const mockProjects = [
        {
          id: projectId,
          userId,
          name: 'Song 1',
          lyrics: 'Lyrics 1 - long enough',
          genre: 'Pop',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
      })

      const result = await client.listProjects()

      expect(result).toEqual(mockProjects)
    })
  })

  describe('Planning Methods', () => {
    it('should plan a song', async () => {
      const mockResponse = {
        jobId,
        projectId,
        status: 'completed',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.planSong({
        projectId,
        lyrics: 'Test lyrics here',
        genre: 'Pop',
      })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Render Methods', () => {
    it('should render a preview', async () => {
      const mockResponse = {
        jobId,
        status: 'queued',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.renderPreview({
        projectId,
        jobId,
      })

      expect(result).toEqual(mockResponse)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/render/preview',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      )
    })

    it('should render music', async () => {
      const mockResponse = {
        jobId: 'music-job-123',
        status: 'queued',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.renderMusic({
        projectId,
        jobId,
        sectionIndex: 0,
        instrument: 'piano',
        seed: 42,
      })

      expect(result).toEqual(mockResponse)
    })

    it('should render vocals', async () => {
      const mockResponse = {
        jobId: 'vocals-job-123',
        status: 'queued',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.renderVocals({
        projectId,
        jobId,
        sectionIndex: 0,
        lyrics: 'Hello world',
        seed: 42,
      })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Error Handling', () => {
    it('should throw BluebirdAPIError on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => JSON.stringify({ error: 'Invalid input' }),
      })

      try {
        await client.listProjects()
      } catch (error) {
        expect(error).toBeInstanceOf(BluebirdAPIError)
        expect(error).toHaveProperty('message', 'HTTP 400: Bad Request')
      }
    })

    it('should include error details in BluebirdAPIError', async () => {
      const errorDetails = { error: 'Validation failed', fields: ['name'] }
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => JSON.stringify(errorDetails),
      })

      try {
        await client.createProject({
          name: 'Valid Name',
          lyrics: 'This is valid lyrics with enough length.',
          genre: 'Pop',
        })
      } catch (error) {
        expect(error).toBeInstanceOf(BluebirdAPIError)
        if (error instanceof BluebirdAPIError) {
          expect(error.statusCode).toBe(422)
          expect(error.details).toEqual(errorDetails)
        }
      }
    })
  })

  describe('Retry Logic', () => {
    it('should retry on 500 errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })

      const result = await client.listProjects()

      expect(result).toEqual([])
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should retry on 429 rate limit', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limited',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })

      const result = await client.listProjects()

      expect(result).toEqual([])
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry on 4xx client errors (except 429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not found',
      })

      await expect(client.getProject('invalid')).rejects.toThrow(BluebirdAPIError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should give up after max retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      })

      await expect(client.listProjects()).rejects.toThrow(BluebirdAPIError)
      // Client configured with retries: 2, so initial call + 1 retry = 2 total
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Job Methods', () => {
    it('should return correct SSE URL', () => {
      const url = client.getJobEventsURL('job-123')
      expect(url).toBe('http://test-api.com/jobs/job-123/events')
    })
  })
})
