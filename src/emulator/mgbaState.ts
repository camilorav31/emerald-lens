// mGBA's screenshot save states are PNGs with the raw GBASerializedState zlib-compressed in a custom
// "gbAs" chunk (src/core/serialize.c: _savePNGState). WRAM (EWRAM) sits at 0x21000..0x60FFF of that state
// (include/mgba/internal/gba/serialize.h).
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const STATE_SIZE = 0x61000
const EWRAM_OFFSET = 0x21000
export const EWRAM_SIZE = 0x40000
const SAVESTATE_MAGIC = 0x01

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

export async function ewramFromStatePng(png: Uint8Array): Promise<Uint8Array | null> {
  const chunk = findChunk(png, 'gbAs')
  if (!chunk) return null
  const state = await inflateZlib(chunk)
  if (state.length < STATE_SIZE || state[3] !== SAVESTATE_MAGIC) return null
  return state.slice(EWRAM_OFFSET, EWRAM_OFFSET + EWRAM_SIZE)
}
