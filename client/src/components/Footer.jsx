import React, { useState, useRef, useCallback } from 'react'
import AuthModal from './AuthModal.jsx'

/**
 * @param {{ onAdminTrigger: () => void }} props
 */
export default function Footer({ onAdminTrigger }) {
  const [showModal, setShowModal] = useState(false)
  const clickTimesRef = useRef([])

  const handleMonogramClick = useCallback(() => {
    const now = Date.now()
    // Keep only clicks within the last 10 seconds
    clickTimesRef.current = clickTimesRef.current.filter((t) => now - t < 10000)
    clickTimesRef.current.push(now)

    if (clickTimesRef.current.length >= 20) {
      clickTimesRef.current = []
      setShowModal(true)
    }
  }, [])

  const handleAuthSuccess = () => {
    setShowModal(false)
    onAdminTrigger()
  }

  return (
    <footer
      style={{
        background: '#1F2A24',
        padding: '3rem 1rem 2rem',
        borderTop: '1px solid rgba(168,134,74,0.2)',
      }}
    >
      {/* Monogram SVG — hidden admin trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleMonogramClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleMonogramClick() }}
        data-testid="footer-monogram"
        style={{
          cursor: 'default',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          userSelect: 'none',
        }}
        aria-label="Монограмма"
      >
        <img
          src="/seal.png"
          alt="Печать"
          aria-hidden="true"
          style={{ width: '140px', height: '140px', objectFit: 'contain', opacity: 0.85 }}
        />
      </div>

      {/* Wedding details */}
      <div className="text-center">
        <p
          className="font-script"
          style={{ color: '#A8864A', fontSize: '1.6rem', marginBottom: '4px' }}
        >
          Ира & Артём
        </p>
        <p
          style={{
            fontFamily: 'Lora, Georgia, serif',
            color: '#7A8579',
            fontSize: '0.8rem',
            fontStyle: 'italic',
            marginBottom: '0.5rem',
          }}
        >
          22–23 июня 2026 · In Gremi · Кахетия, Грузия
        </p>
        <p
          style={{
            fontFamily: 'Lora, Georgia, serif',
            color: '#4A5D3F',
            fontSize: '0.75rem',
            fontStyle: 'italic',
          }}
        >
          Сделано с любовью <s>в Claude Code</s> среди гор Кахетии
        </p>
      </div>

      {showModal && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowModal(false)}
        />
      )}
    </footer>
  )
}
