import { Link } from 'react-router-dom'
import CompletionRing from './CompletionRing'
import { categoryAccent, statusBadge, cn } from '../../lib/utils'
import type { Project, Task } from '../../lib/supabase'

interface ProjectCardProps {
  project: Project
  tasks: Task[]
  isPrimary?: boolean
  isSecondary?: boolean
}

export default function ProjectCard({ project, tasks, isPrimary, isSecondary }: ProjectCardProps) {
  const activeTasks = tasks.filter(t => t.status !== 'dropped')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const percent = activeTasks.length > 0 ? (completedTasks.length / activeTasks.length) * 100 : 0
  const accent = categoryAccent(project.category)

  return (
    <Link
      to={`/projects/${project.id}`}
      className={cn(
        'block rounded-lg border p-4 transition-all hover:border-white/20',
        isPrimary
          ? 'border-[#4ade80]/40 bg-[#4ade80]/5'
          : isSecondary
          ? 'border-[#2a2d3a] bg-[#1a1d27] opacity-80'
          : 'border-[#2a2d3a] bg-[#1a1d27]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isPrimary && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              <span className="text-[#4ade80] text-xs font-medium">Primary this week</span>
            </div>
          )}
          <h3 className="text-[#f1f5f9] text-sm font-medium leading-tight truncate">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', statusBadge(project.status))}>
              {project.status}
            </span>
            <span className="text-[#64748b] text-xs">
              {completedTasks.length}/{activeTasks.length} tasks
            </span>
          </div>
        </div>
        <CompletionRing percent={percent} color={accent} size={46} />
      </div>
    </Link>
  )
}
