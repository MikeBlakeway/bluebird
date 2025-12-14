/**
 * React Hook for Audio Engine
 *
 * Provides a declarative way to use the WebAudio engine in React components
 * with automatic lifecycle management and state synchronization.
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { AudioEngine, type PlaybackState, type Track } from '@/lib/audio-engine'

export interface UseAudioEngineOptions {
  sampleRate?: number
  onError?: (error: Error) => void
}

export interface UseAudioEngineReturn {
  // State
  playbackState: PlaybackState
  currentTime: number
  duration: number
  tracks: Track[]
  isInitialized: boolean

  // Playback controls
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  seek: (time: number) => Promise<void>

  // Track management
  addTrack: (id: string, name: string, url: string) => Promise<void>
  removeTrack: (id: string) => void

  // Gain controls
  setTrackGain: (id: string, gain: number) => void
  setMasterGain: (gain: number) => void
  setTrackMuted: (id: string, muted: boolean) => void
  setTrackSoloed: (id: string, soloed: boolean) => void

  // Engine reference (for advanced usage)
  engine: AudioEngine | null
}

export function useAudioEngine(options: UseAudioEngineOptions = {}): UseAudioEngineReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [tracks, setTracks] = useState<Track[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const engineRef = useRef<AudioEngine | null>(null)
  const isMountedRef = useRef(true)

  // Initialize audio engine
  useEffect(() => {
    isMountedRef.current = true

    const engine = new AudioEngine({
      sampleRate: options.sampleRate,
      onStateChange: (state) => {
        if (isMountedRef.current) {
          setPlaybackState(state)
        }
      },
      onTimeUpdate: (time) => {
        if (isMountedRef.current) {
          setCurrentTime(time)
        }
      },
      onTrackStateChange: () => {
        if (isMountedRef.current && engineRef.current) {
          setTracks(engineRef.current.getTracks())
          setDuration(engineRef.current.getDuration())
        }
      },
      onError: options.onError,
    })

    engineRef.current = engine

    // Initialize the engine
    engine
      .initialize()
      .then(() => {
        if (isMountedRef.current) {
          setIsInitialized(true)
        }
      })
      .catch((error) => {
        console.error('Failed to initialize audio engine:', error)
        options.onError?.(error)
      })

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false
      engine.dispose()
      engineRef.current = null
    }
  }, [options.sampleRate]) // Re-initialize if sample rate changes

  // Playback controls
  const play = useCallback(async () => {
    if (!engineRef.current) return
    await engineRef.current.play()
  }, [])

  const pause = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.pause()
  }, [])

  const stop = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.stop()
  }, [])

  const seek = useCallback(async (time: number) => {
    if (!engineRef.current) return
    await engineRef.current.seek(time)
  }, [])

  // Track management
  const addTrack = useCallback(async (id: string, name: string, url: string) => {
    if (!engineRef.current) return

    await engineRef.current.addTrack(id, name, url)

    // Update state
    if (isMountedRef.current) {
      setTracks(engineRef.current.getTracks())
      setDuration(engineRef.current.getDuration())
    }
  }, [])

  const removeTrack = useCallback((id: string) => {
    if (!engineRef.current) return

    engineRef.current.removeTrack(id)

    // Update state
    if (isMountedRef.current) {
      setTracks(engineRef.current.getTracks())
      setDuration(engineRef.current.getDuration())
    }
  }, [])

  // Gain controls
  const setTrackGain = useCallback((id: string, gain: number) => {
    if (!engineRef.current) return
    engineRef.current.setTrackGain(id, gain)

    // Update state
    if (isMountedRef.current) {
      setTracks(engineRef.current.getTracks())
    }
  }, [])

  const setMasterGain = useCallback((gain: number) => {
    if (!engineRef.current) return
    engineRef.current.setMasterGain(gain)
  }, [])

  const setTrackMuted = useCallback((id: string, muted: boolean) => {
    if (!engineRef.current) return
    engineRef.current.setTrackMuted(id, muted)

    // Update state
    if (isMountedRef.current) {
      setTracks(engineRef.current.getTracks())
    }
  }, [])

  const setTrackSoloed = useCallback((id: string, soloed: boolean) => {
    if (!engineRef.current) return
    engineRef.current.setTrackSoloed(id, soloed)

    // Update state
    if (isMountedRef.current) {
      setTracks(engineRef.current.getTracks())
    }
  }, [])

  return {
    // State
    playbackState,
    currentTime,
    duration,
    tracks,
    isInitialized,

    // Controls
    play,
    pause,
    stop,
    seek,

    // Track management
    addTrack,
    removeTrack,

    // Gain controls
    setTrackGain,
    setMasterGain,
    setTrackMuted,
    setTrackSoloed,

    // Engine reference
    engine: engineRef.current,
  }
}
