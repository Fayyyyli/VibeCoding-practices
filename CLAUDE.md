# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

No test runner or linter is configured yet.

## Architecture

VibeFrame is a React (Vite) single-page app with no backend. The core idea is a three-stage pipeline:

```
User input → Visual Brief (structured JSON) → Assembled prompt → Image output
```

**Page routing:** A single `page` state in `App.jsx` (`'builder' | 'canvas'`) controls which page renders. No router library.

**State ownership:** All application state lives in `App.jsx` and is passed down as props. There is no context, no external state library.

**The two critical lib functions** (both are clean swap points for real APIs later):

- `src/lib/mockAgent.js` — `generateBrief(inputText)` simulates an LLM call. Keyword-matches the input to return one of three hardcoded `BRIEFS` objects (Narrative / Atmospheric / Architectural) after an 800ms delay. Replace this with a real Claude API call when ready.
- `src/lib/promptBuilder.js` — `buildPrompt(brief, tagStates)` is a pure function that assembles the final image-gen prompt string from the brief JSON + current tag states. Called reactively via `useEffect` on every `tagStates` change in `App.jsx`.

**Visual Brief data shape:**
```js
{
  intentType: 'Narrative' | 'Atmospheric' | 'Architectural',
  subject: string[],
  vibe: string[],
  lighting: string[],
  composition: string[],
  camera: string[],
}
```

**Tag state machine:** Each tag cycles `default → locked → discarded → default` on click. `locked` tags get `(tag:1.4)` weight syntax in the prompt. `discarded` tags are excluded. State is stored as a flat object `{ [tagLabel]: 'default' | 'locked' | 'discarded' }` in `App.jsx`.

**Mock images:** `picsum.photos` seeds are derived from a djb2 hash of the assembled prompt + slider values, so different prompts/slider positions yield visually distinct placeholder images.

## Page structure

```
src/
├── App.jsx                   # all state + page routing
├── pages/
│   ├── VisionBuilder.jsx     # Step 1: two-column (InputPanel | BriefPanel + Generate CTA)
│   └── Canvas.jsx            # Step 2: collapsible Sidebar + OutputPanel
└── components/
    ├── Sidebar.jsx            # collapsible left panel for Canvas (BriefPanel + sliders + refine)
    ├── BriefPanel.jsx         # pure tag editor — no action buttons, used in both pages
    ├── TagChip.jsx            # tag with 3 states: default / locked (inverted) / discarded
    ├── InputPanel.jsx         # text input + tab switcher + Analyze button
    └── OutputPanel.jsx        # 2×2 image grid, three states: empty / skeleton / loaded
```

## Design System

`DESIGN.md` (project root) defines the Framer-inspired visual language. The current UI is **Minimal** (intentionally sparse for Figma handoff):
- Background: `#0F0F0F`, text: `#FFFFFF` / `#888888`
- All borders: `1px solid rgba(255,255,255,0.1)` — no shadows, no gradients
- Buttons: white solid (primary CTA only) or transparent + 1px border
- System font: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui`
- All CSS tokens live in `:root` in `src/index.css`; class prefix is `vf-`

## Stack

- React 18 + Vite 5 (Node 18 compatible — **do not upgrade to Tailwind v4**, requires Node 20+)
- Tailwind CSS v3 with PostCSS (configured via `postcss.config.js` + `tailwind.config.js`)
- No routing, no backend, no auth
