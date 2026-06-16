#!/usr/bin/env node
"use strict";

/**
 * excalidraw-cli — SVG ↔ Excalidraw converter & PNG renderer.
 *
 * Commands:
 *   excalidraw-cli convert -i <svg> -o <excalidraw>   SVG → .excalidraw JSON
 *   excalidraw-cli svg2png -i <svg> -o <png>           SVG → PNG (via sharp)
 *   excalidraw-cli render  -i <excalidraw> -o <png>    .excalidraw → PNG
 *   excalidraw-cli dsl     -i <json> -o <excalidraw>   DSL JSON → .excalidraw
 *
 * Open-source alternative to @larksuite/whiteboard-cli.
 */

const fs = require("fs");
const path = require("path");
const { svgToExcalidraw } = require("./svg-parser");
const { writeExcalidraw, renderExcalidrawToPNG, renderSVGToPNG } = require("./excalidraw-writer");
const { compileDSL } = require("./dsl-compiler");

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
    dsl       -i <json> -o <excalidraw>     Compile DSL JSON to .excalidraw

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

    } else if (cmd === "dsl") {
      // DSL JSON → .excalidraw
      console.log(`DSL → Excalidraw: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
      const dslJson = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
      const excalidraw = compileDSL(dslJson, { background: opts.bg });
      // Generate a simple SVG placeholder for PNG rendering
      const svgPlaceholder = generatePlaceholderSVG(excalidraw, opts);
      excalidraw._svgSource = svgPlaceholder;
      writeExcalidraw(outputPath, excalidraw);
      console.log(`  OK: ${excalidraw.elements.length} elements written`);
      if (opts.format === "png") {
        const pngPath = outputPath.replace(/\.excalidraw$/, ".png");
        const dims = await renderSVGToPNG(pngPath, svgPlaceholder, { maxWidth: opts.width, background: opts.bg });
        console.log(`  PNG: ${pngPath} (${dims.width}x${dims.height})`);
      }

    } else {
      console.error(`Error: unknown command "${cmd}". Use convert, svg2png, render, or dsl.`);
      printUsage();
      process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

function generatePlaceholderSVG(excalidraw, opts) {
  // Build a simple SVG from the Excalidraw elements for sharp PNG rendering
  const w = (opts && opts.width) || 1600;
  const maxY = excalidraw.elements.reduce((m, e) => Math.max(m, (e.y || 0) + (e.height || 0)), 200);
  const h = Math.max(maxY + 40, 200);
  const bg = (opts && opts.bg) || excalidraw.appState.viewBackgroundColor || "#ffffff";

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">\n`;
  svg += `<rect width="${w}" height="${h}" fill="${bg}"/>\n`;

  for (const el of excalidraw.elements) {
    if (el.type === "rectangle" || el.type === "ellipse") {
      const rx = el.type === "ellipse" ? `rx="${el.width/2}" ry="${el.height/2}"` : "";
      svg += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" ` +
        `${rx} fill="${el.backgroundColor || 'none'}" stroke="${el.strokeColor || '#000'}" stroke-width="${el.strokeWidth || 1}"/>\n`;
    } else if (el.type === "text") {
      const esc = String(el.text || "").replace(/&/g, "与").replace(/</g, "").replace(/>/g, "");
      svg += `<text x="${el.x}" y="${el.y + el.height * 0.8}" font-size="${el.fontSize || 14}" ` +
        `fill="${el.strokeColor || '#000'}">${esc}</text>\n`;
    } else if (el.type === "arrow" || el.type === "line") {
      const pts = (el.points || [[0,0],[el.width,el.height]]);
      svg += `<line x1="${el.x + pts[0][0]}" y1="${el.y + pts[0][1]}" ` +
        `x2="${el.x + pts[pts.length-1][0]}" y2="${el.y + pts[pts.length-1][1]}" ` +
        `stroke="${el.strokeColor || '#555'}" stroke-width="${el.strokeWidth || 2}"/>\n`;
    }
  }
  svg += `</svg>`;
  return svg;
}

main();
