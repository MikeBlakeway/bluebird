/**
 * WebAudio Preview Engine
 *
 * Provides real-time audio playback with per-track gain controls,
 * mute/solo functionality, and synchronized transport.
 */

export type TrackState = 'loading' | 'ready' | 'error'

export interface Track {
  id: string
  name: string
  url: string
  buffer: AudioBuffer | null
  gainNode: GainNode | null
  sourceNode: AudioBufferSourceNode | null
  state: TrackState
  error?: string
  gain: number // 0-1
  muted: boolean
  soloed: boolean
}

export type PlaybackState = 'stopped' | 'playing' | 'paused'

export interface AudioEngineConfig {
  sampleRate?: number
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

  constructor(config: AudioEngineConfig = {}) {
    this.config = config
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
  async addTrack(id: string, name: string, url: string): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioEngine not initialized. Call initialize() first.')
    }

    // Create track object
    const track: Track = {
      id,
      name,
      url,
      buffer: null,
      gainNode: null,
      sourceNode: null,
      state: 'loading',
      gain: 1.0,
      muted: false,
      soloed: false,
    }

    this.tracks.set(id, track)
    this.config.onTrackStateChange?.(id, 'loading')

    try {
      // Fetch and decode audio
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      // Create gain node for this track
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = track.gain
      if (this.masterGainNode) {
        gainNode.connect(this.masterGainNode)
      }

      // Update track
      track.buffer = audioBuffer
      track.gainNode = gainNode
      track.state = 'ready'

      this.config.onTrackStateChange?.(id, 'ready')
    } catch (error) {
      track.state = 'error'
      track.error = error instanceof Error ? error.message : String(error)
      this.config.onTrackStateChange?.(id, 'error')
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
    if (!track || !track.gainNode) return

    track.gain = Math.max(0, Math.min(1, gain))
    track.gainNode.gain.value = track.muted ? 0 : track.gain
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
    if (!track || !track.gainNode) return

    track.muted = muted
    track.gainNode.gain.value = muted ? 0 : track.gain
  }

  /**
   * Solo a track (mutes all other tracks)
   */
  setTrackSoloed(id: string, soloed: boolean): void {
    const track = this.tracks.get(id)
    if (!track) return

    track.soloed = soloed

    // Update all track gains based on solo state
    const hasSoloedTracks = Array.from(this.tracks.values()).some((t) => t.soloed)

    for (const [, t] of this.tracks) {
      if (!t.gainNode) continue

      if (hasSoloedTracks) {
        // If any tracks are soloed, only play soloed tracks
        t.gainNode.gain.value = t.soloed && !t.muted ? t.gain : 0
      } else {
        // No solo, respect mute state
        t.gainNode.gain.value = t.muted ? 0 : t.gain
      }
    }
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

    const currentTime = this.playbackState === 'paused' ? this.pauseTime : 0

    // Create and start new source nodes for all ready tracks
    for (const track of this.tracks.values()) {
      if (track.state !== 'ready' || !track.buffer || !track.gainNode) continue

      const source = this.audioContext.createBufferSource()
      source.buffer = track.buffer
      source.connect(track.gainNode)

      // Handle playback end
      source.onended = () => {
        if (this.playbackState === 'playing') {
          this.handlePlaybackEnd()
        }
      }

      track.sourceNode = source
      source.start(0, currentTime)
    }

    this.startTime = this.audioContext.currentTime - currentTime
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
      if (track.buffer) {
        maxDuration = Math.max(maxDuration, track.buffer.duration)
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
