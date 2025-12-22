/**
 * Tests for WebAudio Engine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Mock } from 'vitest'
import { AudioEngine } from './audio-engine'

// Mock AudioContext and related APIs
class MockAudioBuffer {
  duration: number
  sampleRate: number
  numberOfChannels: number
  length: number
  private data: Float32Array[]

  constructor(duration: number, data?: Float32Array[], sampleRate = 48000) {
    this.duration = duration
    this.sampleRate = sampleRate
    this.data = data ?? [new Float32Array(480).fill(0)]
    this.length = this.data[0]?.length ?? 0
    this.numberOfChannels = this.data.length
  }

  getChannelData(channel: number): Float32Array {
    return this.data[channel] ?? new Float32Array()
  }
}

class MockGainNode {
  gain = {
    value: 1.0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  }
  connect = vi.fn()
  disconnect = vi.fn()
}

class MockAudioBufferSourceNode {
  buffer: MockAudioBuffer | null = null
  onended: (() => void) | null = null
  connect = vi.fn()
  disconnect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  sampleRate = 48000

  createGain = vi.fn(() => new MockGainNode())
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode())
  decodeAudioData = vi.fn(async () => new MockAudioBuffer(10)) // 10 second duration
  resume = vi.fn(async () => {
    this.state = 'running'
  })
  close = vi.fn(async () => {
    this.state = 'closed'
  })
}

describe('AudioEngine', () => {
  let engine: AudioEngine
  let mockAudioContext: MockAudioContext

  beforeEach(() => {
    // Setup mocks
    mockAudioContext = new MockAudioContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.AudioContext = vi.fn(() => mockAudioContext as any)
    global.fetch = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any
    global.requestAnimationFrame = vi.fn((cb) => {
      setTimeout(cb, 16)
      return 1
    })
    global.cancelAnimationFrame = vi.fn()

    engine = new AudioEngine()
  })

  afterEach(() => {
    engine.dispose()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize audio context', async () => {
      await engine.initialize()

      expect(global.AudioContext).toHaveBeenCalledWith({
        sampleRate: 48000,
      })
      expect(mockAudioContext.createGain).toHaveBeenCalled()
    })

    it('should not re-initialize if already initialized', async () => {
      await engine.initialize()
      await engine.initialize()

      expect(global.AudioContext).toHaveBeenCalledTimes(1)
    })

    it('should call onError if initialization fails', async () => {
      const onError = vi.fn()
      global.AudioContext = vi.fn(() => {
        throw new Error('AudioContext not supported')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any

      const failingEngine = new AudioEngine({ onError })

      await expect(failingEngine.initialize()).rejects.toThrow('AudioContext not supported')
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('Track Management', () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it('should add a track successfully', async () => {
      const onTrackStateChange = vi.fn()
      engine = new AudioEngine({ onTrackStateChange })
      await engine.initialize()

      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      const tracks = engine.getTracks()
      expect(tracks).toHaveLength(1)
      expect(tracks[0]?.id).toBe('track1')
      expect(tracks[0]?.name).toBe('Track 1')
      expect(tracks[0]?.state).toBe('ready')
      expect(onTrackStateChange).toHaveBeenCalledWith('track1', 'loading')
      expect(onTrackStateChange).toHaveBeenCalledWith('track1', 'ready')
    })

    it('should handle track loading errors', async () => {
      const onError = vi.fn()
      const onTrackStateChange = vi.fn()
      engine = new AudioEngine({ onError, onTrackStateChange })
      await engine.initialize()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      global.fetch = vi.fn(async () => {
        throw new Error('Network error')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any

      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      const track = engine.getTrack('track1')
      expect(track?.state).toBe('error')
      expect(track?.error).toBe('Network error')
      expect(onError).toHaveBeenCalled()
      expect(onTrackStateChange).toHaveBeenCalledWith('track1', 'error')
    })

    it('should compute peaks for a loaded track', async () => {
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      const track = engine.getTrack('track1')
      expect(track?.peaks?.length).toBeGreaterThan(0)
    })

    it('should remove a track', async () => {
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
      expect(engine.getTracks()).toHaveLength(1)

      engine.removeTrack('track1')

      expect(engine.getTracks()).toHaveLength(0)
      expect(engine.getTrack('track1')).toBeUndefined()
    })

    it('should handle removing non-existent track', () => {
      expect(() => engine.removeTrack('nonexistent')).not.toThrow()
    })
  })

  describe('Playback Control', () => {
    beforeEach(async () => {
      await engine.initialize()
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    it('should play tracks', async () => {
      const onStateChange = vi.fn()
      engine = new AudioEngine({ onStateChange })
      await engine.initialize()
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      await engine.play()

      expect(engine.getPlaybackState()).toBe('playing')
      expect(onStateChange).toHaveBeenCalledWith('playing')
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled()
    })

    it('should pause playback', async () => {
      const onStateChange = vi.fn()
      engine = new AudioEngine({ onStateChange })
      await engine.initialize()
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      await engine.play()
      engine.pause()

      expect(engine.getPlaybackState()).toBe('paused')
      expect(onStateChange).toHaveBeenCalledWith('paused')
    })

    it('should stop playback and reset', async () => {
      const onStateChange = vi.fn()
      const onTimeUpdate = vi.fn()
      engine = new AudioEngine({ onStateChange, onTimeUpdate })
      await engine.initialize()
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      await engine.play()
      engine.stop()

      expect(engine.getPlaybackState()).toBe('stopped')
      expect(engine.getCurrentTime()).toBe(0)
      expect(onStateChange).toHaveBeenCalledWith('stopped')
      expect(onTimeUpdate).toHaveBeenCalledWith(0)
    })

    it('should seek to specific time', async () => {
      await engine.seek(5)

      expect(engine.getCurrentTime()).toBe(5)
    })

    it('should resume from paused position', async () => {
      mockAudioContext.currentTime = 0
      await engine.play()

      mockAudioContext.currentTime = 5
      engine.pause()

      mockAudioContext.currentTime = 5
      await engine.play()

      // Should start from paused position
      const track = engine.getTrack('track1')
      const startArgs = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (track?.sourceNode as any)?.start.mock.calls[0]
      const expectedOffset = 5 - 512 / 48000
      expect(startArgs?.[1]).toBeCloseTo(expectedOffset, 3)
    })

    it('should apply pre-roll ramping', async () => {
      engine = new AudioEngine({ preRollSamples: 4800 })
      await engine.initialize()
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      await engine.seek(2)
      await engine.play()

      const track = engine.getTrack('track1')
      const gain = (track?.gainNode as unknown as MockGainNode).gain

      expect(gain.setValueAtTime).toHaveBeenCalledWith(0, 0)
      expect(gain.linearRampToValueAtTime).toHaveBeenCalled()

      const startArgs = (track?.sourceNode as unknown as MockAudioBufferSourceNode).start.mock
        .calls[0]
      expect(startArgs?.[1]).toBeCloseTo(2 - 4800 / 48000, 3)
    })
  })

  describe('Gain Controls', () => {
    beforeEach(async () => {
      await engine.initialize()
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    it('should set track gain', () => {
      engine.setTrackGain('track1', 0.5)

      const track = engine.getTrack('track1')
      expect(track?.gain).toBe(0.5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((track?.gainNode as any)?.gain.value).toBe(0.5)
    })

    it('should clamp gain values to 0-1', () => {
      engine.setTrackGain('track1', -0.5)
      let track = engine.getTrack('track1')
      expect(track?.gain).toBe(0)

      engine.setTrackGain('track1', 1.5)
      track = engine.getTrack('track1')
      expect(track?.gain).toBe(1)
    })

    it('should set master gain', () => {
      engine.setMasterGain(0.75)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((engine as any).masterGainNode.gain.value).toBe(0.75)
    })

    it('should mute a track', () => {
      engine.setTrackMuted('track1', true)

      const track = engine.getTrack('track1')
      expect(track?.muted).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((track?.gainNode as any)?.gain.value).toBe(0)
    })

    it('should unmute a track', () => {
      engine.setTrackGain('track1', 0.5)
      engine.setTrackMuted('track1', true)
      engine.setTrackMuted('track1', false)

      const track = engine.getTrack('track1')
      expect(track?.muted).toBe(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((track?.gainNode as any)?.gain.value).toBe(0.5)
    })

    it('should solo a track', async () => {
      await engine.addTrack('track2', 'Track 2', 'http://example.com/track2.mp3')

      engine.setTrackSoloed('track1', true)

      const track1 = engine.getTrack('track1')
      const track2 = engine.getTrack('track2')

      expect(track1?.soloed).toBe(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((track1?.gainNode as any)?.gain.value).toBe(1) // Soloed track plays
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((track2?.gainNode as any)?.gain.value).toBe(0) // Other tracks muted
    })

    it('should unsolo a track', async () => {
      await engine.addTrack('track2', 'Track 2', 'http://example.com/track2.mp3')

      engine.setTrackSoloed('track1', true)
      engine.setTrackSoloed('track1', false)

      const track1 = engine.getTrack('track1')
      const track2 = engine.getTrack('track2')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((track1?.gainNode as any)?.gain.value).toBe(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((track2?.gainNode as any)?.gain.value).toBe(1)
    })
  })

  describe('Utility Methods', () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it('should get duration of longest track', async () => {
      mockAudioContext.decodeAudioData = vi
        .fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValueOnce(new MockAudioBuffer(10) as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValueOnce(new MockAudioBuffer(15) as any)

      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
      await engine.addTrack('track2', 'Track 2', 'http://example.com/track2.mp3')

      expect(engine.getDuration()).toBe(15)
    })

    it('should return 0 duration when no tracks', () => {
      expect(engine.getDuration()).toBe(0)
    })

    it('should get current time during playback', async () => {
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      mockAudioContext.currentTime = 0
      await engine.play()

      mockAudioContext.currentTime = 3
      expect(engine.getCurrentTime()).toBeCloseTo(3, 1)
    })

    it('should return 0 when stopped', () => {
      expect(engine.getCurrentTime()).toBe(0)
    })
  })

  describe('Versions', () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it('switches between A/B versions using cached buffers', async () => {
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1-a.mp3', 'A')
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1-b.mp3', 'B')

      await engine.setActiveVersion('B')

      const track = engine.getTrack('track1')
      expect(track?.activeVersion).toBe('B')
      expect(track?.state).toBe('ready')
      expect(global.fetch as Mock).toHaveBeenCalledTimes(2)
    })

    it('switches a single track version without changing global version', async () => {
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1-a.mp3', 'A')
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1-b.mp3', 'B')
      await engine.addTrack('track2', 'Track 2', 'http://example.com/track2-a.mp3', 'A')

      expect(engine.getActiveVersion()).toBe('A')

      await engine.setTrackActiveVersion('track1', 'B')

      const track1 = engine.getTrack('track1')
      const track2 = engine.getTrack('track2')
      expect(track1?.activeVersion).toBe('B')
      expect(track2?.activeVersion).toBe('A')
      expect(engine.getActiveVersion()).toBe('A')
    })
  })

  describe('Cleanup', () => {
    it('should dispose of all resources', async () => {
      await engine.initialize()
      await engine.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')

      engine.dispose()

      expect(engine.getTracks()).toHaveLength(0)
      expect(mockAudioContext.close).toHaveBeenCalled()
    })

    it('should handle dispose when not initialized', () => {
      expect(() => engine.dispose()).not.toThrow()
    })
  })
})
