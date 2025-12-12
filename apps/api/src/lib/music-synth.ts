/**
 * Music Synthesis Stub (Sprint 1)
 *
 * Generates placeholder audio stems for music instruments.
 * Stub implementation uses click patterns and simple waveforms aligned to BPM.
 *
 * TODO (Sprint 2+): Replace with real ML models
 */

import type { ArrangementSpec } from '@bluebird/types'

export interface MusicSynthOptions {
  arrangement: ArrangementSpec
  sectionIndex: number
  instrument: string
  seed: number
}

export interface AudioBuffer {
  sampleRate: number
  channels: number
  length: number
  data: Float32Array[]
}

/**
 * Generate a music stem for a specific section and instrument.
 * Returns raw PCM audio data (Float32Array, -1.0 to 1.0 range).
 */
export async function synthesizeMusic(options: MusicSynthOptions): Promise<AudioBuffer> {
  const { arrangement, sectionIndex, instrument, seed } = options

  if (sectionIndex >= arrangement.sections.length) {
    throw new Error(`Invalid section index: ${sectionIndex}`)
  }

  const section = arrangement.sections[sectionIndex]
  if (!section) {
    throw new Error(`Section not found at index: ${sectionIndex}`)
  }
  const sampleRate = 48000
  const bpm = arrangement.bpm
  const bars = section.bars

  // Calculate duration in samples
  const beatsPerBar = 4
  const totalBeats = bars * beatsPerBar
  const secondsPerBeat = 60 / bpm
  const durationSeconds = totalBeats * secondsPerBeat
  const totalSamples = Math.floor(durationSeconds * sampleRate)

  // Generate stereo audio
  const left = new Float32Array(totalSamples)
  const right = new Float32Array(totalSamples)

  // Seed-based pseudo-random for reproducibility
  let rng = seed

  const nextRandom = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng / 0x7fffffff
  }

  // Generate instrument-specific pattern
  switch (instrument.toLowerCase()) {
    case 'drums':
      generateDrumPattern(left, right, sampleRate, bpm, bars, nextRandom)
      break

    case 'bass':
      generateBassPattern(left, right, sampleRate, bpm, bars, arrangement.key, nextRandom)
      break

    case 'guitar':
    case 'keys':
    case 'synth':
      generateHarmonicPattern(left, right, sampleRate, bpm, bars, arrangement.key, nextRandom)
      break

    default:
      // Generic click pattern for unknown instruments
      generateClickPattern(left, right, sampleRate, bpm, bars)
  }

  return {
    sampleRate,
    channels: 2,
    length: totalSamples,
    data: [left, right],
  }
}

/**
 * Generate drum pattern - kick on 1 & 3, snare on 2 & 4
 */
function generateDrumPattern(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  bpm: number,
  bars: number,
  random: () => number
): void {
  const samplesPerBeat = Math.floor((60 / bpm) * sampleRate)
  const beatsPerBar = 4
  const totalBeats = bars * beatsPerBar

  for (let beat = 0; beat < totalBeats; beat++) {
    const startSample = beat * samplesPerBeat
    const isKick = beat % 4 === 0 || beat % 4 === 2 // Beats 1 & 3
    const isSnare = beat % 4 === 1 || beat % 4 === 3 // Beats 2 & 4

    if (isKick) {
      // Kick drum - low frequency thump
      synthesizeKick(left, right, startSample, sampleRate, 0.8)
    }

    if (isSnare) {
      // Snare - noise burst
      synthesizeSnare(left, right, startSample, sampleRate, 0.6, random)
    }

    // Hi-hat on every eighth note
    if (beat * 2 < totalBeats * 2) {
      synthesizeHiHat(left, right, startSample, sampleRate, 0.3, random)
      synthesizeHiHat(left, right, startSample + samplesPerBeat / 2, sampleRate, 0.2, random)
    }
  }
}

/**
 * Generate bass pattern - root note on beat 1
 */
function generateBassPattern(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  bpm: number,
  bars: number,
  key: string,
  _random: () => number
): void {
  const samplesPerBeat = Math.floor((60 / bpm) * sampleRate)
  const frequency = getKeyFrequency(key, -12) // One octave below middle
  const totalBeats = bars * 4

  for (let beat = 0; beat < totalBeats; beat++) {
    const startSample = beat * samplesPerBeat
    const duration = samplesPerBeat * 0.8 // 80% note duration

    // Simple sawtooth wave
    for (let i = 0; i < duration && startSample + i < left.length; i++) {
      const t = i / sampleRate
      const phase = (t * frequency) % 1.0
      const value = (phase - 0.5) * 0.5 // Sawtooth -0.25 to 0.25

      const leftSample = left[startSample + i]
      const rightSample = right[startSample + i]
      if (leftSample !== undefined) left[startSample + i] = leftSample + value
      if (rightSample !== undefined) right[startSample + i] = rightSample + value
    }
  }
}

/**
 * Generate harmonic pattern - chord tones
 */
function generateHarmonicPattern(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  bpm: number,
  bars: number,
  key: string,
  _random: () => number
): void {
  const samplesPerBar = Math.floor((240 / bpm) * sampleRate) // 4 beats per bar
  const rootFreq = getKeyFrequency(key, 0)

  // Simple triad (root, major third, perfect fifth)
  const frequencies = [rootFreq, rootFreq * 1.26, rootFreq * 1.5]

  for (let bar = 0; bar < bars; bar++) {
    const startSample = bar * samplesPerBar
    const duration = samplesPerBar

    for (const freq of frequencies) {
      for (let i = 0; i < duration && startSample + i < left.length; i++) {
        const t = i / sampleRate
        const value = Math.sin(2 * Math.PI * freq * t) * 0.15

        const leftSample = left[startSample + i]
        const rightSample = right[startSample + i]
        if (leftSample !== undefined) left[startSample + i] = leftSample + value
        if (rightSample !== undefined) right[startSample + i] = rightSample + value
      }
    }
  }
}

/**
 * Generate simple click pattern on each beat
 */
function generateClickPattern(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  bpm: number,
  bars: number
): void {
  const samplesPerBeat = Math.floor((60 / bpm) * sampleRate)
  const totalBeats = bars * 4

  for (let beat = 0; beat < totalBeats; beat++) {
    const startSample = beat * samplesPerBeat
    const clickDuration = Math.floor(sampleRate * 0.001) // 1ms click

    for (let i = 0; i < clickDuration && startSample + i < left.length; i++) {
      const value = 0.5 * (1 - i / clickDuration) // Decay
      left[startSample + i] = value
      right[startSample + i] = value
    }
  }
}

// Drum synthesis helpers
function synthesizeKick(
  left: Float32Array,
  right: Float32Array,
  start: number,
  sampleRate: number,
  amplitude: number
): void {
  const duration = Math.floor(sampleRate * 0.15) // 150ms
  const startFreq = 150
  const endFreq = 40

  for (let i = 0; i < duration && start + i < left.length; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t * 15) // Exponential decay
    const freq = startFreq + (endFreq - startFreq) * (i / duration)
    const value = Math.sin(2 * Math.PI * freq * t) * envelope * amplitude

    const leftSample = left[start + i]
    const rightSample = right[start + i]
    if (leftSample !== undefined) left[start + i] = leftSample + value
    if (rightSample !== undefined) right[start + i] = rightSample + value
  }
}

function synthesizeSnare(
  left: Float32Array,
  right: Float32Array,
  start: number,
  sampleRate: number,
  amplitude: number,
  random: () => number
): void {
  const duration = Math.floor(sampleRate * 0.1) // 100ms

  for (let i = 0; i < duration && start + i < left.length; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t * 20)
    const noise = (random() * 2 - 1) * envelope * amplitude

    const leftSample = left[start + i]
    const rightSample = right[start + i]
    if (leftSample !== undefined) left[start + i] = leftSample + noise
    if (rightSample !== undefined) right[start + i] = rightSample + noise
  }
}

function synthesizeHiHat(
  left: Float32Array,
  right: Float32Array,
  start: number,
  sampleRate: number,
  amplitude: number,
  random: () => number
): void {
  const duration = Math.floor(sampleRate * 0.05) // 50ms

  for (let i = 0; i < duration && start + i < left.length; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t * 40)
    const noise = (random() * 2 - 1) * envelope * amplitude * 0.5

    const leftSample = left[start + i]
    const rightSample = right[start + i]
    if (leftSample !== undefined) left[start + i] = leftSample + noise
    if (rightSample !== undefined) right[start + i] = rightSample + noise
  }
}

/**
 * Get frequency for a musical key
 * Offset: 0 = middle octave, -12 = one octave down, +12 = one octave up
 */
function getKeyFrequency(key: string, offset: number = 0): number {
  const baseFrequencies: Record<string, number> = {
    C: 261.63,
    'C#': 277.18,
    Db: 277.18,
    D: 293.66,
    'D#': 311.13,
    Eb: 311.13,
    E: 329.63,
    F: 349.23,
    'F#': 369.99,
    Gb: 369.99,
    G: 392.0,
    'G#': 415.3,
    Ab: 415.3,
    A: 440.0,
    'A#': 466.16,
    Bb: 466.16,
    B: 493.88,
  }

  const rootKey = key.split(' ')[0] || 'C'
  const baseFreq = baseFrequencies[rootKey] || 440.0

  // Apply octave offset
  const multiplier = Math.pow(2, offset / 12)
  return baseFreq * multiplier
}

/**
 * Convert AudioBuffer to WAV file bytes
 */
export function encodeWAV(buffer: AudioBuffer): Buffer {
  const { sampleRate, channels, length, data } = buffer

  const bytesPerSample = 2 // 16-bit PCM
  const blockAlign = channels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = length * blockAlign
  const fileSize = 44 + dataSize // WAV header is 44 bytes

  const wav = Buffer.alloc(fileSize)
  let offset = 0

  // RIFF header
  wav.write('RIFF', offset)
  offset += 4
  wav.writeUInt32LE(fileSize - 8, offset)
  offset += 4
  wav.write('WAVE', offset)
  offset += 4

  // fmt chunk
  wav.write('fmt ', offset)
  offset += 4
  wav.writeUInt32LE(16, offset)
  offset += 4 // Chunk size
  wav.writeUInt16LE(1, offset)
  offset += 2 // Audio format (PCM)
  wav.writeUInt16LE(channels, offset)
  offset += 2
  wav.writeUInt32LE(sampleRate, offset)
  offset += 4
  wav.writeUInt32LE(byteRate, offset)
  offset += 4
  wav.writeUInt16LE(blockAlign, offset)
  offset += 2
  wav.writeUInt16LE(16, offset)
  offset += 2 // Bits per sample

  // data chunk
  wav.write('data', offset)
  offset += 4
  wav.writeUInt32LE(dataSize, offset)
  offset += 4

  // Write interleaved PCM data
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const channelData = data[ch]
      const sampleValue = channelData?.[i] ?? 0
      const sample = Math.max(-1, Math.min(1, sampleValue))
      const pcm = Math.floor(sample * 32767)
      wav.writeInt16LE(pcm, offset)
      offset += 2
    }
  }

  return wav
}
