import { NavLink } from 'react-router-dom'
import { format } from 'date-fns'
import { nowInSAST } from '../../lib/utils'
import ReadingList from '../dashboard/ReadingList'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/todos', label: 'To-Dos' },
  { to: '/journal', label: 'Journal' },
  { to: '/dreams', label: 'Dreams' },
  { to: '/projects', label: 'Projects' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/business', label: 'Business' },
  { to: '/finances', label: 'Finances' },
  { to: '/insights', label: 'Insights' },
  { to: '/olive-rehab', label: 'Olive Rehab' },
]

export default function TopBar() {
  const now = nowInSAST()

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: '64px',
      background: 'rgba(255, 252, 245, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="13" stroke="rgba(107,124,92,0.12)" strokeWidth="1" />
          <circle cx="14" cy="14" r="9"  stroke="rgba(107,124,92,0.2)"  strokeWidth="1" />
          <circle cx="14" cy="14" r="5"  stroke="rgba(107,124,92,0.35)" strokeWidth="1" />
          <circle cx="14" cy="14" r="2"  fill="rgba(107,124,92,0.5)" />
        </svg>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.15rem',
          color: 'var(--ink)',
          letterSpacing: '0.05em',
        }}>
          Samsara
        </span>
      </div>

      {/* Center nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
        {nav.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              fontWeight: 400,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: isActive ? 'var(--olive)' : 'var(--ink-faint)',
              transition: 'color 200ms ease',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Right side: date + reading icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.8rem',
          color: 'var(--ink-muted)',
          letterSpacing: '0.03em',
        }}>
          {format(now, 'EEE, MMM d')}
        </span>
        <ReadingList inline />
      </div>
    </header>
  )
}
