export interface GameOffsets {
  name: string
  partyCount: number
  party: number
}

// Addresses from pret/pokeemerald's symbols branch (pokeemerald.sym): gPlayerPartyCount, gPlayerParty.
// Other regions/versions get their own entry keyed by the ROM header game code.
export const GAME_OFFSETS: Readonly<Record<string, GameOffsets>> = {
  BPEE: { name: 'Pokémon Emerald (US)', partyCount: 0x020244e9, party: 0x020244ec },
}

export const ROM_GAME_CODE = 0x080000ac

export const offsetsFor = (gameCode: string | null): GameOffsets | null => (gameCode && GAME_OFFSETS[gameCode]) || null
