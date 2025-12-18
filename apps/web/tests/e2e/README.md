# E2E Tests - Bluebird Web App

This directory contains end-to-end (E2E) tests for the Bluebird web application using Playwright.

## Setup

Playwright is already installed as a dev dependency. To install browser binaries:

```bash
pnpm exec playwright install chromium
```

## Running Tests

### Run all E2E tests

```bash
pnpm test:e2e
```

### Run specific test file

```bash
pnpm exec playwright test preview-flow.spec.ts
```

### Run with UI mode (interactive)

```bash
pnpm exec playwright test --ui
```

### Run in headed mode (see browser)

```bash
pnpm exec playwright test --headed
```

### Debug mode

```bash
pnpm exec playwright test --debug
```

## Test Structure

```bash
tests/
├── e2e/
│   ├── page-objects/       # Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── WorkspacePage.ts
│   │   └── TakeEditorPage.ts
│   ├── helpers/            # Test utilities
│   │   └── auth.ts
│   └── *.spec.ts           # Test specs
└── fixtures/               # Test data
    └── test-data.ts
```

## Page Object Models

We use the Page Object Model (POM) pattern to keep tests maintainable:

- **LoginPage**: Handles authentication flow
- **WorkspacePage**: Project list and creation
- **TakeEditorPage**: Lyrics entry, preview generation, playback, export

## Test Data Fixtures

Located in `tests/fixtures/test-data.ts`:

- `testLyrics`: Various lyric samples (simple, full, short)
- `testGenres`: Available genres for selection
- `testArtists`: Available AI artists
- `testUsers`: Test user accounts with different tiers
- `testProjects`: Project templates

## Current Limitations

### Authentication

The tests currently have placeholder auth logic. To run full E2E tests, you need to:

1. **Option A: Magic Link Interception**
   - Set up email interception (e.g., MailHog, Ethereal)
   - Extract magic link from email during test
   - Navigate to magic link URL

2. **Option B: Test Auth Endpoint** (Recommended)
   - Create a test-only API endpoint: `POST /api/test/auth`
   - Endpoint generates valid JWT for test users
   - Only enabled in test/development environments
   - Tests inject JWT into browser storage/cookies

3. **Option C: Database Seeding**
   - Seed test database with known user + session token
   - Tests use pre-authenticated session

### Prerequisites for Full E2E Tests

- [ ] API server running (`pnpm --filter @bluebird/api dev`)
- [ ] Web server running (`pnpm --filter @bluebird/web dev`)
- [ ] Database seeded with test data
- [ ] Auth bypass mechanism implemented
- [ ] Test environment variables configured

## Configuration

See `playwright.config.ts` for:

- Base URL: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- Browser: Chromium (can add Firefox/WebKit)
- Retries: 2 on CI, 0 locally
- Parallelization: Disabled on CI, enabled locally
- Screenshots: Only on failure
- Video: Retained on failure
- Trace: On first retry

## Reports

After running tests:

```bash
pnpm exec playwright show-report
```

This opens an HTML report with:

- Test results
- Screenshots on failure
- Videos on failure
- Execution traces

## CI Integration

E2E tests run on:

- Pull requests to `develop`
- `release/*` branches
- `main` branch (before production deploy)

CI configuration:

- Single worker (no parallelization)
- 2 retries for flaky tests
- HTML + GitHub reporter
- Artifacts uploaded on failure

## Writing New Tests

1. **Create Page Object** (if needed):

   ```typescript
   // tests/e2e/page-objects/MyPage.ts
   import type { Page, Locator } from '@playwright/test'

   export class MyPage {
     readonly page: Page
     readonly myButton: Locator

     constructor(page: Page) {
       this.page = page
       this.myButton = page.getByRole('button', { name: /my button/i })
     }

     async goto() {
       await this.page.goto('/my-route')
     }
   }
   ```

2. **Write Test Spec**:

   ```typescript
   // tests/e2e/my-feature.spec.ts
   import { test, expect } from '@playwright/test'
   import { MyPage } from './page-objects'

   test('my feature works', async ({ page }) => {
     const myPage = new MyPage(page)
     await myPage.goto()
     await myPage.myButton.click()
     await expect(page.getByText('Success')).toBeVisible()
   })
   ```

3. **Add Test Data** (if needed):

   ```typescript
   // tests/fixtures/test-data.ts
   export const myTestData = {
     // ...
   }
   ```

## Best Practices

✅ **Do:**

- Use Page Object Models for reusable components
- Use semantic locators (getByRole, getByLabel, getByText)
- Wait for elements with `waitFor()` or `expect().toBeVisible()`
- Use test fixtures for data
- Keep tests independent (no shared state)
- Test critical user paths

❌ **Don't:**

- Use CSS selectors or XPath (brittle)
- Use hardcoded waits (`page.waitForTimeout(5000)`)
- Depend on test execution order
- Test implementation details
- Mix unit/integration logic into E2E tests

## Debugging Tips

1. **Run in headed mode**: `--headed` flag shows browser
2. **Use debug mode**: `--debug` opens Playwright Inspector
3. **Check screenshots**: Located in `test-results/` on failure
4. **View trace**: `pnpm exec playwright show-trace trace.zip`
5. **Add breakpoints**: Use `await page.pause()` in test code

## Performance

- E2E tests are slower than unit/integration tests
- Expected runtime: 2-5 minutes for full suite
- Parallelize tests where possible (independent scenarios)
- Use `test.describe.configure({ mode: 'parallel' })` for test groups

## Future Enhancements

- [ ] Visual regression testing (Percy, Playwright screenshots)
- [ ] Cross-browser testing (Firefox, Safari/WebKit)
- [ ] Mobile viewport testing
- [ ] Accessibility testing (axe-core integration)
- [ ] Performance testing (Lighthouse integration)
- [ ] API mocking for faster tests (MSW)
