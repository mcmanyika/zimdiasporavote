'use client'

import Header from '../components/Header';
import Footer from '@/app/components/Footer'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">About Diaspora Vote</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Why Diaspora Vote</h1>
            <p className="text-sm text-slate-300 sm:text-base">Non partisan inclusive political organization</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
            {/* Left Column - Content */}
            <div className="animate-fade-in-up">
              <p className="mb-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                Zimbabwe's Constitution was adopted by the people to limit power, protect rights and guarantee democratic governance.
              </p>
              <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-900 sm:text-base">
                Today, that constitutional promise is under threat.
              </p>
              <p className="mb-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                The Diaspora Vote (DV) exists to ensure that Zimbabwe is governed according to its Constitution — not political convenience.
              </p>
              <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                Diaspora Vote is a non-partisan, inclusive national platform bringing together citizens from across political parties, civic movements and social bases to defend constitutional supremacy through lawful, peaceful and organised action.
              </p>
            </div>

            {/* Right Column - Image */}
            <div className="animate-fade-in-up animate-delay-200">
              <div className="overflow-hidden rounded-lg">
                <img
                  src="/images/hero.png"
                  alt="Diaspora Vote"
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Core Belief & Our Strength Section */}
      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Our Core Belief */}
            <div className="animate-fade-in-up rounded-lg bg-slate-50 p-4 sm:p-6">
              <h3 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">Our Core Belief</h3>
              <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                A Constitution adopted by the people cannot be amended, suspended or manipulated by elites acting in their own interests.
              </p>
            </div>

            {/* Our Strength */}
            <div className="animate-fade-in-up animate-delay-200">
              <h3 className="mb-4 text-lg font-bold text-slate-900 sm:text-xl">Our Strength</h3>
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700 sm:text-base">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-slate-900">•</span>
                  <span>We are rooted in real social bases — students, workers, communities, faith groups, liberation war veterans, women, youth, and the diaspora.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-slate-900">•</span>
                  <span>We are cross-party, bringing together members of different political parties, including those represented in Parliament.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-slate-900">•</span>
                  <span>We combine civic mobilisation with parliamentary action.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5 text-slate-900">•</span>
                  <span>We prioritise youth and student leadership as guardians of generational democracy.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What We Stand For & Our Campaign Section */}
      <section className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* What We Stand For */}
            <div className="animate-fade-in-up rounded-lg border-2 border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900 sm:text-xl">What We Stand For</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start">
                  <span className="mr-2 mt-0.5 text-slate-900">✓</span>
                  <span className="text-sm text-slate-700 sm:text-base">Constitutional term limits</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2 mt-0.5 text-slate-900">✓</span>
                  <span className="text-sm text-slate-700 sm:text-base">Regular, credible elections</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2 mt-0.5 text-slate-900">✓</span>
                  <span className="text-sm text-slate-700 sm:text-base">Full implementation of the Constitution</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2 mt-0.5 text-slate-900">✓</span>
                  <span className="text-sm text-slate-700 sm:text-base">Peaceful civic participation</span>
                </div>
                <div className="flex items-start sm:col-span-2">
                  <span className="mr-2 mt-0.5 text-slate-900">✓</span>
                  <span className="text-sm text-slate-700 sm:text-base">National unity grounded in law</span>
                </div>
              </div>
            </div>

            {/* Our Campaign */}
            <div className="animate-fade-in-up animate-delay-200 rounded-lg bg-slate-900 p-4 text-white sm:p-6">
              <h3 className="mb-3 text-lg font-bold sm:text-xl">Our Campaign</h3>
              <p className="mb-3 text-sm leading-relaxed text-slate-200 sm:text-base">
                The People's Resolution is a citizen-led constitutional campaign that will be taken to the streets, communities, workplaces, campuses, farms and places of worship across Zimbabwe.
              </p>
              <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
                <strong>Diaspora Vote is not about replacing parties or competing for power.</strong>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base">
                <strong>It is about defending the rules that govern power.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

