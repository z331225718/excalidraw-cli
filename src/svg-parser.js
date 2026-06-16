"use strict";

/**
 * SVG → Excalidraw element converter.
 *
 * Maps SVG primitives to Excalidraw's element model:
 *   <rect>     → rectangle
 *   <circle>   → ellipse (width = height = r*2)
 *   <ellipse>  → ellipse
 *   <line>     → arrow (if marker-end) or line
 *   <polyline> → line (multi-point)
 *   <text>     → text
 *   <g>        → group (process children, apply transforms)
 */

const { parse: svgParse } = require("svg-parser");

// --- ID generation ---
let _idCounter = 0;
function genId() {
  return `elem_${Date.now().toString(36)}_${(_idCounter++).toString(36)}`;
}
function resetIdCounter() {
  _idCounter = 0;
}

// --- Color utilities ---
function hexToExcalidrawColor(hex) {
  if (!hex || hex === "none") return "#1e1e1e";
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  return "#" + hex.toLowerCase();
}

function parseOpacity(attrs) {
  const opacity = parseFloat(attrs.opacity || attrs["fill-opacity"] || "1");
  return isNaN(opacity) ? 100 : Math.round(opacity * 100);
}

// --- SVG attribute parsing ---
function parseNumber(val, fallback = 0) {
  if (val == null) return fallback;
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

function parsePoints(pointsStr) {
  // "x1,y1 x2,y2 ..." → [[x1,y1],[x2,y2],...]
  if (!pointsStr) return [];
  return pointsStr
    .trim()
    .split(/[\s,]+/)
    .reduce((acc, _, i, arr) => {
      if (i % 2 === 0) acc.push([parseFloat(arr[i]), parseFloat(arr[i + 1])]);
      return acc;
    }, []);
}

function hasMarkerEnd(attrs) {
  return !!(attrs["marker-end"] || attrs["marker_end"]);
}

function hasMarkerStart(attrs) {
  return !!(attrs["marker-start"] || attrs["marker_start"]);
}

// --- SVG transform parsing ---
function parseTransform(transformStr) {
  if (!transformStr) return { tx: 0, ty: 0, scaleX: 1, scaleY: 1, rotate: 0 };

  const result = { tx: 0, ty: 0, scaleX: 1, scaleY: 1, rotate: 0 };

  // translate(x, y) or translate(x)
  const translateMatch = transformStr.match(/translate\(([^)]+)\)/);
  if (translateMatch) {
    const parts = translateMatch[1].split(/[\s,]+/).map(Number);
    result.tx = parts[0] || 0;
    result.ty = parts[1] || 0;
  }

  // scale(x, y) or scale(x)
  const scaleMatch = transformStr.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    const parts = scaleMatch[1].split(/[\s,]+/).map(Number);
    result.scaleX = parts[0] || 1;
    result.scaleY = parts[1] || parts[0] || 1;
  }

  // rotate(angle)
  const rotateMatch = transformStr.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) {
    result.rotate = parseFloat(rotateMatch[1]) || 0;
  }

  return result;
}

// --- Main SVG → Excalidraw converter ---
function svgToExcalidraw(svgText, options = {}) {
  resetIdCounter();
  const background = options.background || "#ffffff";

  const parsed = svgParse(svgText);
  const svgNode = parsed.children.find(c => c.type === "element" && c.tagName === "svg");
  if (!svgNode) throw new Error("No <svg> root element found");

  const viewBox = parseViewBox(svgNode.properties);
  const elements = [];

  // Process all children
  processChildren(svgNode.children, elements, {
    parentX: 0,
    parentY: 0,
    viewBox,
    groupTransform: null,
  });

  return {
    type: "excalidraw",
    version: 2,
    source: "https://github.com/excalidraw/excalidraw",
    elements: elements,
    appState: {
      viewBackgroundColor: background,
      gridSize: null,
    },
    files: {},
  };
}

function parseViewBox(properties) {
  const vb = properties?.viewBox;
  if (!vb) return { x: 0, y: 0, w: 1600, h: 1200 };
  const parts = vb.trim().split(/[\s,]+/).map(Number);
  return {
    x: parts[0] || 0,
    y: parts[1] || 0,
    w: parts[2] || 1600,
    h: parts[3] || 1200,
  };
}

function processChildren(children, elements, ctx) {
  if (!children) return;

  for (const child of children) {
    if (child.type === "element") {
      processElement(child, elements, ctx);
    } else if (child.type === "text" && child.value != null) {
      // Raw text nodes between elements — skip whitespace
    }
  }
}

function processElement(node, elements, ctx) {
  const { tagName, properties = {}, children = [] } = node;
  const attrs = normalizeAttrs(properties);

  // Parse local transform
  const transform = parseTransform(properties.transform);
  const gx = ctx.groupTransform ? ctx.groupTransform.tx : 0;
  const gy = ctx.groupTransform ? ctx.groupTransform.ty : 0;
  const gsx = ctx.groupTransform ? ctx.groupTransform.scaleX : 1;
  const gsy = ctx.groupTransform ? ctx.groupTransform.scaleY : 1;

  // Accumulate group transform
  const currentCtx = {
    ...ctx,
    groupTransform: {
      tx: gx + transform.tx,
      ty: gy + transform.ty,
      scaleX: gsx * transform.scaleX,
      scaleY: gsy * transform.scaleY,
      rotate: (ctx.groupTransform ? ctx.groupTransform.rotate : 0) + transform.rotate,
    },
  };

  // Dispatch by tag name
  switch (tagName) {
    case "g":
      // Groups: process children with accumulated transform
      processChildren(children, elements, currentCtx);
      break;

    case "rect":
      elements.push(convertRect(attrs, currentCtx));
      break;

    case "circle":
      elements.push(convertCircle(attrs, currentCtx));
      break;

    case "ellipse":
      elements.push(convertEllipse(attrs, currentCtx));
      break;

    case "line":
      elements.push(convertLine(attrs, currentCtx));
      break;

    case "polyline":
      elements.push(convertPolyline(attrs, currentCtx));
      break;

    case "text":
      elements.push(convertText(node, attrs, currentCtx));
      break;

    case "path":
      // Skip complex paths for now (bezier curves not natively supported)
      // Could add basic path support for straight lines later
      break;

    case "defs":
    case "style":
    case "marker":
    case "title":
    case "desc":
    case "metadata":
      // Skip metadata/defs
      break;

    default:
      // Unknown elements — skip silently
      break;
  }
}

function normalizeAttrs(props) {
  const attrs = {};
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    // Normalize: stroke-width → strokeWidth, etc.
    const normalized = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    attrs[key] = value;
    attrs[normalized] = value;
  }
  return attrs;
}

// --- Individual shape converters ---

function convertRect(attrs, ctx) {
  const x = parseNumber(attrs.x) + ctx.groupTransform.tx;
  const y = parseNumber(attrs.y) + ctx.groupTransform.ty;
  const width = parseNumber(attrs.width, 100);
  const height = parseNumber(attrs.height, 100);
  const rx = parseNumber(attrs.rx, 0);
  const fill = attrs.fill || "none";
  const stroke = attrs.stroke || "#1e1e1e";
  const strokeWidth = parseNumber(attrs.strokeWidth || attrs["stroke-width"], 2);
  const opacity = parseOpacity(attrs);

  const elem = {
    id: genId(),
    type: "rectangle",
    x: x,
    y: y,
    width: width,
    height: height,
    angle: ctx.groupTransform.rotate * (Math.PI / 180),
    strokeColor: hexToExcalidrawColor(stroke),
    backgroundColor: fill === "none" ? "transparent" : hexToExcalidrawColor(fill),
    fillStyle: fill === "none" ? "solid" : "solid",
    strokeWidth: strokeWidth,
    strokeStyle: "solid",
    roughness: 0,
    opacity: opacity,
    roundness: rx > 0 ? { type: 3 } : { type: 1 },  // type 3 = proportional radii
    groupIds: [],
    frameId: null,
    boundElements: [],
    version: 1,
    isDeleted: false,
  };

  // Handle rounded corners
  if (rx > 0) {
    elem.roundness = { type: 3, value: Math.min(rx / Math.min(width, height), 1) * 32 };
  }

  // Handle stroke-dasharray
  if (attrs.strokeDasharray || attrs["stroke-dasharray"]) {
    elem.strokeStyle = "dashed";
  }

  return elem;
}

function convertCircle(attrs, ctx) {
  const cx = parseNumber(attrs.cx) + ctx.groupTransform.tx;
  const cy = parseNumber(attrs.cy) + ctx.groupTransform.ty;
  const r = parseNumber(attrs.r, 50);
  const fill = attrs.fill || "none";
  const stroke = attrs.stroke || "#1e1e1e";
  const strokeWidth = parseNumber(attrs.strokeWidth || attrs["stroke-width"], 2);
  const opacity = parseOpacity(attrs);

  return {
    id: genId(),
    type: "ellipse",
    x: cx - r,
    y: cy - r,
    width: r * 2,
    height: r * 2,
    angle: 0,
    strokeColor: hexToExcalidrawColor(stroke),
    backgroundColor: fill === "none" ? "transparent" : hexToExcalidrawColor(fill),
    fillStyle: fill === "none" ? "solid" : "solid",
    strokeWidth: strokeWidth,
    strokeStyle: attrs.strokeDasharray ? "dashed" : "solid",
    roughness: 0,
    opacity: opacity,
    roundness: { type: 2 },
    groupIds: [],
    boundElements: [],
    version: 1,
    isDeleted: false,
  };
}

function convertEllipse(attrs, ctx) {
  const cx = parseNumber(attrs.cx) + ctx.groupTransform.tx;
  const cy = parseNumber(attrs.cy) + ctx.groupTransform.ty;
  const rx = parseNumber(attrs.rx, 50);
  const ry = parseNumber(attrs.ry, 50);
  const fill = attrs.fill || "none";
  const stroke = attrs.stroke || "#1e1e1e";
  const strokeWidth = parseNumber(attrs.strokeWidth || attrs["stroke-width"], 2);
  const opacity = parseOpacity(attrs);

  return {
    id: genId(),
    type: "ellipse",
    x: cx - rx,
    y: cy - ry,
    width: rx * 2,
    height: ry * 2,
    angle: 0,
    strokeColor: hexToExcalidrawColor(stroke),
    backgroundColor: fill === "none" ? "transparent" : hexToExcalidrawColor(fill),
    fillStyle: fill === "none" ? "solid" : "solid",
    strokeWidth: strokeWidth,
    strokeStyle: attrs.strokeDasharray ? "dashed" : "solid",
    roughness: 0,
    opacity: opacity,
    roundness: { type: 2 },
    groupIds: [],
    boundElements: [],
    version: 1,
    isDeleted: false,
  };
}

function convertLine(attrs, ctx) {
  const x1 = parseNumber(attrs.x1) + ctx.groupTransform.tx;
  const y1 = parseNumber(attrs.y1) + ctx.groupTransform.ty;
  const x2 = parseNumber(attrs.x2) + ctx.groupTransform.tx;
  const y2 = parseNumber(attrs.y2) + ctx.groupTransform.ty;
  const stroke = attrs.stroke || "#1e1e1e";
  const strokeWidth = parseNumber(attrs.strokeWidth || attrs["stroke-width"], 2);
  const opacity = parseOpacity(attrs);

  // Determine if this is an arrow
  const isArrow = hasMarkerEnd(attrs);
  const isDoubleArrow = hasMarkerStart(attrs) && isArrow;

  const startArrowhead = hasMarkerStart(attrs) ? "arrow" : null;
  const endArrowhead = hasMarkerEnd(attrs) ? "arrow" : null;

  return {
    id: genId(),
    type: isArrow || isDoubleArrow ? "arrow" : "line",
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    angle: 0,
    strokeColor: hexToExcalidrawColor(stroke),
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: strokeWidth,
    strokeStyle: attrs.strokeDasharray ? "dashed" : "solid",
    roughness: 0,
    opacity: opacity,
    roundness: { type: 2 },
    groupIds: [],
    boundElements: [],
    version: 1,
    isDeleted: false,
    points: [[0, 0], [x2 - x1, y2 - y1]],
    startBinding: null,
    endBinding: null,
    startArrowhead: startArrowhead,
    endArrowhead: endArrowhead,
  };
}

function convertPolyline(attrs, ctx) {
  const points = parsePoints(attrs.points);
  if (points.length < 2) return null;

  const stroke = attrs.stroke || "#1e1e1e";
  const strokeWidth = parseNumber(attrs.strokeWidth || attrs["stroke-width"], 2);
  const opacity = parseOpacity(attrs);

  // Calculate bounds
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const isArrow = hasMarkerEnd(attrs);
  const endArrowhead = hasMarkerEnd(attrs) ? "arrow" : null;
  const startArrowhead = hasMarkerStart(attrs) ? "arrow" : null;

  // Normalize points relative to minX, minY
  const relPoints = points.map(([px, py]) => [px - minX, py - minY]);

  return {
    id: genId(),
    type: isArrow ? "arrow" : "line",
    x: minX + ctx.groupTransform.tx,
    y: minY + ctx.groupTransform.ty,
    width: maxX - minX,
    height: maxY - minY,
    angle: 0,
    strokeColor: hexToExcalidrawColor(stroke),
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: strokeWidth,
    strokeStyle: attrs.strokeDasharray ? "dashed" : "solid",
    roughness: 0,
    opacity: opacity,
    roundness: { type: 2 },
    groupIds: [],
    boundElements: [],
    version: 1,
    isDeleted: false,
    points: relPoints,
    startBinding: null,
    endBinding: null,
    startArrowhead: startArrowhead,
    endArrowhead: endArrowhead,
  };
}

function convertText(node, attrs, ctx) {
  const x = parseNumber(attrs.x) + ctx.groupTransform.tx;
  const y = parseNumber(attrs.y) + ctx.groupTransform.ty;
  const fill = attrs.fill || "#1e1e1e";
  const fontSize = parseNumber(attrs.fontSize || attrs["font-size"], 20);
  const fontWeight = attrs.fontWeight || attrs["font-weight"] || "normal";
  const textAnchor = attrs.textAnchor || attrs["text-anchor"] || "start";
  const opacity = parseOpacity(attrs);

  // Extract text content
  let text = getTextContent(node);
  if (!text || !text.trim()) return null;

  // Calculate approximate text dimensions
  const charWidth = fontSize * 0.6;
  const textWidth = text.length * charWidth;
  const textHeight = fontSize * 1.4;

  // Adjust x for text-anchor
  let adjX = x;
  if (textAnchor === "middle") adjX = x - textWidth / 2;
  if (textAnchor === "end") adjX = x - textWidth;

  return {
    id: genId(),
    type: "text",
    x: adjX,
    y: y - fontSize * 0.8, // Align to text baseline
    width: Math.max(textWidth, 50),
    height: textHeight,
    angle: 0,
    strokeColor: hexToExcalidrawColor(fill),
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: opacity,
    roundness: null,
    groupIds: [],
    boundElements: [],
    version: 1,
    isDeleted: false,
    text: text,
    fontSize: fontSize,
    fontFamily: 5, // 5 = Virgil (Excalidraw's hand-drawn font)
    textAlign: textAnchor === "middle" ? "center" : textAnchor === "end" ? "right" : "left",
    verticalAlign: "top",
    containerId: null,
    originalText: text,
  };
}

function getTextContent(node) {
  if (!node.children) return "";
  let text = "";
  for (const child of node.children) {
    if (child.type === "text") {
      text += child.value || "";
    } else if (child.type === "element" && child.tagName === "tspan") {
      text += getTextContent(child);
      if (child.children.length === 0 && child.value !== undefined) {
        text += child.value || "";
      }
    }
  }
  return text;
}

// --- Public API ---
module.exports = {
  svgToExcalidraw,
  parseSVG: svgParse,
};
