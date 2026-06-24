import { useNavigate } from 'react-router-dom'
import { useHighPriorityTasks } from '../../lib/queries'
import type { TaskPriority } from '../../lib/supabase'

const PRIORITY_STYLE: Record<'critical' | 'high', { color: string; bg: string; border: string }> = {
  critical: {
    color: '#b8332e',
    bg: 'rgba(200,60,55,0.12)',
    border: 'rgba(200,60,55,0.25)',
  },
  high: {
    color: '#9a7e2e',
    bg: 'rgba(201,168,76,0.18)',
    border: 'rgba(201,168,76,0.35)',
  },
}

const CATEGORY_ACCENT: Record<string, string> = {
  FOUNDATION: 'var(--foundation)',
  LEVERAGE: 'var(--leverage)',
  EXPRESSION: 'var(--expression)',
}

export default function HighPriorityCallout() {
  const navigate = useNavigate()
  const { data: tasks = [], isLoading } = useHighPriorityTasks()

  if (isLoading) return null
  if (tasks.length === 0) return null

  const visible = tasks.slice(0, 5)

  return (
    <div
      style={{
        maxWidth: '760px',
        margin: '20px auto 0',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          padding: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: '0.02em',
            }}
          >
            🔥 Needs Attention
          </h3>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'var(--ink-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {tasks.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {visible.map((task, i) => {
            const priority = task.priority as TaskPriority
            const style = priority === 'critical' ? PRIORITY_STYLE.critical : PRIORITY_STYLE.high
            const projectName = task.ops_projects?.name ?? '—'
            const category = task.ops_projects?.category ?? ''
            const accent = CATEGORY_ACCENT[category] ?? 'var(--ink-muted)'
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate(`/projects#${category}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minHeight: '48px',
                  padding: '10px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    width: '3px',
                    alignSelf: 'stretch',
                    background: accent,
                    borderRadius: '2px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.62rem',
                      fontWeight: 400,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: accent,
                    }}
                  >
                    {projectName}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9rem',
                      fontWeight: 400,
                      color: 'var(--ink)',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                    }}
                  >
                    {task.title}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.6rem',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: style.color,
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    flexShrink: 0,
                  }}
                >
                  {priority}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
