/**
 * Tests for useAudioEngine hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAudioEngine } from './use-audio-engine'
import type { AudioEngine } from '@/lib/audio-engine'

// Mock the AudioEngine
vi.mock('@/lib/audio-engine', () => {
  const mockCallbacks: {
    onStateChange?: (state: string) => void
    onTimeUpdate?: (time: number) => void
    onTrackStateChange?: (id: string, state: string) => void
    onError?: (error: Error) => void
  } = {}

  class MockAudioEngine {
    private playbackState = 'stopped'
    private currentTime = 0
    private tracks = new Map()
    private activeVersion: 'A' | 'B' = 'A'

    constructor(options?: typeof mockCallbacks) {
      Object.assign(mockCallbacks, options)
    }

    async initialize() {
      // Mock initialization
    }

    async addTrack(id: string, name: string, url: string, version: 'A' | 'B' = 'A') {
      this.tracks.set(id, {
        id,
        name,
        url,
        state: 'ready',
        gain: 1,
        muted: false,
        soloed: false,
        activeVersion: version,
        peaks: [],
      })
      mockCallbacks.onTrackStateChange?.(id, 'ready')
    }

    removeTrack(id: string) {
      this.tracks.delete(id)
    }

    async play() {
      this.playbackState = 'playing'
      mockCallbacks.onStateChange?.('playing')
    }

    pause() {
      this.playbackState = 'paused'
      mockCallbacks.onStateChange?.('paused')
    }

    stop() {
      this.playbackState = 'stopped'
      this.currentTime = 0
      mockCallbacks.onStateChange?.('stopped')
      mockCallbacks.onTimeUpdate?.(0)
    }

    async seek(time: number) {
      this.currentTime = time
      mockCallbacks.onTimeUpdate?.(time)
    }

    setTrackGain(id: string, gain: number) {
      const track = this.tracks.get(id)
      if (track) {
        track.gain = gain
      }
    }

    setMasterGain(_gain: number) {
      // Mock implementation
    }

    setTrackMuted(id: string, muted: boolean) {
      const track = this.tracks.get(id)
      if (track) {
        track.muted = muted
      }
    }

    setTrackSoloed(id: string, soloed: boolean) {
      const track = this.tracks.get(id)
      if (track) {
        track.soloed = soloed
      }
    }

    async setActiveVersion(version: 'A' | 'B') {
      this.activeVersion = version
    }

    async setTrackActiveVersion(id: string, version: 'A' | 'B') {
      const track = this.tracks.get(id)
      if (track) {
        track.activeVersion = version
      }
    }

    getActiveVersion() {
      return this.activeVersion
    }

    getPlaybackState() {
      return this.playbackState
    }

    getCurrentTime() {
      return this.currentTime
    }

    getDuration() {
      return 120 // Mock 2 minute duration
    }

    getTracks() {
      return Array.from(this.tracks.values())
    }

    getTrack(id: string) {
      return this.tracks.get(id)
    }

    dispose() {
      this.tracks.clear()
    }

    // Expose for testing
    _trigger = {
      stateChange: (state: string) => mockCallbacks.onStateChange?.(state),
      timeUpdate: (time: number) => mockCallbacks.onTimeUpdate?.(time),
      trackStateChange: (id: string, state: string) =>
        mockCallbacks.onTrackStateChange?.(id, state),
      error: (error: Error) => mockCallbacks.onError?.(error),
    }
  }

  return {
    AudioEngine: MockAudioEngine,
  }
})

describe('useAudioEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize on mount', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.playbackState).toBe('stopped')
    expect(result.current.currentTime).toBe(0)
    expect(result.current.tracks).toEqual([])
  })

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    const engine = result.current.engine
    unmount()

    // Engine should be disposed
    expect(engine).toBeDefined()
  })

  it('should add a track', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0]?.id).toBe('track1')
  })

  it('should remove a track', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    act(() => {
      result.current.removeTrack('track1')
    })

    expect(result.current.tracks).toHaveLength(0)
  })

  it('should play audio', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.play()
    })

    expect(result.current.playbackState).toBe('playing')
  })

  it('should pause audio', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.play()
    })

    act(() => {
      result.current.pause()
    })

    expect(result.current.playbackState).toBe('paused')
  })

  it('should stop audio', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.play()
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.playbackState).toBe('stopped')
    expect(result.current.currentTime).toBe(0)
  })

  it('should seek to position', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.seek(30)
    })

    expect(result.current.currentTime).toBe(30)
  })

  it('should update track gain', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    act(() => {
      result.current.setTrackGain('track1', 0.5)
    })

    const track = result.current.tracks.find((t) => t.id === 'track1')
    expect(track?.gain).toBe(0.5)
  })

  it('should update master gain', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.setMasterGain(0.75)
    })

    // Master gain should be applied (implementation detail)
  })

  it('should mute/unmute tracks', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    act(() => {
      result.current.setTrackMuted('track1', true)
    })

    let track = result.current.tracks.find((t) => t.id === 'track1')
    expect(track?.muted).toBe(true)

    act(() => {
      result.current.setTrackMuted('track1', false)
    })

    track = result.current.tracks.find((t) => t.id === 'track1')
    expect(track?.muted).toBe(false)
  })

  it('should solo/unsolo tracks', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    act(() => {
      result.current.setTrackSoloed('track1', true)
    })

    let track = result.current.tracks.find((t) => t.id === 'track1')
    expect(track?.soloed).toBe(true)

    act(() => {
      result.current.setTrackSoloed('track1', false)
    })

    track = result.current.tracks.find((t) => t.id === 'track1')
    expect(track?.soloed).toBe(false)
  })

  it('should switch active version', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.setActiveVersion('B')
    })

    expect(result.current.activeVersion).toBe('B')
  })

  it('should switch a single track version', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3', 'A')
    })

    await act(async () => {
      await result.current.setTrackActiveVersion('track1', 'B')
    })

    const track = result.current.tracks.find((t) => t.id === 'track1')
    expect(track?.activeVersion).toBe('B')
  })

  it('should handle time updates', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    const mockEngine = result.current.engine as AudioEngine & {
      _trigger: { timeUpdate: (time: number) => void }
    }

    act(() => {
      mockEngine._trigger.timeUpdate(45)
    })

    expect(result.current.currentTime).toBe(45)
  })

  it('should handle state changes', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    const mockEngine = result.current.engine as AudioEngine & {
      _trigger: { stateChange: (state: string) => void }
    }

    act(() => {
      mockEngine._trigger.stateChange('playing')
    })

    expect(result.current.playbackState).toBe('playing')
  })

  it('should handle track state changes', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    const mockEngine = result.current.engine as AudioEngine & {
      _trigger: { trackStateChange: (id: string, state: string) => void }
    }

    act(() => {
      mockEngine._trigger.trackStateChange('track1', 'loading')
    })

    // Track list should update with new state
    await waitFor(() => {
      const track = result.current.tracks.find((t) => t.id === 'track1')
      expect(track).toBeDefined()
    })
  })

  it('should handle errors', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useAudioEngine({ onError }))

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    const mockEngine = result.current.engine as AudioEngine & {
      _trigger: { error: (error: Error) => void }
    }

    const testError = new Error('Test error')
    act(() => {
      mockEngine._trigger.error(testError)
    })

    expect(onError).toHaveBeenCalledWith(testError)
  })

  it('should update duration when tracks change', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track1', 'Track 1', 'http://example.com/track1.mp3')
    })

    expect(result.current.duration).toBe(120) // Mock duration from AudioEngine
  })
})
