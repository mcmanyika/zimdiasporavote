'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '@/lib/stripe/config'
import { createDonation, createNotification } from '@/lib/firebase/firestore'

interface DonationFormContentProps {
  onSuccess?: () => void
  initialMessage?: string
  initialAmount?: number
}

function DonationFormContent({ onSuccess, initialMessage = '', initialAmount }: DonationFormContentProps) {
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const presetAmounts = [5, 10, 25, 50, 100]

  useEffect(() => {
    setDescription(initialMessage)
  }, [initialMessage])

  useEffect(() => {
    if (typeof initialAmount === 'number' && Number.isFinite(initialAmount) && initialAmount > 0) {
      setAmount(initialAmount.toString())
      setCustomAmount('')
    }
  }, [initialAmount])

  useEffect(() => {
    // Create payment intent when amount is selected
    const donationAmount = customAmount || amount
    if (donationAmount && parseFloat(donationAmount) > 0) {
      const createPaymentIntent = async () => {
        try {
          setError('')
          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: parseFloat(donationAmount),
              userId: user?.uid || null,
              userEmail: user?.email || null,
              userName: user?.displayName || null,
              type: 'donation',
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to create payment intent')
          }

          setClientSecret(data.clientSecret)
        } catch (err: any) {
          console.error('Error creating payment intent:', err)
          setError(err.message || 'Failed to initialize payment')
          setClientSecret('')
        }
      }
      
      // Debounce to avoid too many API calls
      const timeoutId = setTimeout(() => {
        createPaymentIntent()
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setClientSecret('')
    }
  }, [amount, customAmount, user?.uid, user?.email, user?.displayName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const donationAmount = customAmount || amount
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      setError('Please enter a valid donation amount')
      setLoading(false)
      return
    }

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please try again.')
      setLoading(false)
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found')
      setLoading(false)
      return
    }

    try {
      // Confirm payment with auto-captured user info
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.displayName || undefined,
              email: user?.email || undefined,
            },
          },
        }
      )

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (paymentIntent?.status === 'succeeded') {
        // Create donation record in Firestore
        try {
          const donation = {
            userId: user?.uid || '',
            amount: parseFloat(donationAmount),
            currency: 'usd',
            status: 'succeeded' as const,
            stripePaymentIntentId: paymentIntent.id,
            description: description || undefined,
          }
          const donationId = await createDonation(donation)
          console.log('Donation record created in Firestore:', donationId)

          // Create admin notification for new donation
          try {
            await createNotification({
              type: 'new_donation',
              title: 'New Donation',
              message: `${user?.displayName || user?.email || 'Someone'} donated $${parseFloat(donationAmount).toFixed(2)}.`,
              link: '/dashboard/admin/users',
            })
          } catch (e) { /* non-critical */ }
        } catch (donationError: any) {
          console.error('Error creating donation record:', donationError)
          console.error('Error details:', {
            code: donationError?.code,
            message: donationError?.message,
            userId: user?.uid,
            paymentIntentId: paymentIntent.id,
          })
          // Show error to user but continue - webhook will handle it as backup
          alert('Payment succeeded, but there was an error saving the transaction. It will be saved automatically via webhook.')
        }

        if (onSuccess) {
          onSuccess()
        }
        router.push(`/success?payment_intent=${paymentIntent.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process donation')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="mb-3 block text-sm font-semibold text-slate-900">
          Select Amount
        </label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset.toString())
                setCustomAmount('')
              }}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                amount === preset.toString()
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-900 hover:border-slate-900'
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-900">
          Or enter custom amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="0.00"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value)
              setAmount('')
            }}
            className="w-full rounded-lg border border-slate-300 pl-8 pr-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-base"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-900">
          Message (optional)
        </label>
        <textarea
          rows={3}
          placeholder="Add a message to your donation..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-base"
        />
      </div>

      {clientSecret && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">
            Card Details
          </label>
          <div className="rounded-lg border border-slate-300 p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1e293b',
                    '::placeholder': {
                      color: '#94a3b8',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !clientSecret || (!amount && !customAmount)}
        className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:text-base"
      >
        {loading ? 'Processing...' : 'Donate Now'}
      </button>
    </form>
  )
}

interface DonationFormProps {
  onSuccess?: () => void
  initialMessage?: string
  initialAmount?: number
}

export default function DonationForm({ onSuccess, initialMessage = '', initialAmount }: DonationFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <DonationFormContent onSuccess={onSuccess} initialMessage={initialMessage} initialAmount={initialAmount} />
    </Elements>
  )
}

