import { useState, useMemo } from 'react'
import { parseISO, format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import { useDreams, useCreateDream, useDeleteDream } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { useQuery } from '@tanstack/react-query'
import type { Dream } from '../lib/supabase'
import { nowInSAST } from '../lib/utils'

// ── STYLE CONSTANTS ───────────────────────────────────────────────────────────

const DISPLAY: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 300,
}

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: 'var(--ink-muted)',
}

const BODY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.82rem',
  fontWeight: 300,
  color: 'var(--ink-muted)',
  lineHeight: 1.65,
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatWeekLabel(start: Date, end: Date): string {
  return `${format(start, 'EEE MMM d')} – ${format(end, 'EEE MMM d, yyyy')}`
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 40px',
      gap: '24px',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '3rem', opacity: 0.3 }}>🌙</span>
      <p style={{
        ...DISPLAY,
        fontSize: '1.35rem',
        color: 'var(--ink)',
        lineHeight: 1.6,
        maxWidth: '360px',
        margin: 0,
      }}>
        No dreams recorded yet.
      </p>
      <p style={{
        ...BODY,
        margin: 0,
      }}>
        Say <em>dream journal</em> to Tracey, or log one below.
      </p>
    </div>
  )
}

// ── TAG INPUT ─────────────────────────────────────────────────────────────────

function TagInput({ tags, setTags, placeholder }: {
  tags: string[]
  setTags: (t: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      if (!tags.includes(input.trim().toLowerCase())) {
        setTags([...tags, input.trim().toLowerCase()])
      }
      setInput('')
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      alignItems: 'center',
      padding: '10px 14px',
      border: '1px solid var(--border-warm)',
      borderRadius: '10px',
      background: 'rgba(255,252,245,0.5)',
      minHeight: '44px',
    }}>
      {tags.map(tag => (
        <span
          key={tag}
          onClick={() => setTags(tags.filter(t => t !== tag))}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            letterSpacing: '0.05em',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(92,122,92,0.1)',
            color: 'var(--olive)',
            cursor: 'pointer',
            transition: 'opacity 200ms',
          }}
        >
          {tag} ×
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-body)',
          fontSize: '0.82rem',
          color: 'var(--ink)',
          flex: 1,
          minWidth: '80px',
        }}
      />
    </div>
  )
}

// ── CLARITY DOTS ──────────────────────────────────────────────────────────────

function ClarityDots({ value, onChange, readonly }: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <div
          key={n}
          onClick={() => !readonly && onChange?.(n)}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: n <= value ? 'var(--olive)' : 'rgba(139,127,109,0.15)',
            cursor: readonly ? 'default' : 'pointer',
            transition: 'background 200ms',
          }}
        />
      ))}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.65rem',
        color: 'var(--ink-faint)',
        marginLeft: '6px',
        letterSpacing: '0.05em',
      }}>
        {value === 1 ? 'foggy' : value === 2 ? 'hazy' : value === 3 ? 'moderate' : value === 4 ? 'vivid' : 'crystal clear'}
      </span>
    </div>
  )
}

// ── DREAM ENTRY FORM ──────────────────────────────────────────────────────────

function DreamForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const createDream = useCreateDream()
  const today = format(nowInSAST(), 'yyyy-MM-dd')

  const [date, setDate] = useState(today)
  const [title, setTitle] = useState('')
  const [narrative, setNarrative] = useState('')
  const [symbols, setSymbols] = useState<string[]>([])
  const [emotions, setEmotions] = useState<string[]>([])
  const [clarity, setClarity] = useState(3)
  const [lucid, setLucid] = useState(false)
  const [recurring, setRecurring] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!narrative.trim()) return
    setSubmitting(true)
    try {
      await createDream.mutateAsync({
        date,
        title: title.trim() || null,
        narrative: narrative.trim(),
        symbols,
        emotions,
        clarity,
        lucid,
        recurring,
        tags: [],
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to save dream:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--border-warm)',
    borderRadius: '10px',
    background: 'rgba(255,252,245,0.5)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color 200ms',
  }

  return (
    <div style={{
      padding: '32px 0',
      borderBottom: '1px solid var(--border-warm)',
      marginBottom: '48px',
    }}>
      <p style={{ ...LABEL, marginBottom: '24px' }}>Log a Dream</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '600px' }}>
        {/* Date */}
        <div>
          <p style={{ ...LABEL, marginBottom: '6px' }}>Date</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...inputStyle, maxWidth: '200px' }}
          />
        </div>

        {/* Title */}
        <div>
          <p style={{ ...LABEL, marginBottom: '6px' }}>Title</p>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give this dream a name..."
            style={inputStyle}
          />
        </div>

        {/* Narrative */}
        <div>
          <p style={{ ...LABEL, marginBottom: '6px' }}>Dream</p>
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            placeholder="Describe your dream in as much detail as you can remember..."
            rows={6}
            style={{
              ...inputStyle,
              resize: 'vertical',
              lineHeight: 1.7,
            }}
          />
        </div>

        {/* Symbols */}
        <div>
          <p style={{ ...LABEL, marginBottom: '6px' }}>Symbols</p>
          <TagInput tags={symbols} setTags={setSymbols} placeholder="Type a symbol and press Enter..." />
        </div>

        {/* Emotions */}
        <div>
          <p style={{ ...LABEL, marginBottom: '6px' }}>Emotions</p>
          <TagInput tags={emotions} setTags={setEmotions} placeholder="Type an emotion and press Enter..." />
        </div>

        {/* Clarity */}
        <div>
          <p style={{ ...LABEL, marginBottom: '6px' }}>Clarity</p>
          <ClarityDots value={clarity} onChange={setClarity} />
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={lucid}
              onChange={e => setLucid(e.target.checked)}
              style={{ accentColor: 'var(--olive)' }}
            />
            <span style={{ ...BODY, margin: 0 }}>Lucid dream</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={recurring}
              onChange={e => setRecurring(e.target.checked)}
              style={{ accentColor: 'var(--olive)' }}
            />
            <span style={{ ...BODY, margin: 0 }}>Recurring</span>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={handleSubmit}
            disabled={!narrative.trim() || submitting}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: narrative.trim() ? 'var(--olive)' : 'rgba(139,127,109,0.15)',
              color: narrative.trim() ? '#fff' : 'var(--ink-faint)',
              cursor: narrative.trim() ? 'pointer' : 'default',
              transition: 'all 200ms',
            }}
          >
            {submitting ? 'Saving...' : 'Save Dream'}
          </button>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              fontWeight: 400,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border-warm)',
              background: 'transparent',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DREAM CARD ────────────────────────────────────────────────────────────────

function DreamCard({ dream, onDelete }: { dream: Dream; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const parsed = parseISO(dream.date)
  const dateLabel = format(parsed, 'EEEE, d MMMM yyyy')

  return (
    <article style={{ marginBottom: '48px' }}>
      {/* Date + title */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: 'pointer' }}
      >
        <p style={{ ...LABEL, marginBottom: '8px' }}>{dateLabel}</p>
        <h3 style={{
          ...DISPLAY,
          fontSize: '1.4rem',
          color: 'var(--ink)',
          margin: '0 0 12px',
          lineHeight: 1.3,
        }}>
          🌙 {dream.title || 'Untitled Dream'}
        </h3>

        {/* Preview or full */}
        <p style={{
          ...DISPLAY,
          fontSize: '1rem',
          color: 'var(--ink)',
          lineHeight: 1.9,
          margin: '0 0 16px',
          maxWidth: '680px',
          ...(expanded ? {} : {
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }),
        }}>
          {dream.narrative}
        </p>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <ClarityDots value={dream.clarity} readonly />
        {dream.lucid && (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'rgba(74,107,138,0.12)',
            color: '#4a6b8a',
          }}>
            Lucid
          </span>
        )}
        {dream.recurring && (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: '20px',
            background: 'rgba(138,106,58,0.12)',
            color: '#8a6a3a',
          }}>
            Recurring
          </span>
        )}
      </div>

      {/* Symbols */}
      {dream.symbols.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {dream.symbols.map(s => (
            <span key={s} style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              letterSpacing: '0.05em',
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'rgba(92,122,92,0.08)',
              color: 'var(--olive)',
            }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Emotions */}
      {dream.emotions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {dream.emotions.map(e => (
            <span key={e} style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              letterSpacing: '0.05em',
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'rgba(138,106,58,0.08)',
              color: '#8a6a3a',
            }}>
              {e}
            </span>
          ))}
        </div>
      )}

      {/* Expanded actions */}
      {expanded && (
        <button
          onClick={() => onDelete(dream.id)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.65rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(180,80,80,0.2)',
            background: 'transparent',
            color: '#a05050',
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'all 200ms',
          }}
        >
          Delete
        </button>
      )}

      {/* Separator */}
      <div style={{
        marginTop: '40px',
        height: '1px',
        background: 'linear-gradient(90deg, var(--border-warm) 0%, transparent 100%)',
        maxWidth: '400px',
      }} />
    </article>
  )
}

// ── WEEKLY REPORT TAB ─────────────────────────────────────────────────────────

function WeeklyReport() {
  const now = nowInSAST()
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 })
  const startStr = format(weekStart, 'yyyy-MM-dd')
  const endStr = format(weekEnd, 'yyyy-MM-dd')

  const { data: dreams = [], isLoading } = useQuery({
    queryKey: ['dreams', 'week', startStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_dreams')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true })
      if (error) throw error
      return data as Dream[]
    },
  })

  return (
    <div>
      {/* Week navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '48px',
      }}>
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          style={{
            background: 'none',
            border: '1px solid var(--border-warm)',
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: 'var(--ink-muted)',
          }}
        >
          ←
        </button>
        <span style={{
          ...DISPLAY,
          fontSize: '1.1rem',
          color: 'var(--ink)',
        }}>
          {formatWeekLabel(weekStart, weekEnd)}
        </span>
        <button
          onClick={() => setWeekOffset(o => o + 1)}
          disabled={weekOffset >= 0}
          style={{
            background: 'none',
            border: '1px solid var(--border-warm)',
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: weekOffset >= 0 ? 'default' : 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: weekOffset >= 0 ? 'var(--ink-faint)' : 'var(--ink-muted)',
            opacity: weekOffset >= 0 ? 0.4 : 1,
          }}
        >
          →
        </button>
      </div>

      {isLoading ? (
        <p style={{ ...DISPLAY, fontSize: '1rem', color: 'var(--ink-muted)' }}>Loading dreams...</p>
      ) : dreams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px' }}>
          <span style={{ fontSize: '2rem', opacity: 0.3 }}>🌙</span>
          <p style={{
            ...DISPLAY,
            fontSize: '1.1rem',
            color: 'var(--ink-muted)',
            marginTop: '16px',
          }}>
            No dreams recorded this week.
          </p>
        </div>
      ) : (
        <>
          {/* Dream list for the week */}
          <div style={{ marginBottom: '48px' }}>
            <p style={{ ...LABEL, marginBottom: '24px' }}>
              {dreams.length} {dreams.length === 1 ? 'dream' : 'dreams'} this week
            </p>
            {dreams.map(dream => (
              <div key={dream.id} style={{ marginBottom: '32px' }}>
                <p style={{ ...LABEL, marginBottom: '6px' }}>
                  {format(parseISO(dream.date), 'EEEE, d MMMM')}
                </p>
                <h4 style={{
                  ...DISPLAY,
                  fontSize: '1.15rem',
                  color: 'var(--ink)',
                  margin: '0 0 8px',
                }}>
                  🌙 {dream.title || 'Untitled Dream'}
                </h4>
                <p style={{
                  ...DISPLAY,
                  fontSize: '0.95rem',
                  color: 'var(--ink)',
                  lineHeight: 1.8,
                  margin: '0 0 10px',
                  maxWidth: '680px',
                }}>
                  {dream.narrative}
                </p>
                {dream.symbols.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                    {dream.symbols.map(s => (
                      <span key={s} style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        background: 'rgba(92,122,92,0.08)',
                        color: 'var(--olive)',
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{
                  height: '1px',
                  background: 'var(--border-warm)',
                  marginTop: '24px',
                  maxWidth: '300px',
                }} />
              </div>
            ))}
          </div>

          {/* Analysis section */}
          <div style={{
            background: 'var(--gold-muted)',
            borderRadius: 'var(--radius-sm, 12px)',
            padding: '28px 32px',
            maxWidth: '700px',
          }}>
            <p style={{ ...LABEL, color: 'var(--gold)', marginBottom: '20px' }}>
              Weekly Dream Analysis
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { emoji: '🔮', title: 'Jungian Analysis', desc: 'Archetypes, individuation themes, messages from the collective unconscious' },
                { emoji: '🧠', title: 'Freudian Lens', desc: 'Latent content, wish fulfilment, the desires beneath the surface' },
                { emoji: '🌿', title: 'Vedic / Ayurvedic', desc: 'Dream states, dosha indicators, consciousness level' },
                { emoji: '🌍', title: 'Ancestral / Indigenous', desc: 'Messages from land and ancestors, nature symbolism, prophetic elements' },
                { emoji: '🔑', title: 'Existential', desc: 'Themes of meaning, freedom, authenticity, and becoming' },
                { emoji: '📊', title: 'Pattern Summary', desc: 'Recurring symbols, emotional arc, clarity trend across the week' },
              ].map(lens => (
                <div key={lens.title}>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.78rem',
                    fontWeight: 400,
                    color: 'var(--ink)',
                    margin: '0 0 4px',
                  }}>
                    {lens.emoji} {lens.title}
                  </p>
                  <p style={{
                    ...DISPLAY,
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    color: 'var(--ink-muted)',
                    margin: 0,
                    lineHeight: 1.7,
                  }}>
                    {lens.desc}
                  </p>
                </div>
              ))}
            </div>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--ink-faint)',
              marginTop: '24px',
              fontStyle: 'italic',
            }}>
              Tracey generates your full weekly dream analysis each Monday.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function Dreams() {
  const { data: dreams = [], isLoading } = useDreams(50)
  const deleteDream = useDeleteDream()
  const [tab, setTab] = useState<'journal' | 'weekly'>('journal')
  const [showForm, setShowForm] = useState(false)

  const handleDelete = async (id: string) => {
    if (confirm('Delete this dream?')) {
      await deleteDream.mutateAsync(id)
    }
  }

  if (isLoading) {
    return (
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 40px' }}>
        <p style={{ ...DISPLAY, fontSize: '1.1rem', color: 'var(--ink-muted)' }}>
          Loading dreams…
        </p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 40px' }}>

      {/* Header */}
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{
          ...DISPLAY,
          fontSize: '2.2rem',
          color: 'var(--ink)',
          margin: '0 0 8px',
          letterSpacing: '-0.01em',
        }}>
          Dreams
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          margin: 0,
        }}>
          {dreams.length} {dreams.length === 1 ? 'dream' : 'dreams'} recorded
        </p>
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '32px',
        borderBottom: '1px solid var(--border-warm)',
        marginBottom: '36px',
      }}>
        {(['journal', 'weekly'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              fontWeight: 400,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--olive)' : '2px solid transparent',
              padding: '0 0 12px',
              cursor: 'pointer',
              color: tab === t ? 'var(--olive)' : 'var(--ink-faint)',
              transition: 'all 200ms',
            }}
          >
            {t === 'journal' ? 'Dream Journal' : 'Weekly Report'}
          </button>
        ))}
      </div>

      {tab === 'journal' ? (
        <>
          {/* Log button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid var(--olive)',
                background: 'transparent',
                color: 'var(--olive)',
                cursor: 'pointer',
                marginBottom: '36px',
                transition: 'all 200ms',
              }}
            >
              + Log a Dream
            </button>
          )}

          {/* Form */}
          {showForm && (
            <DreamForm
              onClose={() => setShowForm(false)}
              onSuccess={() => {}}
            />
          )}

          {/* Dream list */}
          {dreams.length === 0 && !showForm ? (
            <EmptyState />
          ) : (
            dreams.map(dream => (
              <DreamCard key={dream.id} dream={dream} onDelete={handleDelete} />
            ))
          )}
        </>
      ) : (
        <WeeklyReport />
      )}
    </main>
  )
}
