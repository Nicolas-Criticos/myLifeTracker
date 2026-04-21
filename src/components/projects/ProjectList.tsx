import { useState } from 'react'
import { Link } from 'react-router-dom'
import TaskList from './TaskList'
import CompletionRing from '../dashboard/CompletionRing'
import { categoryAccent, categoryBadge, statusBadge, cn } from '../../lib/utils'
import type { Category, Project, Task } from '../../lib/supabase'

interface ProjectListProps {
  projects: Project[]
  tasks: Task[]
}

const CATEGORIES: Category[] = ['FOUNDATION', 'LEVERAGE', 'EXPRESSION']

const categoryLabel: Record<Category, string> = {
  FOUNDATION: 'Foundation',
  LEVERAGE: 'Leverage',
  EXPRESSION: 'Expression',
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
    <div className="space-y-8">
      {CATEGORIES.map(category => {
        const categoryProjects = projects.filter(p => p.category === category)
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded', categoryBadge(category))}>
                {categoryLabel[category]}
              </span>
              <span className="text-[#64748b] text-xs">{categoryProjects.length} projects</span>
            </div>

            {categoryProjects.length === 0 ? (
              <p className="text-[#64748b] text-sm pl-4">No projects</p>
            ) : (
              <div className="space-y-3">
                {categoryProjects.map(project => {
                  const projectTasks = tasks.filter(t => t.project_id === project.id)
                  const activeTasks = projectTasks.filter(t => t.status !== 'dropped')
                  const completedTasks = projectTasks.filter(t => t.status === 'completed')
                  const percent = activeTasks.length > 0
                    ? (completedTasks.length / activeTasks.length) * 100
                    : 0
                  const accent = categoryAccent(category)
                  const isOpen = expanded.has(project.id)

                  return (
                    <div key={project.id} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg overflow-hidden">
                      {/* Project header */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors"
                        onClick={() => toggle(project.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[#f1f5f9] text-sm font-medium">{project.name}</h3>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', statusBadge(project.status))}>
                              {project.status}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-[#64748b] text-xs mt-0.5 truncate">{project.description}</p>
                          )}
                          <p className="text-[#64748b] text-xs mt-1">
                            {completedTasks.length}/{activeTasks.length} tasks complete
                          </p>
                        </div>
                        <CompletionRing percent={percent} color={accent} size={44} />
                        <Link
                          to={`/projects/${project.id}`}
                          onClick={e => e.stopPropagation()}
                          className="text-[#64748b] hover:text-[#60a5fa] text-xs px-2 py-1 rounded hover:bg-[#60a5fa]/10 transition-colors"
                        >
                          Detail →
                        </Link>
                        <span className="text-[#64748b] text-xs">{isOpen ? '▲' : '▼'}</span>
                      </div>

                      {/* Expanded task list */}
                      {isOpen && (
                        <div className="border-t border-[#2a2d3a] p-4">
                          <TaskList projectId={project.id} tasks={projectTasks} />
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
