# Beautiful Excalidraw

**A library of 35 curated colour palette styles for building beautiful, editable Excalidraw
whiteboards.**

This is a **skill** for AI agents (Claude Code, etc.) that read `SKILL.md`. It is **not** an auto
layout chart tool: **your agent composes the layout**. The templates supply tasteful **colour &
mood**, plus the verified rules of the Excalidraw SVG renderer. The output is a real, editable
`.excalidraw` file you can open at https://excalidraw.com — plus a PNG preview.

> Built from hard-won, empirically verified knowledge of what the excalidraw-cli SVG renderer can
> and cannot do. See [`RULES.md`](RULES.md).

You can also pick any style and ask your agent to "render this content in X style" without
understanding colour at all — the templates are the taste.

---

## Style Catalogue (35 styles)

| Level | Count | Vibe |
|-------|-------|------|
| **Restrained** | 9 | Monochrome, muted, editorial — for serious, quiet boards |
| **Balanced** | 14 | A confident accent on a clean ground — versatile, most work lives here |
| **Bold** | 12 | Loud, maximalist, playful — high-energy, attention-grabbing |

See **[`CATALOG.md`](CATALOG.md)** for the full catalogue with palette signatures.

---

## Usage — What your agent does

Ask your agent something like:

> - "Explain our onboarding workflow as a diagram, clean **cobalt** look."
> - "Turn this doc into a visual diagram, minimal **forest green** aesthetic."
> - "Draw the system architecture, **candy colored and playful**."
> - "I don't care about colour — pick a good one for an org chart."

Your agent will: ask what the board is for and what vibe you want, pick a fitting style from the
catalogue, draw it with native shapes only, render and self-critique the PNG (overflow, margins,
overlaps), then deliver you both the **.excalidraw file** and the **PNG preview**. You can switch
style anytime.

### Check list for your agent

1. **Understand the board** — ask one short question if the goal is unclear.
2. **Ask about the vibe** — what visual style? If no preference, the agent picks one.
3. **Pick a style** from [`CATALOG.md`](CATALOG.md).
4. **Read** [`RULES.md`](RULES.md) and the chosen `templates/<slug>/design.md`.
5. **Build SVG, render PNG, review and fix**, then convert to `.excalidraw`.
6. **Deliver** the `.excalidraw` file and the PNG.

### Key files

- **`RULES.md`** — hard rules of the Excalidraw SVG medium (native shapes only, no gradients, etc.)
  and the exact `excalidraw-cli` commands.
- **`CATALOG.md`** — every style with its palette signature. Use this table to choose.
- **`templates/<slug>/design.md`** — one per style, the full colour palette and mood.

## Prerequisites

- **Node.js** (≥ 20)
- **excalidraw-cli**: `cd <project>/excalidraw-cli && npm install && npm link`
- **No cloud account needed.** Everything runs locally.

## Install as a skill (for your own agent)

Copy the `beautiful-excalidraw` directory into your agent's skills path and register it.

Built on `excalidraw-cli` — the open-source SVG-to-Excalidraw converter.
