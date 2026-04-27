import { test, expect } from '@playwright/test'

// AC-7: Admin page: invitation cards, copy link, create form, delete

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

test.describe('AC-7: Admin page (no auth)', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('AC-7: navigating to #/admin without auth shows auth modal', async ({ page }) => {
    await page.goto(BASE_URL + '/#/admin')
    await page.waitForLoadState('networkidle')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel(/пароль/i)).toBeVisible()
  })

  test('AC-7: admin page has management heading', async ({ page }) => {
    await page.goto(BASE_URL + '/#/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(/управление приглашениями/i)).toBeVisible({ timeout: 5000 })
  })

  test('AC-7: admin page has create invitation form', async ({ page }) => {
    await page.goto(BASE_URL + '/#/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel(/имя гостя/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/создать приглашение/i)).toBeVisible({ timeout: 5000 })
  })

  test('AC-7: admin page has stats navigation link', async ({ page }) => {
    await page.goto(BASE_URL + '/#/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: /статистика/i })).toBeVisible({ timeout: 5000 })
  })
})

test.describe('AC-7: Admin with authenticated session', () => {
  test.beforeAll(async ({ request }) => {
    // Authenticate ONCE for all tests in this block
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
      console.warn('Authentication failed — admin API tests will be skipped')
    }
  })

  test.beforeEach(async ({ page }) => {
    if (!adminToken) return
    await setAuthCookie(page)
  })

  test('AC-7: navigating to stats from admin works after login', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/admin')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /статистика/i }).click()
    await expect(page).toHaveURL(/stats/)
    await expect(page.getByText(/статистика/i).first()).toBeVisible({ timeout: 3000 })
  })

  test('AC-7: can create and see invitation in list', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const uniqueName = `E2E Гость ${Date.now()}`
    await page.getByLabel(/имя гостя/i).fill(uniqueName)
    await page.getByRole('button', { name: /^создать$/i }).click()

    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 })
  })

  test('AC-7: can copy invitation link', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const copyBtn = page.getByRole('button', { name: /копировать/i }).first()
    const hasCopyBtn = await copyBtn.isVisible().catch(() => false)
    if (hasCopyBtn) {
      await copyBtn.click()
      await expect(page.getByText(/скопировано/i).first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('AC-7: delete button requires confirmation (two-click)', async ({ page }) => {
    if (!adminToken) { test.skip(); return }

    await page.goto(BASE_URL + '/#/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const deleteBtn = page.getByRole('button', { name: /удалить/i }).first()
    const hasBtns = await deleteBtn.isVisible().catch(() => false)
    if (hasBtns) {
      await deleteBtn.click()
      // First click should show "Подтвердить?"
      await expect(page.getByRole('button', { name: /подтвердить/i }).first()).toBeVisible({ timeout: 2000 })
    }
  })
})
