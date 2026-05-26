import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  useBusinessProducts, useBusinessCostComponents, useSalesData, useExpenses,
  useCreateSale, useCreateExpense, useCreateProduct, useUpdateProduct,
  useCreateCostComponent, useDeleteCostComponentsForProduct,
} from '../lib/queries'
import type { Product, CostComponent } from '../lib/supabase'

const FULFILLMENT_FEE_PCT = 0.05
const EXPENSE_CATEGORIES = ['petrol', 'packaging_run', 'labels', 'equipment', 'other']

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const FIELD_STYLE: React.CSSProperties = {
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

const SECTION_LABEL: React.CSSProperties = {
  ...LABEL,
  fontSize: '0.68rem',
  letterSpacing: '0.18em',
  marginBottom: '20px',
}

const TOOLTIP_STYLE = {
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

const PRIMARY_BUTTON: React.CSSProperties = {
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

const GHOST_BUTTON: React.CSSProperties = {
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

// Sum fixed cost_components → COGS per unit
function productUnitCogs(components: CostComponent[]): number {
  return components
    .filter(c => (c.cost_type || '').toLowerCase() === 'fixed')
    .reduce((sum, c) => sum + (c.amount ?? 0), 0)
}

// Per-sale COGS (units × per-unit fixed costs)
function saleCogs(units: number, components: CostComponent[]): number {
  return productUnitCogs(components) * units
}

// ─────────────────────────────────────────────────────────────────────────────

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
  name: '',
  sku: '',
  sellPrice: '',
  unit: 'each',
  business: 'samsara',
  rawMaterial: '',
  packaging: '',
  branding: '',
  otherCost: '',
  otherLabel: '',
}

function ProductModal({
  product,
  components,
  onClose,
  onSaved,
}: {
  product: Product | null
  components: CostComponent[]
  onClose: () => void
  onSaved: () => void
}) {
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
        {
          name: form.otherLabel.trim() || 'Other',
          amount: Number(form.otherCost) || 0,
        },
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
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,42,37,0.38)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
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
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 24px 64px rgba(44,42,37,0.14)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <button
          type="button"
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
          margin: '0 0 4px',
        }}>
          {product ? 'Edit product' : 'New product'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Product name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={FIELD_STYLE}
              required
              autoFocus
            />
          </div>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              style={FIELD_STYLE}
              placeholder="Optional"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Default sell price (R)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.sellPrice}
              onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))}
              style={FIELD_STYLE}
              required
            />
          </div>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Unit</label>
            <input
              type="text"
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              style={FIELD_STYLE}
            />
          </div>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Business</label>
            <select
              value={form.business}
              onChange={e => setForm(f => ({ ...f, business: e.target.value }))}
              style={{ ...FIELD_STYLE, cursor: 'pointer' }}
            >
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
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.rawMaterial}
                onChange={e => setForm(f => ({ ...f, rawMaterial: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Packaging (container/tin)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.packaging}
                onChange={e => setForm(f => ({ ...f, packaging: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Branding (sticker/label)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.branding}
                onChange={e => setForm(f => ({ ...f, branding: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Other cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.otherCost}
                onChange={e => setForm(f => ({ ...f, otherCost: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Description</label>
              <input
                type="text"
                placeholder="What is this cost?"
                value={form.otherLabel}
                onChange={e => setForm(f => ({ ...f, otherLabel: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '12px',
          padding: '16px 20px',
          background: 'rgba(107,124,92,0.06)',
          borderRadius: 'var(--radius-sm)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
        }}>
          <div>
            <p style={{ ...LABEL, marginBottom: '4px' }}>Total COGS</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 300, color: 'var(--ink)' }}>
              R {cogs.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p style={{ ...LABEL, marginBottom: '4px' }}>Margin (R)</p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              fontWeight: 300,
              color: margin >= 0 ? '#6b7c5c' : '#a05050',
            }}>
              R {margin.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p style={{ ...LABEL, marginBottom: '4px' }}>Margin (%)</p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              fontWeight: 300,
              color: marginPct >= 0 ? '#6b7c5c' : '#a05050',
            }}>
              {sellPriceNum > 0 ? `${marginPct.toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} style={GHOST_BUTTON}>Cancel</button>
          <button
            type="submit"
            disabled={saving}
            style={{
              ...PRIMARY_BUTTON,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Business() {
  const { data: products = [] } = useBusinessProducts()
  const { data: costComponents = [] } = useBusinessCostComponents()
  const { data: sales = [], isLoading: loadingSales } = useSalesData(30)
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(30)
  const createSale = useCreateSale()
  const createExpense = useCreateExpense()
  const updateProduct = useUpdateProduct()

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)

  const componentsByProduct = useMemo(() => {
    const map: Record<string, CostComponent[]> = {}
    for (const c of costComponents) {
      if (!map[c.product_id]) map[c.product_id] = []
      map[c.product_id].push(c)
    }
    return map
  }, [costComponents])

  function openCreate() {
    setEditingProduct(null)
    setShowModal(true)
  }
  function openEdit(p: Product) {
    setEditingProduct(p)
    setShowModal(true)
  }
  async function handleDelete(p: Product) {
    if (!confirm(`Deactivate "${p.name}"? It will be hidden from the catalogue.`)) return
    await updateProduct.mutateAsync({ id: p.id, active: false })
  }

  // ── Sale form ──────────────────────────────────────────────────────────────

  const [saleForm, setSaleForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    product_id: '',
    units: '',
    sell_price_actual: '',
    fulfillment: false,
    delivery_cost: '',
    notes: '',
  })
  const [submittingSale, setSubmittingSale] = useState(false)
  const [saleDone, setSaleDone] = useState(false)

  function onPickProduct(id: string) {
    const product = products.find(p => p.id === id)
    setSaleForm(f => ({
      ...f,
      product_id: id,
      sell_price_actual: product ? String(product.sell_price) : f.sell_price_actual,
    }))
  }

  const saleUnitsNum = Number(saleForm.units) || 0
  const salePriceNum = Number(saleForm.sell_price_actual) || 0
  const saleDeliveryNum = Number(saleForm.delivery_cost) || 0
  const saleRevenue = saleUnitsNum * salePriceNum
  const saleComponents = saleForm.product_id ? componentsByProduct[saleForm.product_id] ?? [] : []
  const saleCogsTotal = saleCogs(saleUnitsNum, saleComponents)
  const saleFulfillFee = saleForm.fulfillment ? saleRevenue * FULFILLMENT_FEE_PCT : 0
  const saleProfit = saleRevenue - saleCogsTotal - saleFulfillFee - saleDeliveryNum

  async function handleSubmitSale(e: React.FormEvent) {
    e.preventDefault()
    if (!saleForm.product_id || !saleForm.units) return
    setSubmittingSale(true)
    try {
      await createSale.mutateAsync({
        date: saleForm.date,
        product_id: saleForm.product_id,
        units: Number(saleForm.units),
        sell_price_actual: Number(saleForm.sell_price_actual) || 0,
        channel: saleForm.fulfillment ? 'fulfillment' : 'direct',
        delivery_cost: saleForm.delivery_cost ? Number(saleForm.delivery_cost) : null,
        customer_region: null,
        notes: saleForm.notes || null,
      })
      setSaleForm(f => ({
        ...f,
        units: '',
        sell_price_actual: '',
        delivery_cost: '',
        notes: '',
        fulfillment: false,
        product_id: '',
      }))
      setSaleDone(true)
      setTimeout(() => setSaleDone(false), 2500)
    } finally {
      setSubmittingSale(false)
    }
  }

  // ── Expense form ───────────────────────────────────────────────────────────

  const [expenseForm, setExpenseForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: '',
    category: 'petrol',
    notes: '',
  })
  const [submittingExpense, setSubmittingExpense] = useState(false)
  const [expenseDone, setExpenseDone] = useState(false)

  async function handleSubmitExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!expenseForm.description || !expenseForm.amount) return
    setSubmittingExpense(true)
    try {
      await createExpense.mutateAsync({
        date: expenseForm.date,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        product_id: null,
        cost_component_id: null,
        allocation: null,
        units_covered: null,
        notes: expenseForm.notes || null,
      })
      setExpenseForm(f => ({
        ...f,
        description: '',
        amount: '',
        notes: '',
      }))
      setExpenseDone(true)
      setTimeout(() => setExpenseDone(false), 2500)
    } finally {
      setSubmittingExpense(false)
    }
  }

  // ── Derived metrics ────────────────────────────────────────────────────────

  const enrichedSales = useMemo(() => {
    return sales.map(sale => {
      const components = componentsByProduct[sale.product_id] ?? []
      const units = sale.units
      const sellPriceActual = sale.sell_price_actual
      const deliveryCost = sale.delivery_cost ?? 0
      const revenue = units * sellPriceActual
      const cogs = saleCogs(units, components)
      const fulfillmentFee = sale.channel === 'fulfillment' ? revenue * FULFILLMENT_FEE_PCT : 0
      const profit = revenue - cogs - fulfillmentFee - deliveryCost
      const product = products.find(p => p.id === sale.product_id)
      return { sale, product, revenue, cogs, fulfillmentFee, deliveryCost, profit }
    })
  }, [sales, componentsByProduct, products])

  const totalTurnover = enrichedSales.reduce((s, x) => s + x.revenue, 0)
  const totalCogs = enrichedSales.reduce((s, x) => s + x.cogs, 0)
  const totalFulfillment = enrichedSales.reduce((s, x) => s + x.fulfillmentFee, 0)
  const totalDelivery = enrichedSales.reduce((s, x) => s + x.deliveryCost, 0)
  const grossProfit = totalTurnover - totalCogs - totalFulfillment - totalDelivery
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = grossProfit - totalExpenses

  const salesByDate: Record<string, number> = {}
  enrichedSales.forEach(x => {
    salesByDate[x.sale.date] = (salesByDate[x.sale.date] ?? 0) + x.revenue
  })
  const salesChartData = Object.entries(salesByDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, revenue]) => ({
      date: format(parseISO(date), 'MMM d'),
      revenue: Math.round(revenue),
    }))

  const selectedProduct = products.find(p => p.id === saleForm.product_id)
  const loading = loadingSales || loadingExpenses

  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <svg width="56" height="56" fill="none" viewBox="0 0 56 56" style={{ marginBottom: '16px' }}>
          <circle cx="28" cy="28" r="27" stroke="rgba(107,92,138,0.1)"  strokeWidth="1" />
          <circle cx="28" cy="28" r="20" stroke="rgba(107,92,138,0.18)" strokeWidth="1" />
          <circle cx="28" cy="28" r="12" stroke="rgba(107,92,138,0.28)" strokeWidth="1" />
          <circle cx="28" cy="28" r="4"  fill="rgba(107,92,138,0.45)" />
        </svg>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.6rem',
          color: 'var(--ink)',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}>
          Business
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Catalogue · Sales · Costs
        </p>
      </div>

      {/* Invoices shortcut */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <Link
          to="/invoices"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '11px 28px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.68rem',
            fontWeight: 400,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            textDecoration: 'none',
            transition: 'all 200ms',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 14 14" style={{ opacity: 0.6 }}>
            <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="1" />
            <line x1="3.5" y1="7"   x2="10.5" y2="7"   stroke="currentColor" strokeWidth="1" />
            <line x1="3.5" y1="9.5" x2="7.5"  y2="9.5" stroke="currentColor" strokeWidth="1" />
          </svg>
          Invoices
        </Link>
      </div>

      {/* ──────────────── SECTION 1: PRODUCTS ──────────────── */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <p style={SECTION_LABEL}>Products</p>
          <button type="button" style={PRIMARY_BUTTON} onClick={openCreate}>
            + Add product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.9rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        fontWeight: 400,
                        color: 'var(--ink)',
                        lineHeight: 1.2,
                        marginBottom: '4px',
                      }}>
                        {product.name}
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.62rem',
                        fontWeight: 400,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-muted)',
                      }}>
                        {product.business ?? 'samsara'}{product.sku ? ` · ${product.sku}` : ''}
                      </p>
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.4rem',
                      fontWeight: 300,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                    }}>
                      R {product.sell_price.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                    </p>
                  </div>

                  {comps.length > 0 ? (
                    <div style={{
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border)',
                      marginBottom: '14px',
                    }}>
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
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.72rem',
                      fontWeight: 300,
                      color: 'var(--ink-muted)',
                      fontStyle: 'italic',
                      padding: '12px 0',
                      borderTop: '1px solid var(--border)',
                      marginBottom: '14px',
                    }}>
                      No costs logged yet.
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                    marginBottom: '16px',
                  }}>
                    <span style={LABEL}>Margin</span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.05rem',
                      fontWeight: 400,
                      color: margin >= 0 ? '#6b7c5c' : '#a05050',
                    }}>
                      R {margin.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                      <span style={{ fontSize: '0.78rem', marginLeft: '8px', color: 'var(--ink-muted)' }}>
                        ({marginPct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" style={{ ...GHOST_BUTTON, flex: 1 }} onClick={() => openEdit(product)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{ ...GHOST_BUTTON, color: 'var(--clay)', borderColor: 'var(--border-warm)' }}
                      onClick={() => handleDelete(product)}
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

      {/* ──────────────── SECTION 2: LOG A SALE ──────────────── */}
      <section style={{ marginBottom: '48px' }}>
        <p style={SECTION_LABEL}>Log a sale</p>
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmitSale} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={saleForm.fulfillment}
                  onClick={() => setSaleForm(f => ({ ...f, fulfillment: !f.fulfillment }))}
                  style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '999px',
                    border: 'none',
                    background: saleForm.fulfillment ? 'var(--olive)' : 'rgba(44,42,37,0.18)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 200ms ease',
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '3px',
                    left: saleForm.fulfillment ? '19px' : '3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fffcf5',
                    transition: 'left 200ms ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
                </button>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
                    Via fulfillment channel (5% fee)
                  </p>
                  {saleForm.fulfillment && saleRevenue > 0 && (
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.68rem',
                      fontWeight: 300,
                      color: 'var(--olive)',
                      margin: '2px 0 0',
                    }}>
                      Fee: R {saleFulfillFee.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Delivery cost (R)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={saleForm.delivery_cost}
                  onChange={e => setSaleForm(f => ({ ...f, delivery_cost: e.target.value }))}
                  style={FIELD_STYLE}
                />
              </div>

              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Notes</label>
                <input
                  type="text"
                  placeholder="Optional"
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

            {/* Live profit preview */}
            <div style={{
              background: 'rgba(107,124,92,0.05)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              border: '1px solid var(--border)',
            }}>
              <p style={{ ...LABEL, marginBottom: '4px' }}>Profit preview</p>

              <PreviewRow label="Revenue" value={saleRevenue} />
              <PreviewRow label="COGS" value={-saleCogsTotal} muted />
              <PreviewRow label="Fulfillment fee" value={-saleFulfillFee} muted hideIfZero />
              <PreviewRow label="Delivery" value={-saleDeliveryNum} muted hideIfZero />

              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '14px',
                marginTop: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--ink)',
                }}>
                  Profit
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.6rem',
                  fontWeight: 500,
                  color: saleProfit >= 0 ? '#6b7c5c' : '#a05050',
                }}>
                  R {saleProfit.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                </span>
              </div>

              {!saleForm.product_id && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.72rem',
                  fontWeight: 300,
                  color: 'var(--ink-muted)',
                  fontStyle: 'italic',
                  marginTop: '4px',
                }}>
                  Pick a product to see live calculations.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ──────────────── SECTION 3: SUMMARY ──────────────── */}
      <section style={{ marginBottom: '48px' }}>
        <p style={SECTION_LABEL}>Last 30 days</p>

        <div className="stagger" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '20px',
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <p style={{ ...LABEL, marginBottom: '12px' }}>Turnover</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}>
              R {totalTurnover.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <p style={{ ...LABEL, marginBottom: '12px' }}>Gross Profit</p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.2rem',
              fontWeight: 300,
              color: grossProfit >= 0 ? '#6b7c5c' : '#a05050',
              lineHeight: 1,
            }}>
              R {grossProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <p style={{ ...LABEL, marginBottom: '12px' }}>Unforeseen Costs</p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.2rem',
              fontWeight: 300,
              color: 'var(--clay)',
              lineHeight: 1,
            }}>
              R {totalExpenses.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Net profit */}
        <div className="card" style={{
          textAlign: 'center',
          padding: '32px 20px',
          marginBottom: '24px',
          background: netProfit >= 0 ? 'rgba(107,124,92,0.06)' : 'rgba(184,124,90,0.06)',
        }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Net Profit</p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3rem',
            fontWeight: 300,
            color: netProfit >= 0 ? '#6b7c5c' : '#a05050',
            lineHeight: 1,
          }}>
            R {netProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Revenue chart */}
        {salesChartData.length > 0 && (
          <div className="card" style={{ marginBottom: '24px', padding: '28px 32px' }}>
            <p style={{ ...LABEL, marginBottom: '20px' }}>Revenue — last 30 days</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={salesChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6b5c8a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6b5c8a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,42,37,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#7a7568', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7a7568', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R${v}`} />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [`R ${v.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6b5c8a"
                  strokeWidth={1.5}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#6b5c8a', stroke: 'none' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent sales */}
        {enrichedSales.length > 0 && (
          <div className="card" style={{ padding: '28px 32px' }}>
            <p style={{ ...LABEL, marginBottom: '20px' }}>Recent sales</p>
            <div>
              {enrichedSales.slice(0, 8).map(({ sale, product, revenue, profit }, i, arr) => (
                <div
                  key={sale.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.72rem',
                    fontWeight: 300,
                    color: 'var(--ink-muted)',
                    width: '56px',
                    flexShrink: 0,
                  }}>
                    {format(parseISO(sale.date), 'MMM d')}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    fontWeight: 300,
                    color: 'var(--ink)',
                    flex: 1,
                  }}>
                    {product?.name ?? '—'}
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginLeft: '8px' }}>
                      ×{sale.units}
                    </span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 300, color: '#6b5c8a', minWidth: '80px', textAlign: 'right' }}>
                    R {revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                    fontWeight: 300,
                    color: profit >= 0 ? '#6b7c5c' : '#a05050',
                    minWidth: '80px',
                    textAlign: 'right',
                  }}>
                    R {profit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && sales.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '36px 32px' }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.9rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
            }}>
              No sales logged in the last 30 days.
            </p>
          </div>
        )}
      </section>

      {/* ──────────────── SECTION 4: UNFORESEEN EXPENSES ──────────────── */}
      <section>
        <p style={SECTION_LABEL}>Unforeseen expenses</p>
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmitExpense} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))}
                  style={FIELD_STYLE}
                  required
                />
              </div>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Amount (R)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                  style={FIELD_STYLE}
                  required
                />
              </div>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Category</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...FIELD_STYLE, cursor: 'pointer' }}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Description</label>
              <input
                type="text"
                placeholder="e.g. Petrol to deliver order"
                value={expenseForm.description}
                onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                style={FIELD_STYLE}
                required
              />
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Notes</label>
              <input
                type="text"
                placeholder="Optional"
                value={expenseForm.notes}
                onChange={e => setExpenseForm(f => ({ ...f, notes: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>
            <button
              type="submit"
              disabled={submittingExpense}
              style={{
                ...PRIMARY_BUTTON,
                background: expenseDone ? 'var(--olive-muted)' : 'var(--olive)',
                color: expenseDone ? 'var(--olive)' : 'rgba(255,252,245,0.95)',
                cursor: submittingExpense ? 'not-allowed' : 'pointer',
                opacity: submittingExpense ? 0.6 : 1,
                alignSelf: 'flex-start',
                marginTop: '4px',
              }}
            >
              {submittingExpense ? 'Logging…' : expenseDone ? 'Logged ✓' : 'Log Expense'}
            </button>
          </form>

          {expenses.length > 0 && (
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <p style={{ ...LABEL, marginBottom: '14px' }}>Recent expenses</p>
              <div>
                {expenses.slice(0, 8).map((e, i, arr) => (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '10px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 300, color: 'var(--ink-muted)', width: '56px', flexShrink: 0 }}>
                      {format(parseISO(e.date), 'MMM d')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 300, color: 'var(--ink)', flex: 1 }}>
                      {e.description}
                    </span>
                    {e.category && (
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.62rem',
                        fontWeight: 400,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-muted)',
                        background: 'var(--border)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}>
                        {e.category}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 300, color: 'var(--clay)', minWidth: '70px', textAlign: 'right' }}>
                      R {e.amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {showModal && (
        <ProductModal
          product={editingProduct}
          components={costComponents}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function PreviewRow({
  label,
  value,
  muted,
  hideIfZero,
}: {
  label: string
  value: number
  muted?: boolean
  hideIfZero?: boolean
}) {
  if (hideIfZero && value === 0) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.78rem',
        fontWeight: 300,
        color: muted ? 'var(--ink-muted)' : 'var(--ink)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.88rem',
        fontWeight: 400,
        color: muted ? 'var(--ink-muted)' : 'var(--ink)',
      }}>
        R {value.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}
