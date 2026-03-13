'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createMembershipApplication, createNotification, getReferralByReferred, updateReferralStatus, getCountryPhoneCodes } from '@/lib/firebase/firestore'
import type { MembershipApplicationType, ParticipationArea, OrganisationType } from '@/types'

const provinces = [
  'Bulawayo',
  'Harare',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East',
  'Mashonaland West',
  'Masvingo',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
]

const fallbackCountryCodeOptions = [
  { id: 'zw', iso2: 'ZW', name: 'Zimbabwe', dialCode: '+263' },
  { id: 'za', iso2: 'ZA', name: 'South Africa', dialCode: '+27' },
  { id: 'zm', iso2: 'ZM', name: 'Zambia', dialCode: '+260' },
  { id: 'bw', iso2: 'BW', name: 'Botswana', dialCode: '+267' },
  { id: 'gb', iso2: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { id: 'us', iso2: 'US', name: 'United States', dialCode: '+1' },
]

type CountryCodeOption = {
  id: string
  iso2: string
  name: string
  dialCode: string
}

function isoToFlag(iso2: string): string {
  const code = (iso2 || '').toUpperCase()
  if (code.length !== 2) return '🌍'
  return String.fromCodePoint(...code.split('').map((c) => 127397 + c.charCodeAt(0)))
}

const participationOptions: { value: ParticipationArea; label: string }[] = [
  { value: 'civic_education', label: 'Civic education' },
  { value: 'legal_constitutional', label: 'Legal & constitutional advocacy' },
  { value: 'parliamentary', label: 'Parliamentary engagement' },
  { value: 'community_mobilisation', label: 'Community mobilisation' },
  { value: 'research_policy', label: 'Research & policy' },
  { value: 'communications_media', label: 'Communications & media' },
  { value: 'other', label: 'Other' },
]

const organisationTypes: { value: OrganisationType; label: string }[] = [
  { value: 'civic', label: 'Civic organisation' },
  { value: 'labour', label: 'Labour / Trade Union' },
  { value: 'faith', label: 'Faith-based institution' },
  { value: 'student_youth', label: 'Student / Youth organisation' },
  { value: 'professional', label: 'Professional association' },
  { value: 'community_residents', label: 'Community / Residents\' association' },
  { value: 'liberation_veterans', label: 'Liberation War Veterans\' Association' },
  { value: 'other', label: 'Other' },
]

export default function MembershipApplicationForm() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1) // 1=Type, 2=Details, 3=Declaration, 4=Review

  // Section A
  const [membershipType, setMembershipType] = useState<MembershipApplicationType>('individual')

  // Section B: Individual
  const [individual, setIndividual] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    province: '',
    district: '',
    occupation: '',
    mobileNumber: '',
    mobileCountryCode: '+263',
    emailAddress: '',
    participationAreas: [] as ParticipationArea[],
    participationOther: '',
  })

  // Section C: Institutional
  const [institutional, setInstitutional] = useState({
    organisationName: '',
    organisationType: '' as OrganisationType | '',
    organisationTypeOther: '',
    registrationStatus: '',
    physicalAddress: '',
    provincesOfOperation: '',
    representativeName: '',
    representativePosition: '',
    representativeMobile: '',
    representativeMobileCountryCode: '+263',
    representativeEmail: '',
    alternateRepresentative: '',
  })

  // Section D: Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [signatureDate, setSignatureDate] = useState('')
  const [countryCodeOptions, setCountryCodeOptions] = useState<CountryCodeOption[]>(fallbackCountryCodeOptions)

  // Pre-fill from auth
  useEffect(() => {
    if (user) {
      setIndividual((prev) => ({
        ...prev,
        fullName: userProfile?.name || user.displayName || prev.fullName,
        emailAddress: user.email || prev.emailAddress,
      }))
    }
  }, [user, userProfile])

  // Set today's date for signature
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setSignatureDate(today)
  }, [])

  // Load country code options from DB table
  useEffect(() => {
    let isMounted = true

    const fetchFromPublicApi = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,idd')
        if (!response.ok) return []
        const data = await response.json()
        if (!Array.isArray(data)) return []

        const mapped = data
          .map((country: any) => {
            const iso2 = String(country?.cca2 || '').toUpperCase()
            const name = String(country?.name?.common || '').trim()
            const root = String(country?.idd?.root || '').trim()
            const suffix = Array.isArray(country?.idd?.suffixes) && country.idd.suffixes.length > 0
              ? String(country.idd.suffixes[0] || '').trim()
              : ''
            const dialCode = `${root}${suffix}`.trim()
            if (!iso2 || iso2.length !== 2 || !name || !dialCode.startsWith('+')) return null
            return {
              id: iso2.toLowerCase(),
              iso2,
              name,
              dialCode,
            }
          })
          .filter((item: CountryCodeOption | null): item is CountryCodeOption => item !== null)
          .sort((a: CountryCodeOption, b: CountryCodeOption) => a.name.localeCompare(b.name))

        return mapped
      } catch {
        return []
      }
    }

    const loadCountryCodes = async () => {
      try {
        const dbCodes = await getCountryPhoneCodes(true)
        if (!isMounted) return

        if (dbCodes.length > 0) {
          const normalized: CountryCodeOption[] = dbCodes.map((item) => ({
            id: item.id,
            iso2: item.iso2,
            name: item.name,
            dialCode: item.dialCode,
          }))
          setCountryCodeOptions(normalized)
          return
        }

        const apiCodes = await fetchFromPublicApi()
        if (!isMounted || apiCodes.length === 0) return
        setCountryCodeOptions(apiCodes)
      } catch (err) {
        console.error('Failed to load country phone codes from Firestore, trying public API:', err)
        const apiCodes = await fetchFromPublicApi()
        if (!isMounted || apiCodes.length === 0) return
        setCountryCodeOptions(apiCodes)
      }
    }

    void loadCountryCodes()
    return () => {
      isMounted = false
    }
  }, [])

  const handleParticipationToggle = (area: ParticipationArea) => {
    setIndividual((prev) => ({
      ...prev,
      participationAreas: prev.participationAreas.includes(area)
        ? prev.participationAreas.filter((a) => a !== area)
        : [...prev.participationAreas, area],
    }))
  }

  const validateStep = (currentStep: number): boolean => {
    setError('')

    if (currentStep === 1) {
      return true // Type is always selected
    }

    if (currentStep === 2) {
      if (membershipType === 'individual') {
        if (!individual.fullName.trim()) {
          setError('Full Name is required')
          return false
        }
        if (!individual.mobileNumber.trim()) {
          setError('Mobile Number is required')
          return false
        }
        if (!individual.emailAddress.trim() || !individual.emailAddress.includes('@')) {
          setError('A valid Email Address is required')
          return false
        }
        if (!individual.province) {
          setError('Province is required')
          return false
        }
      } else {
        if (!institutional.organisationName.trim()) {
          setError('Organisation Name is required')
          return false
        }
        if (!institutional.organisationType) {
          setError('Organisation Type is required')
          return false
        }
        if (!institutional.representativeName.trim()) {
          setError('Designated Representative Name is required')
          return false
        }
        if (!institutional.representativeMobile.trim()) {
          setError('Representative Mobile Number is required')
          return false
        }
        if (!institutional.representativeEmail.trim() || !institutional.representativeEmail.includes('@')) {
          setError('A valid Representative Email Address is required')
          return false
        }
      }
      return true
    }

    if (currentStep === 3) {
      if (!declarationAccepted) {
        setError('You must accept the Declaration of Principle to proceed')
        return false
      }
      if (!signatureName.trim()) {
        setError('Signature name is required')
        return false
      }
      return true
    }

    return true
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    setError('')
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setLoading(true)
    setError('')

    try {
      const applicationData: any = {
        type: membershipType,
        declarationAccepted: true,
        signatureName: signatureName.trim(),
        signatureDate,
        userId: user?.uid || '',
      }

      if (membershipType === 'individual') {
        applicationData.fullName = individual.fullName.trim()
        if (individual.gender) applicationData.gender = individual.gender
        if (individual.dateOfBirth) applicationData.dateOfBirth = individual.dateOfBirth
        applicationData.province = individual.province
        if (individual.district.trim()) applicationData.district = individual.district.trim()
        if (individual.occupation.trim()) applicationData.occupation = individual.occupation.trim()
        applicationData.mobileNumber = `${individual.mobileCountryCode} ${individual.mobileNumber.trim()}`
        applicationData.emailAddress = individual.emailAddress.trim()
        if (individual.participationAreas.length > 0) applicationData.participationAreas = individual.participationAreas
        if (individual.participationOther.trim()) applicationData.participationOther = individual.participationOther.trim()
      } else {
        applicationData.organisationName = institutional.organisationName.trim()
        applicationData.organisationType = institutional.organisationType
        if (institutional.organisationTypeOther.trim()) applicationData.organisationTypeOther = institutional.organisationTypeOther.trim()
        if (institutional.registrationStatus.trim()) applicationData.registrationStatus = institutional.registrationStatus.trim()
        if (institutional.physicalAddress.trim()) applicationData.physicalAddress = institutional.physicalAddress.trim()
        if (institutional.provincesOfOperation.trim()) applicationData.provincesOfOperation = institutional.provincesOfOperation.trim()
        applicationData.representativeName = institutional.representativeName.trim()
        if (institutional.representativePosition.trim()) applicationData.representativePosition = institutional.representativePosition.trim()
        applicationData.representativeMobile = `${institutional.representativeMobileCountryCode} ${institutional.representativeMobile.trim()}`
        applicationData.representativeEmail = institutional.representativeEmail.trim()
        if (institutional.alternateRepresentative.trim()) applicationData.alternateRepresentative = institutional.alternateRepresentative.trim()
        // Also store contact email for consistency
        applicationData.emailAddress = institutional.representativeEmail.trim()
      }

      await createMembershipApplication(applicationData)

      // Create admin notification for new membership application
      try {
        const applicantName = membershipType === 'individual'
          ? individual.fullName.trim()
          : institutional.organisationName.trim()
        await createNotification({
          type: 'new_membership_application',
          title: 'New Membership Application',
          message: `${applicantName} submitted a ${membershipType} membership application.`,
          link: '/dashboard/admin/membership-applications',
        })
      } catch (e) { /* non-critical */ }

      // Update referral status to 'applied' if this user was referred
      if (user?.uid) {
        try {
          const referral = await getReferralByReferred(user.uid)
          if (referral && referral.status === 'signed_up') {
            await updateReferralStatus(referral.id, 'applied')
          }
        } catch (e) { /* non-critical */ }
      }

      setSuccess(true)
      window.scrollTo(0, 0)
    } catch (err: any) {
      console.error('Error submitting membership application:', err)
      setError(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold text-green-900">Application Submitted Successfully!</h3>
        <p className="mb-6 text-green-700">
          Thank you for your membership application to the Defend the Constitution Platform.
          Your application is now under review. You will be notified once it has been processed.
        </p>
        <button
          onClick={() => router.push('/')}
          className="rounded-lg bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          Back to Home
        </button>
      </div>
    )
  }

  // Stepper
  const steps = ['Membership Type', 'Your Details', 'Declaration', 'Review & Submit']

  return (
    <div>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((label, i) => {
            const stepNum = i + 1
            const isActive = step === stepNum
            const isComplete = step > stepNum
            return (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isComplete
                        ? 'bg-green-600 text-white'
                        : isActive
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span className={`mt-1.5 text-[10px] sm:text-xs font-medium text-center ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-full mx-2 -mt-5 ${isComplete ? 'bg-green-600' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STEP 1: Membership Type */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">Section A: Type of Membership</h3>
            <p className="text-sm text-slate-500">Please select your membership type</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMembershipType('individual')}
              className={`group relative rounded-xl border-2 p-6 text-left transition-all ${
                membershipType === 'individual'
                  ? 'border-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${membershipType === 'individual' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h4 className="mb-1 font-bold text-slate-900">Individual Membership</h4>
              <p className="text-sm text-slate-500">For individual citizens and community members</p>
              {membershipType === 'individual' && (
                <div className="absolute top-4 right-4">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMembershipType('institutional')}
              className={`group relative rounded-xl border-2 p-6 text-left transition-all ${
                membershipType === 'institutional'
                  ? 'border-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${membershipType === 'institutional' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <h4 className="mb-1 font-bold text-slate-900">Institutional / Organisational</h4>
              <p className="text-sm text-slate-500">For organisations, associations, movements, or institutions</p>
              {membershipType === 'institutional' && (
                <div className="absolute top-4 right-4">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              className="rounded-lg bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Details */}
      {step === 2 && membershipType === 'individual' && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">Section B: Individual Membership Details</h3>
            <p className="text-sm text-slate-500">Please provide your personal information</p>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={individual.fullName}
                onChange={(e) => setIndividual({ ...individual, fullName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Gender */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  Gender <span className="text-slate-400 text-xs">(Optional)</span>
                </label>
                <select
                  value={individual.gender}
                  onChange={(e) => setIndividual({ ...individual, gender: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            {/* DOB & Province */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  Date of Birth <span className="text-slate-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={individual.dateOfBirth}
                  onChange={(e) => setIndividual({ ...individual, dateOfBirth: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  value={individual.province}
                  onChange={(e) => setIndividual({ ...individual, province: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                >
                  <option value="">Select province</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* District & Occupation */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  District / Ward <span className="text-slate-400 text-xs">(if applicable)</span>
                </label>
                <input
                  type="text"
                  value={individual.district}
                  onChange={(e) => setIndividual({ ...individual, district: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Enter district or ward"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  Occupation / Social Base <span className="text-slate-400 text-xs">(if applicable)</span>
                </label>
                <input
                  type="text"
                  value={individual.occupation}
                  onChange={(e) => setIndividual({ ...individual, occupation: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. worker, student, professional"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-[minmax(150px,190px)_1fr] gap-2">
                  <select
                    value={individual.mobileCountryCode}
                    onChange={(e) => setIndividual({ ...individual, mobileCountryCode: e.target.value })}
                    className="rounded-lg border border-slate-300 px-2 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {countryCodeOptions.map((option) => (
                      <option key={option.id} value={option.dialCode}>
                        {`${isoToFlag(option.iso2)} ${option.name} (${option.dialCode})`}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={individual.mobileNumber}
                    onChange={(e) => setIndividual({ ...individual, mobileNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="7X XXX XXXX"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={individual.emailAddress}
                  onChange={(e) => setIndividual({ ...individual, emailAddress: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Participation Areas */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Preferred Area(s) of Participation <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {participationOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center space-x-2.5 cursor-pointer rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={individual.participationAreas.includes(opt.value)}
                      onChange={() => handleParticipationToggle(opt.value)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-sm text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {individual.participationAreas.includes('other') && (
                <input
                  type="text"
                  value={individual.participationOther}
                  onChange={(e) => setIndividual({ ...individual, participationOther: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Please specify other area of participation"
                />
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Institutional Details */}
      {step === 2 && membershipType === 'institutional' && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">Section C: Institutional / Organisational Membership Details</h3>
            <p className="text-sm text-slate-500">To be completed by organisations, associations, movements, or institutions</p>
          </div>

          <div className="space-y-4">
            {/* Organisation Name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Name of Organisation / Institution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={institutional.organisationName}
                onChange={(e) => setInstitutional({ ...institutional, organisationName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Enter organisation name"
                required
              />
            </div>

            {/* Organisation Type */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">
                Type of Organisation <span className="text-red-500">*</span>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {organisationTypes.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center space-x-2.5 cursor-pointer rounded-lg border p-3 transition-colors ${
                      institutional.organisationType === opt.value
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="orgType"
                      checked={institutional.organisationType === opt.value}
                      onChange={() => setInstitutional({ ...institutional, organisationType: opt.value })}
                      className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-sm text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {institutional.organisationType === 'other' && (
                <input
                  type="text"
                  value={institutional.organisationTypeOther}
                  onChange={(e) => setInstitutional({ ...institutional, organisationTypeOther: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Please specify organisation type"
                />
              )}
            </div>

            {/* Registration & Address */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  Registration Status <span className="text-slate-400 text-xs">(if applicable)</span>
                </label>
                <input
                  type="text"
                  value={institutional.registrationStatus}
                  onChange={(e) => setInstitutional({ ...institutional, registrationStatus: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. Registered, Unregistered"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-900">
                  Province(s) of Operation
                </label>
                <input
                  type="text"
                  value={institutional.provincesOfOperation}
                  onChange={(e) => setInstitutional({ ...institutional, provincesOfOperation: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. Harare, Bulawayo, Nationwide"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">Physical Address</label>
              <textarea
                rows={2}
                value={institutional.physicalAddress}
                onChange={(e) => setInstitutional({ ...institutional, physicalAddress: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Enter physical address"
              />
            </div>

            {/* Designated Representative */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-sm font-bold text-slate-900">Designated Representative to the DCP</h4>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={institutional.representativeName}
                      onChange={(e) => setInstitutional({ ...institutional, representativeName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Position</label>
                    <input
                      type="text"
                      value={institutional.representativePosition}
                      onChange={(e) => setInstitutional({ ...institutional, representativePosition: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-[minmax(150px,190px)_1fr] gap-2">
                      <select
                        value={institutional.representativeMobileCountryCode}
                        onChange={(e) => setInstitutional({ ...institutional, representativeMobileCountryCode: e.target.value })}
                        className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        {countryCodeOptions.map((option) => (
                          <option key={option.id} value={option.dialCode}>
                            {`${isoToFlag(option.iso2)} ${option.name} (${option.dialCode})`}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={institutional.representativeMobile}
                        onChange={(e) => setInstitutional({ ...institutional, representativeMobile: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="7X XXX XXXX"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={institutional.representativeEmail}
                      onChange={(e) => setInstitutional({ ...institutional, representativeEmail: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Alternate Representative */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Alternate Representative <span className="text-slate-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={institutional.alternateRepresentative}
                onChange={(e) => setInstitutional({ ...institutional, alternateRepresentative: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Name and contact details of alternate representative"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Declaration of Principle */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">Section D: Declaration of Principle</h3>
            <p className="text-sm text-slate-500">Please read and accept the declaration below</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p className="mb-4 text-sm leading-relaxed text-slate-700">
              I / We hereby apply for membership of the <strong>Defend the Constitution Platform (DCP)</strong> and affirm that:
            </p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">1</span>
                <span>I / We support the defence, protection, and full implementation of the <strong>2013 Constitution of Zimbabwe</strong>;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">2</span>
                <span>I / We subscribe to and uphold the <strong>People&apos;s Resolution</strong> as adopted by the Defend the Constitution Platform;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">3</span>
                <span>I / We understand that the DCP is <strong>non-partisan, non-electoral</strong>, and does not seek state power;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">4</span>
                <span>I / We commit to <strong>peaceful, lawful, and constitutional</strong> action;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">5</span>
                <span>I / We agree to abide by the <strong>DCP Constitution, governance framework, and code of conduct</strong>.</span>
              </li>
            </ul>
            <p className="mt-4 text-sm italic text-slate-500">
              I / We further acknowledge that membership of the DCP does not replace affiliation to any political party, civic organisation, or institution.
            </p>
          </div>

          <label className="flex items-start space-x-3 cursor-pointer rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-sm font-medium text-slate-900">
              I / We accept and agree to the Declaration of Principle stated above <span className="text-red-500">*</span>
            </span>
          </label>

          {/* Signature */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Signature (Full Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-serif italic"
                placeholder="Type your full name as signature"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-900">Date</label>
              <input
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Review Application →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Submit */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">Review Your Application</h3>
            <p className="text-sm text-slate-500">Please review your information before submitting</p>
          </div>

          {/* Type */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Membership Type</h4>
            <p className="text-sm font-medium text-slate-900 capitalize">{membershipType} Membership</p>
          </div>

          {/* Details */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              {membershipType === 'individual' ? 'Personal Details' : 'Organisation Details'}
            </h4>
            {membershipType === 'individual' ? (
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div><span className="text-slate-500">Full Name:</span> <span className="font-medium text-slate-900">{individual.fullName}</span></div>
                {individual.gender && <div><span className="text-slate-500">Gender:</span> <span className="font-medium text-slate-900">{individual.gender}</span></div>}
                {individual.dateOfBirth && <div><span className="text-slate-500">Date of Birth:</span> <span className="font-medium text-slate-900">{individual.dateOfBirth}</span></div>}
                <div><span className="text-slate-500">Province:</span> <span className="font-medium text-slate-900">{individual.province}</span></div>
                {individual.district && <div><span className="text-slate-500">District/Ward:</span> <span className="font-medium text-slate-900">{individual.district}</span></div>}
                {individual.occupation && <div><span className="text-slate-500">Occupation:</span> <span className="font-medium text-slate-900">{individual.occupation}</span></div>}
                <div><span className="text-slate-500">Mobile:</span> <span className="font-medium text-slate-900">{individual.mobileNumber}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900">{individual.emailAddress}</span></div>
                {individual.participationAreas.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Participation Areas:</span>{' '}
                    <span className="font-medium text-slate-900">
                      {individual.participationAreas.map((a) => participationOptions.find((o) => o.value === a)?.label || a).join(', ')}
                    </span>
                    {individual.participationOther && <span className="font-medium text-slate-900"> — {individual.participationOther}</span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div><span className="text-slate-500">Organisation:</span> <span className="font-medium text-slate-900">{institutional.organisationName}</span></div>
                <div><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-900">{organisationTypes.find((o) => o.value === institutional.organisationType)?.label || institutional.organisationType}{institutional.organisationTypeOther ? ` — ${institutional.organisationTypeOther}` : ''}</span></div>
                {institutional.registrationStatus && <div><span className="text-slate-500">Registration:</span> <span className="font-medium text-slate-900">{institutional.registrationStatus}</span></div>}
                {institutional.physicalAddress && <div className="sm:col-span-2"><span className="text-slate-500">Address:</span> <span className="font-medium text-slate-900">{institutional.physicalAddress}</span></div>}
                {institutional.provincesOfOperation && <div><span className="text-slate-500">Provinces:</span> <span className="font-medium text-slate-900">{institutional.provincesOfOperation}</span></div>}
                <div className="sm:col-span-2 mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-semibold">Designated Representative:</span>
                </div>
                <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{institutional.representativeName}</span></div>
                {institutional.representativePosition && <div><span className="text-slate-500">Position:</span> <span className="font-medium text-slate-900">{institutional.representativePosition}</span></div>}
                <div><span className="text-slate-500">Mobile:</span> <span className="font-medium text-slate-900">{institutional.representativeMobile}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900">{institutional.representativeEmail}</span></div>
                {institutional.alternateRepresentative && <div className="sm:col-span-2"><span className="text-slate-500">Alternate Rep:</span> <span className="font-medium text-slate-900">{institutional.alternateRepresentative}</span></div>}
              </div>
            )}
          </div>

          {/* Declaration */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Declaration</h4>
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-slate-900 font-medium">Declaration of Principle accepted</span>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Signed by: <span className="font-medium italic">{signatureName}</span> on {signatureDate}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-slate-900 px-10 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
