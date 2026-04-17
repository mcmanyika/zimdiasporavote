'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import DonationForm from './DonationForm'

interface DonationModalProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
  initialAmount?: number
  variant?: 'center' | 'drawer-right'
  description?: string
}

export default function DonationModal({
  isOpen,
  onClose,
  initialMessage = '',
  initialAmount,
  variant = 'center',
  description,
}: DonationModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSuccess = () => {
    onClose()
  }

  if (!isOpen || !mounted) return null

  const isDrawer = variant === 'drawer-right'

  const modal = (
    <div
      className={`fixed inset-0 z-[200] flex ${isDrawer ? 'items-stretch justify-end' : 'items-center justify-center p-4'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 bg-white shadow-2xl ${
          isDrawer
            ? 'h-full w-[30%] max-w-none animate-in slide-in-from-right duration-300'
            : 'w-full max-w-2xl rounded-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="donation-modal-title" className="text-2xl font-bold">
              Make a Donation
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`${isDrawer ? 'h-[calc(100vh-88px)]' : 'max-h-[calc(100vh-200px)]'} overflow-y-auto p-6`}>
          <DonationForm onSuccess={handleSuccess} initialMessage={initialMessage} initialAmount={initialAmount} />
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

