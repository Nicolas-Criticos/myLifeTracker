import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryAccent } from '../../lib/utils'
import { useCreateTask, useUpdateTask } from '../../lib/queries'
import type { Category, Project, Task, TaskPriority, TaskStatus } from '../../lib/supabase'

interface ProjectListProps {
  projects: Project[]
  tasks: Task[]
}

const CATEGORIES: Category[] = ['FOUNDATION', 'LEVERAGE', 'EXPRESSION']

const categoryConfig: Record<Category, { label: string; color: string; dot: string }> = {
  FOUNDATION: { label: 'Wellbeing',  color: 'var(--foundation)', dot: '#5c7a5c' },
  LEVERAGE:   { label: 'Growth',     color: 'var(--leverage)',   dot: '#4a6b8a' },
  EXPRESSION: { label: 'Creation',   color: 'var(--expression)', dot: '#8a6a3a' },
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

function InlineTaskManager({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('normal')

  const activeTasks = tasks.filter(t => t.status !== 'dropped')
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 }
  const sortedTasks = [...activeTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  })

  function handleAdd() {
    if (!newTitle.trim()) return
    createTask.mutate({
      project_id: projectId,
      title: newTitle.trim(),
      description: null,
      status: 'pending' as TaskStatus,
      priority: newPriority,
      scheduled_date: null,
      completed_at: null,
      dropped_reason: null,
      recurrence: null,
    })
    setNewTitle('')
    setNewPriority('normal')
    setShowAdd(false)
  }

  function handleToggle(task: Task) {
    if (task.status === 'completed') {
      updateTask.mutate({ id: task.id, status: 'pending' as TaskStatus, completed_at: null })
    } else {
      updateTask.mutate({ id: task.id, status: 'completed' as TaskStatus, completed_at: new Date().toISOString() })
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
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
          }}
        >
          + Add Task
        </button>
      </div>

      {showAdd && (
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '12px',
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
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            style={{
              background: newTitle.trim() ? 'var(--olive)' : 'rgba(44,42,37,0.08)',
              color: newTitle.trim() ? 'white' : 'var(--ink-muted)',
              border: 'none', borderRadius: '10px', padding: '0 16px',
              fontSize: '0.72rem', cursor: newTitle.trim() ? 'pointer' : 'default',
              flexShrink: 0,
            }}
          >
            Add
          </button>
          <button
            onClick={() => setShowAdd(false)}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '10px',
              padding: '0 12px', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--ink-muted)',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {sortedTasks.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.82rem',
          color: 'var(--ink-muted)',
          fontStyle: 'italic',
          margin: 0,
        }}>
          No tasks yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sortedTasks.map(task => {
            const isDone = task.status === 'completed'
            return (
              <div key={task.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: isDone ? 'rgba(107,124,92,0.04)' : 'rgba(44,42,37,0.02)',
                border: `1px solid ${isDone ? 'rgba(107,124,92,0.08)' : 'rgba(44,42,37,0.04)'}`,
                marginBottom: '4px',
              }}>
                <button
                  onClick={() => handleToggle(task)}
                  style={{
                    width: '18px', height: '18px', borderRadius: '5px',
                    border: `2px solid ${isDone ? 'var(--olive)' : 'rgba(44,42,37,0.2)'}`,
                    background: isDone ? 'var(--olive)' : 'transparent',
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isDone && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal,
                  flexShrink: 0,
                }} />
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  fontWeight: isDone ? 300 : 400,
                  color: isDone ? 'var(--ink-muted)' : 'var(--ink)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  margin: 0, flex: 1,
                }}>
                  {task.title}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const statusColors: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'rgba(107,124,92,0.1)',   text: 'var(--foundation)' },
  paused:    { bg: 'rgba(201,168,76,0.12)',  text: 'var(--gold)' },
  completed: { bg: 'rgba(44,42,37,0.06)',    text: 'var(--ink-muted)' },
}

export default function ProjectList({ projects, tasks }: ProjectListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {CATEGORIES.map(category => {
        const catProjects = projects.filter(p => p.category === category)
        const { label, color, dot } = categoryConfig[category]

        return (
          <div key={category}>
            {/* Category header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingLeft: '16px',
              borderLeft: `3px solid ${dot}`,
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '1.25rem',
                  color: 'var(--ink)',
                  letterSpacing: '0.04em',
                }}>
                  {label}
                </h3>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.72rem',
                  fontWeight: 300,
                  color,
                }}>
                  {catProjects.length} {catProjects.length === 1 ? 'project' : 'projects'}
                </span>
              </div>
            </div>

            {catProjects.length === 0 ? (
              <p style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.875rem',
                color: 'var(--ink-muted)',
                fontStyle: 'italic',
                paddingLeft: '16px',
              }}>
                No projects in this category.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {catProjects.map(project => {
                  const projectTasks = tasks.filter(t => t.project_id === project.id)
                  const activeTasks = projectTasks.filter(t => t.status !== 'dropped')
                  const completedTasks = projectTasks.filter(t => t.status === 'completed')
                  const percent = activeTasks.length > 0
                    ? Math.round((completedTasks.length / activeTasks.length) * 100)
                    : 0
                  const accent = categoryAccent(category)
                  const isOpen = expanded.has(project.id)
                  const sc = statusColors[project.status] ?? statusColors.active

                  return (
                    <div
                      key={project.id}
                      style={{
                        background: 'var(--surface)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'box-shadow 200ms var(--ease-breath)',
                      }}
                    >
                      {/* Project header */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', cursor: 'pointer' }}
                        onClick={() => toggle(project.id)}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h4 style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '1.1rem',
                              fontWeight: 400,
                              color: 'var(--ink)',
                              letterSpacing: '0.02em',
                            }}>
                              {project.name}
                            </h4>
                            <span style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '0.65rem',
                              fontWeight: 400,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: sc.text,
                              background: sc.bg,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              flexShrink: 0,
                            }}>
                              {project.status}
                            </span>
                          </div>
                          {project.description && (
                            <p style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '0.82rem',
                              fontWeight: 300,
                              color: 'var(--ink-muted)',
                              lineHeight: 1.55,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {project.description}
                            </p>
                          )}
                          {/* Progress bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <div style={{
                              flex: 1,
                              height: '3px',
                              background: 'var(--border)',
                              borderRadius: 'var(--radius-full)',
                              overflow: 'hidden',
                              maxWidth: '200px',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${percent}%`,
                                background: accent,
                                borderRadius: 'var(--radius-full)',
                                opacity: 0.7,
                                transition: 'width 500ms var(--ease-breath)',
                              }} />
                            </div>
                            <span style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '0.7rem',
                              fontWeight: 300,
                              color: 'var(--ink-muted)',
                            }}>
                              {completedTasks.length}/{activeTasks.length}
                            </span>
                          </div>
                        </div>

                        <Link
                          to={`/projects/${project.id}`}
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.72rem',
                            fontWeight: 300,
                            color: 'var(--ink-muted)',
                            textDecoration: 'none',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--border)',
                            transition: 'all 200ms',
                            flexShrink: 0,
                            letterSpacing: '0.04em',
                          }}
                        >
                          Detail
                        </Link>
                        <span style={{ color: 'var(--ink-muted)', fontSize: '0.7rem', flexShrink: 0 }}>
                          {isOpen ? '▲' : '▼'}
                        </span>
                      </div>

                      {/* Expanded task list */}
                      {isOpen && (
                        <div style={{
                          borderTop: '1px solid var(--border)',
                          padding: '20px 24px',
                          background: 'rgba(255,252,245,0.4)',
                        }}>
                          <InlineTaskManager projectId={project.id} tasks={projectTasks} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
