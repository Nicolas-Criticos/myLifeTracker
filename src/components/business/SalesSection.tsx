import type { Product, CostComponent } from '../../lib/supabase'
import { LABEL, FIELD_STYLE, SECTION_LABEL, PRIMARY_BUTTON } from './businessStyles'
import { FULFILLMENT_FEE_PCT } from './businessUtils'

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface SaleFormState {
  date: string
  product_id: string
  units: string
  sell_price_actual: string
  fulfillment: boolean
  delivery_cost: string
  notes: string
}

interface PreviewRowProps {
  label: string
  value: number
  muted?: boolean
  hideIfZero?: boolean
}

function PreviewRow({ label, value, muted, hideIfZero }: PreviewRowProps) {
  if (hideIfZero && value === 0) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: muted ? 'var(--ink-muted)' : 'var(--ink)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', fontWeight: 400, color: muted ? 'var(--ink-muted)' : 'var(--ink)' }}>
        R {value.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}

// ── PROPS ─────────────────────────────────────────────────────────────────────

interface Props {
  products: Product[]
  componentsByProduct: Record<string, CostComponent[]>
  saleForm: SaleFormState
  setSaleForm: React.Dispatch<React.SetStateAction<SaleFormState>>
  submittingSale: boolean
  saleDone: boolean
  onPickProduct: (id: string) => void
  onSubmit: (e: React.FormEvent) => void
  // Derived values
  saleRevenue: number
  saleCogsTotal: number
  saleFulfillFee: number
  saleDeliveryNum: number
  saleProfit: number
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export function SalesSection({
  products,
  saleForm, setSaleForm,
  submittingSale, saleDone,
  onPickProduct, onSubmit,
  saleRevenue, saleCogsTotal, saleFulfillFee, saleDeliveryNum, saleProfit,
}: Props) {
  const selectedProduct = products.find(p => p.id === saleForm.product_id)

  return (
    <section style={{ marginBottom: '48px' }}>
      <p style={SECTION_LABEL}>Log a sale</p>
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {/* ── Left column: inputs ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Date</label>
                <input
                  type="date"
                  value={saleForm.date}
                  onChange={e => setSaleForm(f => ({ ...f, date: e.target.value }))}
                  style={FIELD_STYLE}
                  required
                />
              </div>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Quantity</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="0"
                  value={saleForm.units}
                  onChange={e => setSaleForm(f => ({ ...f, units: e.target.value }))}
                  style={FIELD_STYLE}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Product</label>
              <select
                value={saleForm.product_id}
                onChange={e => onPickProduct(e.target.value)}
                style={{ ...FIELD_STYLE, cursor: 'pointer' }}
                required
              >
                <option value="">Select product…</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — R{p.sell_price}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>
                Price per unit {selectedProduct ? `(default R${selectedProduct.sell_price})` : ''}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Auto-fills from product"
                value={saleForm.sell_price_actual}
                onChange={e => setSaleForm(f => ({ ...f, sell_price_actual: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>

            {/* Fulfillment toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                role="switch"
                aria-checked={saleForm.fulfillment}
                onClick={() => setSaleForm(f => ({ ...f, fulfillment: !f.fulfillment }))}
                style={{
                  width: '38px', height: '22px', borderRadius: '999px', border: 'none',
                  background: saleForm.fulfillment ? 'var(--olive)' : 'rgba(44,42,37,0.18)',
                  position: 'relative', cursor: 'pointer', transition: 'background 200ms ease',
                  flexShrink: 0, padding: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px',
                  left: saleForm.fulfillment ? '19px' : '3px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#fffcf5', transition: 'left 200ms ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }} />
              </button>
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
                  Via fulfillment channel ({(FULFILLMENT_FEE_PCT * 100).toFixed(0)}% fee)
                </p>
                {saleForm.fulfillment && saleRevenue > 0 && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: 300, color: 'var(--olive)', margin: '2px 0 0' }}>
                    Fee: R {saleFulfillFee.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Delivery cost (R)</label>
              <input
                type="number" min="0" step="0.01" placeholder="0"
                value={saleForm.delivery_cost}
                onChange={e => setSaleForm(f => ({ ...f, delivery_cost: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>

            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Notes</label>
              <input
                type="text" placeholder="Optional"
                value={saleForm.notes}
                onChange={e => setSaleForm(f => ({ ...f, notes: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>

            <button
              type="submit"
              disabled={submittingSale}
              style={{
                ...PRIMARY_BUTTON,
                background: saleDone ? 'var(--olive-muted)' : 'var(--olive)',
                color: saleDone ? 'var(--olive)' : 'rgba(255,252,245,0.95)',
                cursor: submittingSale ? 'not-allowed' : 'pointer',
                opacity: submittingSale ? 0.6 : 1,
                marginTop: '8px',
                alignSelf: 'flex-start',
              }}
            >
              {submittingSale ? 'Logging…' : saleDone ? 'Logged ✓' : 'Log Sale'}
            </button>
          </div>

          {/* ── Right column: live profit preview ── */}
          <div style={{
            background: 'rgba(107,124,92,0.05)',
            borderRadius: 'var(--radius-sm)',
            padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '14px',
            border: '1px solid var(--border)',
          }}>
            <p style={{ ...LABEL, marginBottom: '4px' }}>Profit preview</p>
            <PreviewRow label="Revenue" value={saleRevenue} />
            <PreviewRow label="COGS" value={-saleCogsTotal} muted />
            <PreviewRow label="Fulfillment fee" value={-saleFulfillFee} muted hideIfZero />
            <PreviewRow label="Delivery" value={-saleDeliveryNum} muted hideIfZero />
            <div style={{
              borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '4px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 500,
                letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)',
              }}>Profit</span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500,
                color: saleProfit >= 0 ? '#6b7c5c' : '#a05050',
              }}>
                R {saleProfit.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
              </span>
            </div>
            {!saleForm.product_id && (
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 300,
                color: 'var(--ink-muted)', fontStyle: 'italic', marginTop: '4px',
              }}>
                Pick a product to see live calculations.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

export default SalesSection
