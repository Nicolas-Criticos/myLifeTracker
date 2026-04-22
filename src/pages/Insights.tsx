import PatternAlert from '../components/dashboard/PatternAlert'
import { usePatterns, useDailyLogs, useWeeklyReviews } from '../lib/queries'
import { format, parseISO } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(255,252,245,0.95)',
    border: '1px solid rgba(44,42,37,0.08)',
    borderRadius: '12px',
    color: '#2c2a25',
    fontSize: 11,
    fontFamily: 'var(--font-body)',
    boxShadow: '0 4px 24px rgba(44,42,37,0.08)',
  },
}

export default function Insights() {
  const { data: allPatterns = [], isLoading: loadingPatterns } = usePatterns()
  const { data: activePatterns = [] } = usePatterns(true)
  const { data: logs = [] } = useDailyLogs(30)
  const { data: reviews = [] } = useWeeklyReviews()

  const trendData = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(log => ({
      date: format(parseISO(log.date), 'MM/dd'),
      momentum: log.momentum_score ?? 0,
    }))

  const completionData = [...reviews]
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .slice(-8)
    .map(r => ({
      week: format(parseISO(r.week_start), 'MM/dd'),
      rate: r.completion_rate ?? 0,
      momentum: r.momentum_score ?? 0,
    }))

  const patternCounts: Record<string, number> = {}
  allPatterns.forEach(p => {
    patternCounts[p.pattern_type] = (patternCounts[p.pattern_type] ?? 0) + 1
  })
  const patternDistribution = Object.entries(patternCounts).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count,
  }))

  if (allPatterns.length === 0 && !loadingPatterns && trendData.length === 0) {
    return (
      <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.6rem',
            color: 'var(--ink)',
            letterSpacing: '0.04em',
            marginBottom: '4px',
          }}>
            Insights
          </h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '64px 40px' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.3rem',
            color: 'var(--ink)',
            letterSpacing: '0.04em',
            marginBottom: '12px',
          }}>
            Patterns emerge over time.
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.875rem',
            color: 'var(--ink-muted)',
            lineHeight: 1.7,
          }}>
            Keep checking in and logging your days. Something will surface.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

      {/* Page title */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.6rem',
          color: 'var(--ink)',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}>
          Insights
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          What the data is telling you.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Active patterns */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <p style={LABEL}>Active Patterns</p>
            {activePatterns.length > 0 && (
              <span style={{
                background: 'var(--clay-muted)',
                color: 'var(--clay)',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-body)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}>
                {activePatterns.length}
              </span>
            )}
          </div>
          {activePatterns.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
            }}>
              Nothing to flag right now — keep going.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activePatterns.map(p => <PatternAlert key={p.id} pattern={p} />)}
            </div>
          )}
        </div>

        {/* Momentum trend */}
        {trendData.length > 0 && (
          <div className="card" style={{ padding: '28px 32px' }}>
            <p style={{ ...LABEL, marginBottom: '20px' }}>Daily Momentum — last 14 days</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6b7c5c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6b7c5c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,42,37,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#7a7568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#7a7568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: 'var(--olive)' }} />
                <Area
                  type="monotone"
                  dataKey="momentum"
                  stroke="#6b7c5c"
                  strokeWidth={1.5}
                  fill="url(#momentumGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#6b7c5c', stroke: 'none' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weekly completion */}
        {completionData.length > 0 && (
          <div className="card" style={{ padding: '28px 32px' }}>
            <p style={{ ...LABEL, marginBottom: '20px' }}>Weekly Completion Rate (%)</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={completionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4a6b8a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4a6b8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,42,37,0.05)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#7a7568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#7a7568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} itemStyle={{ color: 'var(--leverage)' }} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  name="Completion %"
                  stroke="#4a6b8a"
                  strokeWidth={1.5}
                  fill="url(#completionGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#4a6b8a', stroke: 'none' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pattern distribution */}
        {patternDistribution.length > 0 && (
          <div className="card" style={{ padding: '28px 32px' }}>
            <p style={{ ...LABEL, marginBottom: '20px' }}>
              Pattern History ({allPatterns.length} total)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {patternDistribution.map(({ type, count }) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.82rem',
                    fontWeight: 300,
                    color: 'var(--ink)',
                    textTransform: 'capitalize',
                    flex: '0 0 160px',
                  }}>
                    {type}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '3px',
                    background: 'var(--border)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(count / allPatterns.length) * 100}%`,
                      background: 'var(--clay)',
                      borderRadius: 'var(--radius-full)',
                      opacity: 0.65,
                    }} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.72rem',
                    fontWeight: 300,
                    color: 'var(--ink-muted)',
                    width: '20px',
                    textAlign: 'right',
                  }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acknowledged patterns */}
        {allPatterns.filter(p => p.acknowledged).length > 0 && (
          <div className="card" style={{ padding: '28px 32px', opacity: 0.7 }}>
            <p style={{ ...LABEL, marginBottom: '16px' }}>Acknowledged</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {allPatterns.filter(p => p.acknowledged).map((p, i, arr) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.62rem',
                        fontWeight: 400,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-muted)',
                      }}>
                        {p.pattern_type.replace(/_/g, ' ')}
                      </span>
                      <span style={{ color: 'var(--ink-faint)', fontSize: '0.7rem' }}>·</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                        {format(parseISO(p.detected_at), 'MMM d')}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1.5 }}>
                      {p.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
