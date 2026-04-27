import CategorySection from './CategorySection'
import MomentumChart from './MomentumChart'
import PatternAlert from './PatternAlert'
import ReadingList from './ReadingList'
import { getWeekRange, formatWeekRange, nowInSAST } from '../../lib/utils'
import {
  useProjects, useTasks, useThisWeekLogs, useCurrentWeekReview, usePatterns, useDailyLogs,
  useThisWeekTasks, useThisWeekCheckins, usePreviousWeekCheckins, useThisWeekSales, usePreviousWeekSales,
} from '../../lib/queries'
import type { Category } from '../../lib/supabase'
import { format, parseISO } from 'date-fns'

const CATEGORIES: Category[] = ['FOUNDATION', 'LEVERAGE', 'EXPRESSION']

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.65rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

export default function WeeklyDashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: tasks = [], isLoading: loadingTasks } = useTasks()
  const { data: weekLogs = [] } = useThisWeekLogs()
  const { data: currentReview } = useCurrentWeekReview()
  const { data: patterns = [] } = usePatterns(true)
  const { data: recentLogs = [] } = useDailyLogs(5)
  const { data: thisWeekTasks = [] } = useThisWeekTasks()
  const { data: thisWeekCheckins = [] } = useThisWeekCheckins()
  const { data: prevWeekCheckins = [] } = usePreviousWeekCheckins()
  const { data: thisWeekSales = [] } = useThisWeekSales()
  const { data: prevWeekSales = [] } = usePreviousWeekSales()

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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '256px',
        fontFamily: 'var(--font-display)',
        fontWeight: 300,
        fontSize: '1.1rem',
        color: 'var(--ink-muted)',
        letterSpacing: '0.05em',
      }}>
        Loading…
      </div>
    )
  }

  // ── Two Dashboards derived values ──────────────────────────────────────────

  const totalSalesThisWeek = thisWeekSales.reduce((s, sale) => s + sale.units * sale.sell_price_actual, 0)
  const totalSalesPrevWeek = prevWeekSales.reduce((s, sale) => s + sale.units * sale.sell_price_actual, 0)
  const revenueDiff = totalSalesThisWeek - totalSalesPrevWeek
  const revenueTrendLabel = totalSalesPrevWeek === 0 && totalSalesThisWeek === 0
    ? 'no sales data yet'
    : totalSalesPrevWeek === 0
      ? 'first week tracked'
      : revenueDiff > 0
        ? `↑ R${revenueDiff.toFixed(0)} vs last week`
        : revenueDiff < 0
          ? `↓ R${Math.abs(revenueDiff).toFixed(0)} vs last week`
          : 'flat vs last week'

  const activeProjectsCount = projects.filter(p => p.status === 'active').length
  const tasksCompletedThisWeek = thisWeekTasks.filter(t => t.status === 'completed').length

  const computeAvg = (values: (number | null)[]) => {
    const valid = values.filter((v): v is number => v != null)
    return valid.length > 0 ? (valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(1) : '—'
  }

  const avgEnergy = computeAvg(thisWeekCheckins.map(c => c.energy_level))
  const avgFocus  = computeAvg(thisWeekCheckins.map(c => c.focus_level))
  const avgPeace  = computeAvg(thisWeekCheckins.map(c => c.peace_level))
  const checkinDaysThisWeek = thisWeekCheckins.length
  const noCheckinData = thisWeekCheckins.length === 0

  const prevAvgEnergy = prevWeekCheckins.length > 0
    ? prevWeekCheckins.reduce((s, c) => s + c.energy_level, 0) / prevWeekCheckins.length
    : null
  const thisAvgEnergy = thisWeekCheckins.length > 0
    ? thisWeekCheckins.reduce((s, c) => s + c.energy_level, 0) / thisWeekCheckins.length
    : null
  const humanTrend = prevAvgEnergy == null || thisAvgEnergy == null
    ? 'no prior data'
    : thisAvgEnergy > prevAvgEnergy + 0.3
      ? 'trending up'
      : thisAvgEnergy < prevAvgEnergy - 0.3
        ? 'trending down'
        : 'holding steady'

  const latestKeyInsight = recentLogs[0]?.key_insight ?? null

  const stats = [
    { label: 'Completion',    value: `${completionRate}%` },
    { label: 'Days Logged',   value: `${weekLogs.length}/7` },
    { label: 'Avg Momentum',  value: avgMomentum },
    { label: 'Streak',        value: `${streak}d` },
  ]

  const primaryProject = currentReview?.primary_project_id
    ? projects.find(p => p.id === currentReview.primary_project_id)
    : null

  return (
    <>
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 40px 80px' }}>

      {/* Hero */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '80px',
        paddingBottom: '60px',
        textAlign: 'center',
      }}>
        <svg width="120" height="120" fill="none" viewBox="0 0 120 120" style={{ marginBottom: '32px' }}>
          <circle cx="60" cy="60" r="58" stroke="rgba(107,124,92,0.06)" strokeWidth="1" />
          <circle cx="60" cy="60" r="45" stroke="rgba(107,124,92,0.1)"  strokeWidth="1" />
          <circle cx="60" cy="60" r="32" stroke="rgba(107,124,92,0.18)" strokeWidth="1" />
          <circle cx="60" cy="60" r="18" stroke="rgba(107,124,92,0.28)" strokeWidth="1" />
          <circle cx="60" cy="60" r="5"  fill="rgba(107,124,92,0.35)" />
        </svg>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '2rem',
          color: 'var(--ink)',
          letterSpacing: '0.04em',
          margin: 0,
        }}>
          {formatWeekRange(start, end)}
        </h2>
        {primaryProject && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.82rem',
            color: 'var(--ink-muted)',
            marginTop: '10px',
            letterSpacing: '0.05em',
          }}>
            {primaryProject.name}
          </p>
        )}
      </div>

      {/* Stats row — 4 floating cards */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {stats.map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <p style={{ ...LABEL, marginBottom: '12px' }}>{stat.label}</p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3rem',
              fontWeight: 300,
              color: 'var(--ink)',
              lineHeight: 1,
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Two Dashboards — The Numbers vs The Human */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>

        {/* Left: The Numbers */}
        <div className="card" style={{
          padding: '32px',
          borderColor: 'rgba(107,124,92,0.4)',
          background: 'rgba(255,252,245,0.75)',
          backdropFilter: 'blur(12px)',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.58rem',
            fontWeight: 300,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(107,124,92,0.85)',
            marginBottom: '28px',
          }}>The Numbers</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <p style={{ ...LABEL, marginBottom: '6px' }}>Total Sales</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.6rem',
                fontWeight: 300,
                color: 'var(--ink)',
                lineHeight: 1,
              }}>
                R{totalSalesThisWeek.toFixed(0)}
              </p>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                fontWeight: 300,
                color: 'var(--ink-muted)',
                marginTop: '6px',
                letterSpacing: '0.02em',
              }}>
                {revenueTrendLabel}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ ...LABEL, marginBottom: '6px' }}>Active Projects</p>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 300,
                  color: 'var(--ink)',
                  lineHeight: 1,
                }}>
                  {activeProjectsCount}
                </p>
              </div>
              <div>
                <p style={{ ...LABEL, marginBottom: '6px' }}>Tasks Done</p>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 300,
                  color: 'var(--ink)',
                  lineHeight: 1,
                }}>
                  {tasksCompletedThisWeek}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: The Human */}
        <div className="card" style={{
          padding: '32px',
          borderColor: 'rgba(195,162,97,0.45)',
          background: 'rgba(255,252,245,0.75)',
          backdropFilter: 'blur(12px)',
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.58rem',
            fontWeight: 300,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(195,162,97,0.95)',
            marginBottom: '28px',
          }}>The Human</p>

          {noCheckinData ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
              lineHeight: 1.7,
            }}>
              Check in with Tracey to start seeing your human dashboard.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {([
                  { label: 'Energy', value: avgEnergy },
                  { label: 'Focus',  value: avgFocus  },
                  { label: 'Peace',  value: avgPeace  },
                ] as const).map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ ...LABEL, marginBottom: '6px' }}>{label}</p>
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2rem',
                      fontWeight: 300,
                      color: 'var(--ink)',
                      lineHeight: 1,
                    }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ ...LABEL, marginBottom: '6px' }}>Days Logged</p>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.5rem',
                    fontWeight: 300,
                    color: 'var(--ink)',
                    lineHeight: 1,
                  }}>
                    {checkinDaysThisWeek}/7
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ ...LABEL, marginBottom: '4px' }}>Week Trend</p>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    fontWeight: 300,
                    color: 'var(--ink-muted)',
                    fontStyle: 'italic',
                  }}>
                    {humanTrend}
                  </p>
                </div>
              </div>

              {latestKeyInsight && (
                <div style={{
                  borderLeft: '2px solid rgba(195,162,97,0.35)',
                  paddingLeft: '14px',
                }}>
                  <p style={{ ...LABEL, marginBottom: '6px' }}>Latest Insight</p>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.82rem',
                    fontWeight: 300,
                    color: 'var(--ink)',
                    lineHeight: 1.65,
                    fontStyle: 'italic',
                  }}>
                    "{latestKeyInsight}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Momentum chart */}
      <div className="card" style={{ marginBottom: '40px', padding: '32px' }}>
        <p style={{ ...LABEL, marginBottom: '8px', fontFamily: 'var(--font-display)', fontSize: '0.9rem', letterSpacing: '0.06em', fontWeight: 300, textTransform: 'none' }}>
          This week
        </p>
        <MomentumChart logs={weekLogs} />
      </div>

      {/* Category sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
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

      {/* Bottom row — activity + patterns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Recent activity */}
        <div className="card" style={{ padding: '28px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Recent Activity</p>
          {recentLogs.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}>
              Today is day one. Come back tonight and log how it went.
            </p>
          ) : (
            <div>
              {recentLogs.map((log, i) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '12px 0',
                    borderBottom: i < recentLogs.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.72rem',
                    fontWeight: 300,
                    color: 'var(--ink-muted)',
                    width: '48px',
                    flexShrink: 0,
                    paddingTop: '2px',
                  }}>
                    {format(parseISO(log.date), 'EEE d')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {log.momentum_score != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: `rgba(107,124,92,${0.2 + (log.momentum_score / 14)})`,
                          flexShrink: 0,
                        }} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--olive)', fontWeight: 300 }}>
                          {log.momentum_score}/10
                        </span>
                      </div>
                    )}
                    {log.key_insight && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1.5 }}>
                        {log.key_insight}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patterns */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <p style={LABEL}>Patterns</p>
            {patterns.length > 0 && (
              <span style={{
                background: 'var(--clay-muted)',
                color: 'var(--clay)',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-body)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}>
                {patterns.length}
              </span>
            )}
          </div>
          {patterns.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
            }}>
              Nothing to flag — keep going.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {patterns.map(p => <PatternAlert key={p.id} pattern={p} />)}
            </div>
          )}
        </div>
      </div>

    </div>
    {/* Reading list — floating icon top-right */}
    <ReadingList />
    </>
  )
}
