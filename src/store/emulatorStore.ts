import { create } from 'zustand'
import type { Emulator, MemoryAccess } from '../emulator/emulator'
import { announce } from './announcer'
import { useSettingsStore } from './settingsStore'

const SUPPORTED_GAME_CODES = new Set(['BPEE'])

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
  storedRoms: string[]
  romName: string | null
  gameCode: string | null
  memoryAccess: MemoryAccess | null
  inputActive: boolean
  importing: boolean
  // a ROM dropped while the core is still booting
  pendingFile: File | null
  ready: (emulator: Emulator) => void
  fail: (error: unknown) => void
  insertFile: (file: File) => void
  importAndStart: (file: File) => Promise<void>
  start: (romName: string) => void
  togglePause: () => void
  setInputActive: (active: boolean) => void
  dismissError: () => void
  dismissNotice: () => void
}

export const isSupportedGame = (code: string | null) => code !== null && SUPPORTED_GAME_CODES.has(code)
export const hasGame = (status: EmulatorStatus) => status === 'running' || status === 'paused'
export const isRomFile = (file: File) => file.name.toLowerCase().endsWith('.gba')

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

export const useEmulatorStore = create<EmulatorState>((set, get) => ({
  emulator: null,
  status: 'booting',
  error: null,
  notice: null,
  storedRoms: [],
  romName: null,
  gameCode: null,
  memoryAccess: null,
  inputActive: false,
  importing: false,
  pendingFile: null,

  ready: (emulator) => {
    // Game input stays off until the screen takes focus
    emulator.setInputEnabled(false)
    set({ emulator, status: 'idle', storedRoms: emulator.storedRoms(), memoryAccess: emulator.memoryAccess })
    const { pendingFile } = get()
    if (pendingFile) {
      set({ pendingFile: null })
      void get().importAndStart(pendingFile)
    }
  },

  fail: (error) =>
    set({ status: 'error', error: { kind: 'core', title: 'No se pudo iniciar el emulador', message: messageOf(error) } }),

  insertFile: (file) => {
    if (!isRomFile(file)) {
      set({ error: { kind: 'invalid-file', title: 'Archivo no válido', message: 'El archivo debe ser una ROM de GBA (.gba).' } })
      return
    }
    if (get().status === 'booting') {
      set({ pendingFile: file })
      return
    }
    void get().importAndStart(file)
  },

  importAndStart: async (file) => {
    const { emulator } = get()
    if (!emulator) return
    set({ importing: true })
    let romName: string
    try {
      romName = await emulator.importRom(file)
    } catch (error) {
      set({ importing: false, error: { kind: 'import', title: 'No se pudo guardar la ROM', message: messageOf(error) } })
      return
    }
    set({ importing: false, storedRoms: emulator.storedRoms(), notice: 'ROM guardada en este navegador' })
    get().start(romName)
  },

  start: (romName) => {
    const { emulator } = get()
    if (!emulator) return
    if (!emulator.start(romName)) {
      set({ error: { kind: 'start', title: 'No se pudo abrir la ROM', message: `mGBA no pudo cargar ${romName}.` } })
      return
    }
    const settings = useSettingsStore.getState()
    settings.setLastRom(romName)
    emulator.applyKeymap(settings.controlScheme)
    set({ status: 'running', romName, gameCode: emulator.gameCode(romName), error: null })
    announce(`ROM cargada: ${romName}`)
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
  if (state.controlScheme !== prev.controlScheme) useEmulatorStore.getState().emulator?.applyKeymap(state.controlScheme)
})
