---
name: beautiful-excalidraw
version: 2.0.0
description: >
  A library of 35 curated colour palette styles for building beautiful, editable
  Excalidraw whiteboards from SVG. Use this whenever the user wants to create a
  diagram, infographic, poster, or visual explainer and wants it to look polished,
  on brand, or in a particular aesthetic, or when they name a style. The agent
  figures out what board the user wants, asks about the visual vibe, picks a
  fitting style from the catalogue, generates an .excalidraw file, and delivers
  both the .excalidraw (editable at excalidraw.com) and the rendered PNG.
  Requires excalidraw-cli. Local only — no cloud account needed.
---

# Beautiful Excalidraw

A design system skill: **35 colour palette styles** plus the verified **hard rules** of the
Excalidraw SVG medium, so you can build gorgeous, on brand, _editable_ diagrams.

This is **not** an auto layout chart generator. **You** compose the layout. A template gives you a
**palette and mood**; [`RULES.md`](RULES.md) gives you the medium's hard limits. The board you
produce is a real, editable `.excalidraw` file (open at https://excalidraw.com), plus a PNG preview.

## When to use

- The user wants a diagram, infographic, poster, or visual explainer that should look good,
  branded, or in a specific aesthetic.
- The user names a style, or points at one of the templates.
- The user gives content ("explain X visually", "turn this into a diagram") and wants it
  visual and editable.

## Step 0: prerequisites (check before doing anything)

- **Node.js** and **excalidraw-cli** must be installed. Check:
  `excalidraw-cli --version`
  If missing: `cd <project>/excalidraw-cli && npm install && npm link`
- **No account, no auth, no cloud.** Everything runs locally.

## How to run the conversation

1. **Understand the board.** Find out what the user wants on it: the content, the purpose, the
   audience. If it is unclear, ask one short question before building.
2. **Ask about the vibe.** Ask the user what visual style they want, for example playful or
   professional, any colour or mood preference, or a brand to match. Offer to pick for them if they
   have no preference. If they already named a style, skip ahead.
3. **Pick a style.** Use [`CATALOG.md`](CATALOG.md) to match the content type and the requested vibe
   and formality to one of the 35 styles. The catalogue lists each style's palette signature, so
   **choose from it alone** — don't open several `design.md` files to compare. Tell the user which
   style you chose and why, in one line.
4. **Build it.** Read [`RULES.md`](RULES.md) and **only the one** chosen
   [`templates/<slug>/design.md`](templates/), then:
   - Compose the SVG in a logical space about 1600 to 1700 wide, in that palette, with **native
     shapes only** (rect, rounded rect, circle, ellipse, connectors, text). Lay the content out
     however reads best. Every label is a `<text>`; never set `font-family`.
   - **Only the content goes on the board, never the instruction behind it.** Do not print the
     user's prompt, scope notes, source citations, the chosen style name, or any "summary of… /
     来源… / 风格…" meta line onto the canvas — that looks like a homework header. Such context
     belongs in your chat reply.
   - **Render it, then look at the image and correct yourself**: fix text overflow, tight margins or
     padding, numerals touching edges, accidental overlaps, and clipping. Iterate render, view, fix
     until it is clean. (Commands and the full checklist are in `RULES.md`.)
   - **When fixing, edit the `.svg` file in place with small targeted edits** (move a box, widen a
     panel, rewrap a label) — do not regenerate the whole SVG each pass; and batch the fixes you see
     in one view into a single edit pass before re-rendering.
   - Export as `.excalidraw` for editing, plus a `.png` for preview.
5. **Deliver.** Give the user **both**: the **.excalidraw file** (open at https://excalidraw.com) and
   the **rendered PNG** so they can see it immediately. Then tell them they can **switch to a
   different style** any time, and you will re-render the same content in the new palette.

## Files

- **[`RULES.md`](RULES.md)**: the hard rules and the exact build, render, and verify commands. Always
  read this.
- **[`CATALOG.md`](CATALOG.md)**: every style with its vibe, formality, and what it is good for. Use
  it to choose.
- **[`templates/<slug>/design.md`](templates/)**: one per style, the colour palette and how to use it.
- **[`scripts/preflight.sh`](scripts/preflight.sh)**: dependency check.
