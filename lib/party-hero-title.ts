/** Legacy hero headline from CMS before rebrand. */
export const LEGACY_PARTY_HERO_TITLE = 'A New Political Party Rooted in Constitutionalism'

export const PARTY_HERO_TITLE_DEFAULT = 'National Transition Authority'

export function normalizePartyHeroTitle(raw: string | undefined): string {
  const t = (raw ?? '').trim()
  if (!t || t === LEGACY_PARTY_HERO_TITLE) return PARTY_HERO_TITLE_DEFAULT
  return t
}
