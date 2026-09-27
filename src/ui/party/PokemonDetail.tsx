import { m } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { MoveSlot, PartyMon } from '../../memory/gen3/pokemon'
import { useItem, useMove, useSpecies } from '../../data/useData'
import { typeInfo } from '../../data/types'
import { HpBar, ShinyStar, StatusChip, TypeBadge } from './bits'
import { PokemonSprite } from './PokemonSprite'
import { spriteForm } from './PartyRow'
import { RadarChart, STAT_LABELS } from './RadarChart'

const TABLE_ORDER = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const

const CATEGORY = { physical: 'Físico', special: 'Especial', status: 'Estado' }

function MoveRow({ slot }: { slot: MoveSlot }) {
  const move = useMove(slot.id)
  const maxPp = move ? Math.floor((move.pp * (5 + slot.ppUps)) / 5) : null
  const info = move ? typeInfo(move.type) : null
  return (
    <li
      className="grid h-10 grid-cols-[4px_minmax(0,1fr)] gap-2 rounded-md bg-surface-1 pr-2"
      title={move ? `${info!.label} · ${CATEGORY[move.category]}${move.power ? ` · Potencia ${move.power}` : ''}` : undefined}
    >
      <span className="h-full rounded-l-md" style={{ background: info?.bg ?? 'var(--color-line-3)' }} aria-hidden="true" />
      <span className="flex min-w-0 flex-col justify-center">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[13px] leading-4 text-fg-1">{move?.name ?? `Movimiento ${slot.id}`}</span>
          <span className={`num ml-auto flex-none font-mono text-[11px] ${maxPp !== null && slot.pp === 0 ? 'text-err-fg' : 'text-fg-2'}`}>
            {slot.pp}
            {maxPp !== null && <span className="text-fg-3">/{maxPp}</span>}
            <span className="sr-only"> PP</span>
          </span>
        </span>
        <span className="truncate text-[11px] leading-3.5 text-fg-3">
          {info ? `${info.label} · ${CATEGORY[move!.category]}` : '…'}
          {move?.power ? ` · ${move.power}` : ''}
        </span>
      </span>
    </li>
  )
}

export function PokemonDetail({ mon, onBack }: { mon: PartyMon; onBack: () => void }) {
  const species = useSpecies(mon.isEgg ? null : mon.dex)
  const item = useItem(mon.heldItem)
  const backRef = useRef<HTMLButtonElement>(null)
  useEffect(() => backRef.current?.focus({ preventScroll: true }), [])
  const fainted = mon.hp === 0

  return (
    <m.section
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0, transition: { type: 'spring', stiffness: 420, damping: 38 } }}
      exit={{ opacity: 0, x: 16, transition: { duration: 0.12 } }}
      className="flex min-h-0 flex-1 flex-col gap-3"
      aria-label={`Detalle de ${mon.nickname}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onBack()
      }}
    >
      <button
        ref={backRef}
        type="button"
        onClick={onBack}
        className="flex h-8 w-fit items-center gap-1.5 rounded-md px-2 text-[13px] text-fg-2 transition-colors duration-150 hover:bg-white/5 hover:text-fg-1"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Equipo
      </button>

      <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-line-2 bg-surface-2 p-2 shadow-raise">
        <span className={`grid h-[112px] place-items-end justify-center rounded-md bg-[radial-gradient(60%_40%_at_50%_92%,rgb(0_0_0/.45),transparent)] ${fainted ? 'opacity-50 grayscale' : ''}`}>
          <PokemonSprite dex={mon.dex} shiny={mon.shiny} form={spriteForm(mon)} width={120} height={112} />
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="flex items-center gap-1.5">
            <span className="truncate font-display text-lg leading-6 font-semibold">{mon.nickname}</span>
            {mon.shiny && <ShinyStar />}
          </p>
          <p className="flex items-center gap-2 text-xs text-fg-2">
            <span className="truncate">{species?.name ?? `#${mon.dex}`}</span>
            <span className="num font-mono text-fg-3">#{String(mon.dex).padStart(3, '0')}</span>
            <span className="num ml-auto font-mono text-fg-1">Nv. {mon.level}</span>
          </p>
          <p className="flex flex-wrap gap-1">{species?.types.map((t) => <TypeBadge key={t} type={t} />)}</p>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <HpBar hp={mon.hp} maxHp={mon.maxHp} />
            </span>
            <StatusChip status={mon.status} fainted={fainted} />
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-line-1 px-2.5 py-1.5">
          <dt className="text-fg-3">Naturaleza</dt>
          <dd className="text-fg-1">
            {mon.nature.name}
            {mon.nature.raised && (
              <span className="text-fg-3">
                {' '}
                (+{STAT_LABELS[mon.nature.raised]}, −{STAT_LABELS[mon.nature.lowered!]})
              </span>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line-1 px-2.5 py-1.5">
          {item && <img src={item.sprite} alt="" width={24} height={24} crossOrigin="anonymous" className="[image-rendering:pixelated]" />}
          <span className="min-w-0">
            <dt className="text-fg-3">Objeto</dt>
            <dd className="truncate text-fg-1">{mon.heldItem ? (item?.name ?? '…') : 'Ninguno'}</dd>
          </span>
        </div>
      </dl>

      <div className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-2">
        <RadarChart stats={mon.stats} size={132} raised={mon.nature.raised} lowered={mon.nature.lowered} />
        <table className="num w-full text-right font-mono text-[11px]">
          <caption className="sr-only">Estadísticas, IV y EV</caption>
          <thead>
            <tr className="text-fg-3">
              <th scope="col" className="pb-1 text-left font-sans font-semibold">
                <span className="sr-only">Estadística</span>
              </th>
              <th scope="col" className="pb-1 font-sans font-semibold">Valor</th>
              <th scope="col" className="pb-1 font-sans font-semibold" title="Valores individuales (0–31)">IV</th>
              <th scope="col" className="pb-1 font-sans font-semibold" title="Puntos de esfuerzo">EV</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ORDER.map((k) => (
              <tr key={k} className="h-[19px]">
                <th scope="row" className="text-left font-sans font-normal text-fg-2">
                  {STAT_LABELS[k]}
                </th>
                <td className="text-fg-1">{mon.stats[k]}</td>
                <td className={mon.ivs[k] === 31 ? 'text-accent-hi' : 'text-fg-2'}>{mon.ivs[k]}</td>
                <td className="text-fg-2">{mon.evs[k]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="section-label mb-2">Movimientos</h3>
        <ul className="grid grid-cols-2 gap-1.5">
          {mon.moves.map((slot, i) => (
            <MoveRow key={`${i}-${slot.id}`} slot={slot} />
          ))}
        </ul>
      </div>
    </m.section>
  )
}
