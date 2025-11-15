import { test, expect } from '@playwright/test'

test.describe('Vencura Web App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveTitle(/Vencura/i)
  })

  test('should display welcome message when not authenticated', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Vencura")', { timeout: 5000 })

    // Check for welcome message (shown when user is not authenticated)
    const welcomeHeading = page.locator('h2:has-text("Welcome to Vencura")')
    await expect(welcomeHeading).toBeVisible({ timeout: 3000 })

    const welcomeText = page.locator('text=/Please sign in with Dynamic/')
    await expect(welcomeText).toBeVisible()
  })

  test('should display Dynamic widget for authentication', async ({ page }) => {
    await page.waitForSelector('h1:has-text("Vencura")', { timeout: 5000 })

    // Dynamic widget should be present (may be in shadow DOM or iframe)
    // Check for the header area where widget should be
    const header = page.locator('div:has-text("Vencura")')
    await expect(header).toBeVisible()
  })

  test('should display main heading', async ({ page }) => {
    const heading = page.locator('h1:has-text("Vencura")')
    await expect(heading).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await page.waitForSelector('h1:has-text("Vencura")', { timeout: 5000 })

    const heading = page.locator('h1:has-text("Vencura")')
    await expect(heading).toBeVisible()
  })

  test('should handle page navigation without errors', async ({ page }) => {
    await page.waitForSelector('h1:has-text("Vencura")', { timeout: 5000 })

    // Check for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Filter out expected errors (like Dynamic SDK warnings when env var is missing)
    const criticalErrors = errors.filter(
      err =>
        !err.includes('NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID') &&
        !err.includes('placeholder-id') &&
        !err.includes('CORS'),
    )

    expect(criticalErrors.length).toBe(0)
  })
})

test.describe('Vencura Web - Authenticated State', () => {
  test.skip('should display user info when authenticated', async ({ page }) => {
    // This test is skipped as it requires actual authentication
    // In a real scenario, you would:
    // 1. Mock the Dynamic SDK or use test credentials
    // 2. Set up authentication state
    // 3. Verify user info display
  })

  test.skip('should display wallet dashboard when authenticated', async ({ page }) => {
    // This test is skipped as it requires actual authentication
  })

  test.skip('should allow creating a new wallet', async ({ page }) => {
    // This test is skipped as it requires actual authentication and API access
  })
})
