import { AnimatePresence, m } from 'motion/react'
import { useRef, useState } from 'react'
import { useSpecies } from '../../data/useData'
import type { PartyMon } from '../../memory/gen3/pokemon'
import { PARTY_SIZE } from '../../memory/partyReader'
import { usePartyStore } from '../../store/partyStore'
import { spriteForm } from './PartyRow'
import { PokemonDetail } from './PokemonDetail'
import { PokemonSprite } from './PokemonSprite'

function Chip({ mon, onOpen }: { mon: PartyMon; onOpen: (trigger: HTMLButtonElement) => void }) {
  const species = useSpecies(mon.isEgg ? null : mon.dex)
  const fainted = !mon.isEgg && mon.hp === 0
  const label = mon.isEgg ? 'Huevo' : `${mon.nickname}, ${species?.name ?? `#${mon.dex}`}, nivel ${mon.level}`
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={(e) => onOpen(e.currentTarget)}
        aria-label={`${label}. Ver detalle`}
        className="grid h-full w-full place-items-center rounded-md transition-colors duration-150 active:bg-fg-1/10"
      >
        <span className={`grid place-items-center transition-[filter,opacity] duration-700 ${fainted ? 'opacity-50 grayscale' : ''}`}>
          {mon.isEgg ? (
            <span className="grid h-[44px] w-full place-items-center">
              <span className="h-8 w-6 rounded-[50%/60%_60%_40%_40%] border border-line-4 bg-[linear-gradient(160deg,#f3f0e0,#c9c3a8)]" aria-hidden="true" />
            </span>
          ) : (
            <PokemonSprite dex={mon.dex} shiny={mon.shiny} form={spriteForm(mon)} width={52} height={44} />
          )}
        </span>
      </button>
    </li>
  )
}

// Details live in a sheet over the game, so the strip itself stays sprites only
function Sheet({ mon, onClose }: { mon: PartyMon; onClose: () => void }) {
  return (
    <m.div
      className="fixed inset-0 z-50 flex items-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${mon.nickname}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.18 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <button type="button" tabIndex={-1} aria-label="Cerrar detalle" className="absolute inset-0 bg-bg-0/70" onClick={onClose} />
      <m.div
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[20px] border-t border-line-3 bg-float px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-float"
        initial={{ y: '100%' }}
        animate={{ y: 0, transition: { type: 'spring', stiffness: 420, damping: 40 } }}
        exit={{ y: '100%', transition: { duration: 0.18 } }}
      >
        <PokemonDetail mon={mon} onBack={onClose} />
      </m.div>
    </m.div>
  )
}

// Portrait-phone party: six sprites and nothing else; tap one for its details
export function PartyStrip() {
  const reading = usePartyStore((s) => s.reading)
  const [selected, setSelected] = useState<number | null>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)

  const slots = reading?.kind === 'ok' ? reading.slots : []
  const detail = selected !== null ? slots.find((s) => s.slot === selected && s.mon)?.mon : undefined

  const close = () => {
    setSelected(null)
    trigger.current?.focus({ preventScroll: true })
  }

  return (
    <section aria-label="Equipo Pokémon" className="hidden handheld:block">
      <ul className="grid h-[52px] grid-cols-6 gap-1 rounded-lg bg-well p-1 inset-shadow-well">
        {Array.from({ length: PARTY_SIZE }, (_, i) => {
          const mon = slots.find((s) => s.slot === i)?.mon
          return mon ? (
            <Chip
              key={`${mon.personality}-${mon.otId}`}
              mon={mon}
              onOpen={(button) => {
                trigger.current = button
                setSelected(i)
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
