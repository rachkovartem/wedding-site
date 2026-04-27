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
        <svg viewBox="0 0 120 120" width="100" height="100" aria-hidden="true">
          {/* Vine wreath */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="#4A5D3F" strokeWidth="1" opacity="0.5"/>
          {/* Leaf decorations around wreath */}
          <ellipse cx="60" cy="10" rx="8" ry="5" fill="#4A5D3F" opacity="0.6" transform="rotate(0,60,10)"/>
          <ellipse cx="110" cy="60" rx="8" ry="5" fill="#4A5D3F" opacity="0.6" transform="rotate(90,110,60)"/>
          <ellipse cx="60" cy="110" rx="8" ry="5" fill="#4A5D3F" opacity="0.6" transform="rotate(0,60,110)"/>
          <ellipse cx="10" cy="60" rx="8" ry="5" fill="#4A5D3F" opacity="0.6" transform="rotate(90,10,60)"/>
          {/* Grape clusters */}
          <circle cx="60" cy="12" r="3" fill="#5C1F1F" opacity="0.7"/>
          <circle cx="55" cy="8" r="2.5" fill="#5C1F1F" opacity="0.6"/>
          <circle cx="65" cy="8" r="2.5" fill="#5C1F1F" opacity="0.6"/>
          {/* Monogram letters */}
          <text
            x="35"
            y="72"
            fontFamily="Italianno, cursive"
            fontSize="38"
            fill="#A8864A"
            opacity="0.95"
          >
            И
          </text>
          <text
            x="52"
            y="68"
            fontFamily="Lora, Georgia, serif"
            fontSize="14"
            fill="#A8864A"
            opacity="0.8"
          >
            &amp;
          </text>
          <text
            x="62"
            y="72"
            fontFamily="Italianno, cursive"
            fontSize="38"
            fill="#A8864A"
            opacity="0.95"
          >
            А
          </text>
          {/* Gold ring */}
          <circle cx="60" cy="60" r="46" fill="none" stroke="#A8864A" strokeWidth="0.5" opacity="0.4" strokeDasharray="4 3"/>
        </svg>
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
          className="font-georgian"
          style={{ color: '#7A8579', fontSize: '0.85rem', marginBottom: '8px' }}
        >
          22 ივნისი, 2026 · In Gremi · კახეთი
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
          22 июня 2026 · Кахетия, Грузия
        </p>
        <p
          style={{
            fontFamily: 'Lora, Georgia, serif',
            color: '#4A5D3F',
            fontSize: '0.75rem',
            fontStyle: 'italic',
          }}
        >
          Сделано с любовью среди гор Кахетии
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
