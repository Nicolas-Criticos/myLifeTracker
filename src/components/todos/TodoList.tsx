import { useState } from 'react'
import { format, parseISO, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useProjects, useFarmTasks, useUpdateFarmTask, useDeleteFarmTask } from '../../lib/queries'
import { nowInSAST } from '../../lib/utils'
import type { Task, TaskStatus, TaskPriority } from '../../lib/supabase'

// ── Styles ────────────────────────────────────────────────────────────────────

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 300,
}


const INPUT: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.82rem',
  fontWeight: 300,
  color: 'var(--ink)',
  padding: '10px 14px',
  border: '1px solid rgba(107, 124, 92, 0.2)',
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

// ── Unified Task type ─────────────────────────────────────────────────────────

interface UnifiedTask {
  id: string
  title: string
  status: string
  priority: string
  scheduled_date: string | null
  completed_at: string | null
  source: 'personal' | 'farm'
  projectName?: string
  originalTask: any
}

// ── Quick Add ─────────────────────────────────────────────────────────────────

function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      gap: '10px',
      marginBottom: '28px',
    }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="What needs to happen?"
        style={{
          ...INPUT,
          flex: 1,
        }}
      />
      <button
        type="submit"
        disabled={!value.trim()}
        style={{
          padding: '10px 20px',
          borderRadius: '10px',
          border: 'none',
          background: value.trim() ? 'var(--olive)' : 'rgba(44, 42, 37, 0.08)',
          color: value.trim() ? 'white' : 'var(--ink-muted)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.72rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: value.trim() ? 'pointer' : 'default',
          transition: 'all 200ms ease',
          flexShrink: 0,
        }}
      >
        Add
      </button>
    </form>
  )
}

// ── Task Item ─────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle, onDelete, onUpdate, readOnly }: {
  task: UnifiedTask
  onToggle: () => void
  onDelete: () => void
  onUpdate: (updates: Partial<Task>) => void
  readOnly?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDate, setEditDate] = useState(task.scheduled_date || '')
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority as TaskPriority)

  const isDone = task.status === 'completed'
  const isDropped = task.status === 'dropped'
  const isOverdue = task.scheduled_date && !isDone && !isDropped && isPast(parseISO(task.scheduled_date)) && !isToday(parseISO(task.scheduled_date))

  const saveEdit = () => {
    onUpdate({
      title: editTitle,
      scheduled_date: editDate || null,
      priority: editPriority,
    })
    setEditing(false)
  }

  const dateLabel = task.scheduled_date
    ? isToday(parseISO(task.scheduled_date))
      ? 'Today'
      : isTomorrow(parseISO(task.scheduled_date))
        ? 'Tomorrow'
        : format(parseISO(task.scheduled_date), 'EEE, MMM d')
    : null

  if (editing) {
    return (
      <div style={{
        padding: '14px 16px',
        background: 'rgba(107, 124, 92, 0.04)',
        border: '1px solid rgba(107, 124, 92, 0.12)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <input
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          style={INPUT}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="date"
            value={editDate}
            onChange={e => setEditDate(e.target.value)}
            style={{ ...INPUT, flex: 1 }}
          />
          <select
            value={editPriority}
            onChange={e => setEditPriority(e.target.value as TaskPriority)}
            style={{ ...INPUT, flex: 1, appearance: 'none' as const, cursor: 'pointer' }}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={{
            background: 'none', border: '1px solid rgba(44,42,37,0.12)', borderRadius: '8px',
            padding: '5px 14px', fontSize: '0.68rem', cursor: 'pointer', color: 'var(--ink-muted)',
          }}>Cancel</button>
          <button onClick={saveEdit} style={{
            background: 'var(--olive)', color: 'white', border: 'none', borderRadius: '8px',
            padding: '5px 14px', fontSize: '0.68rem', cursor: 'pointer',
          }}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      background: isDone ? 'rgba(107, 124, 92, 0.04)' : isOverdue ? 'rgba(160, 80, 80, 0.04)' : 'rgba(44, 42, 37, 0.02)',
      border: `1px solid ${isDone ? 'rgba(107, 124, 92, 0.08)' : isOverdue ? 'rgba(160, 80, 80, 0.08)' : 'rgba(44, 42, 37, 0.04)'}`,
      transition: 'all 200ms ease',
    }}>
      {/* Checkbox */}
      <button
        onClick={readOnly ? undefined : onToggle}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '6px',
          border: `2px solid ${isDone ? 'var(--olive)' : readOnly ? 'rgba(44, 42, 37, 0.12)' : 'rgba(44, 42, 37, 0.2)'}`,
          background: isDone ? 'var(--olive)' : 'transparent',
          cursor: readOnly ? 'default' : 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 200ms ease',
          opacity: readOnly ? 0.5 : 1,
        }}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal,
        flexShrink: 0,
      }} />

      {/* Content */}
      <div
        style={{ flex: 1, cursor: readOnly ? 'default' : 'pointer' }}
        onClick={readOnly ? undefined : () => setEditing(true)}
      >
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          fontWeight: isDone ? 300 : 400,
          color: isDone ? 'var(--ink-muted)' : 'var(--ink)',
          textDecoration: isDone ? 'line-through' : 'none',
          margin: 0,
          lineHeight: 1.4,
        }}>
          {task.title}
        </p>
        {dateLabel && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            fontWeight: 300,
            color: isOverdue ? '#a05050' : 'var(--ink-muted)',
            margin: '2px 0 0',
          }}>
            {isOverdue ? '⚠ ' : ''}{dateLabel}
          </p>
        )}
        {task.source === 'farm' && task.projectName && (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.58rem',
            fontWeight: 400,
            letterSpacing: '0.06em',
            color: 'var(--clay)',
            background: 'rgba(195, 162, 97, 0.1)',
            padding: '1px 7px',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            marginTop: '2px',
          }}>
            🌿 {task.projectName}
          </span>
        )}
      </div>

      {/* Delete — hidden for read-only farm tasks */}
      {!readOnly && (
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: 'var(--ink-muted)',
            opacity: 0.4,
            padding: '4px',
            transition: 'opacity 200ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

type Filter = 'all' | 'today' | 'week' | 'done'

// ── Main Component ────────────────────────────────────────────────────────────

export default function TodoList() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: farmTasks = [] } = useFarmTasks()
  useProjects()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const updateFarmTask = useUpdateFarmTask()
  const deleteFarmTask = useDeleteFarmTask()
  const [filter, setFilter] = useState<Filter>('all')
  const now = nowInSAST()
  const todayStr = format(now, 'yyyy-MM-dd')

  const handleAdd = (title: string) => {
    createTask.mutate({
      title,
      description: null,
      status: 'pending' as TaskStatus,
      priority: 'normal' as TaskPriority,
      scheduled_date: todayStr,
      completed_at: null,
      dropped_reason: null,
      project_id: null,
      recurrence: null,
    })
  }

  const handleToggle = (task: Task) => {
    if (task.status === 'completed') {
      updateTask.mutate({ id: task.id, status: 'pending' as TaskStatus, completed_at: null })
    } else {
      updateTask.mutate({ id: task.id, status: 'completed' as TaskStatus, completed_at: new Date().toISOString() })
    }
  }

  const handleDelete = (id: string) => {
    deleteTask.mutate(id)
  }

  const handleUpdate = (id: string, updates: Partial<Task>) => {
    updateTask.mutate({ id, ...updates })
  }

  // Normalize personal tasks
  const personalItems: UnifiedTask[] = tasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    scheduled_date: t.scheduled_date,
    completed_at: t.completed_at,
    source: 'personal' as const,
    originalTask: t,
  }))

  // Normalize farm tasks
  const farmItems: UnifiedTask[] = farmTasks
    .map(t => ({
      id: `farm-${t.id}`,
      title: t.name,
      status: t.status === 'Completed' ? 'completed' : t.status === 'Running' ? 'in_progress' : 'pending',
      priority: 'normal',
      scheduled_date: t.start_date || null,
      completed_at: null,
      source: 'farm' as const,
      projectName: t.projects?.title || 'Farm',
      originalTask: t,
    }))

  // Sort helper
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 }
  const sortItems = (items: UnifiedTask[]) => [...items].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    const pa = priorityOrder[a.priority] ?? 2
    const pb = priorityOrder[b.priority] ?? 2
    if (pa !== pb) return pa - pb
    const da = a.scheduled_date || '9999'
    const db = b.scheduled_date || '9999'
    return da.localeCompare(db)
  })

  // Personal — exclude recurring, filter by tab
  const activePersonal = personalItems.filter(t =>
    t.status !== 'dropped' && !(t.originalTask as Task).recurrence
  )
  const filteredPersonal = activePersonal.filter(t => {
    if (filter === 'done') return t.status === 'completed'
    if (filter === 'today') return t.scheduled_date === todayStr && t.status !== 'completed'
    if (filter === 'week') return t.scheduled_date != null && isThisWeek(parseISO(t.scheduled_date), { weekStartsOn: 1 }) && t.status !== 'completed'
    return true
  })
  const sortedPersonal = sortItems(filteredPersonal)

  // Farm — apply same tab filter, group by project name
  const activeFarm = farmItems.filter(t => t.status !== 'dropped')
  const filteredFarm = activeFarm.filter(t => {
    if (filter === 'done') return t.status === 'completed'
    if (filter === 'today') return t.scheduled_date === todayStr && t.status !== 'completed'
    if (filter === 'week') return t.scheduled_date != null && isThisWeek(parseISO(t.scheduled_date), { weekStartsOn: 1 }) && t.status !== 'completed'
    // 'all' — show pending only (completed drop off)
    return t.status !== 'completed'
  })
  const farmByProject: Record<string, UnifiedTask[]> = {}
  filteredFarm.forEach(t => {
    const key = t.projectName || 'Farm'
    if (!farmByProject[key]) farmByProject[key] = []
    farmByProject[key].push(t)
  })

  const pendingCount = activePersonal.filter(t => t.status !== 'completed').length
  const todayCount = activePersonal.filter(t => t.scheduled_date === todayStr && t.status !== 'completed').length
  const doneCount = activePersonal.filter(t => t.status === 'completed').length

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: pendingCount },
    { key: 'today', label: 'Today', count: todayCount },
    { key: 'week', label: 'This Week', count: activePersonal.filter(t => t.scheduled_date != null && isThisWeek(parseISO(t.scheduled_date), { weekStartsOn: 1 }) && t.status !== 'completed').length },
    { key: 'done', label: 'Done', count: doneCount },
  ]

  const SECTION_LABEL: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '0.62rem',
    fontWeight: 400,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ink-muted)',
    marginBottom: '14px',
  }

  if (isLoading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ ...DISPLAY, fontSize: '1.1rem', color: 'var(--ink-muted)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div>

      {/* Quick add — full width above both columns */}
      <QuickAdd onAdd={handleAdd} />

      {/* Filter tabs — full width */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '28px',
        padding: '3px',
        background: 'rgba(107, 124, 92, 0.04)',
        borderRadius: 'var(--radius-sm)',
      }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'calc(var(--radius-sm) - 3px)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.65rem',
              fontWeight: filter === f.key ? 500 : 300,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: filter === f.key ? 'var(--olive)' : 'var(--ink-muted)',
              background: filter === f.key ? 'rgba(255, 252, 245, 0.9)' : 'transparent',
              boxShadow: filter === f.key ? '0 1px 4px rgba(107, 124, 92, 0.08)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span style={{ marginLeft: '6px', fontSize: '0.58rem', opacity: 0.6 }}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

      {/* ── Left: Personal ── */}
      <div>
        <p style={{ ...SECTION_LABEL, color: 'var(--foundation)', borderLeft: '3px solid #5c7a5c', paddingLeft: '10px' }}>Personal</p>

        {/* Personal task list */}
        {sortedPersonal.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ ...DISPLAY, fontSize: '1rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
              {filter === 'done' ? 'Nothing done yet.' : 'Clear. Good.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sortedPersonal.map(item => (
              <TaskItem
                key={item.id}
                task={item}
                onToggle={() => handleToggle(item.originalTask)}
                onDelete={() => handleDelete(item.originalTask.id)}
                onUpdate={(updates) => handleUpdate(item.originalTask.id, updates)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Farm ── */}
      <div>
        <p style={{ ...SECTION_LABEL, color: 'var(--clay)', borderLeft: '3px solid var(--clay)', paddingLeft: '10px' }}>Farm</p>

        {Object.keys(farmByProject).length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ ...DISPLAY, fontSize: '1rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>No farm tasks pending.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(farmByProject).map(([projectName, items]) => (
              <div key={projectName}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.68rem',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  color: 'var(--clay)',
                  marginBottom: '8px',
                }}>🌿 {projectName}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sortItems(items).map(item => (
                    <TaskItem
                      key={item.id}
                      task={item}
                      onToggle={() => {
                        const orig = item.originalTask
                        const newStatus = orig.status === 'Completed' ? 'Pending' : 'Completed'
                        updateFarmTask.mutate({ id: orig.id, status: newStatus })
                      }}
                      onDelete={() => deleteFarmTask.mutate(item.originalTask.id)}
                      onUpdate={() => {}}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div> {/* end two-column grid */}
    </div>
  )
}
