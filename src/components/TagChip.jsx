/**
 * TagChip — three visual states (Figma design)
 *
 * default   → #d9d9d9 bg, 1px #545454 border, black text
 * locked    → #1a1a1a fill, white text — locked for emphasis
 * discarded → transparent, light border, strikethrough, dimmed
 *
 * Click cycles: default → locked → discarded → default
 */

const STYLES = {
  default: {
    background: '#d9d9d9',
    color: 'var(--fg)',
    border: '1px solid #545454',
    textDecoration: 'none',
    fontWeight: 400,
    opacity: 1,
  },
  locked: {
    background: 'var(--fg)',
    color: '#ffffff',
    border: '1px solid var(--fg)',
    textDecoration: 'none',
    fontWeight: 700,
    opacity: 1,
  },
  discarded: {
    background: 'transparent',
    color: 'var(--fg-2)',
    border: '1px solid rgba(0,0,0,0.15)',
    textDecoration: 'line-through',
    fontWeight: 400,
    opacity: 0.45,
  },
}

const TITLES = {
  default:   'Click to lock',
  locked:    'Click to discard',
  discarded: 'Click to restore',
}

const STOP = new Set([
  'the','a','an','of','in','at','on','with','and','or','for',
  'from','to','by','into','through','over','under','very','highly',
])

// Strip functional words and present-participle verbs (e.g. "reflecting", "receding")
// to surface the core visual noun/concept.
function distill(text) {
  const words = text.split(' ')
  if (words.length <= 2) return { display: text, truncated: false }

  const filtered = words.filter(w => {
    const lower = w.toLowerCase()
    return !STOP.has(lower) && !/^[a-z]+ing$/i.test(w)
  })

  const pool = filtered.length >= 1 ? filtered : words

  // 3-word tags: if filtering reduced to ≤2, show those; otherwise keep first 2
  if (words.length === 3) {
    const display = pool.slice(0, 2).join(' ')
    const truncated = display !== text
    return { display, truncated }
  }

  // 4+ words: show last two meaningful words (tends to be the noun phrase)
  const slice = pool.length >= 2 ? pool.slice(-2) : pool
  return { display: slice.join(' '), truncated: true }
}

export default function TagChip({ label, state = 'default', onToggle, disabled }) {
  const { display, truncated } = distill(label)
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      title={truncated ? label : TITLES[state]}
      style={{
        ...STYLES[state],
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 16px',
        borderRadius: '15px',
        fontSize: '16px',
        fontFamily: 'var(--font)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 100ms ease',
        userSelect: 'none',
        lineHeight: '22px',
        height: '30px',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.45 : STYLES[state].opacity,
      }}
    >
      {display}
    </button>
  )
}
