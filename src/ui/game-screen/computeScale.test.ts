import { describe, expect, it } from 'vitest'
import { computeScale, type ScaleMode } from './computeScale'

type Case = [availW: number, availH: number, dpr: number, mode: ScaleMode | undefined, expected: Partial<ReturnType<typeof computeScale>>]

// Available sizes are the viewport minus shell and device chrome for common screens.
const cases: Case[] = [
  [978, 694, 1, undefined, { mode: 'integer', dev: 4, cssW: 960, cssH: 640 }], // 1440x900
  [904, 562, 1, undefined, { mode: 'integer', dev: 3 }], // 1366x768
  [818, 514, 1, undefined, { mode: 'integer', dev: 3 }], // 1280x720
  [1074, 658, 1.25, undefined, { mode: 'integer', dev: 5, cssW: 960, cssH: 640 }], // 1536x864 @125%
  [978, 694, 2, undefined, { mode: 'integer', dev: 8, physW: 1920, physH: 1280 }], // 1440x900 @2
  [574, 570, 1, undefined, { mode: 'integer', dev: 2 }], // 1024x768
  [1398, 866, 1, undefined, { mode: 'integer', dev: 5 }], // 1920x1080
  [1878, 1226, 1, undefined, { mode: 'integer', dev: 7 }], // 2560x1440
  [342, 616, 3, undefined, { mode: 'integer', dev: 4 }], // 390x844 @3
  [382, 704, 3, undefined, { mode: 'integer', dev: 4 }], // 430x932 @3
  [364, 687, 2.625, undefined, { mode: 'fit', physW: 955, physH: 637 }], // 412x915
  [327, 439, 2, undefined, { mode: 'fit', physW: 654, physH: 436 }], // 375x667
  [312, 572, 3, undefined, { mode: 'fit', physW: 936, physH: 624 }], // 360x800
  [327, 439, 2, 'integer', { mode: 'integer', dev: 2, cssW: 240, cssH: 160 }],
  [978, 694, 1, 'fit', { mode: 'fit', physW: 978, physH: 652 }],
  [5000, 5000, 1, undefined, { mode: 'integer', dev: 8, cssW: 1920, cssH: 1280 }], // capped at 8x
]

describe('computeScale', () => {
  it.each(cases)('(%d, %d, dpr %d, %s)', (w, h, dpr, mode, expected) => {
    expect(computeScale(w, h, dpr, mode)).toMatchObject(expected)
  })

  it('asks a compact layout for a tighter integer fit', () => {
    // 430x932 @3: the 4x integer size would be 84% of the fit, so fit wins at fill 0.9 but integer wins at the default
    expect(computeScale(382, 704, 3, 'auto', 0.9)).toMatchObject({ mode: 'fit', physW: 1146, physH: 764 })
    expect(computeScale(382, 704, 3)).toMatchObject({ mode: 'integer', dev: 4 })
    // 390x844 @3: 94% of the fit, stays integer
    expect(computeScale(342, 616, 3, 'auto', 0.9)).toMatchObject({ mode: 'integer', dev: 4 })
  })

  it('keeps 1280x720 @150% integer at 4 device px per GBA px', () => {
    const r = computeScale(818, 514, 1.5)
    expect(r).toMatchObject({ mode: 'integer', dev: 4, physW: 960, physH: 640 })
    expect(r.cssH).toBeCloseTo(426.67, 2)
  })

  it('never exceeds the available space', () => {
    for (const dpr of [1, 1.25, 1.5, 2, 2.625, 3]) {
      for (let w = 120; w <= 2000; w += 37) {
        for (let h = 80; h <= 1400; h += 41) {
          for (const mode of ['auto', 'integer', 'fit'] as const) {
            const r = computeScale(w, h, dpr, mode)
            if (r.mode === 'integer' && r.dev < 1) throw new Error('integer below 1x')
            if (r.mode === 'fit' || r.dev >= 1) {
              expect(r.cssW).toBeLessThanOrEqual(w + 1e-6)
              expect(r.cssH).toBeLessThanOrEqual(h + 1e-6)
            }
          }
        }
      }
    }
  })
})
