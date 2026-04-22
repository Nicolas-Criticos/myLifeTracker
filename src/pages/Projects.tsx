import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import ProjectList from '../components/projects/ProjectList'
import { useProjects, useTasks, useCommunityProjects, useCommunityProjectTasks } from '../lib/queries'
import type { CommunityProject } from '../lib/supabase'

const SURFACE = 'bg-[rgba(240,236,228,0.9)] border border-[rgba(139,127,109,0.15)] rounded-2xl'
const LABEL = 'text-[#8a7f6d] text-xs uppercase tracking-widest'

function FarmProjectTasks({ projectId }: { projectId: string }) {
  const { data: tasks = [], isLoading } = useCommunityProjectTasks(projectId)

  if (isLoading) {
    return <p className="text-[#8a7f6d] text-xs py-2">Loading tasks…</p>
  }
  if (tasks.length === 0) {
    return <p className="text-[#8a7f6d] text-xs py-2">No tasks yet</p>
  }

  const statusColor: Record<string, string> = {
    done: 'bg-[rgba(92,122,92,0.12)] text-[#5c7a5c]',
    in_progress: 'bg-[rgba(74,107,138,0.12)] text-[#4a6b8a]',
    pending: 'bg-[rgba(139,127,109,0.1)] text-[#8a7f6d]',
  }

  return (
    <div className="space-y-1.5 pt-1">
      {tasks.map(task => (
        <div key={task.id} className="flex items-center gap-3 py-2 border-b border-[rgba(139,127,109,0.08)] last:border-0">
          <span className="text-[#2b2b2b] text-sm flex-1">{task.name}</span>
          {task.status && (
            <span className={`text-xs px-2 py-0.5 rounded-lg ${statusColor[task.status] ?? statusColor.pending}`}>
              {task.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function FarmProjectCard({ project }: { project: CommunityProject }) {
  const [open, setOpen] = useState(false)

  const statusColor: Record<string, string> = {
    active: 'bg-[rgba(92,122,92,0.12)] text-[#5c7a5c]',
    planning: 'bg-[rgba(74,107,138,0.12)] text-[#4a6b8a]',
    completed: 'bg-[rgba(139,127,109,0.1)] text-[#8a7f6d]',
    paused: 'bg-[rgba(138,106,58,0.1)] text-[#8a6a3a]',
  }

  return (
    <div className={`${SURFACE} overflow-hidden`}>
      <div
        className="p-6 cursor-pointer hover:bg-[rgba(139,127,109,0.04)] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h3 className="text-[#2b2b2b] text-base font-light tracking-wide">{project.title}</h3>
              {project.status && (
                <span className={`text-xs px-2 py-0.5 rounded-lg shrink-0 ${statusColor[project.status] ?? statusColor.planning}`}>
                  {project.status}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-[#8a7f6d] text-sm leading-relaxed">{project.description}</p>
            )}
            {project.timeline && (
              <p className="text-[#8a7f6d] text-xs mt-2 tracking-wide">Timeline: {project.timeline}</p>
            )}
          </div>
          <span className="text-[#8a7f6d] text-xs mt-1 shrink-0">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="border-t border-[rgba(139,127,109,0.12)] px-6 pb-5 pt-4">
          <p className={`${LABEL} mb-3`}>Tasks</p>
          <FarmProjectTasks projectId={project.id} />
        </div>
      )}
    </div>
  )
}

export default function Projects() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: tasks = [], isLoading: loadingTasks } = useTasks()
  const { data: farmProjects = [], isLoading: loadingFarm } = useCommunityProjects('vrischgewagt')

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Projects" />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-12 animate-fade-in">

          {/* My Projects — ops_projects */}
          <section>
            <div className="flex items-center gap-3 mb-7">
              {/* Small circle motif */}
              <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border border-[rgba(92,122,92,0.2)]" />
                <div className="w-2 h-2 rounded-full bg-[rgba(92,122,92,0.4)]" />
              </div>
              <h2 className="text-[#2b2b2b] text-lg font-light tracking-[0.06em]">My Projects</h2>
            </div>

            {loadingProjects || loadingTasks ? (
              <div className="text-[#8a7f6d] text-sm tracking-wide">Loading…</div>
            ) : (
              <ProjectList projects={projects} tasks={tasks} />
            )}
          </section>

          {/* Farm Projects — community app */}
          <section>
            <div className="flex items-center gap-3 mb-7">
              <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border border-[rgba(92,122,92,0.2)]" />
                <div className="w-2 h-2 rounded-full bg-[rgba(92,122,92,0.4)]" />
              </div>
              <h2 className="text-[#2b2b2b] text-lg font-light tracking-[0.06em]">Farm Projects</h2>
              <span className="text-[#8a7f6d] text-xs tracking-wide">Vrischgewagt</span>
            </div>

            {loadingFarm ? (
              <div className="text-[#8a7f6d] text-sm tracking-wide">Loading…</div>
            ) : farmProjects.length === 0 ? (
              <div className={`${SURFACE} p-6`}>
                <p className="text-[#8a7f6d] text-sm">No farm projects found for realm "vrischgewagt".</p>
              </div>
            ) : (
              <div className="space-y-4">
                {farmProjects.map(project => (
                  <FarmProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  )
}
