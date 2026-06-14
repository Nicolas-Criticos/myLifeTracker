import { format, parseISO } from 'date-fns'
import type { Expense } from '../../lib/supabase'
import { LABEL, FIELD_STYLE, SECTION_LABEL, PRIMARY_BUTTON } from './businessStyles'
import { EXPENSE_CATEGORIES } from './businessUtils'

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface ExpenseFormState {
  date: string
  description: string
  amount: string
  category: string
  notes: string
}

interface Props {
  expenseForm: ExpenseFormState
  setExpenseForm: React.Dispatch<React.SetStateAction<ExpenseFormState>>
  submittingExpense: boolean
  expenseDone: boolean
  onSubmit: (e: React.FormEvent) => void
  expenses: Expense[]
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export function ExpensesSection({
  expenseForm, setExpenseForm,
  submittingExpense, expenseDone,
  onSubmit,
  expenses,
}: Props) {
  return (
    <section>
      <p style={SECTION_LABEL}>Unforeseen expenses</p>
      <div className="card" style={{ padding: '32px' }}>

        {/* ── Expense form ── */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                type="number" min="0" step="0.01" placeholder="0"
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
              type="text" placeholder="e.g. Petrol to deliver order"
              value={expenseForm.description}
              onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
              style={FIELD_STYLE}
              required
            />
          </div>

          <div>
            <label style={{ ...LABEL, display: 'block', marginBottom: '6px' }}>Notes</label>
            <input
              type="text" placeholder="Optional"
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

        {/* ── Recent expenses list ── */}
        {expenses.length > 0 && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <p style={{ ...LABEL, marginBottom: '14px' }}>Recent expenses</p>
            <div>
              {expenses.slice(0, 8).map((e, i, arr) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
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
                      fontFamily: 'var(--font-body)', fontSize: '0.62rem', fontWeight: 400,
                      letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)',
                      background: 'var(--border)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
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
  )
}

export default ExpensesSection
