import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'
import { emeraldSpriteUrl, showdownSpriteUrl } from '../../sprites/spriteResolver'
import { useEmulatorStore } from '../../store/emulatorStore'
import { GemMark } from '../brand/GemMark'

const RAYQUAZA = 384
const SEEN_KEY = 'emerald-lens:splash-seen'
// Minimum time on screen: long enough on a fresh visit to enjoy it, brief when returning in the same session
const MIN_MS_FIRST_VISIT = 4500
const MIN_MS_RETURNING = 500

function firstVisitThisSession() {
  try {
    const seen = sessionStorage.getItem(SEEN_KEY)
    sessionStorage.setItem(SEEN_KEY, '1')
    return !seen
  } catch {
    return false
  }
}

// Integer multiple of the sprite's natural size keeps its pixels crisp
function RayquazaSprite() {
  const [src, setSrc] = useState(showdownSpriteUrl(RAYQUAZA))
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const scale = size ? Math.max(1, Math.floor(Math.min(240 / size.w, 210 / size.h))) : 1
  return (
    <img
      src={src}
      alt=""
      className="splash__sprite"
      crossOrigin={src.startsWith('http') ? 'anonymous' : undefined}
      onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      onError={() => {
        if (src !== emeraldSpriteUrl(RAYQUAZA)) setSrc(emeraldSpriteUrl(RAYQUAZA))
      }}
      style={size ? { width: size.w * scale, height: size.h * scale } : { opacity: 0 }}
    />
  )
}

export function Splash() {
  const status = useEmulatorStore((s) => s.status)
  const [firstVisit] = useState(firstVisitThisSession)
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), firstVisit ? MIN_MS_FIRST_VISIT : MIN_MS_RETURNING)
    return () => clearTimeout(timer)
  }, [firstVisit])

  const visible = status === 'booting' || !minElapsed
  const step = useEmulatorStore((s) => (s.emulator ? 'Leyendo tu cartucho…' : 'Iniciando mGBA…'))

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          key="splash"
          className="splash"
          role="status"
          aria-label="Cargando Emerald Lens"
          exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.7, ease: [0.2, 0, 0, 1] } }}
        >
          <div className="flex flex-col items-center gap-5 px-6 text-center">
            <div className="splash__stage" aria-hidden="true">
              <span className="splash__ring" />
              <RayquazaSprite />
            </div>
            <m.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.5, ease: [0.2, 0, 0, 1] } }}
            >
              <p className="flex items-center gap-3">
                <GemMark size={28} />
                <span className="splash__title">Emerald Lens</span>
              </p>
              <p className="text-[13px] text-fg-2">{step}</p>
            </m.div>
            <span className="splash__bar" aria-hidden="true" />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
