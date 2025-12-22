import type { Page, Locator } from '@playwright/test'

/**
 * Page Object Model for the Take Editor page (lyrics → preview → export)
 */
export class TakeEditorPage {
  readonly page: Page
  readonly lyricsTextarea: Locator
  readonly genreSelect: Locator
  readonly artistSelect: Locator
  readonly generateButton: Locator
  readonly jobTimeline: Locator
  readonly playButton: Locator
  readonly pauseButton: Locator
  readonly exportButton: Locator
  readonly downloadLink: Locator
  readonly sectionCards: Locator
  readonly regenButton: Locator
  readonly lockToggle: Locator
  readonly abToggle: Locator

  constructor(page: Page) {
    this.page = page
    this.lyricsTextarea = page.getByRole('textbox', { name: /lyrics/i })
    this.genreSelect = page.getByRole('combobox', { name: /genre/i })
    this.artistSelect = page.getByRole('combobox', { name: /artist|vocalist/i })
    this.generateButton = page.getByRole('button', { name: /generate|create preview/i })
    this.jobTimeline = page.getByRole('region', { name: /job timeline|progress/i })
    this.playButton = page.getByRole('button', { name: /play/i })
    this.pauseButton = page.getByRole('button', { name: /pause/i })
    this.exportButton = page.getByRole('button', { name: /export/i })
    this.downloadLink = page.getByRole('link', { name: /download/i })
    this.sectionCards = page.locator('[data-testid="section-card"]')
    this.regenButton = page.getByRole('button', { name: /regen/i }).first()
    this.lockToggle = page.getByRole('switch', { name: /lock/i }).first()
    this.abToggle = page.getByRole('radiogroup', { name: /version/i }).first()
  }

  async goto(projectId: string, takeId: string) {
    await this.page.goto(`/studio/${projectId}/${takeId}`)
  }

  async enterLyrics(lyrics: string) {
    await this.lyricsTextarea.fill(lyrics)
  }

  async selectGenre(genre: string) {
    await this.genreSelect.selectOption({ label: genre })
  }

  async selectArtist(artist: string) {
    await this.artistSelect.selectOption({ label: artist })
  }

  async clickGenerate() {
    await this.generateButton.click()
  }

  async waitForJobComplete() {
    // Wait for job completion indicator (adjust selector based on actual UI)
    await this.page.getByText(/complete|ready/i).waitFor({ state: 'visible', timeout: 60000 })
  }

  async playAudio() {
    await this.playButton.click()
  }

  async pauseAudio() {
    await this.pauseButton.click()
  }

  async clickExport() {
    await this.exportButton.click()
  }

  async waitForDownloadReady() {
    await this.downloadLink.waitFor({ state: 'visible', timeout: 30000 })
  }

  async regenerateFirstSection() {
    await this.regenButton.click()
  }

  async lockFirstSection() {
    await this.lockToggle.click()
  }

  async switchToVersionB() {
    await this.abToggle.getByRole('radio', { name: /version b/i }).click()
  }

  async getSectionCount(): Promise<number> {
    return await this.sectionCards.count()
  }
}
