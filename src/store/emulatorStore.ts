import { create } from 'zustand'
import { CARTRIDGE_ERRORS, inspectCartridge } from '../emulator/cartridge'
import type { Emulator, MemoryAccess } from '../emulator/emulator'
import { announce } from './announcer'
import { useSettingsStore } from './settingsStore'

export type EmulatorStatus = 'booting' | 'idle' | 'running' | 'paused' | 'error'
export type ErrorKind = 'invalid-file' | 'import' | 'start' | 'dev-rom' | 'core'

export interface AppError {
  kind: ErrorKind
  title: string
  message: string
}

interface EmulatorState {
  emulator: Emulator | null
  status: EmulatorStatus
  error: AppError | null
  notice: string | null
  romName: string | null
  gameCode: string | null
  memoryAccess: MemoryAccess | null
  inputActive: boolean
  importing: boolean
  // a cartridge dropped while the core is still booting
  pendingFile: File | null
  ready: (emulator: Emulator) => Promise<void>
  fail: (error: unknown) => void
  insertFile: (file: File) => Promise<void>
  start: (romName: string, gameCode: string) => void
  togglePause: () => void
  setInputActive: (active: boolean) => void
  dismissError: () => void
  dismissNotice: () => void
}

export const hasGame = (status: EmulatorStatus) => status === 'running' || status === 'paused'

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

export const useEmulatorStore = create<EmulatorState>((set, get) => ({
  emulator: null,
  status: 'booting',
  error: null,
  notice: null,
  romName: null,
  gameCode: null,
  memoryAccess: null,
  inputActive: false,
  importing: false,
  pendingFile: null,

  // Stays in "booting" until it knows whether a stored cartridge can autostart, so the splash covers it
  ready: async (emulator) => {
    const settings = useSettingsStore.getState()
    emulator.setInputEnabled(false)
    emulator.setMuted(settings.muted)
    emulator.setFastForward(settings.fastForward)
    set({ emulator, memoryAccess: emulator.memoryAccess })

    const { pendingFile } = get()
    if (pendingFile) {
      set({ pendingFile: null, status: 'idle' })
      await get().insertFile(pendingFile)
      return
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).get('autoload') === '0') {
      set({ status: 'idle' })
      return
    }
    const stored = emulator.storedRoms()
    const candidates = [...new Set([settings.lastRom, ...stored].filter((n): n is string => !!n && stored.includes(n)))]
    for (const name of candidates) {
      const check = await emulator.inspectStored(name)
      if (check.ok) {
        get().start(name, check.gameCode)
        return
      }
    }
    set({ status: 'idle' })
  },

  fail: (error) =>
    set({ status: 'error', error: { kind: 'core', title: 'No se pudo iniciar el emulador', message: messageOf(error) } }),

  insertFile: async (file) => {
    const check = await inspectCartridge(new Uint8Array(await file.arrayBuffer()))
    if (!check.ok) {
      set({ error: { kind: 'invalid-file', title: 'Cartucho no compatible', message: CARTRIDGE_ERRORS[check.reason] } })
      return
    }
    const { emulator, status } = get()
    if (status === 'booting' || !emulator) {
      set({ pendingFile: file })
      return
    }
    set({ importing: true })
    let romName: string
    try {
      romName = await emulator.importRom(file)
    } catch (error) {
      set({ importing: false, error: { kind: 'import', title: 'No se pudo guardar el cartucho', message: messageOf(error) } })
      return
    }
    set({ importing: false, notice: 'Cartucho guardado en este navegador' })
    get().start(romName, check.gameCode)
  },

  start: (romName, gameCode) => {
    const { emulator } = get()
    if (!emulator) return
    if (!emulator.start(romName)) {
      set({ status: 'idle', error: { kind: 'start', title: 'No se pudo iniciar el cartucho', message: 'mGBA no pudo cargar el juego.' } })
      return
    }
    const settings = useSettingsStore.getState()
    settings.setLastRom(romName)
    emulator.applyKeymap(settings.controlScheme)
    set({ status: 'running', romName, gameCode, error: null })
    announce('Partida iniciada')
  },

  togglePause: () => {
    const { emulator, status } = get()
    if (!emulator) return
    if (status === 'running') {
      emulator.pause()
      set({ status: 'paused' })
      announce('Partida en pausa.')
    } else if (status === 'paused') {
      emulator.resume()
      set({ status: 'running' })
      announce('Partida reanudada.')
    }
  },

  setInputActive: (active) => {
    const { emulator, inputActive } = get()
    if (!emulator || inputActive === active) return
    emulator.setInputEnabled(active)
    set({ inputActive: active })
  },

  dismissError: () => set({ error: null }),
  dismissNotice: () => set({ notice: null }),
}))

useSettingsStore.subscribe((state, prev) => {
  const emulator = useEmulatorStore.getState().emulator
  if (!emulator) return
  if (state.controlScheme !== prev.controlScheme) emulator.applyKeymap(state.controlScheme)
  if (state.muted !== prev.muted) emulator.setMuted(state.muted)
  if (state.fastForward !== prev.fastForward) emulator.setFastForward(state.fastForward)
})
