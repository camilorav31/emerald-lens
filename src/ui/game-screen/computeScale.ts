export const GBA_W = 240
export const GBA_H = 160
const MAX_CSS = 8
const FILL = 0.8
const EPS = 1e-6

export type ScaleMode = 'auto' | 'integer' | 'fit'

export interface ScaleResult {
  mode: 'integer' | 'fit'
  // device pixels per GBA pixel (fractional in fit mode)
  dev: number
  cssW: number
  cssH: number
  physW: number
  physH: number
}

// Integer multiples are counted in device pixels so HiDPI screens stay pixel-perfect.
// Auto only falls back to a fractional fit when the integer size would waste too much space.
// `fill` is how much of the fractional fit an integer size must reach; compact layouts ask for more so a
// dpr-3 phone does not leave 20-30px of bezel on each side.
export function computeScale(availW: number, availH: number, dpr: number, mode: ScaleMode = 'auto', fill = FILL): ScaleResult {
  const fitCss = Math.max(0, Math.min(availW / GBA_W, availH / GBA_H))
  const k = Math.min(Math.floor(fitCss * dpr + EPS), Math.floor(MAX_CSS * dpr + EPS))
  const intCss = k / dpr
  const useInt =
    mode === 'integer' ? k >= 1 : mode === 'fit' ? false : k >= 1 && (intCss >= 2 || intCss / fitCss >= fill)

  if (useInt) {
    return { mode: 'integer', dev: k, cssW: (GBA_W * k) / dpr, cssH: (GBA_H * k) / dpr, physW: GBA_W * k, physH: GBA_H * k }
  }
  const physW = Math.max(1, Math.floor(GBA_W * Math.min(fitCss, MAX_CSS) * dpr + EPS))
  const physH = Math.min(Math.round((physW * 2) / 3), Math.floor(availH * dpr + EPS))
  return { mode: 'fit', dev: physW / GBA_W, cssW: physW / dpr, cssH: physH / dpr, physW, physH }
}
