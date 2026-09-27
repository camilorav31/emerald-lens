export type BattleStat = 'atk' | 'def' | 'spe' | 'spa' | 'spd'

// Order of pokeemerald's NATURE_* constants (HARDY = 0 ... QUIRKY = 24)
const NATURE_NAMES = [
  'Fuerte', 'Huraña', 'Audaz', 'Firme', 'Pícara',
  'Osada', 'Dócil', 'Plácida', 'Agitada', 'Floja',
  'Miedosa', 'Activa', 'Seria', 'Alegre', 'Ingenua',
  'Modesta', 'Afable', 'Mansa', 'Tímida', 'Alocada',
  'Serena', 'Amable', 'Grosera', 'Cauta', 'Rara',
]

// Row = raised stat, column = lowered stat; the diagonal is neutral
const NATURE_STAT_ORDER: BattleStat[] = ['atk', 'def', 'spe', 'spa', 'spd']

export interface Nature {
  id: number
  name: string
  raised: BattleStat | null
  lowered: BattleStat | null
}

export function natureFromPersonality(personality: number): Nature {
  const id = (personality >>> 0) % 25
  const raised = NATURE_STAT_ORDER[Math.floor(id / 5)]
  const lowered = NATURE_STAT_ORDER[id % 5]
  const neutral = raised === lowered
  return { id, name: NATURE_NAMES[id], raised: neutral ? null : raised, lowered: neutral ? null : lowered }
}
