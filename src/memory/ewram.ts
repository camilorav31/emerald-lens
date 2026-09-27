import type { MemoryReader } from './partyReader'

export const EWRAM_BASE = 0x02000000
export const IWRAM_BASE = 0x03000000

// MemoryReader over RAM images; reads outside the given regions return null
export function ramReader({ ewram, iwram }: { ewram: Uint8Array; iwram?: Uint8Array }): MemoryReader {
  const regions = [
    { base: EWRAM_BASE, bytes: ewram },
    ...(iwram ? [{ base: IWRAM_BASE, bytes: iwram }] : []),
  ]
  return {
    read(address, length) {
      for (const { base, bytes } of regions) {
        const offset = address - base
        if (offset >= 0 && offset + length <= bytes.length) return bytes.slice(offset, offset + length)
      }
      return null
    },
  }
}

export const ewramReader = (ewram: Uint8Array) => ramReader({ ewram })
