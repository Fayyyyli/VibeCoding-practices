import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a Full-Intent Visual Translator for VibeFrame / NanoBanana. Your job is to decode any user input and produce a single professional English image-generation prompt. Return ONLY valid JSON — no markdown, no explanation.

STEP 1 — DRAW COMMAND CHECK (before anything else):
Scan input for: draw, paint, make, render, generate, create, 画, 生成, 画一个, 给我画, 帮我画, 来一张, 来个
If ANY match → intentType = "DirectDraw".

STEP 2 — CLASSIFY REMAINING:
- 3+ sentences / article / structured prose → "Article"
- Short visual description (1-2 sentences) → "DirectDraw"
- Pure small talk / zero visual intent → "Chitchat"

OUTPUT:

For Chitchat:
{"intentType":"Chitchat","blocked":true,"message":"<short redirect in same language as input>"}

For Article or DirectDraw:
{"intentType":"Article"|"DirectDraw","blocked":false,"prompt":"<full English prompt>"}

PROMPT GENERATION RULES — apply ALL of these:

1. FULL VISUAL SCAN: Extract every spatial, material, contrast, and metaphorical cue. Never omit elements that imply depth, texture, or atmosphere.

2. ART CONTEXT ALIGNMENT — detect the artistic register and anchor accordingly:
   - Emotional / narrative text → cinematic composition language, storytelling framing
   - Art-specific terms (impasto, chiaroscuro, etc.) → reinforce genre technique and brushwork
   - Physical object descriptions → emphasize material qualities (roughness, reflectivity, translucency)

3. PROMPT STRUCTURE (always follow this order):
   [Style Anchor] + [Subject Details] + [Spatial Structure & Depth] + [Atmospheric & Lighting Logic]

4. DEPTH PROTECTION: If input mentions direction or depth (through, beyond, deep within, background, distance, horizon, receding), wrap that element with weight syntax: (element:1.4) or higher.

5. WEIGHT COMPENSATION: Match intensity to input language:
   - Emphatic adjectives (blazing, towering, shattered) → (term:1.5)
   - Subtle qualifiers (faint, distant, slight) → (term:0.8)
   - Neutral terms → no weight modifier

6. CHROMATIC BALANCE: If warm/cool contrast exists, include both sides. Never flatten opposing colors into one.

7. QUALITY TAIL: End every prompt with: high resolution, accurate lighting, 1024x1024

8. ROBUSTNESS: Whether input is a single emoji, a haiku, a technical article, or a cinematic description — always produce a coherent, maximally expressive prompt. No placeholders.`

app.post('/api/analyze', async (req, res) => {
  const { inputText } = req.body
  if (!inputText?.trim()) {
    return res.status(400).json({ error: 'inputText is required' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: inputText },
        { role: 'assistant', content: '{' },  // prefill forces raw JSON, no code fences
      ],
    })

    // Prepend the '{' we used as prefill
    const raw = '{' + message.content[0].text.trim()
    const brief = JSON.parse(raw)
    res.json(brief)
  } catch (err) {
    console.error('Claude API error:', err.message)
    res.status(500).json({ error: 'Analysis failed', detail: err.message })
  }
})

// ── /api/generate — Gemini image generation ──────────────────
app.post('/api/generate', async (req, res) => {
  const { prompt, imageDatas } = req.body
  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'prompt is required' })
  }

  try {
    // Build multimodal parts array — text first, then up to 4 reference images
    const parts = [{ text: prompt }]

    if (Array.isArray(imageDatas)) {
      for (const imageData of imageDatas) {
        const match = imageData?.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } })
        }
      }
    }

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    )

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}))
      throw new Error(err.error?.message || `Gemini API error ${apiRes.status}`)
    }

    const data = await apiRes.json()
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)

    if (!imagePart) {
      throw new Error('No image returned — prompt may have been blocked or model unavailable')
    }

    const { mimeType, data: b64 } = imagePart.inlineData
    res.json({ imageUrl: `data:${mimeType};base64,${b64}` })
  } catch (err) {
    console.error('Gemini generate error:', err.message)
    res.status(500).json({ error: 'Generation failed', detail: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`VibeFrame server → http://localhost:${PORT}`))
