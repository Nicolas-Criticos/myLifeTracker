import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import TaskItem from './TaskItem'
import { useCreateTask } from '../../lib/queries'
import type { Task, TaskStatus, TaskPriority } from '../../lib/supabase'
import { cn } from '../../lib/utils'

interface TaskListProps {
  projectId: string
  tasks: Task[]
}

const STATUS_FILTERS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Dropped', value: 'dropped' },
]

export default function TaskList({ projectId, tasks }: TaskListProps) {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('normal')
  const createTask = useCreateTask()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter)

  function handleDragEnd(_event: DragEndEvent) {
    // Visual reorder only — no server-side ordering for now
  }

  async function handleAdd() {
    if (!newTitle.trim()) return
    await createTask.mutateAsync({
      project_id: projectId,
      title: newTitle.trim(),
      description: null,
      status: 'pending',
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

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'text-xs px-2 py-1 rounded transition-colors',
                filter === f.value
                  ? 'bg-[#4ade80]/20 text-[#4ade80]'
                  : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-white/5'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs bg-[#4ade80]/10 text-[#4ade80] px-3 py-1.5 rounded hover:bg-[#4ade80]/20 transition-colors border border-[#4ade80]/20"
        >
          + Add task
        </button>
      </div>

      {/* Add task form */}
      {showAdd && (
        <div className="mb-3 bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-3 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Task title…"
            className="w-full bg-transparent border border-[#2a2d3a] rounded px-3 py-1.5 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-[#4ade80]/50"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <div className="flex items-center gap-2">
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as TaskPriority)}
              className="bg-[#1a1d27] border border-[#2a2d3a] rounded px-2 py-1 text-xs text-[#f1f5f9] focus:outline-none"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim() || createTask.isPending}
              className="text-xs bg-[#4ade80]/20 text-[#4ade80] px-3 py-1 rounded hover:bg-[#4ade80]/30 transition-colors disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-xs text-[#64748b] hover:text-[#f1f5f9] px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <p className="text-[#64748b] text-sm py-4 text-center">
          {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filtered.map(task => (
                <TaskItem key={task.id} task={task} draggable />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
