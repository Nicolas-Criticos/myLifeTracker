import { useParams, Navigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import ProjectDetailComponent from '../components/projects/ProjectDetail'
import { useProject, useTasks } from '../lib/queries'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading: loadingProject, error } = useProject(id!)
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(id)

  if (!id) return <Navigate to="/projects" />

  return (
    <div className="flex flex-col h-full">
      <TopBar title={project?.name ?? 'Project'} />
      <main className="flex-1 overflow-y-auto p-6">
        {loadingProject || loadingTasks ? (
          <div className="flex items-center justify-center h-64 text-[#64748b]">Loading…</div>
        ) : error || !project ? (
          <div className="text-red-400 text-sm">Project not found.</div>
        ) : (
          <ProjectDetailComponent project={project} tasks={tasks} />
        )}
      </main>
    </div>
  )
}
