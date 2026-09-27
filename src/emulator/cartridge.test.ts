import { describe, expect, it } from 'vitest'
import { inspectCartridge } from './cartridge'

function header(code: string, fixed = 0x96) {
  const bytes = new Uint8Array(0x200)
  bytes.set([...code].map((c) => c.charCodeAt(0)), 0xac)
  bytes[0xb2] = fixed
  return bytes
}

describe('inspectCartridge', () => {
  it('rejects files without a GBA header', async () => {
    expect(await inspectCartridge(new Uint8Array(16))).toEqual({ ok: false, reason: 'not-gba' })
    expect(await inspectCartridge(header('BPEE', 0x00))).toEqual({ ok: false, reason: 'not-gba' })
  })

  it('rejects other games by their header game code', async () => {
    expect(await inspectCartridge(header('AXVE'))).toEqual({ ok: false, reason: 'wrong-game', gameCode: 'AXVE' })
    expect(await inspectCartridge(header('BPRE'))).toEqual({ ok: false, reason: 'wrong-game', gameCode: 'BPRE' })
  })

  it('rejects an Emerald header whose contents differ from the verified dump (hacks, other revisions)', async () => {
    expect(await inspectCartridge(header('BPEE'))).toEqual({ ok: false, reason: 'modified', gameCode: 'BPEE' })
  })
})
