import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useInvoices } from '../../lib/invoiceQueries'
import type { InvoiceStatus } from '../../lib/invoiceTypes'
import InvoiceForm from './InvoiceForm'

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const STATUS_FILTERS: { key: InvoiceStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
]

function statusPill(status: InvoiceStatus): React.CSSProperties {
  switch (status) {
    case 'draft':     return { background: 'rgba(44,42,37,0.06)',    color: 'var(--ink-muted)' }
    case 'sent':      return { background: 'rgba(74,107,138,0.1)',   color: '#4a6b8a' }
    case 'paid':      return { background: 'rgba(107,124,92,0.1)',   color: 'var(--olive)' }
    case 'overdue':   return { background: 'rgba(184,124,90,0.12)',  color: 'var(--clay)' }
    case 'cancelled': return { background: 'rgba(44,42,37,0.04)',    color: 'var(--ink-faint)' }
  }
}

export default function InvoiceList() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [showForm, setShowForm] = useState(false)

  const { data: invoices = [], isLoading } = useInvoices(
    statusFilter === 'all' ? undefined : statusFilter,
  )

  function calcTotal(inv: (typeof invoices)[0]) {
    const subtotal = (inv.items ?? []).reduce((s, item) => s + item.line_total, 0)
    return subtotal + (inv.delivery_fee ?? 0)
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.4rem',
            color: 'var(--ink)',
            letterSpacing: '0.03em',
          }}>
            Invoices
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink-muted)', marginTop: '2px' }}>
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: 'var(--olive)',
            color: 'rgba(255,252,245,0.9)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '10px 22px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
        >
          New Invoice
        </button>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            style={{
              background: statusFilter === key ? 'rgba(44,42,37,0.08)' : 'transparent',
              border: '1px solid',
              borderColor: statusFilter === key ? 'var(--border)' : 'transparent',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              fontWeight: statusFilter === key ? 400 : 300,
              color: statusFilter === key ? 'var(--ink)' : 'var(--ink-muted)',
              cursor: 'pointer',
              transition: 'all 150ms',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', fontFamily: 'var(--font-body)', fontWeight: 300, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            Loading…
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 32px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.95rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
              No invoices found. Create your first invoice above.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Invoice', 'Client', 'Issued', 'Due', 'Total', 'Status'].map(h => (
                    <th
                      key={h}
                      style={{
                        ...LABEL,
                        textAlign: 'left',
                        padding: '16px 20px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i, arr) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    style={{
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(44,42,37,0.02)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 400, color: 'var(--ink)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                      {inv.invoice_number}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 300, color: 'var(--ink)' }}>
                      {inv.client?.name ?? '—'}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {format(parseISO(inv.issue_date), 'MMM d, yyyy')}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: inv.status === 'overdue' ? 'var(--clay)' : 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                      {format(parseISO(inv.due_date), 'MMM d, yyyy')}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 300, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                      R {calcTotal(inv).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.62rem',
                        fontWeight: 400,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        ...statusPill(inv.status),
                      }}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New invoice modal */}
      {showForm && (
        <InvoiceForm
          onClose={() => setShowForm(false)}
          onSuccess={id => {
            setShowForm(false)
            navigate(`/invoices/${id}`)
          }}
        />
      )}
    </div>
  )
}
