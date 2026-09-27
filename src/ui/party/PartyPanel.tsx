import { AnimatePresence } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { PARTY_SIZE } from '../../memory/partyReader'
import { hasGame, useEmulatorStore } from '../../store/emulatorStore'
import { usePartyStore } from '../../store/partyStore'
import { Led, Skeleton } from '../primitives'
import { PartyRow } from './PartyRow'
import { PokemonDetail } from './PokemonDetail'

function Message({ title, body }: { title: string; body?: string }) {
  return (
    <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-line-2 p-6 text-center">
      <div className="space-y-1">
        <p className="text-fg-1">{title}</p>
        {body && <p className="text-xs text-pretty text-fg-3">{body}</p>}
      </div>
    </div>
  )
}

export function PartyPanel() {
  const reading = usePartyStore((s) => s.reading)
  const status = useEmulatorStore((s) => s.status)
  const [selected, setSelected] = useState<number | null>(null)

  const slots = reading?.kind === 'ok' ? reading.slots : []
  const detail = selected !== null ? slots.find((s) => s.slot === selected && s.mon)?.mon : undefined
  const live = status === 'running'

  // Sprite boxes follow the real row height, so six rows always fill the panel without scrolling
  const listRef = useRef<HTMLUListElement>(null)
  const [rowHeight, setRowHeight] = useState(76)
  useLayoutEffect(() => {
    const row = listRef.current?.firstElementChild
    if (!row) return
    const observer = new ResizeObserver(() => setRowHeight(Math.floor(row.getBoundingClientRect().height)))
    observer.observe(row)
    return () => observer.disconnect()
  }, [slots.length, detail])

  let body
  if (!hasGame(status)) {
    body = <Message title="Sin cartucho" body="Inserta tu cartucho y tu equipo aparecerá aquí en tiempo real." />
  } else if (!reading) {
    body = (
      <ul className="grid min-h-0 flex-1 grid-rows-[repeat(6,minmax(52px,1fr))] gap-1.5" aria-hidden="true">
        {Array.from({ length: PARTY_SIZE }, (_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-lg border border-line-1 px-3">
            <Skeleton className="size-12 rounded-full" />
            <span className="flex-1 space-y-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-1.5 w-full" />
            </span>
          </li>
        ))}
      </ul>
    )
  } else if (reading.kind === 'unsupported') {
    body = (
      <Message
        title={`Versión no soportada (${reading.gameCode ?? 'desconocida'})`}
        body="El panel de equipo solo lee Pokémon Esmeralda (US, BPEE). El juego funciona igual."
      />
    )
  } else if (reading.kind === 'unavailable') {
    body = <Message title="No se pudo leer la memoria" body="Se reintenta automáticamente mientras el juego corre." />
  } else if (reading.kind === 'invalid' || slots.length === 0) {
    body = (
      <Message
        title={reading.kind === 'invalid' ? 'Aún no hay una partida cargada' : 'Tu equipo está vacío'}
        body={reading.kind === 'invalid' ? 'Empieza o continúa una partida para ver tu equipo.' : 'Aparecerá aquí en cuanto tengas tu primer Pokémon.'}
      />
    )
  } else {
    body = (
      <ul ref={listRef} className="grid min-h-0 flex-1 grid-rows-[repeat(6,minmax(52px,1fr))] gap-1.5 [max-height:calc(6*96px+5*6px)]">
        <AnimatePresence initial={false}>
          {slots.map((slot) =>
            slot.mon ? (
              <PartyRow
                key={`${slot.mon.personality}-${slot.mon.otId}`}
                mon={slot.mon}
                spriteHeight={Math.max(40, rowHeight - 4)}
                onOpen={() => setSelected(slot.slot)}
              />
            ) : (
              <li key={`bad-${slot.slot}`} className="grid place-items-center rounded-lg border border-dashed border-line-2 text-xs text-fg-3">
                Datos no válidos en el espacio {slot.slot + 1}
              </li>
            ),
          )}
          {Array.from({ length: PARTY_SIZE - slots.length }, (_, i) => (
            <li key={`empty-${i}`} className="rounded-lg border border-dashed border-line-1" aria-hidden="true" />
          ))}
        </AnimatePresence>
      </ul>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2" aria-label="Equipo Pokémon">
      {detail ? (
        <AnimatePresence mode="wait">
          <PokemonDetail key={selected} mon={detail} onBack={() => setSelected(null)} />
        </AnimatePresence>
      ) : (
        <>
          <header className="flex h-5 items-center justify-between">
            <h2 className="section-label">Equipo</h2>
            <span className="flex items-center gap-2 text-xs text-fg-2" role="status">
              {hasGame(status) && reading?.kind === 'ok' && <span className="num font-mono">{slots.length}/6</span>}
              <Led tone={live && reading?.kind === 'ok' ? 'accent' : undefined} />
              {!hasGame(status) ? 'Sin juego' : live ? (reading?.kind === 'ok' ? 'En vivo' : 'Leyendo…') : 'Congelado'}
            </span>
          </header>
          {body}
        </>
      )}
    </section>
  )
}
