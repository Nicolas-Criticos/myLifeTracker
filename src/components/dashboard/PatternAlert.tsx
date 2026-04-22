import { useAcknowledgePattern } from '../../lib/queries'
import type { Pattern } from '../../lib/supabase'
import { format, parseISO } from 'date-fns'

interface PatternAlertProps {
  pattern: Pattern
}

const patternIcon: Record<string, string> = {
  repeated_delay:      '⏱',
  low_energy_overload: '🔋',
  avoidance:           '↩',
  default:             '◎',
}

export default function PatternAlert({ pattern }: PatternAlertProps) {
  const acknowledge = useAcknowledgePattern()
  const icon = patternIcon[pattern.pattern_type] ?? patternIcon.default

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      background: 'var(--clay-muted)',
      border: '1px solid var(--border-warm)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
    }}>
      <span style={{ fontSize: '0.9rem', marginTop: '2px', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.62rem',
            fontWeight: 400,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--clay)',
          }}>
            {pattern.pattern_type.replace(/_/g, ' ')}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            flexShrink: 0,
          }}>
            {format(parseISO(pattern.detected_at), 'MMM d')}
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1.5 }}>
          {pattern.description}
        </p>
        {pattern.suggestion && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 300, color: 'var(--ink-muted)', marginTop: '4px' }}>
            → {pattern.suggestion}
          </p>
        )}
      </div>
      <button
        onClick={() => acknowledge.mutate(pattern.id)}
        disabled={acknowledge.isPending}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ink-muted)',
          fontSize: '0.7rem',
          padding: '4px 6px',
          borderRadius: '6px',
          flexShrink: 0,
          opacity: acknowledge.isPending ? 0.5 : 1,
          transition: 'opacity 200ms',
        }}
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
