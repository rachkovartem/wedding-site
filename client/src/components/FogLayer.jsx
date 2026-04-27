import React, { useEffect, useRef } from 'react'

export default function FogLayer() {
  const overlayRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)
  const isMobile = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
  )

  useEffect(() => {
    if (isMobile.current) return // No cursor effect on touch devices

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (overlayRef.current) {
            const { x, y } = mouseRef.current
            const dx = x - window.innerWidth / 2
            const dy = y - window.innerHeight / 2
            overlayRef.current.style.transform = `translate(${dx}px, ${dy}px)`
          }
          rafRef.current = null
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {/* Static fog layers with drift animation */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 40% at 30% 60%, rgba(122,133,121,0.25) 0%, transparent 70%)',
          animation: 'fogDrift 40s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 30% at 70% 40%, rgba(122,133,121,0.2) 0%, transparent 70%)',
          animation: 'fogDrift 55s ease-in-out infinite reverse',
          animationDelay: '-15s',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 35% at 50% 70%, rgba(122,133,121,0.15) 0%, transparent 65%)',
          animation: 'fogDrift 30s ease-in-out infinite',
          animationDelay: '-8s',
        }}
      />

      {/* Cursor-revealing overlay (desktop only) — uses transform, NOT mask-image */}
      {!isMobile.current && (
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            left: '-50vw',
            top: '-50vh',
            width: '200vw',
            height: '200vh',
            background: 'radial-gradient(circle 200px at 50% 50%, transparent 0%, transparent 30%, rgba(31,42,36,0.7) 55%, rgba(31,42,36,0.9) 80%, rgba(31,42,36,0.95) 100%)',
            willChange: 'transform',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
