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
    <div className="space-y-10">
      {CATEGORIES.map(category => {
        const categoryProjects = projects.filter(p => p.category === category)
        return (
          <div key={category}>
            <div className="flex items-center gap-3 mb-5">
              <span className={cn('text-xs font-medium uppercase tracking-widest px-3 py-1.5 rounded-lg', categoryBadge(category))}>
                {categoryLabel[category]}
              </span>
              <span className="text-[#8a7f6d] text-xs tracking-wide">{categoryProjects.length} projects</span>
            </div>

            {categoryProjects.length === 0 ? (
              <p className="text-[#8a7f6d] text-sm pl-2">No projects</p>
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
                    <div
                      key={project.id}
                      className="bg-[rgba(240,236,228,0.9)] border border-[rgba(139,127,109,0.15)] rounded-2xl overflow-hidden"
                    >
                      {/* Project header */}
                      <div
                        className="flex items-center gap-4 p-6 cursor-pointer hover:bg-[rgba(139,127,109,0.04)] transition-colors"
                        onClick={() => toggle(project.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1">
                            <h3 className="text-[#2b2b2b] text-base font-light tracking-wide">{project.name}</h3>
                            <span className={cn('text-xs px-2 py-0.5 rounded-lg', statusBadge(project.status))}>
                              {project.status}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-[#8a7f6d] text-sm truncate leading-relaxed">{project.description}</p>
                          )}
                          <p className="text-[#8a7f6d] text-xs mt-1.5 tracking-wide">
                            {completedTasks.length}/{activeTasks.length} tasks complete
                          </p>
                        </div>
                        <CompletionRing percent={percent} color={accent} size={44} />
                        <Link
                          to={`/projects/${project.id}`}
                          onClick={e => e.stopPropagation()}
                          className="text-[#8a7f6d] hover:text-[#4a6b8a] text-xs px-3 py-1.5 rounded-lg hover:bg-[rgba(74,107,138,0.08)] transition-colors tracking-wide"
                        >
                          Detail →
                        </Link>
                        <span className="text-[#8a7f6d] text-xs">{isOpen ? '▲' : '▼'}</span>
                      </div>

                      {/* Expanded task list */}
                      {isOpen && (
                        <div className="border-t border-[rgba(139,127,109,0.12)] px-6 pb-6 pt-5">
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
