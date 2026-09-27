// Canvas particle effects for party changes. Each call owns the canvas until its animation ends.

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  const dpr = window.devicePixelRatio || 1
  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.imageSmoothingEnabled = false
  return { ctx, width, height }
}

function run(canvas: HTMLCanvasElement, duration: number, frame: (ctx: CanvasRenderingContext2D, t: number, dt: number) => void) {
  const prepared = prepare(canvas)
  if (!prepared) return
  const { ctx, width, height } = prepared
  let start = 0
  let last = 0
  const tick = (now: number) => {
    if (!start) start = last = now
    const t = (now - start) / duration
    ctx.clearRect(0, 0, width, height)
    if (t >= 1) return
    frame(ctx, t, Math.min(48, now - last) / 16.67)
    last = now
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

// Bursts the sprite into its own pixels: sampled from the drawn image, then flung outward under gravity.
export function explodeSprite(canvas: HTMLCanvasElement, img: HTMLImageElement | null) {
  if (reducedMotion()) return
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
      // Cap the particle count by sampling every nth sprite pixel
      const step = Math.max(1, Math.round(Math.sqrt((img.naturalWidth * img.naturalHeight) / 900)))
      const cx = rect.left - canvasRect.left + rect.width / 2
      const cy = rect.top - canvasRect.top + rect.height / 2
      for (let y = 0; data && y < sampler.height; y += step) {
        for (let x = 0; x < sampler.width; x += step) {
          const i = (y * sampler.width + x) * 4
          if (data[i + 3] < 128) continue
          const px = rect.left - canvasRect.left + x * pixel
          const py = rect.top - canvasRect.top + y * pixel
          const angle = Math.atan2(py - cy, px - cx) + (Math.random() - 0.5) * 0.9
          const speed = 1.4 + Math.random() * 3.2
          particles.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.6,
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
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5, size: 3, color: i % 3 ? '#3ddc97' : '#e6f4ee' })
    }
  }

  run(canvas, 1100, (ctx, t, dt) => {
    ctx.globalAlpha = 1 - t * t
    for (const p of particles) {
      p.vy += 0.16 * dt
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
}

// Level up: twinkling four-point stars rising around the sprite plus an expanding emerald ring.
export function sparkle(canvas: HTMLCanvasElement) {
  if (reducedMotion()) return
  const { width, height } = canvas.getBoundingClientRect()
  // Light stars vanish on the day theme's white panel, so each theme gets its own palette
  const day = document.documentElement.dataset.theme === 'light'
  const colors = day ? ['#067048', '#1fbf7f', '#c98a00', '#0b7d52'] : ['#7debbb', '#3ddc97', '#ffe27a', '#ffffff']
  const stars: Particle[] = Array.from({ length: 28 }, (_, i) => ({
    x: width / 2 + (Math.random() - 0.5) * width * 0.55,
    y: height / 2 + (Math.random() - 0.2) * height * 0.5,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -0.6 - Math.random() * 1.4,
    size: 4 + Math.random() * 6,
    color: colors[i % colors.length],
    spin: Math.random() * Math.PI,
  }))

  run(canvas, 1300, (ctx, t, dt) => {
    ctx.globalAlpha = Math.max(0, 0.55 - t) * 1.6
    ctx.strokeStyle = day ? '#1fbf7f' : '#3ddc97'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, 10 + t * Math.min(width, height) * 0.45, 0, Math.PI * 2)
    ctx.stroke()

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
