import type { Page } from '@playwright/test'

/**
 * Authentication helpers for E2E tests
 */

/**
 * Sets up authenticated session by injecting JWT token
 * This bypasses the magic link flow for faster E2E tests
 *
 * @param page - Playwright page instance
 * @param email - User email
 * @param tier - User tier (standard, pro, admin)
 */
export async function setupAuthenticatedSession(
  page: Page,
  email: string,
  tier: 'standard' | 'pro' | 'admin' = 'standard'
) {
  // In a real implementation, this would:
  // 1. Call a test-only API endpoint to generate a JWT
  // 2. Inject the JWT into browser storage or cookies
  // 3. Navigate to the authenticated route

  // For now, this is a placeholder that documents the intended behavior
  // TODO: Implement test-only auth endpoint in apps/api/src/routes/test-auth.ts

  await page.goto('/')

  // Inject mock JWT into localStorage (example)
  await page.evaluate(
    ({ email, tier }) => {
      // This is a simplified example - actual JWT would come from API
      const mockJWT = btoa(JSON.stringify({ email, tier, exp: Date.now() + 3600000 }))
      localStorage.setItem('auth_token', mockJWT)
    },
    { email, tier }
  )

  // Alternatively, set httpOnly cookie if that's the auth mechanism
  // await page.context().addCookies([
  //   {
  //     name: 'token',
  //     value: mockJWT,
  //     domain: 'localhost',
  //     path: '/',
  //     httpOnly: true,
  //     secure: false,
  //     sameSite: 'Lax',
  //   },
  // ])
}

/**
 * Creates a test project and returns its ID
 * Useful for setting up test state before running specific flows
 */
export async function createTestProject(
  page: Page,
  projectName: string = 'Test Project'
): Promise<string> {
  // Call API directly to create project (faster than UI interaction)
  // TODO: Implement when API client is available in test context

  const response = await page.request.post('/api/projects', {
    data: { name: projectName },
  })

  const data = await response.json()
  return data.projectId
}

/**
 * Creates a test take with lyrics and returns project/take IDs
 */
export async function createTestTake(
  page: Page,
  lyrics: string,
  genre: string = 'Pop',
  artist: string = 'Luna Grace'
): Promise<{ projectId: string; takeId: string }> {
  // Create project first
  const projectId = await createTestProject(page)

  // Create take via API
  const response = await page.request.post(`/api/projects/${projectId}/takes`, {
    data: { lyrics, genre, artist },
  })

  const data = await response.json()
  return { projectId, takeId: data.takeId }
}
