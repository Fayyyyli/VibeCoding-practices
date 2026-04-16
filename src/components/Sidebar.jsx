import BriefPanel from './BriefPanel'

export default function Sidebar({
  open, onToggle,
  brief, builtPrompt, onPromptChange,
  onRegenerate, isGenerating,
}) {
  return (
    <>
      <div className={`vf-sidebar-overlay ${open ? 'vf-sidebar-overlay-open' : ''}`} onClick={onToggle} />
      <aside className={`vf-sidebar ${open ? 'vf-sidebar-open' : 'vf-sidebar-closed'}`}>

        {/* Header — always visible */}
        <div className="vf-sidebar-header">
          {open && <span className="vf-label" style={{ margin: 0, fontSize: '13px' }}>Prompt</span>}
          <button
            className="btn btn-ghost btn-sm"
            onClick={onToggle}
            style={{ marginLeft: 'auto', padding: '4px 8px' }}
          >
            {open ? '←' : '→'}
          </button>
        </div>

        {open && (
          <>
            {/* Scrollable: intent + prompt editor */}
            <div className="vf-sidebar-brief">
              <BriefPanel
                brief={brief}
                builtPrompt={builtPrompt}
                onPromptChange={onPromptChange}
                compact
                disabled={isGenerating}
              />
            </div>

            {/* Fixed bottom: regenerate */}
            <div className="vf-sidebar-bottom">
              <div style={{ width: '100%', margin: '20px 0 0' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '15px', padding: '18px 24px', marginBottom: '24px' }}
                  onClick={onRegenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Regenerate →'}
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
