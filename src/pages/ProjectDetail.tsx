import { useParams, Navigate, Link } from 'react-router-dom'
import ProjectDetailComponent from '../components/projects/ProjectDetail'
import { useProject, useTasks } from '../lib/queries'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading: loadingProject, error } = useProject(id!)
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(id)

  if (!id) return <Navigate to="/projects" />

  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 40px 80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/projects"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            textDecoration: 'none',
            letterSpacing: '0.05em',
            transition: 'color 200ms',
          }}
        >
          ← Projects
        </Link>
      </div>
      {loadingProject || loadingTasks ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          fontSize: '1.1rem',
          letterSpacing: '0.05em',
        }}>
          Loading…
        </div>
      ) : error || !project ? (
        <p style={{ color: 'var(--clay)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
          Project not found.
        </p>
      ) : (
        <ProjectDetailComponent project={project} tasks={tasks} />
      )}
    </div>
  )
}
