import { Link } from 'react-router-dom'
import CompletionRing from './CompletionRing'
import { categoryAccent } from '../../lib/utils'
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minHeight: '80px',
        background: isPrimary ? 'rgba(107,124,92,0.06)' : 'var(--surface)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: isPrimary ? '1px solid rgba(107,124,92,0.2)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '16px 20px',
        textDecoration: 'none',
        transition: 'box-shadow 200ms var(--ease-breath), transform 200ms var(--ease-breath)',
        boxShadow: 'var(--shadow-sm)',
        opacity: isSecondary && !isPrimary ? 0.78 : 1,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.boxShadow = 'var(--shadow-md)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.boxShadow = 'var(--shadow-sm)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {isPrimary && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--foundation)', flexShrink: 0 }} />
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.62rem',
              fontWeight: 400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--foundation)',
            }}>
              Primary this week
            </span>
          </div>
        )}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          fontWeight: 400,
          color: 'var(--ink)',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {project.name}
        </h3>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          marginTop: '3px',
        }}>
          {completedTasks.length}/{activeTasks.length} tasks
        </p>
      </div>
      <CompletionRing percent={percent} color={accent} size={44} />
    </Link>
  )
}
