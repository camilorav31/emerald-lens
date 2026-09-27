import { parsePartyMon, type PartyMon } from '../memory/gen3/pokemon'
import { ITEM_SLUGS, SPECIES_TO_NATIONAL } from '../memory/gen3/tables'
import type { PartySlot } from '../memory/partyReader'
import { encodeMon } from '../memory/testing/encodeMon'
import { resetPartyReading, usePartyStore } from '../store/partyStore'

// Dev-only: a fictional team, encoded to real Gen 3 bytes and decoded by the same parser the live panel uses.
const internal = (dex: number) => SPECIES_TO_NATIONAL.indexOf(dex)
const item = (slug: string) => ITEM_SLUGS.indexOf(slug)

const TEAM = [
  { dex: 260, nickname: 'TSUNAMI', level: 42, hp: 148, maxHp: 162, item: 'leftovers', moves: [[57, 15], [89, 10], [58, 10], [182, 10]], stats: { atk: 128, def: 108, spe: 74, spa: 98, spd: 106 } },
  { dex: 282, nickname: 'LUNA', level: 40, hp: 88, maxHp: 131, item: 'twisted-spoon', moves: [[94, 10], [347, 20], [85, 15], [204, 20]], stats: { atk: 58, def: 62, spe: 95, spa: 134, spd: 120 } },
  { dex: 310, nickname: 'VOLTIO', level: 39, hp: 30, maxHp: 118, item: 'magnet', moves: [[85, 15], [87, 10], [98, 30], [46, 20]], stats: { atk: 80, def: 62, spe: 112, spa: 108, spd: 62 } },
  { dex: 334, nickname: 'NUBE', level: 41, hp: 120, maxHp: 124, moves: [[225, 20], [337, 15], [219, 5]], stats: { atk: 76, def: 98, spe: 86, spa: 76, spd: 112 } },
  { dex: 330, nickname: 'ARENA', level: 43, hp: 140, maxHp: 140, item: 'soft-sand', moves: [[89, 10], [337, 15], [242, 15], [14, 30]], stats: { atk: 120, def: 96, spe: 118, spa: 96, spd: 96 }, shiny: true },
  { dex: 384, nickname: 'RAYQUAZA', level: 70, hp: 230, maxHp: 230, moves: [[245, 5], [337, 15], [63, 5], [349, 20]], stats: { atk: 210, def: 130, spe: 140, spa: 210, spd: 130 } },
]

const OT_ID = 0x2468ace0
// Checked non-shiny against OT_ID (the shiny value must be >= 8)
const PERSONALITIES = [0x5a3c9e17, 0x3f81c2d4, 0x9b2e7a61, 0xc47d1f08, 0x71e6b3a9, 0x2b9d4e63]

function build(): PartySlot[] {
  return TEAM.map((m, slot) => {
    // Shiny when (OT id ^ personality) halves XOR below 8: reuse the OT id as personality
    const personality = m.shiny ? OT_ID : PERSONALITIES[slot]
    const parsed = parsePartyMon(
      encodeMon({
        personality,
        otId: OT_ID,
        species: internal(m.dex),
        nickname: m.nickname,
        otName: 'DEMO',
        level: m.level,
        hp: m.hp,
        maxHp: m.maxHp,
        heldItem: m.item ? item(m.item) : 0,
        moves: m.moves.map(([id, pp]) => ({ id, pp })),
        ivs: { hp: 31, atk: 28, def: 22, spe: 31, spa: 19, spd: 25 },
        evs: { hp: 84, atk: 172, spe: 252 },
        stats: m.stats,
      }),
    )
    if (!parsed.ok) throw new Error(`demo mon ${m.nickname} failed to encode: ${parsed.reason}`)
    return { slot, mon: parsed.mon }
  })
}

function update(pick: (mons: PartyMon[]) => number | null, change: (mon: PartyMon) => Partial<PartyMon>) {
  const { reading } = usePartyStore.getState()
  if (reading?.kind !== 'ok') return
  const mons = reading.slots.map((s) => s.mon).filter((m): m is PartyMon => m !== null)
  const index = pick(mons)
  if (index === null) return
  const slots = reading.slots.map((s, i) => (i === index && s.mon ? { ...s, mon: { ...s.mon, ...change(s.mon) } } : s))
  usePartyStore.setState((st) => ({ reading: { kind: 'ok', slots }, revision: st.revision + 1 }))
}

const randomIndex = (mons: PartyMon[], ok: (m: PartyMon) => boolean) => {
  const candidates = mons.map((m, i) => (ok(m) ? i : -1)).filter((i) => i >= 0)
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
}

export function startDemoParty() {
  usePartyStore.setState((s) => ({ demo: true, reading: { kind: 'ok', slots: build() }, revision: s.revision + 1 }))
}

export function stopDemoParty() {
  resetPartyReading()
}

export function demoLevelUp() {
  update(
    (mons) => randomIndex(mons, (m) => m.hp > 0 && m.level < 100),
    (m) => {
      const grow = (v: number) => v + 2 + Math.floor(Math.random() * 3)
      const maxHp = m.maxHp + 3
      return {
        level: m.level + 1,
        maxHp,
        hp: m.hp + 3,
        stats: { hp: maxHp, atk: grow(m.stats.atk), def: grow(m.stats.def), spe: grow(m.stats.spe), spa: grow(m.stats.spa), spd: grow(m.stats.spd) },
      }
    },
  )
}

export function demoFaint() {
  update((mons) => randomIndex(mons, (m) => m.hp > 0), () => ({ hp: 0 }))
}

export function demoHealAll() {
  const { reading } = usePartyStore.getState()
  if (reading?.kind !== 'ok') return
  const slots = reading.slots.map((s) => (s.mon ? { ...s, mon: { ...s.mon, hp: s.mon.maxHp, status: null } } : s))
  usePartyStore.setState((st) => ({ reading: { kind: 'ok', slots }, revision: st.revision + 1 }))
}
