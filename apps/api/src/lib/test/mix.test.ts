/**
 * Mix Utilities Tests
 *
 * Tests for mixing stems and mastering functions
 */

import { describe, it, expect } from 'vitest'
import { mixStemsToMaster } from '../mix.js'
import { encodeWAV, decodeWAV, type AudioBuffer } from '../music-synth.js'

describe('Mix Utilities', () => {
  it('should mix multiple stems into a master', async () => {
    // Create two simple test stems (1 second @ 48kHz)
    const sampleRate = 48000
    const length = sampleRate // 1 second

    const stem1: AudioBuffer = {
      sampleRate,
      channels: 2,
      length,
      data: [
        new Float32Array(length).fill(0.1), // Left channel
        new Float32Array(length).fill(0.1), // Right channel
      ],
    }

    const stem2: AudioBuffer = {
      sampleRate,
      channels: 2,
      length,
      data: [
        new Float32Array(length).fill(0.2), // Left channel
        new Float32Array(length).fill(0.2), // Right channel
      ],
    }

    // Encode stems to WAV buffers
    const stem1Buffer = encodeWAV(stem1)
    const stem2Buffer = encodeWAV(stem2)

    // Mix stems
    const masterBuffer = await mixStemsToMaster({
      stems: [stem1Buffer, stem2Buffer],
      targetLUFS: -14,
      truePeakLimit: -1,
      bpm: 120,
    })

    // Verify result is a Buffer
    expect(Buffer.isBuffer(masterBuffer)).toBe(true)
    expect(masterBuffer.length).toBeGreaterThan(0)

    // Decode and verify it's a valid WAV
    const decodedMaster = decodeWAV(masterBuffer)
    expect(decodedMaster.sampleRate).toBe(sampleRate)
    expect(decodedMaster.channels).toBe(2)
    expect(decodedMaster.length).toBe(length)
  })

  it('should throw error when no stems provided', async () => {
    await expect(
      mixStemsToMaster({
        stems: [],
        targetLUFS: -14,
        truePeakLimit: -1,
        bpm: 120,
      })
    ).rejects.toThrow('No stems provided for mixing')
  })

  it('should throw error on sample rate mismatch', async () => {
    const stem1: AudioBuffer = {
      sampleRate: 48000,
      channels: 2,
      length: 1000,
      data: [new Float32Array(1000), new Float32Array(1000)],
    }

    const stem2: AudioBuffer = {
      sampleRate: 44100, // Different sample rate
      channels: 2,
      length: 1000,
      data: [new Float32Array(1000), new Float32Array(1000)],
    }

    const stem1Buffer = encodeWAV(stem1)
    const stem2Buffer = encodeWAV(stem2)

    await expect(
      mixStemsToMaster({
        stems: [stem1Buffer, stem2Buffer],
        targetLUFS: -14,
        truePeakLimit: -1,
        bpm: 120,
      })
    ).rejects.toThrow('Sample rate mismatch')
  })

  it('should handle stems of different lengths', async () => {
    const stem1: AudioBuffer = {
      sampleRate: 48000,
      channels: 2,
      length: 1000,
      data: [new Float32Array(1000).fill(0.1), new Float32Array(1000).fill(0.1)],
    }

    const stem2: AudioBuffer = {
      sampleRate: 48000,
      channels: 2,
      length: 2000, // Longer
      data: [new Float32Array(2000).fill(0.1), new Float32Array(2000).fill(0.1)],
    }

    const stem1Buffer = encodeWAV(stem1)
    const stem2Buffer = encodeWAV(stem2)

    const masterBuffer = await mixStemsToMaster({
      stems: [stem1Buffer, stem2Buffer],
      targetLUFS: -14,
      truePeakLimit: -1,
      bpm: 120,
    })

    const decodedMaster = decodeWAV(masterBuffer)
    // Should use the longest stem length
    expect(decodedMaster.length).toBe(2000)
  })
})

describe('WAV Decode/Encode', () => {
  it('should decode an encoded WAV correctly', () => {
    const original: AudioBuffer = {
      sampleRate: 48000,
      channels: 2,
      length: 1000,
      data: [new Float32Array(1000).fill(0.5), new Float32Array(1000).fill(0.25)],
    }

    const encoded = encodeWAV(original)
    const decoded = decodeWAV(encoded)

    expect(decoded.sampleRate).toBe(original.sampleRate)
    expect(decoded.channels).toBe(original.channels)
    expect(decoded.length).toBe(original.length)

    // Check samples are approximately equal (some precision loss from 16-bit encoding)
    const leftOriginal = original.data[0]
    const leftDecoded = decoded.data[0]
    expect(leftOriginal).toBeDefined()
    expect(leftDecoded).toBeDefined()
    if (leftOriginal && leftDecoded) {
      const originalSample = leftOriginal[0]
      const decodedSample = leftDecoded[0]
      expect(originalSample).toBeDefined()
      expect(decodedSample).toBeDefined()
      if (originalSample !== undefined && decodedSample !== undefined) {
        expect(Math.abs(originalSample - decodedSample)).toBeLessThan(0.001)
      }
    }
  })

  it('should throw error for invalid WAV header', () => {
    const invalidBuffer = Buffer.from('NOT_A_WAV_FILE')
    expect(() => decodeWAV(invalidBuffer)).toThrow('Invalid WAV file')
  })
})
