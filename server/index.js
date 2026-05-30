import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config()

const app = express()
app.use(express.json({ limit: '20mb' }))

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You convert a user's creative request into a structured Visual Brief for an image-generation tool. You do TWO things only:

1. Write a one-sentence plain-English restatement of what you understand the user wants. No jargon. This is shown to the user to confirm you understood.

2. Produce a structured brief as a list of fields. For each field, decide whether its value came FROM THE USER or was INFERRED BY YOU.

FIELDS (always return all seven, in this order):
  subject       — the main focus
  setting       — environment, location, background
  lighting      — light quality, direction, time of day
  mood          — emotional tone, atmosphere
  composition   — framing, perspective, focal arrangement
  color         — palette, dominant hues, contrast
  detail        — rendering quality, level of detail, finish

PROVENANCE RULE — this is the most important part:
- "user"     = the user explicitly stated this, OR it is a direct, unambiguous restatement of their words (light rewording is fine; "a lone warrior" -> subject "lone warrior" stays "user").
- "inferred" = you are adding information the user did not state, even if it is a reasonable elaboration of something they implied. Anything you invent, default to, or creatively extend is "inferred."
- WHEN UNSURE, choose "inferred." Never claim the user said something they did not. Under-claiming user authorship is acceptable; over-claiming is not.
- A field can be "inferred" even when seeded by the user: if the user said "dying sun" and you render that as "dim amber backlight with cool ash haze," the specific lighting design is YOUR addition -> "inferred."

OUTPUT FORMAT:
Return ONLY valid JSON, no markdown, no code fences, no commentary:
{
  "intent": "string",
  "fields": [
    { "key": "subject", "value": "string", "source": "user" | "inferred" },
    ... all seven fields ...
  ]
}

WORKED EXAMPLE
User input: "a lone warrior stands at the edge of a crumbling fortress as volcanic ash clouds swallow the dying sun"

{
  "intent": "A lone warrior at the edge of a crumbling fortress, with volcanic ash clouds blotting out a setting sun.",
  "fields": [
    { "key": "subject", "value": "a lone warrior, battle-worn, resolute", "source": "user" },
    { "key": "setting", "value": "edge of a crumbling fortress, volcanic ash clouds, a dying sun on the horizon", "source": "user" },
    { "key": "lighting", "value": "dim amber backlight from the low sun, diffused through heavy ash haze", "source": "inferred" },
    { "key": "mood", "value": "apocalyptic, desolate, quietly defiant", "source": "inferred" },
    { "key": "composition", "value": "warrior silhouetted against the sun, wide cinematic framing, high contrast", "source": "inferred" },
    { "key": "color", "value": "warm amber against muted grey-brown ash tones", "source": "inferred" },
    { "key": "detail", "value": "high resolution, sharp, realistic texture", "source": "inferred" }
  ]
}

Note how most fields are "inferred" here — the user gave a short prompt, so you filled the gaps. That is correct and honest. Do not inflate "user" counts.`

// "deepseek" (default) | "haiku" — flip in .env to switch models
const ANALYSIS_MODEL = (process.env.ANALYSIS_MODEL ?? 'deepseek').toLowerCase()

const REQUIRED_KEYS = ['subject', 'setting', 'lighting', 'mood', 'composition', 'color', 'detail']

// Tolerates both bare JSON and ```json fenced responses (safety net for Haiku fallback)
function parseJson(raw) {
  let text = raw.trim()
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  if (fence) text = fence[1].trim()
  return JSON.parse(text)
}

function validateBrief(raw) {
  const intent = typeof raw.intent === 'string' ? raw.intent.trim() : ''
  const inputFields = Array.isArray(raw.fields) ? raw.fields : []
  const fieldMap = Object.fromEntries(inputFields.map(f => [f?.key, f]))

  const fields = REQUIRED_KEYS.map(key => {
    const f = fieldMap[key]
    return {
      key,
      value: typeof f?.value === 'string' ? f.value.trim() : '',
      reviewed: f?.source === 'user',   // user-stated → already endorsed; inferred → needs review
    }
  })

  return { intent, fields }
}

// Parse an array of data URIs into { mimeType, data } objects
function parseDataUris(dataUris) {
  if (!Array.isArray(dataUris)) return []
  return dataUris.flatMap(uri => {
    const match = uri?.match(/^data:([^;]+);base64,(.+)$/)
    return match ? [{ mimeType: match[1], data: match[2] }] : []
  })
}

app.post('/api/analyze', async (req, res) => {
  const { inputText, imageDatas } = req.body
  if (!inputText?.trim() && !imageDatas?.length) {
    return res.status(400).json({ error: 'inputText or imageDatas is required' })
  }

  try {
    const parsedImages = parseDataUris(imageDatas)
    const textContent = inputText?.trim()
      ? (parsedImages.length
          ? `User input (mode: text + image reference):\n"""\n${inputText.trim()}\n"""\n[${parsedImages.length} reference image(s) attached — use for visual style, color, mood reference only]`
          : `User input (mode: text):\n"""\n${inputText.trim()}\n"""`)
      : `User input (mode: image):\n[${parsedImages.length} image(s) attached — extract their visual essence for the brief fields]`

    let rawText

    if (ANALYSIS_MODEL === 'haiku') {
      // ── Haiku path (Anthropic SDK, supports multimodal images) ──
      const userContent = parsedImages.map(({ mimeType, data }) => ({
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data },
      }))
      userContent.push({ type: 'text', text: textContent })

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        temperature: 0.3,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userContent },
          { role: 'assistant', content: '{' },  // prefill forces JSON start
        ],
      })
      rawText = '{' + message.content[0].text.trim()
    } else {
      // ── DeepSeek path (OpenAI-compatible, text only) ──
      const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          temperature: 0.3,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: textContent },
          ],
        }),
      })
      if (!dsRes.ok) {
        const err = await dsRes.json().catch(() => ({}))
        throw new Error(err.error?.message || `DeepSeek API error ${dsRes.status}`)
      }
      const dsData = await dsRes.json()
      rawText = dsData.choices?.[0]?.message?.content ?? ''
    }

    const brief = validateBrief(parseJson(rawText))
    res.json(brief)
  } catch (err) {
    console.error('Analysis error:', err.message)
    res.status(500).json({ error: 'Analysis failed', detail: err.message })
  }
})

// ── /api/generate — Gemini image generation ──────────────────
app.post('/api/generate', async (req, res) => {
  const { prompt, imageDatas, outputSettings } = req.body
  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'prompt is required' })
  }

  try {
    const parts = [
      { text: prompt },
      ...parseDataUris(imageDatas).map(({ mimeType, data }) => ({ inlineData: { mimeType, data } })),
    ]

    const imageConfig = {}
    if (outputSettings?.aspectRatio) imageConfig.aspectRatio = outputSettings.aspectRatio
    if (outputSettings?.imageSize)   imageConfig.imageSize   = outputSettings.imageSize

    const generationConfig = {
      responseModalities: ['IMAGE'],
      ...(Object.keys(imageConfig).length ? { imageConfig } : {}),
    }

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig,
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

// ── Serve built frontend (production) ────────────────────────
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`VibeFrame server → http://localhost:${PORT}`))
