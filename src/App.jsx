import { useState, useEffect } from 'react'
import VisionBuilder from './pages/VisionBuilder'
import Canvas from './pages/Canvas'
import { generateBrief } from './lib/mockAgent'
import { buildPrompt } from './lib/promptBuilder'

export default function App() {
  // ── Page routing ──────────────────────────────────────────
  const [page, setPage] = useState('builder')

  // ── Core state ────────────────────────────────────────────
  const [inputText,       setInputText]       = useState('')
  const [referenceImages, setReferenceImages] = useState([])
  const [brief,           setBrief]           = useState(null)
  const [outputImages,    setOutputImages]    = useState([])
  const [isAnalyzing,     setIsAnalyzing]     = useState(false)
  const [isGenerating,    setIsGenerating]    = useState(false)
  const [genStatus,       setGenStatus]       = useState('')
  const [builtPrompt,     setBuiltPrompt]     = useState('')
  const [builtFragments,  setBuiltFragments]  = useState([])
  const [outputSettings,         setOutputSettings]         = useState({ aspectRatio: '1:1', imageSize: '1K' })
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false)

  // ── Fetch runtime config ──────────────────────────────────
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => setImageGenerationEnabled(cfg.imageGenerationEnabled ?? false))
      .catch(() => setImageGenerationEnabled(false))
  }, [])

  // ── Rebuild prompt whenever brief changes ─────────────────
  useEffect(() => {
    if (!brief || brief.blocked) {
      setBuiltPrompt('')
      setBuiltFragments([])
      return
    }
    const { prompt, fragments } = buildPrompt(brief.fields)
    setBuiltPrompt(prompt)
    setBuiltFragments(fragments)
  }, [brief])

  // ── Handlers ──────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!inputText.trim() && !referenceImages.length) return
    setIsAnalyzing(true)
    setBrief(null)
    setBuiltPrompt('')
    setBuiltFragments([])
    setOutputImages([])
    try {
      const result = await generateBrief(inputText, referenceImages)
      setBrief(result)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleBriefChange = (updatedBrief) => setBrief(updatedBrief)

  const handleGenerate = async () => {
    setPage('canvas')
    await runGeneration()
  }

  const handleRegenerate = () => runGeneration()

  const runGeneration = async () => {
    setIsGenerating(true)
    setOutputImages([])
    setGenStatus('Generating image...')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: builtPrompt,
          imageDatas: referenceImages.length ? referenceImages : null,
          outputSettings,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const { imageUrl } = await res.json()
      setOutputImages([imageUrl])
      setGenStatus('')
    } catch (err) {
      console.error('Generation error:', err)
      setGenStatus(`Generation failed: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Render ────────────────────────────────────────────────

  if (page === 'canvas') {
    return (
      <Canvas
        brief={brief}
        fragments={builtFragments}
        onBriefChange={handleBriefChange}
        outputSettings={outputSettings}
        onOutputSettingsChange={setOutputSettings}
        outputImages={outputImages}
        isGenerating={isGenerating}
        genStatus={genStatus}
        onRegenerate={handleRegenerate}
        onBack={() => setPage('builder')}
      />
    )
  }

  return (
    <VisionBuilder
      inputText={inputText}
      setInputText={setInputText}
      referenceImages={referenceImages}
      onImagesChange={setReferenceImages}
      isAnalyzing={isAnalyzing}
      onAnalyze={handleAnalyze}
      brief={brief}
      fragments={builtFragments}
      onBriefChange={handleBriefChange}
      outputSettings={outputSettings}
      onOutputSettingsChange={setOutputSettings}
      imageGenerationEnabled={imageGenerationEnabled}
      isGenerating={isGenerating}
      onGenerate={handleGenerate}
    />
  )
}
