import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'NTA',
}

export default function PartyLayout({ children }: { children: ReactNode }) {
  return children
}
