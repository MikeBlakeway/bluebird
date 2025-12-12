/**
 * Mix and Mastering Utilities (Sprint 1)
 *
 * Stub implementation for mixing audio stems and applying mastering.
 * Uses simple summing with basic LUFS normalization and limiting.
 *
 * TODO (Sprint 2+): Replace with real DSP library or external service
 */

import { decodeWAV, encodeWAV, type AudioBuffer } from './music-synth.js'

export interface MixOptions {
  stems: Buffer[] // Array of WAV file buffers
  targetLUFS: number // Target loudness (-14 dBFS typical)
  truePeakLimit: number // True-peak limit (-1 dBTP typical)
  bpm: number // For alignment (future use)
}

/**
 * Mix multiple stems into a master track
 *
 * Stub implementation:
 * 1. Decode all WAV stems
 * 2. Sum samples (with headroom)
 * 3. Measure loudness (simplified RMS approximation)
 * 4. Apply gain to reach target LUFS
 * 5. Apply simple limiting to prevent clipping
 * 6. Encode to WAV
 */
export async function mixStemsToMaster(options: MixOptions): Promise<Buffer> {
  const { stems, targetLUFS, truePeakLimit } = options

  if (stems.length === 0) {
    throw new Error('No stems provided for mixing')
  }

  // Step 1: Decode all stems
  const audioBuffers: AudioBuffer[] = stems.map((stem) => decodeWAV(stem))

  // Validate all stems have same sample rate and channel count
  const firstBuffer = audioBuffers[0]
  if (!firstBuffer) {
    throw new Error('No audio buffers decoded')
  }

  const sampleRate = firstBuffer.sampleRate
  const channels = firstBuffer.channels

  for (const buffer of audioBuffers) {
    if (buffer.sampleRate !== sampleRate) {
      throw new Error(`Sample rate mismatch: expected ${sampleRate}, got ${buffer.sampleRate}`)
    }
    if (buffer.channels !== channels) {
      throw new Error(`Channel count mismatch: expected ${channels}, got ${buffer.channels}`)
    }
  }

  // Step 2: Find longest stem length
  const maxLength = Math.max(...audioBuffers.map((buf) => buf.length))

  // Step 3: Sum all stems with headroom (divide by stem count + 1 for safety)
  const headroom = 1 / (stems.length + 1)
  const leftMix = new Float32Array(maxLength)
  const rightMix = new Float32Array(maxLength)

  for (const buffer of audioBuffers) {
    const left = buffer.data[0]
    const right = buffer.data[1]

    if (!left || !right) {
      throw new Error('Invalid audio buffer: missing channel data')
    }

    for (let i = 0; i < buffer.length; i++) {
      const leftSample = left[i] ?? 0
      const rightSample = right[i] ?? 0
      const currentLeft = leftMix[i]
      const currentRight = rightMix[i]
      if (currentLeft !== undefined) leftMix[i] = currentLeft + leftSample * headroom
      if (currentRight !== undefined) rightMix[i] = currentRight + rightSample * headroom
    }
  }

  // Step 4: Measure RMS (simplified LUFS approximation)
  const rms = calculateRMS(leftMix, rightMix)
  const currentLUFS = rmsToLUFS(rms)

  // Step 5: Calculate gain to reach target LUFS
  const gainDB = targetLUFS - currentLUFS
  const gainLinear = dbToLinear(gainDB)

  // Apply gain
  for (let i = 0; i < maxLength; i++) {
    const leftSample = leftMix[i]
    const rightSample = rightMix[i]
    if (leftSample !== undefined) leftMix[i] = leftSample * gainLinear
    if (rightSample !== undefined) rightMix[i] = rightSample * gainLinear
  }

  // Step 6: Apply simple hard limiting to prevent clipping
  const peakLimit = dbToLinear(truePeakLimit)
  applyLimiter(leftMix, peakLimit)
  applyLimiter(rightMix, peakLimit)

  // Step 7: Encode to WAV
  const masterBuffer: AudioBuffer = {
    sampleRate,
    channels,
    length: maxLength,
    data: [leftMix, rightMix],
  }

  return encodeWAV(masterBuffer)
}

/**
 * Calculate RMS (Root Mean Square) across stereo channels
 */
function calculateRMS(left: Float32Array, right: Float32Array): number {
  let sumSquares = 0
  const totalSamples = left.length + right.length

  for (let i = 0; i < left.length; i++) {
    sumSquares += (left[i] ?? 0) ** 2
    sumSquares += (right[i] ?? 0) ** 2
  }

  return Math.sqrt(sumSquares / totalSamples)
}

/**
 * Convert RMS to LUFS (simplified approximation)
 * Real LUFS uses K-weighting and gating, this is a basic approximation
 */
function rmsToLUFS(rms: number): number {
  if (rms === 0) return -Infinity
  return 20 * Math.log10(rms) - 0.691 // -0.691 is K-weighting offset approximation
}

/**
 * Convert dB to linear gain
 */
function dbToLinear(db: number): number {
  return Math.pow(10, db / 20)
}

/**
 * Apply hard limiter to prevent clipping
 */
function applyLimiter(samples: Float32Array, limit: number): void {
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i] ?? 0
    if (sample > limit) {
      samples[i] = limit
    } else if (sample < -limit) {
      samples[i] = -limit
    }
  }
}
