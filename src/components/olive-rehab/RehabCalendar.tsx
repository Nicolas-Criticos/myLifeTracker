import { format, parseISO } from 'date-fns'
import { useRehabPlan, useRehabLogs } from '../../lib/rehab-queries'
import { nowInSAST } from '../../lib/utils'
import type { RehabPlan, RehabLog } from '../../lib/supabase'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 300,
}

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const MONTHS = [
  { key: '01', label: 'Jan', short: 'J' },
  { key: '02', label: 'Feb', short: 'F' },
  { key: '03', label: 'Mar', short: 'M' },
  { key: '04', label: 'Apr', short: 'A' },
  { key: '05', label: 'May', short: 'M' },
  { key: '06', label: 'Jun', short: 'J' },
  { key: '07', label: 'Jul', short: 'J' },
  { key: '08', label: 'Aug', short: 'A' },
  { key: '09', label: 'Sep', short: 'S' },
  { key: '10', label: 'Oct', short: 'O' },
  { key: '11', label: 'Nov', short: 'N' },
  { key: '12', label: 'Dec', short: 'D' },
]

const PHASE_MAP: Record<string, { label: string; color: string }> = {
  '04': { label: 'Recovery', color: '#5a7247' },
  '05': { label: 'Recovery', color: '#5a7247' },
  '06': { label: 'Dormancy Prep', color: '#8a6a3a' },
  '07': { label: 'Dormancy Work', color: '#6b5c48' },
  '08': { label: 'Dormancy Work', color: '#6b5c48' },
  '09': { label: 'Spring Prep', color: '#4a6b8a' },
}

const ACTIVITY_COLORS: Record<string, string> = {
  nutrient_feed: '#5a7247',
  foliar_spray: '#6b8c52',
  irrigation: '#4a6b8a',
  pruning_light: '#8a6a3a',
  pruning_major: '#6b5c48',
  soil_correction: '#7a6b55',
  spring_activation: '#4a8a5a',
  other: '#8a7f6d',
}

const ACTIVITY_LABELS: Record<string, string> = {
  nutrient_feed: 'Nutrient Feed',
  foliar_spray: 'Foliar Spray',
  irrigation: 'Irrigation',
  pruning_light: 'Light Pruning',
  pruning_major: 'Major Pruning',
  soil_correction: 'Soil Correction',
  spring_activation: 'Spring Activation',
  other: 'Other',
}

export default function RehabCalendar() {
  const now = nowInSAST()
  const currentYear = format(now, 'yyyy')
  const currentMonth = format(now, 'MM')
  const { data: planItems = [] } = useRehabPlan()
  const { data: logs = [] } = useRehabLogs(500)

  // Group plan items by month
  const planByMonth: Record<string, RehabPlan[]> = {}
  for (const item of planItems) {
    if (!item.scheduled_month) continue
    const m = item.scheduled_month.split('-')[1]
    if (!planByMonth[m]) planByMonth[m] = []
    planByMonth[m].push(item)
  }

  // Group logs by month
  const logsByMonth: Record<string, RehabLog[]> = {}
  for (const log of logs) {
    const m = log.date.split('-')[1]
    if (!logsByMonth[m]) logsByMonth[m] = []
    logsByMonth[m].push(log)
  }

  // Active months (Apr–Sep)
  const activeMonths = ['04', '05', '06', '07', '08', '09']

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Year header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          ...DISPLAY,
          fontSize: '1.8rem',
          color: 'var(--ink)',
          margin: 0,
        }}>
          {currentYear} Rehabilitation Calendar
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          marginTop: '6px',
        }}>
          Active season: April – September
        </p>
      </div>

      {/* Phase bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '2px',
        marginBottom: '8px',
      }}>
        {MONTHS.map(month => {
          const phase = PHASE_MAP[month.key]
          const isCurrent = month.key === currentMonth
          const isActive = activeMonths.includes(month.key)

          return (
            <div key={month.key} style={{
              textAlign: 'center',
              padding: '8px 4px',
              borderRadius: '8px',
              background: isCurrent
                ? 'rgba(90, 114, 71, 0.12)'
                : isActive
                  ? 'rgba(90, 114, 71, 0.04)'
                  : 'rgba(44, 42, 37, 0.02)',
              border: isCurrent ? '1px solid rgba(90, 114, 71, 0.25)' : '1px solid transparent',
              transition: 'all 200ms ease',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.6rem',
                fontWeight: isCurrent ? 500 : 300,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isCurrent ? '#5a7247' : isActive ? 'var(--ink)' : 'var(--ink-muted)',
                margin: 0,
              }}>
                {month.label}
              </p>
              {phase && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.48rem',
                  fontWeight: 300,
                  color: phase.color,
                  margin: '3px 0 0',
                  letterSpacing: '0.06em',
                }}>
                  {phase.label}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Monthly detail cards — only active months */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeMonths.map(monthKey => {
          const monthInfo = MONTHS.find(m => m.key === monthKey)!
          const phase = PHASE_MAP[monthKey]
          const items = planByMonth[monthKey] || []
          const monthLogs = logsByMonth[monthKey] || []
          const isCurrent = monthKey === currentMonth
          const isPast = monthKey < currentMonth

          const completedItems = items.filter(i => i.status === 'completed').length
          const logDays = new Set(monthLogs.map(l => l.date)).size

          return (
            <div key={monthKey} className="card" style={{
              padding: '24px',
              borderColor: isCurrent ? 'rgba(90, 114, 71, 0.25)' : 'rgba(90, 114, 71, 0.08)',
              background: isCurrent ? 'rgba(245, 248, 238, 0.9)' : undefined,
            }}>
              {/* Month header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{
                    ...DISPLAY,
                    fontSize: '1.3rem',
                    color: isCurrent ? '#5a7247' : 'var(--ink)',
                    margin: 0,
                  }}>
                    {monthInfo.label} {currentYear}
                  </h3>
                  {phase && (
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.52rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: phase.color,
                      background: `${phase.color}15`,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                    }}>
                      {phase.label}
                    </span>
                  )}
                  {isCurrent && (
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.52rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#5a7247',
                      background: 'rgba(90, 114, 71, 0.1)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                    }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.65rem',
                    color: 'var(--ink-muted)',
                  }}>
                    {completedItems}/{items.length} tasks
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.65rem',
                    color: 'var(--ink-muted)',
                  }}>
                    {logDays} active days
                  </span>
                </div>
              </div>

              {/* Plan items as timeline */}
              {items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map(item => {
                    const color = ACTIVITY_COLORS[item.activity_type] || '#8a7f6d'
                    const isOverdue = isPast && item.status !== 'completed' && item.status !== 'skipped'

                    return (
                      <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: item.status === 'completed'
                          ? 'rgba(90, 114, 71, 0.05)'
                          : isOverdue
                            ? 'rgba(160, 80, 80, 0.05)'
                            : 'rgba(44, 42, 37, 0.02)',
                        border: `1px solid ${item.status === 'completed' ? 'rgba(90, 114, 71, 0.1)' : isOverdue ? 'rgba(160, 80, 80, 0.1)' : 'rgba(44, 42, 37, 0.04)'}`,
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.status === 'completed' ? '#5a7247' : isOverdue ? '#a05050' : color,
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.78rem',
                          fontWeight: item.status === 'completed' ? 300 : 400,
                          color: item.status === 'completed' ? 'var(--ink-muted)' : isOverdue ? '#a05050' : 'var(--ink)',
                          textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                          flex: 1,
                        }}>
                          {item.title}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.52rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: item.status === 'completed' ? '#5a7247' : isOverdue ? '#a05050' : color,
                        }}>
                          {ACTIVITY_LABELS[item.activity_type] || item.activity_type}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {items.length === 0 && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.78rem',
                  fontWeight: 300,
                  color: 'var(--ink-muted)',
                  fontStyle: 'italic',
                }}>
                  No planned activities for this month.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Activity legend */}
      <div className="card" style={{ padding: '20px', borderColor: 'rgba(90, 114, 71, 0.08)' }}>
        <p style={{ ...LABEL, marginBottom: '12px' }}>Activity Types</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: ACTIVITY_COLORS[key],
              }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.65rem',
                color: 'var(--ink-muted)',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
