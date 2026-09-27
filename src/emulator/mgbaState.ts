// mGBA's screenshot save states are PNGs with the raw GBASerializedState zlib-compressed in a custom
// "gbAs" chunk (src/core/serialize.c: _savePNGState). Layout per include/mgba/internal/gba/serialize.h:
// IWRAM at 0x19000..0x20FFF and WRAM (EWRAM) at 0x21000..0x60FFF.
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const STATE_SIZE = 0x61000
const IWRAM_OFFSET = 0x19000
const IWRAM_SIZE = 0x8000
const EWRAM_OFFSET = 0x21000
const EWRAM_SIZE = 0x40000
const SAVESTATE_MAGIC = 0x01

export interface GbaRam {
  ewram: Uint8Array
  iwram: Uint8Array
}

function findChunk(png: Uint8Array, type: string): Uint8Array | null {
  if (!PNG_SIGNATURE.every((byte, i) => png[i] === byte)) return null
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  let offset = 8
  while (offset + 12 <= png.length) {
    const length = view.getUint32(offset)
    const name = String.fromCharCode(...png.subarray(offset + 4, offset + 8))
    if (name === type) return png.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length
  }
  return null
}

async function inflateZlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function ramFromStatePng(png: Uint8Array): Promise<GbaRam | null> {
  const chunk = findChunk(png, 'gbAs')
  if (!chunk) return null
  const state = await inflateZlib(chunk)
  if (state.length < STATE_SIZE || state[3] !== SAVESTATE_MAGIC) return null
  return {
    ewram: state.slice(EWRAM_OFFSET, EWRAM_OFFSET + EWRAM_SIZE),
    iwram: state.slice(IWRAM_OFFSET, IWRAM_OFFSET + IWRAM_SIZE),
  }
}
