import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import Envelope from '../../components/Envelope.jsx'

// Stub ResizeObserver not provided by jsdom
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('Envelope component', () => {
  describe('Phase calculations — basic rendering', () => {
    it('renders without crashing at scrollPhase 0', () => {
      const { container } = render(<Envelope scrollPhase={0} />)
      expect(container.firstChild).not.toBeNull()
    })

    it('renders without crashing at scrollPhase 100', () => {
      const { container } = render(<Envelope scrollPhase={100} />)
      expect(container.firstChild).not.toBeNull()
    })

    it('has absolute inset-0 container with zIndex 10', () => {
      const { container } = render(<Envelope scrollPhase={0} />)
      const root = container.firstChild
      expect(root).not.toBeNull()
      // The top-level div has className containing 'absolute' and 'inset-0'
      const el = /** @type {HTMLElement} */ (root)
      expect(el.className).toContain('absolute')
      expect(el.className).toContain('inset-0')
      expect(el.style.zIndex).toBe('10')
    })
  })

  describe('Guest name display', () => {
    it('shows guest name when guestName prop provided and phase < 15', () => {
      const { getAllByText } = render(<Envelope scrollPhase={0} guestName="Мария" />)
      // Name appears in both FrontFace and the back-face overlay
      expect(getAllByText(/Мария/).length).toBeGreaterThanOrEqual(1)
    })

    it('does not show guest name text when guestName is not provided', () => {
      const { queryByText } = render(<Envelope scrollPhase={0} />)
      expect(queryByText(/Дорогой/)).toBeNull()
    })
  })

  describe('Scroll hint', () => {
    it('shows scroll hint text on FrontFace', () => {
      const { getByText } = render(<Envelope scrollPhase={0} />)
      // FrontFace always renders the scroll/tap hint
      expect(getByText(/прокрутите/)).toBeTruthy()
    })

    it('FrontFace is always in the DOM (scroll-driven flip, not click-driven)', () => {
      // FrontFace is never unmounted — backfaceVisibility:hidden hides it visually at phase>=15
      const { getByText } = render(<Envelope scrollPhase={50} />)
      expect(getByText(/прокрутите/)).toBeTruthy()
    })
  })

  describe('Full-screen expanding card — removed', () => {
    it('does NOT render the full-screen card at any phase (card was removed)', () => {
      const phases = [0, 50, 55, 56, 60, 72, 80, 97, 100]
      for (const phase of phases) {
        const { container } = render(<Envelope scrollPhase={phase} />)
        const cards = Array.from(container.querySelectorAll('[style]')).filter((el) => {
          return /** @type {HTMLElement} */ (el).style.zIndex === '20'
        })
        expect(cards.length, `expected no card at phase ${phase}`).toBe(0)
      }
    })

    it('does not render "Ира & Артём" heading at any phase', () => {
      const { queryByText } = render(<Envelope scrollPhase={97} />)
      expect(queryByText('Ира & Артём')).toBeNull()
    })

    it('does not render "22–23 ИЮНЯ 2026" text at any phase', () => {
      const { queryByText } = render(<Envelope scrollPhase={97} />)
      expect(queryByText('22–23 ИЮНЯ 2026')).toBeNull()
    })

    it('does not render paper-texture full-screen div at phase 60', () => {
      const { container } = render(<Envelope scrollPhase={60} />)
      const cards = Array.from(container.querySelectorAll('.paper-texture')).filter((el) => {
        return /** @type {HTMLElement} */ (el).style.position === 'absolute'
          && /** @type {HTMLElement} */ (el).style.inset === '0px'
      })
      expect(cards.length).toBe(0)
    })
  })

  describe('Old small letter card is removed', () => {
    it('does NOT render the old letter rising from inside envelope body (no bottom:20px card)', () => {
      const { container } = render(<Envelope scrollPhase={65} />)
      // The old card had position:absolute, bottom:20px inline style
      // We check that no element with style bottom "20px" exists
      const oldCards = Array.from(container.querySelectorAll('[style]')).filter((el) => {
        return /** @type {HTMLElement} */ (el).style.bottom === '20px'
      })
      expect(oldCards.length).toBe(0)
    })
  })

  describe('Envelope exit phase', () => {
    it('envelope container opacity decreases to 0 at phase 100', () => {
      const { container } = render(<Envelope scrollPhase={100} />)
      // Envelope wrapper div (child of absolute inset-0 container) should have opacity 0
      const root = container.firstChild
      const envelopeWrapper = /** @type {HTMLElement} */ (root).firstChild
      expect(envelopeWrapper).not.toBeNull()
      const opacity = parseFloat(/** @type {HTMLElement} */ (envelopeWrapper).style.opacity)
      expect(opacity).toBe(0)
    })
  })

  describe('Phase ranges — no card at any phase', () => {
    it('at phase 55, no card with zIndex 20 exists', () => {
      const { container } = render(<Envelope scrollPhase={55} />)
      const cards = Array.from(container.querySelectorAll('[style]')).filter((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(cards.length).toBe(0)
    })

    it('at phase 56, no card with zIndex 20 exists', () => {
      const { container } = render(<Envelope scrollPhase={56} />)
      const cards = Array.from(container.querySelectorAll('[style]')).filter((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(cards.length).toBe(0)
    })
  })

  describe('pointerEvents', () => {
    it('envelope body div has no blocking pointerEvents (card removed, no zIndex-20 overlay)', () => {
      const { container } = render(<Envelope scrollPhase={80} />)
      // After card removal, no element with zIndex 20 should exist
      const card = Array.from(container.querySelectorAll('[style]')).find((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(card).toBeUndefined()
    })
  })

  describe('Flip interaction — scroll-driven, FrontFace always in DOM', () => {
    it('shows the FrontFace initially at phase 0 (scroll hint visible)', () => {
      const { getByText } = render(<Envelope scrollPhase={0} guestName="Мария" salutation="Дорогая" />)
      // FrontFace contains the scroll/tap hint
      expect(getByText(/прокрутите/)).toBeTruthy()
    })

    it('shows ПРИГЛАШЕНИЕ on FrontFace when no guestName is provided', () => {
      const { getAllByText } = render(<Envelope scrollPhase={0} />)
      // FrontFace shows ПРИГЛАШЕНИЕ when no guest name
      const matches = getAllByText('ПРИГЛАШЕНИЕ')
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })

    it('renders a perspective container wrapping the flip card', () => {
      const { container } = render(<Envelope scrollPhase={0} />)
      const perspectiveEl = /** @type {HTMLElement | null} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          return /** @type {HTMLElement} */ (el).style.perspective === '1200px'
        })
      )
      expect(perspectiveEl).not.toBeNull()
    })

    it('flip inner div starts with rotateY(0deg) at phase 0', () => {
      const { container } = render(<Envelope scrollPhase={0} />)
      const flipInner = /** @type {HTMLElement | null} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          const s = /** @type {HTMLElement} */ (el).style
          return s.transformStyle === 'preserve-3d'
        })
      )
      expect(flipInner).not.toBeNull()
      expect(/** @type {HTMLElement} */ (flipInner).style.transform).toBe('rotateY(0deg)')
    })

    it('flip inner div is rotateY(180deg) at phase 15 (flip complete)', () => {
      const { container } = render(<Envelope scrollPhase={15} />)
      const flipInner = /** @type {HTMLElement | null} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          const s = /** @type {HTMLElement} */ (el).style
          return s.transformStyle === 'preserve-3d'
        })
      )
      expect(flipInner).not.toBeNull()
      expect(/** @type {HTMLElement} */ (flipInner).style.transform).toBe('rotateY(180deg)')
    })

    it('FrontFace scroll hint is present at late phase (scroll-driven, always in DOM)', () => {
      // At phase 60 (past flip), FrontFace is hidden visually via backfaceVisibility
      // but still remains in the DOM — scroll hint text is still queryable
      const { queryAllByText } = render(<Envelope scrollPhase={60} />)
      const hints = queryAllByText(/прокрутите/)
      expect(hints.length).toBeGreaterThanOrEqual(1)
    })

    it('back face (envelope body) is always in DOM', () => {
      const { container } = render(<Envelope scrollPhase={0} />)
      // The main envelope SVG (rect fill="#C9A876") is always rendered
      const svgElements = container.querySelectorAll('svg')
      // Multiple SVGs: envelope body + possibly flap + stamp
      expect(svgElements.length).toBeGreaterThanOrEqual(1)
    })

    it('back face has transform rotateY(180deg) applied to it', () => {
      const { container } = render(<Envelope scrollPhase={0} />)
      // The back face wrapper has inline transform: rotateY(180deg)
      const backFaceEl = /** @type {HTMLElement | null} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          const s = /** @type {HTMLElement} */ (el).style
          return s.transform === 'rotateY(180deg)' && s.backfaceVisibility === 'hidden'
        })
      )
      expect(backFaceEl).not.toBeNull()
    })

    it('envelope outer wrapper still carries scale and opacity for exit phase', () => {
      const { container } = render(<Envelope scrollPhase={100} />)
      const root = container.firstChild
      const envelopeWrapper = /** @type {HTMLElement} */ (root).firstChild
      expect(envelopeWrapper).not.toBeNull()
      const opacity = parseFloat(/** @type {HTMLElement} */ (envelopeWrapper).style.opacity)
      expect(opacity).toBe(0)
    })
  })
})
