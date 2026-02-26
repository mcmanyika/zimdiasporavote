'use client'

import { useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import DashboardNav from '@/app/components/DashboardNav'
import { useAuth } from '@/contexts/AuthContext'
import {
  getYouthProfile,
  getYouthMissions,
  getYouthMissionSubmissionsByUser,
  submitYouthMission,
  upsertYouthProfile,
} from '@/lib/firebase/firestore'
import type { YouthAgeBand, YouthMission, YouthMissionCategory, YouthMissionSubmission } from '@/types'

const AGE_BANDS: { value: YouthAgeBand; label: string }[] = [
  { value: 'under_18', label: 'Under 18' },
  { value: '18_21', label: '18 - 21' },
  { value: '22_25', label: '22 - 25' },
  { value: '26_30', label: '26 - 30' },
  { value: '31_plus', label: '31+' },
]

const CATEGORY_LABELS: Record<YouthMissionCategory, string> = {
  civic_education: 'Civic Education',
  mobilization: 'Mobilization',
  digital_advocacy: 'Digital Advocacy',
  community_service: 'Community Service',
  leadership: 'Leadership',
}

function formatDate(date?: Date | any): string {
  if (!date) return '-'
  const d = date instanceof Date ? date : date?.toDate?.() || new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-ZW', { year: 'numeric', month: 'short', day: 'numeric' })
}

function YouthHubContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [submittingMissionId, setSubmittingMissionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [missions, setMissions] = useState<YouthMission[]>([])
  const [submissions, setSubmissions] = useState<YouthMissionSubmission[]>([])

  const [ageBand, setAgeBand] = useState<YouthAgeBand>('18_21')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [institution, setInstitution] = useState('')
  const [interestsInput, setInterestsInput] = useState('')
  const [goals, setGoals] = useState('')

  const [openMissionId, setOpenMissionId] = useState<string | null>(null)
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [submissionProofUrl, setSubmissionProofUrl] = useState('')

  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const [profile, missionData, submissionData] = await Promise.all([
        getYouthProfile(user.uid),
        getYouthMissions(true),
        getYouthMissionSubmissionsByUser(user.uid),
      ])
      setMissions(missionData)
      setSubmissions(submissionData)

      if (profile) {
        setAgeBand(profile.ageBand)
        setProvince(profile.province || '')
        setDistrict(profile.district || '')
        setInstitution(profile.institution || '')
        setInterestsInput((profile.interests || []).join(', '))
        setGoals(profile.goals || '')
      }
    } catch (err: any) {
      console.error('Error loading youth hub:', err)
      setError(err.message || 'Failed to load youth module')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.uid])

  const submittedMissionIds = useMemo(
    () => new Set(submissions.map((s) => s.missionId)),
    [submissions]
  )

  const completedPoints = useMemo(
    () =>
      submissions.reduce((sum, submission) => {
        const mission = missions.find((m) => m.id === submission.missionId)
        return sum + (mission?.points || 0)
      }, 0),
    [submissions, missions]
  )

  const handleSaveProfile = async () => {
    if (!user) return
    if (!province.trim()) {
      setError('Province is required.')
      return
    }

    try {
      setError('')
      setSuccess('')
      setSavingProfile(true)
      const interests = interestsInput
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)

      await upsertYouthProfile(user.uid, {
        ageBand,
        province: province.trim(),
        district: district.trim() || undefined,
        institution: institution.trim() || undefined,
        interests,
        goals: goals.trim() || undefined,
      })
      setSuccess('Youth profile saved successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to save youth profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSubmitMission = async (missionId: string) => {
    if (!user) return
    try {
      setError('')
      setSuccess('')
      setSubmittingMissionId(missionId)
      await submitYouthMission(missionId, user.uid, {
        notes: submissionNotes.trim() || undefined,
        proofUrl: submissionProofUrl.trim() || undefined,
      })
      setSuccess('Mission submitted. Keep up the momentum!')
      setOpenMissionId(null)
      setSubmissionNotes('')
      setSubmissionProofUrl('')
      const latest = await getYouthMissionSubmissionsByUser(user.uid)
      setSubmissions(latest)
    } catch (err: any) {
      setError(err.message || 'Failed to submit mission')
    } finally {
      setSubmittingMissionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent" />
          <p className="text-sm text-slate-500">Loading youth hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Youth Action Hub</h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete your youth profile, take civic missions, and track your impact.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Missions Completed</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{submissions.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Impact Points</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{completedPoints}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">Active Missions</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{missions.length}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Youth Profile</h2>
          <p className="mt-1 text-sm text-slate-500">This helps us personalize missions and local opportunities.</p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Age Band</label>
              <select
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value as YouthAgeBand)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {AGE_BANDS.map((band) => (
                  <option key={band.value} value={band.value}>
                    {band.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Province *</label>
              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. Harare"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">District</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. Mbare"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Institution</label>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="School / College / Workplace"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Interests (comma separated)</label>
            <input
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="Civic education, digital advocacy, community mobilization"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Goals</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="What civic impact do you want to make this month?"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Youth Missions</h2>
          <p className="mt-1 text-sm text-slate-500">Small actions. Real constitutional impact.</p>

          {missions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No active missions right now. Check back soon.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {missions.map((mission) => {
                const submitted = submittedMissionIds.has(mission.id)
                const isOpen = openMissionId === mission.id
                return (
                  <div key={mission.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{mission.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {CATEGORY_LABELS[mission.category]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{mission.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                      <span>{mission.points} pts</span>
                      <span>~{mission.estimatedMinutes} mins</span>
                      {mission.dueDate && <span>Due {formatDate(mission.dueDate)}</span>}
                    </div>

                    {submitted ? (
                      <p className="mt-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Submitted
                      </p>
                    ) : (
                      <div className="mt-3">
                        {!isOpen ? (
                          <button
                            onClick={() => setOpenMissionId(mission.id)}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Submit Mission
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              value={submissionNotes}
                              onChange={(e) => setSubmissionNotes(e.target.value)}
                              rows={3}
                              placeholder="Optional notes about what you completed"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            <input
                              value={submissionProofUrl}
                              onChange={(e) => setSubmissionProofUrl(e.target.value)}
                              placeholder="Optional proof link (e.g. post URL)"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSubmitMission(mission.id)}
                                disabled={submittingMissionId === mission.id}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                              >
                                {submittingMissionId === mission.id ? 'Submitting...' : 'Confirm Submit'}
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMissionId(null)
                                  setSubmissionNotes('')
                                  setSubmissionProofUrl('')
                                }}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function YouthHubPage() {
  return (
    <ProtectedRoute>
      <YouthHubContent />
    </ProtectedRoute>
  )
}
