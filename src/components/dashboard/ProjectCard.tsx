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
        'block rounded-xl border p-4 transition-all duration-200 hover:shadow-sm',
        isPrimary
          ? 'border-[rgba(92,122,92,0.35)] bg-[rgba(92,122,92,0.06)]'
          : isSecondary
          ? 'border-[rgba(139,127,109,0.15)] bg-[rgba(240,236,228,0.6)] opacity-80'
          : 'border-[rgba(139,127,109,0.15)] bg-[rgba(240,236,228,0.6)]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isPrimary && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--foundation)]" />
              <span className="text-[var(--foundation)] text-xs font-medium tracking-wide">Primary this week</span>
            </div>
          )}
          <h3 className="text-[#2b2b2b] text-sm font-medium leading-tight truncate">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', statusBadge(project.status))}>
              {project.status}
            </span>
            <span className="text-[#8a7f6d] text-xs">
              {completedTasks.length}/{activeTasks.length} tasks
            </span>
          </div>
        </div>
        <CompletionRing percent={percent} color={accent} size={46} />
      </div>
    </Link>
  )
}
