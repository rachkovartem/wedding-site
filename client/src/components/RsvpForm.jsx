import React, { useState } from 'react'

/**
 * @typedef {{ id: string, guest_name: string, plus_one_allowed: number, rsvp_status: string | null } | null} Invitation
 */

/**
 * @param {{
 *   invitation: Invitation,
 *   onSubmit: (status: string, plusOne: boolean) => Promise<void>,
 *   submitted: boolean
 * }} props
 */
export default function RsvpForm({ invitation, onSubmit, submitted }) {
  const [status, setStatus] = useState(null)
  const [plusOne, setPlusOne] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Show confirmation for already-answered or freshly submitted
  if (invitation?.rsvp_status) {
    return (
      <div
        className="text-center py-8"
        style={{ color: '#5C1F1F', fontStyle: 'italic' }}
      >
        <p style={{ fontSize: '1.1rem' }}>Вы уже ответили на приглашение.</p>
        <p style={{ fontSize: '1rem', marginTop: '0.5rem', color: '#8B4A2E' }}>
          Ответ: <strong>{invitation.rsvp_status === 'yes' ? 'Приду' : 'Не смогу'}</strong>
          {invitation.rsvp_status === 'yes' && invitation.rsvp_plus_one ? ' (+1)' : ''}
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div
        className="text-center py-8"
        style={{ color: '#5C1F1F' }}
      >
        <div className="font-script" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Спасибо!
        </div>
        <p style={{ fontStyle: 'italic', color: '#8B4A2E' }}>
          Ваш ответ получен. Мы с нетерпением ждём встречи!
        </p>
      </div>
    )
  }

  const showPlusOne = status === 'yes' && invitation?.plus_one_allowed === 1

  const handleSubmit = async () => {
    if (!status) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(status, plusOne)
    } catch {
      setError('Произошла ошибка. Пожалуйста, попробуйте снова.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const buttonBase = {
    fontFamily: 'Cormorant SC, Georgia, serif',
    fontSize: '1rem',
    letterSpacing: '0.15em',
    padding: '10px 28px',
    borderRadius: '3px',
    border: '1.5px solid #A8864A',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  }

  return (
    <div
      style={{
        maxWidth: '420px',
        margin: '0 auto',
        padding: '2rem',
        background: 'rgba(92,31,31,0.08)',
        borderRadius: '4px',
        border: '1px solid rgba(168,134,74,0.3)',
      }}
    >
      {/* Status selection */}
      <div className="flex gap-4 justify-center mb-6">
        <button
          onClick={() => { setStatus('yes'); setPlusOne(false) }}
          style={{
            ...buttonBase,
            background: status === 'yes' ? '#5C1F1F' : 'transparent',
            color: status === 'yes' ? '#D4B896' : '#5C1F1F',
          }}
        >
          Да, приду
        </button>
        <button
          onClick={() => { setStatus('no'); setPlusOne(false) }}
          style={{
            ...buttonBase,
            background: status === 'no' ? '#5C1F1F' : 'transparent',
            color: status === 'no' ? '#D4B896' : '#5C1F1F',
          }}
        >
          Нет, не смогу
        </button>
      </div>

      {/* +1 toggle — only when status=yes AND plus_one_allowed=1 */}
      {showPlusOne && (
        <div
          data-testid="plus-one-toggle"
          className="flex items-center justify-center gap-3 mb-6"
          style={{ color: '#5C1F1F' }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontFamily: 'Lora, Georgia, serif',
              fontSize: '0.95rem',
            }}
          >
            <input
              type="checkbox"
              checked={plusOne}
              onChange={(e) => setPlusOne(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#5C1F1F',
              }}
            />
            Я приду с партнёром (+1)
          </label>
        </div>
      )}

      {/* Submit button */}
      {status && (
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              ...buttonBase,
              background: isSubmitting ? '#8B4A2E' : '#5C1F1F',
              color: '#D4B896',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Отправка...' : 'Подтвердить'}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p
          style={{
            color: '#A85838',
            textAlign: 'center',
            marginTop: '1rem',
            fontStyle: 'italic',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
