import { PARTY_MON_SIZE, parsePartyMon, type PartyMon } from './gen3/pokemon'
import { offsetsFor } from './offsets'

export interface MemoryReader {
  read(address: number, length: number): Uint8Array | null
}

export const PARTY_SIZE = 6

export type PartySlot = { slot: number; mon: PartyMon } | { slot: number; mon: null; reason: 'bad-egg' | 'checksum' | 'species' | 'empty' }

export type PartyReading =
  | { kind: 'ok'; slots: PartySlot[] }
  | { kind: 'unsupported'; gameCode: string | null }
  | { kind: 'unavailable' }
  | { kind: 'invalid'; count: number }

// Pure: everything it knows about the game comes from the reader, so it runs against memory dumps in tests.
export function readParty(memory: MemoryReader, gameCode: string | null): PartyReading {
  const offsets = offsetsFor(gameCode)
  if (!offsets) return { kind: 'unsupported', gameCode }

  const countByte = memory.read(offsets.partyCount, 1)
  const party = memory.read(offsets.party, PARTY_MON_SIZE * PARTY_SIZE)
  if (!countByte || !party) return { kind: 'unavailable' }

  const count = countByte[0]
  if (count > PARTY_SIZE) return { kind: 'invalid', count }

  const slots: PartySlot[] = []
  for (let slot = 0; slot < count; slot++) {
    const parsed = parsePartyMon(party.subarray(slot * PARTY_MON_SIZE, (slot + 1) * PARTY_MON_SIZE))
    slots.push(parsed.ok ? { slot, mon: parsed.mon } : { slot, mon: null, reason: parsed.reason })
  }
  return { kind: 'ok', slots }
}

// A torn read mid-write shows up as a checksum failure; callers keep the last good reading instead
export const hasTornSlot = (reading: PartyReading) =>
  reading.kind === 'ok' && reading.slots.some((s) => s.mon === null && s.reason === 'checksum')
