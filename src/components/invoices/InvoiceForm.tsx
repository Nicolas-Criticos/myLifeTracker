import { useState, useEffect } from 'react'
import { format, endOfMonth } from 'date-fns'
import {
  useClients, useBusinessProducts, useCreateClient, useCreateInvoice,
} from '../../lib/invoiceQueries'
import type { BusinessType } from '../../lib/invoiceTypes'

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  display: 'block',
  marginBottom: '6px',
}

const FIELD: React.CSSProperties = {
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

interface LineItem {
  product_id: string
  description: string
  quantity: number
  unit_price: number
}

interface Props {
  onClose: () => void
  onSuccess: (id: string) => void
}

export default function InvoiceForm({ onClose, onSuccess }: Props) {
  const [business, setBusiness] = useState<BusinessType>('samsara')
  const [clientId, setClientId] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' })
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [deliveryFee, setDeliveryFee] = useState(100)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { product_id: '', description: '', quantity: 1, unit_price: 0 },
  ])
  const [error, setError] = useState<string | null>(null)

  const { data: clients = [] } = useClients()
  const { data: products = [] } = useBusinessProducts(business)
  const createClient = useCreateClient()
  const createInvoice = useCreateInvoice()

  // Reset delivery fee and items when business changes
  useEffect(() => {
    setDeliveryFee(business === 'samsara' ? 100 : 0)
    setItems([{ product_id: '', description: '', quantity: 1, unit_price: 0 }])
  }, [business])

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unit_price, 0)
  const total = subtotal + deliveryFee

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems(prev => {
      const next = [...prev]
      if (field === 'product_id' && typeof value === 'string') {
        const product = products.find(p => p.id === value)
        next[index] = {
          ...next[index],
          product_id: value,
          description: product?.name ?? next[index].description,
          unit_price: product?.unit_price ?? next[index].unit_price,
        }
      } else {
        next[index] = { ...next[index], [field]: value }
      }
      return next
    })
  }

  function addItem() {
    setItems(prev => [...prev, { product_id: '', description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(index: number) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let finalClientId = clientId

    if (showNewClient) {
      if (!newClient.name.trim()) {
        setError('Client name is required')
        return
      }
      try {
        const created = await createClient.mutateAsync({
          name: newClient.name.trim(),
          email: newClient.email || undefined,
          phone: newClient.phone || undefined,
        })
        finalClientId = created.id
      } catch {
        setError('Failed to create client. Please try again.')
        return
      }
    }

    if (!finalClientId) {
      setError('Please select or create a client')
      return
    }

    const validItems = items.filter(
      item => (item.description.trim() || item.product_id) && item.quantity > 0,
    )
    if (validItems.length === 0) {
      setError('At least one line item with a description is required')
      return
    }

    try {
      const invoice = await createInvoice.mutateAsync({
        business,
        client_id: finalClientId,
        issue_date: issueDate,
        due_date: dueDate,
        delivery_fee: deliveryFee,
        notes: notes.trim() || undefined,
        items: validItems.map(item => ({
          product_id: item.product_id || undefined,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      })
      onSuccess(invoice.id)
    } catch {
      setError('Failed to create invoice. Please try again.')
    }
  }

  const isSubmitting = createInvoice.isPending || createClient.isPending

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,42,37,0.38)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 24px 80px',
        overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="animate-in"
        style={{
          background: 'rgba(255,252,245,0.97)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '40px',
          width: '100%',
          maxWidth: '680px',
          boxShadow: '0 24px 64px rgba(44,42,37,0.14)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-muted)',
            fontSize: '1.4rem',
            lineHeight: 1,
            padding: '4px 8px',
            fontWeight: 300,
          }}
        >
          ×
        </button>

        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.5rem',
          color: 'var(--ink)',
          letterSpacing: '0.03em',
          marginBottom: '32px',
        }}>
          New Invoice
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Business selector */}
          <div>
            <label style={LABEL}>Business</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['samsara', 'ebn'] as BusinessType[]).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBusiness(b)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: '1px solid',
                    borderColor: business === b ? 'var(--olive)' : 'var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: business === b ? 'var(--olive-muted)' : 'transparent',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.78rem',
                    fontWeight: business === b ? 400 : 300,
                    color: business === b ? 'var(--olive)' : 'var(--ink-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {b === 'samsara' ? 'Samsara' : 'EBN'}
                </button>
              ))}
            </div>
          </div>

          {/* Client */}
          <div>
            <label style={LABEL}>Client</label>
            {!showNewClient ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  style={{ ...FIELD, cursor: 'pointer', flex: 1 }}
                >
                  <option value="">Select client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setShowNewClient(true); setClientId('') }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    padding: '8px 0 10px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.72rem',
                    color: 'var(--ink-muted)',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + New
                </button>
              </div>
            ) : (
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', color: 'var(--ink-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    New client
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewClient(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}
                  >
                    Use existing
                  </button>
                </div>
                <input
                  placeholder="Client name *"
                  value={newClient.name}
                  onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))}
                  style={FIELD}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newClient.email}
                  onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))}
                  style={FIELD}
                />
                <input
                  placeholder="Phone"
                  value={newClient.phone}
                  onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))}
                  style={FIELD}
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={LABEL}>Issue date</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                style={FIELD}
                required
              />
            </div>
            <div>
              <label style={LABEL}>Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={FIELD}
                required
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <label style={LABEL}>Line items</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 28px', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <select
                      value={item.product_id}
                      onChange={e => updateItem(i, 'product_id', e.target.value)}
                      style={{ ...FIELD, fontSize: '0.82rem', cursor: 'pointer', marginBottom: item.product_id ? 0 : '8px' }}
                    >
                      <option value="">Custom…</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {!item.product_id && (
                      <input
                        placeholder="Description *"
                        value={item.description}
                        onChange={e => updateItem(i, 'description', e.target.value)}
                        style={{ ...FIELD, fontSize: '0.82rem' }}
                      />
                    )}
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Qty"
                    value={item.quantity || ''}
                    onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                    style={{ ...FIELD, fontSize: '0.82rem' }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unit_price || ''}
                    onChange={e => updateItem(i, 'unit_price', Number(e.target.value))}
                    style={{ ...FIELD, fontSize: '0.82rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                      color: 'var(--ink-muted)',
                      fontSize: '1.1rem',
                      opacity: items.length === 1 ? 0.25 : 0.55,
                      paddingBottom: '10px',
                      fontWeight: 300,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.68rem',
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                  transition: 'all 150ms',
                }}
              >
                + Add item
              </button>
            </div>
          </div>

          {/* Delivery fee + Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={LABEL}>Delivery fee (R)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={e => setDeliveryFee(Number(e.target.value))}
                style={FIELD}
              />
            </div>
            <div>
              <label style={LABEL}>Notes</label>
              <input
                type="text"
                placeholder="Optional"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={FIELD}
              />
            </div>
          </div>

          {/* Totals summary */}
          <div style={{
            background: 'rgba(44,42,37,0.03)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink-muted)' }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)' }}>R {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink-muted)' }}>Delivery</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)' }}>R {deliveryFee.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 400, color: 'var(--ink)', letterSpacing: '0.04em' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 300, color: 'var(--ink)' }}>R {total.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--clay)', fontWeight: 300 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '12px 24px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.68rem',
                fontWeight: 300,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: 'var(--olive)',
                color: 'rgba(255,252,245,0.9)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '12px 28px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.68rem',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'all 200ms',
              }}
            >
              {isSubmitting ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
