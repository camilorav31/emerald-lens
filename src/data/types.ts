export type TypeId =
  | 'normal' | 'fighting' | 'flying' | 'poison' | 'ground' | 'rock' | 'bug' | 'ghost' | 'steel'
  | 'fire' | 'water' | 'grass' | 'electric' | 'psychic' | 'ice' | 'dragon' | 'dark' | 'fairy' | 'unknown'

export type MoveCategory = 'physical' | 'special' | 'status'

// Before Gen 4 a move's category came from its type
const GEN3_PHYSICAL = new Set<TypeId>(['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel'])
export const gen3Category = (type: TypeId): MoveCategory => (GEN3_PHYSICAL.has(type) ? 'physical' : 'special')

// Badge fill + text pair picked for >= 4.5:1 contrast
export const TYPES: Record<TypeId, { label: string; bg: string; fg: string }> = {
  normal: { label: 'Normal', bg: '#a8a878', fg: '#1a1a10' },
  fighting: { label: 'Lucha', bg: '#c03028', fg: '#ffffff' },
  flying: { label: 'Volador', bg: '#a890f0', fg: '#15102a' },
  poison: { label: 'Veneno', bg: '#a040a0', fg: '#ffffff' },
  ground: { label: 'Tierra', bg: '#e0c068', fg: '#241c06' },
  rock: { label: 'Roca', bg: '#b8a038', fg: '#1c1804' },
  bug: { label: 'Bicho', bg: '#a8b820', fg: '#161a02' },
  ghost: { label: 'Fantasma', bg: '#705898', fg: '#ffffff' },
  steel: { label: 'Acero', bg: '#b8b8d0', fg: '#16161f' },
  fire: { label: 'Fuego', bg: '#f08030', fg: '#1e0e02' },
  water: { label: 'Agua', bg: '#6890f0', fg: '#0a1330' },
  grass: { label: 'Planta', bg: '#78c850', fg: '#0d1d05' },
  electric: { label: 'Eléctrico', bg: '#f8d030', fg: '#221a02' },
  psychic: { label: 'Psíquico', bg: '#f85888', fg: '#26050f' },
  ice: { label: 'Hielo', bg: '#98d8d8', fg: '#0b1f1f' },
  dragon: { label: 'Dragón', bg: '#7038f8', fg: '#ffffff' },
  dark: { label: 'Siniestro', bg: '#705848', fg: '#ffffff' },
  fairy: { label: 'Hada', bg: '#ee99ac', fg: '#2a0a12' },
  unknown: { label: '???', bg: '#68a090', fg: '#08140f' },
}

export const typeInfo = (type: string) => TYPES[type as TypeId] ?? TYPES.unknown
