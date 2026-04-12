'use client'

import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Terms of Service</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Last updated: February 21, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="prose prose-slate max-w-none space-y-8">

            {/* Introduction */}
            <div>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Welcome to the Diaspora Vote (&quot;DV&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By
                accessing or using our website at{' '}
                <a href="https://diasporavote.org" className="text-blue-600 hover:underline">diasporavote.org</a>{' '}
                and related services (collectively, the &quot;Platform&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use the Platform.
              </p>
            </div>

            {/* Section 1 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">1. About the Platform</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Diaspora Vote is a non-partisan, inclusive civic organisation dedicated to
                defending Zimbabwe&apos;s Constitution, promoting citizen participation, and opposing unconstitutional
                amendments. The Platform provides tools for civic education, petitions, membership, volunteering,
                donations, and community engagement.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">2. Eligibility</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                You must be at least 18 years of age to create an account, submit applications, sign petitions, or
                make donations on the Platform. By using the Platform, you represent and warrant that you meet this
                age requirement and have the legal capacity to enter into these terms.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">3. Account Registration</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                To access certain features of the Platform, you may need to create an account. When registering, you agree to:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-sm text-slate-600 sm:text-base">
                <li>Provide accurate, current, and complete information.</li>
                <li>Maintain the security and confidentiality of your login credentials.</li>
                <li>Accept responsibility for all activities that occur under your account.</li>
                <li>Notify us immediately of any unauthorised use of your account.</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                We reserve the right to suspend or terminate accounts that violate these terms or engage in harmful conduct.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">4. Membership</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Membership applications are subject to review and approval by DV. Membership contributions of $5 per
                month or $60 per year support our civic education, mobilisation, petition outreach, and constitutional
                defence work. Membership may be revoked if a member engages in conduct that is inconsistent with
                DV&apos;s values, mission, or these terms.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">5. Volunteering</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Volunteer applications are subject to review and approval. Volunteers are expected to act in good
                faith, represent DV respectfully, and adhere to any guidelines or instructions provided. DV reserves
                the right to decline or revoke volunteer status at its discretion.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">6. Petitions</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                By signing a petition on the Platform, you confirm that your identity and information are accurate.
                Petition signatures are used to demonstrate civic engagement and may be presented to relevant
                authorities or institutions. Your name and province may be displayed publicly alongside the petition
                as a signatory.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">7. Donations and Payments</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Donations made through the Platform are processed securely via Stripe. By making a donation, you agree that:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-sm text-slate-600 sm:text-base">
                <li>All donations are voluntary and made at your own discretion.</li>
                <li>Donations are non-refundable unless required by law or at DV&apos;s sole discretion.</li>
                <li>Funds will be used to support DV&apos;s mission, programmes, and operational costs.</li>
                <li>You are authorised to use the payment method provided.</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Product purchases through our shop are also processed via Stripe and are subject to stock availability.
              </p>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">8. User Conduct</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                When using the Platform, you agree not to:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-sm text-slate-600 sm:text-base">
                <li>Use the Platform for any unlawful purpose or in violation of any applicable laws.</li>
                <li>Submit false, misleading, or fraudulent information.</li>
                <li>Attempt to gain unauthorised access to any part of the Platform or its systems.</li>
                <li>Engage in harassment, hate speech, or any conduct that undermines the dignity of others.</li>
                <li>Distribute spam, malware, or any harmful content through the Platform.</li>
                <li>Impersonate any person or misrepresent your affiliation with any entity.</li>
                <li>Use the Platform to promote violence, incite hatred, or undermine constitutional governance.</li>
              </ul>
            </div>

            {/* Section 9 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">9. Intellectual Property</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                All content on the Platform, including text, graphics, logos, images, and software, is the property
                of DV or its content providers and is protected by applicable intellectual property laws. You may not
                reproduce, distribute, modify, or create derivative works from any content on the Platform without
                prior written consent from DV.
              </p>
            </div>

            {/* Section 10 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">10. Third-Party Links and Services</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                The Platform may contain links to third-party websites or services (such as social media platforms,
                payment processors, and external resources). DV is not responsible for the content, privacy
                practices, or availability of these external sites. Use of third-party services is at your own risk
                and subject to their respective terms and conditions.
              </p>
            </div>

            {/* Section 11 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">11. Disclaimer of Warranties</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. DV makes no warranties, express
                or implied, regarding the Platform&apos;s reliability, accuracy, availability, or fitness for a particular
                purpose. We do not guarantee that the Platform will be uninterrupted, error-free, or free from
                viruses or other harmful components.
              </p>
            </div>

            {/* Section 12 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">12. Limitation of Liability</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                To the fullest extent permitted by law, DV and its directors, officers, volunteers, and affiliates
                shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising
                from your use of or inability to use the Platform, including but not limited to loss of data, revenue,
                or goodwill.
              </p>
            </div>

            {/* Section 13 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">13. Indemnification</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                You agree to indemnify and hold harmless DV, its directors, officers, volunteers, and affiliates
                from any claims, damages, losses, or expenses (including legal fees) arising from your use of the
                Platform, your violation of these terms, or your infringement of any rights of another party.
              </p>
            </div>

            {/* Section 14 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">14. Termination</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                We reserve the right to suspend or terminate your access to the Platform at any time, with or without
                notice, for conduct that we believe violates these terms or is harmful to other users, DV, or third
                parties. Upon termination, your right to use the Platform will immediately cease.
              </p>
            </div>

            {/* Section 15 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">15. Changes to These Terms</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                We may update these Terms of Service from time to time. Changes will be posted on this page with a
                revised &quot;Last updated&quot; date. Your continued use of the Platform after any changes constitutes
                acceptance of the revised terms. We encourage you to review these terms periodically.
              </p>
            </div>

            {/* Section 16 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">16. Governing Law</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                These Terms of Service shall be governed by and construed in accordance with the laws of Zimbabwe.
                Any disputes arising from these terms or your use of the Platform shall be subject to the exclusive
                jurisdiction of the courts of Zimbabwe.
              </p>
            </div>

            {/* Section 17 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">17. Contact Us</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                If you have any questions or concerns about these Terms of Service, please contact us:
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:text-base">
                <p className="font-semibold">Diaspora Vote (DV)</p>
                <p className="mt-1">
                  Email:{' '}
                  <a href="mailto:contact@diasporavote.org" className="text-blue-600 hover:underline">contact@diasporavote.org</a>
                </p>
                <p className="mt-1">
                  Website:{' '}
                  <a href="https://diasporavote.org" className="text-blue-600 hover:underline">diasporavote.org</a>
                </p>
              </div>
            </div>

            {/* Related */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Please also review our{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</Link>{' '}
                to understand how we collect, use, and protect your personal information.
              </p>
            </div>

          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  )
}
