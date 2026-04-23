import { format } from 'date-fns'
import { useRehabPlan, useUpdateRehabPlan } from '../../lib/rehab-queries'
import { nowInSAST } from '../../lib/utils'
import type { RehabPlan } from '../../lib/supabase'

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

const MONTH_LABELS: Record<string, string> = {
  '01': 'January', '02': 'February', '03': 'March',
  '04': 'April', '05': 'May', '06': 'June',
  '07': 'July', '08': 'August', '09': 'September',
  '10': 'October', '11': 'November', '12': 'December',
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  planned: { bg: 'rgba(90, 114, 71, 0.08)', text: '#5a7247', border: 'rgba(90, 114, 71, 0.2)' },
  in_progress: { bg: 'rgba(74, 107, 138, 0.08)', text: '#4a6b8a', border: 'rgba(74, 107, 138, 0.2)' },
  completed: { bg: 'rgba(139, 127, 109, 0.08)', text: '#8a7f6d', border: 'rgba(139, 127, 109, 0.15)' },
  skipped: { bg: 'rgba(139, 127, 109, 0.06)', text: '#aaa090', border: 'rgba(139, 127, 109, 0.1)' },
  overdue: { bg: 'rgba(160, 80, 80, 0.08)', text: '#a05050', border: 'rgba(160, 80, 80, 0.2)' },
}

const PRIORITY_DOTS: Record<string, string> = {
  critical: '#a05050',
  high: '#8a6a3a',
  normal: 'rgba(44, 42, 37, 0.25)',
  low: 'rgba(44, 42, 37, 0.12)',
}

function getEffectiveStatus(item: RehabPlan, currentMonth: string): string {
  if (item.status === 'completed' || item.status === 'skipped') return item.status
  if (item.scheduled_month && item.scheduled_month < currentMonth) {
    return 'overdue'
  }
  return item.status
}

function TodoItem({ item, currentMonth }: { item: RehabPlan; currentMonth: string }) {
  const updatePlan = useUpdateRehabPlan()
  const effectiveStatus = getEffectiveStatus(item, currentMonth)
  const style = STATUS_COLORS[effectiveStatus] || STATUS_COLORS.planned

  const toggleComplete = () => {
    const newStatus = item.status === 'completed' ? 'planned' : 'completed'
    updatePlan.mutate({ id: item.id, status: newStatus })
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      padding: '14px 18px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 'var(--radius-sm)',
      transition: 'all 200ms ease',
    }}>
      {/* Checkbox */}
      <button
        onClick={toggleComplete}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '6px',
          border: `2px solid ${item.status === 'completed' ? '#5a7247' : 'rgba(44, 42, 37, 0.2)'}`,
          background: item.status === 'completed' ? '#5a7247' : 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 200ms ease',
        }}
      >
        {item.status === 'completed' && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: PRIORITY_DOTS[item.priority] || PRIORITY_DOTS.normal,
        flexShrink: 0,
        marginTop: '8px',
      }} />

      {/* Content */}
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.88rem',
          fontWeight: 400,
          color: item.status === 'completed' ? 'var(--ink-muted)' : 'var(--ink)',
          margin: 0,
          lineHeight: 1.4,
          textDecoration: item.status === 'completed' ? 'line-through' : 'none',
        }}>
          {item.title}
        </p>
        {item.description && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.76rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            margin: '4px 0 0',
            lineHeight: 1.5,
          }}>
            {item.description}
          </p>
        )}
        {item.products && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            fontWeight: 300,
            color: '#5a7247',
            margin: '6px 0 0',
            lineHeight: 1.5,
          }}>
            {item.products}
          </p>
        )}
      </div>

      {/* Status badge */}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.55rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: style.text,
        flexShrink: 0,
        paddingTop: '4px',
      }}>
        {effectiveStatus}
      </span>
    </div>
  )
}

export default function RehabTodos() {
  const { data: allPlan = [], isLoading } = useRehabPlan()
  const now = nowInSAST()
  const currentMonth = format(now, 'yyyy-MM')

  // Group by month
  const monthGroups: Record<string, RehabPlan[]> = {}
  for (const item of allPlan) {
    const key = item.scheduled_month || 'unscheduled'
    if (!monthGroups[key]) monthGroups[key] = []
    monthGroups[key].push(item)
  }
  const sortedMonths = Object.keys(monthGroups).sort()

  // Progress stats
  const totalItems = allPlan.length
  const completedItems = allPlan.filter(i => i.status === 'completed').length
  const overdueItems = allPlan.filter(i =>
    i.scheduled_month && i.scheduled_month < currentMonth && i.status !== 'completed' && i.status !== 'skipped'
  ).length

  if (isLoading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ ...DISPLAY, fontSize: '1.1rem', color: 'var(--ink-muted)' }}>Loading plan…</p>
      </div>
    )
  }

  return (
    <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Progress bar */}
      <div className="card" style={{ padding: '24px', borderColor: 'rgba(90, 114, 71, 0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p style={{ ...LABEL }}>Rehabilitation Progress</p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 300,
            color: 'var(--ink)',
          }}>
            {completedItems}/{totalItems}
          </p>
        </div>
        <div style={{
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(44, 42, 37, 0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%`,
            background: 'linear-gradient(90deg, #5a7247, #7a9462)',
            borderRadius: '3px',
            transition: 'width 1s ease',
          }} />
        </div>
        {overdueItems > 0 && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            fontWeight: 300,
            color: '#a05050',
            marginTop: '10px',
          }}>
            {overdueItems} overdue {overdueItems === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {/* Month groups */}
      {sortedMonths.map(month => {
        const items = monthGroups[month]
        const monthNum = month.split('-')[1]
        const monthLabel = monthNum ? MONTH_LABELS[monthNum] || month : 'Unscheduled'
        const year = month.split('-')[0]
        const isCurrentMonth = month === currentMonth

        return (
          <div key={month}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '14px',
            }}>
              <h3 style={{
                ...DISPLAY,
                fontSize: '1.3rem',
                color: isCurrentMonth ? '#5a7247' : 'var(--ink)',
                margin: 0,
              }}>
                {monthLabel} {year}
              </h3>
              {isCurrentMonth && (
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#5a7247',
                  background: 'rgba(90, 114, 71, 0.1)',
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  Current
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(item => (
                <TodoItem key={item.id} item={item} currentMonth={currentMonth} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
