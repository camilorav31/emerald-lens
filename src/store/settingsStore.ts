import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { ControlScheme } from '../emulator/keymaps'

export type ScreenFilter = 'none' | 'lcd' | 'crt'
export type Theme = 'dark' | 'light'

interface SettingsState {
  filter: ScreenFilter
  // file name of the validated cartridge in IndexedDB; it autostarts on every visit
  lastRom: string | null
  controlScheme: ControlScheme
  theme: Theme | null
  muted: boolean
  fastForward: boolean
  perfMonitor: boolean
  setFilter: (filter: ScreenFilter) => void
  setLastRom: (lastRom: string) => void
  setControlScheme: (controlScheme: ControlScheme) => void
  setTheme: (theme: Theme) => void
  toggleMuted: () => void
  toggleFastForward: () => void
  setPerfMonitor: (perfMonitor: boolean) => void
}

export const SETTINGS_KEY = 'emerald-lens:settings'

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
      filter: 'none',
      lastRom: null,
      controlScheme: 'arrows',
      theme: null,
      muted: false,
      fastForward: false,
      perfMonitor: false,
      setFilter: (filter) => set({ filter }),
      setLastRom: (lastRom) => set({ lastRom }),
      setControlScheme: (controlScheme) => set({ controlScheme }),
      setTheme: (theme) => set({ theme }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      toggleFastForward: () => set((s) => ({ fastForward: !s.fastForward })),
      setPerfMonitor: (perfMonitor) => set({ perfMonitor }),
    }),
    {
      name: SETTINGS_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ filter, lastRom, controlScheme, theme, muted, perfMonitor }) => ({
        filter,
        lastRom,
        controlScheme,
        theme,
        muted,
        perfMonitor,
      }),
      // 2x is a per-session toggle: never start a visit fast, even if an older version stored it
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<SettingsState>), fastForward: false }),
    },
  ),
)
