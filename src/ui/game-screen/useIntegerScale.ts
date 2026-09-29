import { useLayoutEffect, useState, type RefObject } from 'react'
import { computeScale, GBA_W, type ScaleMode, type ScaleResult } from './computeScale'
import { chromeSize, COMPACT_CHROME, REGULAR_CHROME } from './deviceChrome'

export interface ScreenScale extends ScaleResult {
  dpr: number
  measured: boolean
}

const INITIAL: ScreenScale = { mode: 'integer', dev: 1, cssW: 240, cssH: 160, physW: 240, physH: 160, dpr: 1, measured: false }
const COMPACT_QUERY = '(width < 48rem)'
// Compact screens are small enough that a fractional scale is worth a bigger picture (LCD/CRT need integer)
const COMPACT_FILL = 0.9

interface Refs {
  probe: RefObject<HTMLElement | null>
  device: RefObject<HTMLElement | null>
  lens: RefObject<HTMLElement | null>
}

// Measures the probe (never the device itself, so there is no feedback loop), writes the
// screen and chrome sizes as CSS variables before paint, and snaps the lens to whole device pixels.
export function useIntegerScale({ probe, device, lens }: Refs, scaleMode: ScaleMode): ScreenScale {
  const [scale, setScale] = useState<ScreenScale>(INITIAL)

  useLayoutEffect(() => {
    const probeEl = probe.current
    const deviceEl = device.current
    if (!probeEl || !deviceEl) return

    const update = () => {
      const dpr = window.devicePixelRatio || 1
      const compact = window.matchMedia(COMPACT_QUERY).matches
      const chrome = compact ? COMPACT_CHROME : REGULAR_CHROME
      const { w: chromeW, h: chromeH } = chromeSize(chrome)
      const rect = probeEl.getBoundingClientRect()
      const result = computeScale(rect.width - chromeW, rect.height - chromeH, dpr, scaleMode, compact ? COMPACT_FILL : undefined)

      const style = deviceEl.style
      style.setProperty('--screen-w', `${result.cssW}px`)
      style.setProperty('--screen-h', `${result.cssH}px`)
      style.setProperty('--gba-px', `${result.cssW / GBA_W}px`)
      style.setProperty('--hair', `${1 / dpr}px`)
      style.setProperty('--scan', `${Math.max(1, Math.floor(result.dev / 3)) / dpr}px`)
      style.setProperty('--bezel-x', `${chrome.bezelX}px`)
      style.setProperty('--bezel-top', `${chrome.bezelTop}px`)
      style.setProperty('--well-pad', `${chrome.wellPad}px`)
      style.setProperty('--chin-h', `${chrome.chin}px`)

      // Centering can land the lens on a fractional device pixel; nudge it onto the grid
      style.translate = '0px 0px'
      const lensRect = lens.current?.getBoundingClientRect()
      if (lensRect) {
        const x = lensRect.left + window.scrollX
        const y = lensRect.top + window.scrollY
        style.translate = `${Math.round(x * dpr) / dpr - x}px ${Math.round(y * dpr) / dpr - y}px`
      }

      setScale((prev) =>
        prev.measured && prev.cssW === result.cssW && prev.cssH === result.cssH && prev.dpr === dpr && prev.mode === result.mode
          ? prev
          : { ...result, dpr, measured: true },
      )
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(probeEl)

    // devicePixelRatio changes (browser zoom, another monitor) need a query re-armed for each new value
    let dprQuery: MediaQueryList | null = null
    const armDpr = () => {
      dprQuery?.removeEventListener('change', onDpr)
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      dprQuery.addEventListener('change', onDpr)
    }
    const onDpr = () => {
      armDpr()
      update()
    }
    armDpr()
    const compact = window.matchMedia(COMPACT_QUERY)
    compact.addEventListener('change', update)
    void document.fonts?.ready.then(update)

    return () => {
      observer.disconnect()
      dprQuery?.removeEventListener('change', onDpr)
      compact.removeEventListener('change', update)
    }
  }, [probe, device, lens, scaleMode])

  return scale
}

export const lcdAvailable = (s: ScaleResult) => s.mode === 'integer' && s.dev >= 3
export const crtAvailable = (s: ScaleResult) => s.mode === 'integer' && s.dev >= 2
