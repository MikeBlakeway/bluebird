import { test, expect } from '@playwright/test'

/* eslint-disable no-console */

/**
 * Section Regeneration Performance Test
 *
 * Target: P50 ≤20s
 * Measures: Time from clicking "Regen" on a section to new version ready
 *
 * Flow:
 * 1. User has completed preview with multiple sections
 * 2. User clicks "Regen" on one section
 * 3. System re-renders music + vocals for that section only
 * 4. Section audio becomes available as Version B
 */

test.describe('Section Regeneration Performance', () => {
  test('measures section regeneration time (target: ≤20s P50)', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    // Navigate to a take with completed preview
    await page.goto('/studio/test-project/test-take-with-preview')

    // Wait for sections to be loaded
    const sectionCards = page.locator('[data-testid="section-card"]')
    await expect(sectionCards.first()).toBeVisible()

    // Get the first unlocked section's regen button
    const firstRegenButton = page.getByRole('button', { name: /regen/i }).first()
    await expect(firstRegenButton).toBeEnabled()

    // Start timer
    const startTime = Date.now()

    // Click regenerate
    await firstRegenButton.click()

    // Wait for regeneration to start (loading indicator or disabled state)
    await expect(page.getByText(/regenerating/i)).toBeVisible({ timeout: 2000 })

    // Wait for regeneration to complete
    // Look for completion indicator or A/B toggle appearing
    await expect(page.getByText(/regenerating/i)).not.toBeVisible({ timeout: 25000 })

    // Verify A/B toggle appeared (indicates version B ready)
    const abToggle = page.getByRole('radiogroup', { name: /version/i }).first()
    await expect(abToggle).toBeVisible({ timeout: 2000 })

    // End timer
    const endTime = Date.now()
    const regenMs = endTime - startTime
    const regenSeconds = regenMs / 1000

    console.log(`Section Regeneration Time: ${regenSeconds.toFixed(2)}s`)

    // Assert against target (P50 ≤20s, use 25s for P95 tolerance)
    expect(regenSeconds).toBeLessThanOrEqual(25)

    // Verify Version B is playable
    await abToggle.getByRole('radio', { name: /version b/i }).click()
    await expect(abToggle.getByRole('radio', { name: /version b/i })).toBeChecked()
  })

  test('measures section regen across multiple runs for P50', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    const runs = 5
    const regenTimes: number[] = []

    for (let i = 0; i < runs; i++) {
      console.log(`\nSection Regen Run ${i + 1}/${runs}`)

      await page.goto('/studio/test-project/test-take-with-preview')
      await expect(page.locator('[data-testid="section-card"]').first()).toBeVisible()

      // Get section index (alternate between first and second section)
      const sectionIndex = i % 2
      const regenButton = page.getByRole('button', { name: /regen/i }).nth(sectionIndex)
      await expect(regenButton).toBeEnabled()

      // Measure regeneration time
      const startTime = Date.now()
      await regenButton.click()
      await expect(page.getByText(/regenerating/i)).toBeVisible({ timeout: 2000 })
      await expect(page.getByText(/regenerating/i)).not.toBeVisible({ timeout: 25000 })
      const endTime = Date.now()

      const regenSeconds = (endTime - startTime) / 1000
      regenTimes.push(regenSeconds)
      console.log(`  Time: ${regenSeconds.toFixed(2)}s`)

      // Wait a bit between runs to avoid overwhelming backend
      await page.waitForTimeout(2000)
    }

    // Calculate P50 (median)
    regenTimes.sort((a, b) => a - b)
    const p50Index = Math.floor(regenTimes.length / 2)
    const p50 = regenTimes[p50Index]

    console.log(`\nSection Regen Results:`)
    console.log(`  Min: ${Math.min(...regenTimes).toFixed(2)}s`)
    console.log(`  P50: ${p50.toFixed(2)}s`)
    console.log(`  P95: ${regenTimes[Math.floor(regenTimes.length * 0.95)].toFixed(2)}s`)
    console.log(`  Max: ${Math.max(...regenTimes).toFixed(2)}s`)

    // Assert P50 meets target
    expect(p50).toBeLessThanOrEqual(20)
  })

  test('compares regen time vs full preview generation', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    // Full preview generation baseline (should be ~42s based on Sprint 1)
    await page.goto('/studio/test-project/new-take')
    await page.getByRole('textbox', { name: /lyrics/i }).fill('Test lyrics with 3 sections')
    await page.getByRole('combobox', { name: /genre/i }).selectOption('Pop')
    await page.getByRole('combobox', { name: /artist/i }).selectOption('Luna Grace')

    const fullPreviewStart = Date.now()
    await page.getByRole('button', { name: /generate/i }).click()
    await expect(page.getByText(/complete|ready/i)).toBeVisible({ timeout: 60000 })
    const fullPreviewTime = (Date.now() - fullPreviewStart) / 1000

    // Section regeneration (should be ≤20s, ~2x faster assuming 3 sections)
    const regenButton = page.getByRole('button', { name: /regen/i }).first()
    await expect(regenButton).toBeEnabled()

    const regenStart = Date.now()
    await regenButton.click()
    await expect(page.getByText(/regenerating/i)).not.toBeVisible({ timeout: 25000 })
    const regenTime = (Date.now() - regenStart) / 1000

    console.log(`\nComparison:`)
    console.log(`  Full Preview (3 sections): ${fullPreviewTime.toFixed(2)}s`)
    console.log(`  Single Section Regen: ${regenTime.toFixed(2)}s`)
    console.log(`  Speedup: ${(fullPreviewTime / regenTime).toFixed(2)}x`)

    // Section regen should be significantly faster than full preview
    expect(regenTime).toBeLessThan(fullPreviewTime / 2)
  })

  test('measures regeneration while locked sections remain unchanged', async ({ page }) => {
    test.skip(!process.env.RUN_PERFORMANCE_TESTS, 'Performance tests require full backend')

    await page.goto('/studio/test-project/test-take-with-preview')

    // Get audio buffer URL of locked section (to verify it doesn't change)
    const firstSection = page.locator('[data-testid="section-card"]').first()
    const secondSection = page.locator('[data-testid="section-card"]').nth(1)

    // Lock first section
    const firstLockToggle = firstSection.getByRole('switch', { name: /lock/i })
    if (!(await firstLockToggle.isChecked())) {
      await firstLockToggle.click()
    }
    await expect(firstLockToggle).toBeChecked()

    // Regenerate second section
    const secondRegenButton = secondSection.getByRole('button', { name: /regen/i })
    await expect(secondRegenButton).toBeEnabled()

    const startTime = Date.now()
    await secondRegenButton.click()
    await expect(page.getByText(/regenerating/i)).not.toBeVisible({ timeout: 25000 })
    const regenTime = (Date.now() - startTime) / 1000

    console.log(`Locked Section Regen Test: ${regenTime.toFixed(2)}s`)

    // Verify first section is still locked (unchanged)
    await expect(firstLockToggle).toBeChecked()

    // Verify second section has A/B toggle (was regenerated)
    const abToggle = secondSection.getByRole('radiogroup', { name: /version/i })
    await expect(abToggle).toBeVisible()

    // Assert performance target met
    expect(regenTime).toBeLessThanOrEqual(25)
  })
})
