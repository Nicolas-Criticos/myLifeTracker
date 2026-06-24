import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useProjects,
  useAllTasksWithProjects,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '../lib/queries'
import type { Category, Project, Task, TaskPriority, TaskRecurrence } from '../lib/supabase'

const CATEGORY_ORDER: Category[] = ['FOUNDATION', 'LEVERAGE', 'EXPRESSION']

const CATEGORY_META: Record<Category, { label: string; accent: string; bg: string; subtitle: string }> = {
  FOUNDATION: {
    label: 'Foundation',
    accent: 'var(--foundation)',
    bg: 'rgba(92,122,92,0.06)',
    subtitle: 'Body · Mind · Soul',
  },
  LEVERAGE: {
    label: 'Leverage',
    accent: 'var(--leverage)',
    bg: 'rgba(74,107,138,0.06)',
    subtitle: 'Structure · Systems · Study',
  },
  EXPRESSION: {
    label: 'Expression',
    accent: 'var(--expression)',
    bg: 'rgba(138,106,58,0.06)',
    subtitle: 'Creativity · Content · Community',
  },
}

const PRIORITY_META: Record<TaskPriority, { label: string; bg: string; color: string; border: string }> = {
  critical: {
    label: 'critical',
    bg: 'rgba(200,60,55,0.12)',
    color: '#b8332e',
    border: 'rgba(200,60,55,0.25)',
  },
  high: {
    label: 'high',
    bg: 'rgba(201,168,76,0.18)',
    color: '#9a7e2e',
    border: 'rgba(201,168,76,0.35)',
  },
  normal: {
    label: 'normal',
    bg: 'rgba(44,42,37,0.05)',
    color: 'var(--ink-muted)',
    border: 'rgba(44,42,37,0.08)',
  },
  low: {
    label: 'low',
    bg: 'transparent',
    color: 'var(--ink-faint)',
    border: 'rgba(44,42,37,0.06)',
  },
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

function recurrenceLabel(r: TaskRecurrence | null): string {
  if (r === 'daily') return 'daily'
  if (r === 'weekdays') return 'weekdays'
  return 'one-off'
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY_META[priority]
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.6rem',
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: meta.color,
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        padding: '2px 7px',
        borderRadius: 'var(--radius-full)',
        flexShrink: 0,
      }}
    >
      {meta.label}
    </span>
  )
}

type TaskMenuAction = 'edit' | 'priority' | 'reminder' | 'delete'

interface TaskRowProps {
  task: Task
  accent: string
  onToggle: () => void
  onAction: (action: TaskMenuAction) => void
  fading: boolean
}

function TaskRow({ task, accent, onToggle, onAction, fading }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const longPressTimer = useRef<number | null>(null)
  const longPressFired = useRef(false)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [menuOpen])

  const startLongPress = () => {
    longPressFired.current = false
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true
      setMenuOpen(true)
    }, 500)
  }

  const cancelLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleClick = () => {
    if (longPressFired.current) return
    onToggle()
  }

  const completed = task.status === 'completed'

  return (
    <div
      ref={rowRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minHeight: '48px',
        padding: '10px 4px',
        borderBottom: '1px solid var(--border)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 400ms var(--ease-breath)',
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
        style={{
          width: '22px',
          height: '22px',
          flexShrink: 0,
          border: `1.5px solid ${completed ? accent : 'var(--ink-faint)'}`,
          background: completed ? accent : 'transparent',
          borderRadius: '50%',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div
        onClick={handleClick}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.92rem',
              fontWeight: 400,
              color: completed ? 'var(--ink-muted)' : 'var(--ink)',
              textDecoration: completed ? 'line-through' : 'none',
              opacity: completed ? 0.6 : 1,
              lineHeight: 1.35,
              wordBreak: 'break-word',
            }}
          >
            {task.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <PriorityBadge priority={task.priority} />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.62rem',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
            }}
          >
            {recurrenceLabel(task.recurrence)}
          </span>
          {task.reminder_at && (
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.62rem',
                fontWeight: 400,
                letterSpacing: '0.04em',
                color: 'var(--clay)',
              }}
            >
              ⏰ {new Date(task.reminder_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setMenuOpen((o) => !o)
        }}
        aria-label="Task menu"
        style={{
          width: '32px',
          height: '32px',
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--ink-muted)',
          fontSize: '1.1rem',
          lineHeight: 1,
          borderRadius: 'var(--radius-sm)',
        }}
      >
        ⋮
      </button>

      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: '4px',
            zIndex: 20,
            background: 'var(--surface-raised)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '160px',
            overflow: 'hidden',
          }}
        >
          {(['edit', 'priority', 'reminder', 'delete'] as TaskMenuAction[]).map((action) => (
            <button
              key={action}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                onAction(action)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: action !== 'delete' ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                color: action === 'delete' ? '#b8332e' : 'var(--ink)',
              }}
            >
              {action === 'edit' && 'Edit title'}
              {action === 'priority' && 'Change priority'}
              {action === 'reminder' && 'Set reminder'}
              {action === 'delete' && 'Delete'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface AddTaskFormProps {
  accent: string
  onCreate: (input: { title: string; priority: TaskPriority; recurrence: TaskRecurrence | null }) => void
}

function AddTaskForm({ accent, onCreate }: AddTaskFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const submit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    onCreate({ title: trimmed, priority, recurrence })
    setTitle('')
    setPriority('normal')
    setRecurrence(null)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minHeight: '44px',
          padding: '8px 12px',
          background: 'transparent',
          border: `1px dashed ${accent}`,
          borderRadius: 'var(--radius-sm)',
          color: accent,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          fontWeight: 400,
          letterSpacing: '0.04em',
          width: '100%',
        }}
      >
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
        <span>Add task</span>
      </button>
    )
  }

  return (
    <div
      style={{
        marginTop: '8px',
        padding: '12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') {
            setOpen(false)
            setTitle('')
          }
        }}
        placeholder="Task title"
        style={{
          width: '100%',
          minHeight: '44px',
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
          color: 'var(--ink)',
          background: 'var(--sand)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['critical', 'high', 'normal', 'low'] as TaskPriority[]).map((p) => {
          const meta = PRIORITY_META[p]
          const selected = priority === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              style={{
                minHeight: '36px',
                padding: '6px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: selected ? meta.color : 'var(--ink-muted)',
                background: selected ? meta.bg : 'transparent',
                border: `1px solid ${selected ? meta.border : 'var(--border)'}`,
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
              {meta.label}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {([
          ['One-off', null],
          ['Daily', 'daily'],
          ['Weekdays', 'weekdays'],
        ] as [string, TaskRecurrence | null][]).map(([label, val]) => {
          const selected = recurrence === val
          return (
            <button
              key={label}
              type="button"
              onClick={() => setRecurrence(val)}
              style={{
                minHeight: '36px',
                padding: '6px 12px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: selected ? 'var(--ink)' : 'var(--ink-muted)',
                background: selected ? 'var(--sand-deep)' : 'transparent',
                border: `1px solid ${selected ? 'var(--ink-faint)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setTitle('')
          }}
          style={{
            minHeight: '40px',
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!title.trim()}
          style={{
            minHeight: '40px',
            padding: '8px 18px',
            background: accent,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'white',
            cursor: title.trim() ? 'pointer' : 'not-allowed',
            opacity: title.trim() ? 1 : 0.5,
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

interface ProjectAccordionProps {
  project: Project
  tasks: Task[]
  accent: string
}

function ProjectAccordion({ project, tasks, accent }: ProjectAccordionProps) {
  const [open, setOpen] = useState(false)
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set())
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const fadeTimers = useRef<Map<string, number>>(new Map())

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  useEffect(() => {
    return () => {
      fadeTimers.current.forEach((t) => window.clearTimeout(t))
      fadeTimers.current.clear()
    }
  }, [])

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((t) => !hiddenIds.has(t.id))
      .filter((t) => t.status !== 'dropped')
      .sort((a, b) => {
        const aDone = a.status === 'completed' ? 1 : 0
        const bDone = b.status === 'completed' ? 1 : 0
        if (aDone !== bDone) return aDone - bDone
        const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        if (pr !== 0) return pr
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })
  }, [tasks, hiddenIds])

  const pendingCount = tasks.filter((t) => t.status !== 'completed' && t.status !== 'dropped').length

  const scheduleFade = (taskId: string) => {
    const timer = window.setTimeout(() => {
      setFadingIds((s) => {
        const next = new Set(s)
        next.add(taskId)
        return next
      })
      const hideTimer = window.setTimeout(() => {
        setHiddenIds((s) => {
          const next = new Set(s)
          next.add(taskId)
          return next
        })
        fadeTimers.current.delete(taskId)
      }, 450)
      fadeTimers.current.set(taskId + ':hide', hideTimer)
    }, 500)
    fadeTimers.current.set(taskId, timer)
  }

  const handleToggle = (task: Task) => {
    const willComplete = task.status !== 'completed'
    updateTask.mutate({
      id: task.id,
      status: willComplete ? 'completed' : 'pending',
      completed_at: willComplete ? new Date().toISOString() : null,
    })
    if (willComplete && task.recurrence === null) {
      scheduleFade(task.id)
    }
  }

  const handleAction = (task: Task, action: TaskMenuAction) => {
    if (action === 'edit') {
      const next = window.prompt('Edit task title', task.title)
      if (next !== null) {
        const trimmed = next.trim()
        if (trimmed && trimmed !== task.title) {
          updateTask.mutate({ id: task.id, title: trimmed })
        }
      }
    } else if (action === 'priority') {
      const next = window.prompt('Priority (critical / high / normal / low)', task.priority)
      if (next) {
        const t = next.trim().toLowerCase()
        if (t === 'critical' || t === 'high' || t === 'normal' || t === 'low') {
          updateTask.mutate({ id: task.id, priority: t })
        }
      }
    } else if (action === 'reminder') {
      const current = task.reminder_at ? new Date(task.reminder_at).toISOString().slice(0, 16) : ''
      const next = window.prompt('Reminder (YYYY-MM-DDTHH:mm, blank to clear)', current)
      if (next !== null) {
        const trimmed = next.trim()
        if (trimmed === '') {
          updateTask.mutate({ id: task.id, reminder_at: null })
        } else {
          const d = new Date(trimmed)
          if (!Number.isNaN(d.getTime())) {
            updateTask.mutate({ id: task.id, reminder_at: d.toISOString() })
          }
        }
      }
    } else if (action === 'delete') {
      if (window.confirm(`Delete task "${task.title}"?`)) {
        deleteTask.mutate(task.id)
      }
    }
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          minHeight: '52px',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 400,
              color: 'var(--ink)',
              letterSpacing: '0.02em',
            }}
          >
            {project.name}
          </span>
          {project.description && (
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                fontWeight: 300,
                color: 'var(--ink-muted)',
                lineHeight: 1.35,
              }}
            >
              {project.description}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: accent,
              background: `${accent}15`,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              minWidth: '24px',
              textAlign: 'center',
            }}
          >
            {pendingCount}
          </span>
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '4px 14px 14px' }}>
          {visibleTasks.length === 0 && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                color: 'var(--ink-muted)',
                fontStyle: 'italic',
                padding: '8px 4px',
              }}
            >
              No tasks yet.
            </p>
          )}
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              accent={accent}
              fading={fadingIds.has(task.id)}
              onToggle={() => handleToggle(task)}
              onAction={(action) => handleAction(task, action)}
            />
          ))}
          <AddTaskForm
            accent={accent}
            onCreate={({ title, priority, recurrence }) => {
              createTask.mutate({
                project_id: project.id,
                title,
                description: null,
                status: 'pending',
                priority,
                scheduled_date: null,
                completed_at: null,
                dropped_reason: null,
                recurrence,
                reminder_at: null,
                todo_id: null,
              })
            }}
          />
        </div>
      )}
    </div>
  )
}

interface CategorySectionProps {
  category: Category
  projects: Project[]
  tasksByProject: Map<string, Task[]>
  sectionRef?: (el: HTMLDivElement | null) => void
}

function CategorySection({ category, projects, tasksByProject, sectionRef }: CategorySectionProps) {
  const [open, setOpen] = useState(true)
  const meta = CATEGORY_META[category]

  const allTasks = projects.flatMap((p) => tasksByProject.get(p.id) ?? [])
  const totalActive = allTasks.filter((t) => t.status !== 'completed' && t.status !== 'dropped').length
  const urgent = allTasks.filter(
    (t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'completed' && t.status !== 'dropped',
  ).length

  return (
    <div
      ref={sectionRef}
      style={{
        background: meta.bg,
        borderLeft: `4px solid ${meta.accent}`,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          minHeight: '56px',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              fontWeight: 400,
              color: meta.accent,
              letterSpacing: '0.03em',
            }}
          >
            {meta.label}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.7rem',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
            }}
          >
            {meta.subtitle}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {urgent > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#b8332e',
                background: 'rgba(200,60,55,0.12)',
                border: '1px solid rgba(200,60,55,0.25)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {urgent} urgent
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              fontWeight: 500,
              color: meta.accent,
              background: 'rgba(255,255,255,0.55)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {totalActive}
          </span>
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '4px 12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {projects.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                color: 'var(--ink-muted)',
                fontStyle: 'italic',
                padding: '8px 4px',
              }}
            >
              No projects in this section.
            </p>
          ) : (
            projects.map((p) => (
              <ProjectAccordion
                key={p.id}
                project={p}
                tasks={tasksByProject.get(p.id) ?? []}
                accent={meta.accent}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Projects() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: tasksData = [], isLoading: loadingTasks } = useAllTasksWithProjects()

  const sectionRefs = useRef<Map<Category, HTMLDivElement | null>>(new Map())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace('#', '').toUpperCase()
    if (hash === 'FOUNDATION' || hash === 'LEVERAGE' || hash === 'EXPRESSION') {
      const el = sectionRefs.current.get(hash as Category)
      if (el) {
        window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    }
  }, [projects.length])

  const tasksByProject = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasksData.forEach((t) => {
      if (!t.project_id) return
      const arr = map.get(t.project_id) ?? []
      arr.push(t)
      map.set(t.project_id, arr)
    })
    return map
  }, [tasksData])

  const projectsByCategory = useMemo(() => {
    const map = new Map<Category, Project[]>()
    CATEGORY_ORDER.forEach((c) => map.set(c, []))
    projects.forEach((p) => {
      const arr = map.get(p.category) ?? []
      arr.push(p)
      map.set(p.category, arr)
    })
    map.forEach((list) => list.sort((a, b) => a.priority - b.priority))
    return map
  }, [projects])

  return (
    <div
      className="animate-in"
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '24px 16px 96px',
      }}
    >
      <div style={{ marginBottom: '20px', padding: '0 4px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.6rem',
            color: 'var(--ink)',
            letterSpacing: '0.04em',
            marginBottom: '2px',
          }}
        >
          Projects
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.78rem',
            color: 'var(--ink-muted)',
            letterSpacing: '0.04em',
          }}
        >
          Foundation · Leverage · Expression
        </p>
      </div>

      {loadingProjects || loadingTasks ? (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            fontStyle: 'italic',
            padding: '12px 4px',
          }}
        >
          Loading…
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {CATEGORY_ORDER.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              projects={projectsByCategory.get(cat) ?? []}
              tasksByProject={tasksByProject}
              sectionRef={(el) => {
                sectionRefs.current.set(cat, el)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
