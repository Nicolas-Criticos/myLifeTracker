import { useState, useEffect } from 'react'
import RehabDashboard from '../components/olive-rehab/RehabDashboard'
import RehabLogs from '../components/olive-rehab/RehabLogs'
import RehabWeeklySummaries from '../components/olive-rehab/RehabWeeklySummaries'
import RehabTodos from '../components/olive-rehab/RehabTodos'

type Tab = 'dashboard' | 'logs' | 'weekly' | 'todos'

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'logs',      label: 'Daily Logs' },
  { key: 'weekly',    label: 'Weekly Summaries' },
  { key: 'todos',     label: 'To-Dos' },
]

// Small olive branch SVG for the page header
function OliveLeafIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {/* Branch */}
      <path d="M14 24 C14 18, 8 14, 6 8" stroke="#5a7247" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Leaves along branch */}
      <ellipse cx="10" cy="16" rx="4" ry="2.2" fill="#6b8c52" opacity="0.8"
               transform="rotate(-30 10 16)" />
      <ellipse cx="8" cy="12" rx="3.5" ry="2" fill="#5a7a40" opacity="0.75"
               transform="rotate(-50 8 12)" />
      <ellipse cx="7" cy="8.5" rx="3" ry="1.8" fill="#6b8c52" opacity="0.7"
               transform="rotate(-70 7 8.5)" />
      {/* Small olive fruits */}
      <ellipse cx="12" cy="14" rx="1.8" ry="2.4" fill="#4a5a2a" opacity="0.6"
               transform="rotate(15 12 14)" />
      <ellipse cx="9.5" cy="10.5" rx="1.5" ry="2" fill="#4a5a2a" opacity="0.55"
               transform="rotate(5 9.5 10.5)" />
    </svg>
  )
}

export default function OliveRehab() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  // Apply olive realm styling to body — shifts background from sand to olive-green ambient
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
      position: 'relative',
      zIndex: 1,
    }}>

      {/* Page Header */}
      <header style={{ paddingTop: '48px', paddingBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
          <OliveLeafIcon />
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
          fontSize: '0.75rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          margin: 0,
          paddingLeft: '42px',
          letterSpacing: '0.04em',
        }}>
          10 blocks · 5,000 trees · recovery in progress
        </p>
      </header>

      {/* Sub-tab navigation */}
      <nav style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '36px',
        padding: '4px',
        background: 'rgba(90, 114, 71, 0.05)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(90, 114, 71, 0.09)',
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
              color: activeTab === tab.key ? '#3a5a2a' : 'var(--ink-faint)',
              background: activeTab === tab.key
                ? 'rgba(255, 252, 245, 0.88)'
                : 'transparent',
              boxShadow: activeTab === tab.key
                ? '0 2px 8px rgba(90, 114, 71, 0.1), 0 1px 3px rgba(44, 42, 37, 0.06)'
                : 'none',
              transition: 'all 250ms ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content — key forces remount animation on tab switch */}
      <main key={activeTab}>
        {activeTab === 'dashboard' && <RehabDashboard />}
        {activeTab === 'logs'      && <RehabLogs />}
        {activeTab === 'weekly'    && <RehabWeeklySummaries />}
        {activeTab === 'todos'     && <RehabTodos />}
      </main>
    </div>
  )
}
