import type { Page, Locator } from '@playwright/test'

/**
 * Page Object Model for the login/signup page
 */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly submitButton: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByRole('textbox', { name: /email/i })
    this.submitButton = page.getByRole('button', { name: /continue|sign in/i })
    this.successMessage = page.getByText(/check your email|magic link sent/i)
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string) {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }

  async waitForMagicLinkSent() {
    await this.successMessage.waitFor({ state: 'visible' })
  }
}
