import type { MajorStatus } from '../../memory/gen3/pokemon'
import { typeInfo } from '../../data/types'

export function TypeBadge({ type, size = 'sm' }: { type: string; size?: 'sm' | 'xs' }) {
  const info = typeInfo(type)
  return (
    <span
      className={`inline-flex items-center rounded-xs font-semibold tracking-wide uppercase ${size === 'xs' ? 'h-4 px-1 text-[10px]' : 'h-[18px] px-1.5 text-[11px]'}`}
      style={{ background: info.bg, color: info.fg }}
    >
      {info.label}
    </span>
  )
}

const STATUS: Record<Exclude<MajorStatus, null>, { short: string; label: string; bg: string; fg: string }> = {
  sleep: { short: 'DOR', label: 'Dormido', bg: '#8c8c8c', fg: '#101010' },
  poison: { short: 'ENV', label: 'Envenenado', bg: '#a040a0', fg: '#ffffff' },
  toxic: { short: 'ENV', label: 'Gravemente envenenado', bg: '#a040a0', fg: '#ffffff' },
  burn: { short: 'QUE', label: 'Quemado', bg: '#f08030', fg: '#1e0e02' },
  freeze: { short: 'CON', label: 'Congelado', bg: '#98d8d8', fg: '#0b1f1f' },
  paralysis: { short: 'PAR', label: 'Paralizado', bg: '#f8d030', fg: '#221a02' },
}

export function StatusChip({ status, fainted }: { status: MajorStatus; fainted: boolean }) {
  if (fainted) {
    return (
      <span className="inline-flex h-4 items-center rounded-xs bg-err-tint px-1 text-[10px] font-semibold text-err-fg" title="Debilitado">
        DEB
      </span>
    )
  }
  if (!status) return null
  const s = STATUS[status]
  return (
    <span className="inline-flex h-4 items-center rounded-xs px-1 text-[10px] font-semibold" style={{ background: s.bg, color: s.fg }} title={s.label}>
      {s.short}
      <span className="sr-only">: {s.label}</span>
    </span>
  )
}

export function hpTone(hp: number, maxHp: number) {
  const ratio = maxHp ? hp / maxHp : 0
  return ratio > 0.5 ? 'var(--color-accent)' : ratio > 0.2 ? 'var(--color-warn)' : 'var(--color-err)'
}

export function HpBar({ hp, maxHp, showNumbers = true }: { hp: number; maxHp: number; showNumbers?: boolean }) {
  const ratio = maxHp ? Math.min(1, hp / maxHp) : 0
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="text-[10px] font-semibold text-fg-3" aria-hidden="true">
        PS
      </span>
      <span
        className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-track"
        role="meter"
        aria-label="Puntos de salud"
        aria-valuemin={0}
        aria-valuemax={maxHp}
        aria-valuenow={hp}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-500 ease-out"
          style={{ width: `${ratio * 100}%`, background: hpTone(hp, maxHp) }}
        />
      </span>
      {showNumbers && (
        <span className="num font-mono text-[11px] text-fg-2">
          {hp}/{maxHp}
        </span>
      )}
    </span>
  )
}

export function ShinyStar({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex text-warn-fg ${className}`} title="Variocolor">
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
        <path d="M8 1.5l1.9 4.1 4.4.5-3.3 3 .9 4.4L8 11.3l-3.9 2.2.9-4.4-3.3-3 4.4-.5z" fill="currentColor" />
      </svg>
      <span className="sr-only">Variocolor</span>
    </span>
  )
}
