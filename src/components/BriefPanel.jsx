import { useState } from 'react'

const ASPECT_RATIOS = [
  { value: '1:1',  label: '1:1',  w: 12, h: 12 },
  { value: '16:9', label: '16:9', w: 20, h: 11 },
  { value: '4:3',  label: '4:3',  w: 16, h: 12 },
  { value: '9:16', label: '9:16', w: 11, h: 20 },
]

const QUALITY_OPTIONS = [
  { value: '1K', label: 'Standard' },
  { value: '2K', label: 'High' },
]

const FIELD_LABELS = {
  subject:     'Subject',
  setting:     'Setting',
  lighting:    'Lighting',
  mood:        'Mood',
  composition: 'Composition',
  color:       'Color',
  detail:      'Detail',
}

export default function BriefPanel({ brief, fragments = [], onBriefChange, outputSettings, onOutputSettingsChange, compact, disabled }) {
  const [editingKey,   setEditingKey]   = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [hoveredKey,   setHoveredKey]   = useState(null)

  // ── Empty / blocked states ────────────────────────────────

  const emptyCardStyle = compact ? {} : { padding: '34px', display: 'flex', flexDirection: 'column' }

  if (!brief) {
    return (
      <div className={compact ? '' : 'vf-card'} style={emptyCardStyle}>
        <div className="vf-brief-empty">
          <p className="vf-brief-empty-title">Awaiting analysis</p>
          <p className="vf-brief-empty-desc">
            Describe your vision and click Analyze to generate a visual brief.
          </p>
        </div>
      </div>
    )
  }

  if (brief.blocked || !Array.isArray(brief.fields)) {
    return (
      <div className={compact ? '' : 'vf-card'} style={emptyCardStyle}>
        <div className="vf-brief-empty">
          <p className="vf-brief-empty-title" style={{ color: 'var(--fg)' }}>Not a visual prompt</p>
          <p className="vf-brief-empty-desc" style={{ color: 'var(--fg-2)', opacity: 1 }}>
            {brief.message}
          </p>
        </div>
      </div>
    )
  }

  // ── Field handlers ────────────────────────────────────────

  function startEdit(key, value) {
    if (disabled) return
    setEditingKey(key)
    setEditingValue(value)
  }

  function commitEdit(key) {
    const trimmed = editingValue.trim()
    const original = brief.fields.find(f => f.key === key)
    // Fix 2a: only flip to reviewed if the value actually changed
    if (trimmed === (original?.value ?? '')) {
      setEditingKey(null)
      setEditingValue('')
      return
    }
    if (onBriefChange) {
      onBriefChange({
        ...brief,
        fields: brief.fields.map(f =>
          f.key === key ? { ...f, value: trimmed, reviewed: true } : f
        ),
      })
    }
    setEditingKey(null)
    setEditingValue('')
  }

  function cancelEdit() {
    setEditingKey(null)
    setEditingValue('')
  }

  function confirmField(key) {
    if (disabled || !onBriefChange) return
    onBriefChange({
      ...brief,
      fields: brief.fields.map(f =>
        f.key === key ? { ...f, reviewed: true } : f
      ),
    })
  }

  function removeField(key) {
    if (disabled || !onBriefChange) return
    onBriefChange({ ...brief, fields: brief.fields.filter(f => f.key !== key) })
  }

  // ── Render ────────────────────────────────────────────────

  const inner = (
    <div className="vf-brief">

      {/* Intent restatement */}
      <p className="vf-intent-restatement">{brief.intent}</p>

      {/* Legend — Fix 4: endorsement framing, no field names */}
      <div className="vf-provenance-legend">
        <span className="vf-legend-item">
          <span className="vf-legend-sample--confirmed">Aa</span>
          <span style={{ color: 'var(--fg-3)' }}>confirmed</span>
        </span>
        <span style={{ color: 'var(--fg-3)' }}>·</span>
        <span className="vf-legend-item">
          <span className="vf-legend-sample--review">Aa</span>
          <span style={{ color: 'var(--fg-3)' }}>needs review</span>
        </span>
      </div>

      {/* Helper text — Fix 5 */}
      <p className="vf-brief-helper">
        Edit, confirm, or remove each field. Anything marked "needs review" is the AI's guess.
      </p>

      {/* Brief fields */}
      <div className="vf-brief-fields">
        {brief.fields.map(field => (
          <div
            key={field.key}
            className={`vf-brief-field${hoveredKey === field.key ? ' vf-brief-field--hovered' : ''}`}
            onMouseEnter={() => setHoveredKey(field.key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <span className="vf-brief-field-label">{FIELD_LABELS[field.key] ?? field.key}</span>

            {editingKey === field.key ? (
              <input
                className="vf-brief-field-edit"
                value={editingValue}
                onChange={e => setEditingValue(e.target.value)}
                onBlur={() => commitEdit(field.key)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit(field.key)
                  if (e.key === 'Escape') cancelEdit()
                }}
                autoFocus
              />
            ) : (
              <span
                className={`vf-brief-field-value vf-brief-field-value--${field.reviewed ? 'confirmed' : 'review'}`}
                onClick={() => startEdit(field.key, field.value)}
                title="Click to edit"
              >
                {field.value || <em style={{ color: 'var(--fg-3)', fontStyle: 'normal' }}>empty</em>}
              </span>
            )}

            {/* Fix 5: ✓ (needs-review only) + ✕ (always) */}
            <div className="vf-brief-field-controls">
              <button
                className="vf-brief-field-accept"
                style={{ visibility: field.reviewed ? 'hidden' : 'visible' }}
                onClick={() => confirmField(field.key)}
                disabled={disabled}
                title="Confirm as-is"
              >✓</button>
              <button
                className="vf-brief-field-remove"
                onClick={() => removeField(field.key)}
                disabled={disabled}
                title="Remove field"
              >✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Assembled prompt — Fix 3: uniform styling, no provenance coloring */}
      {fragments.length > 0 && (
        <div className="vf-engine-prompt-wrap">
          <span className="vf-group-label" style={{ display: 'block', marginBottom: '8px' }}>
            Assembled Prompt
          </span>
          <div className="vf-engine-prompt" style={{ margin: 0 }}>
            <div className="vf-engine-prompt-divider" />
            <p className="vf-engine-prompt-body">
              {fragments.map((frag, i) => (
                <span
                  key={frag.key}
                  className={`vf-prompt-frag${hoveredKey === frag.key ? ' vf-prompt-frag--lit' : ''}`}
                  onMouseEnter={() => setHoveredKey(frag.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  {frag.text}{i < fragments.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* Fix 6: Output settings — real controls, not provenance-tagged */}
      {outputSettings && onOutputSettingsChange && (
        <div className="vf-output-settings">
          <div className="vf-output-settings-row">
            <span className="vf-group-label vf-output-settings-label">Aspect</span>
            <div className="vf-segmented">
              {ASPECT_RATIOS.map(opt => (
                <button
                  key={opt.value}
                  className={`vf-seg-btn${outputSettings.aspectRatio === opt.value ? ' vf-seg-btn--active' : ''}`}
                  onClick={() => onOutputSettingsChange({ ...outputSettings, aspectRatio: opt.value })}
                  disabled={disabled}
                  title={opt.value}
                >
                  <span
                    className="vf-ar-glyph"
                    style={{ width: opt.w, height: opt.h }}
                  />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="vf-output-settings-row">
            <span className="vf-group-label vf-output-settings-label">Quality</span>
            <div className="vf-segmented">
              {QUALITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`vf-seg-btn${outputSettings.imageSize === opt.value ? ' vf-seg-btn--active' : ''}`}
                  onClick={() => onOutputSettingsChange({ ...outputSettings, imageSize: opt.value })}
                  disabled={disabled}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )

  if (compact) return inner

  return (
    <div className="vf-card vf-brief-card" style={{ padding: '34px' }}>
      {inner}
    </div>
  )
}
