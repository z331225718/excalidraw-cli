# Excalidraw SVG — Medium Rules

These apply to **every** board, regardless of template. A template gives you a **color palette
and a mood**; this file is the **hard limits of the medium**.

## Hard rules

- **One font.** The board uses Helvetica (clean sans-serif, suitable for serious reports). Never set
  `font-family`. The SVG route defaults to this; the DSL route uses `fontFamily: 2`.
- **Text lives in `<text>`** — never outline glyphs as `<path>`. `<tspan>` is not yet supported by
  excalidraw-cli.
- **XML special characters MUST be escaped in `<text>` content.** `&` → `&amp;`, `<` → `&lt;`,
  `>` → `&gt;`. A raw `&` in text causes sharp to crash with `xmlParseEntityRef: no name`.
  **Pre-render self-check:** `grep -n '&' <dir>/diagram.svg | grep -v '&amp;\|&lt;\|&gt;\|&\#\|&quot;'`
  — every hit is a crash waiting to happen. Avoid `&` in text by writing "与" / "和" / "and"
  instead, or use `&amp;`.
- **Shape vocabulary is native-only — a rectangles-and-circles tool.** Build everything from
  `<rect>` (sharp or rounded `rx`), `<circle>`, `<ellipse>`, straight `<line>` / `<polyline>`
  connectors, and `<text>` — these become real editable shapes. `<polygon>` and any curved/bezier
  `<path>` are not yet supported by excalidraw-cli — they will be skipped. **No freeform / organic /
  illustrative shapes** (blobs, leaves, petals, waves, coral, fans, flowers, stars, confetti,
  doodles, mascots, "hand-cut" silhouettes). Keep it geometric.
- **Arrows = `<line>` or `<polyline>` with `marker-end`.** To put an arrowhead on a line, give the
  `<line>` or `<polyline>` a **`marker-end`** pointing at a `<marker>` in `<defs>`:
  ```svg
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5"
            orient="auto"><polygon points="0 0, 10 3.5, 0 7"/></marker>
  </defs>
  <line x1="100" y1="80" x2="360" y2="80" stroke="#555" stroke-width="2" marker-end="url(#arrow)"/>
  ```
- **Forbidden** (break or render incorrectly on Excalidraw): any `<radialGradient>`, `<filter>`,
  `<pattern>`, `<clipPath>`, `<mask>`. Use flat fills only.
- **No `<use>` or `<symbol>`** — these are not supported by excalidraw-cli.
- **Transforms:** `translate` on `<g>` is supported. Avoid `rotate`, `scale`,
  `skewX`, `skewY`, `matrix(...)` on groups — apply them directly on individual elements.
- **No fixed canvas.** No 16:9, no scaler. Work in a logical coordinate space (≈1600–1700 wide) and
  let content define the bounds.
- **Text size matters.** Pad boxes generously; never fit text to the pixel; wrap long lines across
  multiple `<text>` elements rather than shrinking.
- **Never echo the user's instructions or your own process onto the board.** The board shows the
  **content** — never the request that produced it, the inputs you read, or how you built it. A
  whiteboard is a finished artifact, not a homework submission. Cut every meta / process line:
  - scope or task notes — _"整理范围：..."_, _"本图涵盖第 3-5 章"_
  - source citations — _"来源：..."_, _"based on the attached doc"_
  - the chosen style / template name — _"风格：Specimen Bold"_
  - audience / format directions, restatements of the prompt, and _"summary of… / 总结自…"_ framing
  - dates, tokens, file paths, or tooling you were not explicitly asked to display
  A **title may name the subject**, but nothing on the board may describe the task or the source
  material. Put that kind of context in your chat reply to the user, never on the canvas.

## Workflow

1. Pick a **template** (`templates/<slug>/design.md`) for the palette + mood, and read it.
2. Pick the narrative shape (pipeline / stages / comparison / system map / timeline) and write the
   SVG in a logical coord space (≈1600–1700 wide); **native shapes only**; every label a `<text>`.
3. **Render and LOOK at it — then fix what you see.** This is the most important step:
   ```bash
   # Create output directory
   mkdir -p ./diagrams/YYYY-MM-DDTHHMMSS/

   # Save SVG
   # (write your SVG to <dir>/diagram.svg)

   # Render PNG for preview
   excalidraw-cli svg2png -i <dir>/diagram.svg -o <dir>/diagram.png -w 1600

   # Convert to editable .excalidraw (final deliverable)
   excalidraw-cli convert -i <dir>/diagram.svg -o <dir>/diagram.excalidraw
   ```
   - **Open `diagram.png` and actually view it.** Correct the common problems:
     - **text overflow** — text spilling out of its box or past the canvas edge,
     - **margins / padding** — content flush to the canvas edge, or a numeral/title touching a box's
       top/side with no breathing room,
     - **overlaps** — shapes or labels colliding unintentionally,
     - **clipping** — anything cut off on the right/bottom.
   - **Fix by editing the `.svg` in place with small targeted edits** (nudge a box, widen a panel,
     rewrap a label) — never regenerate the whole SVG to fix a local issue, and apply every fix you
     spotted in one view in a single edit pass before re-rendering. Iterate render → look → fix
     until it's clean (max 2 rounds).
   - **Before the first render, run this pre-flight check to catch XML crashes early:**
     ```bash
     grep -n '&' <dir>/diagram.svg | grep -v '&amp;\|&lt;\|&gt;\|&\#\|&quot;\|marker'
     ```
     If it prints anything, those `&` are unescaped and will crash sharp. Replace them with `&amp;`
     (or reword the text to avoid `&`).
4. **Deliver** both files:
   - `diagram.excalidraw` — the user opens this at https://excalidraw.com to edit interactively
   - `diagram.png` — instant preview
