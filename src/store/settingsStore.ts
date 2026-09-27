import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { ControlScheme } from '../emulator/keymaps'
import type { ScaleMode } from '../ui/game-screen/computeScale'

export type ScreenFilter = 'none' | 'lcd' | 'crt'

interface SettingsState {
  scaleMode: ScaleMode
  filter: ScreenFilter
  lastRom: string | null
  controlScheme: ControlScheme
  setScaleMode: (scaleMode: ScaleMode) => void
  setFilter: (filter: ScreenFilter) => void
  setLastRom: (lastRom: string) => void
  setControlScheme: (controlScheme: ControlScheme) => void
}

// localStorage throws in some privacy modes; settings are a convenience, so fail quietly
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      /* not persisted */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* not persisted */
    }
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      scaleMode: 'auto',
      filter: 'none',
      lastRom: null,
      controlScheme: 'arrows',
      setScaleMode: (scaleMode) => set({ scaleMode }),
      setFilter: (filter) => set({ filter }),
      setLastRom: (lastRom) => set({ lastRom }),
      setControlScheme: (controlScheme) => set({ controlScheme }),
    }),
    {
      name: 'emerald-lens:settings',
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ scaleMode, filter, lastRom, controlScheme }) => ({ scaleMode, filter, lastRom, controlScheme }),
    },
  ),
)
