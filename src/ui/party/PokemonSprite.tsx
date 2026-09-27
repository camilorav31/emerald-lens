import { useState } from 'react'
import { emeraldSpriteUrl, showdownSpriteUrl, type SpriteForm, type SpriteSet } from '../../sprites/spriteResolver'
import { Skeleton } from '../primitives'

interface Props {
  dex: number
  shiny: boolean
  form: SpriteForm
  // box in CSS px, reserved before the image loads so nothing shifts
  width: number
  height: number
  set?: SpriteSet
  className?: string
}

// Showdown GIFs carry a few transparent rows, so a sprite may exceed the box height slightly
const HEIGHT_TOLERANCE = 4

// Largest integer divisor that fits keeps every sprite pixel on the same device-pixel grid
function fitDivisor(width: number, height: number, boxW: number, boxH: number) {
  for (const d of [1, 2, 3, 4]) if (width / d <= boxW && height / d <= boxH + HEIGHT_TOLERANCE) return d
  return 4
}

export function PokemonSprite({ dex, shiny, form, width, height, set = 'gen5ani', className = '' }: Props) {
  const primary = showdownSpriteUrl(dex, { shiny, set, ...form })
  const [src, setSrc] = useState(primary)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const [lastPrimary, setLastPrimary] = useState(primary)

  if (primary !== lastPrimary) {
    setLastPrimary(primary)
    setSrc(primary)
    setSize(null)
    setFailed(false)
  }

  const divisor = size ? fitDivisor(size.w, size.h, width, height) : 1
  const pixelated = set === 'gen5ani' || src !== primary

  return (
    <span className={`relative grid flex-none place-items-end justify-center ${className}`} style={{ width, height }}>
      {!size && !failed && <Skeleton className="absolute inset-[15%] rounded-full" />}
      {failed ? (
        <svg viewBox="0 0 24 24" className="size-2/3 self-center text-fg-3 opacity-30" aria-hidden="true">
          <path d="M8 2h8l4 4v12l-4 4H8l-4-4V6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ) : (
        <img
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          crossOrigin={src.startsWith('http') ? 'anonymous' : undefined}
          onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          onError={() => {
            if (src === primary) {
              setSrc(emeraldSpriteUrl(dex, shiny))
              setSize(null)
            } else setFailed(true)
          }}
          style={size ? { width: size.w / divisor, height: size.h / divisor } : { opacity: 0, width: 1, height: 1 }}
          className={pixelated ? '[image-rendering:pixelated]' : ''}
        />
      )}
    </span>
  )
}
