import React, { useState, useEffect } from 'react'
import {
  getAdminInvitations,
  createAdminInvitation,
  deleteAdminInvitation,
  postLogout,
} from './api.js'
import AuthModal from './components/AuthModal.jsx'

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

/**
 * @typedef {{
 *   id: string,
 *   guest_name: string,
 *   plus_one_allowed: number,
 *   rsvp_status: string | null,
 *   rsvp_plus_one: number | null,
 *   view_count: number,
 *   created_at: string
 * }} AdminInvitation
 */

/** @param {{ status: string | null }} props */
function RsvpBadge({ status }) {
  const styles = {
    yes: { background: '#4A5D3F', color: '#D4B896', label: 'Придёт' },
    no: { background: '#A85838', color: '#D4B896', label: 'Не придёт' },
    null: { background: '#5C6B47', color: '#D4B896', label: 'Ожидается' },
  }
  const s = styles[status] ?? styles.null
  return (
    <span
      style={{
        background: s.background,
        color: s.color,
        padding: '2px 10px',
        borderRadius: '3px',
        fontSize: '0.8rem',
        fontFamily: 'Cormorant SC, Georgia, serif',
        letterSpacing: '0.05em',
        display: 'inline-block',
      }}
    >
      {s.label}
    </span>
  )
}

/**
 * @param {{ onNavigate: (view: string) => void }} props
 */
export default function Admin({ onNavigate }) {
  const [invitations, setInvitations] = useState([])
  const [showAuth, setShowAuth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create form state
  const [guestName, setGuestName] = useState('')
  const [salutation, setSalutation] = useState('Дорогой')
  const [plusOneAllowed, setPlusOneAllowed] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const loadInvitations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAdminInvitations()
      setInvitations(Array.isArray(data) ? data : [])
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        setShowAuth(true)
      } else {
        setError('Не удалось загрузить список приглашений.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const handleAuthSuccess = () => {
    setShowAuth(false)
    loadInvitations()
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!guestName.trim()) return
    setIsCreating(true)
    setCreateError(null)
    try {
      await createAdminInvitation({
        guest_name: guestName.trim(),
        plus_one_allowed: plusOneAllowed ? 1 : 0,
        salutation,
      })
      setGuestName('')
      setSalutation('Дорогой')
      setPlusOneAllowed(false)
      await loadInvitations()
    } catch {
      setCreateError('Не удалось создать приглашение.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (deletingId !== id) {
      setDeletingId(id)
      return
    }
    try {
      await deleteAdminInvitation(id)
      setDeletingId(null)
      await loadInvitations()
    } catch {
      setDeletingId(null)
      setError('Не удалось удалить приглашение.')
    }
  }

  const handleCopyLink = async (id) => {
    const url = `${BASE_URL}/#/invite/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleLogout = async () => {
    try {
      await postLogout()
    } finally {
      onNavigate('landing')
    }
  }

  const cardStyle = {
    background: '#2D352C',
    borderRadius: '4px',
    padding: '1.5rem',
    border: '1px solid rgba(168,134,74,0.2)',
    marginBottom: '1rem',
  }

  const inputStyle = {
    padding: '8px 12px',
    border: '1px solid rgba(168,134,74,0.4)',
    borderRadius: '3px',
    background: 'rgba(31,42,36,0.6)',
    color: '#D4B896',
    fontFamily: 'Lora, Georgia, serif',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
  }

  const btnStyle = {
    padding: '8px 20px',
    border: '1px solid rgba(168,134,74,0.5)',
    borderRadius: '3px',
    background: '#5C1F1F',
    color: '#D4B896',
    fontFamily: 'Cormorant SC, Georgia, serif',
    letterSpacing: '0.1em',
    fontSize: '0.9rem',
    cursor: 'pointer',
  }

  return (
    <div style={{ background: '#1F2A24', minHeight: '100vh', color: '#D4B896' }}>
      {showAuth && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => onNavigate('landing')}
        />
      )}

      {/* Header */}
      <header
        style={{
          background: '#2D352C',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid rgba(168,134,74,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <h1
          className="font-sc"
          style={{ color: '#A8864A', fontSize: '1.5rem', letterSpacing: '0.1em', margin: 0 }}
        >
          УПРАВЛЕНИЕ ПРИГЛАШЕНИЯМИ
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate('stats')}
            style={{ ...btnStyle, background: '#4A5D3F' }}
          >
            Статистика
          </button>
          <button
            onClick={() => onNavigate('landing')}
            style={{ ...btnStyle, background: 'transparent' }}
          >
            На сайт
          </button>
          <button onClick={handleLogout} style={{ ...btnStyle, background: '#8B4A2E' }}>
            Выйти
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Create form */}
        <section style={cardStyle}>
          <h2
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              color: '#A8864A',
              fontSize: '1.3rem',
              marginBottom: '1.5rem',
              marginTop: 0,
            }}
          >
            Создать приглашение
          </h2>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label
                  htmlFor="guest-name"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '0.85rem',
                    color: '#A8864A',
                    fontFamily: 'Cormorant SC, Georgia, serif',
                    letterSpacing: '0.1em',
                  }}
                >
                  ИМЯ ГОСТЯ
                </label>
                <input
                  id="guest-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Имя гостя"
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ flex: '0 0 auto', minWidth: '160px' }}>
                <label
                  htmlFor="salutation"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '0.85rem',
                    color: '#A8864A',
                    fontFamily: 'Cormorant SC, Georgia, serif',
                    letterSpacing: '0.1em',
                  }}
                >
                  ОБРАЩЕНИЕ
                </label>
                <select
                  id="salutation"
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: 'auto',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Дорогой">Дорогой</option>
                  <option value="Дорогая">Дорогая</option>
                  <option value="Дорогие">Дорогие</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontFamily: 'Lora, Georgia, serif',
                  fontSize: '0.9rem',
                  color: '#D4B896',
                }}
              >
                <input
                  type="checkbox"
                  checked={plusOneAllowed}
                  onChange={(e) => setPlusOneAllowed(e.target.checked)}
                  style={{ accentColor: '#A8864A', width: '16px', height: '16px' }}
                />
                Разрешить +1
              </label>
            </div>
            {createError && (
              <p style={{ color: '#A85838', fontSize: '0.9rem', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                {createError}
              </p>
            )}
            <button
              type="submit"
              disabled={isCreating || !guestName.trim()}
              style={{ ...btnStyle, opacity: isCreating ? 0.7 : 1 }}
            >
              {isCreating ? 'Создание...' : 'Создать'}
            </button>
          </form>
        </section>

        {/* Invitation list */}
        <section>
          <h2
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              color: '#A8864A',
              fontSize: '1.3rem',
              marginBottom: '1.5rem',
            }}
          >
            Приглашения ({invitations.length})
          </h2>

          {isLoading && (
            <p style={{ color: '#7A8579', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              Загрузка...
            </p>
          )}

          {error && !isLoading && (
            <p style={{ color: '#A85838', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
              {error}
            </p>
          )}

          {!isLoading && !error && invitations.length === 0 && (
            <p style={{ color: '#7A8579', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              Приглашений пока нет.
            </p>
          )}

          {invitations.map((inv) => (
            <div key={inv.id} style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontFamily: 'Cormorant Garamond, Georgia, serif',
                      color: '#D4B896',
                      fontSize: '1.15rem',
                      margin: '0 0 8px',
                    }}
                  >
                    {inv.salutation ? `${inv.salutation} ${inv.guest_name}` : inv.guest_name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <RsvpBadge status={inv.rsvp_status} />
                    {inv.plus_one_allowed ? (
                      <span style={{ color: '#A8864A', fontSize: '0.8rem' }}>+1 разрешён</span>
                    ) : null}
                    <span style={{ color: '#7A8579', fontSize: '0.8rem' }}>
                      Просмотров: {inv.view_count ?? 0}
                    </span>
                  </div>
                  <p
                    style={{
                      color: '#5C6B47',
                      fontSize: '0.75rem',
                      marginTop: '6px',
                      fontFamily: 'Lora, Georgia, serif',
                      wordBreak: 'break-all',
                    }}
                  >
                    {BASE_URL}/#/invite/{inv.id}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => handleCopyLink(inv.id)}
                    style={{
                      ...btnStyle,
                      background: copiedId === inv.id ? '#4A5D3F' : '#2D352C',
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                    }}
                    title="Скопировать ссылку"
                  >
                    {copiedId === inv.id ? 'Скопировано!' : 'Копировать'}
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    style={{
                      ...btnStyle,
                      background: deletingId === inv.id ? '#8B4A2E' : '#2D352C',
                      color: deletingId === inv.id ? '#D4B896' : '#A85838',
                      border: '1px solid #A85838',
                      fontSize: '0.8rem',
                      padding: '6px 14px',
                    }}
                    title={deletingId === inv.id ? 'Нажмите ещё раз для подтверждения' : 'Удалить'}
                  >
                    {deletingId === inv.id ? 'Подтвердить?' : 'Удалить'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
