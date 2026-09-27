import { natureFromPersonality, type Nature } from './natures'
import { SPECIES_EGG, SPECIES_TO_NATIONAL } from './tables'
import { decodeText } from './text'

// Layout of struct Pokemon in pret/pokeemerald include/pokemon.h (100 bytes, little-endian)
export const PARTY_MON_SIZE = 100
const NICKNAME = 8
const NICKNAME_LENGTH = 10
const LANGUAGE = 18
const FLAGS = 19
const OT_NAME = 20
const OT_NAME_LENGTH = 7
const CHECKSUM = 28
const SECURE = 32
const SECURE_SIZE = 48
const SUBSTRUCT_SIZE = 12
const STATUS = 80
const LEVEL = 84
const HP = 86
const MAX_HP = 88
const STATS = 90

// personality % 24 -> slot holding [Growth, Attacks, EVs, Misc] (GetSubstruct's SUBSTRUCT_CASE table)
export const SUBSTRUCT_SLOTS: readonly (readonly [number, number, number, number])[] = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 3, 1, 2], [0, 2, 3, 1], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [2, 0, 1, 3], [3, 0, 1, 2], [2, 0, 3, 1], [3, 0, 2, 1],
  [1, 2, 0, 3], [1, 3, 0, 2], [2, 1, 0, 3], [3, 1, 0, 2], [2, 3, 0, 1], [3, 2, 0, 1],
  [1, 2, 3, 0], [1, 3, 2, 0], [2, 1, 3, 0], [3, 1, 2, 0], [2, 3, 1, 0], [3, 2, 1, 0],
]

export type StatKey = 'hp' | 'atk' | 'def' | 'spe' | 'spa' | 'spd'
export type StatBlock = Record<StatKey, number>
export type MajorStatus = 'sleep' | 'poison' | 'toxic' | 'burn' | 'freeze' | 'paralysis' | null

export interface MoveSlot {
  id: number
  pp: number
  ppUps: number
}

export interface PartyMon {
  personality: number
  otId: number
  nickname: string
  otName: string
  language: number
  isEgg: boolean
  species: number
  dex: number
  heldItem: number
  experience: number
  friendship: number
  moves: MoveSlot[]
  evs: StatBlock
  ivs: StatBlock
  abilitySlot: 0 | 1
  metLevel: number
  pokeball: number
  nature: Nature
  shiny: boolean
  // 0..27 = A..Z, !, ? (only meaningful for Unown)
  unownForm: number
  status: MajorStatus
  level: number
  hp: number
  maxHp: number
  stats: StatBlock
}

export type ParsedMon = { ok: true; mon: PartyMon } | { ok: false; reason: 'empty' | 'bad-egg' | 'checksum' | 'species' }

export function decryptSecure(bytes: Uint8Array, personality: number, otId: number): Uint8Array {
  const key = (personality ^ otId) >>> 0
  const src = new DataView(bytes.buffer, bytes.byteOffset + SECURE, SECURE_SIZE)
  const out = new Uint8Array(SECURE_SIZE)
  const dst = new DataView(out.buffer)
  for (let i = 0; i < SECURE_SIZE; i += 4) dst.setUint32(i, (src.getUint32(i, true) ^ key) >>> 0, true)
  return out
}

export function secureChecksum(decrypted: Uint8Array): number {
  const view = new DataView(decrypted.buffer, decrypted.byteOffset, decrypted.byteLength)
  let sum = 0
  for (let i = 0; i < SECURE_SIZE; i += 2) sum = (sum + view.getUint16(i, true)) & 0xffff
  return sum
}

export function isShiny(otId: number, personality: number): boolean {
  const value = (otId >>> 16) ^ (otId & 0xffff) ^ (personality >>> 16) ^ (personality & 0xffff)
  return value < 8
}

export function unownForm(personality: number): number {
  const p = personality >>> 0
  return (((p & 0x03000000) >>> 18) | ((p & 0x00030000) >>> 12) | ((p & 0x00000300) >>> 6) | (p & 0x00000003)) % 28
}

function decodeStatus(raw: number): MajorStatus {
  if (raw & 0x7) return 'sleep'
  if (raw & (1 << 7)) return 'toxic'
  if (raw & (1 << 3)) return 'poison'
  if (raw & (1 << 4)) return 'burn'
  if (raw & (1 << 5)) return 'freeze'
  if (raw & (1 << 6)) return 'paralysis'
  return null
}

export function parsePartyMon(bytes: Uint8Array): ParsedMon {
  if (bytes.length < PARTY_MON_SIZE) throw new Error(`party slot needs ${PARTY_MON_SIZE} bytes`)
  const view = new DataView(bytes.buffer, bytes.byteOffset, PARTY_MON_SIZE)
  const personality = view.getUint32(0, true)
  const otId = view.getUint32(4, true)
  const flags = bytes[FLAGS]
  if (personality === 0 && otId === 0 && (flags & 0b10) === 0) return { ok: false, reason: 'empty' }
  if (flags & 0b1) return { ok: false, reason: 'bad-egg' }

  const secure = decryptSecure(bytes, personality, otId)
  if (secureChecksum(secure) !== view.getUint16(CHECKSUM, true)) return { ok: false, reason: 'checksum' }

  const [growthSlot, attacksSlot, evsSlot, miscSlot] = SUBSTRUCT_SLOTS[(personality >>> 0) % 24]
  const sub = (slot: number) => new DataView(secure.buffer, slot * SUBSTRUCT_SIZE, SUBSTRUCT_SIZE)
  const growth = sub(growthSlot)
  const attacks = sub(attacksSlot)
  const evs = sub(evsSlot)
  const misc = sub(miscSlot)

  const species = growth.getUint16(0, true)
  const dex = SPECIES_TO_NATIONAL[species] ?? 0
  const isEgg = Boolean(flags & 0b100) || Boolean(misc.getUint32(4, true) & (1 << 30))
  if (species === 0 || (!isEgg && (dex < 1 || dex > 386)) || (isEgg && species !== SPECIES_EGG && !dex)) {
    return { ok: false, reason: 'species' }
  }

  const ppBonuses = growth.getUint8(8)
  const moves: MoveSlot[] = []
  for (let i = 0; i < 4; i++) {
    const id = attacks.getUint16(i * 2, true)
    if (id) moves.push({ id, pp: attacks.getUint8(8 + i), ppUps: (ppBonuses >> (i * 2)) & 0b11 })
  }

  const ivWord = misc.getUint32(4, true)
  const iv = (shift: number) => (ivWord >>> shift) & 0x1f
  const origins = misc.getUint16(2, true)

  return {
    ok: true,
    mon: {
      personality,
      otId,
      nickname: decodeText(bytes.subarray(NICKNAME, NICKNAME + NICKNAME_LENGTH)),
      otName: decodeText(bytes.subarray(OT_NAME, OT_NAME + OT_NAME_LENGTH)),
      language: bytes[LANGUAGE],
      isEgg,
      species,
      dex,
      heldItem: growth.getUint16(2, true),
      experience: growth.getUint32(4, true),
      friendship: growth.getUint8(9),
      moves,
      evs: {
        hp: evs.getUint8(0),
        atk: evs.getUint8(1),
        def: evs.getUint8(2),
        spe: evs.getUint8(3),
        spa: evs.getUint8(4),
        spd: evs.getUint8(5),
      },
      ivs: { hp: iv(0), atk: iv(5), def: iv(10), spe: iv(15), spa: iv(20), spd: iv(25) },
      abilitySlot: ((ivWord >>> 31) & 1) as 0 | 1,
      metLevel: origins & 0x7f,
      pokeball: (origins >>> 11) & 0xf,
      nature: natureFromPersonality(personality),
      shiny: isShiny(otId, personality),
      unownForm: unownForm(personality),
      status: decodeStatus(view.getUint32(STATUS, true)),
      level: bytes[LEVEL],
      hp: view.getUint16(HP, true),
      maxHp: view.getUint16(MAX_HP, true),
      stats: {
        hp: view.getUint16(MAX_HP, true),
        atk: view.getUint16(STATS, true),
        def: view.getUint16(STATS + 2, true),
        spe: view.getUint16(STATS + 4, true),
        spa: view.getUint16(STATS + 6, true),
        spd: view.getUint16(STATS + 8, true),
      },
    },
  }
}
