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
    const buffer = new SimpleAudioBuffer([samples]) as unknown as AudioBuffer

    const peaks = extractPeaks(buffer, 3)

    expect(peaks).toHaveLength(3)
    expect(peaks[0]).toEqual({ min: -0.2, max: 0.1 })
    expect(peaks[1]).toEqual({ min: -0.4, max: 0.5 })
    expect(peaks[2]).toEqual({ min: 0.2, max: 0.6 })
  })
})
