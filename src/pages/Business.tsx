import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  useProducts, useSalesData, useExpenses, useCreateSale,
} from '../lib/queries'

const CHANNELS = ['direct', 'market', 'wholesale', 'online', 'other']

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

export default function Business() {
  const { data: products = [] } = useProducts()
  const { data: sales = [], isLoading: loadingSales } = useSalesData(30)
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(30)
  const createSale = useCreateSale()

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    product_id: '',
    units: '',
    sell_price_actual: '',
    channel: 'direct',
    delivery_cost: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_id || !form.units) return
    setSubmitting(true)
    try {
      const product = products.find(p => p.id === form.product_id)
      await createSale.mutateAsync({
        date: form.date,
        product_id: form.product_id,
        units: Number(form.units),
        sell_price_actual: form.sell_price_actual ? Number(form.sell_price_actual) : (product?.sell_price ?? 0),
        channel: form.channel || null,
        delivery_cost: form.delivery_cost ? Number(form.delivery_cost) : null,
        customer_region: null,
        notes: form.notes || null,
      })
      setForm(f => ({ ...f, units: '', sell_price_actual: '', delivery_cost: '', notes: '' }))
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2500)
    } finally {
      setSubmitting(false)
    }
  }

  // Derived metrics
  const totalRevenue = sales.reduce((s, sale) => s + (sale.units * sale.sell_price_actual), 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0

  const revenueByProduct: Record<string, number> = {}
  sales.forEach(s => {
    revenueByProduct[s.product_id] = (revenueByProduct[s.product_id] ?? 0) + s.units * s.sell_price_actual
  })
  const bestProductId = Object.entries(revenueByProduct).sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestProductName = products.find(p => p.id === bestProductId)?.name ?? '—'

  const salesByDate: Record<string, number> = {}
  sales.forEach(s => {
    salesByDate[s.date] = (salesByDate[s.date] ?? 0) + s.units * s.sell_price_actual
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

  const productPerformance = products.map(product => {
    const productSales = sales.filter(s => s.product_id === product.id)
    const revenue = productSales.reduce((s, sale) => s + sale.units * sale.sell_price_actual, 0)
    const units = productSales.reduce((s, sale) => s + sale.units, 0)
    const productExpenses = expenses.filter(e => e.product_id === product.id)
    const cost = productExpenses.reduce((s, e) => s + e.amount, 0)
    const margin = revenue > 0 ? ((revenue - cost) / revenue * 100) : 0
    return { product, revenue, units, cost, margin }
  }).filter(p => p.units > 0)

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
          Olive Brain
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Last 30 days · Vrischgewagt
        </p>
      </div>

      {/* KPI cards */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Revenue</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}>
            R {totalRevenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Gross Margin</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}>
            {grossMargin.toFixed(1)}%
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Best Product</p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            fontWeight: 300,
            color: '#6b5c8a',
            lineHeight: 1.2,
            marginTop: '4px',
          }}>
            {bestProductName}
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
        {expenseCategoryData.length > 0 && (
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
        )}

        {/* Log a sale */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '24px' }}>Log a sale</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={FIELD_STYLE}
                  required
                />
              </div>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Units</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="0"
                  value={form.units}
                  onChange={e => setForm(f => ({ ...f, units: e.target.value }))}
                  style={FIELD_STYLE}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Product</label>
              <select
                value={form.product_id}
                onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                style={{ ...FIELD_STYLE, cursor: 'pointer' }}
                required
              >
                <option value="">Select product…</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (R{p.sell_price})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Price override</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Use default"
                  value={form.sell_price_actual}
                  onChange={e => setForm(f => ({ ...f, sell_price_actual: e.target.value }))}
                  style={FIELD_STYLE}
                />
              </div>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Delivery cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.delivery_cost}
                  onChange={e => setForm(f => ({ ...f, delivery_cost: e.target.value }))}
                  style={FIELD_STYLE}
                />
              </div>
            </div>

            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Channel</label>
              <select
                value={form.channel}
                onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                style={{ ...FIELD_STYLE, cursor: 'pointer' }}
              >
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Notes</label>
              <input
                type="text"
                placeholder="Optional"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                style={FIELD_STYLE}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitted ? 'var(--olive-muted)' : 'var(--olive)',
                color: submitted ? 'var(--olive)' : 'rgba(255,252,245,0.9)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '12px 24px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.68rem',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 200ms',
                marginTop: '8px',
              }}
            >
              {submitting ? 'Logging…' : submitted ? 'Logged ✓' : 'Log Sale'}
            </button>
          </form>
        </div>
      </div>

      {/* Product performance table */}
      {productPerformance.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Product performance</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Units', 'Revenue', 'Expenses', 'Margin'].map(h => (
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
                {productPerformance
                  .sort((a, b) => b.revenue - a.revenue)
                  .map(({ product, revenue, units, cost, margin }) => (
                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 300, color: 'var(--ink)' }}>
                        {product.name}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                        {units}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 300, color: 'var(--ink)' }}>
                        R {revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ padding: '12px 16px 12px 0', fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                        R {cost.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
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

      {/* Recent sales */}
      {sales.length > 0 && (
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Recent sales</p>
          <div>
            {[...sales].reverse().slice(0, 8).map((sale, i, arr) => {
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
