import { useState } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { useDreams, useCreateDream, useDeleteDream } from '../lib/queries'
import type { Dream } from '../lib/supabase'
import { nowInSAST, getWeekRange } from '../lib/utils'

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
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const INPUT: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.82rem',
  fontWeight: 300,
  color: 'var(--ink)',
  padding: '10px 14px',
  border: '1px solid rgba(107, 124, 92, 0.2)',
  borderRadius: '10px',
  background: 'rgba(255, 252, 245, 0.8)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

// ── TAG INPUT ─────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder }: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = input.trim()
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed])
      }
      setInput('')
    }
  }

  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {tags.map(tag => (
            <span key={tag} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              background: 'rgba(107, 124, 92, 0.08)',
              border: '1px solid rgba(107, 124, 92, 0.15)',
              borderRadius: '20px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              color: 'var(--olive)',
            }}>
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter(t => t !== tag))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-muted)',
                  fontSize: '0.8rem',
                  padding: '0 0 1px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={INPUT}
      />
    </div>
  )
}

// ── CLARITY PICKER ────────────────────────────────────────────────────────────

function ClarityPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            border: n <= value ? 'none' : '1.5px solid rgba(107, 124, 92, 0.3)',
            background: n <= value ? 'var(--olive)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            flexShrink: 0,
          }}
        />
      ))}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.72rem',
        color: 'var(--ink-muted)',
        marginLeft: '4px',
      }}>
        {value}/5
      </span>
    </div>
  )
}

// ── CLARITY DISPLAY ───────────────────────────────────────────────────────────

function ClarityDisplay({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: n <= value ? 'var(--olive)' : 'rgba(107, 124, 92, 0.15)',
          flexShrink: 0,
        }} />
      ))}
    </div>
  )
}

// ── DREAM FORM ────────────────────────────────────────────────────────────────

function DreamForm({ onClose, onSave }: {
  onClose: () => void
  onSave: (dream: Omit<Dream, 'id' | 'created_at'>) => Promise<void>
}) {
  const today = format(nowInSAST(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [title, setTitle] = useState('')
  const [narrative, setNarrative] = useState('')
  const [symbols, setSymbols] = useState<string[]>([])
  const [emotions, setEmotions] = useState<string[]>([])
  const [clarity, setClarity] = useState(3)
  const [lucid, setLucid] = useState(false)
  const [recurring, setRecurring] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!narrative.trim()) return
    setSaving(true)
    try {
      await onSave({
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
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const canSave = narrative.trim().length > 0 && !saving

  return (
    <div style={{
      background: 'rgba(107, 124, 92, 0.03)',
      border: '1px solid rgba(107, 124, 92, 0.14)',
      borderRadius: '14px',
      padding: '28px',
      marginBottom: '40px',
    }}>
      <h3 style={{
        ...DISPLAY,
        fontSize: '1.2rem',
        color: 'var(--ink)',
        margin: '0 0 24px',
      }}>
        Log a Dream
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Date */}
        <div>
          <p style={{ ...LABEL, margin: '0 0 6px' }}>Date</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...INPUT, width: 'auto', minWidth: '180px' }}
          />
        </div>

        {/* Title */}
        <div>
          <p style={{ ...LABEL, margin: '0 0 6px' }}>
            Title <span style={{ opacity: 0.5 }}>(optional)</span>
          </p>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Give this dream a name..."
            style={INPUT}
          />
        </div>

        {/* Narrative */}
        <div>
          <p style={{ ...LABEL, margin: '0 0 6px' }}>Narrative</p>
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            placeholder="Describe your dream in as much detail as you can remember..."
            rows={6}
            style={{
              ...INPUT,
              resize: 'vertical',
              lineHeight: 1.65,
            }}
          />
        </div>

        {/* Symbols */}
        <div>
          <p style={{ ...LABEL, margin: '0 0 6px' }}>
            Symbols <span style={{ opacity: 0.5 }}>(press Enter to add)</span>
          </p>
          <TagInput tags={symbols} onChange={setSymbols} placeholder="water, snake, house…" />
        </div>

        {/* Emotions */}
        <div>
          <p style={{ ...LABEL, margin: '0 0 6px' }}>
            Emotions <span style={{ opacity: 0.5 }}>(press Enter to add)</span>
          </p>
          <TagInput tags={emotions} onChange={setEmotions} placeholder="fear, wonder, confusion…" />
        </div>

        {/* Clarity */}
        <div>
          <p style={{ ...LABEL, margin: '0 0 10px' }}>Clarity</p>
          <ClarityPicker value={clarity} onChange={setClarity} />
        </div>

        {/* Lucid + Recurring */}
        <div style={{ display: 'flex', gap: '28px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            fontWeight: 300,
            color: 'var(--ink)',
          }}>
            <input
              type="checkbox"
              checked={lucid}
              onChange={e => setLucid(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--olive)', cursor: 'pointer' }}
            />
            Lucid dream
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            fontWeight: 300,
            color: 'var(--ink)',
          }}>
            <input
              type="checkbox"
              checked={recurring}
              onChange={e => setRecurring(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--olive)', cursor: 'pointer' }}
            />
            Recurring dream
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(44, 42, 37, 0.12)',
              borderRadius: '10px',
              padding: '9px 20px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            style={{
              background: canSave ? 'var(--olive)' : 'rgba(44, 42, 37, 0.08)',
              color: canSave ? 'white' : 'var(--ink-muted)',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 24px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              cursor: canSave ? 'pointer' : 'default',
              transition: 'all 200ms ease',
            }}
          >
            {saving ? 'Saving…' : 'Save Dream'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── DREAM CARD ────────────────────────────────────────────────────────────────

const EXCERPT = 200

function DreamCard({ dream, onDelete }: {
  dream: Dream
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isLong = dream.narrative.length > EXCERPT
  const displayText = isLong && !expanded
    ? dream.narrative.slice(0, EXCERPT) + '…'
    : dream.narrative

  return (
    <div style={{
      padding: '20px 24px',
      background: 'rgba(44, 42, 37, 0.02)',
      border: '1px solid var(--border-warm)',
      borderRadius: '14px',
      marginBottom: '12px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
          <p style={{
            ...DISPLAY,
            fontSize: '1.05rem',
            color: 'var(--ink)',
            margin: '0 0 8px',
          }}>
            {dream.title || 'Untitled dream'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <ClarityDisplay value={dream.clarity} />
            {dream.lucid && (
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.56rem',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--gold)',
                background: 'var(--gold-muted)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                Lucid
              </span>
            )}
            {dream.recurring && (
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.56rem',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--clay)',
                background: 'rgba(179, 97, 68, 0.08)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                Recurring
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(dream.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-muted)',
            opacity: 0.3,
            fontSize: '1.1rem',
            padding: '2px 6px',
            lineHeight: 1,
            transition: 'opacity 200ms',
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
          title="Delete dream"
        >
          ×
        </button>
      </div>

      {/* Narrative */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.85rem',
        fontWeight: 300,
        color: 'var(--ink)',
        lineHeight: 1.75,
        margin: '0 0 12px',
      }}>
        {displayText}
        {isLong && (
          <button
            onClick={() => setExpanded(x => !x)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--olive)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.78rem',
              padding: '0 0 0 6px',
            }}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      {/* Pills */}
      {(dream.symbols.length > 0 || dream.emotions.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {dream.symbols.map(sym => (
            <span key={sym} style={{
              padding: '2px 9px',
              background: 'rgba(107, 124, 92, 0.08)',
              border: '1px solid rgba(107, 124, 92, 0.15)',
              borderRadius: '20px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.67rem',
              color: 'var(--olive)',
            }}>
              {sym}
            </span>
          ))}
          {dream.emotions.map(em => (
            <span key={em} style={{
              padding: '2px 9px',
              background: 'rgba(179, 97, 68, 0.07)',
              border: '1px solid rgba(179, 97, 68, 0.15)',
              borderRadius: '20px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.67rem',
              color: 'var(--clay)',
            }}>
              {em}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── WEEKLY ANALYSIS ───────────────────────────────────────────────────────────

type AnalysisState = 'idle' | 'loading' | 'shown'

function WeeklyAnalysis({ dreams, weekKey }: { dreams: Dream[]; weekKey: string }) {
  const [state, setState] = useState<AnalysisState>('idle')
  const [shownKey, setShownKey] = useState(weekKey)

  // Reset analysis when the week changes
  if (weekKey !== shownKey) {
    setShownKey(weekKey)
    setState('idle')
  }

  const lenses = [
    {
      icon: '🔮',
      title: 'Jungian Analysis',
      body: 'Analysis will be generated by Tracey in your weekly report. Look for archetypes present (Shadow, Anima/Animus, Self, Trickster, Wise Old Man, Great Mother), individuation themes, and collective unconscious symbols across this week\'s dreams.',
    },
    {
      icon: '🧠',
      title: 'Freudian Lens',
      body: 'Analysis will be generated by Tracey in your weekly report. Consider latent vs manifest content, wish fulfilment patterns, and what repressed desires may be surfacing through this week\'s dream imagery.',
    },
    {
      icon: '🌿',
      title: 'Vedic / Ayurvedic Lens',
      body: 'Analysis will be generated by Tracey in your weekly report. Examine the dream states (svapna), dosha indicators in emotional tone and imagery, and the overall level of consciousness expressed.',
    },
    {
      icon: '🌍',
      title: 'Ancestral / Indigenous Lens',
      body: 'Analysis will be generated by Tracey in your weekly report. Look for messages from the land or ancestors, nature symbolism, and any prophetic or visionary elements in the dream content.',
    },
    {
      icon: '🔑',
      title: 'Existential Lens',
      body: 'Analysis will be generated by Tracey in your weekly report. Explore themes of meaning, freedom, death, isolation, and authenticity — what questions is the unconscious asking about how you are living?',
    },
    {
      icon: '📊',
      title: 'Pattern Summary',
      body: `${dreams.length} dream${dreams.length !== 1 ? 's' : ''} logged this week. Full synthesis — recurring symbols, emotional arc, and clarity trend — will be compiled by Tracey in your weekly report.`,
    },
  ]

  if (dreams.length === 0) return null

  return (
    <div style={{ marginTop: '40px' }}>
      {state === 'idle' && (
        <button
          onClick={() => {
            setState('loading')
            setTimeout(() => setState('shown'), 1800)
          }}
          style={{
            padding: '11px 24px',
            background: 'rgba(107, 124, 92, 0.06)',
            border: '1px solid rgba(107, 124, 92, 0.2)',
            borderRadius: '10px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--olive)',
            cursor: 'pointer',
            transition: 'background 200ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(107, 124, 92, 0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(107, 124, 92, 0.06)')}
        >
          Generate Weekly Analysis
        </button>
      )}

      {state === 'loading' && (
        <p style={{
          ...DISPLAY,
          fontSize: '1rem',
          color: 'var(--ink-muted)',
          fontStyle: 'italic',
          margin: 0,
        }}>
          Synthesising your dreamscape…
        </p>
      )}

      {state === 'shown' && (
        <div>
          <p style={{ ...LABEL, margin: '0 0 20px' }}>Weekly Analysis</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {lenses.map(lens => (
              <div key={lens.title} style={{
                background: 'var(--gold-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '18px 22px',
              }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink)',
                  margin: '0 0 8px',
                }}>
                  {lens.icon} {lens.title}
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.83rem',
                  fontWeight: 300,
                  color: 'var(--ink-muted)',
                  margin: 0,
                  lineHeight: 1.72,
                  fontStyle: 'italic',
                }}>
                  {lens.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── DREAM JOURNAL TAB ─────────────────────────────────────────────────────────

function DreamJournal({ dreams, onDelete, onAdd }: {
  dreams: Dream[]
  onDelete: (id: string) => void
  onAdd: (dream: Omit<Dream, 'id' | 'created_at'>) => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)

  // Group by date, newest first
  const byDate: Record<string, Dream[]> = {}
  for (const d of dreams) {
    if (!byDate[d.date]) byDate[d.date] = []
    byDate[d.date].push(d)
  }
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      {/* Log button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 22px',
            background: 'var(--olive)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            marginBottom: '36px',
            transition: 'opacity 200ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          + Log a Dream
        </button>
      )}

      {/* Inline form */}
      {showForm && (
        <DreamForm
          onClose={() => setShowForm(false)}
          onSave={onAdd}
        />
      )}

      {/* Empty state */}
      {sortedDates.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 16px', opacity: 0.25 }}>🌙</p>
          <p style={{
            ...DISPLAY,
            fontSize: '1.3rem',
            color: 'var(--ink)',
            margin: '0 0 10px',
          }}>
            No dreams logged yet.
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            fontWeight: 300,
            color: 'var(--ink-muted)',
            margin: 0,
          }}>
            Press "Log a Dream" to record your first dream, or say <em>dream journal</em> to Tracey.
          </p>
        </div>
      )}

      {/* Dream list grouped by date */}
      {sortedDates.map(date => (
        <div key={date} style={{ marginBottom: '40px' }}>
          <h3 style={{
            ...DISPLAY,
            fontSize: '1.15rem',
            color: 'var(--ink)',
            margin: '0 0 16px',
            letterSpacing: '-0.01em',
          }}>
            {format(parseISO(date), 'EEEE, d MMMM yyyy')}
          </h3>
          {byDate[date].map(dream => (
            <DreamCard key={dream.id} dream={dream} onDelete={onDelete} />
          ))}
          <div style={{
            marginTop: '28px',
            height: '1px',
            background: 'linear-gradient(90deg, var(--border-warm) 0%, transparent 100%)',
            maxWidth: '400px',
          }} />
        </div>
      ))}
    </div>
  )
}

// ── WEEKLY REPORT TAB ─────────────────────────────────────────────────────────

function WeeklyReport({ allDreams }: { allDreams: Dream[] }) {
  const [weekOffset, setWeekOffset] = useState(0)

  const now = nowInSAST()
  const selectedBase = addDays(now, weekOffset * 7)
  const { start: weekStart, end: weekEnd } = getWeekRange(selectedBase)
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd')
  const weekLabel = `${format(weekStart, 'EEE MMM d')} – ${format(weekEnd, 'EEE MMM d, yyyy')}`

  const weekDreams = allDreams
    .filter(d => d.date >= weekStartStr && d.date <= weekEndStr)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      {/* Week selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '40px',
      }}>
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink-muted)',
            fontSize: '0.95rem',
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <span style={{ ...DISPLAY, fontSize: '1rem', color: 'var(--ink)' }}>
          {weekLabel}
        </span>
        <button
          onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
          disabled={weekOffset >= 0}
          style={{
            background: 'none',
            border: `1px solid ${weekOffset >= 0 ? 'rgba(44,42,37,0.08)' : 'var(--border)'}`,
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: weekOffset >= 0 ? 'default' : 'pointer',
            color: weekOffset >= 0 ? 'rgba(44,42,37,0.2)' : 'var(--ink-muted)',
            fontSize: '0.95rem',
            flexShrink: 0,
          }}
        >
          →
        </button>
      </div>

      {/* Dreams list for the week */}
      {weekDreams.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          fontStyle: 'italic',
          margin: '0 0 36px',
        }}>
          No dreams logged for this week.
        </p>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {weekDreams.map(dream => (
            <div key={dream.id} style={{
              borderBottom: '1px solid var(--border-warm)',
              paddingBottom: '22px',
              marginBottom: '22px',
            }}>
              <p style={{ ...LABEL, margin: '0 0 6px' }}>
                {format(parseISO(dream.date), 'EEE, d MMM')}
              </p>
              <p style={{
                ...DISPLAY,
                fontSize: '1rem',
                color: 'var(--ink)',
                margin: '0 0 6px',
              }}>
                {dream.title || 'Untitled dream'}
              </p>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                fontWeight: 300,
                color: 'var(--ink-muted)',
                margin: '0 0 10px',
                lineHeight: 1.65,
              }}>
                {dream.narrative.length > 220
                  ? dream.narrative.slice(0, 220) + '…'
                  : dream.narrative}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <ClarityDisplay value={dream.clarity} />
                {dream.lucid && (
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.56rem',
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--gold)',
                  }}>Lucid</span>
                )}
                {dream.recurring && (
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.56rem',
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--clay)',
                  }}>Recurring</span>
                )}
                {dream.symbols.slice(0, 4).map(s => (
                  <span key={s} style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.65rem',
                    color: 'var(--olive)',
                    background: 'rgba(107, 124, 92, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '20px',
                  }}>{s}</span>
                ))}
                {dream.emotions.slice(0, 3).map(em => (
                  <span key={em} style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.65rem',
                    color: 'var(--clay)',
                    background: 'rgba(179, 97, 68, 0.07)',
                    padding: '2px 8px',
                    borderRadius: '20px',
                  }}>{em}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly analysis with generate button */}
      <WeeklyAnalysis dreams={weekDreams} weekKey={weekStartStr} />
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

type Tab = 'journal' | 'report'

export default function Dreams() {
  const { data: dreams = [], isLoading } = useDreams(200)
  const createDream = useCreateDream()
  const deleteDream = useDeleteDream()
  const [tab, setTab] = useState<Tab>('journal')

  const handleAdd = async (dream: Omit<Dream, 'id' | 'created_at'>) => {
    await createDream.mutateAsync(dream)
  }

  const handleDelete = (id: string) => {
    deleteDream.mutate(id)
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

      {/* Page header */}
      <header style={{ marginBottom: '48px' }}>
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
        marginBottom: '48px',
        borderBottom: '1px solid var(--border-warm)',
      }}>
        {([['journal', 'Dream Journal'], ['report', 'Weekly Report']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === key ? '2px solid var(--olive)' : '2px solid transparent',
              padding: '10px 22px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.68rem',
              fontWeight: tab === key ? 500 : 300,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: tab === key ? 'var(--olive)' : 'var(--ink-muted)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              marginBottom: '-1px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'journal' ? (
        <DreamJournal
          dreams={dreams}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      ) : (
        <WeeklyReport allDreams={dreams} />
      )}
    </main>
  )
}
