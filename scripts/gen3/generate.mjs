// Generates src/memory/gen3/tables.ts from the pret/pokeemerald decomp, cross-checked against
// Showdown's pokedex (sprite slugs) and PokeAPI (item and move ids). Run: node scripts/gen3/generate.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(ROOT, 'scripts', 'gen3', '.cache')
const DECOMP = 'https://raw.githubusercontent.com/pret/pokeemerald/master'

const SOURCES = {
  'species.h': `${DECOMP}/include/constants/species.h`,
  'pokedex.h': `${DECOMP}/include/constants/pokedex.h`,
  'pokemon.c': `${DECOMP}/src/pokemon.c`,
  'items.h': `${DECOMP}/include/constants/items.h`,
  'moves.h': `${DECOMP}/include/constants/moves.h`,
  'charmap.txt': `${DECOMP}/charmap.txt`,
  'showdown-pokedex.json': 'https://play.pokemonshowdown.com/data/pokedex.json',
  'pokeapi-items.json': 'https://pokeapi.co/api/v2/item?limit=3000',
  'pokeapi-moves.json': 'https://pokeapi.co/api/v2/move?limit=400',
}

async function source(name) {
  const path = join(CACHE, name)
  if (!existsSync(path)) {
    const res = await fetch(SOURCES[name])
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
    await writeFile(path, await res.text())
  }
  return readFile(path, 'utf8')
}

const problems = []

// ---------- species: internal index -> national dex ----------
function parseSpecies(speciesH) {
  const ids = new Map()
  for (const [, name, value] of speciesH.matchAll(/^#define SPECIES_(\w+) (\d+)$/gm)) ids.set(name, Number(value))
  return ids
}

function parseNationalDex(pokedexH) {
  const body = pokedexH.slice(pokedexH.indexOf('NATIONAL_DEX_NONE'))
  const names = [...body.matchAll(/^\s*NATIONAL_DEX_(\w+)\s*,/gm)].map((m) => m[1])
  return new Map(names.map((name, i) => [name, i]))
}

function parseSpeciesToNational(pokemonC, species, national) {
  const start = pokemonC.indexOf('sSpeciesToNationalPokedexNum[')
  const block = pokemonC.slice(start, pokemonC.indexOf('};', start))
  const table = []
  for (const [, name] of block.matchAll(/SPECIES_TO_NATIONAL\((\w+)\)/g)) {
    const index = species.get(name)
    const dex = national.get(name)
    if (index === undefined || dex === undefined) problems.push(`species ${name} not resolvable`)
    else table[index] = dex
  }
  return table
}

// ---------- Showdown slugs for national 1..386 ----------
function showdownSlugs(pokedexJson, national) {
  const dex = JSON.parse(pokedexJson)
  const byNum = new Map()
  for (const [id, entry] of Object.entries(dex)) {
    if (entry.num >= 1 && entry.num <= 386 && !entry.forme && !byNum.has(entry.num)) byNum.set(entry.num, id)
  }
  const slugs = []
  for (const [name, num] of national) {
    if (num < 1 || num > 386) continue
    const fromDecomp = name.toLowerCase().replace(/_/g, '')
    const fromShowdown = byNum.get(num)
    if (!fromShowdown) problems.push(`showdown: no base entry for #${num}`)
    else if (fromShowdown !== fromDecomp) problems.push(`showdown slug #${num}: decomp ${fromDecomp} vs showdown ${fromShowdown}`)
    slugs[num] = fromShowdown ?? fromDecomp
  }
  return slugs
}

// ---------- items: gen3 index -> PokeAPI slug ----------
// PokeAPI names that do not follow the decomp constant's kebab-case
const ITEM_SLUG_OVERRIDES = {
  X_DEFEND: 'x-defense',
  X_SPECIAL: 'x-sp-atk',
  ITEMFINDER: 'dowsing-machine',
  ROOM_1_KEY: 'key-to-room-1',
  ROOM_2_KEY: 'key-to-room-2',
  ROOM_4_KEY: 'key-to-room-4',
  ROOM_6_KEY: 'key-to-room-6',
  MYSTIC_TICKET: 'mysticticket',
  AURORA_TICKET: 'auroraticket',
}
// Empty slots in the item table: hex placeholders (ITEM_03A) and never-distributed berries
const isPlaceholderItem = (name) => /^[0-9A-F]{3}$/.test(name) || name === 'NONE' || name.startsWith('UNUSED_')

function parseItems(itemsH, pokeapiItems) {
  const body = itemsH.slice(itemsH.indexOf('enum {'), itemsH.indexOf('ITEMS_COUNT'))
  const known = new Set(JSON.parse(pokeapiItems).results.map((r) => r.name))
  const slugs = []
  let index = 0
  for (const [, name] of body.matchAll(/^\s*ITEM_(\w+)\s*,/gm)) {
    if (isPlaceholderItem(name)) {
      slugs[index++] = null
      continue
    }
    const slug = ITEM_SLUG_OVERRIDES[name] ?? name.toLowerCase().replace(/_/g, '-')
    if (!known.has(slug)) problems.push(`item ${index} ITEM_${name}: '${slug}' not in PokeAPI`)
    slugs[index++] = known.has(slug) ? slug : null
  }
  return slugs
}

// ---------- moves: gen3 ids must equal PokeAPI ids ----------
// Moves renamed in later generations; same id, so they still line up
const MOVE_RENAMES = { HI_JUMP_KICK: 'high-jump-kick', FAINT_ATTACK: 'feint-attack', SMELLING_SALT: 'smelling-salts' }
function checkMoves(movesH, pokeapiMoves) {
  const api = new Map(JSON.parse(pokeapiMoves).results.map((r) => [Number(r.url.match(/\/(\d+)\/$/)[1]), r.name]))
  let count = 0
  for (const [, name, value] of movesH.matchAll(/^#define MOVE_(\w+) (\d+)$/gm)) {
    const id = Number(value)
    if (id === 0) continue
    count = Math.max(count, id)
    const slug = name.toLowerCase().replace(/_/g, '-')
    const apiName = api.get(id)
    if (apiName?.replace(/-/g, '') !== slug.replace(/-/g, '') && MOVE_RENAMES[name] !== apiName) {
      problems.push(`move ${id} MOVE_${name}: PokeAPI has '${apiName}'`)
    }
  }
  return count
}

// ---------- charmap: main single-byte table (western glyphs), up to the '$' terminator ----------
function parseCharmap(charmapTxt) {
  const map = {}
  for (const line of charmapTxt.split('\n')) {
    const m = line.match(/^'(\\'|[^'])'\s*=\s*([0-9A-F]{2})\s*$/)
    if (!m) continue
    const char = m[1] === "\\'" ? "'" : m[1]
    const byte = parseInt(m[2], 16)
    if (!(byte in map)) map[byte] = char
    if (char === '$') break
  }
  delete map[0xff]
  return map
}

await mkdir(CACHE, { recursive: true })
const species = parseSpecies(await source('species.h'))
const national = parseNationalDex(await source('pokedex.h'))
const speciesToNational = parseSpeciesToNational(await source('pokemon.c'), species, national)
const slugs = showdownSlugs(await source('showdown-pokedex.json'), national)
const items = parseItems(await source('items.h'), await source('pokeapi-items.json'))
const moveCount = checkMoves(await source('moves.h'), await source('pokeapi-moves.json'))
const charmap = parseCharmap(await source('charmap.txt'))

const lastSpecies = species.get('CHIMECHO')
const national1to386 = speciesToNational.slice(0, lastSpecies + 1).filter((n) => n >= 1 && n <= 386)
if (new Set(national1to386).size !== 386) problems.push(`species table covers ${new Set(national1to386).size}/386 national numbers`)

const out = `// Generated by scripts/gen3/generate.mjs from pret/pokeemerald (+ Showdown, PokeAPI checks). Do not edit.

// Internal species index -> National Pokédex number (0 = none / placeholder such as OLD_UNOWN_*)
export const SPECIES_TO_NATIONAL: readonly number[] = ${JSON.stringify(Array.from({ length: lastSpecies + 1 }, (_, i) => speciesToNational[i] ?? 0))}

export const SPECIES_EGG = ${species.get('EGG')}

// National number -> Pokémon Showdown sprite id (index 0 unused)
export const SHOWDOWN_SLUGS: readonly string[] = ${JSON.stringify(Array.from({ length: 387 }, (_, i) => slugs[i] ?? ''))}

// Gen 3 item index -> PokeAPI item slug (null = unused slot)
export const ITEM_SLUGS: readonly (string | null)[] = ${JSON.stringify(items)}

export const MOVE_COUNT = ${moveCount}

// Gen 3 text byte -> character (western table; 0xFF terminates)
export const CHARMAP: Readonly<Record<number, string>> = ${JSON.stringify(charmap)}
`
await writeFile(join(ROOT, 'src', 'memory', 'gen3', 'tables.ts'), out)
console.log(`species ${lastSpecies}, national ${new Set(national1to386).size}, items ${items.length}, moves ${moveCount}, charmap ${Object.keys(charmap).length}`)
if (problems.length) {
  console.log(`\n${problems.length} cross-check problem(s):`)
  for (const p of problems) console.log(' -', p)
  process.exitCode = 1
}
