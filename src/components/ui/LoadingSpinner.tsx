interface Props {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ message = 'Loading…', size = 'md' }: Props) {
  const dim = size === 'sm' ? 20 : size === 'lg' ? 48 : 32

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '40px',
      fontFamily: 'var(--font-body)',
    }}>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 32 32"
        fill="none"
        style={{ animation: 'spin 1.2s linear infinite' }}
      >
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke="var(--border)"
          strokeWidth="2.5"
        />
        <path
          d="M16 3 A13 13 0 0 1 29 16"
          stroke="var(--olive)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {message && (
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          letterSpacing: '0.06em',
        }}>
          {message}
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default LoadingSpinner
