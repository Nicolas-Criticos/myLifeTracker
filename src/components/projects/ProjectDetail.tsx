import { Link } from 'react-router-dom'
import TaskList from './TaskList'
import CompletionRing from '../dashboard/CompletionRing'
import { categoryAccent, categoryBadge, statusBadge, cn } from '../../lib/utils'
import { useUpdateProject } from '../../lib/queries'
import type { Project, Task, ProjectStatus } from '../../lib/supabase'

interface ProjectDetailProps {
  project: Project
  tasks: Task[]
}

export default function ProjectDetail({ project, tasks }: ProjectDetailProps) {
  const updateProject = useUpdateProject()
  const activeTasks = tasks.filter(t => t.status !== 'dropped')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const percent = activeTasks.length > 0 ? (completedTasks.length / activeTasks.length) * 100 : 0
  const accent = categoryAccent(project.category)

  function handleStatusChange(status: ProjectStatus) {
    updateProject.mutate({ id: project.id, status })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link to="/projects" className="text-[#64748b] text-sm hover:text-[#f1f5f9] transition-colors">
              Projects
            </Link>
            <span className="text-[#2a2d3a]">/</span>
            <span className={cn('text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded', categoryBadge(project.category))}>
              {project.category}
            </span>
          </div>
          <h2 className="text-[#f1f5f9] text-xl font-semibold">{project.name}</h2>
          {project.description && (
            <p className="text-[#64748b] text-sm mt-1">{project.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <select
              value={project.status}
              onChange={e => handleStatusChange(e.target.value as ProjectStatus)}
              className={cn(
                'text-xs px-2 py-1 rounded border-0 cursor-pointer focus:outline-none',
                statusBadge(project.status),
                'bg-transparent'
              )}
            >
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
            </select>
          </div>
        </div>
        <CompletionRing percent={percent} color={accent} size={64} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Tasks', value: tasks.length },
          { label: 'Completed', value: completedTasks.length },
          { label: 'Pending', value: tasks.filter(t => t.status === 'pending').length },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-3 text-center">
            <p className="text-[#64748b] text-xs">{s.label}</p>
            <p className="text-[#f1f5f9] text-xl font-semibold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
        <h3 className="text-[#f1f5f9] text-sm font-medium mb-4">Tasks</h3>
        <TaskList projectId={project.id} tasks={tasks} />
      </div>
    </div>
  )
}
