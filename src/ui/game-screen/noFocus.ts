import type { PointerEvent } from 'react'

// Game controls never take focus: moving it off the game screen would make the core drop every held button
export const noFocus = (e: PointerEvent) => e.preventDefault()
