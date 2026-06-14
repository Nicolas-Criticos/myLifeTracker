import { format, parseISO } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Product, Sale, Expense } from '../../lib/supabase'
import { LABEL, SECTION_LABEL, TOOLTIP_STYLE } from './businessStyles'

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface EnrichedSale {
  sale: Sale
  product: Product | undefined
  revenue: number
  cogs: number
  fulfillmentFee: number
  deliveryCost: number
  profit: number
}

export interface SalesChartPoint {
  date: string
  revenue: number
}

interface Props {
  loading: boolean
  sales: Sale[]
  expenses?: Expense[]
  enrichedSales: EnrichedSale[]
  salesChartData: SalesChartPoint[]
  totalTurnover: number
  grossProfit: number
  totalExpenses: number
  netProfit: number
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export function SummarySection({
  loading,
  sales,
  enrichedSales,
  salesChartData,
  totalTurnover,
  grossProfit,
  totalExpenses,
  netProfit,
}: Props) {
  return (
    <section style={{ marginBottom: '48px' }}>
      <p style={SECTION_LABEL}>Last 30 days</p>

      {/* ── Top KPI cards ── */}
      <div className="stagger" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px',
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
            fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 300,
            color: grossProfit >= 0 ? '#6b7c5c' : '#a05050', lineHeight: 1,
          }}>
            R {grossProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Unforeseen Costs</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 300, color: 'var(--clay)', lineHeight: 1 }}>
            R {totalExpenses.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* ── Net profit ── */}
      <div className="card" style={{
        textAlign: 'center', padding: '32px 20px', marginBottom: '24px',
        background: netProfit >= 0 ? 'rgba(107,124,92,0.06)' : 'rgba(184,124,90,0.06)',
      }}>
        <p style={{ ...LABEL, marginBottom: '12px' }}>Net Profit</p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 300,
          color: netProfit >= 0 ? '#6b7c5c' : '#a05050', lineHeight: 1,
        }}>
          R {netProfit.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* ── Revenue chart ── */}
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

      {/* ── Recent sales table ── */}
      {enrichedSales.length > 0 && (
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Recent sales</p>
          <div>
            {enrichedSales.slice(0, 8).map(({ sale, product, revenue, profit }, i, arr) => (
              <div
                key={sale.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '12px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 300, color: 'var(--ink-muted)', width: '56px', flexShrink: 0 }}>
                  {format(parseISO(sale.date), 'MMM d')}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 300, color: 'var(--ink)', flex: 1 }}>
                  {product?.name ?? '—'}
                  <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginLeft: '8px' }}>
                    ×{sale.units}
                  </span>
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 300, color: '#6b5c8a', minWidth: '80px', textAlign: 'right' }}>
                  R {revenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 300,
                  color: profit >= 0 ? '#6b7c5c' : '#a05050',
                  minWidth: '80px', textAlign: 'right',
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
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.9rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            No sales logged in the last 30 days.
          </p>
        </div>
      )}
    </section>
  )
}

export default SummarySection
