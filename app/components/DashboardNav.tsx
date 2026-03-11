'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import NotificationBell from '@/app/components/NotificationBell'

// SVG Icon Components (Heroicons outline style)
function IconChart({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function IconUser({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function IconHeart({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function IconStar({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

function IconHandRaised({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3.15M10.05 4.575a1.575 1.575 0 113.15 0v5.85M10.05 4.575v5.85M7.05 7.725a1.575 1.575 0 00-1.575 1.575c0 2.28.474 4.456 1.327 6.425M13.2 4.575v5.85m0-5.85a1.575 1.575 0 113.15 0M13.2 10.425v1.65a1.575 1.575 0 003.15 0V4.575m0 0a1.575 1.575 0 013.15 0v7.35c0 4.56-2.783 8.475-6.675 10.125M4.802 15.725A12.16 12.16 0 003 10.95" />
    </svg>
  )
}

function IconBook({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function IconNewspaper({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  )
}

function IconPencilSquare({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function IconClipboard({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  )
}

function IconPhoto({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function IconFlag({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}

function IconUsers({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function IconShoppingBag({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function IconCube({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

function IconEnvelope({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function IconUserGroup({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

interface NavItem {
  href: string
  label: string
  icon: ReactNode
  description: string
}

function IconShare({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  )
}

function IconRocket({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 5.84l-4.09.58.58-4.09a6 6 0 015.84-5.84m3.51-4.87a1.5 1.5 0 112.12 2.12l-2.12 2.12a3 3 0 01-4.24-4.24l2.12-2.12z" />
    </svg>
  )
}

const accountItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: <IconChart />, description: 'Dashboard summary & stats' },
  { href: '/dashboard/profile', label: 'Profile', icon: <IconUser />, description: 'Your account settings' },
  { href: '/dashboard/donations', label: 'My Donations', icon: <IconHeart />, description: 'Donation history' },
  { href: '/dashboard/membership', label: 'Membership', icon: <IconStar />, description: 'Plan & billing' },
  { href: '/dashboard/membership-card', label: 'My Card', icon: <IconCreditCard />, description: 'View & print card' },
  { href: '/dashboard/referrals', label: 'Referrals', icon: <IconShare />, description: 'Invite friends & track' },
  { href: '/dashboard/youth', label: 'Youth Hub', icon: <IconRocket />, description: 'Actions, missions & growth' },
  { href: '/dashboard/volunteer', label: 'Volunteer', icon: <IconHandRaised />, description: 'Volunteer status' },
  { href: '/dashboard/resources', label: 'Resources', icon: <IconBook />, description: 'Guides & materials' },
]

function IconTwitter({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function IconVideo({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A1.5 1.5 0 014.5 6h9A1.5 1.5 0 0115 7.5v9a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 013 16.5v-9zm12 2.25l5.25-3v10.5L15 14.25v-4.5z" />
    </svg>
  )
}

const adminContentItems: NavItem[] = [
  { href: '/dashboard/admin/news', label: 'Articles', icon: <IconNewspaper />, description: 'Manage articles' },
  { href: '/dashboard/admin/videos', label: 'Videos', icon: <IconVideo />, description: 'Educational YouTube videos' },
  { href: '/dashboard/admin/petitions', label: 'Petitions', icon: <IconPencilSquare />, description: 'Manage petitions' },
  { href: '/dashboard/admin/petition-signatures', label: 'Signatures', icon: <IconPencilSquare />, description: 'Petition signatories' },
  { href: '/dashboard/admin/surveys', label: 'Surveys', icon: <IconClipboard />, description: 'Manage surveys' },
  { href: '/dashboard/admin/banners', label: 'Banners', icon: <IconFlag />, description: 'Hero banners' },
  { href: '/dashboard/admin/gallery', label: 'Gallery', icon: <IconPhoto />, description: 'Image gallery' },
  { href: '/dashboard/admin/leadership', label: 'Leadership', icon: <IconUserGroup />, description: 'Leadership team' },
  { href: '/dashboard/admin/twitter-embeds', label: 'X Embeds', icon: <IconTwitter />, description: 'Live Twitter/X feed' },
]

function IconIdentification({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
    </svg>
  )
}

function IconCreditCard({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

function IconArrowDownTray({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

const adminManageItems: NavItem[] = [
  { href: '/dashboard/admin/users', label: 'Users', icon: <IconUsers />, description: 'User accounts & roles' },
  { href: '/dashboard/admin/membership-applications', label: 'Applications', icon: <IconIdentification />, description: 'Membership applications' },
  { href: '/dashboard/admin/membership-cards', label: 'Cards', icon: <IconCreditCard />, description: 'All membership cards' },
  { href: '/dashboard/admin/referrals', label: 'Referrals', icon: <IconShare />, description: 'Referral program' },
  { href: '/dashboard/admin/donations', label: 'All Donations', icon: <IconHeart />, description: 'All donations' },
  { href: '/dashboard/admin/products', label: 'Products', icon: <IconShoppingBag />, description: 'Shop inventory' },
  { href: '/dashboard/admin/orders', label: 'Orders', icon: <IconCube />, description: 'Order management' },
  { href: '/dashboard/admin/youth-missions', label: 'Youth Missions', icon: <IconRocket />, description: 'Youth action tasks' },
  { href: '/dashboard/admin/volunteers', label: 'Volunteers', icon: <IconUserGroup />, description: 'Applications' },
  { href: '/dashboard/admin/contacts', label: 'Contact', icon: <IconEnvelope />, description: 'Messages received' },
  { href: '/dashboard/admin/inbox', label: 'Inbox', icon: <IconEnvelope />, description: 'Received emails' },
  { href: '/dashboard/admin/compose-email', label: 'Email Compose', icon: <IconEnvelope />, description: 'Send an email' },
  { href: '/dashboard/admin/emails', label: 'Emails', icon: <IconEnvelope />, description: 'Sent email logs' },
  { href: '/dashboard/admin/downloads', label: 'Downloads', icon: <IconArrowDownTray />, description: 'Download tracking' },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'admin'
  const accessLevel = userProfile?.accessLevel || 1
  const [megaOpen, setMegaOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  // Filter admin manage items based on access level
  const filteredManageItems = adminManageItems.filter((item) => {
    if (item.href === '/dashboard/admin/donations' && accessLevel < 5) return false
    if (item.href === '/dashboard/admin/users' && accessLevel < 5) return false
    return true
  })

  // Filter admin content items based on access level
  const filteredContentItems = adminContentItems.filter((item) => {
    if (item.href === '/dashboard/admin/petitions' && accessLevel < 5) return false
    return true
  })

  const allItems = isAdmin
    ? [...accountItems, ...filteredContentItems, ...filteredManageItems]
    : accountItems
  const activeItem = allItems.find(item => item.href === pathname)
  const activeLabel = activeItem?.label || 'Dashboard'

  // Close mega menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMegaOpen(false)
      }
    }
    if (megaOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [megaOpen])

  // Close on route change
  useEffect(() => {
    setMegaOpen(false)
  }, [pathname])

  return (
    <div ref={navRef} className="sticky top-0 z-40">
      {/* Top Bar */}
      <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            {/* Left: Dashboard home */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-700 transition-colors"
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
              </svg>
              Dashboard
            </Link>

            {/* Center: Current page breadcrumb (desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span>/</span>
              <span className="font-medium text-slate-900">{activeLabel}</span>
            </div>

            {/* Right: Notification bell + Menu trigger */}
            <div className="flex items-center gap-2">
              <NotificationBell />
            <button
              onClick={() => setMegaOpen(!megaOpen)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                megaOpen
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <span className="hidden sm:inline">Menu</span>
              <svg
                className={`h-3 w-3 transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mega Menu Dropdown */}
      {megaOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[-1]" />

          <div className="absolute left-0 right-0 border-b bg-white shadow-xl animate-in slide-in-from-top-2 duration-200 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-6 md:grid-cols-4">

                {/* ===== ADMIN LAYOUT: Account | Content | Manage pt1 | Manage pt2 ===== */}
                {isAdmin ? (
                  <>
                    {/* Col 1 — My Account */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        My Account
                      </h3>
                      <div className="space-y-0.5">
                        {accountItems.map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                              <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</p>
                                <p className={`text-[11px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{item.description}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    {/* Col 2 — Content */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Content
                      </h3>
                      <div className="space-y-0.5">
                        {filteredContentItems.map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                              <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</p>
                                <p className={`text-[11px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{item.description}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    {/* Col 3 — Management (first half) */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Management
                      </h3>
                      <div className="space-y-0.5">
                        {filteredManageItems.slice(0, Math.ceil(filteredManageItems.length / 2)).map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                              <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</p>
                                <p className={`text-[11px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{item.description}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    {/* Col 4 — Management (second half) + Back to Site */}
                    <div>
                      {/* Spacer to align with heading in col 3 */}
                      <div className="mb-3 h-[18px]" />
                      <div className="space-y-0.5">
                        {filteredManageItems.slice(Math.ceil(filteredManageItems.length / 2)).map((item) => {
                          const isActive = pathname === item.href
                          return (
                            <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                              <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</p>
                                <p className={`text-[11px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{item.description}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                      {/* Quick link back to site */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                          </svg>
                          Back to Site
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ===== NON-ADMIN: spread account items across 4 columns ===== */
                  <>
                    {[0, 1, 2, 3].map((colIdx) => {
                      const colItems = accountItems.filter((_, i) => i % 4 === colIdx)
                      return (
                        <div key={colIdx}>
                          {colIdx === 0 && (
                            <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                              </svg>
                              My Account
                            </h3>
                          )}
                          {colIdx > 0 && <div className="mb-3 h-[18px]" />}
                          <div className="space-y-0.5">
                            {colItems.map((item) => {
                              const isActive = pathname === item.href
                              return (
                                <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                                  <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</p>
                                    <p className={`text-[11px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{item.description}</p>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                          {/* Back to site on last column */}
                          {colIdx === 3 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                </svg>
                                Back to Site
                              </Link>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
