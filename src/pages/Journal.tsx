import { parseISO, format } from 'date-fns'
import { useDailyCheckins, useDailyLogs } from '../lib/queries'
import type { DailyCheckin, DailyLog } from '../lib/supabase'

// ── STYLE CONSTANTS ───────────────────────────────────────────────────────────

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

// ── EMPTY STATE ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 40px',
      gap: '24px',
      textAlign: 'center',
    }}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r="35" stroke="rgba(107,124,92,0.12)" strokeWidth="1.5" />
        <circle cx="36" cy="36" r="24" stroke="rgba(107,124,92,0.22)" strokeWidth="1.5" />
        <circle cx="36" cy="36" r="13" stroke="rgba(107,124,92,0.38)" strokeWidth="1.5" />
      </svg>
      <p style={{
        ...DISPLAY,
        fontSize: '1.35rem',
        color: 'var(--ink)',
        lineHeight: 1.6,
        maxWidth: '360px',
        margin: 0,
      }}>
        Your journal begins with your first check-in.
      </p>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.8rem',
        fontWeight: 300,
        color: 'var(--ink-muted)',
        margin: 0,
        lineHeight: 1.7,
      }}>
        Say <em>check in</em> to @TraceyTracker_bot to get started.
      </p>
    </div>
  )
}

// ── SCORE DOT ─────────────────────────────────────────────────────────────────

function ScoreDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.63rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.05rem',
        fontWeight: 400,
        color: 'var(--ink)',
      }}>
        {value}
      </span>
    </div>
  )
}

// ── DAY ENTRY ─────────────────────────────────────────────────────────────────

function DayEntry({ date, checkin, log }: {
  date: string
  checkin?: DailyCheckin
  log?: DailyLog
}) {
  const parsed = parseISO(date)
  const dateLabel = format(parsed, 'EEEE, d MMMM yyyy')

  return (
    <article style={{ marginBottom: '72px' }}>

      {/* Date header */}
      <h2 style={{
        ...DISPLAY,
        fontSize: '1.8rem',
        color: 'var(--ink)',
        margin: '0 0 32px',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      }}>
        {dateLabel}
      </h2>

      {/* ── Morning ──────────────────────────────────────────────────────────── */}
      {checkin && (
        <section>

          {/* Wake time + morning routine */}
          {(checkin.wake_time || checkin.morning_routine) && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              margin: '0 0 22px',
              lineHeight: 1.65,
            }}>
              {checkin.wake_time && <span>↑ {checkin.wake_time}</span>}
              {checkin.wake_time && checkin.morning_routine && (
                <span style={{ margin: '0 8px', opacity: 0.35 }}>·</span>
              )}
              {checkin.morning_routine && <span>{checkin.morning_routine}</span>}
            </p>
          )}

          {/* Main reflection */}
          {checkin.reflection && (
            <p style={{
              ...DISPLAY,
              fontSize: '1.1rem',
              color: 'var(--ink)',
              lineHeight: 1.9,
              margin: '0 0 28px',
              maxWidth: '680px',
            }}>
              {checkin.reflection}
            </p>
          )}

          {/* What's weighing / what's light */}
          {(checkin.whats_weighing || checkin.whats_light) && (
            <div style={{ margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {checkin.whats_weighing && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  fontStyle: 'italic',
                  color: 'var(--ink-muted)',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  Weighing: {checkin.whats_weighing}
                </p>
              )}
              {checkin.whats_light && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  fontStyle: 'italic',
                  color: 'var(--ink-muted)',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  Light: {checkin.whats_light}
                </p>
              )}
            </div>
          )}

          {/* Score row — Energy · Focus · Peace */}
          {(checkin.energy_level || checkin.focus_level || checkin.peace_level) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              margin: '0 0 22px',
            }}>
              {checkin.energy_level != null && checkin.energy_level > 0 && (
                <ScoreDot color="var(--olive)" label="Energy" value={checkin.energy_level} />
              )}
              {checkin.focus_level != null && checkin.focus_level > 0 && (
                <ScoreDot color="#4a6b8a" label="Focus" value={checkin.focus_level} />
              )}
              {checkin.peace_level != null && (
                <ScoreDot color="var(--gold)" label="Peace" value={checkin.peace_level} />
              )}
            </div>
          )}

          {/* Intent */}
          {checkin.intent && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              margin: '0 0 8px',
              lineHeight: 1.6,
            }}>
              Today: {checkin.intent}
            </p>
          )}

          {/* Non-negotiable */}
          {checkin.non_negotiable && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 400,
              color: 'var(--clay)',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Must happen: {checkin.non_negotiable}
            </p>
          )}
        </section>
      )}

      {/* Thin divider between morning and evening */}
      {checkin && log && (
        <hr style={{
          border: 'none',
          borderTop: '1px solid var(--border-warm)',
          margin: '32px 0',
          width: '180px',
        }} />
      )}

      {/* ── Evening ──────────────────────────────────────────────────────────── */}
      {log && (
        <section>

          {/* "Evening" label */}
          <p style={{ ...LABEL, marginBottom: '22px' }}>Evening</p>

          {/* What happened */}
          {log.what_happened && (
            <p style={{
              ...DISPLAY,
              fontSize: '1.1rem',
              color: 'var(--ink)',
              lineHeight: 1.9,
              margin: '0 0 24px',
              maxWidth: '680px',
            }}>
              {log.what_happened}
            </p>
          )}

          {/* Evening reflection */}
          {log.evening_reflection && (
            <p style={{
              ...DISPLAY,
              fontSize: '1.1rem',
              color: 'var(--ink-muted)',
              lineHeight: 1.9,
              margin: '0 0 24px',
              maxWidth: '680px',
            }}>
              {log.evening_reflection}
            </p>
          )}

          {/* Key insight — gold-tinted card */}
          {log.key_insight && (
            <div style={{
              background: 'var(--gold-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              margin: '0 0 24px',
              maxWidth: '620px',
            }}>
              <p style={{ ...LABEL, color: 'var(--gold)', marginBottom: '8px' }}>Insight</p>
              <p style={{
                ...DISPLAY,
                fontSize: '1rem',
                fontStyle: 'italic',
                color: 'var(--ink)',
                margin: 0,
                lineHeight: 1.75,
              }}>
                {log.key_insight}
              </p>
            </div>
          )}

          {/* Momentum + Peace row */}
          {(log.momentum_score != null || log.peace_level != null) && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              margin: 0,
            }}>
              {log.momentum_score != null && (
                <span>
                  Momentum{' '}
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.05rem',
                    color: 'var(--ink)',
                  }}>
                    {log.momentum_score}
                  </span>
                  /10
                </span>
              )}
              {log.momentum_score != null && log.peace_level != null && (
                <span style={{ margin: '0 12px', opacity: 0.35 }}>·</span>
              )}
              {log.peace_level != null && (
                <span>
                  Peace{' '}
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.05rem',
                    color: 'var(--ink)',
                  }}>
                    {log.peace_level}
                  </span>
                  /10
                </span>
              )}
            </p>
          )}
        </section>
      )}

      {/* Day separator — warm gradient line */}
      <div style={{
        marginTop: '60px',
        height: '1px',
        background: 'linear-gradient(90deg, var(--border-warm) 0%, transparent 100%)',
        maxWidth: '400px',
      }} />
    </article>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Journal() {
  const { data: checkins = [], isLoading: checkinsLoading } = useDailyCheckins(30)
  const { data: logs = [], isLoading: logsLoading } = useDailyLogs(30)

  const isLoading = checkinsLoading || logsLoading

  const allDates = [...new Set([
    ...checkins.map(c => c.date),
    ...logs.map(l => l.date),
  ])].sort((a, b) => b.localeCompare(a))

  const checkinByDate = Object.fromEntries(checkins.map(c => [c.date, c]))
  const logByDate = Object.fromEntries(logs.map(l => [l.date, l]))

  if (isLoading) {
    return (
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 40px' }}>
        <p style={{
          ...DISPLAY,
          fontSize: '1.1rem',
          color: 'var(--ink-muted)',
        }}>
          Loading journal…
        </p>
      </main>
    )
  }

  if (allDates.length === 0) return <EmptyState />

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 40px' }}>

      {/* Page title */}
      <header style={{ marginBottom: '64px' }}>
        <h1 style={{
          ...DISPLAY,
          fontSize: '2.2rem',
          color: 'var(--ink)',
          margin: '0 0 8px',
          letterSpacing: '-0.01em',
        }}>
          Journal
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          margin: 0,
        }}>
          {allDates.length} {allDates.length === 1 ? 'day' : 'days'} recorded
        </p>
      </header>

      {allDates.map(date => (
        <DayEntry
          key={date}
          date={date}
          checkin={checkinByDate[date] as DailyCheckin | undefined}
          log={logByDate[date] as DailyLog | undefined}
        />
      ))}
    </main>
  )
}
