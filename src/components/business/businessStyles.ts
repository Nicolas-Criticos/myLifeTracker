// ── SHARED STYLE CONSTANTS FOR BUSINESS COMPONENTS ───────────────────────────
import type React from 'react'

export const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

export const FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  padding: '8px 0 10px',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  fontWeight: 300,
  color: 'var(--ink)',
  outline: 'none',
}

export const SECTION_LABEL: React.CSSProperties = {
  ...LABEL,
  fontSize: '0.68rem',
  letterSpacing: '0.18em',
  marginBottom: '20px',
}

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(255,252,245,0.95)',
    border: '1px solid rgba(44,42,37,0.08)',
    borderRadius: '12px',
    color: '#2c2a25',
    fontSize: 12,
    fontFamily: 'var(--font-body)',
    boxShadow: '0 4px 24px rgba(44,42,37,0.08)',
  },
}

export const PRIMARY_BUTTON: React.CSSProperties = {
  background: 'var(--olive)',
  color: 'rgba(255,252,245,0.95)',
  border: 'none',
  borderRadius: 'var(--radius-full)',
  padding: '12px 28px',
  fontFamily: 'var(--font-body)',
  fontSize: '0.68rem',
  fontWeight: 400,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 200ms',
}

export const GHOST_BUTTON: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--ink-muted)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-full)',
  padding: '8px 18px',
  fontFamily: 'var(--font-body)',
  fontSize: '0.66rem',
  fontWeight: 400,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'all 200ms',
}
