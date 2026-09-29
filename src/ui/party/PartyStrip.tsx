import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSpecies } from '../../data/useData'
import type { PartyMon } from '../../memory/gen3/pokemon'
import { PARTY_SIZE } from '../../memory/partyReader'
import { usePartyStore } from '../../store/partyStore'
import { useMediaQuery } from '../useMediaQuery'
import { spriteForm } from './PartyRow'
import { PokemonDetail } from './PokemonDetail'
import { PokemonSprite } from './PokemonSprite'
import { CHIP_FX, useMonEffects } from './useMonEffects'

const monKey = (mon: PartyMon) => `${mon.personality}-${mon.otId}`

function Chip({ mon, spriteW, onOpen }: { mon: PartyMon; spriteW: number; onOpen: (trigger: HTMLButtonElement) => void }) {
  const species = useSpecies(mon.isEgg ? null : mon.dex)
  const spriteRef = useRef<HTMLSpanElement>(null)
  const { flash, kind, badge, layer } = useMonEffects(mon, spriteRef, CHIP_FX)
  const fainted = !mon.isEgg && mon.hp === 0
  const label = mon.isEgg ? 'Huevo' : `${mon.nickname}, ${species?.name ?? `#${mon.dex}`}, nivel ${mon.level}`
  return (
    <li className="min-w-0">
      <button
        type="button"
        data-fx={kind ?? undefined}
        data-lit={flash ? '' : undefined}
        onClick={(e) => onOpen(e.currentTarget)}
        aria-label={`${label}. Ver detalle`}
        className="chip grid h-full w-full place-items-center rounded-md transition-colors duration-150 active:bg-fg-1/10"
      >
        <span
          ref={spriteRef}
          className={`chip__sprite grid place-items-center transition-[filter,opacity] duration-700 ${fainted ? 'opacity-50 grayscale' : ''}`}
        >
          {layer}
          {mon.isEgg ? (
            <span className="grid h-[44px] w-full place-items-center">
              <span className="egg h-8 w-6 rounded-[50%/60%_60%_40%_40%]" aria-hidden="true" />
            </span>
          ) : (
            <PokemonSprite dex={mon.dex} shiny={mon.shiny} form={spriteForm(mon)} width={spriteW} height={44} />
          )}
        </span>
        {badge && (
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-fit rounded-xs bg-accent px-1 font-mono text-[10px] leading-[14px] font-semibold text-accent-ink"
            aria-hidden="true"
          >
            Nv. {mon.level}
          </span>
        )}
      </button>
    </li>
  )
}

// Details live in a sheet over the game, so the strip itself stays sprites only. The sheet is portaled to
// the body: the app behind it is inert, and the level/faint effects (z-55) still draw above it.
function Sheet({ mon, onClose }: { mon: PartyMon; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; y0: number; dy: number } | null>(null)

  useEffect(() => {
    const shell = document.getElementById('app-shell')
    shell?.setAttribute('inert', '')
    return () => shell?.removeAttribute('inert')
  }, [])

  // Swipe down on the handle to dismiss; a plain pointer drag, because the motion build here has no gestures
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !panel.current) return
    drag.current.dy = Math.max(0, e.clientY - drag.current.y0)
    panel.current.style.transform = `translateY(${drag.current.dy}px)`
  }
  const end = () => {
    const state = drag.current
    drag.current = null
    if (!state || !panel.current) return
    if (state.dy > 90) return onClose()
    panel.current.style.transition = 'transform 180ms cubic-bezier(0.2, 0, 0, 1)'
    panel.current.style.transform = ''
    const el = panel.current
    setTimeout(() => (el.style.transition = ''), 200)
  }

  return createPortal(
    <m.div
      className="fixed inset-0 z-50 flex items-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${mon.nickname}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.18 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <button type="button" tabIndex={-1} aria-label="Cerrar detalle" className="absolute inset-0 bg-scrim" onClick={onClose} />
      <m.div
        className="relative w-full"
        initial={{ y: '100%' }}
        animate={{ y: 0, transition: { type: 'spring', stiffness: 420, damping: 40 } }}
        exit={{ y: '100%', transition: { duration: 0.18 } }}
      >
        <div
          ref={panel}
          className="mx-auto max-h-[92dvh] w-full max-w-[520px] overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-line-3 bg-float px-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-float"
        >
          <div
            className="mx-auto -mt-px flex h-6 w-24 touch-none items-center justify-center"
            onPointerDown={(e) => {
              drag.current = { id: e.pointerId, y0: e.clientY, dy: 0 }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            aria-hidden="true"
          >
            <span className="h-1 w-9 rounded-full bg-line-4" />
          </div>
          <PokemonDetail mon={mon} onBack={onClose} />
        </div>
      </m.div>
    </m.div>,
    document.body,
  )
}

// Portrait-phone party: six sprites and nothing else; tap one for its details
export function PartyStrip() {
  const reading = usePartyStore((s) => s.reading)
  const [selected, setSelected] = useState<string | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  // chip width is (viewport - 52) / 6: on the narrowest phones the sprite box has to shrink with it
  const narrow = useMediaQuery('(width < 350px)')

  const slots = reading?.kind === 'ok' ? reading.slots : []
  // Selected by identity, not slot: a party reorder or an outage must not reopen or swap the sheet
  const detail = selected ? slots.find((s) => s.mon && monKey(s.mon) === selected)?.mon : undefined

  // The mon left the party (or the reading dropped): forget it, so it cannot reopen the sheet on its own later
  if (selected && !detail) setSelected(null)

  const close = () => {
    // the shell stays inert until the sheet unmounts, which would swallow the focus() below
    document.getElementById('app-shell')?.removeAttribute('inert')
    setSelected(null)
    trigger.current?.focus({ preventScroll: true })
  }

  return (
    <section aria-label="Equipo Pokémon" className="hidden handheld:block">
      <ul className="scope-dark party-well grid h-[52px] grid-cols-6 gap-1 rounded-[16px] bg-well p-1 inset-shadow-well">
        {Array.from({ length: PARTY_SIZE }, (_, i) => {
          const mon = slots.find((s) => s.slot === i)?.mon
          return mon ? (
            <Chip
              key={monKey(mon)}
              mon={mon}
              spriteW={narrow ? 44 : 52}
              onOpen={(button) => {
                trigger.current = button
                setSelected(monKey(mon))
              }}
            />
          ) : (
            <li key={`empty-${i}`} className="grid place-items-center" aria-hidden="true">
              <span className="size-2 rounded-full bg-line-3" />
            </li>
          )
        })}
      </ul>
      <AnimatePresence>{detail && <Sheet key="sheet" mon={detail} onClose={close} />}</AnimatePresence>
    </section>
  )
}
