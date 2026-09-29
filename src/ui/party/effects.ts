// Canvas particle effects for party changes. Each call owns its canvas until it ends or the returned cancel runs.

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface FxOptions {
  // What it is drawn over. The handheld strip is a dark well even in day mode, so it passes 'dark';
  // omitted, the page theme decides (desktop rows sit on the panel surface).
  surface?: 'dark' | 'light'
  // 1 = desktop row (88px sprite box); chips pass ~0.55: smaller stars, slower and fewer particles
  scale?: number
  // Sprite box in CSS px, so the star spread follows the sprite instead of the padded canvas
  box?: { w: number; h: number }
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  spin?: number
}

function prepare(canvas: HTMLCanvasElement) {
  // 2px squares gain nothing from 3x, and phones are the constrained devices
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.imageSmoothingEnabled = false
  return { ctx, width, height }
}

function run(canvas: HTMLCanvasElement, duration: number, frame: (ctx: CanvasRenderingContext2D, t: number, dt: number) => void): () => void {
  const prepared = prepare(canvas)
  if (!prepared) return () => {}
  const { ctx, width, height } = prepared
  let start = 0
  let last = 0
  let raf = 0
  const tick = (now: number) => {
    if (!start) start = last = now
    const t = (now - start) / duration
    ctx.clearRect(0, 0, width, height)
    if (t >= 1) return
    frame(ctx, t, Math.min(48, now - last) / 16.67)
    last = now
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    ctx.clearRect(0, 0, width, height)
  }
}

// Bursts the sprite into its own pixels: sampled from the drawn image, then flung outward under gravity.
export function explodeSprite(canvas: HTMLCanvasElement, img: HTMLImageElement | null, { scale = 1 }: FxOptions = {}): () => void {
  const canvasRect = canvas.getBoundingClientRect()
  const particles: Particle[] = []

  if (img && img.complete && img.naturalWidth) {
    const rect = img.getBoundingClientRect()
    const sampler = document.createElement('canvas')
    sampler.width = img.naturalWidth
    sampler.height = img.naturalHeight
    const sctx = sampler.getContext('2d', { willReadFrequently: true })
    try {
      sctx?.drawImage(img, 0, 0)
      const data = sctx?.getImageData(0, 0, sampler.width, sampler.height).data
      const pixel = rect.width / img.naturalWidth
      // About 2 CSS px per particle: a 38px chip sprite gets ~120 particles instead of ~680; desktop rows barely change
      const step = Math.max(1, Math.round(2 / Math.max(pixel, 0.1)), Math.round(Math.sqrt((img.naturalWidth * img.naturalHeight) / 900)))
      const cx = rect.left - canvasRect.left + rect.width / 2
      const cy = rect.top - canvasRect.top + rect.height / 2
      for (let y = 0; data && y < sampler.height; y += step) {
        for (let x = 0; x < sampler.width; x += step) {
          const i = (y * sampler.width + x) * 4
          if (data[i + 3] < 128) continue
          const px = rect.left - canvasRect.left + x * pixel
          const py = rect.top - canvasRect.top + y * pixel
          const angle = Math.atan2(py - cy, px - cx) + (Math.random() - 0.5) * 0.9
          const speed = (1.4 + Math.random() * 3.2) * scale
          particles.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.6 * scale,
            size: Math.max(2, pixel * step),
            color: `rgb(${data[i]} ${data[i + 1]} ${data[i + 2]})`,
          })
        }
      }
    } catch {
      /* cross-origin image without CORS: fall through to a generic burst */
    }
  }
  if (particles.length === 0) {
    const cx = canvasRect.width / 2
    const cy = canvasRect.height / 2
    for (let i = 0; i < 60 * Math.max(scale, 0.5); i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (1 + Math.random() * 3) * scale
      particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5 * scale, size: 3, color: i % 3 ? '#3ddc97' : '#e6f4ee' })
    }
  }

  return run(canvas, 1100, (ctx, t, dt) => {
    ctx.globalAlpha = 1 - t * t
    for (const p of particles) {
      p.vy += 0.16 * scale * dt
      p.vx *= 0.985
      p.x += p.vx * dt
      p.y += p.vy * dt
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
    }
  })
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const radius = i % 2 === 0 ? r : r * 0.28
    const angle = rotation + (i * Math.PI) / 4
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
  }
  ctx.closePath()
  ctx.fill()
  // a hairline outline keeps light stars readable where the canvas overhangs a light surface
  ctx.stroke()
}

// Level up: twinkling four-point stars rising around the sprite plus an expanding emerald ring.
export function sparkle(canvas: HTMLCanvasElement, { surface, scale = 1, box }: FxOptions = {}): () => void {
  const { width, height } = canvas.getBoundingClientRect()
  const spriteW = box?.w ?? width - 96
  const spriteH = box?.h ?? height - 72
  const dark = (surface ?? (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')) === 'dark'
  const colors = dark ? ['#7debbb', '#3ddc97', '#ffe27a', '#ffffff'] : ['#067048', '#1fbf7f', '#c98a00', '#0b7d52']
  const stars: Particle[] = Array.from({ length: Math.round(28 * scale) }, (_, i) => ({
    x: width / 2 + (Math.random() - 0.5) * spriteW * 1.1,
    y: height / 2 + (Math.random() - 0.2) * spriteH * 1.1,
    vx: (Math.random() - 0.5) * 0.6 * scale,
    vy: (-0.6 - Math.random() * 1.4) * scale,
    size: (4 + Math.random() * 6) * scale,
    color: colors[i % colors.length],
    spin: Math.random() * Math.PI,
  }))
  const ringMax = Math.min(width, height) * 0.45 * scale

  return run(canvas, 1300, (ctx, t, dt) => {
    ctx.globalAlpha = Math.max(0, 0.55 - t) * 1.6
    ctx.strokeStyle = dark ? '#3ddc97' : '#1fbf7f'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, 10 * scale + t * ringMax, 0, Math.PI * 2)
    ctx.stroke()

    ctx.lineWidth = 1
    ctx.strokeStyle = dark ? 'rgb(3 24 16 / 0.7)' : 'rgb(232 242 236 / 0.85)'
    for (const [i, s] of stars.entries()) {
      s.x += s.vx * dt
      s.y += s.vy * dt
      const twinkle = 0.55 + 0.45 * Math.sin(t * 18 + i)
      ctx.globalAlpha = Math.max(0, (1 - t) * twinkle)
      ctx.fillStyle = s.color
      drawStar(ctx, s.x, s.y, s.size * (1 - t * 0.4), (s.spin ?? 0) + t * 3)
    }
  })
}

const TOUCH = '(hover: none) and (pointer: coarse)'
let lastBuzz = 0

// Vibration API: Android only (iOS Safari lacks it). One poll can level several mons: one buzz, not three.
export function haptic(kind: 'level' | 'faint') {
  // Chrome refuses (and logs an error) until the page has had a tap, so wait for one
  if (!('vibrate' in navigator) || !navigator.userActivation?.hasBeenActive) return
  if (document.visibilityState !== 'visible' || prefersReducedMotion() || !window.matchMedia(TOUCH).matches) return
  const now = performance.now()
  if (now - lastBuzz < 600) return
  lastBuzz = now
  navigator.vibrate(kind === 'level' ? [14, 44, 14] : 60)
}
