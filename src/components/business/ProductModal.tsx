import { useState, useMemo } from 'react'
import {
  useCreateProduct, useUpdateProduct,
  useCreateCostComponent, useDeleteCostComponentsForProduct,
} from '../../lib/queries'
import type { Product, CostComponent } from '../../lib/supabase'
import {
  LABEL, FIELD_STYLE, SECTION_LABEL, PRIMARY_BUTTON, GHOST_BUTTON,
} from './businessStyles'

// ── FORM STATE TYPE ───────────────────────────────────────────────────────────

interface ProductFormState {
  name: string
  sku: string
  sellPrice: string
  unit: string
  business: string
  rawMaterial: string
  packaging: string
  branding: string
  otherCost: string
  otherLabel: string
}

const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: '', sku: '', sellPrice: '', unit: 'each', business: 'samsara',
  rawMaterial: '', packaging: '', branding: '', otherCost: '', otherLabel: '',
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

interface Props {
  product: Product | null
  components: CostComponent[]
  onClose: () => void
  onSaved: () => void
}

export function ProductModal({ product, components, onClose, onSaved }: Props) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const createCostComponent = useCreateCostComponent()
  const deleteCostComponents = useDeleteCostComponentsForProduct()

  const initial = useMemo<ProductFormState>(() => {
    if (!product) return EMPTY_PRODUCT_FORM
    const findAmount = (name: string) => {
      const c = components.find(
        x => x.product_id === product.id && x.name.toLowerCase() === name.toLowerCase(),
      )
      return c?.amount != null ? String(c.amount) : ''
    }
    const KNOWN = ['raw material', 'packaging', 'branding']
    const other = components.find(
      c => c.product_id === product.id && !KNOWN.includes(c.name.toLowerCase()),
    )
    return {
      name: product.name ?? '',
      sku: product.sku ?? '',
      sellPrice: String(product.sell_price ?? ''),
      unit: product.unit ?? 'each',
      business: product.business ?? 'samsara',
      rawMaterial: findAmount('Raw Material'),
      packaging: findAmount('Packaging'),
      branding: findAmount('Branding'),
      otherCost: other?.amount != null ? String(other.amount) : '',
      otherLabel: other && other.amount != null ? other.name : '',
    }
  }, [product, components])

  const [form, setForm] = useState<ProductFormState>(initial)
  const [saving, setSaving] = useState(false)

  const sellPriceNum = Number(form.sellPrice) || 0
  const cogs =
    (Number(form.rawMaterial) || 0) +
    (Number(form.packaging) || 0) +
    (Number(form.branding) || 0) +
    (Number(form.otherCost) || 0)
  const margin = sellPriceNum - cogs
  const marginPct = sellPriceNum > 0 ? (margin / sellPriceNum) * 100 : 0

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.sellPrice) return
    setSaving(true)
    try {
      let productId: string
      if (product) {
        const updated = await updateProduct.mutateAsync({
          id: product.id,
          name: form.name.trim(),
          sku: form.sku.trim() || null,
          sell_price: Number(form.sellPrice),
          unit: form.unit.trim() || 'each',
          business: form.business,
          active: true,
        })
        productId = updated.id
      } else {
        const created = await createProduct.mutateAsync({
          name: form.name.trim(),
          sku: form.sku.trim() || null,
          sell_price: Number(form.sellPrice),
          unit: form.unit.trim() || 'each',
          business: form.business,
          description: null,
          active: true,
        } as Omit<Product, 'id' | 'created_at'>)
        productId = created.id
      }

      await deleteCostComponents.mutateAsync(productId)

      const rows: Array<{ name: string; amount: number }> = [
        { name: 'Raw Material', amount: Number(form.rawMaterial) || 0 },
        { name: 'Packaging', amount: Number(form.packaging) || 0 },
        { name: 'Branding', amount: Number(form.branding) || 0 },
        { name: form.otherLabel.trim() || 'Other', amount: Number(form.otherCost) || 0 },
      ]
      for (const row of rows) {
        if (row.amount > 0) {
          await createCostComponent.mutateAsync({
            product_id: productId,
            name: row.name,
            cost_type: 'fixed',
            amount: row.amount,
            amount_min: null,
            amount_max: null,
            applies_to: 'per_unit',
            active: true,
          } as Omit<CostComponent, 'id'>)
        }
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(44,42,37,0.38)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 24px 80px',
        overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <form
        onSubmit={handleSave}
        className="animate-in"
        style={{
          background: 'rgba(255,252,245,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '40px',
          width: '100%', maxWidth: '600px',
          boxShadow: '0 24px 64px rgba(44,42,37,0.14)',
          position: 'relative',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}
      >
        <button
          type="button" onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--ink-muted)', fontSize: '1.4rem', lineHeight: 1, padding: '4px 8px', fontWeight: 300,
          }}
        >×</button>

        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1.5rem',
          color: 'var(--ink)', letterSpacing: '0.03em', margin: '0 0 4px',
        }}>
          {product ? 'Edit product' : 'New product'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Product name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={FIELD_STYLE} required autoFocus />
          </div>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>SKU</label>
            <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} style={FIELD_STYLE} placeholder="Optional" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Default sell price (R)</label>
            <input type="number" min="0" step="0.01" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} style={FIELD_STYLE} required />
          </div>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Unit</label>
            <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Business</label>
            <select value={form.business} onChange={e => setForm(f => ({ ...f, business: e.target.value }))} style={{ ...FIELD_STYLE, cursor: 'pointer' }}>
              <option value="samsara">samsara</option>
              <option value="ebn">ebn</option>
            </select>
          </div>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <p style={{ ...SECTION_LABEL, marginBottom: '16px' }}>Cost breakdown — per unit</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Raw material / Oil</label>
              <input type="number" min="0" step="0.01" placeholder="0" value={form.rawMaterial} onChange={e => setForm(f => ({ ...f, rawMaterial: e.target.value }))} style={FIELD_STYLE} />
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Packaging</label>
              <input type="number" min="0" step="0.01" placeholder="0" value={form.packaging} onChange={e => setForm(f => ({ ...f, packaging: e.target.value }))} style={FIELD_STYLE} />
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Branding</label>
              <input type="number" min="0" step="0.01" placeholder="0" value={form.branding} onChange={e => setForm(f => ({ ...f, branding: e.target.value }))} style={FIELD_STYLE} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Other cost</label>
              <input type="number" min="0" step="0.01" placeholder="0" value={form.otherCost} onChange={e => setForm(f => ({ ...f, otherCost: e.target.value }))} style={FIELD_STYLE} />
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Description</label>
              <input type="text" placeholder="What is this cost?" value={form.otherLabel} onChange={e => setForm(f => ({ ...f, otherLabel: e.target.value }))} style={FIELD_STYLE} />
            </div>
          </div>
        </div>

        {/* Live margin preview */}
        <div style={{
          marginTop: '12px', padding: '16px 20px',
          background: 'rgba(107,124,92,0.06)', borderRadius: 'var(--radius-sm)',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px',
        }}>
          <div>
            <p style={{ ...LABEL, marginBottom: '4px' }}>Total COGS</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 300, color: 'var(--ink)' }}>
              R {cogs.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p style={{ ...LABEL, marginBottom: '4px' }}>Margin (R)</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 300, color: margin >= 0 ? '#6b7c5c' : '#a05050' }}>
              R {margin.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p style={{ ...LABEL, marginBottom: '4px' }}>Margin (%)</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 300, color: marginPct >= 0 ? '#6b7c5c' : '#a05050' }}>
              {sellPriceNum > 0 ? `${marginPct.toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} style={GHOST_BUTTON}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...PRIMARY_BUTTON, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductModal
