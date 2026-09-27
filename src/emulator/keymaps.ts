export type ControlScheme = 'arrows' | 'wasd'
export type GbaButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'l' | 'r' | 'start' | 'select'

export interface KeyBinding {
  // SDL key name passed to the core's bindKey (SDL_GetKeyFromName)
  sdl: string
  // KeyboardEvent.key the UI listens for (lowercased for letters)
  key: string
}

// mGBA keeps one key per button (mInputBindKey unbinds the old one), so a scheme remaps all ten.
// F (hold: fast-forward) and R (hold: rewind) are hardwired in the core and stay free in both schemes.
export const KEYMAPS: Record<ControlScheme, Record<GbaButton, KeyBinding>> = {
  arrows: {
    up: { sdl: 'Up', key: 'ArrowUp' },
    down: { sdl: 'Down', key: 'ArrowDown' },
    left: { sdl: 'Left', key: 'ArrowLeft' },
    right: { sdl: 'Right', key: 'ArrowRight' },
    a: { sdl: 'X', key: 'x' },
    b: { sdl: 'Z', key: 'z' },
    l: { sdl: 'A', key: 'a' },
    r: { sdl: 'S', key: 's' },
    start: { sdl: 'Return', key: 'Enter' },
    select: { sdl: 'Backspace', key: 'Backspace' },
  },
  wasd: {
    up: { sdl: 'W', key: 'w' },
    down: { sdl: 'S', key: 's' },
    left: { sdl: 'A', key: 'a' },
    right: { sdl: 'D', key: 'd' },
    a: { sdl: 'K', key: 'k' },
    b: { sdl: 'J', key: 'j' },
    l: { sdl: 'Q', key: 'q' },
    r: { sdl: 'E', key: 'e' },
    start: { sdl: 'Return', key: 'Enter' },
    select: { sdl: 'Backspace', key: 'Backspace' },
  },
}

export const SCHEME_LABELS: Record<ControlScheme, string> = { arrows: 'Flechas', wasd: 'WASD' }
