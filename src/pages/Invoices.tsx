import InvoiceList from '../components/invoices/InvoiceList'

export default function Invoices() {
  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <svg width="48" height="48" fill="none" viewBox="0 0 48 48" style={{ marginBottom: '14px' }}>
          <circle cx="24" cy="24" r="23" stroke="rgba(107,124,92,0.12)" strokeWidth="1" />
          <circle cx="24" cy="24" r="16" stroke="rgba(107,124,92,0.2)"  strokeWidth="1" />
          <circle cx="24" cy="24" r="8"  stroke="rgba(107,124,92,0.3)"  strokeWidth="1" />
          <circle cx="24" cy="24" r="3"  fill="rgba(107,124,92,0.5)" />
        </svg>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.6rem',
          color: 'var(--ink)',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}>
          Invoice Dashboard
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Samsara · EBN
        </p>
      </div>

      <InvoiceList />
    </div>
  )
}
