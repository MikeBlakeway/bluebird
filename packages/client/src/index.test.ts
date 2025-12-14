/**
 * Unit tests for Bluebird API Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import BluebirdClient, { BluebirdAPIError } from './index'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('BluebirdClient', () => {
  let client: BluebirdClient

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
          id: 'user-123',
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
        id: 'proj-123',
        userId: 'user-123',
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
        id: 'proj-123',
        userId: 'user-123',
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

      const result = await client.getProject('proj-123')

      expect(result).toEqual(mockProject)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/projects/proj-123',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should update a project', async () => {
      const mockProject = {
        id: 'proj-123',
        userId: 'user-123',
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

      const result = await client.updateProject('proj-123', { name: 'Updated Song' })

      expect(result).toEqual(mockProject)
    })

    it('should delete a project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await client.deleteProject('proj-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/projects/proj-123',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should list projects', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          userId: 'user-123',
          name: 'Song 1',
          lyrics: 'Lyrics 1',
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
        jobId: 'job-123',
        projectId: 'proj-123',
        status: 'completed',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.planSong({
        projectId: 'proj-123',
        lyrics: 'Test lyrics here',
        genre: 'Pop',
      })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Render Methods', () => {
    it('should render a preview', async () => {
      const mockResponse = {
        jobId: 'job-123',
        status: 'queued',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.renderPreview({
        jobId: 'job-123',
        arrangement: {
          projectId: 'proj-123',
          jobId: 'job-123',
          bpm: 120,
          key: 'C',
          scale: 'major',
          timeSignature: '4/4',
          sections: [],
          instrumentation: ['piano', 'drums'],
          energyCurve: [0.5, 0.7, 0.9],
        },
        vocals: {
          projectId: 'proj-123',
          jobId: 'job-123',
          lines: [],
        },
      })

      expect(result).toEqual(mockResponse)
    })

    it('should render a section', async () => {
      const mockResponse = {
        jobId: 'section-job-123',
        status: 'queued',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.renderSection({
        takeId: 'take-123',
        sectionIndex: 0,
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
        await client.createProject({ name: '', lyrics: 'test', genre: 'Pop' })
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
    it('should get job status', async () => {
      const mockJob = {
        jobId: 'job-123',
        stage: 'completed' as const,
        progress: 1,
        timestamp: new Date().toISOString(),
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob,
      })

      const result = await client.getJob('job-123')

      expect(result).toEqual(mockJob)
    })

    it('should return correct SSE URL', () => {
      const url = client.getJobEventsURL('job-123')
      expect(url).toBe('http://test-api.com/jobs/job-123/events')
    })
  })
})
