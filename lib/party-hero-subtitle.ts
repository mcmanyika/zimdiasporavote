/** Party landing hero subtitle: legacy CMS copy is normalized on read. */
export const LEGACY_PARTY_HERO_SUBTITLE =
  'This initiative seeks to transform constitutional advocacy into an accountable, democratic political platform.'

export const PARTY_HERO_SUBTITLE =
  'This initiative aims to bring people together to share ideas, skills, and strategies that can help transform Zimbabwe into a world-class economy.'

export function normalizePartyHeroSubtitle(raw: string | undefined): string {
  const t = (raw ?? '').trim()
  if (t === LEGACY_PARTY_HERO_SUBTITLE) return PARTY_HERO_SUBTITLE
  return t
}
