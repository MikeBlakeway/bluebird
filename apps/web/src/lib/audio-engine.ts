/**
 * WebAudio Preview Engine
 *
 * Provides real-time audio playback with per-track gain controls,
 * mute/solo functionality, and synchronized transport.
 */

import { extractPeaks, type Peak } from './peaks'

export type TrackState = 'loading' | 'ready' | 'error'
export type PlaybackVersion = 'A' | 'B'

interface TrackVersionData {
  url: string
  buffer: AudioBuffer | null
  peaks: Peak[] | null
  state: TrackState
  error?: string
}

export interface Track {
  id: string
  name: string
  url: string
  buffer: AudioBuffer | null
  peaks: Peak[] | null
  gainNode: GainNode | null
  sourceNode: AudioBufferSourceNode | null
  state: TrackState
  error?: string
  gain: number // 0-1
  muted: boolean
  soloed: boolean
  activeVersion: PlaybackVersion
  versions: Record<PlaybackVersion, TrackVersionData>
}

export type PlaybackState = 'stopped' | 'playing' | 'paused'

export interface AudioEngineConfig {
  sampleRate?: number
  preRollSamples?: number
  peaksPerSecond?: number
  activeVersion?: PlaybackVersion
  onStateChange?: (state: PlaybackState) => void
  onTimeUpdate?: (currentTime: number) => void
  onTrackStateChange?: (trackId: string, state: TrackState) => void
  onError?: (error: Error) => void
}

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private masterGainNode: GainNode | null = null
  private tracks: Map<string, Track> = new Map()
  private playbackState: PlaybackState = 'stopped'
  private startTime: number = 0
  private pauseTime: number = 0
  private animationFrameId: number | null = null
  private config: AudioEngineConfig
  private activeVersion: PlaybackVersion

  constructor(config: AudioEngineConfig = {}) {
    this.config = config
    this.activeVersion = config.activeVersion ?? 'A'
  }

  /**
   * Initialize the audio context and master gain node
   */
  async initialize(): Promise<void> {
    if (this.audioContext) {
      return // Already initialized
    }

    try {
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate || 48000,
      })

      this.masterGainNode = this.audioContext.createGain()
      this.masterGainNode.connect(this.audioContext.destination)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.config.onError?.(err)
      throw err
    }
  }

  /**
   * Add a track to the engine
   */
  async addTrack(
    id: string,
    name: string,
    url: string,
    version: PlaybackVersion = 'A'
  ): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioEngine not initialized. Call initialize() first.')
    }

    const track = this.ensureTrack(id, name)
    const versionState = track.versions[version]
    versionState.url = url
    versionState.state = 'loading'
    versionState.error = undefined
    versionState.buffer = null
    versionState.peaks = null

    if (track.activeVersion === version) {
      track.state = 'loading'
      track.error = undefined
      track.buffer = null
      track.peaks = null
      this.config.onTrackStateChange?.(id, 'loading')
    }

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      const peaks = extractPeaks(audioBuffer, this.config.peaksPerSecond)

      versionState.buffer = audioBuffer
      versionState.peaks = peaks
      versionState.state = 'ready'
      versionState.error = undefined

      if (track.activeVersion === version) {
        track.url = url
        track.buffer = audioBuffer
        track.peaks = peaks
        track.state = 'ready'
        track.error = undefined
        this.config.onTrackStateChange?.(id, 'ready')
      }

      // Attach gain node once per track
      if (!track.gainNode) {
        const gainNode = this.audioContext.createGain()
        gainNode.gain.value = track.gain
        if (this.masterGainNode) {
          gainNode.connect(this.masterGainNode)
        }
        track.gainNode = gainNode
        this.refreshTrackGains()
      }
    } catch (error) {
      versionState.state = 'error'
      versionState.error = error instanceof Error ? error.message : String(error)

      if (track.activeVersion === version) {
        track.state = 'error'
        track.error = versionState.error
        this.config.onTrackStateChange?.(id, 'error')
      }

      this.config.onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Remove a track from the engine
   */
  removeTrack(id: string): void {
    const track = this.tracks.get(id)
    if (!track) return

    // Cleanup nodes
    if (track.sourceNode) {
      track.sourceNode.stop()
      track.sourceNode.disconnect()
    }
    if (track.gainNode) {
      track.gainNode.disconnect()
    }

    this.tracks.delete(id)
  }

  /**
   * Set the gain for a specific track (0-1)
   */
  setTrackGain(id: string, gain: number): void {
    const track = this.tracks.get(id)
    if (!track) return

    track.gain = Math.max(0, Math.min(1, gain))
    this.refreshTrackGains()
  }

  /**
   * Set the master gain (0-1)
   */
  setMasterGain(gain: number): void {
    if (!this.masterGainNode) return
    this.masterGainNode.gain.value = Math.max(0, Math.min(1, gain))
  }

  /**
   * Mute/unmute a track
   */
  setTrackMuted(id: string, muted: boolean): void {
    const track = this.tracks.get(id)
    if (!track) return

    track.muted = muted
    this.refreshTrackGains()
  }

  /**
   * Solo a track (mutes all other tracks)
   */
  setTrackSoloed(id: string, soloed: boolean): void {
    const track = this.tracks.get(id)
    if (!track) return

    track.soloed = soloed

    this.refreshTrackGains()
  }

  async setActiveVersion(version: PlaybackVersion): Promise<void> {
    if (this.activeVersion === version) return

    const wasPlaying = this.playbackState === 'playing'
    const position = this.getCurrentTime()

    this.stopAllSources()
    this.playbackState = 'paused'
    this.pauseTime = position
    this.startTime = 0
    this.activeVersion = version

    for (const track of this.tracks.values()) {
      track.activeVersion = version
      this.applyActiveVersionState(track)
    }

    if (wasPlaying) {
      await this.play()
    } else {
      this.config.onTimeUpdate?.(position)
      this.refreshTrackGains()
    }
  }

  async setTrackActiveVersion(trackId: string, version: PlaybackVersion): Promise<void> {
    const track = this.tracks.get(trackId)
    if (!track) return
    if (track.activeVersion === version) return

    const versionState = track.versions[version]
    if (versionState.state !== 'ready' || !versionState.buffer) {
      // Do not switch into an unloaded/unready version.
      return
    }

    const wasPlaying = this.playbackState === 'playing'
    const position = this.getCurrentTime()

    track.activeVersion = version
    this.applyActiveVersionState(track)
    this.config.onTrackStateChange?.(trackId, track.state)

    if (!this.audioContext || !track.gainNode) {
      return
    }

    if (!wasPlaying) {
      this.refreshTrackGains()
      return
    }

    // Seamless switching: restart only this track at the current position.
    if (track.sourceNode) {
      try {
        track.sourceNode.stop()
      } catch {
        // Ignore errors from already stopped sources
      }
      track.sourceNode.disconnect()
      track.sourceNode = null
    }

    const preRollSeconds = this.getPreRollSeconds()
    const startOffset = Math.max(0, position - preRollSeconds)
    const rampDuration = position - startOffset
    const hasSoloedTracks = this.hasSoloedTracks()
    const now = this.audioContext.currentTime

    const source = this.audioContext.createBufferSource()
    source.buffer = versionState.buffer
    source.connect(track.gainNode)

    source.onended = () => {
      if (this.playbackState === 'playing') {
        this.handlePlaybackEnd()
      }
    }

    track.sourceNode = source

    const targetGain = this.computeEffectiveGain(track, hasSoloedTracks)
    const gainParam = track.gainNode.gain as unknown as {
      setValueAtTime?: (value: number, startTime: number) => void
      linearRampToValueAtTime?: (value: number, endTime: number) => void
      value: number
    }

    if (
      typeof gainParam.setValueAtTime === 'function' &&
      typeof gainParam.linearRampToValueAtTime === 'function'
    ) {
      gainParam.setValueAtTime(0, now)
      if (rampDuration <= 0) {
        gainParam.setValueAtTime(targetGain, now)
      } else {
        gainParam.linearRampToValueAtTime(targetGain, now + rampDuration)
      }
    } else {
      gainParam.value = targetGain
    }

    const offset = Math.min(startOffset, Math.max(versionState.buffer.duration - 0.001, 0))
    source.start(0, offset)
  }

  /**
   * Play all tracks from current position
   */
  async play(): Promise<void> {
    if (!this.audioContext || !this.masterGainNode) {
      throw new Error('AudioEngine not initialized')
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Stop any currently playing sources
    this.stopAllSources()

    const requestedTime = this.playbackState === 'paused' ? this.pauseTime : 0
    const preRollSeconds = this.getPreRollSeconds()
    const startOffset = Math.max(0, requestedTime - preRollSeconds)
    const rampDuration = requestedTime - startOffset
    const hasSoloedTracks = this.hasSoloedTracks()
    const now = this.audioContext.currentTime

    for (const track of this.tracks.values()) {
      const versionState = track.versions[track.activeVersion]
      if (versionState.state !== 'ready' || !versionState.buffer || !track.gainNode) continue

      const source = this.audioContext.createBufferSource()
      source.buffer = versionState.buffer
      source.connect(track.gainNode)

      source.onended = () => {
        if (this.playbackState === 'playing') {
          this.handlePlaybackEnd()
        }
      }

      track.sourceNode = source

      const targetGain = this.computeEffectiveGain(track, hasSoloedTracks)
      const gainParam = track.gainNode.gain as unknown as {
        setValueAtTime?: (value: number, startTime: number) => void
        linearRampToValueAtTime?: (value: number, endTime: number) => void
        value: number
      }

      if (
        typeof gainParam.setValueAtTime === 'function' &&
        typeof gainParam.linearRampToValueAtTime === 'function'
      ) {
        gainParam.setValueAtTime(0, now)
        if (rampDuration <= 0) {
          gainParam.setValueAtTime(targetGain, now)
        } else {
          gainParam.linearRampToValueAtTime(targetGain, now + rampDuration)
        }
      } else {
        gainParam.value = targetGain
      }

      const offset = Math.min(startOffset, Math.max(versionState.buffer.duration - 0.001, 0))
      source.start(0, offset)
    }

    this.startTime = this.audioContext.currentTime - requestedTime
    this.playbackState = 'playing'
    this.config.onStateChange?.('playing')

    // Start time update loop
    this.startTimeUpdateLoop()
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.playbackState !== 'playing' || !this.audioContext) return

    this.pauseTime = this.audioContext.currentTime - this.startTime
    this.stopAllSources()
    this.playbackState = 'paused'
    this.config.onStateChange?.('paused')
    this.stopTimeUpdateLoop()
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    if (!this.audioContext) return

    this.stopAllSources()
    this.pauseTime = 0
    this.startTime = 0
    this.playbackState = 'stopped'
    this.config.onStateChange?.('stopped')
    this.stopTimeUpdateLoop()
    this.config.onTimeUpdate?.(0)
  }

  /**
   * Seek to a specific time (in seconds)
   */
  async seek(time: number): Promise<void> {
    const wasPlaying = this.playbackState === 'playing'

    // Stop all sources but preserve the seek position
    this.stopAllSources()
    this.pauseTime = time
    this.startTime = 0

    if (wasPlaying) {
      // Resume playback from new position
      this.playbackState = 'stopped' // Reset state for play()
      await this.play()
    } else {
      // Just update the position
      this.playbackState = 'paused'
      this.config.onTimeUpdate?.(time)
    }
  }

  /**
   * Get the current playback time
   */
  getCurrentTime(): number {
    if (!this.audioContext) return 0

    if (this.playbackState === 'playing') {
      return this.audioContext.currentTime - this.startTime
    } else if (this.playbackState === 'paused') {
      return this.pauseTime
    }

    return 0
  }

  /**
   * Get the duration of the longest track
   */
  getDuration(): number {
    let maxDuration = 0

    for (const track of this.tracks.values()) {
      const versionState = track.versions[track.activeVersion]
      if (versionState?.buffer) {
        maxDuration = Math.max(maxDuration, versionState.buffer.duration)
      }
    }

    return maxDuration
  }

  /**
   * Get all tracks
   */
  getTracks(): Track[] {
    return Array.from(this.tracks.values())
  }

  /**
   * Get a specific track
   */
  getTrack(id: string): Track | undefined {
    return this.tracks.get(id)
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): PlaybackState {
    return this.playbackState
  }

  getActiveVersion(): PlaybackVersion {
    return this.activeVersion
  }

  /**
   * Cleanup and dispose of all resources
   */
  dispose(): void {
    this.stop()
    this.stopTimeUpdateLoop()

    for (const track of this.tracks.values()) {
      if (track.sourceNode) {
        track.sourceNode.disconnect()
      }
      if (track.gainNode) {
        track.gainNode.disconnect()
      }
    }

    this.tracks.clear()

    if (this.masterGainNode) {
      this.masterGainNode.disconnect()
      this.masterGainNode = null
    }

    if (this.audioContext) {
      void this.audioContext.close()
      this.audioContext = null
    }
  }

  // Private methods

  private ensureTrack(id: string, name: string): Track {
    const existing = this.tracks.get(id)
    if (existing) {
      existing.name = name
      return existing
    }

    const versionTemplate: TrackVersionData = {
      url: '',
      buffer: null,
      peaks: null,
      state: 'loading',
    }

    const track: Track = {
      id,
      name,
      url: '',
      buffer: null,
      peaks: null,
      gainNode: null,
      sourceNode: null,
      state: 'loading',
      gain: 1.0,
      muted: false,
      soloed: false,
      activeVersion: this.activeVersion,
      versions: {
        A: { ...versionTemplate },
        B: { ...versionTemplate },
      },
    }

    this.tracks.set(id, track)
    return track
  }

  private applyActiveVersionState(track: Track): void {
    const versionState = track.versions[track.activeVersion]
    track.buffer = versionState.buffer
    track.peaks = versionState.peaks
    track.state = versionState.state
    track.error = versionState.error
    track.url = versionState.url
  }

  private hasSoloedTracks(): boolean {
    return Array.from(this.tracks.values()).some((t) => t.soloed)
  }

  private computeEffectiveGain(track: Track, hasSoloedTracks: boolean): number {
    if (track.muted) return 0
    if (hasSoloedTracks && !track.soloed) return 0
    return track.gain
  }

  private refreshTrackGains(): void {
    const hasSoloedTracks = this.hasSoloedTracks()

    for (const track of this.tracks.values()) {
      if (!track.gainNode) continue
      const effectiveGain = this.computeEffectiveGain(track, hasSoloedTracks)
      track.gainNode.gain.value = effectiveGain
    }
  }

  private getPreRollSeconds(): number {
    const sampleRate = this.audioContext?.sampleRate ?? this.config.sampleRate ?? 48000
    const preRollSamples = this.config.preRollSamples ?? 512
    return Math.max(0, preRollSamples) / sampleRate
  }

  private stopAllSources(): void {
    for (const track of this.tracks.values()) {
      if (track.sourceNode) {
        try {
          track.sourceNode.stop()
        } catch {
          // Ignore errors from already stopped sources
        }
        track.sourceNode.disconnect()
        track.sourceNode = null
      }
    }
  }

  private handlePlaybackEnd(): void {
    this.playbackState = 'stopped'
    this.pauseTime = 0
    this.startTime = 0
    this.config.onStateChange?.('stopped')
    this.stopTimeUpdateLoop()
    this.config.onTimeUpdate?.(0)
  }

  private startTimeUpdateLoop(): void {
    this.stopTimeUpdateLoop()

    const update = () => {
      if (this.playbackState === 'playing') {
        const currentTime = this.getCurrentTime()
        this.config.onTimeUpdate?.(currentTime)

        // Check if we've reached the end
        const duration = this.getDuration()
        if (currentTime >= duration) {
          this.handlePlaybackEnd()
        } else {
          this.animationFrameId = requestAnimationFrame(update)
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(update)
  }

  private stopTimeUpdateLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}

/**
 * Helper function to create a pre-configured audio engine
 */
export function createAudioEngine(config?: AudioEngineConfig): AudioEngine {
  return new AudioEngine(config)
}
