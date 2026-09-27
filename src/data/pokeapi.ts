import { cached } from './idbCache'
import { gen3Category, type MoveCategory, type TypeId } from './types'

const API = 'https://pokeapi.co/api/v2'
// Bump when the stored shapes below change so old IndexedDB entries are ignored
const CACHE_VERSION = 1

// Chronological version groups; PokeAPI "past" data is keyed by the group where a value changed
const VERSION_ORDER = [
  'red-blue', 'yellow', 'gold-silver', 'crystal', 'ruby-sapphire', 'emerald', 'firered-leafgreen', 'colosseum', 'xd',
  'diamond-pearl', 'platinum', 'heartgold-soulsilver', 'black-white', 'black-2-white-2', 'x-y',
  'omega-ruby-alpha-sapphire', 'sun-moon', 'ultra-sun-ultra-moon', 'lets-go-pikachu-lets-go-eevee', 'sword-shield',
  'the-isle-of-armor', 'the-crown-tundra', 'brilliant-diamond-shining-pearl', 'legends-arceus', 'scarlet-violet',
  'the-teal-mask', 'the-indigo-disk',
]
const EMERALD = VERSION_ORDER.indexOf('emerald')
const versionRank = (name: string) => {
  const i = VERSION_ORDER.indexOf(name)
  return i === -1 ? VERSION_ORDER.length : i
}
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
const generationNumber = (name: string) => ROMAN.indexOf(name.replace('generation-', '')) + 1

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}/${path}`)
  if (!response.ok) throw new Error(`PokeAPI ${path}: HTTP ${response.status}`)
  return response.json() as Promise<T>
}

interface Named {
  name: string
}
interface LocalizedName {
  name: string
  language: Named
}
const localized = (names: LocalizedName[], fallback: string) =>
  names.find((n) => n.language.name === 'es')?.name ?? names.find((n) => n.language.name === 'en')?.name ?? fallback

export interface SpeciesData {
  dex: number
  name: string
  types: TypeId[]
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }
}

interface ApiPokemon {
  types: { slot: number; type: Named }[]
  past_types: { generation: Named; types: { slot: number; type: Named }[] }[]
  stats: { base_stat: number; stat: Named }[]
}
interface ApiSpecies {
  names: LocalizedName[]
  name: string
}

const STAT_KEYS: Record<string, keyof SpeciesData['baseStats']> = {
  hp: 'hp',
  attack: 'atk',
  defense: 'def',
  'special-attack': 'spa',
  'special-defense': 'spd',
  speed: 'spe',
}

export function getSpecies(dex: number): Promise<SpeciesData> {
  return cached(`species:${CACHE_VERSION}:${dex}`, async () => {
    const [pokemon, species] = await Promise.all([getJson<ApiPokemon>(`pokemon/${dex}`), getJson<ApiSpecies>(`pokemon-species/${dex}`)])
    // past_types lists the typing that held up to and including that generation; take the earliest one covering Gen 3
    const past = pokemon.past_types
      .filter((p) => generationNumber(p.generation.name) >= 3)
      .sort((a, b) => generationNumber(a.generation.name) - generationNumber(b.generation.name))[0]
    const types = (past?.types ?? pokemon.types).toSorted((a, b) => a.slot - b.slot).map((t) => t.type.name as TypeId)
    const baseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
    for (const s of pokemon.stats) {
      const key = STAT_KEYS[s.stat.name]
      if (key) baseStats[key] = s.base_stat
    }
    return { dex, name: localized(species.names, species.name), types, baseStats }
  })
}

export interface MoveData {
  id: number
  name: string
  type: TypeId
  category: MoveCategory
  pp: number
  power: number | null
  accuracy: number | null
}

interface ApiMove {
  name: string
  names: LocalizedName[]
  type: Named
  pp: number
  power: number | null
  accuracy: number | null
  damage_class: Named
  past_values: { version_group: Named; type: Named | null; pp: number | null; power: number | null; accuracy: number | null }[]
}

export function getMove(id: number): Promise<MoveData> {
  return cached(`move:${CACHE_VERSION}:${id}`, async () => {
    const move = await getJson<ApiMove>(`move/${id}`)
    // past_values hold what applied before a group; the earliest change after Emerald holds the Emerald value
    const later = move.past_values
      .filter((v) => versionRank(v.version_group.name) > EMERALD)
      .sort((a, b) => versionRank(a.version_group.name) - versionRank(b.version_group.name))
    const pick = <K extends 'pp' | 'power' | 'accuracy'>(key: K) => {
      const change = later.find((v) => v[key] !== null)
      return change ? change[key] : move[key]
    }
    const type = (later.find((v) => v.type)?.type?.name ?? move.type.name) as TypeId
    return {
      id,
      name: localized(move.names, move.name),
      type,
      category: move.damage_class.name === 'status' ? 'status' : gen3Category(type),
      pp: pick('pp') ?? move.pp,
      power: pick('power'),
      accuracy: pick('accuracy'),
    }
  })
}

export interface ItemData {
  slug: string
  name: string
  sprite: string
}

interface ApiItem {
  names: LocalizedName[]
  name: string
}

export function getItem(slug: string): Promise<ItemData> {
  return cached(`item:${CACHE_VERSION}:${slug}`, async () => {
    const item = await getJson<ApiItem>(`item/${slug}`)
    return {
      slug,
      name: localized(item.names, item.name),
      // jsDelivr mirror: unlike raw.githubusercontent it sends CORP, which COEP require-corp needs
      sprite: `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/items/${slug}.png`,
    }
  })
}
