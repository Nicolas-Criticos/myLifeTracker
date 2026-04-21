import { useState } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { useProjects } from '../../lib/queries'
import { cn } from '../../lib/utils'
import type { WeeklyReview } from '../../lib/supabase'
import WeeklyReviewForm from './WeeklyReviewForm'

interface WeeklyReviewHistoryProps {
  reviews: WeeklyReview[]
}

const actionColors: Record<string, string> = {
  continue: 'bg-[#4ade80]/20 text-[#4ade80]',
  shift: 'bg-[#60a5fa]/20 text-[#60a5fa]',
  pause: 'bg-amber-400/20 text-amber-400',
}

export default function WeeklyReviewHistory({ reviews }: WeeklyReviewHistoryProps) {
  const { data: projects = [] } = useProjects()
  const [editing, setEditing] = useState<string | null>(null)

  if (reviews.length === 0) {
    return <p className="text-[#64748b] text-sm py-8 text-center">No reviews yet</p>
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => {
        const weekEnd = addDays(parseISO(review.week_start), 6)
        const primary = projects.find(p => p.id === review.primary_project_id)
        const isEditing = editing === review.id

        return (
          <div key={review.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="text-[#f1f5f9] text-sm font-medium">
                  {format(parseISO(review.week_start), 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
                </p>
                {primary && (
                  <p className="text-[#64748b] text-xs mt-0.5">Primary: {primary.name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {review.completion_rate != null && (
                  <span className="text-[#f1f5f9] text-sm font-semibold">
                    {Math.round(review.completion_rate)}%
                  </span>
                )}
                {review.recommended_action && (
                  <span className={cn('text-xs px-2 py-1 rounded capitalize font-medium', actionColors[review.recommended_action] ?? 'bg-[#2a2d3a] text-[#64748b]')}>
                    {review.recommended_action}
                  </span>
                )}
                <button
                  onClick={() => setEditing(isEditing ? null : review.id)}
                  className="text-xs text-[#64748b] hover:text-[#f1f5f9] px-2 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  {isEditing ? 'Close' : 'Edit'}
                </button>
              </div>
            </div>

            {/* Body */}
            {!isEditing && (
              <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {review.what_completed && (
                  <div>
                    <p className="text-[#64748b] text-xs uppercase tracking-wide mb-1">Completed</p>
                    <p className="text-[#f1f5f9] text-sm whitespace-pre-line">{review.what_completed}</p>
                  </div>
                )}
                {review.what_failed && (
                  <div>
                    <p className="text-[#64748b] text-xs uppercase tracking-wide mb-1">Failed / Blocked</p>
                    <p className="text-[#f1f5f9] text-sm whitespace-pre-line">{review.what_failed}</p>
                  </div>
                )}
                {review.key_lessons && (
                  <div className="md:col-span-2">
                    <p className="text-[#64748b] text-xs uppercase tracking-wide mb-1">Key Lessons</p>
                    <p className="text-[#f1f5f9] text-sm whitespace-pre-line">{review.key_lessons}</p>
                  </div>
                )}
                {review.next_week_focus && (
                  <div className="md:col-span-2">
                    <p className="text-[#64748b] text-xs uppercase tracking-wide mb-1">Next Week</p>
                    <p className="text-[#f1f5f9] text-sm whitespace-pre-line">{review.next_week_focus}</p>
                  </div>
                )}
                {review.momentum_score != null && (
                  <div>
                    <p className="text-[#64748b] text-xs uppercase tracking-wide mb-1">Momentum</p>
                    <p className="text-[#f1f5f9] text-sm">{review.momentum_score}/10</p>
                  </div>
                )}
              </div>
            )}

            {/* Edit form */}
            {isEditing && (
              <div className="px-4 pb-4 border-t border-[#2a2d3a] pt-4">
                <WeeklyReviewForm existing={review} onClose={() => setEditing(null)} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
