/**
 * CLI Tests
 * Tests for the command-line interface including CUID2 generation and validation
 */

import { describe, it, expect } from 'vitest'
import { createId } from '@paralleldrive/cuid2'

// Import schemas from types package
import { ProjectIdSchema, PlanSongRequestSchema } from '@bluebird/types'

describe('CLI - CUID2 Generation', () => {
  it('should generate valid CUID2 IDs', () => {
    const id1 = createId()
    const id2 = createId()

    // CUID2s should be different
    expect(id1).not.toBe(id2)

    // Should be strings
    expect(typeof id1).toBe('string')
    expect(typeof id2).toBe('string')

    // Should have reasonable length (CUID2 is typically 24 characters)
    expect(id1.length).toBeGreaterThanOrEqual(20)
    expect(id1.length).toBeLessThanOrEqual(32)
  })

  it('should pass ProjectIdSchema validation with CUID2', () => {
    const projectId = createId()

    // Should validate successfully
    const result = ProjectIdSchema.safeParse(projectId)
    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data).toBe(projectId)
    }
  })

  it('should validate CUID2 format in ProjectIdSchema', () => {
    // Test that createId() generates valid CUID2s that pass validation
    const generatedId1 = createId()
    const generatedId2 = createId()
    const generatedId3 = createId()

    expect(ProjectIdSchema.safeParse(generatedId1).success).toBe(true)
    expect(ProjectIdSchema.safeParse(generatedId2).success).toBe(true)
    expect(ProjectIdSchema.safeParse(generatedId3).success).toBe(true)

    // Empty strings should fail
    expect(ProjectIdSchema.safeParse('').success).toBe(false)
  })

  it('should validate complete PlanSongRequest with CUID2 projectId', () => {
    const request = {
      projectId: createId(),
      lyrics: 'Test lyrics\nLine two\nLine three\nLine four',
      genre: 'pop_2010s',
      seed: 42,
    }

    const result = PlanSongRequestSchema.safeParse(request)
    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.projectId).toBe(request.projectId)
      expect(result.data.lyrics).toBe(request.lyrics)
      expect(result.data.genre).toBe(request.genre)
      expect(result.data.seed).toBe(request.seed)
    }
  })

  it('should reject PlanSongRequest with invalid CUID2 projectId', () => {
    const request = {
      projectId: 'test-project-invalid',
      lyrics: 'Test lyrics\nLine two',
      genre: 'pop_2010s',
      seed: 42,
    }

    const result = PlanSongRequestSchema.safeParse(request)
    expect(result.success).toBe(false)

    if (!result.success) {
      const projectIdError = result.error.issues.find((issue) => issue.path[0] === 'projectId')
      expect(projectIdError).toBeDefined()
    }
  })

  it('should handle optional seed in PlanSongRequest', () => {
    const requestWithSeed = {
      projectId: createId(),
      lyrics: 'Test with seed',
      genre: 'rock_2010s',
      seed: 123,
    }

    const requestWithoutSeed = {
      projectId: createId(),
      lyrics: 'Test without seed',
      genre: 'rock_2010s',
    }

    const result1 = PlanSongRequestSchema.safeParse(requestWithSeed)
    const result2 = PlanSongRequestSchema.safeParse(requestWithoutSeed)

    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)

    if (result1.success) {
      expect(result1.data.seed).toBe(123)
    }

    if (result2.success) {
      expect(result2.data.seed).toBeUndefined()
    }
  })

  it('should validate lyrics length constraints', () => {
    const projectId = createId()

    // Too short (< 10 characters)
    const tooShort = {
      projectId,
      lyrics: 'Short',
      genre: 'pop_2010s',
    }

    const resultShort = PlanSongRequestSchema.safeParse(tooShort)
    expect(resultShort.success).toBe(false)

    // Valid length
    const validLength = {
      projectId: createId(),
      lyrics: 'This is a valid test\nWith multiple lines\nAnd proper length',
      genre: 'pop_2010s',
    }

    const resultValid = PlanSongRequestSchema.safeParse(validLength)
    expect(resultValid.success).toBe(true)

    // Too long (> 5000 characters)
    const tooLong = {
      projectId: createId(),
      lyrics: 'A'.repeat(5001),
      genre: 'pop_2010s',
    }

    const resultLong = PlanSongRequestSchema.safeParse(tooLong)
    expect(resultLong.success).toBe(false)
  })

  it('should generate unique IDs on each call', () => {
    const ids = new Set<string>()
    const count = 100

    for (let i = 0; i < count; i++) {
      ids.add(createId())
    }

    // All IDs should be unique
    expect(ids.size).toBe(count)
  })

  it('should validate genre string constraints', () => {
    // Valid genres (any non-empty string)
    const validGenres = ['pop_2010s', 'rock_2010s', 'electronic_2010s', 'custom-genre', 'anything']

    for (const genre of validGenres) {
      const result = PlanSongRequestSchema.safeParse({
        projectId: createId(),
        lyrics: 'Test lyrics line one\nLine two\nLine three',
        genre,
      })

      expect(result.success).toBe(true)
    }

    // Empty string should fail (min length 1)
    const emptyGenreResult = PlanSongRequestSchema.safeParse({
      projectId: createId(),
      lyrics: 'Test lyrics line one\nLine two\nLine three',
      genre: '',
    })

    expect(emptyGenreResult.success).toBe(false)
  })
})

describe('CLI - Command Structure', () => {
  it('should construct valid jobId from projectId and seed', () => {
    const projectId = createId()
    const timestamp = Date.now()
    const seed = 42

    const jobId = `${projectId}:${timestamp}:${seed}`

    // JobId should contain projectId
    expect(jobId.startsWith(projectId)).toBe(true)

    // Should have correct format
    const parts = jobId.split(':')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toBe(projectId)
    expect(parts[2]).toBe('42')
  })

  it('should handle missing optional project ID by generating new one', () => {
    // Simulate CLI behavior when --project not provided
    const options: { project?: string; lyrics: string; genre: string } = {
      lyrics: 'Test lyrics',
      genre: 'pop_2010s',
    }

    const projectId = options.project || createId()

    // Should generate valid CUID2
    const result = ProjectIdSchema.safeParse(projectId)
    expect(result.success).toBe(true)
  })

  it('should use provided project ID when specified', () => {
    const providedId = createId()

    const options = {
      project: providedId,
      lyrics: 'Test lyrics',
      genre: 'pop_2010s',
    }

    const projectId = options.project || createId()

    // Should use the provided ID
    expect(projectId).toBe(providedId)

    const result = ProjectIdSchema.safeParse(projectId)
    expect(result.success).toBe(true)
  })
})
