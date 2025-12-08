/**
 * Analyzer: Parse lyrics for syllables, rhyme schemes, and musical hints.
 * This is a stub implementation with heuristics; real version would use proper linguistics.
 */

interface AnalyzedLine {
  index: number;
  text: string;
  syllables: string[];
  estimatedDuration: number; // milliseconds
}

/**
 * Simple syllable estimation using vowel groups.
 * Real implementation would use proper phonetic library (e.g., syllable-counter).
 */
export function estimateSyllables(text: string): string[] {
  const word = text.toLowerCase().trim();
  if (!word) return [];

  // Split on vowel groups (a, e, i, o, u, y)
  const vowelPattern = /[aeiouy]+/g;
  const matches = word.match(vowelPattern) || [];

  return matches;
}

/**
 * Extract individual lines from lyrics and analyze each.
 */
export function analyzeLyrics(lyrics: string) {
  const lines = lyrics.split('\n').filter((line) => line.trim().length > 0);

  const analyzedLines: AnalyzedLine[] = lines.map((text, index) => {
    const words = text.toLowerCase().split(/\s+/);
    const syllables = words.flatMap(estimateSyllables);

    // Estimate duration: ~200ms per syllable at moderate tempo
    const estimatedDuration = syllables.length * 200;

    return {
      index,
      text,
      syllables,
      estimatedDuration,
    };
  });

  return analyzedLines;
}

/**
 * Detect end words for rhyme detection.
 */
function getEndWord(text: string): string {
  const words = text.toLowerCase().split(/\s+/);
  const lastWord = words[words.length - 1] ?? '';
  return lastWord.replace(/[^a-z]/g, ''); // Remove punctuation
}

/**
 * Simple rhyme detection: check last 2 characters as phonetic proxy.
 * Real version would use proper phonetic matching (CMU dict, etc.).
 */
function getSoundEnding(word: string): string {
  if (!word) return '';
  // Get last 2 characters as sound proxy (more forgiving for rhymes)
  return word.slice(-2).toLowerCase();
}

/**
 * Detect rhyme scheme and group rhyming words.
 */
export function detectRhymeScheme(lines: AnalyzedLine[]) {
  const endWords = lines.map((line) => getEndWord(line.text));
  const soundEndings = endWords.map(getSoundEnding);

  // Map sounds to letters (A, B, C, etc.)
  const soundToLetter: Record<string, string> = {};
  let nextLetter = 'A';
  const rhymeScheme: string[] = [];
  const rhymingWords: Record<string, string[]> = {};

  soundEndings.forEach((sound, index) => {
    if (!soundToLetter[sound]) {
      soundToLetter[sound] = nextLetter;
      rhymingWords[nextLetter] = [];
      nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
    }

    const letter = soundToLetter[sound];
    const endWord = endWords[index];
    if (endWord && rhymingWords[letter]) {
      rhymingWords[letter].push(endWord);
    }
    rhymeScheme.push(letter);
  });

  return { rhymeScheme, rhymingWords };
}

/**
 * Guess tempo from syllable density and line structure.
 * Real version would analyze actual audio or user intent.
 */
export function estimateTempo(analyzedLines: AnalyzedLine[]): number {
  const avgSyllablesPerLine = analyzedLines.reduce((sum, line) => sum + line.syllables.length, 0) / analyzedLines.length;

  // Heuristic: 4-6 syllables/line suggests ~90-100 BPM, 6-8 suggests ~110-120, etc.
  if (avgSyllablesPerLine < 4) return 80;
  if (avgSyllablesPerLine < 6) return 95;
  if (avgSyllablesPerLine < 8) return 110;
  if (avgSyllablesPerLine < 10) return 125;
  return 140;
}

/**
 * Detect main theme/hook from repeated words.
 */
export function extractSeedPhrase(lyrics: string): string {
  const lines = lyrics.split('\n').filter((line) => line.trim().length > 0);

  // Look for frequently appearing short phrases (2-3 words)
  const phraseFreq: Record<string, number> = {};

  lines.forEach((line) => {
    const words = line.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (words.length >= 2) {
      const phrase = words.slice(0, 3).join(' ');
      phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
    }
  });

  // Return most frequent phrase
  const topPhrase = Object.entries(phraseFreq)
    .sort((a, b) => b[1] - a[1])
    .at(0)?.[0];

  return topPhrase || 'Untitled';
}
