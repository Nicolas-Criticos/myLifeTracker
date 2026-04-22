import { useState } from 'react'
import ProjectList from '../components/projects/ProjectList'
import { useProjects, useTasks, useCommunityProjects, useCommunityProjectTasks } from '../lib/queries'
import type { CommunityProject } from '../lib/supabase'

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.65rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const statusColors: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'rgba(107,124,92,0.1)',  text: 'var(--foundation)' },
  planning:  { bg: 'rgba(74,107,138,0.1)',  text: 'var(--leverage)' },
  completed: { bg: 'rgba(44,42,37,0.06)',   text: 'var(--ink-muted)' },
  paused:    { bg: 'rgba(201,168,76,0.12)', text: 'var(--gold)' },
}

function FarmProjectTasks({ projectId }: { projectId: string }) {
  const { data: tasks = [], isLoading } = useCommunityProjectTasks(projectId)

  if (isLoading) {
    return <p style={{ ...LABEL, fontStyle: 'italic', textTransform: 'none', paddingTop: '8px' }}>Loading tasks…</p>
  }
  if (tasks.length === 0) {
    return (
      <p style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 300,
        fontSize: '0.82rem',
        color: 'var(--ink-muted)',
        fontStyle: 'italic',
        paddingTop: '4px',
      }}>
        No tasks yet.
      </p>
    )
  }

  const taskStatusColors: Record<string, { bg: string; text: string }> = {
    done:        { bg: 'rgba(107,124,92,0.1)',  text: 'var(--foundation)' },
    in_progress: { bg: 'rgba(74,107,138,0.1)',  text: 'var(--leverage)' },
    pending:     { bg: 'rgba(44,42,37,0.06)',   text: 'var(--ink-muted)' },
  }

  return (
    <div>
      {tasks.map((task, i) => {
        const sc = taskStatusColors[task.status ?? 'pending'] ?? taskStatusColors.pending
        return (
          <div
            key={task.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 0',
              borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: sc.text,
              flexShrink: 0,
              opacity: 0.6,
            }} />
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 300,
              color: 'var(--ink)',
              flex: 1,
            }}>
              {task.name}
            </span>
            {task.status && (
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.62rem',
                fontWeight: 400,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: sc.text,
                background: sc.bg,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                flexShrink: 0,
              }}>
                {task.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FarmProjectCard({ project }: { project: CommunityProject }) {
  const [open, setOpen] = useState(false)
  const sc = statusColors[project.status ?? 'planning'] ?? statusColors.planning

  return (
    <div style={{
      background: 'rgba(255,248,240,0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid var(--border-warm)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow 200ms var(--ease-breath)',
    }}>
      <div
        style={{ padding: '20px 24px', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 400,
                color: 'var(--ink)',
                letterSpacing: '0.02em',
              }}>
                {project.title}
              </h3>
              {project.status && (
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.62rem',
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
              )}
            </div>
            {project.description && (
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                fontWeight: 300,
                color: 'var(--ink-muted)',
                lineHeight: 1.55,
              }}>
                {project.description}
              </p>
            )}
            {project.timeline && (
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                fontWeight: 300,
                color: 'var(--clay)',
                marginTop: '6px',
                letterSpacing: '0.03em',
              }}>
                Timeline: {project.timeline}
              </p>
            )}
          </div>
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.7rem', flexShrink: 0, marginTop: '4px' }}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--border-warm)', padding: '16px 24px 20px' }}>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Tasks</p>
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
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 40px 80px' }}>

      {/* My Projects */}
      <section style={{ marginBottom: '72px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.6rem',
            color: 'var(--ink)',
            letterSpacing: '0.04em',
            marginBottom: '4px',
          }}>
            My Projects
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            Foundation · Leverage · Expression
          </p>
        </div>

        {loadingProjects || loadingTasks ? (
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            Loading…
          </p>
        ) : (
          <ProjectList projects={projects} tasks={tasks} />
        )}
      </section>

      {/* Farm Projects */}
      <section>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.6rem',
            color: 'var(--ink)',
            letterSpacing: '0.04em',
            marginBottom: '4px',
          }}>
            Farm Projects
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.82rem', color: 'var(--clay)' }}>
            Vrischgewagt · Active projects
          </p>
        </div>

        {loadingFarm ? (
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            Loading…
          </p>
        ) : farmProjects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.95rem',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}>
              No active farm projects right now.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {farmProjects.map(project => (
              <FarmProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
