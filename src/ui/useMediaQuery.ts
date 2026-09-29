import { useSyncExternalStore } from 'react'

// Portrait phones: the app becomes a handheld. Mirrors the `handheld` variant in index.css.
export const HANDHELD_QUERY = '(hover: none) and (pointer: coarse) and (width < 64rem) and (orientation: portrait)'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
