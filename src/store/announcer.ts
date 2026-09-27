import { create } from 'zustand'

interface AnnouncerState {
  message: string
  // bumped so repeating the same message is announced again
  id: number
}

export const useAnnouncer = create<AnnouncerState>(() => ({ message: '', id: 0 }))

export function announce(message: string): void {
  useAnnouncer.setState((s) => ({ message, id: s.id + 1 }))
}
