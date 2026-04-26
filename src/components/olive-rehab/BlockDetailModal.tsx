import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useRehabLogsForBlock, useBlockMilestones, useToggleBlockMilestone } from '../../lib/rehab-queries'
import type { RehabBlock } from '../../lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlockDeliverable {
  id: string
  block_id: string
  month: string
  activity_type: string
  title: string
  notes: string | null
  completed: boolean
  completed_date: string | null
  completed_by: string | null
  unit_cost: number | null
  units: number | null
  cost_unit: string | null
  total_cost: number | null
  created_at: string
  updated_at: string
}

interface BlockDetailModalProps {
  block: RehabBlock
  onClose: () => void
}

// ── Styles ────────────────────────────────────────────────────────────────────

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 300,
}

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const ACTIVITY_LABELS: Record<string, string> = {
  nutrient_feed: 'Nutrient Feed',
  foliar_spray: 'Foliar Spray',
  irrigation: 'Irrigation',
  pruning_light: 'Light Pruning',
  pruning_major: 'Major Pruning',
  soil_correction: 'Soil Correction',
  spring_activation: 'Spring Activation',
  other: 'Other',
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useBlockDeliverables(blockId: string, month: string) {
  return useQuery({
    queryKey: ['rehab_block_tasks', blockId, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rehab_block_tasks')
        .select('*')
        .eq('block_id', blockId)
        .eq('month', month)
        .order('title', { ascending: true })
      if (error) throw error
      return data as BlockDeliverable[]
    },
    enabled: !!blockId,
  })
}

function useToggleDeliverable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('rehab_block_tasks')
        .update({
          completed,
          completed_date: completed ? format(new Date(), 'yyyy-MM-dd') : null,
          completed_by: completed ? 'nicris' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehab_block_tasks'] })
    },
  })
}

function useUpdateBlockNotes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { data, error } = await supabase
        .from('rehab_blocks')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehab_blocks'] })
    },
  })
}

function useUpdateBlockHealth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, health_rating }: { id: string; health_rating: number }) => {
      const { data, error } = await supabase
        .from('rehab_blocks')
        .update({ health_rating, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehab_blocks'] })
    },
  })
}

// ── Health helpers ─────────────────────────────────────────────────────────────

function healthColor(score: number): string {
  if (score <= 2) return '#a05050'
  if (score <= 4) return '#8a6a3a'
  if (score <= 6) return '#7a8a5a'
  if (score <= 8) return '#5a7247'
  return '#3a6a2a'
}

function statusColor(status: string): string {
  return status === 'restored' ? '#5a7247' : 'var(--ink-muted)'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BlockDetailModal({ block, onClose }: BlockDetailModalProps) {
  const currentMonth = format(new Date(), 'yyyy-MM')
  const { data: deliverables = [] } = useBlockDeliverables(block.id, currentMonth)
  const { data: logs = [] } = useRehabLogsForBlock(block.id)
  const { data: milestones = [] } = useBlockMilestones(block.id)
  const toggleDeliverable = useToggleDeliverable()
  const toggleMilestone = useToggleBlockMilestone()
  const updateNotes = useUpdateBlockNotes()
  const updateHealth = useUpdateBlockHealth()

  const msDone = milestones.filter((m: any) => m.completed).length
  const msTotal = milestones.length || 9
  const msPct = Math.round((msDone / msTotal) * 100)

  const [notes, setNotes] = useState(block.notes || '')
  const [notesEditing, setNotesEditing] = useState(false)
  const [healthEdit, setHealthEdit] = useState(false)
  const [healthValue, setHealthValue] = useState(block.health_rating)

  const completedCount = deliverables.filter(d => d.completed).length
  const totalDeliverables = deliverables.length

  const saveNotes = () => {
    updateNotes.mutate({ id: block.id, notes })
    setNotesEditing(false)
  }

  const saveHealth = () => {
    updateHealth.mutate({ id: block.id, health_rating: healthValue })
    setHealthEdit(false)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(44, 42, 37, 0.4)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-in"
        style={{
          background: 'rgba(245, 248, 238, 0.97)',
          backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(90, 114, 71, 0.15)',
          boxShadow: '0 24px 80px rgba(44, 42, 37, 0.15)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '36px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h2 style={{
              ...DISPLAY,
              fontSize: '1.8rem',
              color: 'var(--ink)',
              margin: 0,
            }}>
              {block.name}
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              marginTop: '4px',
            }}>
              {block.tree_count} trees ·{' '}
              <span style={{ color: statusColor(block.irrigation_status) }}>
                {block.irrigation_status === 'restored' ? '● Irrigation active' : '○ Irrigation pending'}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.4rem',
              color: 'var(--ink-muted)',
              padding: '4px 8px',
              borderRadius: '8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Health Rating */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px 20px',
          background: 'rgba(90, 114, 71, 0.05)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(90, 114, 71, 0.1)',
        }}>
          <p style={{ ...LABEL, margin: 0 }}>Health</p>
          {healthEdit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <input
                type="range"
                min="1"
                max="10"
                value={healthValue}
                onChange={e => setHealthValue(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#5a7247' }}
              />
              <span style={{
                ...DISPLAY,
                fontSize: '1.4rem',
                color: healthColor(healthValue),
                width: '30px',
                textAlign: 'center',
              }}>
                {healthValue}
              </span>
              <button
                onClick={saveHealth}
                style={{
                  background: '#5a7247',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <div
              onClick={() => setHealthEdit(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
            >
              <div style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(44, 42, 37, 0.06)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(block.health_rating / 10) * 100}%`,
                  background: healthColor(block.health_rating),
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{
                ...DISPLAY,
                fontSize: '1.4rem',
                color: healthColor(block.health_rating),
              }}>
                {block.health_rating}/10
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--ink-muted)' }}>✎</span>
            </div>
          )}
        </div>

        {/* Lifetime Rehab Journey */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ ...LABEL, margin: 0 }}>Rehab Journey</p>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', color: msDone === msTotal ? '#5a7247' : 'var(--ink-muted)' }}>
              {msDone}/{msTotal}
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(44, 42, 37, 0.06)', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ height: '100%', width: `${msPct}%`, background: healthColor(block.health_rating), borderRadius: '3px', transition: 'width 1.2s ease' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {milestones.map((m: any) => {
              const isFuture = !m.completed && milestones.filter((x: any) => x.task_order < m.task_order && !x.completed).length > 0
              return (
                <div
                  key={m.id}
                  onClick={() => !isFuture && toggleMilestone.mutate({ id: m.id, completed: !m.completed })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    background: m.completed ? 'rgba(90, 114, 71, 0.06)' : isFuture ? 'transparent' : 'rgba(44, 42, 37, 0.02)',
                    border: `1px solid ${m.completed ? 'rgba(90, 114, 71, 0.12)' : 'rgba(44, 42, 37, 0.05)'}`,
                    cursor: isFuture ? 'default' : 'pointer',
                    opacity: isFuture ? 0.45 : 1,
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${m.completed ? '#5a7247' : 'rgba(44, 42, 37, 0.2)'}`,
                    background: m.completed ? '#5a7247' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 200ms ease',
                  }}>
                    {m.completed && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: m.completed ? 'var(--ink-muted)' : 'var(--ink)', fontWeight: m.completed ? 300 : 400, flex: 1, textDecoration: m.completed ? 'line-through' : 'none' }}>
                    {m.task_order}. {m.title}
                  </span>
                  {m.completed_date && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'var(--ink-muted)' }}>
                      {format(new Date(m.completed_date), 'MMM d')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly Checklist */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <p style={{ ...LABEL, margin: 0 }}>{format(new Date(), 'MMMM')} Checklist</p>
            </div>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              color: totalDeliverables > 0 && completedCount === totalDeliverables ? '#5a7247' : 'var(--ink-muted)',
            }}>
              {completedCount}/{totalDeliverables}
            </span>
          </div>
          {deliverables.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
            }}>
              No tasks set for this block this month. Tell Tracey to add one.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {deliverables.map(d => (
                <div
                  key={d.id}
                  onClick={() => toggleDeliverable.mutate({ id: d.id, completed: !d.completed })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: d.completed ? 'rgba(90, 114, 71, 0.06)' : 'rgba(44, 42, 37, 0.02)',
                    border: `1px solid ${d.completed ? 'rgba(90, 114, 71, 0.12)' : 'rgba(44, 42, 37, 0.05)'}`,
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: `2px solid ${d.completed ? '#5a7247' : 'rgba(44, 42, 37, 0.2)'}`,
                    background: d.completed ? '#5a7247' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 200ms ease',
                  }}>
                    {d.completed && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.82rem',
                    fontWeight: d.completed ? 300 : 400,
                    color: d.completed ? 'var(--ink-muted)' : 'var(--ink)',
                    textDecoration: d.completed ? 'line-through' : 'none',
                    flex: 1,
                    transition: 'all 200ms ease',
                  }}>
                    {d.title}
                  </span>
                  {d.completed_date && (
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.6rem',
                      color: 'var(--ink-muted)',
                    }}>
                      {format(parseISO(d.completed_date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>



        {/* Block Notes */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ ...LABEL, margin: 0 }}>Block Notes</p>
            {!notesEditing && (
              <button
                onClick={() => setNotesEditing(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.65rem',
                  color: '#5a7247',
                }}
              >
                ✎ Edit
              </button>
            )}
          </div>
          {notesEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  fontWeight: 300,
                  color: 'var(--ink)',
                  lineHeight: 1.6,
                  padding: '12px 16px',
                  border: '1px solid rgba(90, 114, 71, 0.2)',
                  borderRadius: '10px',
                  background: 'rgba(255, 252, 245, 0.8)',
                  resize: 'vertical',
                  outline: 'none',
                }}
                placeholder="Notes about this block — soil conditions, specific observations, anything relevant..."
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setNotes(block.notes || ''); setNotesEditing(false) }}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(44, 42, 37, 0.15)',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    color: 'var(--ink-muted)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveNotes}
                  style={{
                    background: '#5a7247',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              fontWeight: 300,
              color: notes ? 'var(--ink)' : 'var(--ink-muted)',
              lineHeight: 1.7,
              fontStyle: notes ? 'normal' : 'italic',
              margin: 0,
            }}>
              {notes || 'No notes yet. Click edit to add.'}
            </p>
          )}
        </div>

        {/* Recent Activity for this block */}
        <div>
          <p style={{ ...LABEL, marginBottom: '12px' }}>Recent Activity</p>
          {logs.length === 0 ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
            }}>
              No field entries for this block yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.slice(0, 8).map(log => (
                <div key={log.id} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(44, 42, 37, 0.05)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.68rem',
                    fontWeight: 300,
                    color: 'var(--ink-muted)',
                    width: '52px',
                    flexShrink: 0,
                  }}>
                    {format(parseISO(log.date), 'MMM d')}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.78rem',
                      fontWeight: 400,
                      color: 'var(--ink)',
                      margin: 0,
                    }}>
                      {log.title}
                    </p>
                    {log.observations && (
                      <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.68rem',
                        fontWeight: 300,
                        color: 'var(--ink-muted)',
                        fontStyle: 'italic',
                        margin: '2px 0 0',
                      }}>
                        {log.observations}
                      </p>
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.55rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#5a7247',
                  }}>
                    {ACTIVITY_LABELS[log.activity_type] || log.activity_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
