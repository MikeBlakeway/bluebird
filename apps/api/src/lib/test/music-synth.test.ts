import { describe, it, expect } from 'vitest'
import { synthesizeMusic, encodeWAV, type AudioBuffer } from '../music-synth.js'
import type { ArrangementSpec } from '@bluebird/types'

describe('Music Synthesis (Stub)', () => {
  const mockArrangement: ArrangementSpec = {
    projectId: 'test_music_synth_proj',
    jobId: 'test_music_synth_job:123:42',
    bpm: 120,
    key: 'C',
    scale: 'major',
    timeSignature: '4/4',
    sections: [
      {
        index: 0,
        type: 'intro',
        bars: 4,
        energyLevel: 0.5,
      },
      {
        index: 1,
        type: 'verse',
        bars: 8,
        energyLevel: 0.7,
      },
    ],
    instrumentation: ['drums', 'bass', 'guitar'],
    energyCurve: [0.5, 0.7],
    seed: 42,
  }

  it('should generate audio for valid section index', async () => {
    const buffer = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'drums',
      seed: 42,
    })

    expect(buffer.sampleRate).toBe(48000)
    expect(buffer.channels).toBe(2)
    expect(buffer.length).toBeGreaterThan(0)
    expect(buffer.data).toHaveLength(2) // Stereo
  })

  it('should reject invalid section index', async () => {
    await expect(
      synthesizeMusic({
        arrangement: mockArrangement,
        sectionIndex: 10,
        instrument: 'drums',
        seed: 42,
      })
    ).rejects.toThrow('Invalid section index')
  })

  it('should calculate correct duration for section', async () => {
    // 4 bars at 120 BPM = 4 * 4 beats * 0.5 sec/beat = 8 seconds
    const buffer = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'drums',
      seed: 42,
    })

    const expectedDuration = 8 // seconds
    const expectedSamples = expectedDuration * 48000
    expect(buffer.length).toBe(expectedSamples)
  })

  it('should generate different patterns for different instruments', async () => {
    const drumsBuffer = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'drums',
      seed: 42,
    })

    const bassBuffer = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'bass',
      seed: 42,
    })

    // Buffers should be same length but different content
    expect(drumsBuffer.length).toBe(bassBuffer.length)
    expect(drumsBuffer.data[0]).not.toEqual(bassBuffer.data[0])
  })

  it('should be deterministic with same seed', async () => {
    const buffer1 = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'drums',
      seed: 123,
    })

    const buffer2 = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'drums',
      seed: 123,
    })

    expect(buffer1.data[0]).toEqual(buffer2.data[0])
    expect(buffer1.data[1]).toEqual(buffer2.data[1])
  })

  it('should generate different output with different seeds', async () => {
    const buffer1 = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'drums',
      seed: 123,
    })

    const buffer2 = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'drums',
      seed: 456,
    })

    expect(buffer1.data[0]).not.toEqual(buffer2.data[0])
  })

  it('should clamp samples to valid PCM range', async () => {
    const buffer = await synthesizeMusic({
      arrangement: mockArrangement,
      sectionIndex: 0,
      instrument: 'drums',
      seed: 42,
    })

    // Check all samples are in [-1, 1] range
    for (const channel of buffer.data) {
      for (const sample of channel) {
        expect(sample).toBeGreaterThanOrEqual(-1)
        expect(sample).toBeLessThanOrEqual(1)
      }
    }
  })

  describe('WAV Encoding', () => {
    it('should encode audio buffer to valid WAV format', async () => {
      const buffer = await synthesizeMusic({
        arrangement: mockArrangement,
        sectionIndex: 0,
        instrument: 'drums',
        seed: 42,
      })

      const wav = encodeWAV(buffer)

      expect(Buffer.isBuffer(wav)).toBe(true)
      expect(wav.length).toBeGreaterThan(44) // Must have WAV header

      // Check RIFF header
      expect(wav.toString('utf8', 0, 4)).toBe('RIFF')
      expect(wav.toString('utf8', 8, 12)).toBe('WAVE')

      // Check fmt chunk
      expect(wav.toString('utf8', 12, 16)).toBe('fmt ')

      // Check data chunk
      expect(wav.toString('utf8', 36, 40)).toBe('data')
    })

    it('should include correct WAV metadata', async () => {
      const buffer: AudioBuffer = {
        sampleRate: 48000,
        channels: 2,
        length: 1000,
        data: [new Float32Array(1000), new Float32Array(1000)],
      }

      const wav = encodeWAV(buffer)

      // Read sample rate from WAV header (offset 24)
      const wavSampleRate = wav.readUInt32LE(24)
      expect(wavSampleRate).toBe(48000)

      // Read channel count (offset 22)
      const wavChannels = wav.readUInt16LE(22)
      expect(wavChannels).toBe(2)

      // Read bits per sample (offset 34)
      const wavBits = wav.readUInt16LE(34)
      expect(wavBits).toBe(16)
    })
  })
})
