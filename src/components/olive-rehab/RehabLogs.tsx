import { parseISO, format } from 'date-fns'
import { useRehabLogs, useRehabBlocks, useCurrentSeasonPhase, ACTIVITY_LABELS } from '../../lib/rehab-queries'
import type { RehabLog, RehabBlock } from '../../lib/supabase'

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

const PROTOCOL_HINTS: Record<string, string> = {
  '04': 'April: Nutrient feed via fertigation — Verte Guano (10–20 L/ha), Sea Humic (2–3 L/ha), Boron. Late April: foliar spray with Sea Humic + Gliosense. Irrigation at ~75% of summer schedule.',
  '05': 'May: Light pruning — remove dead, diseased, and crossing branches only. Begin stepping down irrigation to ~50–60% of summer schedule.',
  '06': 'June: Soil correction — Lime (2–4 t/ha if pH < 6), Boron (15–25 kg/ha). Minimal irrigation, trees moving toward dormancy.',
  '07': 'July: Major pruning begins — open vase shape, max 30% canopy removal per session. Irrigation every 10–14 days.',
  '08': 'August: Continue major pruning and structural work. Irrigation every 10–14 days.',
  '09': 'September: Spring activation — KAN 27, Verte Guano, Sea Humic, Gliosense. Begin increasing irrigation as temperatures rise.',
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-body)',
      fontSize: '0.67rem',
      fontWeight: 300,
      color: 'var(--ink-muted)',
      background: 'rgba(44, 42, 37, 0.04)',
      border: '1px solid rgba(44, 42, 37, 0.06)',
      borderRadius: 'var(--radius-full)',
      padding: '2px 10px',
    }}>
      <span style={{ color: 'var(--ink-faint)', marginRight: 4 }}>{label}</span>
      {value}
    </span>
  )
}

function LogEntry({ log, block }: { log: RehabLog; block?: RehabBlock }) {
  return (
    <div style={{ display: 'flex', gap: '20px', padding: '16px 0' }}>
      {/* Activity badge */}
      <div style={{ flexShrink: 0, width: '100px', textAlign: 'right', paddingTop: '2px' }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.57rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#5a7247',
          background: 'rgba(90, 114, 71, 0.09)',
          padding: '3px 9px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(90, 114, 71, 0.12)',
          whiteSpace: 'nowrap',
        }}>
          {ACTIVITY_LABELS[log.activity_type] ?? log.activity_type}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.87rem',
          fontWeight: 400,
          color: 'var(--ink)',
          margin: 0,
          lineHeight: 1.5,
        }}>
          {log.title}
        </p>

        {/* Description (display font) */}
        {log.description && (
          <p style={{
            ...DISPLAY,
            fontSize: '0.95rem',
            color: 'var(--ink)',
            lineHeight: 1.8,
            margin: '8px 0 0',
          }}>
            {log.description}
          </p>
        )}

        {/* Observations (italic, muted) */}
        {log.observations && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
            margin: '8px 0 0',
            lineHeight: 1.7,
          }}>
            {log.observations}
          </p>
        )}

        {/* Meta chips */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          {block && <MetaChip label="Block" value={block.name} />}
          {log.trees_affected != null && <MetaChip label="Trees" value={String(log.trees_affected)} />}
          {log.labour_hours != null && <MetaChip label="Hours" value={`${log.labour_hours}h`} />}
          {log.products_used && <MetaChip label="Products" value={log.products_used} />}
          {log.weather_conditions && <MetaChip label="Weather" value={log.weather_conditions} />}
        </div>
      </div>
    </div>
  )
}

export default function RehabLogs() {
  const { data: logs = [], isLoading } = useRehabLogs(150)
  const { data: blocks = [] } = useRehabBlocks()
  const { phase } = useCurrentSeasonPhase()

  const blockMap = Object.fromEntries(blocks.map(b => [b.id, b]))

  // Group logs by date, newest first
  const dateGroups: Record<string, RehabLog[]> = {}
  for (const log of logs) {
    if (!dateGroups[log.date]) dateGroups[log.date] = []
    dateGroups[log.date].push(log)
  }
  const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a))

  const currentMonthKey = format(new Date(), 'MM')
  const hint = PROTOCOL_HINTS[currentMonthKey]

  if (isLoading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ ...DISPLAY, fontSize: '1.1rem', color: 'var(--ink-muted)' }}>Loading logs…</p>
      </div>
    )
  }

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

      {/* Protocol hint */}
      {hint && (
        <div style={{
          background: 'rgba(90, 114, 71, 0.06)',
          border: '1px solid rgba(90, 114, 71, 0.12)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 22px',
        }}>
          <p style={{ ...LABEL, color: '#5a7247', marginBottom: '8px' }}>
            What the protocol says — {phase}
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            fontWeight: 300,
            color: 'var(--ink)',
            lineHeight: 1.75,
            margin: 0,
          }}>
            {hint}
          </p>
        </div>
      )}

      {/* Log entries */}
      {sortedDates.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '80px 40px', gap: '16px', textAlign: 'center',
        }}>
          <p style={{ ...DISPLAY, fontSize: '1.3rem', color: 'var(--ink)' }}>
            No field logs yet.
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem', fontWeight: 300, color: 'var(--ink-muted)',
          }}>
            Say <em>"tree update"</em> to Tracey to log your first session.
          </p>
        </div>
      ) : (
        sortedDates.map((date, di) => (
          <article key={date}>
            {/* Date header */}
            <h2 style={{
              ...DISPLAY,
              fontSize: '1.5rem',
              color: 'var(--ink)',
              margin: '0 0 4px',
              letterSpacing: '-0.01em',
            }}>
              {format(parseISO(date), 'EEEE, d MMMM yyyy')}
            </h2>

            {/* Entries under this date */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '2px solid rgba(90, 114, 71, 0.14)',
              paddingLeft: '20px',
              marginLeft: '3px',
              marginTop: '8px',
            }}>
              {dateGroups[date].map((log, i) => (
                <div key={log.id}>
                  <LogEntry log={log} block={log.block_id ? blockMap[log.block_id] : undefined} />
                  {i < dateGroups[date].length - 1 && (
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2px 0' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Day separator */}
            {di < sortedDates.length - 1 && (
              <div style={{
                marginTop: '28px',
                height: '1px',
                background: 'linear-gradient(90deg, rgba(90, 114, 71, 0.15) 0%, transparent 80%)',
              }} />
            )}
          </article>
        ))
      )}
    </div>
  )
}
