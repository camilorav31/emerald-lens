import { describe, expect, it } from 'vitest'
import { emeraldSpriteUrl, showdownSlug, showdownSpriteUrl } from './spriteResolver'

describe('showdownSlug', () => {
  it('produces a well-formed, unique slug for all 386 Gen 3 Pokémon', () => {
    const slugs = Array.from({ length: 386 }, (_, i) => showdownSlug(i + 1))
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+$/)
    expect(new Set(slugs).size).toBe(386)
  })

  it('handles names with punctuation, symbols and digits', () => {
    expect(showdownSlug(29)).toBe('nidoranf')
    expect(showdownSlug(32)).toBe('nidoranm')
    expect(showdownSlug(83)).toBe('farfetchd')
    expect(showdownSlug(122)).toBe('mrmime')
    expect(showdownSlug(233)).toBe('porygon2')
    expect(showdownSlug(250)).toBe('hooh')
  })

  it('maps Unown letters, where A is the bare slug', () => {
    expect(showdownSlug(201, { unownForm: 0 })).toBe('unown')
    expect(showdownSlug(201, { unownForm: 1 })).toBe('unown-b')
    expect(showdownSlug(201, { unownForm: 25 })).toBe('unown-z')
    expect(showdownSlug(201, { unownForm: 26 })).toBe('unown-exclamation')
    expect(showdownSlug(201, { unownForm: 27 })).toBe('unown-question')
  })

  it('maps Deoxys and Castform forms, and ignores forms on other species', () => {
    expect(showdownSlug(386, { deoxysForm: 'speed' })).toBe('deoxys-speed')
    expect(showdownSlug(386, { deoxysForm: 'normal' })).toBe('deoxys')
    expect(showdownSlug(351, { castformForm: 'rainy' })).toBe('castform-rainy')
    expect(showdownSlug(351)).toBe('castform')
    expect(showdownSlug(25, { unownForm: 5, deoxysForm: 'attack' })).toBe('pikachu')
  })

  it('rejects numbers outside Gen 3', () => {
    expect(() => showdownSlug(0)).toThrow()
    expect(() => showdownSlug(387)).toThrow()
  })
})

describe('sprite urls', () => {
  it('builds proxied Showdown paths for each set', () => {
    expect(showdownSpriteUrl(258)).toBe('/sprites/showdown/gen5ani/mudkip.gif')
    expect(showdownSpriteUrl(258, { shiny: true })).toBe('/sprites/showdown/gen5ani-shiny/mudkip.gif')
    expect(showdownSpriteUrl(386, { set: 'ani', deoxysForm: 'speed' })).toBe('/sprites/showdown/ani/deoxys-speed.gif')
  })

  it('builds the jsDelivr Emerald fallback', () => {
    expect(emeraldSpriteUrl(258)).toMatch(/generation-iii\/emerald\/258\.png$/)
    expect(emeraldSpriteUrl(258, true)).toMatch(/generation-iii\/emerald\/shiny\/258\.png$/)
  })
})
