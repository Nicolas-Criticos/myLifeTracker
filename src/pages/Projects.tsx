import TopBar from '../components/layout/TopBar'
import ProjectList from '../components/projects/ProjectList'
import { useProjects, useTasks } from '../lib/queries'

export default function Projects() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: tasks = [], isLoading: loadingTasks } = useTasks()

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Projects" />
      <main className="flex-1 overflow-y-auto p-6">
        {loadingProjects || loadingTasks ? (
          <div className="flex items-center justify-center h-64 text-[#64748b]">Loading…</div>
        ) : (
          <ProjectList projects={projects} tasks={tasks} />
        )}
      </main>
    </div>
  )
}
