import type { Metadata } from 'next'
import DiasporaVoteLanding from './components/diaspora/DiasporaVoteLanding'
import { SITE_NAME } from '@/lib/branding'

export const metadata: Metadata = {
  title: `${SITE_NAME} | Voting rights for Zimbabweans abroad`,
  description: 'Join the movement for diaspora voting rights. Your voice matters.',
}

export default function Home() {
  return <DiasporaVoteLanding />
}
