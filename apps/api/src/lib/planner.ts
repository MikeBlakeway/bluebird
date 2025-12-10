/**
 * Planner: Generate arrangement structure from analyzed lyrics.
 * This is a v0 stub using heuristics; real version would use ML models.
 */

import type { AnalysisResult, ArrangementSpec, Section, JobId } from '@bluebird/types'

/**
 * Guess song key from lyrics/genre context and tempo.
 * Real version would use tonal analysis or ML.
 * For now: return common keys in rotation.
 */
export function guessKey(analysisResult: AnalysisResult, seed: number = 0): string {
  const commonKeys = ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm']
  const index = (seed + analysisResult.projectId.charCodeAt(0)) % commonKeys.length
  const key = commonKeys[index]
  return key ?? 'C'
}

/**
 * Guess scale (major/minor) based on seedPhrase mood.
 * Real version would analyze sentiment.
 */
export function guessScale(
  seedPhrase: string | undefined,
  _analysisResult: AnalysisResult
): 'major' | 'minor' | 'pentatonic' {
  if (!seedPhrase) return 'major'

  const sad = ['sad', 'blue', 'break', 'cry', 'lost', 'alone', 'dark']
  const isSad = sad.some((w) => seedPhrase.toLowerCase().includes(w))

  if (isSad) return 'minor'
  if (seedPhrase.length > 20) return 'pentatonic'
  return 'major'
}

/**
 * Refine tempo based on syllable density and seed phrase length.
 * Takes analyzer's estimate and applies adjustments.
 */
export function refineTempo(analysisResult: AnalysisResult): number {
  const estimatedTempo = analysisResult.estimatedTempo ?? 100
  const avgSyllablesPerLine =
    analysisResult.totalSyllables / Math.max(analysisResult.lines.length, 1)

  // Fine-tune: rapid delivery → faster tempo, slow delivery → slower
  if (avgSyllablesPerLine > 8) {
    // Lots of syllables/line suggests fast delivery
    return Math.min(estimatedTempo + 10, 160)
  } else if (avgSyllablesPerLine < 3) {
    // Few syllables suggests sparse/slow
    return Math.max(estimatedTempo - 10, 70)
  }

  return estimatedTempo
}

/**
 * Infer song structure from lyric length and rhyme scheme.
 * Common pop structure: Intro → Verse → Chorus → Verse → Chorus → Bridge → Chorus → Outro
 */
export function inferStructure(analysisResult: AnalysisResult): Section[] {
  const lineCount = analysisResult.lines.length

  // Heuristic: 4-8 lines per section; chorus often 4-6 lines repeating
  // (Can use findRepeatingPattern for future chorus detection refinements)

  const sections: Section[] = []

  // Intro
  sections.push({
    index: 0,
    type: 'intro',
    bars: 8,
    energyLevel: 0.3,
  })

  // Verse(s) - estimate based on line count
  const verseLinesPerSection = 8
  const verseCount = Math.max(1, Math.floor((lineCount * 0.6) / verseLinesPerSection))

  let sectionIndex = 1
  for (let i = 0; i < verseCount; i++) {
    sections.push({
      index: sectionIndex++,
      type: 'verse',
      bars: 16,
      energyLevel: 0.4 + i * 0.1,
    })
  }

  // Chorus - inferred from repeating pattern
  sections.push({
    index: sectionIndex++,
    type: 'chorus',
    bars: 8,
    energyLevel: 0.8,
  })

  // Bridge - if song is long enough
  if (lineCount > 20) {
    sections.push({
      index: sectionIndex++,
      type: 'bridge',
      bars: 8,
      energyLevel: 0.6,
    })
  }

  // Final chorus
  sections.push({
    index: sectionIndex++,
    type: 'chorus',
    bars: 8,
    energyLevel: 0.9,
  })

  // Outro
  sections.push({
    index: sectionIndex++,
    type: 'outro',
    bars: 8,
    energyLevel: 0.2,
  })

  return sections
}

/**
 * Generate energy curve across song duration.
 * Curves from intro through verses, builds to chorus, dips for bridge, climbs to final chorus.
 */
export function generateEnergyCurve(sections: Section[]): number[] {
  const curve: number[] = []

  sections.forEach((section) => {
    const samplesPerSection = Math.ceil(section.bars / 4) // ~1 sample per 4 bars
    for (let i = 0; i < samplesPerSection; i++) {
      curve.push(section.energyLevel)
    }
  })

  return curve
}

/**
 * Guess instrumentation based on genre and energy level.
 * Default to versatile pop/indie setup.
 */
export function guessInstrumentation(analysisResult: AnalysisResult): string[] {
  // Base instruments
  const instruments = ['kick', 'snare', 'hihat', 'bass', 'guitar', 'pad']

  // Add richness based on syllable density
  if (analysisResult.totalSyllables > 100) {
    instruments.push('strings')
  }

  // Add melodic interest if rhyme scheme is sophisticated
  if (analysisResult.rhymeScheme && analysisResult.rhymeScheme.length > 8) {
    instruments.push('synth', 'vocal-harmonies')
  }

  return instruments
}

/**
 * Generate complete ArrangementSpec from AnalysisResult.
 * Takes lyrics/melody hints and produces a full song plan.
 */
export function planArrangement(
  analysisResult: AnalysisResult,
  jobId: JobId,
  seed: number = 0
): ArrangementSpec {
  const bpm = refineTempo(analysisResult)
  const key = guessKey(analysisResult, seed)
  const scale = guessScale(analysisResult.seedPhrase, analysisResult)
  const sections = inferStructure(analysisResult)
  const energyCurve = generateEnergyCurve(sections)
  const instrumentation = guessInstrumentation(analysisResult)

  return {
    projectId: analysisResult.projectId,
    jobId,
    bpm,
    key,
    scale,
    timeSignature: '4/4',
    sections,
    instrumentation,
    energyCurve,
    seed: seed || undefined,
  }
}
