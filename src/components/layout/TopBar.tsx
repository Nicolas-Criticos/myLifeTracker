import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { format } from 'date-fns'
import { nowInSAST } from '../../lib/utils'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/todos', label: 'To-Dos' },
  { to: '/journal', label: 'Journal' },
  { to: '/dreams', label: 'Dreams' },
  { to: '/projects', label: 'Projects' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/business', label: 'Business' },
  { to: '/finances', label: 'Finances' },
  { to: '/olive-rehab', label: 'Olive Rehab' },
]

const linkStyle = (isActive: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-body)',
  fontSize: '0.68rem',
  fontWeight: 400,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: isActive ? 'var(--olive)' : 'var(--ink-faint)',
  transition: 'color 200ms ease',
})

const mobileLinkStyle = (isActive: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-body)',
  fontSize: '0.82rem',
  fontWeight: isActive ? 500 : 300,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: isActive ? 'var(--olive)' : 'var(--ink)',
  padding: '14px 24px',
  display: 'block',
  borderBottom: '1px solid var(--border)',
  transition: 'color 200ms ease, background 200ms ease',
  background: isActive ? 'rgba(107, 124, 92, 0.06)' : 'transparent',
})

export default function TopBar() {
  const now = nowInSAST()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '56px',
        background: 'rgba(255, 252, 245, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" stroke="rgba(107,124,92,0.12)" strokeWidth="1" />
            <circle cx="14" cy="14" r="9"  stroke="rgba(107,124,92,0.2)"  strokeWidth="1" />
            <circle cx="14" cy="14" r="5"  stroke="rgba(107,124,92,0.35)" strokeWidth="1" />
            <circle cx="14" cy="14" r="2"  fill="rgba(107,124,92,0.5)" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.05rem',
            color: 'var(--ink)',
            letterSpacing: '0.05em',
          }}>
            MyLifeTracker
          </span>
        </div>

        {/* Desktop nav — hidden on mobile */}
        <nav className="desktop-nav">
          {nav.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => linkStyle(isActive)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Date (desktop) + Hamburger (mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="desktop-date" style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.8rem',
            color: 'var(--ink-muted)',
            letterSpacing: '0.03em',
          }}>
            {format(now, 'EEE, MMM d')}
          </span>

          {/* Hamburger button — mobile only */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'none', /* overridden by media query */
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 49,
            background: 'rgba(0,0,0,0.2)',
          }}
          onClick={() => setMenuOpen(false)}
        >
          <nav
            style={{
              background: 'rgba(255, 252, 245, 0.98)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderBottom: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile date */}
            <div style={{
              padding: '12px 24px',
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.72rem',
              color: 'var(--ink-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderBottom: '1px solid var(--border)',
            }}>
              {format(now, 'EEEE, MMMM d, yyyy')}
            </div>

            {nav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => mobileLinkStyle(isActive)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
