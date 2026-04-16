import { useState } from 'react'
import NavBar from '../components/NavBar'
import Sidebar from '../components/Sidebar'
import OutputPanel from '../components/OutputPanel'

export default function Canvas({
  brief, builtPrompt, onPromptChange,
  outputImages, isGenerating, genStatus,
  onRegenerate, onBack,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768)

  return (
    <div className="page">
      <NavBar activePage="briefs" />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: '48px',
        borderBottom: '1px solid var(--border-card)',
        flexShrink: 0,
        background: 'var(--bg)',
      }}>
        <button className="btn btn-ghost" style={{ padding: '6px 8px', fontSize: '13px' }} onClick={onBack}>
          ← Back
        </button>
        <span style={{ fontSize: '12px', color: 'var(--fg-3)', marginLeft: '6px', fontFamily: 'var(--font)' }}>
          Canvas
        </span>
        <button
          className="btn btn-ghost vf-mobile-only"
          style={{ marginLeft: 'auto', padding: '6px 8px', fontSize: '13px' }}
          onClick={() => setSidebarOpen(true)}
        >
          Prompt ☰
        </button>
      </div>

      <main className="vf-canvas-layout">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(o => !o)}
          brief={brief}
          builtPrompt={builtPrompt}
          onPromptChange={onPromptChange}
          onRegenerate={onRegenerate}
          isGenerating={isGenerating}
        />
        <OutputPanel
          outputImages={outputImages}
          isGenerating={isGenerating}
          genStatus={genStatus}
        />
      </main>
    </div>
  )
}
