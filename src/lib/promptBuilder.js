const FIELD_ORDER = ['subject', 'setting', 'lighting', 'mood', 'composition', 'color', 'detail']

export function buildPrompt(fields) {
  if (!fields?.length) return { prompt: '', fragments: [] }

  const fragments = FIELD_ORDER
    .map(key => fields.find(f => f.key === key))
    .filter(f => f?.value?.trim())
    .map(f => ({ key: f.key, text: f.value.trim() }))

  if (!fragments.length) return { prompt: '', fragments: [] }

  return { prompt: fragments.map(f => f.text).join(', '), fragments }
}
