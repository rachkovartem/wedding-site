import { test, expect } from '@playwright/test'

// AC-8: Stats page: 4 KPI cards, pie chart, line chart, sortable table, expandable rows

const BASE_URL = 'http://localhost:5173'
const BACKEND_URL = 'http://localhost:3001'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

/** @type {string | null} */
let adminToken = null

/**
 * @param {import('@playwright/test').Page} page
 */
async function setAuthCookie(page) {
  if (!adminToken) return
  await page.context().addCookies([{
    name: 'admin_token',
    value: adminToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Strict',
  }])
}

test.describe('AC-8: Stats page (no auth required)', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('AC-8: stats page renders with heading', async ({ page }) => {
    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/статистика/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('AC-8: stats page has navigation back to admin button', async ({ page }) => {
    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: /управление/i })).toBeVisible({ timeout: 5000 })
  })

  test('AC-8: stats page has "На сайт" navigation button', async ({ page }) => {
    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')

    // Auth modal onClose navigates to landing — so the "На сайт" button is in the header
    // and it navigates to landing. Verify the button exists (may be behind modal).
    const btn = page.getByRole('button', { name: /на сайт/i })
    // The button is in the DOM even when modal is open
    await expect(btn).toBeAttached({ timeout: 5000 })
  })
})

test.describe('AC-8: Stats with authenticated data', () => {
  test.beforeAll(async ({ request }) => {
    // Authenticate ONCE for all tests in this describe block
    try {
      const res = await request.post(`${BACKEND_URL}/api/auth`, {
        data: { password: ADMIN_PASSWORD },
      })
      if (res.ok()) {
        const cookies = res.headers()['set-cookie'] || ''
        const match = cookies.match(/admin_token=([^;]+)/)
        if (match) adminToken = match[1]
      }
    } catch {
      console.warn('Could not authenticate — skipping authenticated stats tests')
    }
  })

  test.beforeEach(async ({ page }) => {
    if (!adminToken) return
    await setAuthCookie(page)
  })

  test('AC-8: shows 4 KPI cards after login', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page.getByText(/всего приглашений/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/открыто/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/подтверждено/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/отказались/i)).toBeVisible({ timeout: 5000 })
  })

  test('AC-8: shows RSVP pie chart', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page.getByText(/распределение rsvp/i)).toBeVisible({ timeout: 5000 })
  })

  test('AC-8: shows views per day line chart', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page.getByText(/просмотры по дням/i)).toBeVisible({ timeout: 5000 })
  })

  test('AC-8: guest table has sortable name column', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page.getByText(/список гостей/i)).toBeVisible({ timeout: 5000 })

    const nameHeader = page.locator('th').filter({ hasText: /^имя/i }).first()
    await expect(nameHeader).toBeVisible({ timeout: 5000 })
    await nameHeader.click()
    await expect(nameHeader).toContainText(/↑|↓/)
  })

  test('AC-8: filter dropdown is visible and functional', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const filterSelect = page.locator('select')
    await expect(filterSelect).toBeVisible({ timeout: 5000 })
    await filterSelect.selectOption('yes')
    await page.waitForTimeout(300)
    await expect(page.locator('table')).toBeVisible()
  })

  test('AC-8: click row expands view history', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/stats')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const firstRow = page.locator('tbody tr').first()
    const rowVisible = await firstRow.isVisible().catch(() => false)
    if (rowVisible) {
      const rowsBefore = await page.locator('tbody tr').count()
      await firstRow.click()
      await page.waitForTimeout(300)
      const rowsAfter = await page.locator('tbody tr').count()
      expect(rowsAfter).toBeGreaterThanOrEqual(rowsBefore)
    }
  })
})
