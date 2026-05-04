import React, { useMemo, useRef, useState, useEffect } from 'react'
import GrapeVineLetter from './GrapeVineLetter.jsx'
import Countdown from './Countdown.jsx'
import AddToCalendar from './AddToCalendar.jsx'

/**
 * Linear interpolation helper
 * @param {number} start
 * @param {number} end
 * @param {number} t
 */
function lerp(start, end, t) {
  return start + (end - start) * Math.min(1, Math.max(0, t))
}

/**
 * Map a value from one range to [0,1] progress
 * @param {number} phase
 * @param {number} from
 * @param {number} to
 */
function progress(phase, from, to) {
  return Math.min(1, Math.max(0, (phase - from) / (to - from)))
}

const WEDDING_DATE = new Date('2026-06-22T14:00:00')

/**
 * Seal image that shatters into irregular glass-like shards when sealBreak → 1.
 * @param {{ sealBreak: number }} props
 */
function SealCanvas({ sealBreak }) {
  const canvasRef = useRef(null)
  const offRef    = useRef(null)   // 800×800 pre-processed canvas
  const [imgReady, setImgReady] = useState(false)

  // ── Generate irregular glass shards once ─────────────────────────────
  // Each shard is a random convex polygon with its own velocity & spin.
  const shards = useMemo(() => {
    const list = []
    const COUNT = 45

    for (let s = 0; s < COUNT; s++) {
      // Uniform random center inside the seal circle (r ≤ 0.45 in 0-1 space)
      const a0 = Math.random() * Math.PI * 2
      const r0 = Math.sqrt(Math.random()) * 0.45
      const cx = 0.5 + r0 * Math.cos(a0)
      const cy = 0.5 + r0 * Math.sin(a0)

      // Random convex polygon: 4–7 vertices, each at a jittered angle
      // and a varying radius → produces shards of very different sizes
      const numPts   = 4 + Math.floor(Math.random() * 4)   // 4-7 sides
      const startA   = Math.random() * Math.PI * 2
      const pts      = []
      for (let v = 0; v < numPts; v++) {
        const baseA  = startA + (v / numPts) * Math.PI * 2
        const jitter = (Math.random() - 0.5) * (Math.PI * 2 / numPts) * 0.6
        const angle  = baseA + jitter
        // Mix of small slivers and large chunks — like real glass
        const pr = 0.03 + Math.random() * Math.random() * 0.14
        pts.push({ x: cx + pr * Math.cos(angle), y: cy + pr * Math.sin(angle) })
      }

      // Fly outward from seal center + random scatter
      const flyA  = Math.atan2(cy - 0.5, cx - 0.5) + (Math.random() - 0.5) * 0.8
      const speed = 0.3 + Math.random() * 0.9
      // Larger shards spin slower (rough mass-proportional feel)
      const maxPr  = Math.max(...pts.map(p => Math.hypot(p.x - cx, p.y - cy)))
      const rotSpd = (Math.random() - 0.5) * 600 * (1 - maxPr * 2)

      list.push({
        cx, cy, pts,
        vx: Math.cos(flyA) * speed,
        vy: Math.sin(flyA) * speed,
        rotSpd,
      })
    }
    return list
  }, [])

  // ── Load image → render centre-cropped into 400×400 offscreen canvas ──
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const off = document.createElement('canvas')
      off.width  = 800
      off.height = 800
      const octx = off.getContext('2d')

      // Draw the seal image into the CENTRE 400×400 area of the 800×800 canvas
      // so shards have 200px of transparent margin to fly into on every side
      const srcOff = (img.naturalWidth - img.naturalHeight) / 2
      const srcSz  = img.naturalHeight
      octx.drawImage(img, srcOff, 0, srcSz, srcSz, 200, 200, 400, 400)

      // Circular mask centred at (400,400) radius 200 — only seal pixels survive
      octx.globalCompositeOperation = 'destination-in'
      octx.beginPath()
      octx.arc(400, 400, 200, 0, Math.PI * 2)
      octx.fill()
      octx.globalCompositeOperation = 'source-over'

      offRef.current = off
      setImgReady(true)
    }
    img.src = '/seal.png'
  }, [])

  // ── Draw every time sealBreak or imgReady changes ─────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const off    = offRef.current
    if (!canvas || !off) return

    const ctx = canvas.getContext('2d')

    // Canvas is 800×800; seal sits in the centre 400×400 (offset 200 on each side)
    const CANVAS_SZ  = 800
    const SEAL_SZ    = 400   // seal diameter in internal pixels
    const SEAL_OFF   = 200   // (800 - 400) / 2 — left/top offset of seal within canvas

    ctx.clearRect(0, 0, CANVAS_SZ, CANVAS_SZ)

    if (sealBreak === 0) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(CANVAS_SZ / 2, CANVAS_SZ / 2, SEAL_SZ / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(off, 0, 0)
      ctx.restore()
      return
    }

    const t     = sealBreak
    const eased = t * t

    for (const shard of shards) {
      const { cx, cy, pts, vx, vy, rotSpd } = shard

      // Shard centre in 800×800 canvas space (seal occupies 200–600 on both axes)
      const ocx = SEAL_OFF + cx * SEAL_SZ
      const ocy = SEAL_OFF + cy * SEAL_SZ

      // Exploded position — travel distance proportional to seal size
      const nx = ocx + vx * eased * SEAL_SZ * 0.85
      const ny = ocy + vy * eased * SEAL_SZ * 0.85 + eased * SEAL_SZ * 0.07

      const alpha = Math.max(0, 1 - t / 0.75)
      if (alpha <= 0) continue

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(nx, ny)
      ctx.rotate((rotSpd * eased * Math.PI) / 180)

      // Polygon vertices are in 0-1 normalised space; scale by SEAL_SZ for canvas pixels
      ctx.beginPath()
      ctx.moveTo((pts[0].x - cx) * SEAL_SZ, (pts[0].y - cy) * SEAL_SZ)
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo((pts[i].x - cx) * SEAL_SZ, (pts[i].y - cy) * SEAL_SZ)
      }
      ctx.closePath()
      ctx.clip()

      // Draw offscreen canvas so the pixel originally at (ocx, ocy) is at origin
      ctx.drawImage(off, -ocx, -ocy)

      ctx.restore()
    }
  }, [sealBreak, imgReady, shards])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={800}
      style={{
        display: 'block',
        width: '100px',
        height: '100px',
        pointerEvents: 'none',
      }}
    />
  )
}

/**
 * Front face of the envelope (address side).
 * Shown before scroll-driven flip reveals the wax seal back.
 * @param {{ guestName?: string, salutation?: string }} props
 */
function FrontFace({ guestName, salutation, onFlip }) {
  return (
    <div
      onClick={onFlip}
      style={{
        background: '#C9A876',
        borderRadius: '4px',
        boxShadow: '4px 8px 32px rgba(0,0,0,0.4)',
        padding: '0',
        cursor: onFlip ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: '380 / 260',
        animation: 'envelopeWobble 3s ease-in-out infinite',
      }}
    >
      {/* Decorative envelope border */}
      <div style={{
        position: 'absolute', inset: '6px',
        border: '1px dashed rgba(168,134,74,0.4)',
        borderRadius: '2px',
        pointerEvents: 'none',
      }} />

      {/* Diagonal stripe pattern in top-left corner (classic airmail style) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
        background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(139,74,46,0.07) 6px, rgba(139,74,46,0.07) 12px)',
        pointerEvents: 'none',
      }} />

      {/* Postage stamp — top right */}
      <div style={{
        position: 'absolute', top: '14px', right: '14px',
        width: '52px', height: '64px',
        background: '#F5E6CC',
        border: '1px solid rgba(168,134,74,0.5)',
        boxShadow: '1px 1px 3px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '2px',
      }}>
        {/* Mountains SVG */}
        <svg width="34" height="22" viewBox="0 0 34 22">
          <polygon points="0,22 8,6 16,22" fill="#4A5D3F" opacity="0.7"/>
          <polygon points="10,22 20,2 30,22" fill="#5C6B47" opacity="0.8"/>
          <polygon points="22,22 28,10 34,22" fill="#4A5D3F" opacity="0.6"/>
          <rect x="0" y="18" width="34" height="4" fill="#A8864A" opacity="0.3"/>
        </svg>
        <span style={{ fontSize: '5px', color: '#8B4A2E', fontFamily: 'Cormorant SC, serif', letterSpacing: '0.05em' }}>ГРУЗИЯ</span>
      </div>

      {/* Address block — center */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        {guestName ? (
          <>
            <div style={{
              fontFamily: 'Lora, serif', fontStyle: 'italic',
              color: '#8B4A2E', fontSize: 'clamp(0.55rem, 1.8vw, 0.7rem)',
              marginBottom: '4px', opacity: 0.8,
            }}>
              Кому:
            </div>
            <div className="font-script" style={{
              color: '#5C1F1F',
              fontSize: 'clamp(1rem, 4vw, 1.5rem)',
              lineHeight: 1.2,
            }}>
              {salutation} {guestName}
            </div>
          </>
        ) : (
          <div className="font-sc" style={{
            color: '#5C1F1F', fontSize: 'clamp(0.8rem, 3vw, 1.1rem)',
            letterSpacing: '0.2em', opacity: 0.8,
          }}>
            ПРИГЛАШЕНИЕ
          </div>
        )}
      </div>

      {/* Flip hint — bottom center */}
      <div style={{
        position: 'absolute', bottom: '12px', left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'Lora, serif', fontStyle: 'italic',
        color: '#8B4A2E', fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
        opacity: 0.7,
        animation: 'scrollHint 1.8s ease-in-out infinite',
      }}>
        ↓ прокрутите или нажмите ↓
      </div>
    </div>
  )
}

/**
 * @param {{ scrollPhase: number, guestName?: string, salutation?: string, onSealClick?: () => void, onFlipClick?: () => void }} props
 */
export default function Envelope({ scrollPhase, guestName, salutation, onSealClick, onFlipClick }) {
  const p = scrollPhase
  const envelopeBodyRef = useRef(null)
  const [startScale, setStartScale] = useState(0.28)
  const [isLg, setIsLg] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)

  useEffect(() => {
    const compute = () => {
      setIsLg(window.innerWidth >= 1024)
      if (!envelopeBodyRef.current) return
      const envelopeEl = envelopeBodyRef.current
      const envelopeW = envelopeEl.offsetWidth * 0.9
      const envelopeH = envelopeEl.offsetHeight * 0.8
      const container = envelopeEl.closest('[data-envelope-container]')
      const vw = container?.offsetWidth  ?? window.innerWidth
      const vh = container?.offsetHeight ?? window.innerHeight
      setStartScale(Math.min(envelopeW / vw, envelopeH / vh))
    }
    // Debounce resize handler — Telegram WebView fires resize on scroll when
    // the browser chrome hides/shows, causing startScale to jitter. Running
    // compute immediately on mount (no debounce) and only debouncing the
    // listener ensures the initial value is correct while ignoring transient
    // scroll-triggered resize events.
    let debounceTimer = 0
    const debouncedCompute = () => {
      clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(compute, 200)
    }
    compute()
    window.addEventListener('resize', debouncedCompute)
    return () => {
      window.removeEventListener('resize', debouncedCompute)
      clearTimeout(debounceTimer)
    }
  }, [])

  // Phase calculations
  const flipPhase    = progress(p,  0, 15)  //  0–15%:  envelope flips front→back
  const sealBreak    = progress(p, 20, 38)  // 20–38%: seal breaks
  const flapOpen     = progress(p, 38, 55)  // 38–55%: flap opens
  const letterRise   = progress(p, 55, 75)  // 55–75%: letter rises
  const envelopeExit = progress(p, 90, 100) // 90–100%: envelope exits

  const isIdle = p < 3  // idle only before any scroll
  const sealClickable = flipPhase >= 0.9 && sealBreak === 0 && onSealClick

  // Envelope container position — kept on the outermost wrapper
  const envelopeScale = lerp(1, 0, envelopeExit)
  const envelopeTranslateY = lerp(0, -60, envelopeExit)
  const envelopeOpacity = lerp(1, 0, envelopeExit)

  // Seal break: two halves diverge
  const sealLeftX = lerp(0, -30, sealBreak)
  const sealRightX = lerp(0, 30, sealBreak)
  const sealOpacity = lerp(1, 0, sealBreak)

  // Flap rotation
  const flapRotateX = lerp(0, -175, flapOpen)

  // Letter rise
  const letterTranslateY = lerp(0, -80, letterRise)

  // Expanding card phase
  const letterExpand   = progress(p, 72, 97)
  const cardScale      = lerp(startScale, 1, letterExpand)
  const cardRadius     = lerp(4, 0, letterExpand)
  const cardOpacity    = letterRise > 0 ? 1 : 0
  const cardTranslateY = lerp(letterTranslateY * 0.3, 0, letterExpand)
  const contentOpacity = letterExpand > 0.4 ? lerp(0, 1, (letterExpand - 0.4) / 0.6) : 0

  return (
    <div data-envelope-container className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
      {/* Envelope wrapper — scale/opacity live here for the exit phase */}
      <div
        style={{
          transform: `scale(${envelopeScale}) translateY(${envelopeTranslateY}vh)`,
          opacity: envelopeOpacity,
          transition: 'none',
          position: 'relative',
        }}
      >
        {/* 3D flip container */}
        <div style={{ perspective: '1200px', width: 'min(380px, 85vw)' }}>
          <div
            style={{
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: `rotateY(${lerp(0, 180, flipPhase)}deg)`,
            }}
          >
            {/* FRONT FACE — always in DOM, hidden once rotated past 90° */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                position: flipPhase >= 1 ? 'absolute' : 'relative',
                top: 0, left: 0, right: 0,
              }}
            >
              <FrontFace
                guestName={guestName}
                salutation={salutation}
                onFlip={onFlipClick}
              />
            </div>

            {/* BACK FACE — existing envelope content (wax seal side) */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                position: flipPhase < 1 ? 'absolute' : 'relative',
                top: 0, left: 0, right: 0,
              }}
            >
              {/* Envelope body */}
              <div
                ref={envelopeBodyRef}
                className="relative"
                onClick={sealClickable ? onSealClick : undefined}
                style={{
                  animation: isIdle ? 'breathe 3s ease-in-out infinite' : 'none',
                  transformOrigin: 'center',
                  cursor: sealClickable ? 'pointer' : 'default',
                }}
              >
                {/* Main envelope body */}
                <svg viewBox="0 0 380 260" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
                  {/* Envelope back */}
                  <rect x="0" y="0" width="380" height="260" rx="4" fill="#C9A876"/>
                  <rect x="0" y="0" width="380" height="260" rx="4" fill="none" stroke="#A8864A" strokeWidth="1.5" opacity="0.5"/>

                  {/* Bottom triangle fold */}
                  <polygon points="0,260 190,145 380,260" fill="#B8975E" opacity="0.8"/>

                  {/* Left fold */}
                  <polygon points="0,0 0,260 160,145" fill="#D4B896" opacity="0.5"/>

                  {/* Right fold */}
                  <polygon points="380,0 380,260 220,145" fill="#C0A060" opacity="0.4"/>

                  {/* Center diamond lines */}
                  <line x1="0" y1="260" x2="190" y2="145" stroke="#A8864A" strokeWidth="0.5" opacity="0.4"/>
                  <line x1="380" y1="260" x2="190" y2="145" stroke="#A8864A" strokeWidth="0.5" opacity="0.4"/>

                  {/* Decorative border inside */}
                  <rect x="8" y="8" width="364" height="244" rx="2" fill="none" stroke="#A8864A" strokeWidth="0.5" opacity="0.3" strokeDasharray="4 3"/>
                </svg>


                {/* Flap (opens via rotateX) */}
                <div
                  className="absolute top-0 left-0 w-full"
                  style={{
                    perspective: '800px',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <svg
                    viewBox="0 0 380 140"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full"
                    style={{
                      transform: `rotateX(${flapRotateX}deg)`,
                      transformOrigin: 'top center',
                      transformStyle: 'preserve-3d',
                      transition: 'none',
                    }}
                  >
                    <polygon points="0,0 380,0 190,135" fill="#C9A876"/>
                    <polygon points="0,0 380,0 190,135" fill="none" stroke="#A8864A" strokeWidth="1" opacity="0.4"/>
                    <polygon points="10,0 370,0 190,125" fill="#D4B896" opacity="0.3"/>
                  </svg>
                </div>

                {/* Wax seal — image that shatters on scroll */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    ...(sealBreak === 0 && flipPhase >= 1
                      ? { animation: 'sealWobble 2.5s ease-in-out infinite' }
                      : { transform: 'translate(-50%, calc(-50% + 14px))' }
                    ),
                    pointerEvents: 'none',
                  }}
                >
                  <SealCanvas sealBreak={sealBreak} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {cardOpacity > 0 && (
        <div
          className="paper-texture"
          style={{
            position: 'absolute',
            inset: '0',
            borderRadius: `${cardRadius}px`,
            transform: `scale(${cardScale}) translateY(${cardTranslateY}px)`,
            transformOrigin: 'center center',
            opacity: cardOpacity,
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          {/* Mobile vine background — same as Letter */}
          <div
            className="lg:hidden"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              backgroundImage: 'url(/vine-vertical.png)',
              backgroundRepeat: 'repeat-y',
              backgroundSize: '40% auto',
              backgroundPosition: 'left bottom',
              opacity: 0.12,
            }}
          />

          {/* Content — same container/layout as Letter */}
          <div
            className="max-w-6xl mx-auto px-4 pb-0 w-full"
            style={{ position: 'relative', zIndex: 1, height: '100%', opacity: contentOpacity }}
          >
            {/* Left vine column — absolute, anchored to the bottom of the card */}
            <div
              className="hidden lg:block"
              style={{ position: 'absolute', left: 0, bottom: 0, width: '28%', minWidth: '200px', height: '100%', overflow: 'hidden' }}
            >
              <GrapeVineLetter anchor="bottom" />
            </div>

            {/* Right content column — vertically centred, left padding mirrors Letter */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', height: '100%', paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: isLg ? 'max(28%, 200px)' : 0 }}>
                {guestName && (
                  <p
                    className="font-script"
                    style={{
                      color: '#5C1F1F',
                      fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                      lineHeight: 1.1,
                      marginBottom: '1rem',
                    }}
                  >
                    {salutation} {guestName},
                  </p>
                )}

                <p
                  className="font-sc"
                  style={{
                    color: '#5C1F1F',
                    fontSize: '0.95rem',
                    letterSpacing: '0.15em',
                    marginBottom: '2rem',
                  }}
                >
                  ИРА И АРТЁМ НАЧИНАЮТ ОДНУ ИСТОРИЮ НА ДВОИХ.<br />
                  И ОЧЕНЬ ХОТЯТ, ЧТОБЫ ВЫ БЫЛИ РЯДОМ
                </p>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', width: '100%', maxWidth: '400px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #A8864A, transparent)' }} />
                  <svg viewBox="0 0 40 20" width="40" height="20" aria-hidden="true">
                    <path d="M20,10 Q15,4 10,10 Q15,16 20,10 Z" fill="#A8864A" opacity="0.7" />
                    <path d="M20,10 Q25,4 30,10 Q25,16 20,10 Z" fill="#A8864A" opacity="0.7" />
                    <circle cx="20" cy="10" r="2" fill="#A8864A" />
                  </svg>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #A8864A, transparent)' }} />
                </div>

                {/* Когда section */}
                <h2 style={{ color: '#5C1F1F', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.5rem' }}>
                  Когда
                </h2>
                <p className="font-sc" style={{ color: '#8B4A2E', fontSize: '1.4rem', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
                  22–23 ИЮНЯ 2026
                </p>
                <p style={{ color: '#5C1F1F', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  До нашего праздника осталось...
                </p>
                <Countdown targetDate={WEDDING_DATE} />

                {/* Add to Calendar */}
                <div style={{ marginTop: '1.5rem' }}>
                  <AddToCalendar />
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0 1.5rem', width: '100%', maxWidth: '400px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #A8864A, transparent)' }} />
                  <svg viewBox="0 0 40 20" width="40" height="20" aria-hidden="true">
                    <path d="M20,10 Q15,4 10,10 Q15,16 20,10 Z" fill="#A8864A" opacity="0.7" />
                    <path d="M20,10 Q25,4 30,10 Q25,16 20,10 Z" fill="#A8864A" opacity="0.7" />
                    <circle cx="20" cy="10" r="2" fill="#A8864A" />
                  </svg>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, #A8864A, transparent)' }} />
                </div>

                {/* Scroll hint */}
                <p
                  style={{
                    color: '#8B4A2E',
                    fontSize: '0.8rem',
                    fontStyle: 'italic',
                    letterSpacing: '0.1em',
                    animation: 'scrollHint 1.8s ease-in-out infinite',
                  }}
                >
                  ↓ листайте
                </p>
              </div>

          </div>
        </div>
      )}

    </div>
  )
}
