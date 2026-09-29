import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { PartyMon } from '../../memory/gen3/pokemon'
import { explodeSprite, prefersReducedMotion, sparkle, type FxOptions } from './effects'

export type FxKind = 'level' | 'faint'

export interface FxProfile {
  // canvas overhang around the sprite, so fast particles are not cut off
  pad: { x: number; y: number }
  opts: FxOptions
}

// Desktop row: 88px sprite over the panel surface, palette follows the theme
export const ROW_FX: FxProfile = { pad: { x: 48, y: 36 }, opts: { scale: 1 } }
// Handheld chip: ~40px sprite on the dark well (dark in day mode too)
export const CHIP_FX: FxProfile = { pad: { x: 64, y: 52 }, opts: { scale: 0.55, surface: 'dark' } }

interface Live {
  kind: FxKind
  rect: DOMRect
  id: number
}

let seq = 0

// Briefly true when a value grows (level ups, healing); skipped on first render
export function useFlash(value: number) {
  const [flash, setFlash] = useState(false)
  const previous = useRef(value)
  useEffect(() => {
    if (previous.current === value) return
    const grew = value > previous.current
    previous.current = value
    if (!grew) return
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), 1200)
    return () => clearTimeout(timer)
  }, [value])
  return flash
}

// Mounted only while an effect plays, in a fixed portal above the bottom sheet (z-55). It runs once per fx:
// the effect depends on [fx] only and reads onDone through an Effect Event, so a parent re-render cannot restart it.
function FxLayer({ fx, sprite, profile, onDone }: { fx: Live; sprite: RefObject<HTMLElement | null>; profile: FxProfile; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const finish = useEffectEvent(onDone)
  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const opts = { ...profile.opts, box: { w: fx.rect.width, h: fx.rect.height } }
    const cancel = fx.kind === 'faint' ? explodeSprite(canvas, sprite.current?.querySelector('img') ?? null, opts) : sparkle(canvas, opts)
    const timer = setTimeout(() => finish(), 1500)
    return () => {
      cancel()
      clearTimeout(timer)
    }
  }, [fx, sprite, profile])
  const { left, top, width, height } = fx.rect
  const { x, y } = profile.pad
  return createPortal(
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed z-55"
      style={{ left: left - x, top: top - y, width: width + 2 * x, height: height + 2 * y }}
    />,
    document.body,
  )
}

// Detects the faint (HP falls to 0) and level-up transitions of one mon; never fires on first render.
// `flash` drives a static ring on the chip (it survives reduced motion), `badge` a short level label, `layer` the canvas.
export function useMonEffects(mon: PartyMon, sprite: RefObject<HTMLElement | null>, profile: FxProfile) {
  const [live, setLive] = useState<Live | null>(null)
  const [flash, setFlash] = useState<FxKind | null>(null)
  // the last kind lingers after the flash ends, so the ring fades out in its own colour
  const [kind, setKind] = useState<FxKind | null>(null)
  const [badge, setBadge] = useState(false)
  const previous = useRef({ hp: mon.hp, level: mon.level })

  useEffect(() => {
    const before = previous.current
    previous.current = { hp: mon.hp, level: mon.level }
    if (mon.isEgg) return
    const next: FxKind | null = before.hp > 0 && mon.hp === 0 ? 'faint' : mon.level > before.level ? 'level' : null
    if (!next || document.visibilityState !== 'visible') return
    // Both layouts can stay mounted; a display:none one reports a 0x0 box, and a row scrolled off-screen has nothing to show
    const rect = sprite.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight) return
    setFlash(next)
    setKind(next)
    if (next === 'level') setBadge(true)
    // Under the party sheet the canvas would draw over its contents: the sheet's own level readout carries the cue
    if (!prefersReducedMotion() && !document.querySelector('[role=dialog]')) setLive({ kind: next, rect, id: ++seq })
  }, [mon.hp, mon.level, mon.isEgg, sprite])

  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(null), 700)
    return () => clearTimeout(timer)
  }, [flash])

  useEffect(() => {
    if (!badge) return
    const timer = setTimeout(() => setBadge(false), 1600)
    return () => clearTimeout(timer)
  }, [badge])

  const clear = useCallback(() => setLive(null), [])
  const layer = live ? <FxLayer key={live.id} fx={live} sprite={sprite} profile={profile} onDone={clear} /> : null
  return { flash, kind, badge, layer }
}
