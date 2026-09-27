import { create } from 'zustand'
import { useEmulatorStore } from '../store/emulatorStore'

// Dev-only: only imported behind import.meta.env.DEV, so none of this reaches the production bundle.
const DEV_ROM = 'emerald.gba'
const DEV_ROM_URL = `/dev-roms/${DEV_ROM}`

let autoloadAttempted = false

export const useDevAutoload = create<{ result: 'loaded' | 'stored' | 'missing' | 'skipped' | null }>(() => ({ result: null }))

// Vite's SPA fallback answers 200 text/html for missing files
const isRom = (response: Response) => response.ok && !response.headers.get('content-type')?.includes('text/html')

export const autoloadDisabled = () => new URLSearchParams(location.search).get('autoload') === '0'

// Once the core is ready and no cartridge is stored yet, insert dev-roms/emerald.gba the same way a
// visitor would (so it goes through validation). Opt out with ?autoload=0 to review the idle state.
export async function autoloadDevRom(): Promise<void> {
  if (autoloadAttempted) return
  autoloadAttempted = true
  const { status, insertFile } = useEmulatorStore.getState()
  if (status !== 'idle') {
    useDevAutoload.setState({ result: 'stored' })
    return
  }
  if (autoloadDisabled()) {
    useDevAutoload.setState({ result: 'skipped' })
    return
  }
  const response = await fetch(DEV_ROM_URL)
  if (!isRom(response)) {
    console.info(`[dev] dev-roms/${DEV_ROM} no encontrado; autocarga omitida`)
    useDevAutoload.setState({ result: 'missing' })
    return
  }
  await insertFile(new File([await response.blob()], DEV_ROM))
  useDevAutoload.setState({ result: 'loaded' })
}
