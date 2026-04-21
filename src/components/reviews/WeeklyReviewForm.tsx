import { useState } from 'react'
import { useCreateWeeklyReview, useUpdateWeeklyReview, useProjects } from '../../lib/queries'
import { mondayOfCurrentWeek, cn } from '../../lib/utils'
import type { WeeklyReview, RecommendedAction } from '../../lib/supabase'

interface WeeklyReviewFormProps {
  existing?: WeeklyReview | null
  onClose?: () => void
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Primary project — max 1 */}
      <div>
        <label className="block text-[#64748b] text-xs uppercase tracking-wide mb-2">
          Primary Project <span className="text-red-400">*</span>
          <span className="ml-1 text-[#2a2d3a] normal-case tracking-normal">(max 1)</span>
        </label>
        <select
          value={primaryProjectId}
          onChange={e => setPrimaryProjectId(e.target.value)}
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#4ade80]/50"
        >
          <option value="">— Select primary project —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
          ))}
        </select>
      </div>

      {/* Secondary projects */}
      <div>
        <label className="block text-[#64748b] text-xs uppercase tracking-wide mb-2">
          Secondary Projects
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {projects
            .filter(p => p.id !== primaryProjectId)
            .map(p => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={secondaryIds.includes(p.id)}
                  onChange={() => toggleSecondary(p.id)}
                  className="accent-[#4ade80]"
                />
                <span className="text-sm text-[#64748b] group-hover:text-[#f1f5f9] transition-colors truncate">
                  {p.name}
                </span>
              </label>
            ))}
        </div>
      </div>

      {/* Textarea fields */}
      {[
        { label: 'What was completed', value: whatCompleted, setter: setWhatCompleted },
        { label: 'What failed / was blocked', value: whatFailed, setter: setWhatFailed },
        { label: 'Energy trend', value: energyTrend, setter: setEnergyTrend },
        { label: 'Key lessons', value: keyLessons, setter: setKeyLessons },
        { label: 'Next week focus', value: nextWeekFocus, setter: setNextWeekFocus },
      ].map(({ label, value, setter }) => (
        <div key={label}>
          <label className="block text-[#64748b] text-xs uppercase tracking-wide mb-1.5">
            {label}
          </label>
          <textarea
            value={value}
            onChange={e => setter(e.target.value)}
            rows={3}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#4ade80]/50 resize-none"
          />
        </div>
      ))}

      {/* Numeric fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[#64748b] text-xs uppercase tracking-wide mb-1.5">
            Completion rate (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={completionRate}
            onChange={e => setCompletionRate(e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#4ade80]/50"
          />
        </div>
        <div>
          <label className="block text-[#64748b] text-xs uppercase tracking-wide mb-1.5">
            Momentum score (1–10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={momentumScore}
            onChange={e => setMomentumScore(e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#4ade80]/50"
          />
        </div>
      </div>

      {/* Recommended action */}
      <div>
        <label className="block text-[#64748b] text-xs uppercase tracking-wide mb-2">
          Recommended Action
        </label>
        <div className="flex gap-2">
          {(['continue', 'shift', 'pause'] as RecommendedAction[]).map(action => (
            <button
              key={action}
              type="button"
              onClick={() => setRecommendedAction(recommendedAction === action ? '' : action)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                recommendedAction === action
                  ? action === 'continue'
                    ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40'
                    : action === 'shift'
                    ? 'bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/40'
                    : 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                  : 'bg-[#0f1117] text-[#64748b] border border-[#2a2d3a] hover:text-[#f1f5f9]'
              )}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30 rounded-lg py-2.5 text-sm font-medium hover:bg-[#4ade80]/30 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : existing ? 'Update Review' : 'Save Review'}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 text-[#64748b] hover:text-[#f1f5f9] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
