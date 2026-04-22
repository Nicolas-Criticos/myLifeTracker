import { useState } from 'react'
import { useCreateWeeklyReview, useUpdateWeeklyReview, useProjects } from '../../lib/queries'
import { mondayOfCurrentWeek } from '../../lib/utils'
import type { WeeklyReview, RecommendedAction } from '../../lib/supabase'

interface WeeklyReviewFormProps {
  existing?: WeeklyReview | null
  onClose?: () => void
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  marginBottom: '8px',
}

const FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  padding: '8px 0 10px',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  fontWeight: 300,
  color: 'var(--ink)',
  outline: 'none',
  lineHeight: 1.6,
}

export default function WeeklyReviewForm({ existing, onClose }: WeeklyReviewFormProps) {
  const { data: projects = [] } = useProjects()
  const createReview = useCreateWeeklyReview()
  const updateReview = useUpdateWeeklyReview()

  const [primaryProjectId, setPrimaryProjectId] = useState(existing?.primary_project_id ?? '')
  const [secondaryIds, setSecondaryIds] = useState<string[]>(existing?.secondary_project_ids ?? [])
  const [whatCompleted, setWhatCompleted] = useState(existing?.what_completed ?? '')
  const [whatFailed, setWhatFailed] = useState(existing?.what_failed ?? '')
  const [energyTrend, setEnergyTrend] = useState(existing?.energy_trend ?? '')
  const [keyLessons, setKeyLessons] = useState(existing?.key_lessons ?? '')
  const [completionRate, setCompletionRate] = useState(existing?.completion_rate?.toString() ?? '')
  const [momentumScore, setMomentumScore] = useState(existing?.momentum_score?.toString() ?? '')
  const [nextWeekFocus, setNextWeekFocus] = useState(existing?.next_week_focus ?? '')
  const [recommendedAction, setRecommendedAction] = useState<RecommendedAction | ''>(
    existing?.recommended_action ?? ''
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      week_start: existing?.week_start ?? mondayOfCurrentWeek(),
      primary_project_id: primaryProjectId || null,
      secondary_project_ids: secondaryIds.length > 0 ? secondaryIds : null,
      what_completed: whatCompleted || null,
      what_failed: whatFailed || null,
      energy_trend: energyTrend || null,
      key_lessons: keyLessons || null,
      completion_rate: completionRate ? parseFloat(completionRate) : null,
      momentum_score: momentumScore ? parseFloat(momentumScore) : null,
      next_week_focus: nextWeekFocus || null,
      recommended_action: (recommendedAction || null) as RecommendedAction | null,
    }
    if (existing) {
      await updateReview.mutateAsync({ id: existing.id, ...payload })
    } else {
      await createReview.mutateAsync(payload)
    }
    onClose?.()
  }

  function toggleSecondary(id: string) {
    setSecondaryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const isPending = createReview.isPending || updateReview.isPending

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Primary project */}
      <div>
        <label style={LABEL_STYLE}>Primary Project</label>
        <select
          value={primaryProjectId}
          onChange={e => setPrimaryProjectId(e.target.value)}
          style={{ ...FIELD_STYLE, cursor: 'pointer' }}
        >
          <option value="">— None selected —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
          ))}
        </select>
      </div>

      {/* Secondary projects */}
      <div>
        <label style={LABEL_STYLE}>Secondary Projects</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          {projects
            .filter(p => p.id !== primaryProjectId)
            .map(p => {
              const checked = secondaryIds.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleSecondary(p.id)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.78rem',
                    fontWeight: 300,
                    color: checked ? 'var(--olive)' : 'var(--ink-muted)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${checked ? 'rgba(107,124,92,0.3)' : 'var(--border)'}`,
                    background: checked ? 'var(--olive-muted)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                >
                  {p.name}
                </button>
              )
            })}
        </div>
      </div>

      {/* Textarea fields */}
      {[
        { label: 'What was completed', value: whatCompleted, setter: setWhatCompleted, placeholder: 'Write freely about what you accomplished…' },
        { label: 'What failed or was blocked', value: whatFailed, setter: setWhatFailed, placeholder: 'Be honest — what didn\'t move?' },
        { label: 'Energy trend', value: energyTrend, setter: setEnergyTrend, placeholder: 'How did your energy feel this week?' },
        { label: 'Key lessons', value: keyLessons, setter: setKeyLessons, placeholder: 'What did you learn or notice?' },
        { label: 'Next week focus', value: nextWeekFocus, setter: setNextWeekFocus, placeholder: 'What matters most heading into next week?' },
      ].map(({ label, value, setter, placeholder }) => (
        <div key={label}>
          <label style={LABEL_STYLE}>{label}</label>
          <textarea
            value={value}
            onChange={e => setter(e.target.value)}
            rows={3}
            placeholder={placeholder}
            style={{
              ...FIELD_STYLE,
              resize: 'none',
              display: 'block',
            } as React.CSSProperties}
          />
        </div>
      ))}

      {/* Numeric fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <label style={LABEL_STYLE}>Completion rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={completionRate}
            onChange={e => setCompletionRate(e.target.value)}
            style={FIELD_STYLE}
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>Momentum score (1–10)</label>
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={momentumScore}
            onChange={e => setMomentumScore(e.target.value)}
            style={FIELD_STYLE}
          />
        </div>
      </div>

      {/* Recommended action */}
      <div>
        <label style={LABEL_STYLE}>Recommended Action</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          {(['continue', 'shift', 'pause'] as RecommendedAction[]).map(action => {
            const isActive = recommendedAction === action
            const actionColors: Record<RecommendedAction, { active: string; border: string; text: string }> = {
              continue: { active: 'var(--olive-muted)',           border: 'rgba(107,124,92,0.3)',  text: 'var(--olive)' },
              shift:    { active: 'rgba(74,107,138,0.12)',        border: 'rgba(74,107,138,0.3)',  text: 'var(--leverage)' },
              pause:    { active: 'var(--gold-muted)',            border: 'rgba(201,168,76,0.3)',  text: 'var(--gold)' },
            }
            const ac = actionColors[action]
            return (
              <button
                key={action}
                type="button"
                onClick={() => setRecommendedAction(isActive ? '' : action)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-full)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.68rem',
                  fontWeight: 400,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  border: `1px solid ${isActive ? ac.border : 'var(--border)'}`,
                  background: isActive ? ac.active : 'transparent',
                  color: isActive ? ac.text : 'var(--ink-muted)',
                }}
              >
                {action}
              </button>
            )
          })}
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', paddingTop: '8px' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            flex: 1,
            background: 'var(--olive)',
            color: 'rgba(255,252,245,0.9)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '14px 28px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            fontWeight: 400,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
            transition: 'opacity 200ms',
          }}
        >
          {isPending ? 'Saving…' : existing ? 'Update Review' : 'Save Review'}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              padding: '8px 16px',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
