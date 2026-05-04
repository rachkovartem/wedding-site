import React, { useState, useEffect } from 'react'

/**
 * @param {{ targetDate: Date }} props
 */
export default function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate))
  const [isSmall, setIsSmall] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 360)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  useEffect(() => {
    const handleResize = () => setIsSmall(window.innerWidth <= 360)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (timeLeft.total <= 0) {
    return (
      <div
        className="text-center font-script"
        style={{ color: '#5C1F1F', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
      >
        Торжество началось!
      </div>
    )
  }

  const units = [
    { label: 'дней', value: timeLeft.days, testId: 'countdown-days' },
    { label: 'часов', value: timeLeft.hours, testId: 'countdown-hours' },
    { label: 'минут', value: timeLeft.minutes, testId: 'countdown-minutes' },
    { label: 'секунд', value: timeLeft.seconds, testId: 'countdown-seconds' },
  ]

  return (
    <div
      className="flex justify-center"
      style={{ gap: isSmall ? '8px' : '16px', width: isSmall ? '280px' : undefined }}
    >
      {units.map(({ label, value, testId }) => (
        <div
          key={label}
          className="flex flex-col items-center"
          style={{
            background: '#5C1F1F',
            borderRadius: '4px',
            padding: isSmall ? '8px 10px' : '12px 16px',
            flex: isSmall ? '1 1 0' : undefined,
            minWidth: isSmall ? 0 : '70px',
            border: '1px solid rgba(168,134,74,0.4)',
          }}
        >
          <span
            data-testid={testId}
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: isSmall ? '1.6rem' : 'clamp(1.8rem, 5vw, 3rem)',
              color: '#D4B896',
              lineHeight: 1,
              fontWeight: 600,
            }}
          >
            {String(value).padStart(2, '0')}
          </span>
          <span
            style={{
              fontFamily: 'Lora, Georgia, serif',
              fontSize: isSmall ? '0.6rem' : '0.7rem',
              color: '#A8864A',
              marginTop: '4px',
              letterSpacing: '0.08em',
              textTransform: 'lowercase',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * @param {Date} targetDate
 * @returns {{ total: number, days: number, hours: number, minutes: number, seconds: number }}
 */
function calculateTimeLeft(targetDate) {
  const total = targetDate.getTime() - Date.now()
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }

  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / 1000 / 60 / 60) % 24)
  const days = Math.floor(total / 1000 / 60 / 60 / 24)

  return { total, days, hours, minutes, seconds }
}
