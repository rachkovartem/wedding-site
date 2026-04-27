import React, { useMemo, useRef, useState, useEffect } from 'react'

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
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, calc(-50% + 14px))',
        width: '100px',
        height: '100px',
        pointerEvents: 'none',
      }}
    />
  )
}

/**
 * @param {{ scrollPhase: number, guestName?: string, salutation?: string, onSealClick?: () => void }} props
 */
export default function Envelope({ scrollPhase, guestName, salutation, onSealClick }) {
  const p = scrollPhase
  const envelopeBodyRef = useRef(null)
  const [startScale, setStartScale] = useState(0.28)

  useEffect(() => {
    const compute = () => {
      if (!envelopeBodyRef.current) return
      const envelopeEl = /** @type {HTMLElement} */ (envelopeBodyRef.current)
      const envelopeW = envelopeEl.offsetWidth * 0.9
      const envelopeH = envelopeEl.offsetHeight * 0.8
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Use the minimum of the two ratios (like object-contain)
      const scaleByW = envelopeW / vw
      const scaleByH = envelopeH / vh
      setStartScale(Math.min(scaleByW, scaleByH))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // Phase calculations
  const sealBreak = progress(p, 15, 35)    // 15-35%: seal breaks
  const flapOpen = progress(p, 35, 55)      // 35-55%: flap opens
  const letterRise   = progress(p, 55, 75)  // 55-75%: letter rises
  const letterExpand = progress(p, 72, 97)  // 72-97%: card expands to full screen
  const envelopeExit = progress(p, 90, 100) // 90-100%: envelope exits

  const isIdle = p < 15

  // Envelope container position
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

  // Full-screen card parameters
  const cardScale = lerp(startScale, 1, letterExpand)
  const cardRadius = lerp(4, 0, letterExpand)
  const cardOpacity = letterRise > 0 ? 1 : 0

  // Content inside card fades in when card is already 40%+ expanded
  const contentOpacity = letterExpand > 0.4
    ? lerp(0, 1, (letterExpand - 0.4) / 0.6)
    : 0

  // Vertical offset: card rises with the letter then settles as it expands
  const cardTranslateY = lerp(letterTranslateY * 0.3, 0, letterExpand)

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
      {/* Envelope wrapper — exits during envelopeExit phase */}
      <div
        style={{
          transform: `scale(${envelopeScale}) translateY(${envelopeTranslateY}vh)`,
          opacity: envelopeOpacity,
          transition: 'none',
          width: 'min(380px, 85vw)',
          position: 'relative',
        }}
      >
        {/* Guest name above envelope */}
        {guestName && (
          <div
            className="text-center mb-4 font-script"
            style={{
              color: '#F5E6CC',
              fontSize: 'clamp(1.2rem, 4vw, 2rem)',
              opacity: lerp(1, 0, sealBreak),
              letterSpacing: '0.05em',
            }}
          >
            {salutation || 'Дорогой'}{' '}
            <span>{guestName}</span>
          </div>
        )}

        {/* Envelope body */}
        <div
          ref={envelopeBodyRef}
          className="relative"
          onClick={isIdle && onSealClick ? onSealClick : undefined}
          style={{
            animation: isIdle ? 'breathe 3s ease-in-out infinite' : 'none',
            transformOrigin: 'center',
            cursor: isIdle && onSealClick ? 'pointer' : 'default',
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
          <SealCanvas sealBreak={sealBreak} />
        </div>
      </div>

      {/* Full-screen expanding card — sibling of the envelope wrapper */}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Content fades in as card expands */}
          <div style={{ opacity: contentOpacity, textAlign: 'center', padding: '2rem' }}>
            <div
              style={{
                fontFamily: "'Marck Script', cursive",
                color: '#5C1F1F',
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                lineHeight: 1.1,
                marginBottom: '0.5rem',
              }}
            >
              Ира & Артём
            </div>
            <div
              style={{
                fontFamily: 'Cormorant SC, Georgia, serif',
                color: '#8B4A2E',
                fontSize: '1.1rem',
                letterSpacing: '0.15em',
              }}
            >
              22–23 ИЮНЯ 2026
            </div>
          </div>
        </div>
      )}

      {/* Scroll hint */}
      {p < 5 && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
          style={{
            color: '#D4B896',
            fontSize: '0.95rem',
            fontFamily: 'Lora, serif',
            letterSpacing: '0.1em',
          }}
        >
          <div style={{ animation: 'scrollHint 1.8s ease-in-out infinite' }}>↓ прокрутите ↓</div>
        </div>
      )}
    </div>
  )
}
