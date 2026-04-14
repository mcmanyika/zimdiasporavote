import Image from 'next/image'
import Link from 'next/link'
import { CONTACT_EMAIL } from '@/lib/branding'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-dv-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center rounded-md bg-white/10 p-2 ring-1 ring-white/15">
          <Image
            src="/images/logo.png"
            alt="DiasporaVote"
            width={220}
            height={64}
            className="h-8 w-auto max-w-[200px] object-contain object-left sm:h-9"
          />
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100/90">
          <a href="/#about" className="hover:text-white">
            About
          </a>
          <a href="/#get-involved" className="hover:text-white">
            Get involved
          </a>
          <Link href="/news" className="hover:text-white">
            Updates
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
            Contact
          </a>
          <Link href="/privacy" className="hover:text-white">
            Privacy Policy
          </Link>
        </nav>
        <div className="flex gap-4">
          <span className="text-blue-200" aria-label="Facebook">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </span>
          <span className="text-blue-200" aria-label="X">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-blue-200/60">
        © {year} DiasporaVote Initiative. All rights reserved.
      </div>
    </footer>
  )
}
