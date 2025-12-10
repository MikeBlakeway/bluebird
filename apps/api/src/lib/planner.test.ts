import { test, describe, expect } from 'vitest'
import {
  guessKey,
  guessScale,
  refineTempo,
  inferStructure,
  generateEnergyCurve,
  guessInstrumentation,
  planArrangement,
} from './planner.js'
import { analyzeLyrics, detectRhymeScheme, estimateTempo, extractSeedPhrase } from './analyzer.js'
import { ProjectIdSchema, JobIdSchema } from '@bluebird/types'
import type { AnalysisResult } from '@bluebird/types'

const createMockAnalysis = (overrides?: Partial<AnalysisResult>): AnalysisResult => ({
  projectId: ProjectIdSchema.parse('cuid123456789abcdefghijklmn'),
  lyrics: 'test',
  lines: [],
  totalSyllables: 0,
  analyzedAt: new Date().toISOString(),
  ...overrides,
})

describe('Planner', () => {
  describe('guessKey', () => {
    test('should return a valid key', () => {
      const mockAnalysis = createMockAnalysis()
      const key = guessKey(mockAnalysis)
      expect(key).toMatch(/^[A-G]m?#?$/)
    })

    test('should be deterministic with same seed', () => {
      const mockAnalysis = createMockAnalysis()
      const key1 = guessKey(mockAnalysis, 42)
      const key2 = guessKey(mockAnalysis, 42)
      expect(key1).toBe(key2)
    })
  })

  describe('guessScale', () => {
    test('should return major for happy phrases', () => {
      const mockAnalysis = createMockAnalysis()
      const scale = guessScale('Love and joy forever', mockAnalysis)
      expect(scale).toBe('major')
    })

    test('should return minor for sad phrases', () => {
      const mockAnalysis = createMockAnalysis()
      const scale = guessScale('Sad and broken hearted', mockAnalysis)
      expect(scale).toBe('minor')
    })
  })

  describe('refineTempo', () => {
    test('should increase tempo for high syllable density', () => {
      const mockAnalysis = createMockAnalysis({
        lines: [
          {
            index: 0,
            text: 'Many many syllables in this line',
            syllables: ['Ma', 'ny', 'ma', 'ny', 'syl', 'la', 'bles', 'in', 'this', 'line'],
            estimatedDuration: 2000,
          },
        ],
        totalSyllables: 10,
        estimatedTempo: 100,
      })
      const tempo = refineTempo(mockAnalysis)
      expect(tempo).toBeGreaterThan(100)
    })

    test('should decrease tempo for low syllable density', () => {
      const mockAnalysis = createMockAnalysis({
        lines: [{ index: 0, text: 'Hi bye', syllables: ['Hi', 'bye'], estimatedDuration: 400 }],
        totalSyllables: 2,
        estimatedTempo: 100,
      })
      const tempo = refineTempo(mockAnalysis)
      expect(tempo).toBeLessThan(100)
    })
  })

  describe('inferStructure', () => {
    test('should create valid song structure', () => {
      const mockAnalysis = createMockAnalysis({
        lines: Array.from({ length: 12 }, (_, i) => ({
          index: i,
          text: `Line ${i}`,
          syllables: ['syl'],
          estimatedDuration: 200,
        })),
        totalSyllables: 12,
      })
      const sections = inferStructure(mockAnalysis)

      expect(sections.length).toBeGreaterThan(4)
      const intro = sections.find((s) => s.type === 'intro')
      const outro = sections.find((s) => s.type === 'outro')
      const chorus = sections.find((s) => s.type === 'chorus')
      expect(intro).toBeDefined()
      expect(outro).toBeDefined()
      expect(chorus).toBeDefined()
    })
  })

  describe('generateEnergyCurve', () => {
    test('should create valid energy curve', () => {
      const sections = [
        { index: 0, type: 'intro' as const, bars: 8, energyLevel: 0.3 },
        { index: 1, type: 'verse' as const, bars: 16, energyLevel: 0.6 },
      ]
      const curve = generateEnergyCurve(sections)

      expect(curve.length).toBeGreaterThan(0)
      expect(curve.every((v) => v >= 0 && v <= 1)).toBe(true)
    })
  })

  describe('guessInstrumentation', () => {
    test('should include base instruments', () => {
      const mockAnalysis = createMockAnalysis({ totalSyllables: 10 })
      const instruments = guessInstrumentation(mockAnalysis)

      expect(instruments).toContain('kick')
      expect(instruments).toContain('bass')
    })

    test('should add strings for long lyrics', () => {
      const mockAnalysis = createMockAnalysis({ totalSyllables: 150 })
      const instruments = guessInstrumentation(mockAnalysis)

      expect(instruments).toContain('strings')
    })
  })

  describe('planArrangement', () => {
    test('should generate complete ArrangementSpec', () => {
      const lyrics = 'Hello world\nThis is a test\nLove the song\nHear it right'
      const lines = analyzeLyrics(lyrics)
      const rhymeDetect = detectRhymeScheme(lines)
      const tempo = estimateTempo(lines)
      const seed = extractSeedPhrase(lyrics)

      const analysisResult = createMockAnalysis({
        lyrics,
        lines,
        totalSyllables: lines.reduce((sum, l) => sum + l.syllables.length, 0),
        rhymeScheme: rhymeDetect.rhymeScheme,
        rhymingWords: rhymeDetect.rhymingWords,
        estimatedTempo: tempo,
        seedPhrase: seed,
      })

      const jobId = JobIdSchema.parse('test-job-12345')
      const arrangement = planArrangement(analysisResult, jobId, 42)

      expect(arrangement.bpm).toBeGreaterThanOrEqual(70)
      expect(arrangement.bpm).toBeLessThanOrEqual(160)
      expect(arrangement.key).toMatch(/^[A-G]/)
      expect(['major', 'minor', 'pentatonic']).toContain(arrangement.scale)
      expect(arrangement.sections.length).toBeGreaterThan(0)
      expect(arrangement.instrumentation.length).toBeGreaterThan(0)
      expect(arrangement.energyCurve.length).toBeGreaterThan(0)
    })

    test('should be deterministic with same seed', () => {
      const lyrics = 'Hello world test'
      const lines = analyzeLyrics(lyrics)
      const rhymeDetect = detectRhymeScheme(lines)
      const tempo = estimateTempo(lines)
      const seed = extractSeedPhrase(lyrics)

      const analysisResult = createMockAnalysis({
        lyrics,
        lines,
        totalSyllables: lines.reduce((sum, l) => sum + l.syllables.length, 0),
        rhymeScheme: rhymeDetect.rhymeScheme,
        rhymingWords: rhymeDetect.rhymingWords,
        estimatedTempo: tempo,
        seedPhrase: seed,
      })

      const jobId = JobIdSchema.parse('test-job-12345')
      const arr1 = planArrangement(analysisResult, jobId, 42)
      const arr2 = planArrangement(analysisResult, jobId, 42)

      expect(arr1.key).toBe(arr2.key)
      expect(arr1.bpm).toBe(arr2.bpm)
      expect(arr1.scale).toBe(arr2.scale)
    })
  })
})
