import mGBA, { type mGBAEmulator } from '@emerald-lens/mgba-wasm'
import { ewramReader } from '../memory/ewram'
import type { MemoryReader } from '../memory/partyReader'
import { KEYMAPS, type ControlScheme } from './keymaps'
import { ewramFromStatePng } from './mgbaState'

const GBA_BUTTONS = ['a', 'b', 'select', 'start', 'right', 'left', 'up', 'down', 'r', 'l']
const ROM_HEADER_GAME_CODE = 0xac
// Scratch slot for memory snapshots; far from the 1-9 slots players use
const SNAPSHOT_SLOT = 99

export type MemoryAccess = 'live' | 'snapshot'

export class Emulator {
  private readonly module: mGBAEmulator
  private romName: string | null = null

  constructor(module: mGBAEmulator) {
    this.module = module
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

  async importRom(file: File): Promise<string> {
    await new Promise<void>((resolve) => this.module.uploadRom(file, resolve))
    // /data is IDBFS without autoPersist: sync so the ROM survives reloads
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
    }
    return loaded
  }

  // Read from the stored ROM file so it works with either core
  gameCode(romName: string): string | null {
    const path = `${this.module.filePaths().gamePath}/${romName}`
    const fs = this.module.FS
    try {
      const stream = fs.open(path, 'r')
      const bytes = new Uint8Array(4)
      fs.read(stream, bytes, 0, 4, ROM_HEADER_GAME_CODE)
      fs.close(stream)
      return String.fromCharCode(...bytes)
    } catch {
      return null
    }
  }

  pause(): void {
    this.module.pauseGame()
  }

  resume(): void {
    this.module.resumeGame()
  }

  // The core listens to the keyboard on window, so the UI gates it by focus.
  // Key-ups are lost while disabled, so held buttons, hold-F fast-forward and hold-R rewind are released.
  setInputEnabled(enabled: boolean): void {
    this.module.toggleInput(enabled)
    if (enabled) return
    for (const button of GBA_BUTTONS) this.module.buttonUnpress(button)
    this.module.toggleRewind(false)
    this.module.setFastForwardMultiplier(this.module.getFastForwardMultiplier())
  }

  // loadGame resets bindings to the core defaults, so this runs after every start and on scheme changes
  applyKeymap(scheme: ControlScheme): void {
    if (!this.romName) return
    for (const [button, binding] of Object.entries(KEYMAPS[scheme])) this.module.bindKey(binding.sdl, button)
  }

  // Live: reads straight from the bus. Snapshot: saveState (which interrupts the core thread, so the copy is
  // consistent) to a scratch slot, then pull EWRAM out of the state file.
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
    const ewram = await ewramFromStatePng(png)
    return ewram ? ewramReader(ewram) : null
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
