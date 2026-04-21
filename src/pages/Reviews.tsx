import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import WeeklyReviewForm from '../components/reviews/WeeklyReviewForm'
import WeeklyReviewHistory from '../components/reviews/WeeklyReviewHistory'
import { useWeeklyReviews, useCurrentWeekReview } from '../lib/queries'
import { formatWeekRange, getWeekRange, nowInSAST } from '../lib/utils'

export default function Reviews() {
  const { data: reviews = [], isLoading } = useWeeklyReviews()
  const { data: currentReview } = useCurrentWeekReview()
  const [showForm, setShowForm] = useState(false)

  const now = nowInSAST()
  const { start, end } = getWeekRange(now)

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Weekly Reviews" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* This week */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#64748b] text-xs uppercase tracking-wide">Current Week</p>
              <p className="text-[#f1f5f9] text-sm font-medium mt-0.5">
                {formatWeekRange(start, end)}
              </p>
            </div>
            {!currentReview && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="text-sm bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 px-4 py-2 rounded-lg hover:bg-[#4ade80]/20 transition-colors"
              >
                {showForm ? 'Cancel' : '+ Submit Review'}
              </button>
            )}
            {currentReview && (
              <span className="text-xs bg-[#4ade80]/20 text-[#4ade80] px-2 py-1 rounded">
                Review submitted
              </span>
            )}
          </div>

          {showForm && !currentReview && (
            <WeeklyReviewForm onClose={() => setShowForm(false)} />
          )}
          {currentReview && (
            <WeeklyReviewForm existing={currentReview} onClose={() => {}} />
          )}
        </div>

        {/* History */}
        <div>
          <p className="text-[#64748b] text-xs uppercase tracking-wide mb-3">Review History</p>
          {isLoading ? (
            <div className="text-[#64748b] text-sm">Loading…</div>
          ) : (
            <WeeklyReviewHistory reviews={reviews} />
          )}
        </div>
      </main>
    </div>
  )
}
