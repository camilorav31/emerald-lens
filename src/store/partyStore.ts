import { create } from 'zustand'
import { readVblankCounter } from '../memory/offsets'
import { hasTornSlot, readParty, type PartyReading } from '../memory/partyReader'
import { haptic } from '../ui/party/effects'
import type { PartyMon } from '../memory/gen3/pokemon'
import { announce } from './announcer'
import { useEmulatorStore } from './emulatorStore'

const INTERVAL_MS = { live: 500, snapshot: 1000 }
// A checksum miss is usually a read mid-write; only trust it if it persists
const TORN_RETRIES = 3

interface PartyState {
  reading: PartyReading | null
  // bumps only when the decoded party actually changes
  revision: number
  // a dev-only demo team is shown; live readings are ignored until it ends
  demo: boolean
}

export const usePartyStore = create<PartyState>(() => ({ reading: null, revision: 0, demo: false }))

export interface PerfStats {
  // emulated frames per real second, from the game's own VBlank counter
  emuFps: number | null
  captureMs: number | null
  intervalMs: number | null
}

export const usePerfStore = create<PerfStats>(() => ({ emuFps: null, captureMs: null, intervalMs: null }))

let timer: ReturnType<typeof setTimeout> | null = null
let inFlight = false
let tornStreak = 0
let failStreak = 0
let lastKey = ''
let lastVblank: { count: number; at: number } | null = null

async function poll() {
  const { emulator, gameCode, status } = useEmulatorStore.getState()
  if (!emulator || status !== 'running' || inFlight) return
  inFlight = true
  try {
    const started = performance.now()
    const memory = await emulator.captureMemory()
    const captureMs = performance.now() - started

    const vblank = memory ? readVblankCounter(memory, gameCode) : null
    let emuFps: number | null = null
    if (vblank !== null && lastVblank && vblank >= lastVblank.count) {
      emuFps = ((vblank - lastVblank.count) * 1000) / (started - lastVblank.at)
    }
    lastVblank = vblank === null ? null : { count: vblank, at: started }
    usePerfStore.setState({ emuFps, captureMs, intervalMs: INTERVAL_MS[emulator.memoryAccess] })

    const reading: PartyReading = memory ? readParty(memory, gameCode) : { kind: 'unavailable' }
    // The first capture right after boot can fail before the core thread settles; only report persistent failures
    if (reading.kind === 'unavailable') {
      if (++failStreak < TORN_RETRIES) return
    } else {
      failStreak = 0
    }
    if (hasTornSlot(reading) && ++tornStreak < TORN_RETRIES) return
    tornStreak = 0
    if (usePartyStore.getState().demo) return
    const key = JSON.stringify(reading)
    if (key === lastKey) return
    lastKey = key
    usePartyStore.setState((s) => ({ reading, revision: s.revision + 1 }))
  } finally {
    inFlight = false
  }
}

// Drops the cached reading so the next poll republishes the live party (used when a demo ends)
export function resetPartyReading() {
  lastKey = ''
  usePartyStore.setState({ reading: null, demo: false })
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
  lastVblank = null
}

const monsOf = (reading: PartyReading | null) =>
  reading?.kind === 'ok' ? reading.slots.flatMap((s) => (s.mon ? [s.mon] : [])) : []
const identity = (mon: PartyMon) => `${mon.personality}-${mon.otId}`

// Tells screen readers (and, on phones, the hand) about level-ups and faints. One place for every layout, so
// a mon is announced once however many UIs show it; mons that were not in the previous reading are ignored.
function notifyChanges(prev: PartyReading | null, next: PartyReading | null) {
  const before = new Map(monsOf(prev).map((m) => [identity(m), m]))
  let buzz: 'level' | 'faint' | null = null
  const messages: string[] = []
  for (const mon of monsOf(next)) {
    const old = before.get(identity(mon))
    if (!old || mon.isEgg) continue
    if (old.hp > 0 && mon.hp === 0) {
      messages.push(`${mon.nickname} se debilitó`)
      buzz = 'faint'
    } else if (mon.level > old.level) {
      messages.push(`${mon.nickname} subió al nivel ${mon.level}`)
      buzz ??= 'level'
    }
  }
  // one live-region message per reading: separate calls would overwrite each other
  if (messages.length) announce(messages.join('. '))
  if (buzz) haptic(buzz)
}

// Polls while a game runs; a pause freezes the last reading, a new cartridge clears it.
export function startPartyPolling(): () => void {
  const unsubscribeParty = usePartyStore.subscribe((state, prev) => {
    if (state.revision !== prev.revision) notifyChanges(prev.reading, state.reading)
  })
  const unsubscribe = useEmulatorStore.subscribe((state, prev) => {
    if (state.romName !== prev.romName && !usePartyStore.getState().demo) {
      lastKey = ''
      usePartyStore.setState({ reading: null })
    }
    if (state.status === prev.status && state.romName === prev.romName) return
    stop()
    if (state.status === 'running') {
      void poll()
      schedule()
    } else {
      usePerfStore.setState({ emuFps: null })
    }
  })
  if (useEmulatorStore.getState().status === 'running') {
    void poll()
    schedule()
  }
  return () => {
    unsubscribe()
    unsubscribeParty()
    stop()
  }
}
