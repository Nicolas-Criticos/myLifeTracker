import type { Product, CostComponent } from '../../lib/supabase'
import { productUnitCogs } from './businessUtils'
import { LABEL, SECTION_LABEL, PRIMARY_BUTTON, GHOST_BUTTON } from './businessStyles'

interface Props {
  products: Product[]
  componentsByProduct: Record<string, CostComponent[]>
  onCreateClick: () => void
  onEditClick: (p: Product) => void
  onDeleteClick: (p: Product) => void
}

export function ProductsSection({
  products,
  componentsByProduct,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: Props) {
  return (
    <section style={{ marginBottom: '48px' }}>
      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <p style={SECTION_LABEL}>Products</p>
        <button type="button" style={PRIMARY_BUTTON} onClick={onCreateClick}>
          + Add product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.9rem',
            color: 'var(--ink-muted)', fontStyle: 'italic',
          }}>
            No products yet. Add your first product to begin.
          </p>
        </div>
      ) : (
        <div className="stagger" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {products.map(product => {
            const comps = componentsByProduct[product.id] ?? []
            const unitCogs = productUnitCogs(comps)
            const margin = product.sell_price - unitCogs
            const marginPct = product.sell_price > 0 ? (margin / product.sell_price) * 100 : 0

            return (
              <div key={product.id} className="card" style={{ padding: '24px 24px 18px' }}>
                {/* Product header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400,
                      color: 'var(--ink)', lineHeight: 1.2, marginBottom: '4px',
                    }}>
                      {product.name}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: '0.62rem', fontWeight: 400,
                      letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)',
                    }}>
                      {product.business ?? 'samsara'}{product.sku ? ` · ${product.sku}` : ''}
                    </p>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 300,
                    color: 'var(--ink)', whiteSpace: 'nowrap',
                  }}>
                    R {product.sell_price.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                {/* Cost components */}
                {comps.length > 0 ? (
                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', marginBottom: '14px' }}>
                    {comps.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.74rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                          {c.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 400, color: 'var(--ink)' }}>
                          R {(c.amount ?? 0).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 300,
                    color: 'var(--ink-muted)', fontStyle: 'italic',
                    padding: '12px 0', borderTop: '1px solid var(--border)', marginBottom: '14px',
                  }}>
                    No costs logged yet.
                  </p>
                )}

                {/* Margin row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: '12px', borderTop: '1px solid var(--border)', marginBottom: '16px',
                }}>
                  <span style={LABEL}>Margin</span>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 400,
                    color: margin >= 0 ? '#6b7c5c' : '#a05050',
                  }}>
                    R {margin.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                    <span style={{ fontSize: '0.78rem', marginLeft: '8px', color: 'var(--ink-muted)' }}>
                      ({marginPct.toFixed(0)}%)
                    </span>
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" style={{ ...GHOST_BUTTON, flex: 1 }} onClick={() => onEditClick(product)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    style={{ ...GHOST_BUTTON, color: 'var(--clay)', borderColor: 'var(--border-warm)' }}
                    onClick={() => onDeleteClick(product)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ProductsSection
