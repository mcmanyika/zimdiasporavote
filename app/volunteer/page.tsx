'use client'

import ProtectedRoute from '@/app/components/ProtectedRoute'
import PartyLinkedDashboardShell from '@/app/components/PartyLinkedDashboardShell'
import VolunteerApplicationForm from '@/app/components/VolunteerApplicationForm'

export default function VolunteerPage() {
  return (
    <ProtectedRoute>
      <PartyLinkedDashboardShell
        title="Volunteer Network"
        breadcrumbLabel="Volunteer"
        headerDescription="Apply to volunteer with the Diaspora Vote."
      >
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <VolunteerApplicationForm />
        </section>
      </PartyLinkedDashboardShell>
    </ProtectedRoute>
  )
}
