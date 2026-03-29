'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import AdminRoute from '@/app/components/AdminRoute'
import PartyLinkedDashboardShell from '@/app/components/PartyLinkedDashboardShell'
import { useAuth } from '@/contexts/AuthContext'
import {
  createPartyLeadershipNomination,
  getPartyLeadershipNominations,
  getPartyLeadershipVotesByUser,
  getPartyLeadershipVotingConfig,
  togglePartyLeadershipVote,
  type PartyLeadershipNomination,
  type PartyLeadershipVote,
  type PartyNominationType,
  type PartyPositionType,
} from '@/features/party'

const positions: { value: PartyPositionType; label: string }[] = [
  { value: 'council', label: 'Council' },
  { value: 'mp', label: 'MP' },
  { value: 'senator', label: 'Senator' },
]

const zimbabweProvinces = [
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

export default function PartyNominationsPage() {
  const { user, userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [voting, setVoting] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [highlightedNominationId, setHighlightedNominationId] = useState('')
  const [selectedPosition, setSelectedPosition] = useState<PartyPositionType>('council')
  const [nominations, setNominations] = useState<PartyLeadershipNomination[]>([])
  const [myVotes, setMyVotes] = useState<PartyLeadershipVote[]>([])
  const [config, setConfig] = useState({
    electionCycle: '2026-primary',
    nominationsOpen: true,
    votingOpen: true,
    maxVotesPerPosition: 1,
  })
  const [formData, setFormData] = useState({
    positionType: 'council' as PartyPositionType,
    nominationType: 'self' as PartyNominationType,
    nomineeName: '',
    nomineeEmail: '',
    nomineePhone: '',
    province: '',
    areaLabel: '',
    motivation: '',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const sharedPosition = params.get('position') as PartyPositionType | null
    const sharedNomineeId = params.get('nominee')
    if (sharedPosition && ['council', 'mp', 'senator'].includes(sharedPosition)) {
      setSelectedPosition(sharedPosition)
    }
    if (sharedNomineeId) {
      setHighlightedNominationId(sharedNomineeId)
    }
  }, [])

  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      setError('')
      const cfg = await getPartyLeadershipVotingConfig()
      setConfig({
        electionCycle: cfg.electionCycle,
        nominationsOpen: cfg.nominationsOpen,
        votingOpen: cfg.votingOpen,
        maxVotesPerPosition: cfg.maxVotesPerPosition,
      })

      const [approved, mineVotes] = await Promise.all([
        getPartyLeadershipNominations({
          electionCycle: cfg.electionCycle,
          status: 'approved_for_voting',
        }),
        getPartyLeadershipVotesByUser(user.uid, cfg.electionCycle),
      ])
      setNominations(approved)
      setMyVotes(mineVotes)
    } catch (err: any) {
      setError(err?.message || 'Failed to load nominations module.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  useEffect(() => {
    if (!user) return
    if (formData.nominationType === 'self') {
      setFormData((prev) => ({
        ...prev,
        nomineeName: userProfile?.name || prev.nomineeName || user.email?.split('@')[0] || '',
        nomineeEmail: user.email || prev.nomineeEmail,
      }))
    }
  }, [formData.nominationType, user, userProfile?.name, user?.email])

  const votedNominationIds = useMemo(() => new Set(myVotes.map((vote) => vote.nominationId)), [myVotes])
  const visibleNominations = useMemo(
    () => nominations.filter((item) => item.positionType === selectedPosition),
    [nominations, selectedPosition]
  )
  const myVotesForSelectedPosition = useMemo(
    () => myVotes.filter((vote) => vote.positionType === selectedPosition).length,
    [myVotes, selectedPosition]
  )

  useEffect(() => {
    if (!highlightedNominationId) return
    const exists = visibleNominations.some((item) => item.id === highlightedNominationId)
    if (!exists) return
    const el = document.getElementById(`vote-nomination-${highlightedNominationId}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedNominationId, visibleNominations])

  const resetForm = () => {
    setFormData({
      positionType: 'council',
      nominationType: 'self',
      nomineeName: userProfile?.name || user?.email?.split('@')[0] || '',
      nomineeEmail: user?.email || '',
      nomineePhone: '',
      province: '',
      areaLabel: '',
      motivation: '',
    })
  }

  const handleNominate = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const nomineeName =
        formData.nominationType === 'self'
          ? userProfile?.name || user.email?.split('@')[0] || ''
          : formData.nomineeName.trim()
      const nomineeEmail = formData.nominationType === 'self' ? user.email || '' : formData.nomineeEmail.trim()
      const nomineePhone = formData.nominationType === 'self' ? formData.nomineePhone.trim() : formData.nomineePhone.trim()

      await createPartyLeadershipNomination({
        electionCycle: config.electionCycle,
        submittedByUserId: user.uid,
        submittedByName: userProfile?.name || user.email?.split('@')[0] || 'Member',
        submittedByEmail: user.email || '',
        submittedByPhone: formData.nomineePhone.trim() || undefined,
        positionType: formData.positionType,
        nominationType: formData.nominationType,
        nomineeName,
        nomineeEmail: nomineeEmail || undefined,
        nomineePhone: nomineePhone || undefined,
        province: formData.province.trim(),
        areaLabel: formData.areaLabel.trim(),
        motivation: formData.motivation.trim(),
      })
      setMessage('Nomination submitted successfully. It will appear for voting after admin review.')
      resetForm()
    } catch (err: any) {
      setError(err?.message || 'Failed to submit nomination.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVote = async (nominationId: string) => {
    if (!user) return
    setVoting(nominationId)
    setError('')
    setMessage('')
    try {
      await togglePartyLeadershipVote({
        nominationId,
        voterUserId: user.uid,
      })
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Failed to cast vote.')
    } finally {
      setVoting(null)
    }
  }

  const getShareVoteUrl = (nomination: PartyLeadershipNomination) => {
    const params = new URLSearchParams({
      position: nomination.positionType,
      nominee: nomination.id,
    })
    const path = `/dashboard/party-nominations?${params.toString()}`
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path}`
  }

  const copyShareVoteUrl = async (nomination: PartyLeadershipNomination) => {
    try {
      const url = getShareVoteUrl(nomination)
      await navigator.clipboard.writeText(url)
      setMessage('Vote link copied. Share it with members.')
      setError('')
    } catch {
      setError('Could not copy link. Please copy from browser address bar.')
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm'

  return (
    <ProtectedRoute>
      <AdminRoute minAccessLevel={5}>
        <PartyLinkedDashboardShell
          title="Leadership Nominations & Voting"
          breadcrumbLabel="Nominations"
        >
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Submit Nomination</h2>
            <p className="mt-1 text-sm text-slate-600">
              Election cycle: <strong>{config.electionCycle}</strong> {config.nominationsOpen ? '(Open)' : '(Closed)'}
            </p>
            {!config.nominationsOpen ? (
              <p className="mt-4 text-sm text-amber-700">Nominations are currently closed by administrators.</p>
            ) : (
              <form onSubmit={handleNominate} className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Position *</label>
                  <select
                    value={formData.positionType}
                    onChange={(e) => setFormData({ ...formData, positionType: e.target.value as PartyPositionType })}
                    className={inputClass}
                  >
                    {positions.map((position) => (
                      <option key={position.value} value={position.value}>
                        {position.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nomination Type *</label>
                  <select
                    value={formData.nominationType}
                    onChange={(e) => setFormData({ ...formData, nominationType: e.target.value as PartyNominationType })}
                    className={inputClass}
                  >
                    <option value="self">Self Nomination</option>
                    <option value="other">Nominate Someone Else</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nominee Name *</label>
                  <input
                    required
                    disabled={formData.nominationType === 'self'}
                    value={
                      formData.nominationType === 'self'
                        ? userProfile?.name || user?.email?.split('@')[0] || ''
                        : formData.nomineeName
                    }
                    onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nominee Email</label>
                  <input
                    type="email"
                    disabled={formData.nominationType === 'self'}
                    value={formData.nominationType === 'self' ? user?.email || '' : formData.nomineeEmail}
                    onChange={(e) => setFormData({ ...formData, nomineeEmail: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nominee Phone</label>
                  <input
                    value={formData.nomineePhone}
                    onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Province *</label>
                  <select
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select province</option>
                    {zimbabweProvinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Area (Ward / Constituency) *</label>
                  <input
                    required
                    value={formData.areaLabel}
                    onChange={(e) => setFormData({ ...formData, areaLabel: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Motivation *</label>
                  <textarea
                    required
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    className={`${inputClass} min-h-[110px]`}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? 'Submitting...' : 'Submit Nomination'}
                  </button>
                </div>
              </form>
            )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Vote for Nominated Candidates</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Voting: <strong>{config.votingOpen ? 'Open' : 'Closed'}</strong> | Max per position:{' '}
                  <strong>{config.maxVotesPerPosition}</strong> | Your votes in this position:{' '}
                  <strong>{myVotesForSelectedPosition}</strong>
                </p>
              </div>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value as PartyPositionType)}
                className={inputClass}
              >
                {positions.map((position) => (
                  <option key={position.value} value={position.value}>
                    {position.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-slate-600">Loading candidates...</p>
            ) : visibleNominations.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No approved candidates available for this position yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {visibleNominations.map((nomination) => {
                  const isVoted = votedNominationIds.has(nomination.id)
                  const isHighlighted = nomination.id === highlightedNominationId
                  return (
                    <div
                      key={nomination.id}
                      id={`vote-nomination-${nomination.id}`}
                      className={`rounded-lg border p-4 sm:flex sm:items-center sm:justify-between ${
                        isHighlighted ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="text-base font-semibold text-slate-900">{nomination.nomineeName}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {nomination.province} • {nomination.areaLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Votes: {nomination.votesCount || 0}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => void copyShareVoteUrl(nomination)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Copy Vote Link
                        </button>
                        <button
                          type="button"
                          disabled={!config.votingOpen || voting === nomination.id}
                          onClick={() => void handleToggleVote(nomination.id)}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                            isVoted
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          } disabled:opacity-60`}
                        >
                          {voting === nomination.id ? 'Updating...' : isVoted ? 'Remove Vote' : 'Vote'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </section>
        </PartyLinkedDashboardShell>
      </AdminRoute>
    </ProtectedRoute>
  )
}
