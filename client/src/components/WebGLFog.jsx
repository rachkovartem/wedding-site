import React, { useRef, useEffect } from 'react'

const PHOTO_URL =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80'

const VERT_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAG_SRC = `
precision mediump float;

uniform sampler2D uPhoto;
uniform sampler2D uDisturbance;
uniform vec2      uResolution;
uniform float     uTime;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(hash(i), hash(i+vec2(1,0)), f.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  mat2 rot = mat2(0.8660, 0.5, -0.5, 0.8660);
  for (int i = 0; i < 6; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  uv.y = 1.0 - uv.y;

  float photoAspect = 16.0 / 9.0;
  float canvasAspect = uResolution.x / uResolution.y;
  vec2 photoUv = uv;
  if (canvasAspect > photoAspect) {
    float scale = canvasAspect / photoAspect;
    photoUv.y = (uv.y - 0.5) / scale + 0.5;
  } else {
    float scale = photoAspect / canvasAspect;
    photoUv.x = (uv.x - 0.5) / scale + 0.5;
  }
  photoUv = clamp(photoUv, 0.0, 1.0);

  vec4 photo = texture2D(uPhoto, photoUv);
  vec3 photoRgb = photo.rgb * 0.70;

  float t = uTime * 0.022;
  vec2 sc = uv * 3.0;

  vec2 q = vec2(fbm(sc + vec2(0.0, 0.0) + t),
                fbm(sc + vec2(5.2, 1.3) + t * 0.7));
  vec2 r = vec2(fbm(sc + 4.0*q + vec2(1.7, 9.2) + t * 1.1),
                fbm(sc + 4.0*q + vec2(8.3, 2.8) + t * 0.9));
  float fog = fbm(sc + 4.0*r + t * 0.5);

  float heightFog = smoothstep(0.6, 0.0, uv.y) * 0.6;
  fog = clamp(fog * 0.8 + heightFog, 0.0, 1.0);

  /* Raw WebGL coords for disturbance — matches how DIST_FRAG_SRC writes it (no y-flip) */
  float disturbance = texture2D(uDisturbance, gl_FragCoord.xy / uResolution).r;
  fog = mix(fog, 0.0, disturbance * 0.95);

  vec3 fogColor = mix(vec3(0.60, 0.64, 0.68), vec3(0.88, 0.88, 0.86), fog);

  vec3 color = mix(photoRgb, fogColor, fog * 0.88);

  float vig = 1.0 - smoothstep(0.4, 1.1, distance(uv, vec2(0.5)));
  color *= mix(0.82, 1.0, vig);

  gl_FragColor = vec4(color, 1.0);
}
`

const DIST_FRAG_SRC = `
precision mediump float;
uniform sampler2D uPrev;
uniform vec2      uResolution;
uniform vec2      uMouseNorm; /* CSS convention: y=0 at top of screen */
uniform float     uHasMouse;
uniform float     uAspect;   /* canvas width/height, e.g. 1.78 for 16:9 */
uniform float     uTime;
uniform float     uMouseSpeed; /* 1.0 = cursor moving, 0.0 = stationary */

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(hash(i), hash(i+vec2(1,0)), f.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
    f.y
  );
}

void main() {
  /* Raw WebGL coords — y=0 at bottom. NO flip here so ping-pong stays consistent. */
  vec2 uv = gl_FragCoord.xy / uResolution;

  float prev = texture2D(uPrev, uv).r * 0.982;

  float newDist = 0.0;
  if (uHasMouse > 0.5) {
    /* Convert mouse from CSS (y=0=top) to WebGL (y=0=bottom) */
    vec2 mouseGL = vec2(uMouseNorm.x, 1.0 - uMouseNorm.y);

    /* Aspect-ratio-correct distance using CANVAS ratio, not texture ratio */
    vec2 uvA = vec2(uv.x * uAspect, uv.y);
    vec2 mA  = vec2(mouseGL.x * uAspect, mouseGL.y);
    float d = distance(uvA, mA);

    float noiseScale = 22.0;
    float n1 = vnoise(uvA * noiseScale + vec2(uTime * 0.15, 0.0));
    float n2 = vnoise(uvA * noiseScale * 2.1 + vec2(0.0, uTime * 0.1));
    float chaos = n1 * 0.6 + n2 * 0.4;
    float baseRadius = 0.045;
    float variation = (chaos - 0.5) * 0.03;
    float radius = baseRadius + variation;
    newDist = (1.0 - smoothstep(0.0, radius, d)) * 0.88 * uMouseSpeed;
  }

  gl_FragColor = vec4(clamp(prev + newDist, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`

/**
 * Compiles a WebGL shader. Returns null and logs on failure.
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} src
 * @returns {WebGLShader | null}
 */
function compileShader(gl, type, src) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * Creates and links a WebGL program from vertex and fragment source.
 * @param {WebGLRenderingContext} gl
 * @param {string} vertSrc
 * @param {string} fragSrc
 * @returns {WebGLProgram | null}
 */
function createProgram(gl, vertSrc, fragSrc) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  if (!vert || !frag) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }
  return program
}

/**
 * Creates a framebuffer object with an attached RGBA texture.
 * @param {WebGLRenderingContext} gl
 * @param {number} w
 * @param {number} h
 * @returns {{ tex: WebGLTexture, fbo: WebGLFramebuffer }}
 */
function createFBO(gl, w, h) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return { tex, fbo }
}

export default function WebGLFog() {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = /** @type {WebGLRenderingContext | null} */ (
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    )
    // If WebGL is unavailable, the canvas shows the fallback dark background via CSS
    if (!gl) return

    // --- Compile programs ---
    const distProgram = createProgram(gl, VERT_SRC, DIST_FRAG_SRC)
    const fogProgram  = createProgram(gl, VERT_SRC, FRAG_SRC)
    if (!distProgram || !fogProgram) return

    // --- Fullscreen quad geometry (shared by both programs) ---
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    // --- Attribute locations ---
    const distAPos = gl.getAttribLocation(distProgram, 'aPosition')
    const fogAPos  = gl.getAttribLocation(fogProgram,  'aPosition')

    // --- Uniforms for distProgram ---
    const distLoc = {
      uPrev:       gl.getUniformLocation(distProgram, 'uPrev'),
      uResolution: gl.getUniformLocation(distProgram, 'uResolution'),
      uMouseNorm:  gl.getUniformLocation(distProgram, 'uMouseNorm'),
      uHasMouse:   gl.getUniformLocation(distProgram, 'uHasMouse'),
      uAspect:     gl.getUniformLocation(distProgram, 'uAspect'),
      uTime:       gl.getUniformLocation(distProgram, 'uTime'),
      uMouseSpeed: gl.getUniformLocation(distProgram, 'uMouseSpeed'),
    }

    // --- Uniforms for fogProgram ---
    const fogLoc = {
      uPhoto:       gl.getUniformLocation(fogProgram, 'uPhoto'),
      uDisturbance: gl.getUniformLocation(fogProgram, 'uDisturbance'),
      uResolution:  gl.getUniformLocation(fogProgram, 'uResolution'),
      uTime:        gl.getUniformLocation(fogProgram, 'uTime'),
    }

    // --- Photo texture: 1×1 placeholder until photo loads ---
    const photoTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, photoTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([31, 42, 36, 255])
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    // --- Load photo ---
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, photoTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    }
    img.src = PHOTO_URL

    // --- Mouse tracking (normalized 0-1, y=0 at top) ---
    const isMobile = window.matchMedia('(hover: none)').matches
    const mouse = { x: 0.5, y: 0.5 }
    let mouseActive = false
    let mouseSpeed = 0.0
    let prevMouse = { x: 0.5, y: 0.5 }

    /** @param {MouseEvent} e */
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = (e.clientX - rect.left) / rect.width
      mouse.y = (e.clientY - rect.top)  / rect.height
      mouseActive = mouse.x >= 0 && mouse.x <= 1 && mouse.y >= 0 && mouse.y <= 1
      mouseSpeed = 1.0
    }

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
    }

    // --- Resize canvas to match display size ---
    /** @type {ResizeObserver | null} */
    let resizeObserver = null

    const syncSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize)
      resizeObserver.observe(canvas)
    }
    syncSize()

    // --- Ping-pong FBOs for disturbance trail (fixed 512×512) ---
    const DIST_SIZE = 512
    let fboRead  = createFBO(gl, DIST_SIZE, DIST_SIZE)
    let fboWrite = createFBO(gl, DIST_SIZE, DIST_SIZE)

    // --- RAF animation loop ---
    let rafId = 0
    const startTime = performance.now()

    const render = () => {
      rafId = requestAnimationFrame(render)
      syncSize()
      const t = (performance.now() - startTime) / 1000

      mouseSpeed *= 0.88
      prevMouse.x = mouse.x
      prevMouse.y = mouse.y

      // === Pass 1: update disturbance texture ===
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboWrite.fbo)
      gl.viewport(0, 0, DIST_SIZE, DIST_SIZE)
      gl.useProgram(distProgram)
      gl.enableVertexAttribArray(distAPos)
      gl.vertexAttribPointer(distAPos, 2, gl.FLOAT, false, 0, 0)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fboRead.tex)
      gl.uniform1i(distLoc.uPrev, 0)
      gl.uniform2f(distLoc.uResolution, DIST_SIZE, DIST_SIZE)
      gl.uniform2f(distLoc.uMouseNorm, mouse.x, mouse.y)
      gl.uniform1f(distLoc.uHasMouse, (!isMobile && mouseActive) ? 1.0 : 0.0)
      gl.uniform1f(distLoc.uAspect, canvas.height > 0 ? canvas.width / canvas.height : 1.0)
      gl.uniform1f(distLoc.uTime, t)
      gl.uniform1f(distLoc.uMouseSpeed, mouseSpeed)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // === Pass 2: render main scene with disturbance mask ===
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(fogProgram)
      gl.enableVertexAttribArray(fogAPos)
      gl.vertexAttribPointer(fogAPos, 2, gl.FLOAT, false, 0, 0)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, photoTexture)
      gl.uniform1i(fogLoc.uPhoto, 0)

      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fboWrite.tex)
      gl.uniform1i(fogLoc.uDisturbance, 1)

      gl.uniform2f(fogLoc.uResolution, canvas.width, canvas.height)
      gl.uniform1f(fogLoc.uTime, t)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // === Swap ping-pong ===
      const tmp = fboRead; fboRead = fboWrite; fboWrite = tmp
    }

    render()

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(rafId)
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      gl.deleteTexture(fboRead.tex)
      gl.deleteFramebuffer(fboRead.fbo)
      gl.deleteTexture(fboWrite.tex)
      gl.deleteFramebuffer(fboWrite.fbo)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      data-testid="webgl-fog"
      style={{
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        zIndex: 1,
        willChange: 'transform',
        display: 'block',
        background: '#1F2A24',
      }}
    />
  )
}
