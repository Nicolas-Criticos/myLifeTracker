import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import {
  useFinAccounts, useFinEntries, useUpsertFinEntry, useCreateFinAccount,
} from '../lib/queries'

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

const PRESET_COLORS = ['#6b5c8a', '#8a6a3a', '#5c7a5c', '#8a4a4a', '#4a6a8a', '#7a6a4a']

function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`
}

export default function Finances() {
  const { data: accounts = [], isLoading: loadingAccounts } = useFinAccounts()
  const { data: entries = [], isLoading: loadingEntries } = useFinEntries()
  const upsertEntry = useUpsertFinEntry()
  const createAccount = useCreateFinAccount()

  // Entry form state
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Investment form state
  const [newInvName, setNewInvName] = useState('')
  const [newInvColor, setNewInvColor] = useState(PRESET_COLORS[0])
  const [addingInv, setAddingInv] = useState(false)

  // Populate form when month or entries change
  const existingForMonth = useMemo(() => {
    const map: Record<string, number> = {}
    entries.filter(e => e.month === selectedMonth).forEach(e => {
      map[e.account_id] = e.amount_zar
    })
    return map
  }, [entries, selectedMonth])

  // Build chart data
  const chartData = useMemo(() => {
    if (accounts.length === 0 || entries.length === 0) return []

    // Get unique sorted months
    const months = [...new Set(entries.map(e => e.month))].sort()

    return months.map(month => {
      const row: Record<string, string | number> = { month: formatMonthLabel(month) }
      let total = 0
      accounts.forEach(acc => {
        const entry = entries.find(e => e.account_id === acc.id && e.month === month)
        const val = entry ? Number(entry.amount_zar) : 0
        row[acc.id] = val
        total += val
      })
      row['net_worth'] = total
      return row
    })
  }, [accounts, entries])

  const investmentAccounts = accounts.filter(a => a.type === 'investment')
  const loading = loadingAccounts || loadingEntries

  // Handlers
  async function handleSaveMonth(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      for (const acc of accounts) {
        const val = amounts[acc.id]
        if (val !== undefined && val !== '') {
          await upsertEntry.mutateAsync({
            account_id: acc.id,
            month: selectedMonth,
            amount_zar: Number(val),
            notes: null,
          })
        }
      }
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2500)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddInvestment(e: React.FormEvent) {
    e.preventDefault()
    if (!newInvName.trim()) return
    setAddingInv(true)
    try {
      await createAccount.mutateAsync({
        name: newInvName.trim(),
        type: 'investment',
        color: newInvColor,
        active: true,
      })
      setNewInvName('')
      setNewInvColor(PRESET_COLORS[0])
    } finally {
      setAddingInv(false)
    }
  }

  // When switching months, pre-fill with existing values
  function handleMonthChange(month: string) {
    setSelectedMonth(month)
    const prefill: Record<string, string> = {}
    entries.filter(e => e.month === month).forEach(e => {
      prefill[e.account_id] = String(e.amount_zar)
    })
    setAmounts(prefill)
  }

  // Net worth KPI
  const latestMonth = [...new Set(entries.map(e => e.month))].sort().pop()
  const latestNetWorth = latestMonth
    ? entries.filter(e => e.month === latestMonth).reduce((s, e) => s + Number(e.amount_zar), 0)
    : null

  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <svg width="56" height="56" fill="none" viewBox="0 0 56 56" style={{ marginBottom: '16px' }}>
          <circle cx="28" cy="28" r="27" stroke="rgba(92,122,92,0.1)"  strokeWidth="1" />
          <circle cx="28" cy="28" r="20" stroke="rgba(92,122,92,0.18)" strokeWidth="1" />
          <circle cx="28" cy="28" r="12" stroke="rgba(92,122,92,0.28)" strokeWidth="1" />
          <circle cx="28" cy="28" r="4"  fill="rgba(92,122,92,0.45)" />
        </svg>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.6rem',
          color: 'var(--ink)',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}>
          Finances
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Monthly balances · ZAR
        </p>
      </div>

      {/* Net Worth KPI */}
      {latestNetWorth !== null && (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <p style={{ ...LABEL, marginBottom: '12px' }}>Net Worth</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 300, color: 'var(--ink)', lineHeight: 1 }}>
              R {latestNetWorth.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: 300, color: 'var(--ink-muted)', marginTop: '8px' }}>
              {latestMonth ? formatMonthLabel(latestMonth) : ''}
            </p>
          </div>
          {accounts.filter(a => a.type !== 'investment').map(acc => {
            const entry = entries.find(e => e.account_id === acc.id && e.month === latestMonth)
            return (
              <div key={acc.id} className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                <p style={{ ...LABEL, marginBottom: '12px' }}>{acc.name}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 300, color: acc.color, lineHeight: 1 }}>
                  R {entry ? Number(entry.amount_zar).toLocaleString('en-ZA', { maximumFractionDigits: 0 }) : '—'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Trajectory Chart */}
      {chartData.length > 0 ? (
        <div className="card" style={{ marginBottom: '24px', padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Financial trajectory</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                {accounts.map(acc => (
                  <linearGradient key={acc.id} id={`grad-${acc.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={acc.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={acc.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,42,37,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#7a7568', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#7a7568', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `R${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: number, name: string) => {
                  const acc = accounts.find(a => a.id === name)
                  const label = name === 'net_worth' ? 'Net Worth' : (acc?.name ?? name)
                  return [`R ${v.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`, label]
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const acc = accounts.find(a => a.id === value)
                  return value === 'net_worth' ? 'Net Worth' : (acc?.name ?? value)
                }}
                wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--ink-muted)' }}
              />
              {/* Individual account lines */}
              {accounts.map(acc => (
                <Line
                  key={acc.id}
                  type="monotone"
                  dataKey={acc.id}
                  stroke={acc.color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: acc.color, stroke: 'none' }}
                />
              ))}
              {/* Net worth line */}
              <Line
                type="monotone"
                dataKey="net_worth"
                stroke="#2c2a25"
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4, fill: '#2c2a25', stroke: 'none' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : !loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px', marginBottom: '24px' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.95rem',
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            No entries yet. Log your first month below to see the trajectory.
          </p>
        </div>
      ) : null}

      {loading && (
        <div style={{ textAlign: 'center', padding: '32px', fontFamily: 'var(--font-body)', fontWeight: 300, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
          Loading…
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

        {/* Monthly Entry Form */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '24px' }}>Log monthly balances</p>
          <form onSubmit={handleSaveMonth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => handleMonthChange(e.target.value)}
                style={FIELD_STYLE}
                required
              />
            </div>

            {accounts.map(acc => (
              <div key={acc.id}>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: acc.color,
                    marginRight: '6px',
                    verticalAlign: 'middle',
                  }} />
                  {acc.name}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={existingForMonth[acc.id] !== undefined ? String(existingForMonth[acc.id]) : 'R 0.00'}
                  value={amounts[acc.id] ?? ''}
                  onChange={e => setAmounts(prev => ({ ...prev, [acc.id]: e.target.value }))}
                  style={FIELD_STYLE}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#fff',
                background: submitted ? 'var(--foundation)' : 'var(--ink)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '12px 28px',
                cursor: submitting ? 'wait' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 200ms ease',
                alignSelf: 'flex-start',
              }}
            >
              {submitted ? '✓ Saved' : submitting ? 'Saving…' : 'Save month'}
            </button>
          </form>
        </div>

        {/* Investment Manager */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '24px' }}>Investments</p>

          {investmentAccounts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {investmentAccounts.map(acc => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: acc.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 300, color: 'var(--ink)', flex: 1 }}>
                    {acc.name}
                  </span>
                  {/* Latest balance */}
                  {(() => {
                    const latest = [...entries].filter(e => e.account_id === acc.id).sort((a, b) => b.month.localeCompare(a.month))[0]
                    return latest ? (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 300, color: acc.color }}>
                        R {Number(latest.amount_zar).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 300, color: 'var(--ink-muted)' }}>
                        No data
                      </span>
                    )
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.82rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
              marginBottom: '24px',
            }}>
              No investments yet. Add your first below.
            </p>
          )}

          {/* Add Investment Form */}
          <div style={{ borderTop: investmentAccounts.length > 0 ? 'none' : undefined, paddingTop: '0' }}>
            <p style={{ ...LABEL, marginBottom: '16px' }}>Add investment</p>
            <form onSubmit={handleAddInvestment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Name</label>
                <input
                  type="text"
                  value={newInvName}
                  onChange={e => setNewInvName(e.target.value)}
                  placeholder="e.g. BTC, Gold, ETF"
                  style={FIELD_STYLE}
                  required
                />
              </div>
              <div>
                <label style={{ ...LABEL, display: 'block', marginBottom: '8px' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewInvColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c,
                        border: newInvColor === c ? '2px solid var(--ink)' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'border-color 150ms ease',
                        outline: 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={addingInv}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 400,
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  background: 'var(--ink)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '12px 28px',
                  cursor: addingInv ? 'wait' : 'pointer',
                  opacity: addingInv ? 0.6 : 1,
                  transition: 'all 200ms ease',
                  alignSelf: 'flex-start',
                }}
              >
                {addingInv ? 'Adding…' : '+ Add investment'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Entry History Table */}
      {entries.length > 0 && (
        <div className="card" style={{ padding: '28px 32px' }}>
          <p style={{ ...LABEL, marginBottom: '20px' }}>Entry history</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
              <thead>
                <tr>
                  <th style={{ ...LABEL, textAlign: 'left', padding: '8px 12px 12px 0', borderBottom: '1px solid var(--border)' }}>Month</th>
                  {accounts.map(acc => (
                    <th key={acc.id} style={{ ...LABEL, textAlign: 'right', padding: '8px 12px 12px', borderBottom: '1px solid var(--border)' }}>
                      {acc.name}
                    </th>
                  ))}
                  <th style={{ ...LABEL, textAlign: 'right', padding: '8px 0 12px 12px', borderBottom: '1px solid var(--border)' }}>Net Worth</th>
                </tr>
              </thead>
              <tbody>
                {[...new Set(entries.map(e => e.month))].sort().reverse().map(month => {
                  const total = accounts.reduce((s, acc) => {
                    const e = entries.find(x => x.account_id === acc.id && x.month === month)
                    return s + (e ? Number(e.amount_zar) : 0)
                  }, 0)
                  return (
                    <tr key={month}>
                      <td style={{ padding: '10px 12px 10px 0', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>
                        {formatMonthLabel(month)}
                      </td>
                      {accounts.map(acc => {
                        const e = entries.find(x => x.account_id === acc.id && x.month === month)
                        return (
                          <td key={acc.id} style={{ padding: '10px 12px', fontSize: '0.82rem', fontWeight: 300, color: e ? acc.color : 'var(--ink-muted)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                            {e ? `R ${Number(e.amount_zar).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` : '—'}
                          </td>
                        )
                      })}
                      <td style={{ padding: '10px 0 10px 12px', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 300, color: 'var(--ink)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                        R {total.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
