import { useCurrentSeasonPhase } from '../../lib/rehab-queries'

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}

// Small SVG icons for each phase
function PhaseIcon({ phase }: { phase: string }) {
  const color = '#5a7247'
  switch (phase) {
    case 'Recovery':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 18 C11 10, 4 8, 4 4 Q9 2 11 7 Q13 2 18 4 C18 8 11 10 11 18Z"
            fill={color} opacity="0.8" />
        </svg>
      )
    case 'Dormancy Prep':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 18 C11 12, 5 9, 5 5 Q11 3 11 9 Q11 3 17 5 C17 9 11 12 11 18Z"
            fill={color} opacity="0.5" />
          <path d="M6 19 L16 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
        </svg>
      )
    case 'Dormancy Work':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M5 8 L17 8 M8 5 L5 8 L8 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 14 L17 14 M14 11 L17 14 L14 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'Spring Prep':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="4" fill={color} opacity="0.7" />
          {[0,45,90,135,180,225,270,315].map((a, i) => (
            <line key={i}
              x1={11 + Math.cos((a * Math.PI) / 180) * 6}
              y1={11 + Math.sin((a * Math.PI) / 180) * 6}
              x2={11 + Math.cos((a * Math.PI) / 180) * 9}
              y2={11 + Math.sin((a * Math.PI) / 180) * 9}
              stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"
            />
          ))}
        </svg>
      )
    case 'Growing Season':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <ellipse cx="11" cy="9" rx="6" ry="5" fill={color} opacity="0.3" />
          <ellipse cx="8" cy="11" rx="5" ry="4" fill={color} opacity="0.3" />
          <ellipse cx="14" cy="11" rx="5" ry="4" fill={color} opacity="0.3" />
          <circle cx="9"  cy="13" r="2" fill={color} opacity="0.75" />
          <circle cx="13" cy="12" r="1.8" fill={color} opacity="0.65" />
          <rect x="10" y="16" width="2" height="4" rx="1" fill={color} opacity="0.6" />
        </svg>
      )
    default: // Off-Season
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" opacity="0.4" fill="none"/>
          <path d="M11 4 V8 M11 14 V18 M4 11 H8 M14 11 H18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </svg>
      )
  }
}

export default function SeasonIndicator() {
  const { phase, months, objective } = useCurrentSeasonPhase()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      background: 'rgba(90, 114, 71, 0.07)',
      border: '1px solid rgba(90, 114, 71, 0.14)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 20px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: 40, height: 40,
        borderRadius: '50%',
        background: 'rgba(90, 114, 71, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <PhaseIcon phase={phase} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...LABEL, marginBottom: 3 }}>Current Phase</p>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          fontWeight: 400,
          color: 'var(--ink)',
          margin: 0,
          lineHeight: 1.3,
        }}>
          {phase}
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            color: 'var(--ink-faint)',
            marginLeft: 10,
            letterSpacing: '0.06em',
            fontWeight: 300,
          }}>
            {months}
          </span>
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          margin: '4px 0 0',
          lineHeight: 1.4,
        }}>
          {objective}
        </p>
      </div>
    </div>
  )
}
