import CategorySection from './CategorySection'
import MomentumChart from './MomentumChart'
import PatternAlert from './PatternAlert'
import { getWeekRange, formatWeekRange, nowInSAST } from '../../lib/utils'
import {
  useProjects, useTasks, useThisWeekLogs, useCurrentWeekReview, usePatterns, useDailyLogs,
} from '../../lib/queries'
import type { Category } from '../../lib/supabase'
import { format, parseISO } from 'date-fns'

const CATEGORIES: Category[] = ['FOUNDATION', 'LEVERAGE', 'EXPRESSION']

const SURFACE = 'bg-[rgba(240,236,228,0.9)] border border-[rgba(139,127,109,0.15)] rounded-2xl'
const LABEL = 'text-[#8a7f6d] text-xs uppercase tracking-widest'

export default function WeeklyDashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: tasks = [], isLoading: loadingTasks } = useTasks()
  const { data: weekLogs = [] } = useThisWeekLogs()
  const { data: currentReview } = useCurrentWeekReview()
  const { data: patterns = [] } = usePatterns(true)
  const { data: recentLogs = [] } = useDailyLogs(5)

  const now = nowInSAST()
  const { start, end } = getWeekRange(now)

  const completedTasks = tasks.filter(t => t.status === 'completed')
  const activeTasks = tasks.filter(t => t.status !== 'dropped')
  const completionRate = activeTasks.length > 0
    ? Math.round((completedTasks.length / activeTasks.length) * 100)
    : 0

  const avgMomentum = weekLogs.length > 0
    ? (weekLogs.reduce((s, l) => s + (l.momentum_score ?? 0), 0) / weekLogs.length).toFixed(1)
    : '—'

  const logDates = new Set(recentLogs.map(l => l.date))
  let streak = 0
  let d = now
  while (true) {
    const ds = format(d, 'yyyy-MM-dd')
    if (logDates.has(ds)) {
      streak++
      d = new Date(d.getTime() - 86400000)
    } else break
  }

  if (loadingProjects || loadingTasks) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8a7f6d] tracking-wide">
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 space-y-10 animate-fade-in">

      {/* Hero — large concentric circle motif */}
      <div className="flex flex-col items-center text-center py-6">
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[rgba(92,122,92,0.08)]" />
          <div className="absolute inset-3 rounded-full border border-[rgba(92,122,92,0.13)]" />
          <div className="absolute inset-6 rounded-full border border-[rgba(92,122,92,0.22)]" />
          <div className="absolute inset-9 rounded-full border border-[rgba(92,122,92,0.35)]" />
          <div className="w-4 h-4 rounded-full bg-[rgba(92,122,92,0.25)] border border-[rgba(92,122,92,0.5)]" />
        </div>
        <h2 className="text-[#2b2b2b] text-2xl font-light tracking-[0.06em]">
          {formatWeekRange(start, end)}
        </h2>
        {currentReview?.primary_project_id && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[#8a7f6d] text-sm tracking-wide">Primary focus:</span>
            <span className="text-[#5c7a5c] text-sm">
              {projects.find(p => p.id === currentReview.primary_project_id)?.name ?? '—'}
            </span>
          </div>
        )}
      </div>

      {/* Stats — 4 spacious cards */}
      <div className="grid grid-cols-4 gap-5">
        {[
          { label: 'Completion', value: `${completionRate}%` },
          { label: 'Days Logged', value: `${weekLogs.length}/7` },
          { label: 'Avg Momentum', value: avgMomentum },
          { label: 'Streak', value: `${streak}d` },
        ].map(stat => (
          <div
            key={stat.label}
            className={`${SURFACE} p-6 text-center`}
          >
            <p className={LABEL}>{stat.label}</p>
            <p className="text-[#2b2b2b] text-3xl font-light mt-3">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Momentum chart — full width */}
      <div className={`${SURFACE} p-8`}>
        <p className={`${LABEL} mb-6`}>Momentum this week</p>
        <MomentumChart logs={weekLogs} />
      </div>

      {/* Category sections — full-width cards stacked */}
      <div className="space-y-5">
        {CATEGORIES.map(cat => (
          <CategorySection
            key={cat}
            category={cat}
            projects={projects}
            tasks={tasks}
            primaryProjectId={currentReview?.primary_project_id}
            secondaryProjectIds={currentReview?.secondary_project_ids}
          />
        ))}
      </div>

      {/* Bottom row — patterns + activity */}
      <div className="grid grid-cols-2 gap-5">
        {/* Patterns */}
        <div className={`${SURFACE} p-7`}>
          <p className={`${LABEL} mb-5`}>
            Patterns & Alerts
            {patterns.length > 0 && (
              <span className="ml-2 bg-[rgba(138,106,58,0.12)] text-[#8a6a3a] text-xs px-1.5 py-0.5 rounded-lg">
                {patterns.length}
              </span>
            )}
          </p>
          {patterns.length === 0 ? (
            <p className="text-[#8a7f6d] text-sm">No active patterns</p>
          ) : (
            <div className="space-y-3">
              {patterns.map(p => <PatternAlert key={p.id} pattern={p} />)}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className={`${SURFACE} p-7`}>
          <p className={`${LABEL} mb-5`}>Recent Activity</p>
          {recentLogs.length === 0 ? (
            <p className="text-[#8a7f6d] text-sm">No logs yet</p>
          ) : (
            <div className="space-y-1">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-start gap-4 py-3 border-b border-[rgba(139,127,109,0.08)] last:border-0">
                  <div className="text-[#8a7f6d] text-xs w-14 shrink-0 pt-0.5 tracking-wide">
                    {format(parseISO(log.date), 'EEE d')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      {log.momentum_score != null && (
                        <span className="text-[#5c7a5c] text-xs">
                          {log.momentum_score}/10
                        </span>
                      )}
                      {log.tasks_completed && (
                        <span className="text-[#8a7f6d] text-xs">
                          {log.tasks_completed.length} completed
                        </span>
                      )}
                    </div>
                    {log.key_insight && (
                      <p className="text-[#2b2b2b] text-xs mt-1 leading-relaxed">{log.key_insight}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
