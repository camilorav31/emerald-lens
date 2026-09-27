import { m } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { PartyMon } from '../../memory/gen3/pokemon'
import { useSpecies } from '../../data/useData'
import { HpBar, ShinyStar, StatusChip, TypeBadge } from './bits'
import { explodeSprite, sparkle } from './effects'
import { PokemonSprite } from './PokemonSprite'

export const spriteForm = (mon: PartyMon) => ({ unownForm: mon.unownForm, deoxysForm: 'speed' as const })

// Briefly highlights a value when it changes (level ups, healing); skipped on first render
function useFlash(value: number) {
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

type Fx = { kind: 'faint' | 'level'; rect: DOMRect; id: number }

// Detects the faint (HP falls to 0) and level-up transitions; never fires on first render
function useRowEffects(mon: PartyMon, wrapper: RefObject<HTMLSpanElement | null>) {
  const [fx, setFx] = useState<Fx | null>(null)
  const previous = useRef({ hp: mon.hp, level: mon.level })
  useEffect(() => {
    const before = previous.current
    previous.current = { hp: mon.hp, level: mon.level }
    const rect = wrapper.current?.getBoundingClientRect()
    if (!rect || mon.isEgg) return
    if (before.hp > 0 && mon.hp === 0) setFx({ kind: 'faint', rect, id: performance.now() })
    else if (mon.level > before.level) setFx({ kind: 'level', rect, id: performance.now() })
  }, [mon.hp, mon.level, mon.isEgg, wrapper])
  return [fx, () => setFx(null)] as const
}

// Mounted only while an effect plays, in a fixed-position portal: particles fly over everything and the
// oversized canvas never adds scroll overflow to the side panel.
function FxLayer({ fx, wrapper, onDone }: { fx: Fx; wrapper: RefObject<HTMLSpanElement | null>; onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    if (!ref.current) return
    if (fx.kind === 'faint') explodeSprite(ref.current, wrapper.current?.querySelector('img') ?? null)
    else sparkle(ref.current)
    const timer = setTimeout(onDone, 1500)
    return () => clearTimeout(timer)
  }, [fx, wrapper, onDone])
  const { left, top, width, height } = fx.rect
  return createPortal(
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed z-45"
      style={{ left: left - 48, top: top - 36, width: width + 96, height: height + 72 }}
    />,
    document.body,
  )
}

export function PartyRow({ mon, spriteHeight, onOpen }: { mon: PartyMon; spriteHeight: number; onOpen: () => void }) {
  const species = useSpecies(mon.isEgg ? null : mon.dex)
  const levelFlash = useFlash(mon.level)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const [fx, clearFx] = useRowEffects(mon, wrapperRef)
  const fainted = !mon.isEgg && mon.hp === 0
  const speciesName = species?.name ?? `#${mon.dex}`
  const showSpecies = !mon.isEgg && species && species.name.toLowerCase() !== mon.nickname.toLowerCase()

  return (
    <m.li
      layout={false}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 380, damping: 34 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="min-h-0"
    >
      <button
        type="button"
        onClick={onOpen}
        className="group grid h-full w-full grid-cols-[88px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-line-2 bg-surface-2 py-px pr-3 pl-1 text-left shadow-raise transition-colors duration-150 hover:border-line-3 hover:bg-surface-3"
        aria-label={`${mon.isEgg ? 'Huevo' : `${mon.nickname}, ${speciesName}, nivel ${mon.level}`}. Ver detalle`}
      >
        <span ref={wrapperRef} className="relative">
          {fx && <FxLayer key={fx.id} fx={fx} wrapper={wrapperRef} onDone={clearFx} />}
          <span className={`block transition-[filter,opacity] duration-700 ${fainted ? 'opacity-50 grayscale' : ''}`}>
          {mon.isEgg ? (
            <span className="grid w-[88px] place-items-center" style={{ height: spriteHeight }}>
              <span className="h-9 w-7 rounded-[50%/60%_60%_40%_40%] border border-line-4 bg-[linear-gradient(160deg,#f3f0e0,#c9c3a8)]" aria-hidden="true" />
            </span>
          ) : (
            <PokemonSprite dex={mon.dex} shiny={mon.shiny} form={spriteForm(mon)} width={88} height={spriteHeight} />
          )}
          </span>
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-semibold text-fg-1">{mon.isEgg ? 'Huevo' : mon.nickname}</span>
            {mon.shiny && !mon.isEgg && <ShinyStar />}
            {!mon.isEgg && (
              <span
                className={`num ml-auto flex-none font-mono text-xs transition-colors duration-300 ${levelFlash ? 'text-accent-hi' : 'text-fg-2'}`}
              >
                Nv. {mon.level}
              </span>
            )}
          </span>
          {!mon.isEgg && (
            <>
              <span className="flex min-w-0 items-center gap-1.5">
                {showSpecies && <span className="truncate text-xs text-fg-3">{speciesName}</span>}
                <span className="ml-auto flex flex-none gap-1">
                  {species?.types.map((t) => <TypeBadge key={t} type={t} size="xs" />)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <HpBar hp={mon.hp} maxHp={mon.maxHp} />
                </span>
                <StatusChip status={mon.status} fainted={fainted} />
              </span>
            </>
          )}
        </span>
      </button>
    </m.li>
  )
}
