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

export default function WeeklyDashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: tasks = [], isLoading: loadingTasks } = useTasks()
  const { data: weekLogs = [] } = useThisWeekLogs()
  const { data: currentReview } = useCurrentWeekReview()
  const { data: patterns = [] } = usePatterns(true)
  const { data: recentLogs = [] } = useDailyLogs(5)

  const now = nowInSAST()
  const { start, end } = getWeekRange(now)

  // Stats
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const activeTasks = tasks.filter(t => t.status !== 'dropped')
  const completionRate = activeTasks.length > 0
    ? Math.round((completedTasks.length / activeTasks.length) * 100)
    : 0

  const avgMomentum = weekLogs.length > 0
    ? (weekLogs.reduce((s, l) => s + (l.momentum_score ?? 0), 0) / weekLogs.length).toFixed(1)
    : '—'

  // Streak: consecutive days logged (from today backwards)
  const logDates = new Set(recentLogs.map(l => l.date))
  let streak = 0
  let d = now
  while (true) {
    const ds = format(d, 'yyyy-MM-dd')
    if (logDates.has(ds)) {
      streak++
      d = new Date(d.getTime() - 86400000)
    } else {
      break
    }
  }

  if (loadingProjects || loadingTasks) {
    return (
      <div className="flex items-center justify-center h-64 text-[#64748b]">
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-baseline gap-3">
          <h2 className="text-[#f1f5f9] text-xl font-semibold">
            Week of {formatWeekRange(start, end)}
          </h2>
        </div>
        {currentReview?.primary_project_id && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[#64748b] text-sm">Primary:</span>
            <span className="text-[#4ade80] text-sm font-medium">
              {projects.find(p => p.id === currentReview.primary_project_id)?.name ?? '—'}
            </span>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Completion', value: `${completionRate}%` },
          { label: 'Days Logged', value: `${weekLogs.length}/7` },
          { label: 'Avg Momentum', value: avgMomentum },
          { label: 'Streak', value: `${streak}d` },
        ].map(stat => (
          <div key={stat.label} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-[#64748b] text-xs uppercase tracking-wide">{stat.label}</p>
            <p className="text-[#f1f5f9] text-2xl font-semibold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Momentum chart */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
        <p className="text-[#64748b] text-xs uppercase tracking-wide mb-3">Momentum this week</p>
        <MomentumChart logs={weekLogs} />
      </div>

      {/* 3-column category view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Bottom row: patterns + activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patterns */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
          <p className="text-[#64748b] text-xs uppercase tracking-wide mb-3">
            Patterns & Alerts
            {patterns.length > 0 && (
              <span className="ml-2 bg-amber-400/20 text-amber-400 text-xs px-1.5 py-0.5 rounded">
                {patterns.length}
              </span>
            )}
          </p>
          {patterns.length === 0 ? (
            <p className="text-[#64748b] text-sm">No active patterns</p>
          ) : (
            <div className="space-y-2">
              {patterns.map(p => (
                <PatternAlert key={p.id} pattern={p} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
          <p className="text-[#64748b] text-xs uppercase tracking-wide mb-3">Recent Activity</p>
          {recentLogs.length === 0 ? (
            <p className="text-[#64748b] text-sm">No logs yet</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-[#2a2d3a] last:border-0">
                  <div className="text-[#64748b] text-xs w-16 shrink-0 pt-0.5">
                    {format(parseISO(log.date), 'EEE d')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {log.momentum_score != null && (
                        <span className="text-[#4ade80] text-xs font-medium">
                          {log.momentum_score}/10
                        </span>
                      )}
                      {log.tasks_completed && (
                        <span className="text-[#64748b] text-xs">
                          {log.tasks_completed.length} completed
                        </span>
                      )}
                    </div>
                    {log.key_insight && (
                      <p className="text-[#f1f5f9] text-xs mt-0.5 truncate">{log.key_insight}</p>
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
