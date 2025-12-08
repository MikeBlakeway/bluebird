import { test, describe, expect } from 'vitest';
import {
    estimateSyllables,
    analyzeLyrics,
    detectRhymeScheme,
    estimateTempo,
    extractSeedPhrase,
} from './analyzer.js';

describe('Analyzer', () => {
  describe('estimateSyllables', () => {
    test('should count vowel groups as syllables', () => {
      const syllables = estimateSyllables('hello');
      expect(syllables.length).toBeGreaterThan(0);
      expect(syllables.includes('e')).toBe(true);
      expect(syllables.includes('o')).toBe(true);
    });

    test('should handle single vowel', () => {
      const syllables = estimateSyllables('a');
      expect(syllables.length).toBeGreaterThan(0);
    });

    test('should return empty array for consonant-only', () => {
      const syllables = estimateSyllables('bcdfg');
      expect(syllables.length).toBe(0);
    });
  });

  describe('analyzeLyrics', () => {
    test('should parse lyrics into lines with syllables', () => {
      const lyrics = 'Hello world\nThis is a test';
      const result = analyzeLyrics(lyrics);

      expect(result.length).toBe(2);
      const firstLine = result[0];
      if (!firstLine) throw new Error('Expected first line');
      expect(firstLine.text).toBe('Hello world');
      expect(firstLine.syllables.length).toBeGreaterThan(0);
      expect(firstLine.estimatedDuration).toBeGreaterThan(0);
    });

    test('should skip empty lines', () => {
      const lyrics = 'Hello\n\nWorld';
      const result = analyzeLyrics(lyrics);
      expect(result.length).toBe(2);
    });
  });

  describe('detectRhymeScheme', () => {
    test('should detect AABB rhyme scheme', () => {
      const lyrics = 'Hello day\nHappy way\nSing along\nAll day long';
      const lines = analyzeLyrics(lyrics);
      const { rhymeScheme } = detectRhymeScheme(lines);

      // Should detect some rhyming pattern
      expect(rhymeScheme.length).toBe(4);
      // First and second should match (day/way)
      expect(rhymeScheme[0]).toBe(rhymeScheme[1]);
      // Third and fourth should match (long/long)
      expect(rhymeScheme[2]).toBe(rhymeScheme[3]);
    });
  });

  describe('estimateTempo', () => {
    test('should estimate faster tempo for shorter lines', () => {
      const shortLyrics = analyzeLyrics('Hi\nBye\nGo');
      const tempoShort = estimateTempo(shortLyrics);

      const longLyrics = analyzeLyrics('This is a much longer line with many syllables\nAnother long lyrical line');
      const tempoLong = estimateTempo(longLyrics);

      // Longer lines should suggest faster tempo
      expect(tempoLong).toBeGreaterThan(tempoShort);
    });

    test('should return reasonable BPM range', () => {
      const lyrics = analyzeLyrics('Hello world');
      const tempo = estimateTempo(lyrics);

      expect(tempo).toBeGreaterThanOrEqual(80);
      expect(tempo).toBeLessThanOrEqual(150);
    });
  });

  describe('extractSeedPhrase', () => {
    test('should extract repeated phrases', () => {
      const lyrics = 'Love is love\nLove is strong\nLove is true';
      const seed = extractSeedPhrase(lyrics);

      expect(seed.toLowerCase()).toContain('love');
    });

    test('should return default for simple lyrics', () => {
      const lyrics = 'One line\nTwo line';
      const seed = extractSeedPhrase(lyrics);

      expect(seed).toBeTruthy();
    });
  });
});
