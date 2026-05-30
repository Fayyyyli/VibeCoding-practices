import { useState } from 'react'
import NavBar from '../components/NavBar'
import InputPanel from '../components/InputPanel'
import BriefPanel from '../components/BriefPanel'

export default function VisionBuilder({
  inputText, setInputText,
  referenceImages, onImagesChange,
  isAnalyzing, onAnalyze,
  brief, fragments, onBriefChange,
  outputSettings, onOutputSettingsChange,
  imageGenerationEnabled,
  isGenerating, onGenerate,
}) {
  const [activeTab, setActiveTab] = useState('text')
  const [isDragOver, setIsDragOver] = useState(false)

  const hasAnalysis = brief !== null
  const canAnalyze = !isAnalyzing && (inputText.trim().length > 0 || referenceImages.length > 0)

  return (
    <div className="page">
      <NavBar activePage="briefs" />

      <main className={`vf-split${hasAnalysis ? ' vf-split--active' : ''}`}>

        {/* ── Vision Input ── */}
        <div className="vf-split-left">
          <div className="vf-col-header">
            <span className="vf-label" style={{ marginBottom: 0 }}>Vision Input</span>
            <div className="vf-tabs" style={{ position: 'absolute', right: 0 }}>
              <button
                className={`vf-tab${activeTab === 'text' ? ' vf-tab-active' : ''}`}
                onClick={() => setActiveTab('text')}
              >Text</button>
              <button
                className={`vf-tab${activeTab === 'image' ? ' vf-tab-active' : ''}`}
                onClick={() => setActiveTab('image')}
              >Image</button>
            </div>
          </div>

          <InputPanel
            inputText={inputText}
            setInputText={setInputText}
            activeTab={activeTab}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            referenceImages={referenceImages}
            onImagesChange={onImagesChange}
          />

          {/* Analyze button only shown before first analysis */}
          {!hasAnalysis && (
            <div className="vf-col-action">
              <button
                className="btn btn-primary"
                onClick={onAnalyze}
                disabled={!canAnalyze}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          )}
        </div>

        {/* ── Analysis — only shown after first analyze ── */}
        {hasAnalysis && (
          <div className="vf-split-right">
            <div className="vf-col-header">
              <span className="vf-label" style={{ marginBottom: 0 }}>Visual Brief</span>
            </div>

            <BriefPanel
              brief={brief}
              fragments={fragments}
              onBriefChange={onBriefChange}
              outputSettings={outputSettings}
              onOutputSettingsChange={onOutputSettingsChange}
            />

            {/* Re-analyze + Generate side by side */}
            <div className="vf-col-action" style={{ gap: '50px' }}>
              <button
                className="btn btn-outline"
                onClick={onAnalyze}
                disabled={!canAnalyze}
              >
                {isAnalyzing ? 'Analyzing...' : 'Reframe'}
              </button>
              {!brief.blocked && (
                imageGenerationEnabled ? (
                  <button
                    className="btn btn-primary"
                    onClick={onGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate →'}
                  </button>
                ) : (
                  <p className="vf-generate-disabled">
                    VibeFrame's output is this structured prompt — ready to paste into any image model.
                    Image generation is turned off in this public demo.
                  </p>
                )
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
