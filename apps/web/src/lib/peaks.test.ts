import { describe, it, expect } from 'vitest'
import { extractPeaks } from './peaks'

class SimpleAudioBuffer {
  length: number
  numberOfChannels: number
  sampleRate: number
  private channelData: Float32Array[]

  constructor(samples: Float32Array[], sampleRate = 48000) {
    this.channelData = samples
    this.length = samples[0]?.length ?? 0
    this.numberOfChannels = samples.length
    this.sampleRate = sampleRate
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel] ?? new Float32Array()
  }
}

describe('extractPeaks', () => {
  it('computes min/max peaks per window', () => {
    const samples = new Float32Array([0.1, -0.2, 0.5, -0.4, 0.2, 0.6])
    const buffer = new SimpleAudioBuffer([samples], 2) as unknown as AudioBuffer

    // With 6 samples at 2 Hz sampleRate and 1 peak/sec = 2 samples per peak
    const peaks = extractPeaks(buffer, 1)

    expect(peaks).toHaveLength(3)
    expect(peaks[0]).toEqual({
      min: expect.closeTo(-0.2, 5),
      max: expect.closeTo(0.1, 5),
    })
    expect(peaks[1]).toEqual({
      min: expect.closeTo(-0.4, 5),
      max: expect.closeTo(0.5, 5),
    })
    expect(peaks[2]).toEqual({
      min: expect.closeTo(0.2, 5),
      max: expect.closeTo(0.6, 5),
    })
  })
})
