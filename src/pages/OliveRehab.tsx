import { useState, useEffect } from 'react'
import RehabDashboard from '../components/olive-rehab/RehabDashboard'
import RehabLogs from '../components/olive-rehab/RehabLogs'
import RehabWeeklySummaries from '../components/olive-rehab/RehabWeeklySummaries'
import RehabTodos from '../components/olive-rehab/RehabTodos'
import RehabCalendar from '../components/olive-rehab/RehabCalendar'
import AddLogForm from '../components/olive-rehab/AddLogForm'

type Tab = 'dashboard' | 'logs' | 'weekly' | 'todos' | 'calendar'

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'logs', label: 'Daily Logs' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'todos', label: 'To-Dos' },
]

export default function OliveRehab() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [showAddLog, setShowAddLog] = useState(false)

  // Apply olive realm class to body for background switch
  useEffect(() => {
    document.body.classList.add('olive-realm')
    return () => {
      document.body.classList.remove('olive-realm')
    }
  }, [])

  return (
    <div className="animate-in" style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '0 40px 80px',
    }}>
      {/* Page Header */}
      <div style={{
        paddingTop: '48px',
        paddingBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem' }}>🫒</span>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: '2.2rem',
              color: 'var(--ink)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Olive Rehabilitation
            </h1>
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            margin: 0,
            paddingLeft: '48px',
          }}>
            10 blocks · 5,000 trees · Karoo R407
          </p>
        </div>

        {/* Add Log Button */}
        <button
          onClick={() => setShowAddLog(true)}
          style={{
            marginTop: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(90, 114, 71, 0.25)',
            background: 'rgba(90, 114, 71, 0.08)',
            color: '#5a7247',
            fontFamily: 'var(--font-body)',
            fontSize: '0.7rem',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 200ms ease',
          }}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
          Log Activity
        </button>
      </div>

      {/* Sub-tab navigation */}
      <nav style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '36px',
        padding: '4px',
        background: 'rgba(90, 114, 71, 0.05)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(90, 114, 71, 0.08)',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'calc(var(--radius-md) - 4px)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              fontWeight: activeTab === tab.key ? 500 : 300,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: activeTab === tab.key ? '#3a5a2a' : 'var(--ink-muted)',
              background: activeTab === tab.key
                ? 'rgba(255, 252, 245, 0.9)'
                : 'transparent',
              boxShadow: activeTab === tab.key
                ? '0 2px 8px rgba(90, 114, 71, 0.1)'
                : 'none',
              transition: 'all 300ms ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div key={activeTab}>
        {activeTab === 'dashboard' && <RehabDashboard />}
        {activeTab === 'logs' && <RehabLogs />}
        {activeTab === 'weekly' && <RehabWeeklySummaries />}
        {activeTab === 'calendar' && <RehabCalendar />}
        {activeTab === 'todos' && <RehabTodos />}
      </div>

      {/* Add Log Modal */}
      {showAddLog && (
        <AddLogForm onClose={() => setShowAddLog(false)} />
      )}
    </div>
  )
}
