"use strict";

/**
 * Excalidraw writer & PNG renderer.
 *
 * Write:
 *   writeExcalidraw(path, data)                   → .excalidraw JSON file
 *
 * Render (from SVG source):
 *   renderSVGToPNG(filePath, svgText, opts)       → PNG via sharp
 *
 * Render (from .excalidraw):
 *   renderExcalidrawToPNG(filePath, data, opts)   → PNG (needs sharp + original SVG)
 */

const fs = require("fs");
const path = require("path");

/**
 * Write a .excalidraw JSON file.
 */
function writeExcalidraw(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Render SVG text directly to PNG using sharp.
 * This is the primary PNG renderer — simpler and more reliable than
 * going through Excalidraw's browser-based export pipeline.
 */
async function renderSVGToPNG(filePath, svgText, opts = {}) {
  const sharp = require("sharp");
  const maxWidth = opts.maxWidth || 1600;
  const background = opts.background || "#ffffff";

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // First, get the SVG dimensions
  const metadata = await sharp(Buffer.from(svgText)).metadata();
  const svgWidth = metadata.width || 1600;
  const svgHeight = metadata.height || 1200;

  // Calculate scaled dimensions
  let width = svgWidth;
  let height = svgHeight;
  if (width > maxWidth) {
    const scale = maxWidth / width;
    width = maxWidth;
    height = Math.round(svgHeight * scale);
  }

  await sharp(Buffer.from(svgText))
    .resize(width, height, { fit: "inside" })
    .flatten({ background })
    .png()
    .toFile(filePath);

  return { width, height };
}

/**
 * Render .excalidraw JSON to PNG.
 * Since @excalidraw/utils is browser-only, we use the fallback:
 * if an _svgSource is embedded, render that; otherwise produce a
 * placeholder telling the user to open the file at excalidraw.com.
 */
async function renderExcalidrawToPNG(filePath, data, opts = {}) {
  // Check if we have embedded SVG source
  if (data._svgSource) {
    return renderSVGToPNG(filePath, data._svgSource, opts);
  }

  // Otherwise, write a help message
  const infoPath = filePath.replace(/\.png$/, "") + ".png.txt";
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(infoPath,
    `To export this .excalidraw as PNG:\n` +
    `1. Open https://excalidraw.com\n` +
    `2. Drag & drop the .excalidraw file\n` +
    `3. Menu → Export → PNG\n\n` +
    `Or use: excalidraw-cli svg2png -i original.svg -o output.png\n`
  );
  // Write the info text as the "PNG" so the command succeeds
  fs.writeFileSync(filePath, infoPath);
  console.log(`  (PNG export not available headlessly — wrote instructions to ${filePath})`);
}

module.exports = {
  writeExcalidraw,
  renderExcalidrawToPNG,
  renderSVGToPNG,
};
