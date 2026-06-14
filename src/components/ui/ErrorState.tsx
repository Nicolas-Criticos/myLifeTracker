interface Props {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Failed to load data.',
  onRetry,
}: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '48px 32px',
      fontFamily: 'var(--font-body)',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '1.4rem' }}>⚠️</p>
      <p style={{ fontSize: '0.88rem', fontWeight: 300, color: 'var(--ink)' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '4px',
            padding: '8px 20px',
            background: 'transparent',
            color: 'var(--ink-muted)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorState
