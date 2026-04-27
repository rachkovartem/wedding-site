import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
      const { getByText } = render(<Envelope scrollPhase={0} guestName="Мария" />)
      expect(getByText(/Мария/)).toBeTruthy()
    })

    it('does not show guest name text when guestName is not provided', () => {
      const { queryByText } = render(<Envelope scrollPhase={0} />)
      expect(queryByText(/Дорогой/)).toBeNull()
    })
  })

  describe('Scroll hint', () => {
    it('shows scroll hint when phase < 5', () => {
      const { container } = render(<Envelope scrollPhase={0} />)
      const hint = container.querySelector('.absolute.bottom-8')
      expect(hint).not.toBeNull()
    })

    it('hides scroll hint when phase >= 5', () => {
      const { container } = render(<Envelope scrollPhase={10} />)
      const hint = container.querySelector('.absolute.bottom-8')
      expect(hint).toBeNull()
    })
  })

  describe('Full-screen card (new expanding card behavior)', () => {
    it('does NOT render the full-screen card when letterRise is 0 (phase < 55)', () => {
      const { container } = render(<Envelope scrollPhase={50} />)
      // The new card has zIndex: 20 and position: absolute with inset: 0 via style
      const cards = Array.from(container.querySelectorAll('[style]')).filter((el) => {
        const style = /** @type {HTMLElement} */ (el).style
        return style.zIndex === '20'
      })
      expect(cards.length).toBe(0)
    })

    it('renders the full-screen card when letter starts rising (phase = 60)', () => {
      const { container } = render(<Envelope scrollPhase={60} />)
      const cards = Array.from(container.querySelectorAll('[style]')).filter((el) => {
        const style = /** @type {HTMLElement} */ (el).style
        return style.zIndex === '20'
      })
      expect(cards.length).toBe(1)
    })

    it('full-screen card has background color #D4B896 (parchment)', () => {
      const { container } = render(<Envelope scrollPhase={60} />)
      const card = Array.from(container.querySelectorAll('[style]')).find((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(card).toBeTruthy()
      // jsdom normalizes hex colors to rgb; accept both representations
      const bg = /** @type {HTMLElement} */ (card).style.background
      expect(bg === '#D4B896' || bg === 'rgb(212, 184, 150)').toBe(true)
    })

    it('full-screen card uses scale transform (small scale at phase 60)', () => {
      const { container } = render(<Envelope scrollPhase={60} />)
      const card = /** @type {HTMLElement | undefined} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          return /** @type {HTMLElement} */ (el).style.zIndex === '20'
        })
      )
      expect(card).toBeTruthy()
      // At phase 60, letterExpand=0 so scale should be at startScale (< 1)
      const transform = card.style.transform
      expect(transform).toContain('scale(')
    })

    it('full-screen card has borderRadius that approaches 0 as letterExpand approaches 1 (phase 97)', () => {
      const { container } = render(<Envelope scrollPhase={97} />)
      const card = /** @type {HTMLElement | undefined} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          return /** @type {HTMLElement} */ (el).style.zIndex === '20'
        })
      )
      expect(card).toBeTruthy()
      // At phase 97, letterExpand ~= 1, so borderRadius should be ~0px
      const radius = parseFloat(card.style.borderRadius)
      expect(radius).toBeLessThan(0.5)
    })

    it('content inside full-screen card has low opacity early in expansion (phase 60)', () => {
      const { container } = render(<Envelope scrollPhase={60} />)
      const card = Array.from(container.querySelectorAll('[style]')).find((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(card).toBeTruthy()
      // Content div inside card should have low/zero opacity since letterExpand = 0
      const contentDiv = card.firstChild
      expect(contentDiv).not.toBeNull()
      const contentEl = /** @type {HTMLElement} */ (contentDiv)
      const opacity = parseFloat(contentEl.style.opacity)
      expect(opacity).toBe(0)
    })

    it('content inside full-screen card has high opacity when fully expanded (phase 97)', () => {
      const { container } = render(<Envelope scrollPhase={97} />)
      const card = Array.from(container.querySelectorAll('[style]')).find((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(card).toBeTruthy()
      const contentEl = /** @type {HTMLElement} */ (card.firstChild)
      const opacity = parseFloat(contentEl.style.opacity)
      expect(opacity).toBeGreaterThan(0.9)
    })

    it('content inside card shows "Ира & Артём" heading', () => {
      const { getByText } = render(<Envelope scrollPhase={97} />)
      // At phase 97, card is visible and expanded
      expect(getByText('Ира & Артём')).toBeTruthy()
    })

    it('content inside card shows "22 ИЮНЯ 2026"', () => {
      const { getByText } = render(<Envelope scrollPhase={97} />)
      expect(getByText('22 ИЮНЯ 2026')).toBeTruthy()
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

  describe('Phase ranges — expanded phases 55-75 / 72-97', () => {
    it('at phase 55, letterRise is 0 — no card rendered', () => {
      const { container } = render(<Envelope scrollPhase={55} />)
      const cards = Array.from(container.querySelectorAll('[style]')).filter((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(cards.length).toBe(0)
    })

    it('at phase 56, letterRise > 0 — card is rendered', () => {
      const { container } = render(<Envelope scrollPhase={56} />)
      const cards = Array.from(container.querySelectorAll('[style]')).filter((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(cards.length).toBe(1)
    })
  })

  describe('pointerEvents', () => {
    it('full-screen card has pointerEvents: none', () => {
      const { container } = render(<Envelope scrollPhase={80} />)
      const card = /** @type {HTMLElement | undefined} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          return /** @type {HTMLElement} */ (el).style.zIndex === '20'
        })
      )
      expect(card).toBeTruthy()
      expect(card.style.pointerEvents).toBe('none')
    })
  })
})
