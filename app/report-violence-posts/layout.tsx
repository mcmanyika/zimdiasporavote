import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Report violence on X',
  description: 'Submit links to posts about instigators of violence for review.',
}

export default function ReportViolencePostsLayout({ children }: { children: ReactNode }) {
  return children
}
