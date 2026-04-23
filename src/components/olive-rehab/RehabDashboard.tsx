import { format, parseISO } from 'date-fns'
import OliveTree from './OliveTree'
import SeasonIndicator from './SeasonIndicator'
import {
  useTreeHealthScore, useRehabBlocks, useRehabLogs, useCurrentMonthPlan,
  useRehabMilestones, ACTIVITY_LABELS,
} from '../../lib/rehab-queries'
import { nowInSAST } from '../../lib/utils'

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 300,
}

function healthLabel(score: number): string {
  if (score <= 2) return 'Needs Attention'
  if (score <= 4) return 'Struggling'
  if (score <= 6) return 'Recovering'
  if (score <= 8) return 'Healthy'
  return 'Thriving'
}

function healthColor(score: number): string {
  if (score <= 2) return '#a05050'
  if (score <= 4) return '#8a6a3a'
  if (score <= 6) return '#7a8a5a'
  if (score <= 8) return '#5a7a47'
  return '#3a6a2a'
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    completed:  { bg: 'rgba(90, 114, 71, 0.12)', color: '#4a6838', label: 'Done' },
    in_progress:{ bg: 'rgba(201, 168, 76, 0.15)', color: '#8a6a20', label: 'In progress' },
    planned:    { bg: 'rgba(44, 42, 37, 0.06)', color: 'var(--ink-muted)', label: 'Planned' },
    overdue:    { bg: 'rgba(160, 80, 80, 0.1)', color: '#a05050', label: 'Overdue' },
    skipped:    { bg: 'rgba(44, 42, 37, 0.04)', color: 'var(--ink-faint)', label: 'Skipped' },
  }
  const c = cfg[status] ?? cfg.planned
  return (
    <span style={{
      fontFamily: 'var(--font-body)',
      fontSize: '0.58rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      background: c.bg,
      color: c.color,
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  )
}

export default function RehabDashboard() {
  const healthScore = useTreeHealthScore(10)
  const { data: blocks = [] }  = useRehabBlocks()
  const { data: allLogs = [] } = useRehabLogs(90) // enough for monthly stats + display
  const { data: monthPlan = [] }   = useCurrentMonthPlan()
  const { data: allPlan = [] }     = useCurrentMonthPlan() // we reuse for plan preview
  const { data: milestones = [] }  = useRehabMilestones()
  const now = nowInSAST()

  const currentMonth = format(now, 'yyyy-MM')
  const activeBlocks = blocks.filter(b => b.irrigation_status === 'restored' || b.irrigation_status === 'active').length
  const activeDaysThisMonth = new Set(
    allLogs.filter(l => l.date.startsWith(currentMonth)).map(l => l.date)
  ).size
  const upcomingTodos = monthPlan.filter(p => p.status !== 'completed' && p.status !== 'skipped').length
  const totalTrees = blocks.reduce((s, b) => s + (b.tree_count || 0), 0)
  const pendingMilestones = milestones.filter(m => m.status === 'pending')

  // Per-block progress: for each block, count plan items completed vs total
  // We use activity_type matching between plan and logs as a proxy
  const blockProgress = blocks.map(block => {
    const blockPlan = allPlan.filter(p => !p.block_id || p.block_id === block.id)
    const blockLogs = allLogs.filter(l => l.block_id === block.id)
    const loggedTypes = new Set(blockLogs.map(l => l.activity_type))
    const done = blockPlan.filter(p => p.status === 'completed' || loggedTypes.has(p.activity_type)).length
    const pct = blockPlan.length > 0 ? Math.round((done / blockPlan.length) * 100) : 0
    return { block, pct, done, total: blockPlan.length }
  })

  const stats = [
    { label: 'Active Days',    value: String(activeDaysThisMonth), sub: format(now, 'MMMM') },
    { label: 'Blocks Active',  value: `${activeBlocks}/${blocks.length}`, sub: 'irrigation restored' },
    { label: 'Trees in Rehab', value: totalTrees.toLocaleString(), sub: 'across all blocks' },
    { label: 'Tasks Due',      value: String(upcomingTodos), sub: 'this month' },
  ]

  return (
    <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Hero — Tree + Score */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 0 12px',
      }}>
        <OliveTree healthScore={healthScore} size={300} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{
            ...DISPLAY,
            fontSize: '3.6rem',
            color: healthColor(healthScore),
            lineHeight: 1,
            margin: 0,
            transition: 'color 1.2s ease',
          }}>
            {healthScore.toFixed(1)}
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            fontWeight: 300,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: healthColor(healthScore),
            marginTop: '8px',
            transition: 'color 1.2s ease',
          }}>
            {healthLabel(healthScore)}
          </p>
        </div>
      </div>

      {/* Season Phase */}
      <SeasonIndicator />

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {stats.map(stat => (
          <div key={stat.label} className="card" style={{
            textAlign: 'center',
            padding: '22px 14px',
            border: '1px solid rgba(90, 114, 71, 0.1)',
            background: 'rgba(255, 252, 245, 0.6)',
          }}>
            <p style={{ ...LABEL, marginBottom: '10px' }}>{stat.label}</p>
            <p style={{
              ...DISPLAY,
              fontSize: '2.2rem',
              color: 'var(--ink)',
              lineHeight: 1,
              margin: 0,
            }}>
              {stat.value}
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.64rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              marginTop: '7px',
            }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Per-Block Progress — the critical view */}
      <div className="card" style={{ padding: '28px', border: '1px solid rgba(90, 114, 71, 0.1)' }}>
        <p style={{ ...LABEL, marginBottom: '20px' }}>Block Progress</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {blockProgress.map(({ block, pct, done, total }) => {
            const isActive = block.irrigation_status === 'restored' || block.irrigation_status === 'active'
            return (
              <div key={block.id} style={{
                background: isActive ? 'rgba(90, 114, 71, 0.07)' : 'rgba(44, 42, 37, 0.03)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 12px',
                textAlign: 'center',
                border: `1px solid ${isActive ? 'rgba(90, 114, 71, 0.14)' : 'rgba(44, 42, 37, 0.05)'}`,
                transition: 'all 300ms ease',
              }}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  color: 'var(--ink)',
                  margin: '0 0 3px',
                }}>
                  {block.name}
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.58rem',
                  fontWeight: 300,
                  color: isActive ? '#5a7247' : 'var(--ink-muted)',
                  margin: '0 0 8px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {isActive ? 'Active' : 'Pending'}
                </p>
                {/* Progress bar */}
                <div style={{
                  height: '3px',
                  borderRadius: '2px',
                  background: 'rgba(44, 42, 37, 0.07)',
                  overflow: 'hidden',
                  marginBottom: '6px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: healthColor(block.health_rating),
                    borderRadius: '2px',
                    transition: 'width 1.2s ease, background 1.2s ease',
                  }} />
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.6rem',
                  fontWeight: 300,
                  color: 'var(--ink-muted)',
                  margin: 0,
                }}>
                  {total > 0 ? `${done}/${total}` : `${block.tree_count || 500} trees`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two columns: Recent Activity + This Month's Plan */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>

        {/* Recent Activity */}
        <div className="card" style={{ padding: '28px', border: '1px solid rgba(90, 114, 71, 0.1)' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Recent Activity</p>
          {allLogs.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.85rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
              lineHeight: 1.7,
            }}>
              No field entries yet. Say "tree update" to Tracey to log your first session.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {allLogs.slice(0, 5).map((log, i) => (
                <div key={log.id} style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '11px 0',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.68rem',
                    fontWeight: 300,
                    color: 'var(--ink-muted)',
                    width: '48px',
                    flexShrink: 0,
                    paddingTop: '2px',
                  }}>
                    {format(parseISO(log.date), 'EEE d')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.8rem',
                      fontWeight: 400,
                      color: 'var(--ink)',
                      margin: 0,
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {log.title}
                    </p>
                    {log.observations && (
                      <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.7rem',
                        fontWeight: 300,
                        color: 'var(--ink-muted)',
                        margin: '3px 0 0',
                        lineHeight: 1.5,
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {log.observations}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#5a7247',
                    flexShrink: 0,
                    paddingTop: '3px',
                  }}>
                    {ACTIVITY_LABELS[log.activity_type] ?? log.activity_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This Month's Plan */}
        <div className="card" style={{ padding: '28px', border: '1px solid rgba(90, 114, 71, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={LABEL}>This Month's Plan</span>
            {upcomingTodos > 0 && (
              <span style={{
                background: 'rgba(90, 114, 71, 0.1)',
                color: '#5a7247',
                fontFamily: 'var(--font-body)',
                fontSize: '0.6rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}>
                {upcomingTodos}
              </span>
            )}
          </div>

          {monthPlan.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.85rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
            }}>
              No planned activities for {format(now, 'MMMM')}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {monthPlan.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: i < monthPlan.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    marginTop: '6px',
                    flexShrink: 0,
                    background: item.status === 'completed' ? '#5a7247'
                      : item.priority === 'critical' ? '#a05050'
                      : item.priority === 'high'     ? '#8a6a3a'
                      : 'rgba(44, 42, 37, 0.18)',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.8rem',
                      fontWeight: 400,
                      color: item.status === 'completed' ? 'var(--ink-muted)' : 'var(--ink)',
                      margin: 0,
                      lineHeight: 1.4,
                      textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                    }}>
                      {item.title}
                    </p>
                    {item.products && (
                      <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.67rem',
                        fontWeight: 300,
                        color: 'var(--ink-muted)',
                        margin: '3px 0 0',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.products}
                      </p>
                    )}
                  </div>
                  <StatusPill status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Milestones */}
      {pendingMilestones.length > 0 && (
        <div className="card" style={{ padding: '24px 28px', border: '1px solid rgba(90, 114, 71, 0.1)' }}>
          <p style={{ ...LABEL, marginBottom: '16px' }}>Milestones</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingMilestones.map(m => {
              const isOverdue = m.target_date && parseISO(m.target_date) < now
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '9px', height: '9px',
                    borderRadius: '50%',
                    border: `1.5px solid ${isOverdue ? '#a05050' : 'rgba(90, 114, 71, 0.4)'}`,
                    flexShrink: 0,
                  }} />
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.82rem',
                    fontWeight: 400,
                    color: 'var(--ink)',
                    margin: 0,
                    flex: 1,
                  }}>
                    {m.title}
                  </p>
                  {m.target_date && (
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.68rem',
                      fontWeight: 300,
                      color: isOverdue ? '#a05050' : 'var(--ink-muted)',
                    }}>
                      {format(parseISO(m.target_date), 'MMM d')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
