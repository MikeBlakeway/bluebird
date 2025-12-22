/**
 * A/B Switch helper
 *
 * Switches playback version for a single track.
 * This is WebAudio-only (no GPU/API calls).
 */

import type { AudioEngine, PlaybackVersion } from '@/lib/audio-engine'

export interface SwitchTrackVersionParams {
  engine: AudioEngine
  trackId: string
  version: PlaybackVersion
}

export async function switchTrackVersion({
  engine,
  trackId,
  version,
}: SwitchTrackVersionParams): Promise<void> {
  await engine.setTrackActiveVersion(trackId, version)
}
