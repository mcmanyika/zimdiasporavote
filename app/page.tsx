import type { Metadata } from 'next'
import DiasporaVoteLanding from './components/diaspora/DiasporaVoteLanding'

export const metadata: Metadata = {
  title: 'DiasporaVote! | Voting rights for Zimbabweans abroad',
  description: 'Join the movement for diaspora voting rights. Your voice matters.',
}

export default function Home() {
  return <DiasporaVoteLanding />
}
