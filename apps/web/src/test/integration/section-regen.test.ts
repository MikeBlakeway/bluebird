import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { useRegenSection } from '@/hooks/use-regen-section'
import { useAudioEngine } from '@/hooks/use-audio-engine'

// Mock Bluebird client for section regeneration
const renderSectionMock = vi.fn(async () => ({ jobId: 'regen-job-1' }))

vi.mock('@/hooks/use-client', () => ({
  useClient: () => ({
    renderSection: renderSectionMock,
  }),
}))

// hoisted audio mocks so vi.mock can reference them safely
const audioMocks = vi.hoisted(() => ({
  playMock: vi.fn(async () => {}),
  pauseMock: vi.fn(() => {}),
  stopMock: vi.fn(() => {}),
  seekMock: vi.fn(async () => {}),
}))

vi.mock('@/lib/audio-engine', () => {
  class MockAudioEngine {
    tracks: Array<{ id: string; name: string; url: string; activeVersion: 'A' | 'B' }> = []
    activeVersion: 'A' | 'B' = 'A'
    onStateChange?: (state: 'playing' | 'paused' | 'stopped') => void
    onTimeUpdate?: (time: number) => void
    onTrackStateChange?: () => void

    constructor(options?: {
      onStateChange?: (state: 'playing' | 'paused' | 'stopped') => void
      onTimeUpdate?: (time: number) => void
      onTrackStateChange?: () => void
    }) {
      this.onStateChange = options?.onStateChange
      this.onTimeUpdate = options?.onTimeUpdate
      this.onTrackStateChange = options?.onTrackStateChange
    }

    async initialize() {
      this.onStateChange?.('stopped')
    }

    dispose() {
      this.tracks = []
    }

    async play() {
      this.onStateChange?.('playing')
      await audioMocks.playMock()
    }

    pause() {
      this.onStateChange?.('paused')
      audioMocks.pauseMock()
    }

    stop() {
      this.onStateChange?.('stopped')
      audioMocks.stopMock()
    }

    async seek(time: number) {
      this.onTimeUpdate?.(time)
      await audioMocks.seekMock()
    }

    async addTrack(id: string, name: string, url: string, version: 'A' | 'B' = 'A') {
      this.tracks.push({ id, name, url, activeVersion: version })
      this.onTrackStateChange?.()
    }

    removeTrack(id: string) {
      this.tracks = this.tracks.filter((track) => track.id !== id)
      this.onTrackStateChange?.()
    }

    setTrackGain(_id: string, _gain: number) {
      // no-op for mock
    }

    setMasterGain(_gain: number) {
      // no-op for mock
    }

    setTrackMuted(_id: string, _muted: boolean) {
      // no-op for mock
    }

    setTrackSoloed(_id: string, _soloed: boolean) {
      // no-op for mock
    }

    async setActiveVersion(version: 'A' | 'B') {
      this.activeVersion = version
      this.onTrackStateChange?.()
    }

    async setTrackActiveVersion(trackId: string, version: 'A' | 'B') {
      const track = this.tracks.find((t) => t.id === trackId)
      if (track) {
        track.activeVersion = version
      }
      this.onTrackStateChange?.()
    }

    getTracks() {
      return this.tracks
    }

    getDuration() {
      return this.tracks.length > 0 ? 30 : 0
    }

    getActiveVersion() {
      return this.activeVersion
    }
  }

  return { AudioEngine: MockAudioEngine }
})

beforeEach(() => {
  renderSectionMock.mockClear()
  audioMocks.playMock.mockClear()
  audioMocks.pauseMock.mockClear()
  audioMocks.stopMock.mockClear()
  audioMocks.seekMock.mockClear()
})

describe('section regeneration integration', () => {
  it('regenerates a section and marks version B after completion', async () => {
    const { result } = renderHook(() => {
      const versionsRef = useRef(new Map<number, 'A' | 'B'>())

      const regen = useRegenSection({
        projectId: 'proj-1',
        takeId: 'take-1',
        planId: 'plan-1',
        onSuccess: (jobId) => {
          expect(jobId).toBe('regen-job-1')
        },
      })

      const handleJobEvent = (event: { stage: string; sectionIdx: number }) => {
        if (event.stage === 'completed') {
          regen.clearRegenerating()
          versionsRef.current.set(event.sectionIdx, 'B')
        }
      }

      return {
        regen,
        versions: versionsRef.current,
        handleJobEvent,
      }
    })

    await act(async () => {
      await result.current.regen.regenerateSection(1)
    })

    expect(renderSectionMock).toHaveBeenCalledWith({
      projectId: 'proj-1',
      planId: 'plan-1',
      sectionId: 'section-1',
      regen: true,
    })

    expect(result.current.regen.isRegenerating(1)).toBe(true)

    act(() => {
      result.current.handleJobEvent({ stage: 'completed', sectionIdx: 1 })
    })

    expect(result.current.regen.isRegenerating(1)).toBe(false)
    expect(result.current.versions.get(1)).toBe('B')
  })

  it('drives WebAudio graph interactions (load → play/pause → A/B switch)', async () => {
    const { result } = renderHook(() => useAudioEngine())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await result.current.addTrack('track-1', 'Intro', 'https://cdn.local/intro-A.wav', 'A')
    })

    expect(result.current.tracks).toHaveLength(1)
    expect(result.current.tracks[0]?.activeVersion).toBe('A')

    await act(async () => {
      await result.current.setTrackActiveVersion('track-1', 'B')
    })

    expect(result.current.tracks[0]?.activeVersion).toBe('B')

    await act(async () => {
      await result.current.play()
    })

    expect(audioMocks.playMock).toHaveBeenCalled()

    act(() => {
      result.current.pause()
    })
    expect(audioMocks.pauseMock).toHaveBeenCalled()

    await act(async () => {
      await result.current.setActiveVersion('A')
    })

    expect(result.current.activeVersion).toBe('A')

    act(() => {
      result.current.stop()
    })
    expect(audioMocks.stopMock).toHaveBeenCalled()
  })
})
