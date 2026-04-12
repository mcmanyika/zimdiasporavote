/** Categories for public reports linking to posts about instigators of violence. */
export const VIOLENCE_INSTIGATOR_CATEGORIES = [
  'Human rights violation',
  'Abduction',
  'Unlawful arrest',
  'Assault',
  'Threats or intimidation',
  'Property damage',
  'Other',
] as const

export type ViolenceInstigatorCategory = (typeof VIOLENCE_INSTIGATOR_CATEGORIES)[number]

const categorySet = new Set<string>(VIOLENCE_INSTIGATOR_CATEGORIES)

export function isViolenceInstigatorCategory(value: string): value is ViolenceInstigatorCategory {
  return categorySet.has(value)
}

export function isValidInstigatorTweetUrl(url: string): boolean {
  const u = url.trim().toLowerCase()
  return (
    u.startsWith('https://twitter.com/') ||
    u.startsWith('https://x.com/') ||
    u.startsWith('http://twitter.com/') ||
    u.startsWith('http://x.com/')
  )
}

export function normalizeInstigatorTweetUrl(url: string): string {
  const t = url.trim()
  if (t.toLowerCase().startsWith('http://')) {
    return `https://${t.slice('http://'.length)}`
  }
  return t
}
