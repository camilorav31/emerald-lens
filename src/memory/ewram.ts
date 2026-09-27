import type { MemoryReader } from './partyReader'

export const EWRAM_BASE = 0x02000000

// MemoryReader over a flat EWRAM image; reads outside EWRAM return null
export function ewramReader(ewram: Uint8Array): MemoryReader {
  return {
    read(address, length) {
      const offset = address - EWRAM_BASE
      if (offset < 0 || offset + length > ewram.length) return null
      return ewram.slice(offset, offset + length)
    },
  }
}
