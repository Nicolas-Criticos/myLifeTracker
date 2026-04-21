import ProjectCard from './ProjectCard'
import { categoryBadge, cn } from '../../lib/utils'
import type { Category, Project, Task } from '../../lib/supabase'

interface CategorySectionProps {
  category: Category
  projects: Project[]
  tasks: Task[]
  primaryProjectId?: string | null
  secondaryProjectIds?: string[] | null
}

const categoryLabel: Record<Category, string> = {
  FOUNDATION: 'Foundation',
  LEVERAGE: 'Leverage',
  EXPRESSION: 'Expression',
}

export default function CategorySection({
  category,
  projects,
  tasks,
  primaryProjectId,
  secondaryProjectIds,
}: CategorySectionProps) {
  const cats = projects.filter(p => p.category === category)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-semibold uppercase tracking-widest px-2 py-1 rounded', categoryBadge(category))}>
          {categoryLabel[category]}
        </span>
      </div>
      <div className="space-y-2">
        {cats.length === 0 ? (
          <p className="text-[#64748b] text-sm">No projects</p>
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
