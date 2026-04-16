/**
 * promptBuilder.js — passthrough.
 *
 * The server now generates the full English prompt directly.
 * This function just extracts it from the brief for backwards-compatible calls.
 */
export function buildPrompt(brief) {
  if (!brief || brief.blocked) return ''
  return brief.prompt ?? ''
}
