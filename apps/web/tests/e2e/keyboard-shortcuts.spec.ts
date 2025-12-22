/**
 * Keyboard Shortcuts E2E Tests
 *
 * Tests keyboard shortcuts functionality in the studio editor:
 * - Space: Play/Pause
 * - L: Lock/Unlock section
 * - R: Regenerate section
 * - Arrow keys: Navigate sections
 * - ?: Show shortcuts panel
 */

import { test, expect } from '@playwright/test'

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to take editor with demo plan ID
    await page.goto('/studio/demo-project/demo-take?planId=demo-plan')

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Take Editor' })).toBeVisible()
  })

  test('should show shortcuts panel when ? is pressed', async ({ page }) => {
    // Press Shift+/ (which is ?)
    await page.keyboard.press('Shift+/')

    // Shortcuts panel should be visible
    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible()

    // Should display all shortcuts in the table
    await expect(page.getByText('Space')).toBeVisible()
    await expect(page.getByText('Play/Pause')).toBeVisible()
    await expect(page.getByText('Lock/Unlock Section')).toBeVisible()

    // Close panel with Close button
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).not.toBeVisible()
  })

  test('should toggle lock state when L is pressed', async ({ page }) => {
    // Click on first section card to focus it
    const firstSection = page.locator('[data-testid="section-card"]').first()
    await firstSection.click()

    // Get the lock button to check its state
    const lockButton = firstSection.getByRole('button', { name: /lock/i }).first()

    // Check initial state (unlocked)
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false')

    // Press L to lock
    await page.keyboard.press('l')

    // Should now be locked
    await expect(lockButton).toHaveAttribute('aria-pressed', 'true')

    // Press L again to unlock
    await page.keyboard.press('L') // Test uppercase too

    // Should be unlocked
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('should navigate sections with arrow keys', async ({ page }) => {
    // Check initial focused section indicator
    const focusedIndicator = page.getByText(/focused section: \d+/i)
    await expect(focusedIndicator).toContainText('Focused section: 1')

    // Press down arrow
    await page.keyboard.press('ArrowDown')
    await expect(focusedIndicator).toContainText('Focused section: 2')

    // Press down arrow again
    await page.keyboard.press('ArrowDown')
    await expect(focusedIndicator).toContainText('Focused section: 3')

    // Press up arrow
    await page.keyboard.press('ArrowUp')
    await expect(focusedIndicator).toContainText('Focused section: 2')

    // Press up arrow again
    await page.keyboard.press('ArrowUp')
    await expect(focusedIndicator).toContainText('Focused section: 1')

    // At first section, up arrow should not go below 1
    await page.keyboard.press('ArrowUp')
    await expect(focusedIndicator).toContainText('Focused section: 1')
  })

  test('should not trigger shortcuts when typing in text field', async ({ page }) => {
    // If there's a lyrics input or any text field on the page
    const textInput = page.locator('input[type="text"]').first()

    // Skip test if no text input exists
    if ((await textInput.count()) === 0) {
      test.skip()
      return
    }

    await textInput.click()
    await textInput.fill('')

    // Type characters that would normally trigger shortcuts
    await textInput.type('Space L R')

    // Shortcuts panel should NOT appear (? wasn't typed, but if it were, it shouldn't trigger)
    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).not.toBeVisible()

    // The text should appear in the input
    await expect(textInput).toHaveValue('Space L R')
  })

  test('should show help button in UI that opens shortcuts panel', async ({ page }) => {
    // Find and click the Help button
    const helpButton = page.getByRole('button', { name: /help.*\?/i })
    await expect(helpButton).toBeVisible()

    await helpButton.click()

    // Shortcuts panel should be visible
    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible()

    // Close with Escape key
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).not.toBeVisible()
  })

  test('should not trigger shortcuts with modifier keys', async ({ page }) => {
    // Focus first section
    const firstSection = page.locator('[data-testid="section-card"]').first()
    await firstSection.click()

    const lockButton = firstSection.getByRole('button', { name: /lock/i }).first()
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false')

    // Press Ctrl+L (should not lock)
    await page.keyboard.press('Control+l')
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false')

    // Press Meta+L (should not lock)
    await page.keyboard.press('Meta+l')
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false')

    // Press Alt+L (should not lock)
    await page.keyboard.press('Alt+l')
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false')

    // Press L without modifiers (should lock)
    await page.keyboard.press('l')
    await expect(lockButton).toHaveAttribute('aria-pressed', 'true')
  })

  test.skip('should play/pause with Space key (requires audio engine)', async ({ page }) => {
    // This test requires the audio engine to be fully loaded
    // Load demo tracks first
    await page.getByRole('button', { name: /load demo/i }).click()

    // Wait for demo tracks to load
    await page.waitForTimeout(1000)

    // Press Space to play
    await page.keyboard.press(' ')

    // Should transition to playing (or attempt to)
    // This might fail if no audio is configured, so we skip by default
  })

  test.skip('should trigger regeneration with R key (requires backend)', async ({ page }) => {
    // This test requires the full backend stack to be running
    // Focus a section
    const firstSection = page.locator('[data-testid="section-card"]').first()
    await firstSection.click()

    // Press R to regenerate
    await page.keyboard.press('r')

    // Should show job timeline or regeneration indicator
    // This requires backend integration, so we skip by default
  })
})
