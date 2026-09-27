// The party reader's offsets are verified for one exact dump, so only that cartridge is accepted.
// SHA-1 of "Pokemon - Emerald Version (USA, Europe).gba" (No-Intro).
const SUPPORTED_SHA1 = 'f3ae088181bf583e55daf962a92bb46f4f1d07b7'
const SUPPORTED_CODE = 'BPEE'
const HEADER_FIXED_OFFSET = 0xb2
const HEADER_FIXED_VALUE = 0x96
const GAME_CODE_OFFSET = 0xac

export type CartridgeCheck =
  | { ok: true; gameCode: string }
  | { ok: false; reason: 'not-gba' | 'wrong-game' | 'modified'; gameCode?: string }

async function sha1Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', bytes as BufferSource)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function inspectCartridge(bytes: Uint8Array): Promise<CartridgeCheck> {
  if (bytes.length < 0xc0 || bytes[HEADER_FIXED_OFFSET] !== HEADER_FIXED_VALUE) return { ok: false, reason: 'not-gba' }
  const gameCode = String.fromCharCode(...bytes.subarray(GAME_CODE_OFFSET, GAME_CODE_OFFSET + 4))
  if (gameCode !== SUPPORTED_CODE) return { ok: false, reason: 'wrong-game', gameCode }
  if ((await sha1Hex(bytes)) !== SUPPORTED_SHA1) return { ok: false, reason: 'modified', gameCode }
  return { ok: true, gameCode }
}

export const CARTRIDGE_ERRORS: Record<'not-gba' | 'wrong-game' | 'modified', string> = {
  'not-gba': 'El archivo no es un cartucho de Game Boy Advance.',
  'wrong-game': 'Emerald Lens solo funciona con Pokémon Esmeralda (USA/Europa).',
  modified: 'Este cartucho de Esmeralda está modificado o es de otra región; solo se admite la versión USA/Europa original.',
}
