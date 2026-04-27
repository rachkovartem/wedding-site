import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getInvitation,
  postView,
  postRsvp,
  postAuth,
  postLogout,
  getAdminInvitations,
  createAdminInvitation,
  deleteAdminInvitation,
  getAdminStats,
} from '../api.js'

/**
 * Helper to create a mock Response
 * @param {unknown} body
 * @param {number} status
 * @returns {Response}
 */
function mockResponse(body, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  }
}

describe('api.js', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getInvitation', () => {
    it('calls correct URL with credentials:include', async () => {
      fetch.mockResolvedValue(mockResponse({ id: 'abc', guest_name: 'Anna' }))
      const result = await getInvitation('abc123')
      expect(fetch).toHaveBeenCalledWith(
        '/api/invitations/abc123',
        expect.objectContaining({ credentials: 'include' })
      )
      expect(result).toEqual({ id: 'abc', guest_name: 'Anna' })
    })

    it('uses GET method by default', async () => {
      fetch.mockResolvedValue(mockResponse({}))
      await getInvitation('xyz')
      const [, options] = fetch.mock.calls[0]
      expect(options.method).toBeUndefined()
    })
  })

  describe('postView', () => {
    it('calls correct URL with POST method', async () => {
      fetch.mockResolvedValue(mockResponse({ ok: true }))
      await postView('inv1')
      expect(fetch).toHaveBeenCalledWith(
        '/api/invitations/inv1/view',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
    })
  })

  describe('postRsvp', () => {
    it('sends POST with correct body and credentials', async () => {
      fetch.mockResolvedValue(mockResponse({ ok: true }))
      await postRsvp('inv1', { status: 'yes', plus_one: true })
      expect(fetch).toHaveBeenCalledWith(
        '/api/invitations/inv1/rsvp',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ status: 'yes', plus_one: true }),
        })
      )
    })

    it('sends no-rsvp body correctly', async () => {
      fetch.mockResolvedValue(mockResponse({ ok: true }))
      await postRsvp('inv2', { status: 'no', plus_one: false })
      const [, options] = fetch.mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.status).toBe('no')
      expect(body.plus_one).toBe(false)
    })
  })

  describe('postAuth', () => {
    it('sends POST with password in body', async () => {
      fetch.mockResolvedValue(mockResponse({ ok: true }))
      await postAuth('secret123')
      expect(fetch).toHaveBeenCalledWith(
        '/api/auth',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ password: 'secret123' }),
        })
      )
    })

    it('does NOT send Authorization header', async () => {
      fetch.mockResolvedValue(mockResponse({ ok: true }))
      await postAuth('pw')
      const [, options] = fetch.mock.calls[0]
      expect(options.headers?.Authorization).toBeUndefined()
    })
  })

  describe('admin functions include credentials:include', () => {
    it('getAdminInvitations uses credentials:include', async () => {
      fetch.mockResolvedValue(mockResponse([]))
      await getAdminInvitations()
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/invitations',
        expect.objectContaining({ credentials: 'include' })
      )
    })

    it('createAdminInvitation sends POST with data', async () => {
      fetch.mockResolvedValue(mockResponse({ id: 'new1' }))
      await createAdminInvitation({ guest_name: 'Boris', plus_one_allowed: 1 })
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/invitations',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ guest_name: 'Boris', plus_one_allowed: 1 }),
        })
      )
    })

    it('deleteAdminInvitation sends DELETE to correct URL', async () => {
      fetch.mockResolvedValue({ status: 204, ok: true, json: () => Promise.resolve(null) })
      await deleteAdminInvitation('inv99')
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/invitations/inv99',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' })
      )
    })

    it('getAdminStats uses credentials:include', async () => {
      fetch.mockResolvedValue(mockResponse({ total: 10 }))
      await getAdminStats()
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/stats',
        expect.objectContaining({ credentials: 'include' })
      )
    })
  })

  describe('error handling', () => {
    it('throws with status:401 on unauthorized response', async () => {
      fetch.mockResolvedValue({
        status: 401,
        ok: false,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      })
      await expect(getAdminInvitations()).rejects.toMatchObject({ status: 401 })
    })

    it('throws with status:404 on not found', async () => {
      fetch.mockResolvedValue({
        status: 404,
        ok: false,
        json: () => Promise.resolve({ message: 'Not found' }),
      })
      await expect(getInvitation('nonexistent')).rejects.toMatchObject({ status: 404 })
    })

    it('returns null on 204 response', async () => {
      fetch.mockResolvedValue({ status: 204, ok: true, json: () => Promise.resolve(null) })
      const result = await postLogout()
      expect(result).toBeNull()
    })
  })
})
