export interface DeviceChrome {
  border: number
  bezelX: number
  bezelTop: number
  wellPad: number
  chin: number
}

// Single source of truth for the frame around the screen; CSS reads these as custom properties.
export const REGULAR_CHROME: DeviceChrome = { border: 1, bezelX: 16, bezelTop: 16, wellPad: 6, chin: 40 }
export const COMPACT_CHROME: DeviceChrome = { border: 1, bezelX: 8, bezelTop: 8, wellPad: 3, chin: 32 }

export function chromeSize(c: DeviceChrome): { w: number; h: number } {
  return {
    w: 2 * c.border + 2 * c.bezelX + 2 * c.wellPad,
    h: 2 * c.border + c.bezelTop + 2 * c.wellPad + c.chin,
  }
}
