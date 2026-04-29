import { useState } from 'react'
import { useUpdateProject, useCreateTask, useUpdateTask } from '../../lib/queries'
import type { Project, Task, ProjectStatus, TaskStatus, TaskPriority, TaskRecurrence } from '../../lib/supabase'
import { format, parseISO, isToday, isPast } from 'date-fns'
import { nowInSAST } from '../../lib/utils'

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 300,
}

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const INPUT: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.82rem',
  fontWeight: 300,
  color: 'var(--ink)',
  padding: '10px 14px',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  background: 'rgba(255, 252, 245, 0.8)',
  outline: 'none',
  width: '100%',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#a05050',
  high: '#8a6a3a',
  normal: 'rgba(44, 42, 37, 0.25)',
  low: 'rgba(44, 42, 37, 0.12)',
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'rgba(107,124,92,0.1)',  text: '#5c7a5c' },
  paused:    { bg: 'rgba(201,168,76,0.12)', text: '#b89a3c' },
  completed: { bg: 'rgba(44,42,37,0.06)',   text: 'var(--ink-muted)' },
}

const CATEGORY_COLORS: Record<string, string> = {
  FOUNDATION: '#5c7a5c',
  LEVERAGE: '#4a6b8a',
  EXPRESSION: '#8a6a3a',
}

interface ProjectDetailProps {
  project: Project
  tasks: Task[]
}

export default function ProjectDetail({ project, tasks }: ProjectDetailProps) {
  const updateProject = useUpdateProject()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const now = nowInSAST()
  const todayStr = format(now, 'yyyy-MM-dd')

  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('normal')
  const [newDate, setNewDate] = useState(todayStr)
  const [newRecurrence, setNewRecurrence] = useState<TaskRecurrence | ''>('')

  const activeTasks = tasks.filter(t => t.status !== 'dropped')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
  const percent = activeTasks.length > 0
    ? Math.round((completedTasks.length / activeTasks.length) * 100)
    : 0

  const accent = CATEGORY_COLORS[project.category] || '#5c7a5c'
  const sc = STATUS_STYLES[project.status] || STATUS_STYLES.active

  const handleAdd = () => {
    if (!newTitle.trim()) return
    createTask.mutate({
      project_id: project.id,
      title: newTitle.trim(),
      description: null,
      status: 'pending' as TaskStatus,
      priority: newPriority,
      scheduled_date: newDate || null,
      completed_at: null,
      dropped_reason: null,
      recurrence: newRecurrence || null,
    })
    setNewTitle('')
    setNewPriority('normal')
    setNewRecurrence('')
    setShowAdd(false)
  }

  const handleToggle = (task: Task) => {
    if (task.status === 'completed') {
      updateTask.mutate({ id: task.id, status: 'pending' as TaskStatus, completed_at: null })
    } else {
      updateTask.mutate({ id: task.id, status: 'completed' as TaskStatus, completed_at: new Date().toISOString() })
    }
  }

  const handleStatusChange = (status: ProjectStatus) => {
    updateProject.mutate({ id: project.id, status })
  }

  // Sort: pending first, then by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 }
  const sortedTasks = [...activeTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  })

  return (
    <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.58rem',
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
              background: `${accent}18`,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
            }}>
              {project.category}
            </span>
            <select
              value={project.status}
              onChange={e => handleStatusChange(e.target.value as ProjectStatus)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.58rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: sc.text,
                background: sc.bg,
                border: 'none',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <h2 style={{
            ...DISPLAY,
            fontSize: '2rem',
            color: 'var(--ink)',
            margin: '0 0 6px',
          }}>
            {project.name}
          </h2>
          {project.description && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {project.description}
            </p>
          )}
        </div>

        {/* Progress ring */}
        <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: '24px' }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(44,42,37,0.06)" strokeWidth="4" />
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(percent / 100) * 188.5} 188.5`}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 1s ease', opacity: 0.7 }}
            />
          </svg>
          <p style={{
            ...DISPLAY,
            fontSize: '1.1rem',
            color: 'var(--ink)',
            marginTop: '4px',
          }}>
            {percent}%
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Total', value: activeTasks.length },
          { label: 'Completed', value: completedTasks.length },
          { label: 'Pending', value: pendingTasks.length },
        ].map(s => (
          <div key={s.label} className="card" style={{
            textAlign: 'center',
            padding: '20px 16px',
          }}>
            <p style={{ ...LABEL, marginBottom: '8px' }}>{s.label}</p>
            <p style={{ ...DISPLAY, fontSize: '2rem', color: 'var(--ink)', lineHeight: 1, margin: 0 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ ...LABEL, margin: 0 }}>Tasks</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--olive)',
              background: 'var(--olive-muted)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            + Add Task
          </button>
        </div>

        {/* Quick add */}
        {showAdd && (
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px',
            padding: '14px 16px',
            background: 'rgba(107, 124, 92, 0.04)',
            border: '1px solid rgba(107, 124, 92, 0.1)',
            borderRadius: '12px',
          }}>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Task title..."
              style={{ ...INPUT, flex: 2 }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              style={{ ...INPUT, flex: 1 }}
            />
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as TaskPriority)}
              style={{ ...INPUT, flex: 0.7, cursor: 'pointer' }}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={newRecurrence}
              onChange={e => setNewRecurrence(e.target.value as TaskRecurrence | '')}
              style={{ ...INPUT, flex: 0.9, cursor: 'pointer' }}
              title="Repeat"
            >
              <option value="">No repeat</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Every weekday</option>
            </select>
            <button onClick={handleAdd} disabled={!newTitle.trim()} style={{
              background: newTitle.trim() ? 'var(--olive)' : 'rgba(44,42,37,0.08)',
              color: newTitle.trim() ? 'white' : 'var(--ink-muted)',
              border: 'none', borderRadius: '10px', padding: '0 16px',
              fontSize: '0.72rem', cursor: newTitle.trim() ? 'pointer' : 'default',
              transition: 'all 200ms ease', flexShrink: 0,
            }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '10px',
              padding: '0 12px', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--ink-muted)',
              flexShrink: 0,
            }}>✕</button>
          </div>
        )}

        {/* Task list */}
        {sortedTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
          }}>
            <p style={{ ...DISPLAY, fontSize: '1.1rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
              No tasks yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sortedTasks.map(task => {
              const isDone = task.status === 'completed'
              const isOverdue = task.scheduled_date && !isDone &&
                isPast(parseISO(task.scheduled_date)) && !isToday(parseISO(task.scheduled_date))

              return (
                <div key={task.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: isDone ? 'rgba(107,124,92,0.04)' : isOverdue ? 'rgba(160,80,80,0.04)' : 'rgba(44,42,37,0.02)',
                  border: `1px solid ${isDone ? 'rgba(107,124,92,0.08)' : isOverdue ? 'rgba(160,80,80,0.08)' : 'rgba(44,42,37,0.04)'}`,
                  transition: 'all 200ms ease',
                }}>
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(task)}
                    style={{
                      width: '20px', height: '20px', borderRadius: '6px',
                      border: `2px solid ${isDone ? 'var(--olive)' : 'rgba(44,42,37,0.2)'}`,
                      background: isDone ? 'var(--olive)' : 'transparent',
                      cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Priority */}
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal,
                    flexShrink: 0,
                  }} />

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.85rem',
                      fontWeight: isDone ? 300 : 400,
                      color: isDone ? 'var(--ink-muted)' : 'var(--ink)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      margin: 0, lineHeight: 1.4,
                    }}>
                      {task.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                      {task.scheduled_date && (
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.65rem',
                          fontWeight: 300,
                          color: isOverdue ? '#a05050' : 'var(--ink-muted)',
                          margin: 0,
                        }}>
                          {isOverdue && '⚠ '}
                          {isToday(parseISO(task.scheduled_date))
                            ? 'Today'
                            : format(parseISO(task.scheduled_date), 'EEE, MMM d')}
                        </p>
                      )}
                      {task.recurrence && (
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.58rem',
                          fontWeight: 400,
                          letterSpacing: '0.06em',
                          color: accent,
                          background: `${accent}18`,
                          padding: '1px 7px',
                          borderRadius: 'var(--radius-full)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}>
                          ↻ {task.recurrence === 'daily' ? 'Daily' : 'Weekdays'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
