import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useUpdateTask } from '../../lib/queries'
import { statusBadge, priorityBadge, cn } from '../../lib/utils'
import type { Task } from '../../lib/supabase'

interface TaskItemProps {
  task: Task
  draggable?: boolean
}

export default function TaskItem({ task, draggable = false }: TaskItemProps) {
  const [dropReason, setDropReason] = useState('')
  const [showDropInput, setShowDropInput] = useState(false)
  const updateTask = useUpdateTask()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleComplete() {
    updateTask.mutate({ id: task.id, status: 'completed', completed_at: new Date().toISOString() })
  }

  function handleDrop() {
    if (!dropReason.trim()) return
    updateTask.mutate({ id: task.id, status: 'dropped', dropped_reason: dropReason })
    setShowDropInput(false)
    setDropReason('')
  }

  function handleReschedule() {
    const date = prompt('Reschedule to date (YYYY-MM-DD):')
    if (date) {
      updateTask.mutate({ id: task.id, status: 'rescheduled', scheduled_date: date })
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-3',
        isDragging && 'opacity-50',
        task.status === 'completed' && 'opacity-60',
        task.status === 'dropped' && 'opacity-40'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            className="text-[#64748b] hover:text-[#f1f5f9] cursor-grab active:cursor-grabbing mt-0.5 shrink-0"
          >
            ⠿
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={task.status !== 'completed' ? handleComplete : undefined}
          className={cn(
            'w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-colors',
            task.status === 'completed'
              ? 'bg-[#4ade80] border-[#4ade80]'
              : 'border-[#2a2d3a] hover:border-[#4ade80]'
          )}
          disabled={task.status === 'completed'}
        >
          {task.status === 'completed' && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l2.5 2.5L9 1" stroke="#0f1117" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm',
            task.status === 'completed' ? 'text-[#64748b] line-through' : 'text-[#f1f5f9]'
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-[#64748b] text-xs mt-0.5 truncate">{task.description}</p>
          )}
          {task.dropped_reason && (
            <p className="text-red-400/70 text-xs mt-0.5">Dropped: {task.dropped_reason}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', statusBadge(task.status))}>
              {task.status}
            </span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', priorityBadge(task.priority))}>
              {task.priority}
            </span>
            {task.scheduled_date && (
              <span className="text-[#64748b] text-xs">{task.scheduled_date}</span>
            )}
            {task.recurrence && (
              <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-500/10 text-blue-400">
                ↻ {task.recurrence === 'daily' ? 'Daily' : 'Weekdays'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {task.status === 'pending' || task.status === 'in_progress' ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleReschedule}
              className="text-[#64748b] hover:text-[#60a5fa] text-xs px-1.5 py-1 rounded hover:bg-[#60a5fa]/10 transition-colors"
              title="Reschedule"
            >
              ↷
            </button>
            <button
              onClick={() => setShowDropInput(!showDropInput)}
              className="text-[#64748b] hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-red-400/10 transition-colors"
              title="Drop"
            >
              ✕
            </button>
          </div>
        ) : null}
      </div>

      {/* Drop reason input */}
      {showDropInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={dropReason}
            onChange={e => setDropReason(e.target.value)}
            placeholder="Reason for dropping…"
            className="flex-1 bg-[#1a1d27] border border-[#2a2d3a] rounded px-2 py-1 text-xs text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:border-red-400/50"
            onKeyDown={e => e.key === 'Enter' && handleDrop()}
            autoFocus
          />
          <button
            onClick={handleDrop}
            disabled={!dropReason.trim()}
            className="text-xs bg-red-400/20 text-red-400 px-2 py-1 rounded hover:bg-red-400/30 transition-colors disabled:opacity-50"
          >
            Drop
          </button>
        </div>
      )}
    </div>
  )
}
