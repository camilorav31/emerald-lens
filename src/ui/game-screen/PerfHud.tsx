import { useEffect, useState } from 'react'
import { usePerfStore } from '../../store/partyStore'
import { useSettingsStore } from '../../store/settingsStore'

interface MemoryUsage {
  bytes: number
  // "page": whole page incl. the 256 MB wasm heap (measureUserAgentSpecificMemory); "js": JS heap only
  scope: 'page' | 'js'
}

type MeasurablePerformance = Performance & {
  measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }>
  memory?: { usedJSHeapSize: number }
}

const MEMORY_INTERVAL_MS = 5000
let pageMeasureUnavailable = false

function useMemoryUsage(enabled: boolean): MemoryUsage | null {
  const [usage, setUsage] = useState<MemoryUsage | null>(null)
  useEffect(() => {
    if (!enabled) return
    const perf = performance as MeasurablePerformance
    let alive = true
    let inFlight = false
    const sample = async () => {
      if (inFlight) return
      inFlight = true
      try {
        // Needs cross-origin isolation (always on here); some Chromium builds (e.g. Electron) expose it but throw
        if (perf.measureUserAgentSpecificMemory && window.crossOriginIsolated && !pageMeasureUnavailable) {
          try {
            const { bytes } = await perf.measureUserAgentSpecificMemory()
            if (alive) setUsage({ bytes, scope: 'page' })
            return
          } catch (error) {
            if (error instanceof DOMException && error.name === 'SecurityError') pageMeasureUnavailable = true
            else return
          }
        }
        if (perf.memory && alive) setUsage({ bytes: perf.memory.usedJSHeapSize, scope: 'js' })
      } finally {
        inFlight = false
      }
    }
    void sample()
    const timer = setInterval(sample, MEMORY_INTERVAL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [enabled])
  return enabled ? usage : null
}

const mb = (bytes: number) => `${Math.round(bytes / 1048576)} MB`

export function PerfHud() {
  const enabled = useSettingsStore((s) => s.perfMonitor)
  const fastForward = useSettingsStore((s) => s.fastForward)
  const { emuFps, captureMs } = usePerfStore()
  const memory = useMemoryUsage(enabled)
  if (!enabled) return null

  const target = fastForward ? 120 : 60
  const healthy = emuFps !== null && emuFps >= target * 0.95

  return (
    <p className="perf-hud num flex items-center gap-2 font-mono text-[11px] whitespace-nowrap text-fg-2" aria-live="off">
      <span title="Cuadros emulados por segundo, medidos con el contador de VBlank del propio juego">
        <span className={healthy ? 'text-accent-hi' : emuFps === null ? '' : 'text-warn-fg'}>{emuFps === null ? '—' : emuFps.toFixed(1)}</span> FPS
      </span>
      <span aria-hidden="true">·</span>
      <span title={memory?.scope === 'js' ? 'Heap de JavaScript (sin el heap de WebAssembly)' : 'Memoria total de la página, incluido el heap de WebAssembly'}>
        {memory ? `${mb(memory.bytes)}${memory.scope === 'js' ? ' JS' : ''}` : '— MB'}
      </span>
      <span aria-hidden="true">·</span>
      <span title="Tiempo de la última lectura de memoria del juego">{captureMs === null ? '—' : `${Math.round(captureMs)} ms`}</span>
    </p>
  )
}
