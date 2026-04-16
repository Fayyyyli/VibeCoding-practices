import { useRef, useEffect } from 'react'

/**
 * BriefPanel — Engine Prompt Interpretation display.
 *
 * Shows intent type + fully editable prompt.
 * Used in VisionBuilder (inside card) and Sidebar (compact, no card wrapper).
 */
export default function BriefPanel({ brief, builtPrompt, onPromptChange, compact, disabled }) {
  const textareaRef = useRef(null)

  // Auto-resize textarea to content height — eliminates blank space
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [builtPrompt])

  const emptyCardStyle = compact ? {} : {
    padding: '34px', display: 'flex', flexDirection: 'column',
  }

  if (!brief) {
    return (
      <div className={compact ? '' : 'vf-card'} style={emptyCardStyle}>
        <div className="vf-brief-empty">
          <p className="vf-brief-empty-title">Awaiting analysis</p>
          <p className="vf-brief-empty-desc">
            Describe your vision and click Analyze to generate a prompt interpretation.
          </p>
        </div>
      </div>
    )
  }

  if (brief.blocked) {
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

  const inner = (
    <div className="vf-brief">
      {/* Intent badge */}
      <div className="vf-intent-heading">
        <p className="vf-intent-sub">Intent</p>
        <h2 className="vf-intent-title">{brief.intentType}</h2>
      </div>

      {/* Engine Prompt Interpretation — fully editable */}
      <div className="vf-engine-prompt-wrap" style={{ marginTop: compact ? '10px' : '12px' }}>
        <span className="vf-group-label" style={{ display: 'block', marginBottom: '8px' }}>
          Engine Prompt Interpretation
        </span>
        <div className="vf-engine-prompt" style={{ margin: 0 }}>
          <div className="vf-engine-prompt-divider" />
          <textarea
            ref={textareaRef}
            className="vf-engine-prompt-edit"
            value={builtPrompt}
            onChange={e => onPromptChange?.(e.target.value)}
            spellCheck={false}
            disabled={disabled}
            placeholder="Prompt will appear here after analysis..."
            style={{
              width: '100%',
              opacity: disabled ? 0.45 : 1,
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />
        </div>
      </div>
    </div>
  )

  if (compact) return inner

  return (
    <div className="vf-card vf-brief-card" style={{ padding: '34px' }}>
      {inner}
    </div>
  )
}
