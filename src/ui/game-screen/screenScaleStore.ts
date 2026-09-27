import { create } from 'zustand'
import type { ScreenScale } from './useIntegerScale'

const INITIAL: ScreenScale = { mode: 'integer', dev: 1, cssW: 240, cssH: 160, physW: 240, physH: 160, dpr: 1, measured: false }

export const useScreenScale = create<{ scale: ScreenScale }>(() => ({ scale: INITIAL }))
