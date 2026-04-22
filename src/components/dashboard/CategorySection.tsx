import ProjectCard from './ProjectCard'
import type { Category, Project, Task } from '../../lib/supabase'

interface CategorySectionProps {
  category: Category
  projects: Project[]
  tasks: Task[]
  primaryProjectId?: string | null
  secondaryProjectIds?: string[] | null
}

const categoryConfig: Record<Category, { label: string; color: string; dot: string }> = {
  FOUNDATION: { label: 'Foundation', color: 'var(--foundation)', dot: '#5c7a5c' },
  LEVERAGE:   { label: 'Leverage',   color: 'var(--leverage)',   dot: '#4a6b8a' },
  EXPRESSION: { label: 'Expression', color: 'var(--expression)', dot: '#8a6a3a' },
}

export default function CategorySection({
  category,
  projects,
  tasks,
  primaryProjectId,
  secondaryProjectIds,
}: CategorySectionProps) {
  const cats = projects.filter(p => p.category === category)
  const { label, color, dot } = categoryConfig[category]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.65rem',
          fontWeight: 400,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color,
        }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {cats.length === 0 ? (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.875rem',
            color: 'var(--ink-muted)',
            padding: '12px 0',
            fontStyle: 'italic',
          }}>
            No projects yet.
          </p>
        ) : (
          cats.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={tasks.filter(t => t.project_id === project.id)}
              isPrimary={project.id === primaryProjectId}
              isSecondary={secondaryProjectIds?.includes(project.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
