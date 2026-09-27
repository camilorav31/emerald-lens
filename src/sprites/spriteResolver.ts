import { SHOWDOWN_SLUGS } from '../memory/gen3/tables'

export type SpriteSet = 'gen5ani' | 'ani'

const UNOWN = 201
const CASTFORM = 351
const DEOXYS = 386
const UNOWN_LETTERS = 'abcdefghijklmnopqrstuvwxyz'

export interface SpriteForm {
  // 0..27 from the personality value (A..Z, !, ?)
  unownForm?: number
  // Emerald loads Deoxys' Speed Forme outside link battles (pokemon.c: sDeoxysBaseStats, ShouldIgnoreDeoxysForm)
  deoxysForm?: 'normal' | 'attack' | 'defense' | 'speed'
  // Castform only changes form inside battle, so the party always shows the base form
  castformForm?: 'normal' | 'sunny' | 'rainy' | 'snowy'
}

// Showdown sprite ids are its pokedex ids: lowercase alphanumerics ("Mr. Mime" -> mrmime), plus "-form"
export function showdownSlug(dex: number, form: SpriteForm = {}): string {
  const base = SHOWDOWN_SLUGS[dex]
  if (!base) throw new Error(`No Showdown sprite for national #${dex}`)
  if (dex === UNOWN && form.unownForm !== undefined && form.unownForm > 0) {
    const letter = form.unownForm === 26 ? 'exclamation' : form.unownForm === 27 ? 'question' : UNOWN_LETTERS[form.unownForm]
    return `${base}-${letter}`
  }
  if (dex === DEOXYS && form.deoxysForm && form.deoxysForm !== 'normal') return `${base}-${form.deoxysForm}`
  if (dex === CASTFORM && form.castformForm && form.castformForm !== 'normal') return `${base}-${form.castformForm}`
  return base
}

// Showdown sends no CORS/CORP headers, so under COEP require-corp it must be same-origin:
// /sprites/showdown is proxied by Vite (dev/preview), vercel.json and public/_redirects (Netlify).
export function showdownSpriteUrl(dex: number, { shiny = false, set = 'gen5ani', ...form }: SpriteForm & { shiny?: boolean; set?: SpriteSet } = {}) {
  return `/sprites/showdown/${set}${shiny ? '-shiny' : ''}/${showdownSlug(dex, form)}.gif`
}

// Fallback: PokeAPI's Emerald sprites on jsDelivr (CORS + CORP headers, 64x64)
export function emeraldSpriteUrl(dex: number, shiny = false) {
  return `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/versions/generation-iii/emerald/${shiny ? 'shiny/' : ''}${dex}.png`
}
