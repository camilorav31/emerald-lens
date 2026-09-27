import { create } from 'zustand'
import { hasTornSlot, readParty, type PartyReading } from '../memory/partyReader'
import { useEmulatorStore } from './emulatorStore'

const INTERVAL_MS = { live: 500, snapshot: 1000 }
// A checksum miss is usually a read mid-write; only trust it if it persists
const TORN_RETRIES = 3

interface PartyState {
  reading: PartyReading | null
  // bumps only when the decoded party actually changes
  revision: number
}

export const usePartyStore = create<PartyState>(() => ({ reading: null, revision: 0 }))

let timer: ReturnType<typeof setTimeout> | null = null
let inFlight = false
let tornStreak = 0
let lastKey = ''

async function poll() {
  const { emulator, gameCode, status } = useEmulatorStore.getState()
  if (!emulator || status !== 'running' || inFlight) return
  inFlight = true
  try {
    const memory = await emulator.captureMemory()
    const reading: PartyReading = memory ? readParty(memory, gameCode) : { kind: 'unavailable' }
    if (hasTornSlot(reading) && ++tornStreak < TORN_RETRIES) return
    tornStreak = 0
    const key = JSON.stringify(reading)
    if (key === lastKey) return
    lastKey = key
    usePartyStore.setState((s) => ({ reading, revision: s.revision + 1 }))
  } finally {
    inFlight = false
  }
}

function schedule() {
  const { emulator, status } = useEmulatorStore.getState()
  if (!emulator || status !== 'running') return
  timer = setTimeout(async () => {
    await poll()
    schedule()
  }, INTERVAL_MS[emulator.memoryAccess])
}

function stop() {
  if (timer) clearTimeout(timer)
  timer = null
}

// Polls while a game runs; a pause freezes the last reading, a new ROM clears it.
export function startPartyPolling(): () => void {
  const unsubscribe = useEmulatorStore.subscribe((state, prev) => {
    if (state.romName !== prev.romName) {
      lastKey = ''
      usePartyStore.setState({ reading: null })
    }
    if (state.status === prev.status && state.romName === prev.romName) return
    stop()
    if (state.status === 'running') {
      void poll()
      schedule()
    }
  })
  if (useEmulatorStore.getState().status === 'running') {
    void poll()
    schedule()
  }
  return () => {
    unsubscribe()
    stop()
  }
}
