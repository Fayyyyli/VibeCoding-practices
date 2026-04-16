/**
 * OutputPanel — generated image display (Step 2)
 * States: empty / generating (skeleton + status) / loaded / error
 */
export default function OutputPanel({ outputImages, isGenerating, genStatus }) {
  const imageUrl = outputImages[0] ?? null
  const hasError = genStatus?.startsWith('Generation failed')

  return (
    <div className="vf-output">
      {/* Status line */}
      {(isGenerating || genStatus) && (
        <div style={{
          padding: '10px 24px',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          color: hasError ? '#e05c5c' : 'var(--fg-3)',
          borderBottom: '1px solid var(--border-card)',
          flexShrink: 0,
        }}>
          {genStatus || 'Generating image...'}
        </div>
      )}

      {/* Image area */}
      <div className="vf-image-area">
        {isGenerating ? (
          <div className="vf-img-skeleton vf-img-skeleton-full" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Generated"
          />
        ) : hasError ? (
          <div className="vf-img-empty" style={{ flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚠</span>
            <span style={{ fontSize: '12px', color: 'var(--fg-3)', textAlign: 'center', maxWidth: '260px' }}>
              {genStatus}
            </span>
          </div>
        ) : (
          <div className="vf-img-empty">
            <span style={{ fontSize: '12px', color: 'var(--fg-3)' }}>Output will appear here</span>
          </div>
        )}
      </div>
    </div>
  )
}
