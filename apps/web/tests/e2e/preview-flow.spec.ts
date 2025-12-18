import { test, expect } from '@playwright/test'
import { LoginPage, WorkspacePage, TakeEditorPage } from './page-objects'
import { testLyrics, testUsers, testProjects } from '../fixtures'

/**
 * E2E test: Complete preview flow from signup to audio preview
 *
 * Flow:
 * 1. User signs up with email
 * 2. Creates a new project
 * 3. Enters lyrics, selects genre and artist
 * 4. Generates preview
 * 5. Waits for job completion
 * 6. Plays audio preview
 */

test.describe('Preview Flow E2E', () => {
  test('user can sign up and generate audio preview', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const workspacePage = new WorkspacePage(page)
    const takeEditorPage = new TakeEditorPage(page)

    // Step 1: Sign up / Login
    await loginPage.goto()
    await loginPage.login(testUsers.standard.email)
    await loginPage.waitForMagicLinkSent()

    // In E2E tests, we would normally intercept the magic link email
    // For now, we'll skip to the authenticated state
    // TODO: Set up auth bypass for E2E tests (JWT injection or test magic link)

    // Step 2: Create a new project
    await workspacePage.goto()
    const projectId = await workspacePage.createProject(testProjects.withLyrics.name)
    expect(projectId).toBeTruthy()

    // Step 3: Enter lyrics and select options
    // The TakeEditorPage URL will be set after project creation navigates to it
    await expect(page).toHaveURL(new RegExp(`/studio/${projectId}/[^/]+`))

    await takeEditorPage.enterLyrics(testLyrics.simple)
    await takeEditorPage.selectGenre('Pop')
    await takeEditorPage.selectArtist('Luna Grace')

    // Step 4: Generate preview
    await takeEditorPage.clickGenerate()

    // Step 5: Wait for job to complete
    // The job timeline should show progress and eventually complete
    await expect(takeEditorPage.jobTimeline).toBeVisible()
    await takeEditorPage.waitForJobComplete()

    // Step 6: Verify sections are rendered
    const sectionCount = await takeEditorPage.getSectionCount()
    expect(sectionCount).toBeGreaterThan(0)

    // Step 7: Play audio
    await takeEditorPage.playAudio()
    await expect(takeEditorPage.pauseButton).toBeVisible()

    // Pause to verify control works
    await takeEditorPage.pauseAudio()
    await expect(takeEditorPage.playButton).toBeVisible()
  })

  test('user can regenerate a section', async ({ page }) => {
    const takeEditorPage = new TakeEditorPage(page)

    // Assume we're already authenticated and have a take loaded
    // TODO: Set up proper test state (auth + existing take)

    // Navigate to an existing take
    // await takeEditorPage.goto(testProjectId, testTakeId)

    // Lock first section (so we can test it doesn't regenerate)
    await takeEditorPage.lockFirstSection()
    await expect(takeEditorPage.lockToggle).toBeChecked()

    // Unlock and regenerate
    await takeEditorPage.lockFirstSection() // Toggle off
    await expect(takeEditorPage.lockToggle).not.toBeChecked()

    await takeEditorPage.regenerateFirstSection()

    // Wait for regeneration to complete
    await expect(page.getByText(/regenerating/i)).toBeVisible()
    await expect(page.getByText(/regenerating/i)).not.toBeVisible({ timeout: 30000 })

    // Verify A/B toggle appears
    await expect(takeEditorPage.abToggle).toBeVisible()
  })

  test('user can compare versions A and B', async ({ page }) => {
    const takeEditorPage = new TakeEditorPage(page)

    // Assume section has been regenerated (Version B exists)
    // TODO: Set up test state with regenerated section

    // Switch to Version B
    await takeEditorPage.switchToVersionB()
    await expect(page.getByRole('radio', { name: /version b/i })).toBeChecked()

    // Play Version B
    await takeEditorPage.playAudio()
    await expect(takeEditorPage.pauseButton).toBeVisible()

    // Switch back to Version A while playing
    await page.getByRole('radio', { name: /version a/i }).click()
    await expect(page.getByRole('radio', { name: /version a/i })).toBeChecked()

    // Audio should still be playing (seamless switch)
    await expect(takeEditorPage.pauseButton).toBeVisible()
  })

  test('user can export final mix', async ({ page }) => {
    const takeEditorPage = new TakeEditorPage(page)

    // Assume we have a completed preview
    // TODO: Set up test state with completed take

    // Click export
    await takeEditorPage.clickExport()

    // Wait for export job to complete
    await takeEditorPage.waitForDownloadReady()

    // Verify download link is available
    await expect(takeEditorPage.downloadLink).toBeVisible()

    // Optionally: trigger download and verify file
    // const [download] = await Promise.all([
    //   page.waitForEvent('download'),
    //   takeEditorPage.downloadLink.click(),
    // ])
    // expect(download.suggestedFilename()).toMatch(/\.wav$|\.mp3$/)
  })
})
