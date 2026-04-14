'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { getSurveyById, submitSurveyResponse, getSurveyResponses, hasUserRespondedToSurvey } from '@/lib/firebase/firestore'
import { useAuth } from '@/contexts/AuthContext'
import type { Survey, SurveyQuestion, SurveyAnswer, SurveyResponse, SurveyCategory } from '@/types'

const categoryLabels: Record<SurveyCategory, string> = {
  governance: 'Governance',
  rights: 'Rights',
  community: 'Community',
  policy: 'Policy',
  general: 'General',
}

function ShareButtons({ title, surveyId }: { title: string; surveyId: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/surveys/${surveyId}` : ''
  const text = `${title}`

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500 mr-1">Share:</span>

      {/* X / Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        X
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </a>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        LinkedIn
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.132a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.757 8.25" />
        </svg>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}

export default function SurveyDetailPage() {
  const params = useParams()
  const surveyId = params.id as string
  const { user } = useAuth()

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Results state
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        setLoading(true)
        const surveyData = await getSurveyById(surveyId)
        setSurvey(surveyData)

        if (user && surveyData) {
          const responded = await hasUserRespondedToSurvey(surveyId, user.uid)
          setHasResponded(responded)
          if (responded || surveyData.status === 'closed') {
            setShowResults(true)
          }
        }

        if (surveyData?.status === 'closed') {
          setShowResults(true)
        }
      } catch (err) {
        console.error('Error loading survey:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSurvey()
  }, [surveyId, user])

  // Load results when showing results
  useEffect(() => {
    const loadResults = async () => {
      if (showResults && survey?.showResults) {
        try {
          const res = await getSurveyResponses(surveyId)
          setResponses(res)
        } catch (err) {
          console.error('Error loading results:', err)
        }
      }
    }
    loadResults()
  }, [showResults, survey, surveyId])

  const sortedQuestions = survey?.questions?.slice().sort((a, b) => a.order - b.order) || []

  const handleAnswerChange = useCallback((questionId: string, value: string | string[] | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  const handleCheckboxToggle = useCallback((questionId: string, option: string) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || []
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter(o => o !== option) }
      }
      return { ...prev, [questionId]: [...current, option] }
    })
  }, [])

  const isCurrentQuestionAnswered = () => {
    if (currentStep >= sortedQuestions.length) return true
    const question = sortedQuestions[currentStep]
    const answer = answers[question.id]
    if (!question.required) return true
    if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) return false
    return true
  }

  const canSubmit = () => {
    return sortedQuestions.every(q => {
      if (!q.required) return true
      const answer = answers[q.id]
      if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) return false
      return true
    })
  }

  const handleSubmit = async () => {
    if (!canSubmit()) {
      setError('Please answer all required questions.')
      return
    }

    if (!user && !survey?.isPublic) {
      setError('You must be logged in to submit this survey.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const surveyAnswers: SurveyAnswer[] = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }))

      await submitSurveyResponse({
        surveyId,
        userId: isAnonymous ? undefined : user?.uid,
        isAnonymous,
        answers: surveyAnswers,
      })

      setSubmitted(true)
      setHasResponded(true)

      if (survey?.showResults) {
        setShowResults(true)
        const res = await getSurveyResponses(surveyId)
        setResponses(res)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isClosed = survey?.status === 'closed' || (survey?.deadline && new Date(
    survey.deadline instanceof Date ? survey.deadline.getTime() : (survey.deadline as any)?.toMillis?.() || 0
  ) < new Date())

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Have Your Say</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Survey</h1>
            </div>
          </div>
        </section>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
            <p className="text-sm text-slate-500">Loading survey...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!survey) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Have Your Say</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Survey Not Found</h1>
            </div>
          </div>
        </section>
        <section className="bg-white py-10 sm:py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <p className="text-sm text-slate-500 mb-4">This survey may have been removed or is no longer available.</p>
            <Link href="/surveys" className="text-sm font-medium text-slate-900 hover:underline">
              ← Back to Surveys
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // Results view
  if (showResults && survey.showResults) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Survey Results</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">{survey.title}</h1>
              <p className="text-sm text-slate-300 sm:text-base">{survey.description}</p>
            </div>
          </div>
        </section>
        <section className="bg-white py-10 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Link href="/surveys" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
              ← Back to Surveys
            </Link>

            <div className="rounded-lg border bg-white p-6 sm:p-8">
              <div className="mb-6">
                <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 mb-2">
                  {categoryLabels[survey.category]}
                </span>
                <p className="mt-2 text-xs text-slate-400">{survey.responseCount} response{survey.responseCount !== 1 ? 's' : ''}</p>
                <div className="mt-4">
                  <ShareButtons title={survey.title} surveyId={surveyId} />
                </div>
              </div>

              {submitted && (
                <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-medium text-green-700">Thank you! Your response has been recorded.</p>
                </div>
              )}

              <h2 className="text-lg font-bold mb-4">Results</h2>

              {sortedQuestions.map((question) => (
                <div key={question.id} className="mb-6 rounded-lg border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold mb-3">{question.text}</h3>
                  <ResultsChart question={question} responses={responses} />
                </div>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // Already responded view (no public results)
  if (hasResponded) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Have Your Say</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Survey</h1>
            </div>
          </div>
        </section>
        <section className="bg-white py-10 sm:py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="rounded-lg border bg-white p-8">
              <div className="mb-4 text-4xl">✅</div>
              <h2 className="text-2xl font-bold mb-2">Already Submitted</h2>
              <p className="text-sm text-slate-500 mb-4">You have already responded to this survey. Thank you for your participation!</p>
              <div className="mb-4">
                <ShareButtons title={survey.title} surveyId={surveyId} />
              </div>
              <Link href="/surveys" className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                View Other Surveys
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // Closed survey view
  if (isClosed) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Have Your Say</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Survey Closed</h1>
            </div>
          </div>
        </section>
        <section className="bg-white py-10 sm:py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="rounded-lg border bg-white p-8">
              <div className="mb-4 text-4xl">🔒</div>
              <h2 className="text-2xl font-bold mb-2">Survey Closed</h2>
              <p className="text-sm text-slate-500 mb-4">This survey is no longer accepting responses.</p>
              <Link href="/surveys" className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                View Other Surveys
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // Submitted success view
  if (submitted && !survey.showResults) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <Header />
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Have Your Say</p>
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">Thank You!</h1>
            </div>
          </div>
        </section>
        <section className="bg-white py-10 sm:py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="rounded-lg border bg-white p-8">
              <div className="mb-4 text-4xl">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Response Recorded</h2>
              <p className="text-sm text-slate-500 mb-4">Your response has been recorded. Thank you for your participation!</p>
              <p className="text-xs text-slate-400 mb-3">Help spread the word:</p>
              <div className="mb-4">
                <ShareButtons title={survey.title} surveyId={surveyId} />
              </div>
              <Link href="/surveys" className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                View Other Surveys
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // Survey form
  const currentQuestion = sortedQuestions[currentStep]
  const isLastStep = currentStep === sortedQuestions.length - 1
  const progress = sortedQuestions.length > 0 ? Math.round(((currentStep + 1) / sortedQuestions.length) * 100) : 0

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-8 text-white sm:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{categoryLabels[survey.category]}</p>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">{survey.title}</h1>
            <p className="text-sm text-slate-300 sm:text-base">{survey.description}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link href="/surveys" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
            ← Back to Surveys
          </Link>

          <div className="rounded-lg border bg-white p-6 sm:p-8">
            {/* Share */}
            <div className="mb-6">
              <ShareButtons title={survey.title} surveyId={surveyId} />
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Question {currentStep + 1} of {sortedQuestions.length}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Not logged in warning */}
            {!user && !survey.isPublic && (
              <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-xs text-yellow-700">
                  You must be <Link href={`/login?returnUrl=${encodeURIComponent(`/surveys/${surveyId}`)}`} className="font-semibold underline">logged in</Link> to submit this survey.
                </p>
              </div>
            )}

            {/* Anonymous toggle */}
            {survey.allowAnonymous && user && (
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="anonymous" className="text-xs text-slate-600">Submit anonymously</label>
              </div>
            )}

            {/* Question */}
            {currentQuestion && (
              <div className="mb-6">
                <QuestionRenderer
                  question={currentQuestion}
                  value={answers[currentQuestion.id]}
                  onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  onCheckboxToggle={(option) => handleCheckboxToggle(currentQuestion.id, option)}
                />
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit() || (!user && !survey.isPublic)}
                  className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Survey'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(s => Math.min(sortedQuestions.length - 1, s + 1))}
                  disabled={!isCurrentQuestionAnswered()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

// Question Renderer Component
function QuestionRenderer({
  question,
  value,
  onChange,
  onCheckboxToggle,
}: {
  question: SurveyQuestion
  value: string | string[] | number | undefined
  onChange: (val: string | string[] | number) => void
  onCheckboxToggle: (option: string) => void
}) {
  return (
    <div>
      <h3 className="text-base font-semibold mb-1">
        {question.text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </h3>
      {question.description && (
        <p className="text-xs text-slate-500 mb-3">{question.description}</p>
      )}

      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                value === option ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4 text-slate-900"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'checkbox' && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                (value as string[] || []).includes(option) ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={(value as string[] || []).includes(option)}
                onChange={() => onCheckboxToggle(option)}
                className="h-4 w-4 rounded text-slate-900"
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'rating' && (
        <div className="flex items-center gap-2 mt-2">
          {Array.from(
            { length: (question.maxRating || 5) - (question.minRating || 1) + 1 },
            (_, i) => (question.minRating || 1) + i
          ).map((rating) => (
            <button
              key={rating}
              onClick={() => onChange(rating)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                value === rating
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      )}

      {question.type === 'yes_no' && (
        <div className="flex gap-3 mt-2">
          {['Yes', 'No'].map((option) => (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${
                value === option
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {question.type === 'short_text' && (
        <input
          type="text"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer..."
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
        />
      )}

      {question.type === 'long_text' && (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer..."
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none resize-none"
        />
      )}
    </div>
  )
}

// Results Chart Component
function ResultsChart({ question, responses }: { question: SurveyQuestion; responses: SurveyResponse[] }) {
  const answersForQuestion = responses
    .map(r => r.answers.find(a => a.questionId === question.id))
    .filter(Boolean)

  if (answersForQuestion.length === 0) {
    return <p className="text-xs text-slate-400">No responses yet.</p>
  }

  if (question.type === 'multiple_choice' || question.type === 'yes_no') {
    const counts: Record<string, number> = {}
    answersForQuestion.forEach(a => {
      const val = String(a!.value)
      counts[val] = (counts[val] || 0) + 1
    })
    const total = answersForQuestion.length
    const options = question.type === 'yes_no' ? ['Yes', 'No'] : (question.options || [])

    return (
      <div className="space-y-2">
        {options.map(option => {
          const count = counts[option] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={option}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-700">{option}</span>
                <span className="text-slate-500">{count} ({pct}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (question.type === 'checkbox') {
    const counts: Record<string, number> = {}
    answersForQuestion.forEach(a => {
      const vals = Array.isArray(a!.value) ? a!.value : [String(a!.value)]
      vals.forEach(v => {
        counts[v] = (counts[v] || 0) + 1
      })
    })
    const total = answersForQuestion.length

    return (
      <div className="space-y-2">
        {(question.options || []).map(option => {
          const count = counts[option] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={option}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-700">{option}</span>
                <span className="text-slate-500">{count} ({pct}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (question.type === 'rating') {
    const values = answersForQuestion.map(a => Number(a!.value)).filter(v => !isNaN(v))
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0'
    const counts: Record<number, number> = {}
    values.forEach(v => { counts[v] = (counts[v] || 0) + 1 })

    return (
      <div>
        <p className="text-2xl font-bold text-slate-900 mb-2">{avg} <span className="text-sm font-normal text-slate-500">avg rating</span></p>
        <div className="space-y-1">
          {Array.from({ length: (question.maxRating || 5) - (question.minRating || 1) + 1 }, (_, i) => (question.minRating || 1) + i).map(rating => {
            const count = counts[rating] || 0
            const pct = values.length > 0 ? Math.round((count / values.length) * 100) : 0
            return (
              <div key={rating} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right text-slate-500">{rating}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-slate-400">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // For text responses, show a summary
  if (question.type === 'short_text' || question.type === 'long_text') {
    return (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        <p className="text-xs text-slate-500 mb-2">{answersForQuestion.length} response{answersForQuestion.length !== 1 ? 's' : ''}</p>
        {answersForQuestion.slice(0, 10).map((a, i) => (
          <div key={i} className="rounded border border-slate-100 bg-slate-50 p-2">
            <p className="text-xs text-slate-700">{String(a!.value)}</p>
          </div>
        ))}
        {answersForQuestion.length > 10 && (
          <p className="text-xs text-slate-400">...and {answersForQuestion.length - 10} more</p>
        )}
      </div>
    )
  }

  return null
}

