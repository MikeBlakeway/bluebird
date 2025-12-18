import type { Page, Locator } from '@playwright/test'

/**
 * Page Object Model for the workspace page (project list)
 */
export class WorkspacePage {
  readonly page: Page
  readonly newProjectButton: Locator
  readonly projectNameInput: Locator
  readonly createButton: Locator
  readonly projectList: Locator

  constructor(page: Page) {
    this.page = page
    this.newProjectButton = page.getByRole('button', { name: /new project|create project/i })
    this.projectNameInput = page.getByRole('textbox', { name: /project name/i })
    this.createButton = page.getByRole('button', { name: /create/i })
    this.projectList = page.getByRole('list', { name: /projects/i })
  }

  async goto() {
    await this.page.goto('/workspace')
  }

  async createProject(name: string): Promise<string> {
    await this.newProjectButton.click()
    await this.projectNameInput.fill(name)
    await this.createButton.click()

    // Wait for navigation to project page and extract projectId from URL
    await this.page.waitForURL(/\/workspace\/[^/]+/)
    const url = this.page.url()
    const match = url.match(/\/workspace\/([^/]+)/)
    return match?.[1] || ''
  }

  async openProject(projectName: string) {
    await this.page.getByRole('link', { name: projectName }).click()
  }

  async waitForProjectToAppear(projectName: string) {
    await this.page.getByRole('link', { name: projectName }).waitFor({ state: 'visible' })
  }
}
