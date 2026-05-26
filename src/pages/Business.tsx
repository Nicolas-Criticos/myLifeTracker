import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  useProducts, useSalesData, useExpenses, useCreateSale,
  useBusinessCostComponents, useCreateExpense,
} from '../lib/queries'
import type { CostComponent } from '../lib/supabase'

const FULFILLMENT_FEE_PCT = 0.05

const EXPENSE_CATEGORIES = ['packaging', 'labels', 'petrol', 'other']

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

// COGS for a single sale, given its cost components
function computeSaleCogs(opts: {
  units: number
  sellPriceActual: number
  deliveryCost: number
  components: CostComponent[]
}) {
  const { units, sellPriceActual, deliveryCost, components } = opts
  let cogs = 0
  for (const c of components) {
    const type = (c.cost_type || '').toLowerCase()
    if (type === 'fixed') {
      cogs += (c.amount ?? 0) * units
    } else if (type === 'variable_pct') {
      // amount expressed as a percentage value (e.g. 5 => 5%)
      const pct = (c.amount ?? 0) / 100
      cogs += pct * sellPriceActual * units
    } else if (type === 'variable_range') {
      // delivery-like: use the delivery_cost on the sale record (not multiplied by units)
      cogs += deliveryCost
    }
  }
  return cogs
}

export default function Business() {
  const { data: products = [] } = useProducts()
  const { data: sales = [], isLoading: loadingSales } = useSalesData(30)
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(30)
  const { data: costComponents = [] } = useBusinessCostComponents()
  const createSale = useCreateSale()
  const createExpense = useCreateExpense()

  // ── Sale form ───────────────────────────────────────────────────────────────

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

  async function handleSubmitSale(e: React.FormEvent) {
    e.preventDefault()
    if (!saleForm.product_id || !saleForm.units) return
    setSubmittingSale(true)
    try {
      const product = products.find(p => p.id === saleForm.product_id)
      await createSale.mutateAsync({
        date: saleForm.date,
        product_id: saleForm.product_id,
        units: Number(saleForm.units),
        sell_price_actual: saleForm.sell_price_actual
          ? Number(saleForm.sell_price_actual)
          : (product?.sell_price ?? 0),
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
      }))
      setSaleDone(true)
      setTimeout(() => setSaleDone(false), 2500)
    } finally {
      setSubmittingSale(false)
    }
  }

  // ── Expense form ────────────────────────────────────────────────────────────

  const [expenseForm, setExpenseForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: '',
    category: 'packaging',
    product_id: '',
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
        product_id: expenseForm.product_id || null,
        cost_component_id: null,
        allocation: null,
        units_covered: null,
        notes: expenseForm.notes || null,
      })
      setExpenseForm(f => ({
        ...f,
        description: '',
        amount: '',
        product_id: '',
        notes: '',
      }))
      setExpenseDone(true)
      setTimeout(() => setExpenseDone(false), 2500)
    } finally {
      setSubmittingExpense(false)
    }
  }

  // ── Derived metrics ─────────────────────────────────────────────────────────

  const componentsByProduct = useMemo(() => {
    const map: Record<string, CostComponent[]> = {}
    for (const c of costComponents) {
      if (!map[c.product_id]) map[c.product_id] = []
      map[c.product_id].push(c)
    }
    return map
  }, [costComponents])

  const enrichedSales = useMemo(() => {
    return sales.map(sale => {
      const components = componentsByProduct[sale.product_id] ?? []
      const units = sale.units
      const sellPriceActual = sale.sell_price_actual
      const deliveryCost = sale.delivery_cost ?? 0
      const revenue = units * sellPriceActual
      const cogs = computeSaleCogs({ units, sellPriceActual, deliveryCost, components })
      const fulfillmentFee = sale.channel === 'fulfillment' ? revenue * FULFILLMENT_FEE_PCT : 0
      const profit = revenue - cogs - fulfillmentFee
      const product = products.find(p => p.id === sale.product_id)
      return { sale, product, revenue, cogs, fulfillmentFee, deliveryCost, profit }
    })
  }, [sales, componentsByProduct, products])

  const totalTurnover = enrichedSales.reduce((s, x) => s + x.revenue, 0)
  const totalCogs = enrichedSales.reduce((s, x) => s + x.cogs, 0)
  const totalFulfillment = enrichedSales.reduce((s, x) => s + x.fulfillmentFee, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalCosts = totalCogs + totalFulfillment + totalExpenses
  const totalProfit = totalTurnover - totalCosts

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

  const expensesByCategory: Record<string, number> = {}
  expenses.forEach(e => {
    const cat = e.category ?? 'other'
    expensesByCategory[cat] = (expensesByCategory[cat] ?? 0) + e.amount
  })
  const expenseCategoryData = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({ cat, amount: Math.round(amount) }))

  // Per-product profit breakdown
  const productProfit = useMemo(() => {
    const acc: Record<string, { units: number; revenue: number; cogs: number; fulfillment: number; profit: number }> = {}
    for (const x of enrichedSales) {
      const pid = x.sale.product_id
      if (!acc[pid]) acc[pid] = { units: 0, revenue: 0, cogs: 0, fulfillment: 0, profit: 0 }
      acc[pid].units += x.sale.units
      acc[pid].revenue += x.revenue
      acc[pid].cogs += x.cogs
      acc[pid].fulfillment += x.fulfillmentFee
      acc[pid].profit += x.profit
    }
    return Object.entries(acc).map(([pid, v]) => ({
      product: products.find(p => p.id === pid),
      ...v,
      margin: v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0,
    })).filter(x => x.product)
  }, [enrichedSales, products])

  const selectedProduct = products.find(p => p.id === saleForm.product_id)
  const loading = loadingSales || loadingExpenses

  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
          Last 30 days · Vrischgewagt
        </p>
      </div>

      {/* Invoices shortcut */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
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
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--olive)'
            ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--olive)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink-muted)'
            ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'
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

      {/* KPI cards: Turnover / Costs / Profit */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Total Turnover</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}>
            R {totalTurnover.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Total Costs</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}>
            R {totalCosts.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Total Profit</p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 300,
            color: totalProfit >= 0 ? '#6b7c5c' : '#a05050',
            lineHeight: 1,
          }}>
            R {totalProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Sales chart */}
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

      {loading && (
        <div style={{ textAlign: 'center', padding: '32px', fontFamily: 'var(--font-body)', fontWeight: 300, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
          Loading…
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

        {/* Expense breakdown */}
        {expenseCategoryData.length > 0 ? (
          <div className="card" style={{ padding: '28px 32px' }}>
            <p style={{ ...LABEL, marginBottom: '20px' }}>Expenses by category</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={expenseCategoryData}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,42,37,0.05)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#7a7568', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `R${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="cat"
                  tick={{ fill: '#7a7568', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [`R ${v.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#8a6a3a" radius={[0, 4, 4, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 300, color: 'var(--ink-muted)' }}>Total expenses</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 300, color: 'var(--ink)' }}>
                R {totalExpenses.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
              No expenses yet. Log one below.
            </p>
          </div>
        )}

        {/* Log a sale */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '24px' }}>Log a sale</p>
          <form onSubmit={handleSubmitSale} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                Price {selectedProduct ? `(default R${selectedProduct.sell_price})` : ''}
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
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  fontWeight: 400,
                  color: 'var(--ink)',
                  margin: 0,
                }}>
                  Via fulfillment channel
                </p>
                {saleForm.fulfillment && (
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.68rem',
                    fontWeight: 300,
                    color: 'var(--olive)',
                    margin: '2px 0 0',
                  }}>
                    5% fee applies
                  </p>
                )}
              </div>
            </div>

            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Delivery cost (optional)</label>
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
                background: saleDone ? 'var(--olive-muted)' : 'var(--olive)',
                color: saleDone ? 'var(--olive)' : 'rgba(255,252,245,0.9)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '12px 24px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.68rem',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: submittingSale ? 'not-allowed' : 'pointer',
                opacity: submittingSale ? 0.6 : 1,
                transition: 'all 200ms',
                marginTop: '8px',
              }}
            >
              {submittingSale ? 'Logging…' : saleDone ? 'Logged ✓' : 'Log Sale'}
            </button>
          </form>
        </div>
      </div>

      {/* Profit breakdown per sale */}
      {enrichedSales.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Profit per sale</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Product', 'Revenue', 'COGS', 'Fee', 'Delivery', 'Profit'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6rem',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      paddingBottom: '12px',
                      paddingRight: '14px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...enrichedSales].reverse().map(({ sale, product, revenue, cogs, fulfillmentFee, deliveryCost, profit }) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                      {format(parseISO(sale.date), 'MMM d')}
                    </td>
                    <td style={{ padding: '12px 14px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)' }}>
                      {product?.name ?? '—'}
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginLeft: '6px' }}>
                        ×{sale.units}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)' }}>
                      R {revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '12px 14px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                      R {cogs.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: '12px 14px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                      {fulfillmentFee > 0 ? `R ${fulfillmentFee.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                      {deliveryCost > 0 ? `R ${deliveryCost.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td style={{
                      padding: '12px 14px 12px 0',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.95rem',
                      fontWeight: 300,
                      color: profit >= 0 ? '#6b7c5c' : '#a05050',
                    }}>
                      R {profit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profit per product */}
      {productProfit.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Profit per product</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Units', 'Revenue', 'COGS + Fees', 'Profit', 'Margin'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6rem',
                      fontWeight: 400,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      paddingBottom: '12px',
                      paddingRight: '16px',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productProfit
                  .sort((a, b) => b.profit - a.profit)
                  .map(({ product, units, revenue, cogs, fulfillment, profit, margin }) => (
                    <tr key={product!.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 300, color: 'var(--ink)' }}>
                        {product!.name}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                        {units}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 300, color: 'var(--ink)' }}>
                        R {revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                        R {(cogs + fulfillment).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{
                        padding: '12px 16px 12px 0',
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.95rem',
                        fontWeight: 300,
                        color: profit >= 0 ? '#6b7c5c' : '#a05050',
                      }}>
                        R {profit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0' }}>
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.72rem',
                          fontWeight: 400,
                          letterSpacing: '0.05em',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: margin >= 50
                            ? 'rgba(107,124,92,0.1)'
                            : margin >= 20
                            ? 'rgba(107,92,138,0.1)'
                            : 'rgba(184,124,90,0.1)',
                          color: margin >= 50
                            ? 'var(--foundation)'
                            : margin >= 20
                            ? '#6b5c8a'
                            : 'var(--clay)',
                        }}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Costs input section */}
      <div className="card" style={{ marginBottom: '24px', padding: '28px 32px' }}>
        <p style={{ ...LABEL, marginBottom: '24px' }}>Log an expense</p>
        <form onSubmit={handleSubmitExpense} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
          </div>
          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Description</label>
            <input
              type="text"
              placeholder="e.g. Box labels batch 1"
              value={expenseForm.description}
              onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
              style={FIELD_STYLE}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Category</label>
              <select
                value={expenseForm.category}
                onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...FIELD_STYLE, cursor: 'pointer' }}
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Linked product (optional)</label>
              <select
                value={expenseForm.product_id}
                onChange={e => setExpenseForm(f => ({ ...f, product_id: e.target.value }))}
                style={{ ...FIELD_STYLE, cursor: 'pointer' }}
              >
                <option value="">—</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
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
              background: expenseDone ? 'var(--olive-muted)' : 'var(--olive)',
              color: expenseDone ? 'var(--olive)' : 'rgba(255,252,245,0.9)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '12px 24px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: submittingExpense ? 'not-allowed' : 'pointer',
              opacity: submittingExpense ? 0.6 : 1,
              transition: 'all 200ms',
              marginTop: '8px',
              alignSelf: 'flex-start',
            }}
          >
            {submittingExpense ? 'Logging…' : expenseDone ? 'Logged ✓' : 'Log Expense'}
          </button>
        </form>

        {/* Recent expenses */}
        {expenses.length > 0 && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <p style={{ ...LABEL, marginBottom: '14px' }}>Recent expenses</p>
            <div>
              {[...expenses].slice(0, 8).map((e, i, arr) => {
                const linkedProduct = e.product_id ? products.find(p => p.id === e.product_id) : null
                return (
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
                      {linkedProduct && (
                        <span style={{ color: 'var(--ink-muted)', marginLeft: '8px', fontSize: '0.72rem' }}>
                          → {linkedProduct.name}
                        </span>
                      )}
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
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 300, color: '#8a6a3a', minWidth: '70px', textAlign: 'right' }}>
                      R {e.amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent sales */}
      {sales.length > 0 && (
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Recent sales</p>
          <div>
            {[...sales].slice(0, 8).map((sale, i, arr) => {
              const product = products.find(p => p.id === sale.product_id)
              return (
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
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 300, color: 'var(--ink-muted)', width: '56px', flexShrink: 0 }}>
                    {format(parseISO(sale.date), 'MMM d')}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 300, color: 'var(--ink)', flex: 1 }}>
                    {product?.name ?? '—'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                    {sale.units} units
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 300, color: '#6b5c8a' }}>
                    R {(sale.units * sale.sell_price_actual).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </span>
                  {sale.channel && (
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
                      flexShrink: 0,
                    }}>
                      {sale.channel}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && sales.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.95rem',
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            No sales logged in the last 30 days. Use the form above to log your first sale.
          </p>
        </div>
      )}

    </div>
  )
}
