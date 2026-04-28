import React, { useState, useEffect, useRef } from 'react'
import { getInvitation, postView } from './api.js'
import Envelope from './components/Envelope.jsx'
import Letter from './components/Letter.jsx'
import Footer from './components/Footer.jsx'

/**
 * @param {{ invitationId: string | null, onNavigate: (view: string, id?: string) => void }} props
 */
export default function Landing({ invitationId, onNavigate }) {
  const [invitation, setInvitation] = useState(null)
  const [scrollPhase, setScrollPhase] = useState(0)
  const [cardExitProgress, setCardExitProgress] = useState(0)
  const heroRef = useRef(null)
  const stickyRef = useRef(null)
  const rafRef = useRef(null)
  const viewedRef = useRef(false)

  const scrollTo = (targetFraction, duration) => {
    const hero = heroRef.current
    if (!hero) return Promise.resolve()
    const heroTop = hero.offsetTop
    const heroHeight = hero.offsetHeight
    const viewportH = stickyRef.current?.offsetHeight ?? window.innerHeight
    const scrollable = heroHeight - viewportH
    const target = heroTop + scrollable * targetFraction
    const start = window.scrollY
    const distance = target - start
    if (Math.abs(distance) < 10) return Promise.resolve()

    return new Promise((resolve) => {
      const startTime = performance.now()
      function step(now) {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        window.scrollTo(0, start + distance * ease)
        if (t < 1) requestAnimationFrame(step)
        else resolve()
      }
      requestAnimationFrame(step)
    })
  }

  const handleSealClick = () => {
    const openLetter = () =>
      // sealBreak phase (20%→38%) in 900ms, then rest to 97% in 1500ms, then scroll into letter section
      scrollTo(0.38, 900).then(() => scrollTo(0.97, 1500)).then(() => scrollTo(2.0, 600))

    if (scrollPhase < 15) {
      // Flip (800ms) → pause (300ms) → seal shards (300ms) → open (2000ms)
      scrollTo(0.18, 800)
        .then(() => new Promise(r => setTimeout(r, 300)))
        .then(openLetter)
    } else {
      openLetter()
    }
  }

  const handleFlipClick = handleSealClick

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
        const viewportH = stickyRef.current?.offsetHeight ?? window.innerHeight
        const scrollable = heroHeight - viewportH
        const scrolled = Math.max(0, window.scrollY - heroTop)
        const p = Math.min(100, scrollable > 0 ? (scrolled / scrollable) * 100 : 0)
        setScrollPhase(p)

        // cardExitProgress: 0 while in hero, fades 0→1 as user scrolls into letter section
        const heroMax = heroTop + scrollable          // scrollY where phase = 100%
        const letterScrolled = Math.max(0, window.scrollY - heroMax)
        const cardExit = viewportH > 0 ? Math.min(1, letterScrolled / viewportH) : 0
        setCardExitProgress(cardExit)
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
      {/* Hero: 200dvh scroll container with sticky inner */}
      <div ref={heroRef} className="h-200dvh relative">
        <div
          ref={stickyRef}
          className="h-screen-dvh sticky top-0 overflow-hidden"
          style={{ background: '#1F2A24' }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/mountains.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 1,
            }}
          />
          <Envelope
            scrollPhase={scrollPhase}
            cardExitProgress={cardExitProgress}
            guestName={invitation?.guest_name}
            salutation={invitation?.salutation}
            onSealClick={handleSealClick}
            onFlipClick={handleFlipClick}
          />
        </div>
      </div>

      {/* Letter content — normal document flow */}
      <div style={{ marginTop: '-2px' }}>
        <Letter invitation={invitation} invitationId={invitationId} />
      </div>
      <Footer onAdminTrigger={() => onNavigate('admin')} />
    </div>
  )
}
