import { useState } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { useProjects } from '../../lib/queries'
import type { WeeklyReview } from '../../lib/supabase'
import WeeklyReviewForm from './WeeklyReviewForm'

interface WeeklyReviewHistoryProps {
  reviews: WeeklyReview[]
}

const actionStyle: Record<string, { bg: string; text: string }> = {
  continue: { bg: 'var(--olive-muted)',          text: 'var(--olive)' },
  shift:    { bg: 'rgba(74,107,138,0.12)',        text: 'var(--leverage)' },
  pause:    { bg: 'var(--gold-muted)',            text: 'var(--gold)' },
}

export default function WeeklyReviewHistory({ reviews }: WeeklyReviewHistoryProps) {
  const { data: projects = [] } = useProjects()
  const [editing, setEditing] = useState<string | null>(null)

  if (reviews.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.95rem',
          color: 'var(--ink-muted)',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}>
          Your first weekly review is waiting to be written.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {reviews.map(review => {
        const weekEnd = addDays(parseISO(review.week_start), 6)
        const primary = projects.find(p => p.id === review.primary_project_id)
        const isEditing = editing === review.id
        const ac = review.recommended_action ? actionStyle[review.recommended_action] : null

        return (
          <div
            key={review.id}
            className="card"
            style={{ padding: '24px 28px', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              <div>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  fontSize: '1.05rem',
                  color: 'var(--ink)',
                  letterSpacing: '0.04em',
                }}>
                  {format(parseISO(review.week_start), 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
                </p>
                {primary && (
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    fontSize: '0.78rem',
                    color: 'var(--ink-muted)',
                    marginTop: '3px',
                  }}>
                    {primary.name}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {review.completion_rate != null && (
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    fontWeight: 300,
                    color: 'var(--ink)',
                  }}>
                    {Math.round(review.completion_rate)}%
                  </span>
                )}
                {ac && review.recommended_action && (
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.62rem',
                    fontWeight: 400,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: ac.text,
                    background: ac.bg,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    {review.recommended_action}
                  </span>
                )}
                <button
                  onClick={() => setEditing(isEditing ? null : review.id)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.68rem',
                    fontWeight: 300,
                    color: 'var(--ink-muted)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    transition: 'all 200ms',
                    letterSpacing: '0.04em',
                  }}
                >
                  {isEditing ? 'Close' : 'Edit'}
                </button>
              </div>
            </div>

            {/* Body — read view */}
            {!isEditing && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                {review.what_completed && (
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6rem',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '6px',
                    }}>Completed</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {review.what_completed}
                    </p>
                  </div>
                )}
                {review.what_failed && (
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6rem',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '6px',
                    }}>Blocked</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {review.what_failed}
                    </p>
                  </div>
                )}
                {review.key_lessons && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6rem',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '6px',
                    }}>Key Lessons</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {review.key_lessons}
                    </p>
                  </div>
                )}
                {review.next_week_focus && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6rem',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '6px',
                    }}>Next Week</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {review.next_week_focus}
                    </p>
                  </div>
                )}
                {review.momentum_score != null && (
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6rem',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      marginBottom: '6px',
                    }}>Momentum</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 300, color: 'var(--ink)' }}>
                      {review.momentum_score}/10
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Edit form */}
            {isEditing && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <WeeklyReviewForm existing={review} onClose={() => setEditing(null)} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
