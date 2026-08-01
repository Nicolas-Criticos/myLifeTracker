import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { useOpsExpenses, useCreateOpsExpense, useFinEntries } from '../../lib/queries'
import type { OpsExpense } from '../../lib/supabase'

const CATEGORIES = ['FOOD', 'BUSINESS', 'RUNNING COSTS', 'LIFESTYLE'] as const
const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#8a6a3a',
  BUSINESS: '#6b5c8a',
  'RUNNING COSTS': '#5c7a5c',
  LIFESTYLE: '#8a4a4a',
}

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

export function ExpenseTracker() {
  const today = format(new Date(), 'yyyy-MM')
  const [selectedMonth, setSelectedMonth] = useState(today)
  const { data: expenses = [], isLoading: loadingExpenses } = useOpsExpenses(selectedMonth)
  const { data: entries = [] } = useFinEntries()
  const createExpense = useCreateOpsExpense()

  // Quick-add form
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formAmount, setFormAmount] = useState('')
  const [formCategory, setFormCategory] = useState<string>('FOOD')
  const [formDescription, setFormDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Income: sum of personal + business fin_monthly_entries for selected month
  const income = useMemo(() => {
    return entries
      .filter(e => e.month === selectedMonth)
      .reduce((sum, e) => sum + Number(e.amount_zar), 0)
  }, [entries, selectedMonth])

  // Total expenses for the month
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  }, [expenses])

  // Group expenses by category, sorted by amount desc
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount)
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }))
  }, [expenses])

  // Ratio
  const ratio = income > 0 ? (totalExpenses / income) * 100 : 0

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!formAmount || !formDescription.trim()) return
    setSubmitting(true)
    try {
      await createExpense.mutateAsync({
        amount: Number(formAmount),
        category: formCategory as OpsExpense['category'],
        description: formDescription.trim(),
        date: formDate,
      })
      setFormAmount('')
      setFormDescription('')
      setFormDate(format(new Date(), 'yyyy-MM-dd'))
      setFormCategory('FOOD')
      setShowForm(false)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card" style={{ padding: '28px 32px', marginBottom: '0' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <p style={{ ...LABEL, marginBottom: '4px' }}>Expense Tracker</p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.72rem',
            color: 'var(--ink-muted)',
          }}>
            Spending vs income by category
          </p>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          style={{
            ...FIELD_STYLE,
            width: 'auto',
            minWidth: '140px',
            fontSize: '0.78rem',
          }}
        />
      </div>

      {loadingExpenses ? (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.82rem',
          color: 'var(--ink-muted)',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '20px 0',
        }}>
          Loading…
        </p>
      ) : expenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.95rem',
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}>
            No expenses logged this month. Add your first below.
          </p>
        </div>
      ) : (
        <>
          {/* Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {/* Income bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.68rem',
                fontWeight: 300,
                color: 'var(--ink-muted)',
                width: '56px',
                flexShrink: 0,
                textAlign: 'right',
              }}>
                Income
              </span>
              <div style={{
                flex: 1,
                height: '22px',
                background: 'rgba(44,42,37,0.06)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'rgba(44,42,37,0.15)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '12px',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.7rem',
                    fontWeight: 300,
                    color: 'var(--ink)',
                  }}>
                    R {income.toLocaleString('en-ZA', { maximumFractionDigits: 0 })} income
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.68rem',
                fontWeight: 300,
                color: 'var(--ink-muted)',
                width: '56px',
                flexShrink: 0,
                textAlign: 'right',
              }}>
                Expenses
              </span>
              <div style={{
                flex: 1,
                height: '22px',
                background: 'rgba(44,42,37,0.04)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                display: 'flex',
              }}>
                {categoryTotals.map(({ category, amount }) => {
                  const pct = income > 0 ? (amount / income) * 100 : (totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0)
                  return (
                    <div
                      key={category}
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        height: '100%',
                        background: CATEGORY_COLORS[category] || 'var(--ink-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                      title={`${category}: R ${amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`}
                    >
                      {pct > 6 && (
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.58rem',
                          fontWeight: 400,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                        }}>
                          {category} R{amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Ratio text */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            Expenses are {ratio.toFixed(0)}% of income
            {ratio > 100 && (
              <span style={{ color: 'var(--clay)', marginLeft: '4px' }}>⚠ Overspent</span>
            )}
          </p>
        </>
      )}

      {/* Expense list (when there are expenses) */}
      {expenses.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <thead>
              <tr>
                <th style={{ ...LABEL, textAlign: 'left', padding: '8px 12px 8px 0', borderBottom: '1px solid var(--border)' }}>Date</th>
                <th style={{ ...LABEL, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Category</th>
                <th style={{ ...LABEL, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Description</th>
                <th style={{ ...LABEL, textAlign: 'right', padding: '8px 0 8px 12px', borderBottom: '1px solid var(--border)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td style={{ padding: '8px 12px 8px 0', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>
                    {format(new Date(e.date + 'T00:00:00'), 'dd MMM yyyy')}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: CATEGORY_COLORS[e.category] || 'var(--ink-muted)',
                      marginRight: '6px',
                      verticalAlign: 'middle',
                    }} />
                    {e.category}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '0.78rem', fontWeight: 300, color: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>
                    {e.description}
                  </td>
                  <td style={{ padding: '8px 0 8px 12px', fontSize: '0.82rem', fontWeight: 300, color: 'var(--ink)', textAlign: 'right', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--border)' }}>
                    R {Number(e.amount).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick-add form */}
      <div style={{ borderTop: expenses.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: expenses.length > 0 ? '16px' : '0' }}>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
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
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {submitted ? '✓ Added' : '+ Add expense'}
          </button>
        ) : (
          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px' }}>
                <label style={{ ...LABEL, display: 'block', marginBottom: '4px' }}>Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  style={FIELD_STYLE}
                  required
                />
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <label style={{ ...LABEL, display: 'block', marginBottom: '4px' }}>Amount (R)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  style={FIELD_STYLE}
                  required
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ ...LABEL, display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  style={{
                    ...FIELD_STYLE,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ ...LABEL, display: 'block', marginBottom: '4px' }}>Description</label>
              <input
                type="text"
                placeholder="e.g. groceries, petrol, rent"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                style={FIELD_STYLE}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
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
                  background: 'var(--ink)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '10px 24px',
                  cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 200ms ease',
                }}
              >
                {submitting ? 'Saving…' : 'Save expense'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 400,
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
