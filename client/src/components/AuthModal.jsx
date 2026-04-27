import React, { useState, useEffect, useRef } from 'react'
import { postAuth } from '../api.js'

/**
 * @param {{
 *   onSuccess: () => void,
 *   onClose: () => void
 * }} props
 */
export default function AuthModal({ onSuccess, onClose }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      await postAuth(password)
      onSuccess()
    } catch {
      setError('Неверный пароль')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Вход в панель управления"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,42,36,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={shake ? 'shake' : ''}
        style={{
          background: '#D4B896',
          borderRadius: '4px',
          padding: '2.5rem',
          maxWidth: '400px',
          width: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid #A8864A',
          position: 'relative',
        }}
      >
        {/* Envelope flap decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-1px',
            left: 0,
            right: 0,
            height: '60px',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 400 60" className="w-full h-full">
            <polygon points="0,0 400,0 200,58" fill="#C9A876" opacity="0.6"/>
            <polygon points="0,0 400,0 200,58" fill="none" stroke="#A8864A" strokeWidth="0.5" opacity="0.4"/>
          </svg>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Закрыть"
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8B4A2E',
            fontSize: '1.2rem',
            fontFamily: 'Lora, Georgia, serif',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Title */}
        <div className="text-center mt-8 mb-6">
          <div
            className="font-script"
            style={{ color: '#5C1F1F', fontSize: '2rem', marginBottom: '4px' }}
          >
            И & А
          </div>
          <h2
            style={{
              fontFamily: 'Cormorant SC, Georgia, serif',
              color: '#5C1F1F',
              fontSize: '1rem',
              letterSpacing: '0.15em',
              margin: 0,
            }}
          >
            ПАНЕЛЬ УПРАВЛЕНИЯ
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              aria-label="Пароль"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid rgba(92,31,31,0.4)',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.5)',
                fontFamily: 'Lora, Georgia, serif',
                fontSize: '1rem',
                color: '#5C1F1F',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p
              style={{
                color: '#A85838',
                fontStyle: 'italic',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            style={{
              width: '100%',
              padding: '12px',
              background: isLoading ? '#8B4A2E' : '#5C1F1F',
              color: '#D4B896',
              border: 'none',
              borderRadius: '3px',
              fontFamily: 'Cormorant SC, Georgia, serif',
              fontSize: '1rem',
              letterSpacing: '0.15em',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Проверка...' : 'ВОЙТИ'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1rem',
            color: '#8B4A2E',
            fontSize: '0.8rem',
            fontStyle: 'italic',
          }}
        >
          Нажмите Esc для закрытия
        </p>
      </div>
    </div>
  )
}
