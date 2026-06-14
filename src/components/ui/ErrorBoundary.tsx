import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '40px',
          fontFamily: 'var(--font-body)',
          color: 'var(--ink)',
        }}>
          <p style={{ fontSize: '1.5rem' }}>⚠️</p>
          <p style={{ fontSize: '1rem', fontWeight: 300 }}>Something went wrong</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', maxWidth: '400px', textAlign: 'center' }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '8px',
              padding: '10px 24px',
              background: 'var(--olive)',
              color: '#fffcf5',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
