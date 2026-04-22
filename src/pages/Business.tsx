import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import TopBar from '../components/layout/TopBar'
import {
  useProducts, useSalesData, useExpenses, useCreateSale,
} from '../lib/queries'

const CHANNELS = ['direct', 'market', 'wholesale', 'online', 'other']

const SURFACE = 'bg-[rgba(240,236,228,0.9)] border border-[rgba(139,127,109,0.15)] rounded-2xl'
const LABEL = 'text-[#8a7f6d] text-xs uppercase tracking-widest'
const VALUE = 'text-[#2b2b2b] text-2xl font-light mt-1.5'

export default function Business() {
  const { data: products = [] } = useProducts()
  const { data: sales = [], isLoading: loadingSales } = useSalesData(30)
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses(30)
  const createSale = useCreateSale()

  // ── Quick-log form state ──────────────────────────────────────────────────
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

  // ── Derived metrics ───────────────────────────────────────────────────────
  const totalRevenue = sales.reduce((s, sale) => s + (sale.units * sale.sell_price_actual), 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0

  // Best product by revenue
  const revenueByProduct: Record<string, number> = {}
  sales.forEach(s => {
    revenueByProduct[s.product_id] = (revenueByProduct[s.product_id] ?? 0) + s.units * s.sell_price_actual
  })
  const bestProductId = Object.entries(revenueByProduct).sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestProductName = products.find(p => p.id === bestProductId)?.name ?? '—'

  // Sales chart — group by date
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

  // Expense breakdown by category
  const expensesByCategory: Record<string, number> = {}
  expenses.forEach(e => {
    const cat = e.category ?? 'other'
    expensesByCategory[cat] = (expensesByCategory[cat] ?? 0) + e.amount
  })
  const expenseCategoryData = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({ cat, amount: Math.round(amount) }))

  // Product performance
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
    <div className="flex flex-col h-full">
      <TopBar title="Business" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-10 animate-fade-in">

          {/* Header */}
          <div className="flex flex-col items-center text-center">
            {/* Circle motif */}
            <div className="relative w-14 h-14 mb-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[rgba(107,92,138,0.12)]" />
              <div className="absolute inset-2.5 rounded-full border border-[rgba(107,92,138,0.2)]" />
              <div className="absolute inset-5 rounded-full border border-[rgba(107,92,138,0.35)]" />
              <div className="w-2 h-2 rounded-full bg-[rgba(107,92,138,0.5)]" />
            </div>
            <h2 className="text-[#2b2b2b] text-xl font-light tracking-[0.08em]">Olive Brain</h2>
            <p className="text-[#8a7f6d] text-sm mt-1 tracking-wide">Last 30 days · Vrischgewagt</p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-5">
            <div className={`${SURFACE} p-6 text-center`}>
              <p className={LABEL}>Revenue</p>
              <p className={VALUE}>R {totalRevenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className={`${SURFACE} p-6 text-center`}>
              <p className={LABEL}>Gross Margin</p>
              <p className={VALUE}>{grossMargin.toFixed(1)}%</p>
            </div>
            <div className={`${SURFACE} p-6 text-center`}>
              <p className={LABEL}>Best Product</p>
              <p className="text-[#6b5c8a] text-lg font-light mt-1.5 truncate">{bestProductName}</p>
            </div>
          </div>

          {/* Sales chart */}
          {salesChartData.length > 0 && (
            <div className={`${SURFACE} p-7`}>
              <p className={`${LABEL} mb-6`}>Revenue — last 30 days</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={salesChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b5c8a" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6b5c8a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,127,109,0.12)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8a7f6d', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8a7f6d', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `R${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#f0ece4',
                      border: '1px solid rgba(139,127,109,0.2)',
                      borderRadius: 10,
                      color: '#2b2b2b',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`R ${v.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6b5c8a"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#6b5c8a' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {loading && (
            <div className="text-center text-[#8a7f6d] text-sm py-8 tracking-wide">Loading…</div>
          )}

          <div className="grid grid-cols-2 gap-5">
            {/* Expense breakdown */}
            {expenseCategoryData.length > 0 && (
              <div className={`${SURFACE} p-7`}>
                <p className={`${LABEL} mb-6`}>Expenses by category</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={expenseCategoryData}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,127,109,0.12)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#8a7f6d', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => `R${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="cat"
                      tick={{ fill: '#8a7f6d', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#f0ece4',
                        border: '1px solid rgba(139,127,109,0.2)',
                        borderRadius: 10,
                        fontSize: 11,
                      }}
                      formatter={(v: number) => [`R ${v.toLocaleString()}`, 'Amount']}
                    />
                    <Bar dataKey="amount" fill="#8a6a3a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t border-[rgba(139,127,109,0.12)] flex justify-between items-center">
                  <span className="text-[#8a7f6d] text-xs tracking-wide">Total expenses</span>
                  <span className="text-[#2b2b2b] text-sm font-medium">
                    R {totalExpenses.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            )}

            {/* Quick log sale */}
            <div className={`${SURFACE} p-7`}>
              <p className={`${LABEL} mb-6`}>Log a sale</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8a7f6d] text-xs tracking-wide block mb-1.5">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full bg-[#f6f3ee] border border-[rgba(139,127,109,0.2)] rounded-xl px-3 py-2.5 text-sm text-[#2b2b2b] focus:outline-none focus:border-[rgba(107,92,138,0.4)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[#8a7f6d] text-xs tracking-wide block mb-1.5">Units</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="0"
                      value={form.units}
                      onChange={e => setForm(f => ({ ...f, units: e.target.value }))}
                      className="w-full bg-[#f6f3ee] border border-[rgba(139,127,109,0.2)] rounded-xl px-3 py-2.5 text-sm text-[#2b2b2b] focus:outline-none focus:border-[rgba(107,92,138,0.4)]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#8a7f6d] text-xs tracking-wide block mb-1.5">Product</label>
                  <select
                    value={form.product_id}
                    onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                    className="w-full bg-[#f6f3ee] border border-[rgba(139,127,109,0.2)] rounded-xl px-3 py-2.5 text-sm text-[#2b2b2b] focus:outline-none focus:border-[rgba(107,92,138,0.4)]"
                    required
                  >
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (R{p.sell_price})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#8a7f6d] text-xs tracking-wide block mb-1.5">Price (override)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Use default"
                      value={form.sell_price_actual}
                      onChange={e => setForm(f => ({ ...f, sell_price_actual: e.target.value }))}
                      className="w-full bg-[#f6f3ee] border border-[rgba(139,127,109,0.2)] rounded-xl px-3 py-2.5 text-sm text-[#2b2b2b] focus:outline-none focus:border-[rgba(107,92,138,0.4)]"
                    />
                  </div>
                  <div>
                    <label className="text-[#8a7f6d] text-xs tracking-wide block mb-1.5">Delivery cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={form.delivery_cost}
                      onChange={e => setForm(f => ({ ...f, delivery_cost: e.target.value }))}
                      className="w-full bg-[#f6f3ee] border border-[rgba(139,127,109,0.2)] rounded-xl px-3 py-2.5 text-sm text-[#2b2b2b] focus:outline-none focus:border-[rgba(107,92,138,0.4)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#8a7f6d] text-xs tracking-wide block mb-1.5">Channel</label>
                  <select
                    value={form.channel}
                    onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full bg-[#f6f3ee] border border-[rgba(139,127,109,0.2)] rounded-xl px-3 py-2.5 text-sm text-[#2b2b2b] focus:outline-none focus:border-[rgba(107,92,138,0.4)]"
                  >
                    {CHANNELS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#8a7f6d] text-xs tracking-wide block mb-1.5">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-[#f6f3ee] border border-[rgba(139,127,109,0.2)] rounded-xl px-3 py-2.5 text-sm text-[#2b2b2b] focus:outline-none focus:border-[rgba(107,92,138,0.4)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm tracking-wide transition-all
                    bg-[rgba(107,92,138,0.1)] text-[#6b5c8a] border border-[rgba(107,92,138,0.2)]
                    hover:bg-[rgba(107,92,138,0.15)] disabled:opacity-50"
                >
                  {submitting ? 'Logging…' : submitted ? 'Logged ✓' : 'Log Sale'}
                </button>
              </form>
            </div>
          </div>

          {/* Product performance table */}
          {productPerformance.length > 0 && (
            <div className={`${SURFACE} p-7`}>
              <p className={`${LABEL} mb-6`}>Product performance</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(139,127,109,0.12)]">
                      {['Product', 'Units', 'Revenue', 'Expenses', 'Margin'].map(h => (
                        <th key={h} className="text-left text-[#8a7f6d] text-xs tracking-widest uppercase pb-3 pr-4 font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(139,127,109,0.08)]">
                    {productPerformance
                      .sort((a, b) => b.revenue - a.revenue)
                      .map(({ product, revenue, units, cost, margin }) => (
                        <tr key={product.id}>
                          <td className="py-3 pr-4 text-[#2b2b2b]">{product.name}</td>
                          <td className="py-3 pr-4 text-[#8a7f6d]">{units}</td>
                          <td className="py-3 pr-4 text-[#2b2b2b]">
                            R {revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-3 pr-4 text-[#8a7f6d]">
                            R {cost.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-lg ${
                                margin >= 50
                                  ? 'bg-[rgba(92,122,92,0.12)] text-[#5c7a5c]'
                                  : margin >= 20
                                  ? 'bg-[rgba(107,92,138,0.1)] text-[#6b5c8a]'
                                  : 'bg-[rgba(138,106,58,0.1)] text-[#8a6a3a]'
                              }`}
                            >
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

          {/* Recent sales feed */}
          {sales.length > 0 && (
            <div className={`${SURFACE} p-7`}>
              <p className={`${LABEL} mb-6`}>Recent sales</p>
              <div className="space-y-2">
                {[...sales].reverse().slice(0, 8).map(sale => {
                  const product = products.find(p => p.id === sale.product_id)
                  return (
                    <div key={sale.id} className="flex items-center gap-4 py-3 border-b border-[rgba(139,127,109,0.08)] last:border-0">
                      <span className="text-[#8a7f6d] text-xs w-16 shrink-0 tracking-wide">
                        {format(parseISO(sale.date), 'MMM d')}
                      </span>
                      <span className="text-[#2b2b2b] text-sm flex-1">{product?.name ?? '—'}</span>
                      <span className="text-[#8a7f6d] text-xs">{sale.units} units</span>
                      <span className="text-[#6b5c8a] text-sm font-medium">
                        R {(sale.units * sale.sell_price_actual).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                      </span>
                      {sale.channel && (
                        <span className="text-[#8a7f6d] text-xs bg-[rgba(139,127,109,0.1)] px-2 py-0.5 rounded-lg">
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
            <div className="text-center py-16">
              <p className="text-[#8a7f6d] text-sm tracking-wide">No sales logged in the last 30 days.</p>
              <p className="text-[#8a7f6d] text-xs mt-1">Use the form above to log your first sale.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
