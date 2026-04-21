import { useAcknowledgePattern } from '../../lib/queries'
import type { Pattern } from '../../lib/supabase'
import { format, parseISO } from 'date-fns'

interface PatternAlertProps {
  pattern: Pattern
}

const patternIcon: Record<string, string> = {
  repeated_delay: '⏱',
  low_energy_overload: '🔋',
  avoidance: '↩',
  default: '◎',
}

export default function PatternAlert({ pattern }: PatternAlertProps) {
  const acknowledge = useAcknowledgePattern()
  const icon = patternIcon[pattern.pattern_type] ?? patternIcon.default

  return (
    <div className="flex items-start gap-3 bg-amber-400/5 border border-amber-400/20 rounded-lg p-3">
      <span className="text-amber-400 text-base mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-amber-400/80 text-xs font-medium uppercase tracking-wide">
            {pattern.pattern_type.replace(/_/g, ' ')}
          </span>
          <span className="text-[#64748b] text-xs shrink-0">
            {format(parseISO(pattern.detected_at), 'MMM d')}
          </span>
        </div>
        <p className="text-[#f1f5f9] text-sm mt-0.5">{pattern.description}</p>
        {pattern.suggestion && (
          <p className="text-[#64748b] text-xs mt-1">→ {pattern.suggestion}</p>
        )}
      </div>
      <button
        onClick={() => acknowledge.mutate(pattern.id)}
        disabled={acknowledge.isPending}
        className="text-[#64748b] hover:text-[#f1f5f9] text-xs shrink-0 transition-colors px-2 py-1 rounded hover:bg-white/5"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
