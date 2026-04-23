import { format, parseISO, startOfWeek, addDays } from 'date-fns'
import { useRehabLogs, useRehabBlocks, ACTIVITY_LABELS } from '../../lib/rehab-queries'
import type { RehabLog } from '../../lib/supabase'

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
  color: 'var(--ink-faint)',
}

interface WeekGroup {
  weekStart: string
  weekEnd: string
  logs: RehabLog[]
  activeDays: number
  uniqueBlocks: Set<string>
  uniqueActivities: Set<string>
  totalTrees: number
  totalHours: number
  observations: string[]
}

function groupByWeek(logs: RehabLog[]): WeekGroup[] {
  const groups: Record<string, RehabLog[]> = {}
  for (const log of logs) {
    const d = parseISO(log.date)
    const ws = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    if (!groups[ws]) groups[ws] = []
    groups[ws].push(log)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekStart, weekLogs]) => {
      const ws = parseISO(weekStart)
      return {
        weekStart,
        weekEnd: format(addDays(ws, 6), 'yyyy-MM-dd'),
        logs: weekLogs,
        activeDays: new Set(weekLogs.map(l => l.date)).size,
        uniqueBlocks: new Set(weekLogs.filter(l => l.block_id).map(l => l.block_id!)),
        uniqueActivities: new Set(weekLogs.map(l => l.activity_type)),
        totalTrees: weekLogs.reduce((s, l) => s + (l.trees_affected || 0), 0),
        totalHours: weekLogs.reduce((s, l) => s + (l.labour_hours || 0), 0),
        observations: weekLogs
          .filter(l => l.observations)
          .map(l => l.observations!)
          .slice(0, 3),
      }
    })
}

function WeekCard({ week, blockMap }: { week: WeekGroup; blockMap: Record<string, string> }) {
  const wsDate = parseISO(week.weekStart)
  const weDate = parseISO(week.weekEnd)

  return (
    <div className="card" style={{
      padding: '28px',
      borderColor: 'rgba(90, 114, 71, 0.12)',
    }}>
      {/* Week header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{
            ...DISPLAY,
            fontSize: '1.4rem',
            color: 'var(--ink)',
            margin: 0,
          }}>
            {format(wsDate, 'MMM d')} – {format(weDate, 'MMM d, yyyy')}
          </h3>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            marginTop: '4px',
          }}>
            {week.logs.length} {week.logs.length === 1 ? 'entry' : 'entries'} · {week.activeDays} active {week.activeDays === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div>
          <p style={{ ...LABEL, marginBottom: '4px' }}>Blocks</p>
          <p style={{ ...DISPLAY, fontSize: '1.6rem', color: 'var(--ink)', lineHeight: 1, margin: 0 }}>
            {week.uniqueBlocks.size}
          </p>
        </div>
        <div>
          <p style={{ ...LABEL, marginBottom: '4px' }}>Trees</p>
          <p style={{ ...DISPLAY, fontSize: '1.6rem', color: 'var(--ink)', lineHeight: 1, margin: 0 }}>
            {week.totalTrees || '—'}
          </p>
        </div>
        <div>
          <p style={{ ...LABEL, marginBottom: '4px' }}>Hours</p>
          <p style={{ ...DISPLAY, fontSize: '1.6rem', color: 'var(--ink)', lineHeight: 1, margin: 0 }}>
            {week.totalHours ? week.totalHours.toFixed(1) : '—'}
          </p>
        </div>
        <div>
          <p style={{ ...LABEL, marginBottom: '4px' }}>Activities</p>
          <p style={{ ...DISPLAY, fontSize: '1.6rem', color: 'var(--ink)', lineHeight: 1, margin: 0 }}>
            {week.uniqueActivities.size}
          </p>
        </div>
      </div>

      {/* Activity types done this week */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {Array.from(week.uniqueActivities).map(act => (
          <span key={act} style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.58rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#5a7247',
            background: 'rgba(90, 114, 71, 0.08)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
          }}>
            {ACTIVITY_LABELS[act] || act}
          </span>
        ))}
      </div>

      {/* Blocks worked */}
      {week.uniqueBlocks.size > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
          }}>
            Blocks: {Array.from(week.uniqueBlocks).map(id => blockMap[id] || id).join(', ')}
          </p>
        </div>
      )}

      {/* Key observations */}
      {week.observations.length > 0 && (
        <div style={{
          background: 'rgba(90, 114, 71, 0.04)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
        }}>
          <p style={{ ...LABEL, color: '#5a7247', marginBottom: '8px' }}>Observations</p>
          {week.observations.map((obs, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--ink-muted)',
              lineHeight: 1.6,
              margin: i > 0 ? '6px 0 0' : 0,
            }}>
              "{obs}"
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RehabWeeklySummaries() {
  const { data: logs = [], isLoading } = useRehabLogs(200)
  const { data: blocks = [] } = useRehabBlocks()

  const blockMap = Object.fromEntries(blocks.map(b => [b.id, b.name]))
  const weeks = groupByWeek(logs)

  if (isLoading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ ...DISPLAY, fontSize: '1.1rem', color: 'var(--ink-muted)' }}>Loading summaries…</p>
      </div>
    )
  }

  if (weeks.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '80px 40px',
        gap: '20px',
        textAlign: 'center',
      }}>
        <p style={{ ...DISPLAY, fontSize: '1.3rem', color: 'var(--ink)' }}>
          Weekly summaries will appear here.
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
        }}>
          Log your first field activity and the weeks will start rolling in.
        </p>
      </div>
    )
  }

  return (
    <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {weeks.map(week => (
        <WeekCard key={week.weekStart} week={week} blockMap={blockMap} />
      ))}
    </div>
  )
}
