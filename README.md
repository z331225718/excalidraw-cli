# excalidraw-cli

CLI tool to convert SVG to [Excalidraw](https://excalidraw.com) format and render to PNG.  
Open-source alternative to `@larksuite/whiteboard-cli` for teams that can't use Feishu.

## Features

- **SVG → .excalidraw** — convert SVG diagrams to editable Excalidraw files
- **SVG → PNG** — render SVG directly to PNG via sharp (no browser needed)
- **.excalidraw → PNG** — render Excalidraw files to PNG images
- **Zero native deps** — sharp has prebuilt binaries for Windows/macOS/Linux
- **AI-friendly** — clean CLI interface, perfect for AI agent automation

## Install

```bash
git clone https://github.com/<user>/excalidraw-cli.git
cd excalidraw-cli
npm install
npm link        # optional: makes `excalidraw-cli` globally available
```

## Quick Start

```bash
# SVG → editable Excalidraw file
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw

# SVG → PNG (one step)
excalidraw-cli svg2png -i diagram.svg -o diagram.png

# .excalidraw → PNG
excalidraw-cli render -i diagram.excalidraw -o diagram.png
```

Open `.excalidraw` files at https://excalidraw.com to edit interactively.

## Commands

### `convert` — SVG → .excalidraw

```
excalidraw-cli convert -i <input.svg> -o <output.excalidraw>
```

Parses SVG elements and maps them to Excalidraw's element model. The output is a
valid `.excalidraw` JSON file that can be opened at excalidraw.com for editing.

### `svg2png` — SVG → PNG

```
excalidraw-cli svg2png -i <input.svg> -o <output.png>
```

Renders SVG directly to PNG using [sharp](https://sharp.pixelplumbing.com/).  
Automatically scales to fit within max width.

### `render` — .excalidraw → PNG

```
excalidraw-cli render -i <input.excalidraw> -o <output.png>
```

Renders a `.excalidraw` file to PNG. If the file was created by `convert` and
contains an embedded `_svgSource`, the render is pixel-perfect. Otherwise, a
placeholder with export instructions is generated.

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input` | Input file path | (required) |
| `-o, --output` | Output file path | (required) |
| `-w, --width` | Max width for PNG output | `1600` |
| `-b, --background` | Background color (hex) | `#ffffff` |
| `-f, --format` | Output format for convert: `json` or `png` | `json` |

## Supported SVG Elements

| SVG Element | Excalidraw Element | Notes |
|-------------|-------------------|-------|
| `<rect>` | `rectangle` | Supports `rx` for rounded corners |
| `<circle>` | `ellipse` | `cx`, `cy`, `r` mapped to ellipse bounds |
| `<ellipse>` | `ellipse` | Full support |
| `<line>` | `line` or `arrow` | `marker-end` → arrowhead |
| `<polyline>` | `line` (multi-point) | `marker-end` → arrowhead |
| `<text>` | `text` | Font size, color, text-anchor alignment |
| `<g transform="translate()">` | Group transform | Nested groups accumulate transforms |

### Not yet supported

| SVG Element | Status |
|-------------|--------|
| `<path>` | Planned |
| `<polygon>` | Planned |
| `<use>` / `<symbol>` | Planned |
| `<tspan>` | Planned |
| `<image>` | Planned |

> SVG features not natively mapped (paths, gradients, filters) are gracefully
> skipped. The tool focuses on diagram-style SVG with rect, circle, text, and
> connecting lines.

## Rendering Pipeline

```
               ┌──────────┐
  .svg ───────▶│ convert  │──────▶ .excalidraw
               └────┬─────┘              │
                    │                    │ render
                    ▼                    ▼
               ┌──────────┐        ┌──────────┐
               │ svg2png  │        │  render  │
               └────┬─────┘        └────┬─────┘
                    │                    │
                    ▼                    ▼
                  .png                 .png
```

## Use with Mermaid / PlantUML

excalidraw-cli only accepts SVG input. For Mermaid or PlantUML diagrams, convert
to SVG first:

```bash
# Mermaid → SVG (requires @mermaid-js/mermaid-cli)
npx -y @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg

# PlantUML → SVG (requires plantuml.jar)
java -jar plantuml.jar -tsvg diagram.puml

# Then convert to Excalidraw
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw
excalidraw-cli svg2png -i diagram.svg -o diagram.png
```

## AI Agent Skills

This project includes an [excalidraw-whiteboard](./.agents/skills/excalidraw-whiteboard/SKILL.md)
skill for AI agents (Claude, Gemini, etc.) to generate diagrams programmatically.
The skill covers:

- **SVG path** — hand-crafted SVG for architecture diagrams, flowcharts, etc.
- **Mermaid path** — mind maps, sequence diagrams, class diagrams, Gantt charts
- **DSL path** — design knowledge for complex chart layouts

See [SKILL.md](./.agents/skills/excalidraw-whiteboard/SKILL.md) for details.

## Dependencies

| Package | Purpose |
|---------|---------|
| `svg-parser` | SVG XML parsing and traversal |
| `sharp` | High-performance PNG rendering |
| `@excalidraw/utils` | Excalidraw type definitions |

## Comparison with @larksuite/whiteboard-cli

| Feature | excalidraw-cli | whiteboard-cli |
|---------|---------------|----------------|
| SVG → PNG | ✅ (sharp) | ✅ |
| SVG → editable | ✅ (.excalidraw) | ✅ (OpenAPI) |
| Mermaid input | via mmdc → SVG | ✅ native |
| PlantUML input | via jar → SVG | ✅ native |
| DSL input | ❌ (use SVG) | ✅ |
| Cloud upload | ❌ (local only) | ✅ (Feishu) |
| License | MIT | — |
| Native deps | None (sharp binaries) | — |
| AI agent skill | ✅ | ✅ |

## License

MIT
