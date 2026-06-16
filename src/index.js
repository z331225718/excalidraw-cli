#!/usr/bin/env node
"use strict";

/**
 * excalidraw-cli — SVG ↔ Excalidraw converter & PNG renderer.
 *
 * Commands:
 *   excalidraw-cli convert -i <svg> -o <excalidraw>   SVG → .excalidraw JSON
 *   excalidraw-cli svg2png -i <svg> -o <png>           SVG → PNG (via sharp)
 *   excalidraw-cli render  -i <excalidraw> -o <png>    .excalidraw → PNG
 *
 * Open-source alternative to @larksuite/whiteboard-cli.
 */

const fs = require("fs");
const path = require("path");
const { svgToExcalidraw } = require("./svg-parser");
const { writeExcalidraw, renderExcalidrawToPNG, renderSVGToPNG } = require("./excalidraw-writer");

function parseArgs(args) {
  const cmd = args[0];
  const opts = { input: null, output: null, width: 1600, bg: "#ffffff", format: "json" };
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "-i" || args[i] === "--input") opts.input = args[++i];
    else if (args[i] === "-o" || args[i] === "--output") opts.output = args[++i];
    else if (args[i] === "-w" || args[i] === "--width") opts.width = parseInt(args[++i]);
    else if (args[i] === "-b" || args[i] === "--background") opts.bg = args[++i];
    else if (args[i] === "-f" || args[i] === "--format") opts.format = args[++i];
  }
  return { cmd, opts };
}

function printUsage() {
  console.log(`
  excalidraw-cli — SVG ↔ Excalidraw converter

  Commands:
    convert   -i <svg>  -o <excalidraw>     Convert SVG to .excalidraw JSON
    svg2png   -i <svg>  -o <png>            Convert SVG directly to PNG (via sharp)
    render    -i <excalidraw> -o <png>       Render .excalidraw to PNG

  Options:
    -i, --input <path>        Input file path
    -o, --output <path>       Output file path
    -w, --width <pixels>      Max width for PNG export (default: 1600)
    -b, --background <hex>    Background color (default: #ffffff)
    -f, --format <json|png>   Output format for convert (default: json; png also renders)
  `);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const { cmd, opts } = parseArgs(args);

  if (!opts.input || !opts.output) {
    console.error("Error: --input and --output are required.");
    printUsage();
    process.exit(1);
  }

  const inputPath = path.resolve(opts.input);
  const outputPath = path.resolve(opts.output);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: input file not found: ${inputPath}`);
    process.exit(1);
  }

  try {
    if (cmd === "convert") {
      // SVG → .excalidraw JSON
      console.log(`SVG → Excalidraw: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
      const svgText = fs.readFileSync(inputPath, "utf-8");
      const excalidraw = svgToExcalidraw(svgText, { background: opts.bg });
      // Embed SVG source for later PNG export
      excalidraw._svgSource = svgText;
      writeExcalidraw(outputPath, excalidraw);
      console.log(`  OK: ${excalidraw.elements.length} elements written`);

      // Optionally also render PNG
      if (opts.format === "png") {
        const pngPath = outputPath.replace(/\.excalidraw$/, ".png");
        const dims = await renderSVGToPNG(pngPath, svgText, { maxWidth: opts.width, background: opts.bg });
        console.log(`  PNG: ${pngPath} (${dims.width}x${dims.height})`);
      }

    } else if (cmd === "svg2png") {
      // SVG → PNG directly via sharp
      console.log(`SVG → PNG: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
      const svgText = fs.readFileSync(inputPath, "utf-8");
      const dims = await renderSVGToPNG(outputPath, svgText, { maxWidth: opts.width, background: opts.bg });
      console.log(`  OK: ${outputPath} (${dims.width}x${dims.height})`);

    } else if (cmd === "render") {
      // .excalidraw → PNG
      console.log(`Excalidraw → PNG: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
      const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
      await renderExcalidrawToPNG(outputPath, data, { maxWidth: opts.width });

    } else {
      console.error(`Error: unknown command "${cmd}". Use convert, svg2png, or render.`);
      printUsage();
      process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

main();
