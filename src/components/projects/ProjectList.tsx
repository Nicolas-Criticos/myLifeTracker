import { useState } from 'react'
import { Link } from 'react-router-dom'
import TaskList from './TaskList'
import { categoryAccent } from '../../lib/utils'
import type { Category, Project, Task } from '../../lib/supabase'

interface ProjectListProps {
  projects: Project[]
  tasks: Task[]
}

const CATEGORIES: Category[] = ['FOUNDATION', 'LEVERAGE', 'EXPRESSION']

const categoryConfig: Record<Category, { label: string; color: string; dot: string }> = {
  FOUNDATION: { label: 'Foundation', color: 'var(--foundation)', dot: '#5c7a5c' },
  LEVERAGE:   { label: 'Leverage',   color: 'var(--leverage)',   dot: '#4a6b8a' },
  EXPRESSION: { label: 'Expression', color: 'var(--expression)', dot: '#8a6a3a' },
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
