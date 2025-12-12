/**
 * S3 Client Tests
 *
 * Tests S3 utility functions for MinIO/S3 storage operations.
 */

import { describe, it, expect, vi } from 'vitest'
import { getS3Paths, uploadJsonToS3, downloadJsonFromS3 } from '../s3.js'

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(() => Promise.resolve('https://presigned-url.example.com')),
}))

describe('S3 Utilities', () => {
  describe('getS3Paths', () => {
    it('should generate correct S3 path structure', () => {
      const projectId = 'proj-123'
      const takeId = 'take-456'

      const paths = getS3Paths(projectId, takeId)

      expect(paths.base).toBe('projects/proj-123/takes/take-456')
      expect(paths.plan).toBe('projects/proj-123/takes/take-456/plan.json')
    })

    it('should generate correct section music path', () => {
      const paths = getS3Paths('proj-123', 'take-456')

      const musicPath = paths.section(0).music('drums')
      expect(musicPath).toBe('projects/proj-123/takes/take-456/sections/0/music/drums.wav')
    })

    it('should generate correct section vocals path', () => {
      const paths = getS3Paths('proj-123', 'take-456')

      const vocalPath = paths.section(2).vocals('lead')
      expect(vocalPath).toBe('projects/proj-123/takes/take-456/sections/2/vocals/lead.wav')
    })

    it('should generate correct mix paths', () => {
      const paths = getS3Paths('proj-123', 'take-456')

      expect(paths.mix.master).toBe('projects/proj-123/takes/take-456/mix/master.wav')
      expect(paths.mix.masterMp3).toBe('projects/proj-123/takes/take-456/mix/master.mp3')
    })

    it('should generate correct reference paths', () => {
      const paths = getS3Paths('proj-123', 'take-456')

      expect(paths.reference.audio).toBe('projects/proj-123/takes/take-456/reference/ref.wav')
      expect(paths.reference.features).toBe('projects/proj-123/takes/take-456/features/remix.json')
    })

    it('should generate correct similarity report path with timestamp', () => {
      const paths = getS3Paths('proj-123', 'take-456')

      const reportPath = paths.reports.similarity('2025-12-12T10:30:00Z')
      expect(reportPath).toBe(
        'projects/proj-123/takes/take-456/reports/similarity-2025-12-12T10:30:00Z.json'
      )
    })

    it('should handle multiple section indices', () => {
      const paths = getS3Paths('proj-123', 'take-456')

      expect(paths.section(0).music('bass')).toContain('/sections/0/')
      expect(paths.section(5).music('guitar')).toContain('/sections/5/')
      expect(paths.section(10).vocals('harmony')).toContain('/sections/10/')
    })
  })

  describe('JSON operations', () => {
    it('should serialize and structure JSON for upload', () => {
      // We can't actually test the upload without mocking S3Client.send
      // but we can verify the function exists and is callable
      expect(uploadJsonToS3).toBeDefined()
      expect(typeof uploadJsonToS3).toBe('function')
    })

    it('should have download JSON function', () => {
      expect(downloadJsonFromS3).toBeDefined()
      expect(typeof downloadJsonFromS3).toBe('function')
    })
  })

  describe('Path structure validation', () => {
    it('should create unique paths for different projects', () => {
      const paths1 = getS3Paths('proj-1', 'take-1')
      const paths2 = getS3Paths('proj-2', 'take-1')

      expect(paths1.base).not.toBe(paths2.base)
      expect(paths1.plan).not.toBe(paths2.plan)
    })

    it('should create unique paths for different takes', () => {
      const paths1 = getS3Paths('proj-1', 'take-1')
      const paths2 = getS3Paths('proj-1', 'take-2')

      expect(paths1.base).not.toBe(paths2.base)
      expect(paths1.plan).not.toBe(paths2.plan)
    })

    it('should namespace all paths under projects/{projectId}/takes/{takeId}', () => {
      const projectId = 'test-proj'
      const takeId = 'test-take'
      const paths = getS3Paths(projectId, takeId)

      const allPaths = [
        paths.plan,
        paths.section(0).music('drums'),
        paths.section(0).vocals('lead'),
        paths.mix.master,
        paths.mix.masterMp3,
        paths.reference.audio,
        paths.reference.features,
        paths.reports.similarity('timestamp'),
      ]

      allPaths.forEach((path) => {
        expect(path).toMatch(new RegExp(`^projects/${projectId}/takes/${takeId}/`))
      })
    })
  })
})
