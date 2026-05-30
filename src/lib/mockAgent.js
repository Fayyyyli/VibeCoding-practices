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
  DirectDraw: {
    intent: 'A product illustration with clean, centered form on a white studio background.',
    fields: [
      { key: 'subject',     value: 'centered product, clean isolated form',            reviewed: true  },
      { key: 'setting',     value: 'pure white void background',                       reviewed: false },
      { key: 'lighting',    value: 'studio softbox, even diffused light from above',   reviewed: false },
      { key: 'mood',        value: 'clinical, precise, commercial',                    reviewed: false },
      { key: 'composition', value: 'centered, symmetrical framing',                    reviewed: false },
      { key: 'color',       value: 'neutral palette with precise tonal range',         reviewed: false },
      { key: 'detail',      value: 'smooth polished surface quality',                  reviewed: false },
    ],
  },
  Article: {
    intent: 'A cinematic editorial scene with a central figure in a symbolic, atmospheric environment.',
    fields: [
      { key: 'subject',     value: 'central narrative figure',                                       reviewed: false },
      { key: 'setting',     value: 'symbolic environment with textured foreground, receding depth',  reviewed: false },
      { key: 'lighting',    value: 'soft directional daylight with warm ambient fill',               reviewed: false },
      { key: 'mood',        value: 'contemplative, editorial, atmospheric',                          reviewed: false },
      { key: 'composition', value: 'cinematic framing, atmospheric depth, foreground anchor',        reviewed: false },
      { key: 'color',       value: 'muted earthy tones contrasted against cool shadow passages',     reviewed: false },
      { key: 'detail',      value: 'worn material surfaces',                                         reviewed: false },
    ],
  },
  Chitchat: {
    blocked: true,
    message: 'No visual intent detected. Try describing a scene, pasting an article, or giving a draw command.',
  },
}

const DRAW_CMD = /^(draw|paint|generate|create|make|render|show me|give me|画|生成|画一个|给我画|帮我画|来一张|来个)\s+/i

function mockClassify(inputText) {
  const lower = inputText.toLowerCase()
  const words = lower.split(/\s+/)

  // Chitchat: very short with no visual keywords
  if (words.length <= 4 && !/\b(city|forest|warrior|portrait|face|ocean|mountain|abstract|scene|light|dark|color|draw|paint|make|render|create)\b/.test(lower)) {
    return MOCK_BRIEFS.Chitchat
  }

  // DirectDraw: explicit command OR short visual prompt
  if (DRAW_CMD.test(inputText.trim())) return MOCK_BRIEFS.DirectDraw
  const sentenceCount = (inputText.match(/[.!?。！？]+/g) || []).length
  if (sentenceCount <= 1 && words.length <= 20) return MOCK_BRIEFS.DirectDraw

  return MOCK_BRIEFS.Article
}

// ── Normalize API response → internal brief shape ───────────
// The model returns source:"user"|"inferred"; we store reviewed:boolean.
// Handle both so the client is resilient to server version.
function normalizeBrief(brief) {
  if (!Array.isArray(brief?.fields)) return brief
  return {
    ...brief,
    fields: brief.fields.map(({ key, value, source, reviewed }) => ({
      key,
      value,
      reviewed: reviewed !== undefined ? reviewed : source === 'user',
    })),
  }
}

// ── Public API ──────────────────────────────────────────────

export async function generateBrief(inputText, referenceImages = []) {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputText,
        imageDatas: referenceImages,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || `Server error ${res.status}`)
    }

    return normalizeBrief(await res.json())
  } catch (err) {
    // Server unreachable → fall back to mock
    console.warn('[mockAgent] API unavailable, using mock:', err.message)
    await new Promise(r => setTimeout(r, 600))
    if (!inputText?.trim() && referenceImages.length) return MOCK_BRIEFS.DirectDraw
    return mockClassify(inputText)
  }
}
