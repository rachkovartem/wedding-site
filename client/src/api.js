const BASE = '/api'

/**
 * @param {string} path
 * @param {RequestInit} options
 * @returns {Promise<unknown>}
 */
async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

/** @param {string} id */
export const getInvitation = (id) => request(`/invitations/${id}`)

/** @param {string} id */
export const postView = (id) => request(`/invitations/${id}/view`, { method: 'POST', body: JSON.stringify({}) })

/**
 * @param {string} id
 * @param {{ status: string, plus_one: boolean }} data
 */
export const postRsvp = (id, data) => request(`/invitations/${id}/rsvp`, { method: 'POST', body: JSON.stringify(data) })

/** @param {string} password */
export const postAuth = (password) => request('/auth', { method: 'POST', body: JSON.stringify({ password }) })

export const postLogout = () => request('/logout', { method: 'POST', body: JSON.stringify({}) })

export const getAdminInvitations = () => request('/admin/invitations')

/**
 * @param {{ guest_name: string, plus_one_allowed: number, salutation: string }} data
 */
export const createAdminInvitation = (data) => request('/admin/invitations', { method: 'POST', body: JSON.stringify(data) })

/** @param {string} id */
export const deleteAdminInvitation = (id) => request(`/admin/invitations/${id}`, { method: 'DELETE' })

export const getAdminStats = () => request('/admin/stats')
