export interface Peak {
  min: number
  max: number
}

export function extractPeaks(buffer: AudioBuffer, peaksPerSecond = 100): Peak[] {
  const sampleRate = buffer.sampleRate || 48000
  const samplesPerPeak = Math.max(1, Math.floor(sampleRate / peaksPerSecond))
  const channelCount = buffer.numberOfChannels
  const frameCount = buffer.length

  const peaks: Peak[] = []

  for (let i = 0; i < frameCount; i += samplesPerPeak) {
    let min = 1
    let max = -1

    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
      const channelData = buffer.getChannelData(channelIndex)
      const upperBound = Math.min(i + samplesPerPeak, frameCount)

      for (let j = i; j < upperBound; j++) {
        const sample = channelData[j] ?? 0
        if (sample < min) min = sample
        if (sample > max) max = sample
      }
    }

    peaks.push({ min, max })
  }

  return peaks
}
