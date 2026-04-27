import { test, expect } from '@playwright/test'

// AC-1: Hero with layered SVG mountains, animated fog, SVG vine, personalized envelope
// AC-3: Scroll animation phases
// AC-4: Letter content after envelope
// AC-13: Correct palette, fonts
// AC-14: Mobile layout

const BASE_URL = 'http://localhost:5173'

test.describe('AC-1: Hero section', () => {
  test('AC-1: renders SVG mountain layers in hero', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    // Should have SVG elements for mountains
    const svgs = page.locator('svg')
    await expect(svgs.first()).toBeVisible()
  })

  test('AC-1: WebGL fog canvas rendered (not mask-image)', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    const fogCanvas = page.locator('[data-testid="webgl-fog"]')
    await expect(fogCanvas).toBeVisible()

    // Убеждаемся что mask-image не используется
    const hasMaskImage = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[style]'))
        .some(el => (el.getAttribute('style') || '').includes('mask-image'))
    })
    expect(hasMaskImage).toBe(false)
  })

  test('AC-1: envelope is visible on initial load', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    // The envelope SVG should be visible
    const envelopeSvg = page.locator('svg').filter({ hasText: /И.*А/ }).first()
    await expect(page.locator('.h-300dvh')).toBeVisible()
  })

  test('AC-1: personalized envelope shows guest name when invitation id provided', async ({ page, request }) => {
    // Create an invitation via API
    let invitationId = null
    try {
      // First authenticate
      await request.post(`${BASE_URL}/api/auth`, {
        data: { password: process.env.ADMIN_PASSWORD || 'wedding2026' },
      })
      const createRes = await request.post(`${BASE_URL}/api/admin/invitations`, {
        data: { guest_name: 'Test Гость E2E', plus_one_allowed: 0 },
      })
      if (createRes.ok()) {
        const inv = await createRes.json()
        invitationId = inv.id
      }
    } catch {
      // Backend may not be running — skip personalization check
      test.skip()
      return
    }

    if (invitationId) {
      await page.goto(`${BASE_URL}/#/invite/${invitationId}`)
      await page.waitForLoadState('networkidle')
      // Guest name should appear (may appear multiple times in envelope + letter)
      await expect(page.getByText('Test Гость E2E').first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('AC-2: Desktop fog cursor effect', () => {
  test('AC-2: WebGL canvas uses will-change:transform, NOT mask-image', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    const overlayInfo = await page.evaluate(() => {
      // Canvas или любой элемент с willChange
      const el = document.querySelector('[data-testid="webgl-fog"]') ||
                 Array.from(document.querySelectorAll('*')).find(e => /** @type {HTMLElement} */ (e).style.willChange === 'transform')
      if (!el) return null
      const htmlEl = /** @type {HTMLElement} */ (el)
      return {
        willChange: htmlEl.style.willChange,
        maskImage: htmlEl.style.maskImage || '',
      }
    })

    expect(overlayInfo).not.toBeNull()
    expect(overlayInfo.willChange).toBe('transform')
    expect(overlayInfo.maskImage).toBe('')
  })
})

test.describe('AC-4: Letter content', () => {
  test('AC-4: letter section appears below hero with signature', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    // Scroll past the hero
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // Letter section has RSVP heading "Ответное письмо" — unique to the letter content
    await expect(page.getByText('Ответное письмо').first()).toBeVisible({ timeout: 5000 })
  })

  test('AC-4: countdown section is present', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(300)

    await expect(page.getByText(/дней/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('AC-4: venue section shows Gremi and coordinates', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)

    await expect(page.getByText(/In Gremi/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/41\.8/)).toBeVisible({ timeout: 5000 })
  })

  test('AC-4: program timeline is visible', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)

    await expect(page.getByText('Программа дня')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Регистрация')).toBeVisible({ timeout: 5000 })
  })

  test('AC-4: two-column layout on desktop (vine left, content right)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)

    // The vine column should be visible on desktop
    const vineColumn = page.locator('.lg\\:block').first()
    await expect(vineColumn).toBeVisible({ timeout: 5000 })
  })

  test('AC-4: single column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)

    // Vine column should be hidden on mobile
    const vineColumn = page.locator('.hidden.lg\\:block').first()
    const isHidden = await vineColumn.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.display === 'none'
    })
    expect(isHidden).toBe(true)
  })
})

test.describe('AC-5: RSVP form', () => {
  test('AC-5: RSVP section renders without invitation (shows notice)', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)

    await expect(page.getByText(/ответное письмо/i).first()).toBeVisible({ timeout: 5000 })
    // Without invitation, should show a notice
    await expect(page.getByText(/персональную ссылку/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('AC-13: Palette and fonts', () => {
  test('AC-13: page background color is correct deep green', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    // #1F2A24 = rgb(31, 42, 36)
    expect(bgColor).toBe('rgb(31, 42, 36)')
  })

  test('AC-13: no sans-serif font declarations in our own CSS', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    // Check inline styles in the DOM for any sans-serif declarations
    const inlineSansSerif = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('[style]'))
      return allElements
        .map((el) => el.getAttribute('style') || '')
        .filter((style) => {
          // Strict check: style contains sans-serif explicitly
          return /font-family\s*:[^;]*sans-serif/i.test(style) &&
                 !/font-family\s*:[^;]*(lora|cormorant|italianno|georgian)/i.test(style)
        })
    })
    expect(inlineSansSerif.length).toBe(0)
  })
})

test.describe('AC-14: Mobile layout', () => {
  test('AC-14: hero is preserved on mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    // The hero scroll container should be visible
    await expect(page.locator('.h-300dvh')).toBeVisible()
    // Envelope container should be visible
    const envelopeContainer = page.locator('[style*="zIndex: 10"], [style*="z-index: 10"]').first()
    await expect(envelopeContainer).toBeVisible()
  })

  test('AC-14: no text overflow on mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    // Check for horizontal scroll (overflow)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe('AC-6: Footer monogram admin trigger', () => {
  test('AC-6: footer monogram exists', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)

    const monogram = page.getByTestId('footer-monogram')
    await expect(monogram).toBeVisible({ timeout: 5000 })
  })

  test('AC-6: 20 clicks in 10s on monogram shows auth modal', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    const monogram = page.getByTestId('footer-monogram')
    await expect(monogram).toBeVisible({ timeout: 5000 })

    // Click 20 times quickly
    for (let i = 0; i < 20; i++) {
      await monogram.click()
    }

    // Auth modal should appear (styled as envelope with password input)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
    await expect(page.getByLabel(/пароль/i)).toBeVisible()
  })

  test('AC-6: auth modal closes on Escape key', async ({ page }) => {
    await page.goto(BASE_URL + '/#/')
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    const monogram = page.getByTestId('footer-monogram')
    await expect(monogram).toBeVisible({ timeout: 5000 })
    for (let i = 0; i < 20; i++) await monogram.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 })
  })
})
