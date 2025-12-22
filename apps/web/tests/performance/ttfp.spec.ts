import { test, expect } from '@playwright/test'

/* eslint-disable no-console */

/**
 * TTFP (Time to First Preview) Performance Test
 *
 * Target: P50 ≤45s
 * Measures: End-to-end time from clicking "Generate" to audio preview ready
 *
 * Flow:
 * 1. User enters lyrics
 * 2. Selects genre and artist
 * 3. Clicks "Generate"
 * 4. System runs: plan → music render → vocal render → mix
 * 5. Audio preview becomes available
 */

test.describe('TTFP Performance', () => {
  test('measures time to first preview (target: ≤45s P50)', async ({ page }) => {
    // Skip this test if backend is not running
    // In real implementation, ensure API and workers are running
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    // Navigate to take editor (assume authenticated with test helper)
    await page.goto('/studio/test-project/test-take')

    // Enter test lyrics
    const lyricsTextarea = page.getByRole('textbox', { name: /lyrics/i })
    await lyricsTextarea.fill(`Verse 1:
Walking down the street
Feeling the beat

Chorus:
This is my song
Singing all day long`)

    // Select genre and artist
    await page.getByRole('combobox', { name: /genre/i }).selectOption('Pop')
    await page.getByRole('combobox', { name: /artist/i }).selectOption('Luna Grace')

    // Start timer
    const startTime = Date.now()

    // Click generate button
    await page.getByRole('button', { name: /generate|create preview/i }).click()

    // Wait for job timeline to appear
    await expect(page.getByRole('region', { name: /job timeline|progress/i })).toBeVisible()

    // Wait for preview to complete
    // Look for "complete" or "ready" status
    await expect(page.getByText(/complete|ready/i)).toBeVisible({ timeout: 60000 })

    // Wait for audio to be loaded and playable
    const playButton = page.getByRole('button', { name: /play/i })
    await expect(playButton).toBeEnabled({ timeout: 5000 })

    // End timer
    const endTime = Date.now()
    const ttfpMs = endTime - startTime
    const ttfpSeconds = ttfpMs / 1000

    // Log result
    console.log(`TTFP: ${ttfpSeconds.toFixed(2)}s`)

    // Assert against target (P50 ≤45s, use 50s for P95 tolerance)
    expect(ttfpSeconds).toBeLessThanOrEqual(50)

    // Verify audio is actually playable
    await playButton.click()
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible({ timeout: 2000 })
  })

  test('measures TTFP across multiple runs for P50 calculation', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    const runs = 5
    const ttfpTimes: number[] = []

    for (let i = 0; i < runs; i++) {
      console.log(`\nTTFP Run ${i + 1}/${runs}`)

      // Navigate to fresh take
      await page.goto('/studio/test-project/test-take-' + i)

      // Enter lyrics
      await page.getByRole('textbox', { name: /lyrics/i }).fill('Test lyrics for run ' + i)
      await page.getByRole('combobox', { name: /genre/i }).selectOption('Pop')
      await page.getByRole('combobox', { name: /artist/i }).selectOption('Luna Grace')

      // Measure TTFP
      const startTime = Date.now()
      await page.getByRole('button', { name: /generate/i }).click()
      await expect(page.getByText(/complete|ready/i)).toBeVisible({ timeout: 60000 })
      await expect(page.getByRole('button', { name: /play/i })).toBeEnabled({ timeout: 5000 })
      const endTime = Date.now()

      const ttfpSeconds = (endTime - startTime) / 1000
      ttfpTimes.push(ttfpSeconds)
      console.log(`  Time: ${ttfpSeconds.toFixed(2)}s`)
    }

    // Calculate P50 (median)
    ttfpTimes.sort((a, b) => a - b)
    const p50Index = Math.floor(ttfpTimes.length / 2)
    const p50 = ttfpTimes[p50Index]

    console.log(`\nTTFP Results:`)
    console.log(`  Min: ${Math.min(...ttfpTimes).toFixed(2)}s`)
    console.log(`  P50: ${p50.toFixed(2)}s`)
    console.log(`  P95: ${ttfpTimes[Math.floor(ttfpTimes.length * 0.95)].toFixed(2)}s`)
    console.log(`  Max: ${Math.max(...ttfpTimes).toFixed(2)}s`)

    // Assert P50 meets target
    expect(p50).toBeLessThanOrEqual(45)
  })

  test('measures individual pipeline stages', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    await page.goto('/studio/test-project/test-take')

    // Enter lyrics and generate
    await page.getByRole('textbox', { name: /lyrics/i }).fill('Test lyrics')
    await page.getByRole('combobox', { name: /genre/i }).selectOption('Pop')
    await page.getByRole('combobox', { name: /artist/i }).selectOption('Luna Grace')

    const stages: Record<string, number> = {}
    const startTime = Date.now()

    // Click generate
    await page.getByRole('button', { name: /generate/i }).click()

    // Wait for planning stage
    await expect(page.getByText(/planning|analyzing/i)).toBeVisible({ timeout: 15000 })
    stages.planning = (Date.now() - startTime) / 1000

    // Wait for music render stage
    await expect(page.getByText(/rendering music|music synthesis/i)).toBeVisible({ timeout: 25000 })
    stages.musicStart = (Date.now() - startTime) / 1000

    // Wait for vocal render stage
    await expect(page.getByText(/rendering vocals|vocal synthesis/i)).toBeVisible({
      timeout: 35000,
    })
    stages.vocalStart = (Date.now() - startTime) / 1000

    // Wait for mixing stage
    await expect(page.getByText(/mixing|finalizing/i)).toBeVisible({ timeout: 45000 })
    stages.mixStart = (Date.now() - startTime) / 1000

    // Wait for completion
    await expect(page.getByText(/complete|ready/i)).toBeVisible({ timeout: 60000 })
    stages.complete = (Date.now() - startTime) / 1000

    console.log('\nPipeline Stage Timings:')
    console.log(`  Planning started: ${stages.planning.toFixed(2)}s`)
    console.log(`  Music render started: ${stages.musicStart.toFixed(2)}s`)
    console.log(`  Vocal render started: ${stages.vocalStart.toFixed(2)}s`)
    console.log(`  Mixing started: ${stages.mixStart.toFixed(2)}s`)
    console.log(`  Completed: ${stages.complete.toFixed(2)}s`)
    console.log(`  Total: ${stages.complete.toFixed(2)}s`)

    // Verify total time meets target
    expect(stages.complete).toBeLessThanOrEqual(50)
  })
})
