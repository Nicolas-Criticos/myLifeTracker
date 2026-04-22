import { useState } from 'react'
import WeeklyReviewForm from '../components/reviews/WeeklyReviewForm'
import WeeklyReviewHistory from '../components/reviews/WeeklyReviewHistory'
import { useWeeklyReviews, useCurrentWeekReview } from '../lib/queries'
import { formatWeekRange, getWeekRange, nowInSAST } from '../lib/utils'

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

export default function Reviews() {
  const { data: reviews = [], isLoading } = useWeeklyReviews()
  const { data: currentReview } = useCurrentWeekReview()
  const [showForm, setShowForm] = useState(false)

  const now = nowInSAST()
  const { start, end } = getWeekRange(now)

  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

      {/* Page title */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.6rem',
          color: 'var(--ink)',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}>
          Weekly Reviews
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Reflection keeps you honest with yourself.
        </p>
      </div>

      {/* Current week */}
      <div className="card" style={{ marginBottom: '48px', padding: '32px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: currentReview || showForm ? '28px' : '0' }}>
          <div>
            <p style={LABEL}>Current Week</p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: '1.1rem',
              color: 'var(--ink)',
              letterSpacing: '0.04em',
              marginTop: '6px',
            }}>
              {formatWeekRange(start, end)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentReview ? (
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.65rem',
                fontWeight: 400,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--olive)',
                background: 'var(--olive-muted)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
              }}>
                Submitted
              </span>
            ) : (
              <button
                onClick={() => setShowForm(s => !s)}
                style={{
                  background: showForm ? 'transparent' : 'var(--olive)',
                  color: showForm ? 'var(--ink-muted)' : 'rgba(255,252,245,0.9)',
                  border: showForm ? '1px solid var(--border)' : 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '10px 24px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.68rem',
                  fontWeight: 400,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
              >
                {showForm ? 'Cancel' : 'Write Review'}
              </button>
            )}
          </div>
        </div>

        {showForm && !currentReview && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
            <WeeklyReviewForm onClose={() => setShowForm(false)} />
          </div>
        )}
        {currentReview && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
            <WeeklyReviewForm existing={currentReview} onClose={() => {}} />
          </div>
        )}

        {!showForm && !currentReview && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.875rem',
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            Your first weekly review is waiting to be written.
          </p>
        )}
      </div>

      {/* History */}
      <div>
        <p style={{ ...LABEL, marginBottom: '20px' }}>Review History</p>
        {isLoading ? (
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            Loading…
          </p>
        ) : (
          <WeeklyReviewHistory reviews={reviews} />
        )}
      </div>

    </div>
  )
}
