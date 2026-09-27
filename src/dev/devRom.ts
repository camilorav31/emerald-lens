import { create } from 'zustand'
import { useEmulatorStore } from '../store/emulatorStore'

// Dev-only: only imported behind import.meta.env.DEV, so none of this reaches the production bundle.
export const DEV_ROM = 'emerald.gba'
const DEV_ROM_URL = `/dev-roms/${DEV_ROM}`

let autoloadAttempted = false

export const useDevAutoload = create<{ result: 'started' | 'missing' | 'skipped' | null }>(() => ({ result: null }))

// Vite's SPA fallback answers 200 text/html for missing files
const isRom = (response: Response) => response.ok && !response.headers.get('content-type')?.includes('text/html')

export async function loadDevRom(): Promise<void> {
  const response = await fetch(DEV_ROM_URL)
  if (!isRom(response)) {
    useEmulatorStore.setState({
      error: { kind: 'dev-rom', title: `No se encontró dev-roms/${DEV_ROM}`, message: '' },
    })
    return
  }
  await useEmulatorStore.getState().importAndStart(new File([await response.blob()], DEV_ROM))
}

export const autoloadDisabled = () => new URLSearchParams(location.search).get('autoload') === '0'

// Runs the dev ROM on boot; opt out with ?autoload=0 to review the idle state.
export async function autoloadDevRom(): Promise<void> {
  if (autoloadAttempted) return
  autoloadAttempted = true
  if (autoloadDisabled()) {
    useDevAutoload.setState({ result: 'skipped' })
    return
  }
  const { storedRoms, start } = useEmulatorStore.getState()
  if (storedRoms.includes(DEV_ROM)) {
    start(DEV_ROM)
    useDevAutoload.setState({ result: 'started' })
    return
  }
  if (!isRom(await fetch(DEV_ROM_URL, { method: 'HEAD' }))) {
    console.info(`[dev] dev-roms/${DEV_ROM} no encontrado; autocarga omitida`)
    useDevAutoload.setState({ result: 'missing' })
    return
  }
  await loadDevRom()
  useDevAutoload.setState({ result: 'started' })
}
