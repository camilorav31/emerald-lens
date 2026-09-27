import { describe, expect, it } from 'vitest'
import { natureFromPersonality } from './gen3/natures'
import { isShiny, parsePartyMon, SUBSTRUCT_SLOTS, unownForm } from './gen3/pokemon'
import { SPECIES_TO_NATIONAL } from './gen3/tables'
import { decodeText, encodeText } from './gen3/text'
import { hasTornSlot, readParty } from './partyReader'
import { encodeMon, ewramReader } from './testing/encodeMon'

const TREECKO = 277
const MUDKIP = 283

function ewramWithParty(slots: Uint8Array[]) {
  const ewram = new Uint8Array(0x40000)
  ewram[0x244e9] = slots.length
  slots.forEach((slot, i) => ewram.set(slot, 0x244ec + i * 100))
  return ewram
}

describe('Gen 3 text', () => {
  it('decodes letters, digits and symbols and stops at 0xFF', () => {
    const bytes = new Uint8Array([0xbb, 0xd5, 0xa1, 0xab, 0xb6, 0x00, 0xc7, 0xff, 0xbb])
    expect(decodeText(bytes)).toBe('Aa0!♀ M')
  })
  it('round-trips nicknames with accents', () => {
    expect(decodeText(encodeText('Pikachú', 10))).toBe('Pikachú')
  })
})

describe('species table', () => {
  it('maps Hoenn internal indices to the national dex', () => {
    expect(SPECIES_TO_NATIONAL[1]).toBe(1)
    expect(SPECIES_TO_NATIONAL[251]).toBe(251)
    expect(SPECIES_TO_NATIONAL[TREECKO]).toBe(252)
    expect(SPECIES_TO_NATIONAL[MUDKIP]).toBe(258)
    expect(SPECIES_TO_NATIONAL[411]).toBe(358) // Chimecho sits at the end of the internal list
  })
  it('covers every national number from 1 to 386 exactly once', () => {
    const national = SPECIES_TO_NATIONAL.filter((n) => n >= 1 && n <= 386)
    expect(new Set(national).size).toBe(386)
    expect(national).toHaveLength(386)
  })
})

describe('parsePartyMon', () => {
  const base = {
    otId: 0x1a2b3c4d,
    species: MUDKIP,
    nickname: 'MUDKIP',
    heldItem: 0x44,
    experience: 1234,
    moves: [
      { id: 33, pp: 35, ppUps: 1 },
      { id: 45, pp: 40 },
      { id: 55, pp: 25, ppUps: 3 },
    ],
    evs: { hp: 4, atk: 252, spe: 252 },
    ivs: { hp: 31, atk: 0, def: 15, spe: 30, spa: 1, spd: 17 },
    abilitySlot: 1 as const,
    level: 16,
    hp: 17,
    maxHp: 45,
    stats: { atk: 30, def: 25, spe: 20, spa: 22, spd: 21 },
  }

  it('decodes every one of the 24 substruct orders', () => {
    for (let order = 0; order < 24; order++) {
      const personality = 0x9c00_0000 + order // keeps the high bits noisy while choosing the order
      expect(personality % 24).toBe((0x9c00_0000 % 24 + order) % 24)
      const parsed = parsePartyMon(encodeMon({ ...base, personality }))
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return
      expect(parsed.mon).toMatchObject({
        species: MUDKIP,
        dex: 258,
        nickname: 'MUDKIP',
        heldItem: 0x44,
        experience: 1234,
        evs: { hp: 4, atk: 252, def: 0, spe: 252, spa: 0, spd: 0 },
        ivs: { hp: 31, atk: 0, def: 15, spe: 30, spa: 1, spd: 17 },
        abilitySlot: 1,
        level: 16,
        hp: 17,
        maxHp: 45,
      })
      expect(parsed.mon.moves).toEqual([
        { id: 33, pp: 35, ppUps: 1 },
        { id: 45, pp: 40, ppUps: 0 },
        { id: 55, pp: 25, ppUps: 3 },
      ])
    }
  })

  it('uses a distinct slot permutation for each order', () => {
    expect(new Set(SUBSTRUCT_SLOTS.map((p) => p.join(''))).size).toBe(24)
    for (const p of SUBSTRUCT_SLOTS) expect([...p].sort()).toEqual([0, 1, 2, 3])
  })

  it('rejects a slot whose checksum does not match (torn or corrupt read)', () => {
    const bytes = encodeMon({ ...base, personality: 0x12345678 })
    bytes[40] ^= 0xff
    expect(parsePartyMon(bytes)).toEqual({ ok: false, reason: 'checksum' })
  })

  it('reports status, nature and shininess', () => {
    const parsed = parsePartyMon(encodeMon({ ...base, personality: 0x0000_0019, status: 1 << 6 }))
    expect(parsed.ok && parsed.mon.status).toBe('paralysis')
    expect(parsed.ok && parsed.mon.nature.name).toBe(natureFromPersonality(0x19).name)
  })

  it('flags eggs', () => {
    const parsed = parsePartyMon(encodeMon({ ...base, personality: 7, isEgg: true }))
    expect(parsed.ok && parsed.mon.isEgg).toBe(true)
  })
})

describe('derived values', () => {
  it('computes natures from personality % 25', () => {
    expect(natureFromPersonality(0)).toMatchObject({ name: 'Fuerte', raised: null, lowered: null })
    expect(natureFromPersonality(3)).toMatchObject({ name: 'Firme', raised: 'atk', lowered: 'spa' }) // Adamant
    expect(natureFromPersonality(10)).toMatchObject({ name: 'Miedosa', raised: 'spe', lowered: 'atk' }) // Timid
    expect(natureFromPersonality(15)).toMatchObject({ name: 'Modesta', raised: 'spa', lowered: 'atk' })
    expect(natureFromPersonality(25 + 13)).toMatchObject({ name: 'Alegre', raised: 'spe', lowered: 'spa' }) // Jolly
  })

  it('detects shininess with the OT id / personality XOR below 8', () => {
    const otId = 0x0000_1234
    expect(isShiny(otId, 0x0000_1234)).toBe(true) // xor of halves = 0
    expect(isShiny(otId, 0x0007_1234)).toBe(true)
    expect(isShiny(otId, 0x0008_1234)).toBe(false)
  })

  it('derives the Unown letter from the low two bits of each personality byte', () => {
    expect(unownForm(0x00000000)).toBe(0) // A
    expect(unownForm(0x00000001)).toBe(1) // B
    expect(unownForm(0x03030303)).toBe(255 % 28)
    expect(unownForm(0x00000100)).toBe(4)
  })
})

describe('readParty', () => {
  const mon = (personality: number, species: number, nickname: string) =>
    encodeMon({ personality, otId: 0xcafe, species, nickname, level: 10 })

  it('reads the count and every slot from BPEE addresses', () => {
    const reading = readParty(ewramReader(ewramWithParty([mon(1, TREECKO, 'TREECKO'), mon(2, MUDKIP, 'MUDKIP')])), 'BPEE')
    expect(reading.kind).toBe('ok')
    if (reading.kind !== 'ok') return
    expect(reading.slots.map((s) => s.mon?.nickname)).toEqual(['TREECKO', 'MUDKIP'])
    expect(reading.slots.map((s) => s.mon?.dex)).toEqual([252, 258])
  })

  it('handles an empty party', () => {
    expect(readParty(ewramReader(ewramWithParty([])), 'BPEE')).toEqual({ kind: 'ok', slots: [] })
  })

  it('reports unsupported versions without reading memory', () => {
    let reads = 0
    const memory = { read: () => (reads++, null) }
    expect(readParty(memory, 'AXVE')).toEqual({ kind: 'unsupported', gameCode: 'AXVE' })
    expect(reads).toBe(0)
  })

  it('treats an out-of-range count as invalid (garbage or not in game yet)', () => {
    const ewram = ewramWithParty([])
    ewram[0x244e9] = 200
    expect(readParty(ewramReader(ewram), 'BPEE')).toEqual({ kind: 'invalid', count: 200 })
  })

  it('marks torn slots so the caller can keep the previous reading', () => {
    const bad = mon(5, TREECKO, 'TREECKO')
    bad[50] ^= 1
    const reading = readParty(ewramReader(ewramWithParty([mon(1, MUDKIP, 'MUDKIP'), bad])), 'BPEE')
    expect(hasTornSlot(reading)).toBe(true)
  })
})
