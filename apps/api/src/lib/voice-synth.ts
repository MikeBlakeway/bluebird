/**
 * Voice Synthesis Stub (Sprint 1)
 *
 * Generates placeholder vocal audio aligned to syllables.
 * Stub implementation uses sine tones at lyric syllable positions.
 *
 * TODO (Sprint 2+): Replace with real TTS/singing voice models
 */

import type { AudioBuffer } from './music-synth.js'

export interface VoiceSynthOptions {
  lyrics: string
  bpm: number
  bars: number
  key: string
  seed: number
}

/**
 * Simple syllable counter (approximation)
 */
function countSyllables(text: string): number {
  const word = text.toLowerCase().trim()
  if (word.length <= 3) return 1

  // Vowel groups approximate syllables
  const vowels = word.match(/[aeiouy]+/g)
  let count = vowels ? vowels.length : 1

  // Adjust for silent e
  if (word.endsWith('e')) count--
  if (word.endsWith('le') && word.length > 2) count++

  return Math.max(1, count)
}

/**
 * Generate vocal audio for a section with lyrics
 */
export async function synthesizeVoice(options: VoiceSynthOptions): Promise<AudioBuffer> {
  const { lyrics, bpm, bars, key, seed } = options

  const sampleRate = 48000
  const beatsPerBar = 4
  const totalBeats = bars * beatsPerBar
  const secondsPerBeat = 60 / bpm
  const durationSeconds = totalBeats * secondsPerBeat
  const totalSamples = Math.floor(durationSeconds * sampleRate)

  const left = new Float32Array(totalSamples)
  const right = new Float32Array(totalSamples)

  // Parse lyrics into words
  const words = lyrics.split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) {
    return { sampleRate, channels: 2, length: totalSamples, data: [left, right] }
  }

  // Distribute words across beats
  const syllables: Array<{ time: number; pitch: number }> = []
  let currentBeat = 0

  for (const word of words) {
    const sylCount = countSyllables(word)
    const basePitch = getVocalPitch(key, seed)

    for (let i = 0; i < sylCount; i++) {
      if (currentBeat >= totalBeats) break

      const beatTime = currentBeat * secondsPerBeat
      const pitchVariation = i % 2 === 0 ? 1.0 : 1.05 // Simple melody
      syllables.push({
        time: beatTime,
        pitch: basePitch * pitchVariation,
      })

      currentBeat += 0.5 // Half beat per syllable
    }

    currentBeat = Math.ceil(currentBeat) // Word boundary
  }

  // Synthesize each syllable as a tone
  for (const syl of syllables) {
    const startSample = Math.floor(syl.time * sampleRate)
    const duration = Math.floor(sampleRate * 0.2) // 200ms per syllable

    for (let i = 0; i < duration && startSample + i < totalSamples; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 8) // Quick decay
      const value = Math.sin(2 * Math.PI * syl.pitch * t) * envelope * 0.4

      const leftSample = left[startSample + i]
      const rightSample = right[startSample + i]
      if (leftSample !== undefined) left[startSample + i] = leftSample + value
      if (rightSample !== undefined) right[startSample + i] = rightSample + value
    }
  }

  return {
    sampleRate,
    channels: 2,
    length: totalSamples,
    data: [left, right],
  }
}

/**
 * Get vocal pitch based on musical key
 */
function getVocalPitch(key: string, seed: number): number {
  const basePitches: Record<string, number> = {
    C: 261.63,
    Db: 277.18,
    D: 293.66,
    Eb: 311.13,
    E: 329.63,
    F: 349.23,
    Gb: 369.99,
    G: 392.0,
    Ab: 415.3,
    A: 440.0,
    Bb: 466.16,
    B: 493.88,
  }

  const rootKey = key.split(' ')[0] || 'C'
  let basePitch = basePitches[rootKey] || 440.0

  // Add seed-based variation (±2 semitones)
  const variation = ((seed % 5) - 2) / 12 // -2 to +2 semitones
  basePitch *= Math.pow(2, variation)

  return basePitch
}
