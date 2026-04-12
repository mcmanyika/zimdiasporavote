'use client'

import Header from '../components/Header';
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'

export default function OurWorkPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Our Work</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">What We Do</h1>
            <p className="mx-auto max-w-3xl text-sm text-slate-300 sm:text-base">
              Through education, advocacy, and community engagement, we work to defend constitutional supremacy and promote democratic governance.
            </p>
          </div>
        </div>
      </section>


      {/* Additional Content Section */}
      <section className="bg-slate-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl md:text-4xl">Our Approach</h2>
            <div className="space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
              <p>
                The Diaspora Vote (DV) employs a multi-faceted approach to protect and promote constitutional governance in Zimbabwe. Our work is grounded in the belief that an informed and engaged citizenry is essential for democratic accountability.
              </p>
              <p>
                Through our comprehensive programs, we aim to empower citizens with knowledge, provide platforms for collective action, and advocate for policies that uphold the principles enshrined in our Constitution.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  );
}


