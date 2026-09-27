import { CHARMAP } from './tables'

const TERMINATOR = 0xff

// Gen 3 strings use a game-specific table and end at 0xFF (or at the field's fixed length)
export function decodeText(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) {
    if (byte === TERMINATOR) break
    out += CHARMAP[byte] ?? '?'
  }
  return out.trimEnd()
}

const ENCODE = new Map(Object.entries(CHARMAP).map(([byte, char]) => [char, Number(byte)]))

export function encodeText(text: string, length: number): Uint8Array {
  const out = new Uint8Array(length).fill(TERMINATOR)
  ;[...text].slice(0, length).forEach((char, i) => {
    const byte = ENCODE.get(char)
    if (byte === undefined) throw new Error(`No Gen 3 glyph for ${JSON.stringify(char)}`)
    out[i] = byte
  })
  return out
}
