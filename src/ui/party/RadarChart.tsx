import type { StatBlock, StatKey } from '../../memory/gen3/pokemon'

// Clockwise from the top, the same order the games use in summary screens
export const STAT_ORDER: StatKey[] = ['hp', 'atk', 'def', 'spe', 'spd', 'spa']
export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'PS',
  atk: 'Ataque',
  def: 'Defensa',
  spa: 'At. Esp.',
  spd: 'Def. Esp.',
  spe: 'Velocidad',
}
const SHORT: Record<StatKey, string> = { hp: 'PS', atk: 'Ata', def: 'Def', spa: 'AtE', spd: 'DfE', spe: 'Vel' }

interface Props {
  stats: StatBlock
  size?: number
  raised?: StatKey | null
  lowered?: StatKey | null
}

export function RadarChart({ stats, size = 140, raised, lowered }: Props) {
  const center = size / 2
  const radius = size / 2 - 18
  // Scaled to the mon's own best stat so the shape reads as its build, not its level
  const max = Math.max(1, ...STAT_ORDER.map((k) => stats[k]))
  const point = (i: number, r: number) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / STAT_ORDER.length
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r] as const
  }
  const ring = (r: number) => STAT_ORDER.map((_, i) => point(i, r).join(',')).join(' ')
  const shape = STAT_ORDER.map((k, i) => point(i, Math.max(0.08, stats[k] / max) * radius).join(',')).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Gráfico de estadísticas">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={ring(radius * f)} fill="none" stroke={f === 1 ? 'var(--line-4)' : 'var(--line-3)'} />
      ))}
      {STAT_ORDER.map((_, i) => {
        const [x, y] = point(i, radius)
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--line-2)" />
      })}
      <polygon points={shape} fill="var(--color-accent)" fillOpacity={0.22} stroke="var(--color-accent)" strokeWidth="1.5" strokeLinejoin="round" />
      {STAT_ORDER.map((k, i) => {
        const [x, y] = point(i, radius + 10)
        const tone = k === raised ? 'var(--color-err-fg)' : k === lowered ? 'var(--color-info-fg)' : 'var(--color-fg-3)'
        return (
          <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="600" fill={tone}>
            {SHORT[k]}
          </text>
        )
      })}
    </svg>
  )
}
