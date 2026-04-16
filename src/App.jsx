import { useState } from 'react'
import VisionBuilder from './pages/VisionBuilder'
import Canvas from './pages/Canvas'
import { generateBrief } from './lib/mockAgent'

export default function App() {
  // ── Page routing ──────────────────────────────────────────
  const [page, setPage] = useState('builder')   // 'builder' | 'canvas'

  // ── Core state ────────────────────────────────────────────
  const [inputText,      setInputText]      = useState('')
  const [referenceImages, setReferenceImages] = useState([])
  const [brief,          setBrief]          = useState(null)
  const [outputImages,   setOutputImages]   = useState([])
  const [isAnalyzing,    setIsAnalyzing]    = useState(false)
  const [isGenerating,   setIsGenerating]   = useState(false)
  const [genStatus,      setGenStatus]      = useState('')
  const [builtPrompt,    setBuiltPrompt]    = useState('')
  const [sliders,        setSliders]        = useState({ abstractness: 50, detail: 50 })

  // ── Handlers ──────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!inputText.trim()) return
    setIsAnalyzing(true)
    setBrief(null)
    setBuiltPrompt('')
    setOutputImages([])
    try {
      const result = await generateBrief(inputText)
      setBrief(result)
      if (!result.blocked) setBuiltPrompt(result.prompt ?? '')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    setPage('canvas')
    await runGeneration()
  }

  const handleRegenerate = () => runGeneration()

  const runGeneration = async (promptOverride = null) => {
    const prompt = promptOverride ?? builtPrompt
    setIsGenerating(true)
    setOutputImages([])
    setGenStatus('Generating image...')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageDatas: referenceImages.length ? referenceImages : null }),
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

  const handleSliderChange = (key, value) => {
    setSliders({ ...sliders, [key]: value })
  }

  // ── Render ────────────────────────────────────────────────

  if (page === 'canvas') {
    return (
      <Canvas
        brief={brief}
        builtPrompt={builtPrompt}
        onPromptChange={setBuiltPrompt}
        outputImages={outputImages}
        isGenerating={isGenerating}
        genStatus={genStatus}
        sliders={sliders}
        onSliderChange={handleSliderChange}
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
      builtPrompt={builtPrompt}
      onPromptChange={setBuiltPrompt}
      isGenerating={isGenerating}
      onGenerate={handleGenerate}
    />
  )
}
