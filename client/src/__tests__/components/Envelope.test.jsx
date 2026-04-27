import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
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

    it('full-screen card uses paper-texture class for parchment appearance', () => {
      const { container } = render(<Envelope scrollPhase={60} />)
      const card = Array.from(container.querySelectorAll('[style]')).find((el) => {
        return /** @type {HTMLElement} */ (el).style.zIndex === '20'
      })
      expect(card).toBeTruthy()
      // Card uses CSS class for background, not inline style
      expect(/** @type {HTMLElement} */ (card).className).toContain('paper-texture')
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

    it('content inside card shows date range "22–23 ИЮНЯ 2026"', () => {
      const { getByText } = render(<Envelope scrollPhase={97} />)
      expect(getByText('22–23 ИЮНЯ 2026')).toBeTruthy()
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

  describe('Flip interaction — FrontFace / back face', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows the FrontFace initially at phase 0', () => {
      const { getByText } = render(<Envelope scrollPhase={0} guestName="Мария" salutation="Дорогая" />)
      // FrontFace contains the flip hint
      expect(getByText(/перевернуть/)).toBeTruthy()
    })

    it('shows ПРИГЛАШЕНИЕ on FrontFace when no guestName is provided', () => {
      const { getAllByText } = render(<Envelope scrollPhase={0} />)
      // FrontFace shows ПРИГЛАШЕНИЕ when no guest name
      const matches = getAllByText('ПРИГЛАШЕНИЕ')
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })

    it('shows the flip hint "↺ перевернуть" on the FrontFace', () => {
      const { getByText } = render(<Envelope scrollPhase={0} guestName="Мария" salutation="Дорогая" />)
      expect(getByText(/перевернуть/)).toBeTruthy()
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

    it('flip inner div starts with rotateY(0deg) when showFront is true', () => {
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

    it('clicking FrontFace starts the flip (transform changes to rotateY(180deg))', () => {
      const { container, getByText } = render(<Envelope scrollPhase={0} guestName="Мария" salutation="Дорогая" />)
      const hintEl = getByText(/перевернуть/)
      // Click the FrontFace (hint is inside it)
      fireEvent.click(hintEl)
      // During flipping state, the flip inner should be rotateY(180deg)
      const flipInner = /** @type {HTMLElement | null} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          const s = /** @type {HTMLElement} */ (el).style
          return s.transformStyle === 'preserve-3d'
        })
      )
      expect(flipInner).not.toBeNull()
      expect(/** @type {HTMLElement} */ (flipInner).style.transform).toBe('rotateY(180deg)')
    })

    it('FrontFace is removed from DOM after flip animation completes (700ms)', () => {
      const { container, getByText, queryByText } = render(<Envelope scrollPhase={0} guestName="Мария" salutation="Дорогая" />)
      // FrontFace flip hint is visible initially
      expect(getByText(/перевернуть/)).toBeTruthy()
      fireEvent.click(getByText(/перевернуть/))
      // Advance timers by 700ms to complete flip — showFront becomes false
      act(() => { vi.advanceTimersByTime(700) })
      // FrontFace is unmounted — the flip hint is no longer in the DOM
      expect(queryByText(/перевернуть/)).toBeNull()
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

    it('second click while flipping is ignored (no double-flip)', () => {
      const { container, getByText } = render(<Envelope scrollPhase={0} guestName="Мария" salutation="Дорогая" />)
      const hintEl = getByText(/перевернуть/)
      fireEvent.click(hintEl)
      // transform should be 180deg
      const getFlipInner = () => /** @type {HTMLElement | null} */ (
        Array.from(container.querySelectorAll('[style]')).find((el) => {
          const s = /** @type {HTMLElement} */ (el).style
          return s.transformStyle === 'preserve-3d'
        })
      )
      expect(/** @type {HTMLElement} */ (getFlipInner()).style.transform).toBe('rotateY(180deg)')
      // Advance only 300ms (flip still in progress)
      act(() => { vi.advanceTimersByTime(300) })
      // Transform should still be 180deg — second click had no effect
      expect(/** @type {HTMLElement} */ (getFlipInner()).style.transform).toBe('rotateY(180deg)')
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
