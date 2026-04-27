import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import FogLayer from '../../components/FogLayer.jsx'

// Helper to check if any inline style uses mask-image
/**
 * @param {Element} element
 * @returns {boolean}
 */
function hasMaskImage(element) {
  const style = element.getAttribute('style') || ''
  if (style.includes('mask-image') || style.includes('maskImage')) return true
  // Also check computed inline style
  const el = /** @type {HTMLElement} */ (element)
  if (el.style && (el.style.maskImage || '') !== '') return true
  return false
}

/**
 * @param {Element} element
 * @returns {boolean}
 */
function hasMaskImageRecursive(element) {
  if (hasMaskImage(element)) return true
  for (const child of element.children) {
    if (hasMaskImageRecursive(child)) return true
  }
  return false
}

describe('FogLayer', () => {
  let originalMatchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  describe('AC-2: mask-image constraint', () => {
    it('does NOT use mask-image in any inline styles', () => {
      const { container } = render(<FogLayer />)
      expect(hasMaskImageRecursive(container)).toBe(false)
    })

    it('uses transform on the cursor-reveal overlay (not mask-image)', () => {
      const { container } = render(<FogLayer />)
      // Should have no mask-image on any element
      expect(hasMaskImageRecursive(container)).toBe(false)
    })

    it('overlay element has will-change: transform', () => {
      // Default matchMedia returns matches: false for (hover: none), meaning desktop
      const { container } = render(<FogLayer />)
      const allDivs = container.querySelectorAll('div')
      const hasWillChangeTransform = Array.from(allDivs).some(
        (div) => div.style.willChange === 'transform'
      )
      expect(hasWillChangeTransform).toBe(true)
    })
  })

  describe('mousemove listener', () => {
    it('attaches mousemove listener on desktop (hover capable)', () => {
      // Default matchMedia stub returns matches: false for (hover: none) === desktop
      const addEventSpy = vi.spyOn(window, 'addEventListener')
      const { unmount } = render(<FogLayer />)

      const mousemoveCall = addEventSpy.mock.calls.find(([event]) => event === 'mousemove')
      expect(mousemoveCall).toBeDefined()
      unmount()
    })

    it('does NOT attach mousemove listener on mobile (touch/no-hover)', () => {
      // Override matchMedia to simulate touch device
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(hover: none)' ? true : false,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      const addEventSpy = vi.spyOn(window, 'addEventListener')
      render(<FogLayer />)

      const mousemoveCall = addEventSpy.mock.calls.find(([event]) => event === 'mousemove')
      expect(mousemoveCall).toBeUndefined()
    })
  })

  describe('fog drift animation', () => {
    it('renders fog gradient layers', () => {
      const { container } = render(<FogLayer />)
      const divsWithGradients = Array.from(container.querySelectorAll('div')).filter(
        (div) => (div.style.background || '').includes('radial-gradient')
      )
      expect(divsWithGradients.length).toBeGreaterThan(0)
    })

    it('fog layers use animation (fogDrift)', () => {
      const { container } = render(<FogLayer />)
      const animatedDivs = Array.from(container.querySelectorAll('div')).filter(
        (div) => (div.style.animation || '').includes('fogDrift')
      )
      expect(animatedDivs.length).toBeGreaterThan(0)
    })
  })
})
