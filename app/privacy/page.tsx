'use client'

import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import CTASection from '@/app/components/CTASection'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Privacy Policy</h1>
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
                Diaspora Vote (&quot;DV&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to
                protecting and respecting your privacy. This Privacy Policy explains how we collect, use, store, and
                protect your personal information when you use our website at{' '}
                <a href="https://diasporavote.org" className="text-blue-600 hover:underline">diasporavote.org</a> and
                related services.
              </p>
            </div>

            {/* Section 1 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">1. Information We Collect</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                We may collect and process the following personal information:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-sm text-slate-600 sm:text-base">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account or sign in with Google.</li>
                <li><strong>Membership Applications:</strong> Full name, email, phone number, national ID number, province, and other details submitted through membership application forms.</li>
                <li><strong>Volunteer Applications:</strong> Name, email, phone number, skills, availability, and motivation provided when applying to volunteer.</li>
                <li><strong>Petition Signatures:</strong> Name, email, and any comments submitted when signing petitions.</li>
                <li><strong>Contact Information:</strong> Name, email, and message content submitted through our contact form.</li>
                <li><strong>Donation Information:</strong> Name, email, and payment details processed securely through Stripe. We do not store your full credit card details on our servers.</li>
                <li><strong>Newsletter Subscriptions:</strong> Email address when you subscribe to our newsletter.</li>
                <li><strong>Survey Responses:</strong> Answers and data submitted through our surveys.</li>
                <li><strong>Device and Usage Data:</strong> Browser type, IP address, pages visited, and interaction data collected automatically for analytics and service improvement.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">2. How We Use Your Information</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                We use your personal information for the following purposes:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-sm text-slate-600 sm:text-base">
                <li>To create and manage your user account.</li>
                <li>To process membership and volunteer applications.</li>
                <li>To process donations and issue receipts.</li>
                <li>To manage petition signatures and civic engagement activities.</li>
                <li>To send you updates, newsletters, and communications related to DV activities (with your consent).</li>
                <li>To respond to your enquiries and provide support.</li>
                <li>To improve our website, services, and user experience.</li>
                <li>To comply with legal obligations.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">3. Data Storage and Security</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Your data is stored securely using Google Firebase (Firestore) with appropriate security rules and
                access controls. We implement industry-standard security measures including encrypted connections
                (HTTPS/SSL), Firebase Authentication, and role-based access controls to protect your personal
                information from unauthorised access, alteration, or disclosure.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">4. Third-Party Services</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                We use the following third-party services to operate our platform:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-sm text-slate-600 sm:text-base">
                <li><strong>Google Firebase:</strong> Authentication, database, and file storage.</li>
                <li><strong>Stripe:</strong> Secure payment processing for donations and purchases.</li>
                <li><strong>Resend:</strong> Email delivery for transactional and communication emails.</li>
                <li><strong>Vercel:</strong> Website hosting and deployment.</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                These services have their own privacy policies and we encourage you to review them. We do not sell,
                trade, or rent your personal information to any third party.
              </p>
            </div>

            {/* Section 5 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">5. Cookies and Tracking</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Our website may use cookies and similar technologies to enhance your browsing experience, remember
                your preferences, and track usage patterns. These include essential cookies required for authentication
                and session management. You can control cookie settings through your browser preferences.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">6. Your Rights</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                You have the following rights regarding your personal data:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-sm text-slate-600 sm:text-base">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal obligations.</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for communications at any time by unsubscribing or contacting us.</li>
                <li><strong>Data Portability:</strong> Request your data in a structured, commonly used format.</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                To exercise any of these rights, please contact us using the details below.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">7. Data Retention</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                We retain your personal data only for as long as necessary to fulfil the purposes for which it was
                collected, or as required by law. Membership and volunteer application data is retained for the
                duration of your relationship with DV. You may request deletion of your account and associated data
                at any time.
              </p>
            </div>

            {/* Section 8 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">8. Children&apos;s Privacy</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                Our services are not directed at individuals under the age of 18. We do not knowingly collect personal
                information from children. If we become aware that we have collected data from a child without
                parental consent, we will take steps to delete such information promptly.
              </p>
            </div>

            {/* Section 9 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">9. Changes to This Policy</h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal
                requirements. Any updates will be posted on this page with a revised &quot;Last updated&quot; date. We
                encourage you to review this policy periodically.
              </p>
            </div>

            {/* Section 10 */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl">10. Contact Us</h2>
              <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our handling of your
                personal data, please contact us:
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

          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  )
}
