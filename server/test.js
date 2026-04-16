import dotenv from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'
dotenv.config()

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const msg = await client.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 256,
  system: 'Return ONLY a raw JSON object. No backticks. No markdown. No explanation. Just the JSON.',
  messages: [{ role: 'user', content: 'a warrior at sunset' }],
})
const raw = msg.content[0].text.trim()
console.log('FIRST 5 CHAR CODES:', [...raw.slice(0,5)].map(c => c.charCodeAt(0)))
console.log('RAW START:', JSON.stringify(raw.slice(0, 80)))
