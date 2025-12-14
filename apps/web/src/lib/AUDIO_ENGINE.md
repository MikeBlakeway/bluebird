# WebAudio Preview Engine

Complete audio playback engine for multi-track preview with mixing controls.

## Overview

The WebAudio Preview Engine provides real-time audio playback with per-track gain control, mute/solo functionality, and transport controls. Built on the Web Audio API, it supports synchronized playback of multiple audio tracks with low latency.

## Features

- **Multi-track playback**: Load and play multiple audio tracks simultaneously
- **Transport controls**: Play, pause, stop, seek
- **Per-track mixing**: Individual gain, mute, and solo controls
- **Master gain**: Overall volume control
- **State tracking**: Real-time playback position and track states
- **Error handling**: Comprehensive error callbacks for loading and playback issues
- **Resource management**: Automatic cleanup and disposal

## Quick Start

### Using the React Hook (Recommended)

```typescript
import { useAudioEngine } from '@/hooks/use-audio-engine'

function MusicPlayer() {
  const {
    playbackState,
    currentTime,
    duration,
    tracks,
    play,
    pause,
    stop,
    seek,
    addTrack,
    removeTrack,
    setTrackGain,
    setMasterGain,
    setTrackMuted,
    setTrackSoloed,
  } = useAudioEngine({
    sampleRate: 48000, // Optional, defaults to 48000
    onError: (error) => console.error('Audio engine error:', error),
  })

  // Load tracks
  useEffect(() => {
    addTrack('track1', 'Vocals', 'https://example.com/vocals.wav')
    addTrack('track2', 'Music', 'https://example.com/music.wav')
  }, [addTrack])

  return (
    <div>
      {/* Transport controls */}
      <button onClick={play} disabled={playbackState === 'playing'}>
        Play
      </button>
      <button onClick={pause} disabled={playbackState !== 'playing'}>
        Pause
      </button>
      <button onClick={stop}>Stop</button>

      {/* Time display */}
      <div>
        {Math.floor(currentTime)}s / {Math.floor(duration)}s
      </div>

      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={(e) => seek(parseFloat(e.target.value))}
      />

      {/* Track mixer */}
      {tracks.map((track) => (
        <div key={track.id}>
          <h3>{track.name}</h3>
          <p>State: {track.state}</p>

          {/* Gain control */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={track.gain}
            onChange={(e) => setTrackGain(track.id, parseFloat(e.target.value))}
          />

          {/* Mute/Solo */}
          <button onClick={() => setTrackMuted(track.id, !track.muted)}>
            {track.muted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={() => setTrackSoloed(track.id, !track.soloed)}>
            {track.soloed ? 'Unsolo' : 'Solo'}
          </button>
        </div>
      ))}

      {/* Master gain */}
      <div>
        <label>Master Volume</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          onChange={(e) => setMasterGain(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}
```

### Using the AudioEngine Class Directly

```typescript
import { AudioEngine } from '@/lib/audio-engine'

async function playAudio() {
  // Create engine
  const engine = new AudioEngine({
    sampleRate: 48000,
    onStateChange: (state) => console.log('State:', state),
    onTimeUpdate: (time) => console.log('Time:', time),
    onTrackStateChange: (id, state) => console.log(`Track ${id}:`, state),
    onError: (error) => console.error('Error:', error),
  })

  // Initialize
  await engine.initialize()

  // Add tracks
  await engine.addTrack('vocals', 'Vocals', 'https://example.com/vocals.wav')
  await engine.addTrack('music', 'Music', 'https://example.com/music.wav')

  // Play
  await engine.play()

  // Control playback
  setTimeout(() => {
    engine.pause()
  }, 5000)

  setTimeout(() => {
    engine.seek(10) // Seek to 10 seconds
    engine.play()
  }, 6000)

  // Cleanup when done
  setTimeout(() => {
    engine.dispose()
  }, 20000)
}
```

## API Reference

### useAudioEngine Hook

#### Options

```typescript
interface UseAudioEngineOptions {
  sampleRate?: number // Sample rate in Hz (default: 48000)
  onError?: (error: Error) => void // Error callback
}
```

#### Return Value

```typescript
interface UseAudioEngineReturn {
  // State
  playbackState: 'stopped' | 'playing' | 'paused'
  currentTime: number // Current position in seconds
  duration: number // Total duration in seconds
  tracks: Track[] // Array of all tracks
  isInitialized: boolean // Whether engine is ready

  // Transport controls
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  seek: (time: number) => Promise<void>

  // Track management
  addTrack: (id: string, name: string, url: string) => Promise<void>
  removeTrack: (id: string) => void

  // Gain controls
  setTrackGain: (id: string, gain: number) => void // 0-1
  setMasterGain: (gain: number) => void // 0-1
  setTrackMuted: (id: string, muted: boolean) => void
  setTrackSoloed: (id: string, soloed: boolean) => void

  // Advanced
  engine: AudioEngine | null // Direct engine access
}
```

### AudioEngine Class

#### Constructor

```typescript
new AudioEngine(options?: {
  sampleRate?: number
  onStateChange?: (state: PlaybackState) => void
  onTimeUpdate?: (time: number) => void
  onTrackStateChange?: (id: string, state: TrackState) => void
  onError?: (error: Error) => void
})
```

#### Methods

**Initialization**

- `async initialize(): Promise<void>` - Initialize audio context and master gain

**Track Management**

- `async addTrack(id: string, name: string, url: string): Promise<void>` - Load and add a track
- `removeTrack(id: string): void` - Remove a track
- `getTrack(id: string): Track | undefined` - Get track by ID
- `getTracks(): Track[]` - Get all tracks

**Transport Controls**

- `async play(): Promise<void>` - Start or resume playback
- `pause(): void` - Pause playback (preserves position)
- `stop(): void` - Stop and reset to beginning
- `async seek(time: number): Promise<void>` - Jump to specific time

**Gain Controls**

- `setTrackGain(id: string, gain: number): void` - Set track volume (0-1)
- `setMasterGain(gain: number): void` - Set master volume (0-1)
- `setTrackMuted(id: string, muted: boolean): void` - Mute/unmute track
- `setTrackSoloed(id: string, soloed: boolean): void` - Solo/unsolo track

**State Queries**

- `getPlaybackState(): PlaybackState` - Get current state
- `getCurrentTime(): number` - Get current position in seconds
- `getDuration(): number` - Get duration of longest track

**Cleanup**

- `dispose(): void` - Stop playback and release all resources

### Track Object

```typescript
interface Track {
  id: string
  name: string
  url: string
  buffer: AudioBuffer | null
  gainNode: GainNode | null
  sourceNode: AudioBufferSourceNode | null
  state: 'loading' | 'ready' | 'error'
  error?: string
  gain: number // 0-1
  muted: boolean
  soloed: boolean
}
```

## Integration with API Client

```typescript
import { BluebirdClient } from '@bluebird/client'
import { useAudioEngine } from '@/hooks/use-audio-engine'

function PreviewPlayer({ projectId, takeId }: { projectId: string; takeId: string }) {
  const client = new BluebirdClient()
  const { addTrack, play, playbackState, currentTime, duration } = useAudioEngine()

  useEffect(() => {
    async function loadPreview() {
      try {
        // Fetch take metadata
        const take = await client.getTake(projectId, takeId)

        // Load audio tracks (assuming presigned URLs in metadata)
        if (take.audioUrls) {
          await addTrack('vocals', 'Vocals', take.audioUrls.vocals)
          await addTrack('music', 'Music', take.audioUrls.music)
        }
      } catch (error) {
        console.error('Failed to load preview:', error)
      }
    }

    loadPreview()
  }, [projectId, takeId, client, addTrack])

  return (
    <div>
      <button onClick={play} disabled={playbackState === 'playing'}>
        Play Preview
      </button>
      <div>
        {Math.floor(currentTime)}s / {Math.floor(duration)}s
      </div>
    </div>
  )
}
```

## Integration with SSE Client

```typescript
import { useJobEvents } from '@/hooks/use-job-events'
import { useAudioEngine } from '@/hooks/use-audio-engine'

function RenderMonitor({ jobId }: { jobId: string }) {
  const { events, connectionState } = useJobEvents(jobId)
  const { addTrack, play } = useAudioEngine()

  useEffect(() => {
    // Find completed render event
    const renderComplete = events.find(
      (e) => e.stage === 'mix-render' && e.status === 'completed'
    )

    if (renderComplete?.metadata?.audioUrl) {
      // Auto-load completed audio
      addTrack('preview', 'Preview', renderComplete.metadata.audioUrl)
    }
  }, [events, addTrack])

  return (
    <div>
      <div>Connection: {connectionState}</div>
      <div>Events: {events.length}</div>
      <button onClick={play}>Play Rendered Audio</button>
    </div>
  )
}
```

## Performance Considerations

### Sample Rate

- **48 kHz** (default): High quality, matches most professional audio
- **44.1 kHz**: CD quality, smaller file sizes
- Match your source audio sample rate to avoid resampling

### Track Count

- Engine handles 10+ simultaneous tracks efficiently
- Each track uses one GainNode (minimal CPU overhead)
- Memory usage scales with total audio duration loaded

### Seeking

- Seeking stops and recreates all AudioBufferSourceNodes
- Small delay (<50ms) on seek is normal
- Minimize frequent seeks during playback

### Mobile Considerations

- iOS requires user interaction before AudioContext can start
- Call `engine.initialize()` in a click/tap event handler
- Consider lower sample rates on mobile (44.1 kHz)

## Troubleshooting

### Audio Not Playing

**Check AudioContext state:**

```typescript
const engine = useAudioEngine()
console.log(engine.engine?.audioContext?.state) // Should be 'running'
```

**Resume suspended context:**

```typescript
// iOS often suspends AudioContext
if (engine.engine?.audioContext?.state === 'suspended') {
  await engine.engine.audioContext.resume()
}
```

### Clicks/Pops During Playback

- Ensure consistent sample rate across all tracks
- Check for buffer underruns (CPU overload)
- Verify network bandwidth for streaming tracks

### Track Loading Failures

- Check CORS headers on audio files
- Verify presigned URL expiration
- Check browser console for network errors

### Memory Leaks

- Always call `dispose()` when unmounting components
- React hook handles this automatically
- Manual AudioEngine instances require manual cleanup

### Time Drift

- WebAudio uses high-precision timing
- Clock may drift slightly over long playback
- Reset with `seek(getCurrentTime())` if needed

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires user interaction for initialization)
- **Mobile**: iOS 14.5+, Android Chrome 90+

## Best Practices

1. **Initialize early**: Create AudioEngine during component mount
2. **Load tracks incrementally**: Add tracks as they become available
3. **Handle errors**: Always provide onError callback
4. **Cleanup properly**: Dispose engine on unmount
5. **Respect user interaction**: Initialize AudioContext from user gesture on mobile
6. **Use presigned URLs**: Avoid CORS issues with S3
7. **Monitor state**: Track loading and playback states for UI updates
8. **Test on mobile**: iOS has stricter audio policies than desktop

## Examples

See `apps/web/src/components/` for complete UI examples:

- `MusicPlayer.tsx` - Full-featured player with mixer
- `SimplePlayer.tsx` - Minimal playback controls
- `TrackMixer.tsx` - Per-track gain/mute/solo controls

## License

MIT - See LICENSE file for details
