/**
 * mockAgent.js — Visual Intent Classification
 *
 * Calls the local Express server → Claude API.
 * Falls back to keyword-based mock if the server is unreachable.
 *
 * Swap point: the /api/analyze endpoint can be moved to any backend.
 */

// ── Mock fallback (used when server is unreachable) ─────────

const MOCK_BRIEFS = {
  Article: {
    intentType: 'Article',
    blocked: false,
    prompt: 'cinematic editorial illustration, central narrative figure amid symbolic environment, textured foreground surface anchoring the scene, (receding atmospheric depth:1.4), soft directional daylight with warm ambient fill, muted earthy tones contrasted against cool shadow passages, worn material surfaces, high resolution, accurate lighting, 1024x1024',
  },
  DirectDraw: {
    intentType: 'DirectDraw',
    blocked: false,
    prompt: 'product illustration, centered subject with clean isolated form, (pure white void background:1.4), studio softbox lighting, even diffused light, neutral palette with precise tonal range, smooth polished surface quality, high resolution, accurate lighting, 1024x1024',
  },
}

const DRAW_CMD = /^(draw|paint|generate|create|make|render|show me|give me|画|生成|画一个|给我画|帮我画|来一张|来个)\s+/i

function mockClassify(inputText) {
  const lower = inputText.toLowerCase()
  const words = lower.split(/\s+/)

  // Chitchat: very short with no visual keywords
  if (words.length <= 4 && !/\b(city|forest|warrior|portrait|face|ocean|mountain|abstract|scene|light|dark|color|draw|paint|make|render|create)\b/.test(lower)) {
    return { intentType: 'Chitchat', blocked: true, message: 'No visual intent detected. Try describing a scene, pasting an article, or giving a draw command.' }
  }

  // DirectDraw: explicit command OR short visual prompt
  if (DRAW_CMD.test(inputText.trim())) return MOCK_BRIEFS.DirectDraw
  const sentenceCount = (inputText.match(/[.!?。！？]+/g) || []).length
  if (sentenceCount <= 1 && words.length <= 20) return MOCK_BRIEFS.DirectDraw

  return MOCK_BRIEFS.Article
}

// ── Public API ──────────────────────────────────────────────

export async function generateBrief(inputText) {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || `Server error ${res.status}`)
    }

    return await res.json()
  } catch (err) {
    // Server unreachable (no .env key, server not running) → fall back to mock
    console.warn('[mockAgent] API unavailable, using mock:', err.message)
    await new Promise(r => setTimeout(r, 600))
    return mockClassify(inputText)
  }
}
