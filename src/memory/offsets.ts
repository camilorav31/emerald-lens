export interface GameOffsets {
  name: string
  partyCount: number
  party: number
  // gMain.vblankCounter1: incremented once per frame in VBlankIntr (src/main.c)
  vblankCounter: number
}

// Addresses from pret/pokeemerald's symbols branch (pokeemerald.sym): gPlayerPartyCount, gPlayerParty,
// gMain (0x030022C0) + 0x20 for vblankCounter1 (include/main.h).
export const GAME_OFFSETS: Readonly<Record<string, GameOffsets>> = {
  BPEE: { name: 'Pokémon Emerald (US)', partyCount: 0x020244e9, party: 0x020244ec, vblankCounter: 0x030022e0 },
}

export const ROM_GAME_CODE = 0x080000ac

export const offsetsFor = (gameCode: string | null): GameOffsets | null => (gameCode && GAME_OFFSETS[gameCode]) || null

export function readVblankCounter(memory: { read(a: number, l: number): Uint8Array | null }, gameCode: string | null) {
  const offsets = offsetsFor(gameCode)
  const bytes = offsets && memory.read(offsets.vblankCounter, 4)
  return bytes ? new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true) : null
}
