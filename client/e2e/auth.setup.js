/**
 * Shared auth helper for E2E tests.
 * Authenticates once and caches the admin_token cookie value.
 */

const BACKEND_URL = 'http://localhost:3001'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

/** @type {string | null} */
let cachedToken = null

/**
 * Get the admin token (authenticate once, then cache).
 * @param {import('@playwright/test').APIRequestContext} request
 * @returns {Promise<string | null>}
 */
export async function getAdminToken(request) {
  if (cachedToken) return cachedToken

  try {
    const res = await request.post(`${BACKEND_URL}/api/auth`, {
      data: { password: ADMIN_PASSWORD },
    })
    if (!res.ok()) return null

    const cookies = res.headers()['set-cookie'] || ''
    const match = cookies.match(/admin_token=([^;]+)/)
    if (match) {
      cachedToken = match[1]
      return cachedToken
    }
  } catch {
    return null
  }
  return null
}

/**
 * Set the admin cookie on a page context using cached token.
 * @param {import('@playwright/test').Page} page
 * @param {string} token
 */
export async function setAdminCookie(page, token) {
  await page.context().addCookies([{
    name: 'admin_token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Strict',
  }])
}
