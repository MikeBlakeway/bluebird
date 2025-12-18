import { test, expect } from '@playwright/test'

/* eslint-disable no-console */

/**
 * WebAudio Load Performance Test
 *
 * Target: <2s to load and decode 30s preview
 * Measures: Time from fetch to AudioBuffer ready for playback
 *
 * Tests:
 * 1. Audio buffer loading and decoding time
 * 2. Multi-track loading (stems)
 * 3. A/B version loading
 * 4. Memory usage during audio operations
 */

test.describe('WebAudio Load Performance', () => {
  test('measures audio buffer load time (target: <2s for 30s preview)', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    // Navigate to take with completed preview
    await page.goto('/studio/test-project/test-take-with-preview')

    // Inject performance measurement into page context
    const loadMetrics = await page.evaluate(async () => {
      // Wait for audio engine to be available
      // @ts-expect-error - accessing window.audioEngine for testing
      if (!window.audioEngine) {
        throw new Error('AudioEngine not found on window')
      }

      const startTime = performance.now()

      // Trigger audio load (usually happens automatically, but force reload)
      // @ts-expect-error - calling internal method for testing
      await window.audioEngine.loadAllTracks()

      const endTime = performance.now()
      const loadTimeMs = endTime - startTime

      return {
        loadTimeMs,
        loadTimeSeconds: loadTimeMs / 1000,
      }
    })

    console.log(`WebAudio Load Time: ${loadMetrics.loadTimeSeconds.toFixed(3)}s`)

    // Assert against target (<2s)
    expect(loadMetrics.loadTimeSeconds).toBeLessThan(2)
  })

  test('measures play button responsiveness', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    await page.goto('/studio/test-project/test-take-with-preview')

    const playButton = page.getByRole('button', { name: /play/i })
    await expect(playButton).toBeEnabled()

    // Measure time from click to audio actually playing
    const startTime = Date.now()
    await playButton.click()

    // Wait for pause button to appear (indicates audio started)
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible()

    const responseTime = (Date.now() - startTime) / 1000

    console.log(`Play Button Response Time: ${responseTime.toFixed(3)}s`)

    // Should respond near-instantly (<500ms)
    expect(responseTime).toBeLessThan(0.5)
  })

  test('measures A/B version switch latency', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    await page.goto('/studio/test-project/test-take-with-regen')

    // Start playback on Version A
    await page.getByRole('button', { name: /play/i }).click()
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible()

    // Get A/B toggle for first section
    const abToggle = page.getByRole('radiogroup', { name: /version/i }).first()
    await expect(abToggle).toBeVisible()

    // Switch to Version B and measure latency
    const startTime = Date.now()
    await abToggle.getByRole('radio', { name: /version b/i }).click()

    // Wait for switch to complete (audio should continue without gap)
    // We can verify by checking the radio state change
    await expect(abToggle.getByRole('radio', { name: /version b/i })).toBeChecked()

    const switchTime = (Date.now() - startTime) / 1000

    console.log(`A/B Switch Latency: ${switchTime.toFixed(3)}s`)

    // Should switch seamlessly (<200ms for gain crossfade)
    expect(switchTime).toBeLessThan(0.3)

    // Verify audio is still playing (no interruption)
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible()
  })

  test('measures multi-section audio loading', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    await page.goto('/studio/test-project/test-take-with-preview')

    // Measure loading all sections (assume 3 sections × 2 tracks each = 6 audio files)
    const loadMetrics = await page.evaluate(async () => {
      const startTime = performance.now()

      // @ts-expect-error - accessing window.audioEngine
      const engine = window.audioEngine
      if (!engine) throw new Error('AudioEngine not found')

      const trackCount = await engine.loadAllTracks()

      const endTime = performance.now()

      return {
        trackCount,
        totalLoadTimeMs: endTime - startTime,
        totalLoadTimeSeconds: (endTime - startTime) / 1000,
        avgPerTrackMs: (endTime - startTime) / trackCount,
      }
    })

    console.log(`Multi-Section Load:`)
    console.log(`  Total tracks: ${loadMetrics.trackCount}`)
    console.log(`  Total time: ${loadMetrics.totalLoadTimeSeconds.toFixed(3)}s`)
    console.log(`  Avg per track: ${loadMetrics.avgPerTrackMs.toFixed(0)}ms`)

    // Total load time should still be <2s (parallel fetching)
    expect(loadMetrics.totalLoadTimeSeconds).toBeLessThan(2)
  })

  test('measures memory usage during audio operations', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    await page.goto('/studio/test-project/test-take-with-preview')

    // Measure memory before and after audio load
    const memoryMetrics = await page.evaluate(async () => {
      // @ts-expect-error - performance.memory is Chrome-specific
      const getMemory = () => performance.memory?.usedJSHeapSize || 0

      const memoryBefore = getMemory()

      // Load audio
      // @ts-expect-error - accessing window.audioEngine
      await window.audioEngine?.loadAllTracks()

      const memoryAfter = getMemory()
      const memoryIncreaseMB = (memoryAfter - memoryBefore) / 1024 / 1024

      return {
        memoryBeforeMB: memoryBefore / 1024 / 1024,
        memoryAfterMB: memoryAfter / 1024 / 1024,
        memoryIncreaseMB,
      }
    })

    console.log(`Memory Usage:`)
    console.log(`  Before: ${memoryMetrics.memoryBeforeMB.toFixed(2)} MB`)
    console.log(`  After: ${memoryMetrics.memoryAfterMB.toFixed(2)} MB`)
    console.log(`  Increase: ${memoryMetrics.memoryIncreaseMB.toFixed(2)} MB`)

    // Audio buffers should be reasonable (<50MB for 30s preview with stems)
    expect(memoryMetrics.memoryIncreaseMB).toBeLessThan(50)
  })

  test('measures audio seek performance', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    await page.goto('/studio/test-project/test-take-with-preview')

    // Start playback
    await page.getByRole('button', { name: /play/i }).click()
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible()

    // Measure seek latency
    const seekMetrics = await page.evaluate(async () => {
      // @ts-expect-error - accessing window.audioEngine
      const engine = window.audioEngine

      const startTime = performance.now()

      // Seek to 15 seconds (middle of 30s preview)
      await engine.seek(15)

      const endTime = performance.now()

      return {
        seekTimeMs: endTime - startTime,
      }
    })

    console.log(`Seek Latency: ${seekMetrics.seekTimeMs.toFixed(1)}ms`)

    // Seek should be near-instant (<100ms)
    expect(seekMetrics.seekTimeMs).toBeLessThan(100)
  })
})
