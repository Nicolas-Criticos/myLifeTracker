import { useState } from 'react'
import { format } from 'date-fns'
import { useRehabBlocks, useCreateRehabLog } from '../../lib/rehab-queries'
import { nowInSAST } from '../../lib/utils'

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.62rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
  marginBottom: '6px',
  display: 'block',
}

const INPUT: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.82rem',
  fontWeight: 300,
  color: 'var(--ink)',
  padding: '10px 14px',
  border: '1px solid rgba(90, 114, 71, 0.2)',
  borderRadius: '10px',
  background: 'rgba(255, 252, 245, 0.8)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 200ms ease',
}

const SELECT: React.CSSProperties = {
  ...INPUT,
  appearance: 'none' as const,
  cursor: 'pointer',
}

const ACTIVITY_OPTIONS = [
  { value: 'nutrient_feed', label: 'Nutrient Feed' },
  { value: 'foliar_spray', label: 'Foliar Spray' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'pruning_light', label: 'Light Pruning' },
  { value: 'pruning_major', label: 'Major Pruning' },
  { value: 'soil_correction', label: 'Soil Correction' },
  { value: 'spring_activation', label: 'Spring Activation' },
  { value: 'other', label: 'Other' },
]

interface AddLogFormProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function AddLogForm({ onClose, onSuccess }: AddLogFormProps) {
  const { data: blocks = [] } = useRehabBlocks()
  const createLog = useCreateRehabLog()
  const now = nowInSAST()

  const [date, setDate] = useState(format(now, 'yyyy-MM-dd'))
  const [blockId, setBlockId] = useState('')
  const [activityType, setActivityType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [observations, setObservations] = useState('')
  const [treesAffected, setTreesAffected] = useState('')
  const [labourHours, setLabourHours] = useState('')
  const [labourCount, setLabourCount] = useState('1')
  const [productsUsed, setProductsUsed] = useState('')
  const [cost, setCost] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = activityType && title && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await createLog.mutateAsync({
        date,
        block_id: blockId || null,
        plan_id: null,
        activity_type: activityType,
        title,
        description: description || null,
        observations: observations || null,
        trees_affected: treesAffected ? Number(treesAffected) : null,
        labour_count: Number(labourCount) || 1,
        labour_hours: labourHours ? Number(labourHours) : null,
        products_used: productsUsed || null,
        weather_conditions: null,
        photos: null,
      } as any)
      onSuccess?.()
      onClose()
    } catch (e) {
      console.error('Failed to create log:', e)
      setSubmitting(false)
    }
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
          maxWidth: '540px',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '36px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.5rem',
            color: 'var(--ink)',
            margin: 0,
          }}>
            Log Field Activity
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.4rem',
              color: 'var(--ink-muted)',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Date + Block row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={LABEL}>Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={INPUT}
              />
            </div>
            <div>
              <label style={LABEL}>Block</label>
              <select
                value={blockId}
                onChange={e => setBlockId(e.target.value)}
                style={SELECT}
              >
                <option value="">All / General</option>
                {blocks.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Type */}
          <div>
            <label style={LABEL}>Activity Type *</label>
            <select
              value={activityType}
              onChange={e => setActivityType(e.target.value)}
              style={SELECT}
            >
              <option value="">Select activity...</option>
              {ACTIVITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label style={LABEL}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Fertigation on Block 1"
              style={INPUT}
            />
          </div>

          {/* Description */}
          <div>
            <label style={LABEL}>What was done</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="What you actually did..."
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>

          {/* Observations */}
          <div>
            <label style={LABEL}>Observations</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={2}
              placeholder="Anything you noticed — tree condition, soil, pests..."
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </div>

          {/* Trees + Labour + Hours + Cost row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={LABEL}>Trees</label>
              <input
                type="number"
                value={treesAffected}
                onChange={e => setTreesAffected(e.target.value)}
                placeholder="~500"
                style={INPUT}
              />
            </div>
            <div>
              <label style={LABEL}>People</label>
              <input
                type="number"
                value={labourCount}
                onChange={e => setLabourCount(e.target.value)}
                style={INPUT}
              />
            </div>
            <div>
              <label style={LABEL}>Hours</label>
              <input
                type="number"
                step="0.5"
                value={labourHours}
                onChange={e => setLabourHours(e.target.value)}
                placeholder="4"
                style={INPUT}
              />
            </div>
            <div>
              <label style={LABEL}>Cost (R)</label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="0"
                style={INPUT}
              />
            </div>
          </div>

          {/* Products Used */}
          <div>
            <label style={LABEL}>Products Used</label>
            <input
              type="text"
              value={productsUsed}
              onChange={e => setProductsUsed(e.target.value)}
              placeholder="e.g. Verte Guano 15 L/ha, Sea Humic 5 L/ha"
              style={INPUT}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              marginTop: '8px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: canSubmit ? '#5a7247' : 'rgba(44, 42, 37, 0.1)',
              color: canSubmit ? 'white' : 'var(--ink-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: canSubmit ? 'pointer' : 'default',
              transition: 'all 200ms ease',
            }}
          >
            {submitting ? 'Logging...' : 'Log Activity'}
          </button>
        </div>
      </div>
    </div>
  )
}
