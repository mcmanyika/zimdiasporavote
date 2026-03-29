'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import DashboardNav from '@/app/components/DashboardNav'

export default function PartyLinkedDashboardShell({
  title,
  breadcrumbLabel,
  headerDescription,
  children,
  maxWidthClass = 'max-w-7xl',
}: {
  title: string
  breadcrumbLabel?: string
  headerDescription?: string
  children: ReactNode
  maxWidthClass?: string
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div
          className={`mx-auto flex ${maxWidthClass} flex-col gap-4 px-4 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6`}
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {headerDescription ? <p className="mt-1 text-sm text-slate-600">{headerDescription}</p> : null}
          </div>
          <Link
            href="/party"
            className="shrink-0 text-sm font-medium text-slate-600 hover:text-slate-900 sm:pt-1"
          >
            ← Back to Party Page
          </Link>
        </div>
      </div>
      <DashboardNav breadcrumbLabel={breadcrumbLabel ?? title} />
      <div className={`mx-auto ${maxWidthClass} space-y-6 px-4 py-8 sm:px-6`}>{children}</div>
    </div>
  )
}
