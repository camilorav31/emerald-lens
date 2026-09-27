import mGBA, { type mGBAEmulator } from '@emerald-lens/mgba-wasm'
import { ramReader } from '../memory/ewram'
import type { MemoryReader } from '../memory/partyReader'
import { inspectCartridge, type CartridgeCheck } from './cartridge'
import { KEYMAPS, type ControlScheme } from './keymaps'
import { ramFromStatePng } from './mgbaState'

const GBA_BUTTONS = ['a', 'b', 'select', 'start', 'right', 'left', 'up', 'down', 'r', 'l']
// Scratch slot for memory snapshots; far from the 1-9 slots players use
const SNAPSHOT_SLOT = 99

export type MemoryAccess = 'live' | 'snapshot'

export class Emulator {
  private readonly module: mGBAEmulator
  private romName: string | null = null
  private fastForward = false

  constructor(module: mGBAEmulator) {
    this.module = module
    // Rewind is not offered; skipping its 600-state ring buffer also saves memory and CPU
    this.module.setCoreSettings({ rewindEnable: false })
  }

  get version(): string {
    return `${this.module.version.projectName} ${this.module.version.projectVersion}`
  }

  // The patched core (core/patches) exports readMemory; the stock npm core only has save states
  get memoryAccess(): MemoryAccess {
    return typeof this.module.readMemory === 'function' ? 'live' : 'snapshot'
  }

  storedRoms(): string[] {
    return this.module.listRoms().filter((name) => name !== '.' && name !== '..')
  }

  async inspectStored(romName: string): Promise<CartridgeCheck> {
    try {
      return await inspectCartridge(this.module.FS.readFile(`${this.module.filePaths().gamePath}/${romName}`))
    } catch {
      return { ok: false, reason: 'not-gba' }
    }
  }

  async importRom(file: File): Promise<string> {
    await new Promise<void>((resolve) => this.module.uploadRom(file, resolve))
    // /data is IDBFS without autoPersist: sync so the cartridge survives reloads
    await this.module.FSSync()
    return file.name
  }

  start(romName: string): boolean {
    const loaded = this.module.loadGame(`${this.module.filePaths().gamePath}/${romName}`)
    if (loaded) {
      this.romName = romName
      this.module.addCoreCallbacks({
        saveDataUpdatedCallback: () => void this.module.FSSync(),
      })
      this.applyFastForward()
    }
    return loaded
  }

  pause(): void {
    this.module.pauseGame()
  }

  resume(): void {
    this.module.resumeGame()
  }

  setMuted(muted: boolean): void {
    this.module.setVolume(muted ? 0 : 1)
  }

  setFastForward(enabled: boolean): void {
    this.fastForward = enabled
    this.applyFastForward()
  }

  private applyFastForward() {
    if (this.romName) this.module.setFastForwardMultiplier(this.fastForward ? 2 : 1)
  }

  // The core listens to the keyboard on window, so the UI gates it by focus. Key-ups are lost while
  // disabled, so held buttons are released and the chosen speed is re-applied over any stray hold.
  setInputEnabled(enabled: boolean): void {
    this.module.toggleInput(enabled)
    if (enabled) return
    for (const button of GBA_BUTTONS) this.module.buttonUnpress(button)
    this.applyFastForward()
  }

  // loadGame resets bindings to the core defaults, so this runs after every start and on scheme changes
  applyKeymap(scheme: ControlScheme): void {
    if (!this.romName) return
    for (const [button, binding] of Object.entries(KEYMAPS[scheme])) this.module.bindKey(binding.sdl, button)
  }

  // Live: reads straight from the bus. Snapshot: saveState (which interrupts the core thread, so the copy is
  // consistent) to a scratch slot, then pull EWRAM + IWRAM out of the state file.
  async captureMemory(): Promise<MemoryReader | null> {
    if (!this.romName) return null
    if (this.memoryAccess === 'live') return { read: (address, length) => this.module.readMemory(address, length) }

    if (!this.module.saveState(SNAPSHOT_SLOT)) return null
    const base = this.romName.replace(/\.[^.]+$/, '')
    const path = `${this.module.filePaths().saveStatePath}/${base}.ss${SNAPSHOT_SLOT}`
    let png: Uint8Array
    try {
      png = this.module.FS.readFile(path)
    } catch {
      return null
    } finally {
      try {
        this.module.FS.unlink(path)
      } catch {
        /* already gone */
      }
    }
    const ram = await ramFromStatePng(png)
    return ram ? ramReader(ram) : null
  }
}

let instance: Promise<Emulator> | null = null

// The wasm runtime is a process-wide singleton; StrictMode remounts must reuse it.
export function bootEmulator(canvas: HTMLCanvasElement): Promise<Emulator> {
  instance ??= (async () => {
    const module = await mGBA({ canvas })
    await module.FSInit()
    return new Emulator(module)
  })()
  return instance
}
