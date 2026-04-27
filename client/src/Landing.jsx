import React, { useState, useEffect, useRef } from 'react'
import { getInvitation, postView } from './api.js'
import WebGLFog from './components/WebGLFog.jsx'
import Envelope from './components/Envelope.jsx'
import Letter from './components/Letter.jsx'
import Footer from './components/Footer.jsx'

/**
 * @param {{ invitationId: string | null, onNavigate: (view: string, id?: string) => void }} props
 */
export default function Landing({ invitationId, onNavigate }) {
  const [invitation, setInvitation] = useState(null)
  const [scrollPhase, setScrollPhase] = useState(0)
  const heroRef = useRef(null)
  const rafRef = useRef(null)
  const viewedRef = useRef(false)

  const handleSealClick = () => {
    const hero = heroRef.current
    if (!hero) return
    const heroTop = hero.offsetTop
    const heroHeight = hero.offsetHeight
    const viewportH = window.innerHeight
    const scrollable = heroHeight - viewportH
    const target = heroTop + scrollable * 0.97

    const start = window.scrollY
    const distance = target - start
    if (Math.abs(distance) < 10) return

    const duration = 2600
    const startTime = performance.now()

    function step(now) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // easeOutCubic — starts at full speed, decelerates smoothly
      const ease = 1 - Math.pow(1 - t, 3)
      window.scrollTo(0, start + distance * ease)
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  useEffect(() => {
    if (!invitationId) return
    getInvitation(invitationId)
      .then(setInvitation)
      .catch(() => setInvitation(null))

    if (!viewedRef.current) {
      viewedRef.current = true
      postView(invitationId).catch(() => {})
    }
  }, [invitationId])

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const hero = heroRef.current
        if (!hero) return
        const heroTop = hero.offsetTop
        const heroHeight = hero.offsetHeight
        const viewportH = window.innerHeight
        const scrollable = heroHeight - viewportH
        const scrolled = Math.max(0, window.scrollY - heroTop)
        const p = Math.min(100, scrollable > 0 ? (scrolled / scrollable) * 100 : 0)
        setScrollPhase(p)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div style={{ background: '#1F2A24', minHeight: '100vh' }}>
      {/* Hero: 300dvh scroll container with sticky inner */}
      <div ref={heroRef} className="h-300dvh relative">
        <div
          className="h-screen-dvh sticky top-0 overflow-hidden"
          style={{ background: '#1F2A24' }}
        >
          <WebGLFog />
          <Envelope scrollPhase={scrollPhase} guestName={invitation?.guest_name} onSealClick={handleSealClick} />
        </div>
      </div>

      {/* Letter content — flows naturally below hero, marginTop closes any sub-pixel gap */}
      <div style={{ marginTop: '-2px' }}>
        <Letter invitation={invitation} invitationId={invitationId} />
      </div>

      {/* Footer with hidden admin trigger */}
      <Footer onAdminTrigger={() => onNavigate('admin')} />
    </div>
  )
}
