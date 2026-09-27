import { useEffect, useState } from 'react'
import { ITEM_SLUGS } from '../memory/gen3/tables'
import { getItem, getMove, getSpecies, type ItemData, type MoveData, type SpeciesData } from './pokeapi'

// Resolved values stay in memory so re-renders and remounts never flash a loading state
const resolved = new Map<string, unknown>()

function useResource<T>(key: string | null, load: () => Promise<T>): T | null {
  const [, force] = useState(0)
  useEffect(() => {
    if (!key || resolved.has(key)) return
    let alive = true
    load().then(
      (value) => {
        resolved.set(key, value)
        if (alive) force((n) => n + 1)
      },
      () => {
        /* offline and never cached: the UI keeps its fallback labels */
      },
    )
    return () => {
      alive = false
    }
  }, [key]) // load is derived from key
  return key ? ((resolved.get(key) as T | undefined) ?? null) : null
}

export const useSpecies = (dex: number | null): SpeciesData | null =>
  useResource(dex ? `species:${dex}` : null, () => getSpecies(dex!))

export const useMove = (id: number | null): MoveData | null => useResource(id ? `move:${id}` : null, () => getMove(id!))

export function useItem(index: number): ItemData | null {
  const slug = index ? ITEM_SLUGS[index] : null
  return useResource(slug ? `item:${slug}` : null, () => getItem(slug!))
}
