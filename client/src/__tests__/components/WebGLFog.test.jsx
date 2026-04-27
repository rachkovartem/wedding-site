import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import WebGLFog from '../../components/WebGLFog.jsx'

describe('WebGLFog', () => {
  let originalMatchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
    // WebGL is not supported in jsdom — mock getContext to return null (fallback path)
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null)
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  describe('AC-1: canvas element rendered', () => {
    it('renders a canvas element with data-testid="webgl-fog"', () => {
      const { container } = render(<WebGLFog />)
      const canvas = container.querySelector('[data-testid="webgl-fog"]')
      expect(canvas).not.toBeNull()
      expect(canvas.tagName.toLowerCase()).toBe('canvas')
    })

    it('canvas is visible (display: block)', () => {
      const { container } = render(<WebGLFog />)
      const canvas = /** @type {HTMLCanvasElement} */ (container.querySelector('[data-testid="webgl-fog"]'))
      expect(canvas).not.toBeNull()
      expect(canvas.style.display).toBe('block')
    })

    it('canvas covers the full hero area (position absolute, inset 0)', () => {
      const { container } = render(<WebGLFog />)
      const canvas = /** @type {HTMLCanvasElement} */ (container.querySelector('[data-testid="webgl-fog"]'))
      expect(canvas).not.toBeNull()
      expect(canvas.style.position).toBe('absolute')
      expect(canvas.style.inset).toBe('0')
      expect(canvas.style.width).toBe('100%')
      expect(canvas.style.height).toBe('100%')
    })

    it('canvas has zIndex: 1 (below vine/envelope)', () => {
      const { container } = render(<WebGLFog />)
      const canvas = /** @type {HTMLCanvasElement} */ (container.querySelector('[data-testid="webgl-fog"]'))
      expect(canvas).not.toBeNull()
      expect(canvas.style.zIndex).toBe('1')
    })
  })

  describe('AC-2: will-change and no mask-image', () => {
    it('canvas has will-change: transform style', () => {
      const { container } = render(<WebGLFog />)
      const canvas = /** @type {HTMLCanvasElement} */ (container.querySelector('[data-testid="webgl-fog"]'))
      expect(canvas).not.toBeNull()
      expect(canvas.style.willChange).toBe('transform')
    })

    it('does NOT use mask-image anywhere in DOM', () => {
      const { container } = render(<WebGLFog />)
      const allElements = Array.from(container.querySelectorAll('[style]'))
      const hasMaskImage = allElements.some((el) => {
        const style = el.getAttribute('style') || ''
        const htmlEl = /** @type {HTMLElement} */ (el)
        return (
          style.includes('mask-image') ||
          style.includes('maskImage') ||
          (htmlEl.style && (htmlEl.style.maskImage || '') !== '')
        )
      })
      expect(hasMaskImage).toBe(false)
    })
  })

  describe('mousemove listener', () => {
    it('attaches mousemove listener on desktop (hover capable)', () => {
      // Provide a minimal WebGL-like context so the effect doesn't bail out early
      const mockGl = {
        createShader: vi.fn().mockReturnValue({}),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn().mockReturnValue(true),
        getShaderInfoLog: vi.fn().mockReturnValue(''),
        deleteShader: vi.fn(),
        createProgram: vi.fn().mockReturnValue({}),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn().mockReturnValue(true),
        getProgramInfoLog: vi.fn().mockReturnValue(''),
        useProgram: vi.fn(),
        createBuffer: vi.fn().mockReturnValue({}),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        getAttribLocation: vi.fn().mockReturnValue(0),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        getUniformLocation: vi.fn().mockReturnValue({}),
        createTexture: vi.fn().mockReturnValue({}),
        bindTexture: vi.fn(),
        texImage2D: vi.fn(),
        texParameteri: vi.fn(),
        activeTexture: vi.fn(),
        createFramebuffer: vi.fn().mockReturnValue({}),
        bindFramebuffer: vi.fn(),
        framebufferTexture2D: vi.fn(),
        deleteTexture: vi.fn(),
        deleteFramebuffer: vi.fn(),
        uniform1i: vi.fn(),
        uniform2f: vi.fn(),
        uniform1f: vi.fn(),
        drawArrays: vi.fn(),
        viewport: vi.fn(),
        VERTEX_SHADER: 35633,
        FRAGMENT_SHADER: 35632,
        COMPILE_STATUS: 35713,
        LINK_STATUS: 35714,
        ARRAY_BUFFER: 34962,
        STATIC_DRAW: 35044,
        FLOAT: 5126,
        TRIANGLES: 4,
        TEXTURE_2D: 3553,
        RGBA: 6408,
        UNSIGNED_BYTE: 5121,
        TEXTURE_WRAP_S: 10242,
        TEXTURE_WRAP_T: 10243,
        TEXTURE_MIN_FILTER: 10241,
        TEXTURE_MAG_FILTER: 10240,
        CLAMP_TO_EDGE: 33071,
        LINEAR: 9729,
        FRAMEBUFFER: 36160,
        COLOR_ATTACHMENT0: 36064,
        TEXTURE0: 33984,
        TEXTURE1: 33985,
      }
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockGl)

      const addEventSpy = vi.spyOn(window, 'addEventListener')
      const { unmount } = render(<WebGLFog />)

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

      // Even with a working gl context, mobile should NOT add mousemove
      const mockGl = {
        createShader: vi.fn().mockReturnValue({}),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn().mockReturnValue(true),
        getShaderInfoLog: vi.fn().mockReturnValue(''),
        deleteShader: vi.fn(),
        createProgram: vi.fn().mockReturnValue({}),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn().mockReturnValue(true),
        getProgramInfoLog: vi.fn().mockReturnValue(''),
        useProgram: vi.fn(),
        createBuffer: vi.fn().mockReturnValue({}),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        getAttribLocation: vi.fn().mockReturnValue(0),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        getUniformLocation: vi.fn().mockReturnValue({}),
        createTexture: vi.fn().mockReturnValue({}),
        bindTexture: vi.fn(),
        texImage2D: vi.fn(),
        texParameteri: vi.fn(),
        activeTexture: vi.fn(),
        createFramebuffer: vi.fn().mockReturnValue({}),
        bindFramebuffer: vi.fn(),
        framebufferTexture2D: vi.fn(),
        deleteTexture: vi.fn(),
        deleteFramebuffer: vi.fn(),
        uniform1i: vi.fn(),
        uniform2f: vi.fn(),
        uniform1f: vi.fn(),
        drawArrays: vi.fn(),
        viewport: vi.fn(),
        VERTEX_SHADER: 35633,
        FRAGMENT_SHADER: 35632,
        COMPILE_STATUS: 35713,
        LINK_STATUS: 35714,
        ARRAY_BUFFER: 34962,
        STATIC_DRAW: 35044,
        FLOAT: 5126,
        TRIANGLES: 4,
        TEXTURE_2D: 3553,
        RGBA: 6408,
        UNSIGNED_BYTE: 5121,
        TEXTURE_WRAP_S: 10242,
        TEXTURE_WRAP_T: 10243,
        TEXTURE_MIN_FILTER: 10241,
        TEXTURE_MAG_FILTER: 10240,
        CLAMP_TO_EDGE: 33071,
        LINEAR: 9729,
        FRAMEBUFFER: 36160,
        COLOR_ATTACHMENT0: 36064,
        TEXTURE0: 33984,
        TEXTURE1: 33985,
      }
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockGl)

      const addEventSpy = vi.spyOn(window, 'addEventListener')
      render(<WebGLFog />)

      const mousemoveCall = addEventSpy.mock.calls.find(([event]) => event === 'mousemove')
      expect(mousemoveCall).toBeUndefined()
    })
  })
})
