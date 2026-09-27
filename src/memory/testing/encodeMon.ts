import { PARTY_MON_SIZE, SUBSTRUCT_SLOTS, secureChecksum, type StatBlock } from '../gen3/pokemon'
import { encodeText } from '../gen3/text'
export { ewramReader } from '../ewram'

// Test-only inverse of parsePartyMon: builds a valid, encrypted 100-byte party slot.
export interface MonSpec {
  personality: number
  otId: number
  species: number
  nickname?: string
  otName?: string
  heldItem?: number
  experience?: number
  friendship?: number
  moves?: { id: number; pp: number; ppUps?: number }[]
  evs?: Partial<StatBlock>
  ivs?: Partial<StatBlock>
  abilitySlot?: 0 | 1
  isEgg?: boolean
  metLevel?: number
  pokeball?: number
  status?: number
  level?: number
  hp?: number
  maxHp?: number
  stats?: Partial<Omit<StatBlock, 'hp'>>
}

const ZERO: StatBlock = { hp: 0, atk: 0, def: 0, spe: 0, spa: 0, spd: 0 }

export function encodeMon(spec: MonSpec): Uint8Array {
  const bytes = new Uint8Array(PARTY_MON_SIZE)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, spec.personality >>> 0, true)
  view.setUint32(4, spec.otId >>> 0, true)
  bytes.set(encodeText(spec.nickname ?? 'MON', 10), 8)
  bytes[18] = 2
  bytes[19] = 0b10 | (spec.isEgg ? 0b100 : 0)
  bytes.set(encodeText(spec.otName ?? 'ASH', 7), 20)

  const plain = new Uint8Array(48)
  const [g, a, e, m] = SUBSTRUCT_SLOTS[(spec.personality >>> 0) % 24]
  const sub = (slot: number) => new DataView(plain.buffer, slot * 12, 12)

  const growth = sub(g)
  growth.setUint16(0, spec.species, true)
  growth.setUint16(2, spec.heldItem ?? 0, true)
  growth.setUint32(4, spec.experience ?? 0, true)
  const moves = spec.moves ?? []
  growth.setUint8(8, moves.reduce((acc, move, i) => acc | ((move.ppUps ?? 0) << (i * 2)), 0))
  growth.setUint8(9, spec.friendship ?? 70)

  const attacks = sub(a)
  moves.forEach((move, i) => {
    attacks.setUint16(i * 2, move.id, true)
    attacks.setUint8(8 + i, move.pp)
  })

  const evs = { ...ZERO, ...spec.evs }
  const evView = sub(e)
  ;[evs.hp, evs.atk, evs.def, evs.spe, evs.spa, evs.spd].forEach((v, i) => evView.setUint8(i, v))

  const ivs = { ...ZERO, ...spec.ivs }
  const misc = sub(m)
  misc.setUint16(2, (spec.metLevel ?? 5) | ((spec.pokeball ?? 4) << 11), true)
  const ivWord =
    ivs.hp | (ivs.atk << 5) | (ivs.def << 10) | (ivs.spe << 15) | (ivs.spa << 20) | (ivs.spd << 25) |
    ((spec.isEgg ? 1 : 0) << 30) | ((spec.abilitySlot ?? 0) << 31)
  misc.setUint32(4, ivWord >>> 0, true)

  view.setUint16(28, secureChecksum(plain), true)
  const key = (spec.personality ^ spec.otId) >>> 0
  const plainView = new DataView(plain.buffer)
  for (let i = 0; i < 48; i += 4) view.setUint32(32 + i, (plainView.getUint32(i, true) ^ key) >>> 0, true)

  view.setUint32(80, spec.status ?? 0, true)
  bytes[84] = spec.level ?? 5
  view.setUint16(86, spec.hp ?? 20, true)
  view.setUint16(88, spec.maxHp ?? 20, true)
  const stats = { atk: 10, def: 10, spe: 10, spa: 10, spd: 10, ...spec.stats }
  ;[stats.atk, stats.def, stats.spe, stats.spa, stats.spd].forEach((v, i) => view.setUint16(90 + i * 2, v, true))
  return bytes
}

