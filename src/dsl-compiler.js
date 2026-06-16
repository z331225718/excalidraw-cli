"use strict";

/**
 * DSL Compiler — Whiteboard DSL JSON → Excalidraw elements.
 *
 * Supports:
 *   - Frame (layout: horizontal | vertical | none | dagre)
 *   - Rect / Ellipse / Text / Connector
 *   - Simplified Flex layout engine
 *   - Dagre graph layout (via dagre npm)
 *   - Absolute positioning (layout: none)
 *
 * Usage:
 *   const { compileDSL } = require("./dsl-compiler");
 *   const excalidraw = compileDSL(dslJson);
 */

const dagre = require("dagre");

// --- ID generation ---
let _idCounter = 0;
function genId() {
  return `dsl_${Date.now().toString(36)}_${(_idCounter++).toString(36)}`;
}
function resetId() { _idCounter = 0; }

// --- Color helpers ---
const DEFAULT_COLORS = {
  fill: "#FFFFFF",
  border: "#1e1e1e",
  text: "#1e1e1e",
  canvas: "#ffffff",
};

function hexColor(hex, fallback) {
  if (!hex) return fallback || DEFAULT_COLORS.text;
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  return "#" + hex.toLowerCase();
}

// --- Size helpers ---
function resolveSize(value, parentSize, contentSize) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const m = value.match(/^fit-content(?:\((\d+)\))?$/);
    if (m) return contentSize || parseInt(m[1]) || 0;
    const m2 = value.match(/^fill-container(?:\((\d+)\))?$/);
    if (m2) return parentSize || parseInt(m2[1]) || 0;
  }
  return 0;
}

function estimateTextWidth(text, fontSize) {
  // CJK ~= 1em, Latin ~= 0.6em
  let w = 0;
  for (const ch of String(text || "")) {
    w += /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? fontSize : fontSize * 0.6;
  }
  return Math.max(w, 10);
}

function estimateTextHeight(text, fontSize, width) {
  if (!text) return fontSize * 2.0;
  const lines = String(text).split("\n");
  let totalHeight = 0;
  for (const line of lines) {
    const lineW = estimateTextWidth(line, fontSize);
    const wraps = Math.max(1, Math.ceil(lineW / Math.max(width || 1600, 1)));
    totalHeight += fontSize * 2.0 * wraps;
  }
  return Math.max(totalHeight, fontSize * 2.0);
}

// --- Parse padding ---
function parsePadding(val) {
  if (typeof val === "number") return { top: val, right: val, bottom: val, left: val };
  if (Array.isArray(val)) {
    if (val.length === 2) return { top: val[0], right: val[1], bottom: val[0], left: val[1] };
    if (val.length === 4) return { top: val[0], right: val[1], bottom: val[2], left: val[3] };
  }
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

// --- Text in shape inset ---
const SHAPE_INSET = 12; // top/right/bottom/left

// --- Main compiler ---
function compileDSL(doc, options = {}) {
  resetId();
  const background = options.background || DEFAULT_COLORS.canvas;
  const nodes = doc.nodes || [];
  const elements = [];
  const idToNode = new Map();
  const idToAbsPos = new Map(); // id → { x, y, w, h }

  // Phase 1: collect all nodes by id
  function collectIds(nodeList) {
    for (const node of nodeList) {
      if (node.id) idToNode.set(node.id, node);
      if (node.children) collectIds(node.children);
    }
  }
  collectIds(nodes);

  // Phase 2: layout and flatten
  let nextY = 0;
  for (const node of nodes) {
    if (node.type === "connector") continue; // handled later
    const result = layoutNode(node, 0, nextY, 1600, Infinity);
    nextY = result.y + result.h + 16; // gap between top-level nodes
  }

  // Phase 3: process connectors
  for (const node of nodes) {
    if (node.type === "connector") {
      const connEl = makeConnector(node, idToAbsPos);
      if (connEl) elements.push(connEl);
    }
  }

  // Build Excalidraw document
  const excalidraw = {
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

  return excalidraw;

  // --- Layout a single node ---
  function layoutNode(node, parentX, parentY, parentW, parentH) {
    const nodeType = node.type || "rect";

    if (nodeType === "text") {
      return layoutText(node, parentX, parentY, parentW, parentH);
    }
    if (nodeType === "frame") {
      return layoutFrame(node, parentX, parentY, parentW, parentH);
    }
    if (nodeType === "connector") {
      return { x: 0, y: 0, w: 0, h: 0 }; // skip, handled in phase 3
    }
    // Shapes: rect, ellipse, etc.
    return layoutShape(node, parentX, parentY, parentW, parentH, nodeType);
  }

  // --- Layout frame (container) ---
  function layoutFrame(f, px, py, pw, ph) {
    const layout = f.layout || "vertical";
    const gap = f.gap || 12;
    const pad = parsePadding(f.padding || 0);

    if (layout === "dagre") {
      return layoutDagre(f, px, py);
    }

    if (layout === "none") {
      const w = resolveSize(f.width, pw, 0) || pw || 800;
      const h = resolveSize(f.height, ph, 0) || ph || 600;
      const x = f.x != null ? px + f.x : px;
      const y = f.y != null ? py + f.y : py;

      // Add frame background
      addFrameBG(f, x, y, w, h);

      // Layout children with absolute positioning
      if (f.children) {
        for (const child of f.children) {
          layoutNode(child, x, y, w, h);
        }
      }

      if (f.id) idToAbsPos.set(f.id, { x, y, w, h });
      return { x, y, w, h };
    }

    // Flex layout: horizontal or vertical
    const isRow = layout === "horizontal";
    const children = f.children || [];

    // First pass: measure children
    const childSizes = children.map(c => {
      const result = measureNode(c, pw || 1600);
      return result;
    });

    // Calculate content size
    let contentW, contentH;
    if (isRow) {
      contentW = childSizes.reduce((s, c) => s + c.w, 0) + gap * Math.max(0, children.length - 1);
      contentH = Math.max(...childSizes.map(c => c.h), 0);
    } else {
      contentW = Math.max(...childSizes.map(c => c.w), 0);
      contentH = childSizes.reduce((s, c) => s + c.h, 0) + gap * Math.max(0, children.length - 1);
    }

    // Determine frame size
    let frameW = resolveSize(f.width, pw || 1600, contentW + pad.left + pad.right);
    let frameH = resolveSize(f.height, ph || Infinity, contentH + pad.top + pad.bottom);

    if (frameW === 0) frameW = contentW + pad.left + pad.right;
    if (frameH === 0) frameH = contentH + pad.top + pad.bottom;

    // Redistribute fill-container space
    const contentAreaW = frameW - pad.left - pad.right;
    const contentAreaH = frameH - pad.top - pad.bottom;
    if (isRow) {
      const fillIndices = [];
      let fixedTotal = 0;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const cw = child.width;
        if (typeof cw === 'string' && cw.startsWith('fill-container')) {
          fillIndices.push(i);
        } else {
          fixedTotal += childSizes[i].w;
        }
      }
      if (fillIndices.length > 0) {
        const remaining = Math.max(0, contentAreaW - fixedTotal - gap * (children.length - 1));
        const each = Math.floor(remaining / fillIndices.length);
        for (const idx of fillIndices) {
          childSizes[idx].w = each;
        }
      }
    }

    const frameX = f.x != null ? px + f.x : px;
    const frameY = f.y != null ? py + f.y : py;

    // Add frame background
    addFrameBG(f, frameX, frameY, frameW, frameH);

    // Second pass: lay out children
    const alignItems = f.alignItems || "start";
    let cursor = isRow ? pad.left : pad.top;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const size = childSizes[i];
      let cx, cy;

      if (isRow) {
        cx = frameX + cursor;
        // Cross-axis alignment
        if (alignItems === "center") {
          cy = frameY + pad.top + (contentAreaH - size.h) / 2;
        } else if (alignItems === "end") {
          cy = frameY + frameH - pad.bottom - size.h;
        } else if (alignItems === "stretch") {
          size.h = contentAreaH;
          cy = frameY + pad.top;
        } else {
          cy = frameY + pad.top;
        }
        cursor += size.w + gap;
      } else {
        cy = frameY + cursor;
        const contentArea = frameW - pad.left - pad.right;
        // Justification for vertical
        if (f.justifyContent === "center") {
          // Not implemented for simplicity - center simple case
        }
        // Horizontal alignment within row
        const itemW = size.w;
        if (alignItems === "center" && !isRow) {
          // "alignItems" in vertical layout affects horizontal position
        }
        cx = frameX + pad.left;
        cursor += size.h + gap;
      }

      // Actually layout the child at position
      if (isRow) {
        layoutNode(child, cx, cy, size.w, size.h);
      } else {
        layoutNode(child, cx, cy, frameW - pad.left - pad.right, size.h);
      }

      // Update size if stretched
      if (isRow && alignItems === "stretch") {
        childSizes[i].h = frameH - pad.top - pad.bottom;
      }
    }

    if (f.id) idToAbsPos.set(f.id, { x: frameX, y: frameY, w: frameW, h: frameH });
    return { x: frameX, y: frameY, w: frameW, h: frameH };
  }

  // --- Layout Dagre ---
  function layoutDagre(f, px, py) {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: (f.layoutOptions && f.layoutOptions.rankdir) || "TB",
      nodesep: (f.layoutOptions && f.layoutOptions.nodesep) || 40,
      edgesep: (f.layoutOptions && f.layoutOptions.edgesep) || 20,
      ranksep: (f.layoutOptions && f.layoutOptions.ranksep) || 50,
      marginx: 20,
      marginy: 20,
    });
    g.setDefaultEdgeLabel(() => ({}));

    const children = f.children || [];
    const clusterMap = new Map();

    // Phase 1: register nodes
    function registerDagreNodes(nodeList, parentCluster) {
      for (const node of nodeList) {
        if (node.type === "text") continue; // skip text, they'll be repositioned later
        if (node.type === "frame" && node.layout === "dagre" &&
            node.layoutOptions && node.layoutOptions.isCluster) {
          // Transparent cluster
          const clusterId = node.id || genId();
          g.setNode(clusterId, { width: 0, height: 0, padding: 20 });
          clusterMap.set(clusterId, node);
          if (node.children) registerDagreNodes(node.children, clusterId);
        } else if (node.type === "frame") {
          // Opaque node
          const nid = node.id || genId();
          const sz = measureNode(node, 400);
          g.setNode(nid, { width: sz.w + 16, height: sz.h + 16 });
          if (node.id) {
            idToAbsPos.set(node.id, { x: 0, y: 0, w: sz.w, h: sz.h, dagreId: nid });
          }
        } else if (node.id) {
          const nid = node.id;
          if (!g.hasNode(nid)) {
            const sz = measureNode(node, 400);
            g.setNode(nid, { width: sz.w, height: sz.h });
          }
        }
      }
    }
    registerDagreNodes(children, null);

    // Phase 2: register edges
    const edges = (f.layoutOptions && f.layoutOptions.edges) || [];
    for (const edge of edges) {
      const [from, to, label] = edge;
      if (g.hasNode(from) && g.hasNode(to)) {
        g.setEdge(from, to, { label: label || "" });
      }
    }

    // Phase 3: run Dagre
    dagre.layout(g);

    // Phase 4: extract positions and flatten
    const pad = parsePadding(f.padding || 20);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // First, get overall bounds
    g.nodes().forEach(nid => {
      const node = g.node(nid);
      if (node.x !== undefined) {
        minX = Math.min(minX, node.x - node.width / 2);
        minY = Math.min(minY, node.y - node.height / 2);
        maxX = Math.max(maxX, node.x + node.width / 2);
        maxY = Math.max(maxY, node.y + node.height / 2);
      }
    });

    const frameW = maxX - minX + pad.left + pad.right;
    const frameH = maxY - minY + pad.top + pad.bottom;
    const frameX = px;
    const frameY = py;

    // Add frame background
    addFrameBG(f, frameX, frameY, frameW, frameH);

    // Layout nodes at dagre-computed positions
    const offsetX = frameX + pad.left - minX;
    const offsetY = frameY + pad.top - minY;

    for (const child of children) {
      if (child.type === "text") {
        // Text in dagre — place at top
        const sz = measureNode(child, frameW - pad.left - pad.right);
        layoutNode(child, frameX + pad.left, frameY + pad.top, frameW - pad.left - pad.right, sz.h);
        continue;
      }
      if (child.type === "frame" && child.layout === "dagre" &&
          child.layoutOptions && child.layoutOptions.isCluster) {
        // Cluster — layout children inside
        const clusterBounds = getClusterBounds(child, offsetX, offsetY, g);
        if (child.children) {
          for (const cc of child.children) {
            const ccSz = measureNode(cc, 400);
            let cx, cy;
            if (cc.id && g.hasNode(cc.id)) {
              const dn = g.node(cc.id);
              cx = offsetX + dn.x - ccSz.w / 2;
              cy = offsetY + dn.y - ccSz.h / 2;
            } else {
              const dnId = clusterMap.get(child.id);
              cx = clusterBounds.x + 10;
              cy = clusterBounds.y + 10;
            }
            layoutNode(cc, cx, cy, ccSz.w, ccSz.h);
          }
        }
        continue;
      }
      const sz = measureNode(child, 400);
      let cx, cy;
      if (child.id && g.hasNode(child.id)) {
        const dn = g.node(child.id);
        cx = offsetX + dn.x - sz.w / 2;
        cy = offsetY + dn.y - sz.h / 2;
      } else if (child.type === "frame") {
        // Find dagre id from idToAbsPos
        const pos = idToAbsPos.get(child.id);
        if (pos && pos.dagreId && g.hasNode(pos.dagreId)) {
          const dn = g.node(pos.dagreId);
          cx = offsetX + dn.x - sz.w / 2;
          cy = offsetY + dn.y - sz.h / 2;
        } else {
          continue;
        }
      } else {
        continue;
      }
      layoutNode(child, cx, cy, sz.w, sz.h);
    }

    // Update positions from dagre for connector references
    g.nodes().forEach(nid => {
      const dn = g.node(nid);
      if (dn.x !== undefined) {
        idToAbsPos.set(nid, {
          x: offsetX + dn.x - (dn.width || 0) / 2,
          y: offsetY + dn.y - (dn.height || 0) / 2,
          w: dn.width || 100,
          h: dn.height || 40,
        });
      }
    });

    if (f.id) idToAbsPos.set(f.id, { x: frameX, y: frameY, w: frameW, h: frameH });

    // Phase 5: render dagre edges as connectors
    for (const edge of edges) {
      const [from, to, label] = edge;
      if (!g.hasNode(from) || !g.hasNode(to)) continue;
      const fromNode = g.node(from);
      const toNode = g.node(to);
      const fromX = offsetX + fromNode.x;
      const fromY = offsetY + fromNode.y;
      const toX = offsetX + toNode.x;
      const toY = offsetY + toNode.y;
      const dx = toX - fromX;
      const dy = toY - fromY;

      const eid = genId();
      elements.push({
        id: eid, type: "arrow", x: fromX, y: fromY, width: dx, height: dy, angle: 0,
        strokeColor: "#555", backgroundColor: "transparent", fillStyle: "solid",
        strokeWidth: 2, strokeStyle: "solid", roughness: 0, opacity: 100,
        roundness: { type: 2 }, groupIds: [], boundElements: [], version: 1, isDeleted: false,
        points: [[0, 0], [dx, dy]], startBinding: null, endBinding: null,
        startArrowhead: null, endArrowhead: "arrow",
      });

      if (label) {
        const lid = genId();
        elements.push({
          id: lid, type: "text",
          x: fromX + dx / 2 - estimateTextWidth(String(label), 11) / 2,
          y: fromY + dy / 2 - 16,
          width: estimateTextWidth(String(label), 11) + 8, height: 16, angle: 0,
          strokeColor: "#555", backgroundColor: "transparent", fillStyle: "solid",
          strokeWidth: 1, strokeStyle: "solid", roughness: 0, opacity: 100,
          roundness: null, groupIds: [], boundElements: [], version: 1, isDeleted: false,
          text: String(label), fontSize: 11, fontFamily: 2,
          textAlign: "center", verticalAlign: "top",
          containerId: eid, originalText: String(label),
        });
      }
    }

    return { x: frameX, y: frameY, w: frameW, h: frameH };
  }

  function getClusterBounds(cluster, offsetX, offsetY, g) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    if (cluster.children) {
      for (const cc of cluster.children) {
        if (cc.id && g.hasNode(cc.id)) {
          const dn = g.node(cc.id);
          minX = Math.min(minX, offsetX + dn.x - (dn.width || 0) / 2);
          minY = Math.min(minY, offsetY + dn.y - (dn.height || 0) / 2);
          maxX = Math.max(maxX, offsetX + dn.x + (dn.width || 0) / 2);
          maxY = Math.max(maxY, offsetY + dn.y + (dn.height || 0) / 2);
        }
      }
    }
    return {
      x: minX === Infinity ? offsetX : minX - 10,
      y: minY === Infinity ? offsetY : minY - 10,
      w: maxX - minX + 20,
      h: maxY - minY + 20,
    };
  }

  // --- Measure a node without placing it ---
  function measureNode(node, availableW) {
    const nt = node.type || "rect";
    const fontSize = node.fontSize || 14;
    const text = extractText(node);

    if (nt === "text") {
      const w = estimateTextWidth(text, fontSize) + 16;
      const h = estimateTextHeight(text, fontSize, availableW || 1600) + 4;
      return { w: Math.min(w, availableW || Infinity), h };
    }

    if (nt === "frame") {
      // Estimate frame size by measuring children
      const children = node.children || [];
      const gap = node.gap || 12;
      const isRow = (node.layout || "vertical") === "horizontal";

      if (node.layout === "none") {
        return {
          w: resolveSize(node.width, availableW, availableW || 800),
          h: resolveSize(node.height, 600, 600),
        };
      }

      if (node.layout === "dagre") {
        return { w: availableW || 600, h: 400 }; // rough estimate
      }

      const childSizes = children.map(c => measureNode(c, availableW));
      let w, h;
      if (isRow) {
        w = childSizes.reduce((s, c) => s + c.w, 0) + gap * Math.max(0, children.length - 1);
        h = Math.max(...childSizes.map(c => c.h), 0);
      } else {
        w = Math.max(...childSizes.map(c => c.w), 0);
        h = childSizes.reduce((s, c) => s + c.h, 0) + gap * Math.max(0, children.length - 1);
      }
      const pad = parsePadding(node.padding || 0);
      return { w: w + pad.left + pad.right + 4, h: h + pad.top + pad.bottom + 4 };
    }

    // Shape
    const textH = estimateTextHeight(text, fontSize, availableW || 800);
    const w = estimateTextWidth(text, fontSize) + SHAPE_INSET * 2 + 20;
    const h = textH + SHAPE_INSET * 2 + 12;
    const fw = resolveSize(node.width, availableW, w);
    const fh = resolveSize(node.height, 0, h);
    return { w: fw || Math.max(w, 80), h: fh || Math.max(h, 36) };
  }

  // --- Layout text ---
  function layoutText(node, px, py, pw, ph) {
    const fontSize = node.fontSize || 14;
    const text = extractText(node);
    const textW = estimateTextWidth(text, fontSize) + 16;
    const textH = estimateTextHeight(text, fontSize, pw || 1600) + 4;
    const w = resolveSize(node.width, pw || textW, textW);
    const h = resolveSize(node.height, ph || textH, textH);

    const x = node.x != null ? px + node.x : px;
    const y = node.y != null ? py + node.y : py;

    const textColor = hexColor(node.textColor, DEFAULT_COLORS.text);
    const textAlign = node.textAlign || "left";

    let adjX = x;
    if (textAlign === "center") adjX = x + w / 2 - textW / 2;
    if (textAlign === "right") adjX = x + w - textW;

    elements.push({
      id: genId(),
      type: "text",
      x: adjX,
      y: y,
      width: Math.max(textW, 50),
      height: h,
      angle: 0,
      strokeColor: textColor,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      roundness: null,
      groupIds: [],
      boundElements: [],
      version: 1,
      isDeleted: false,
      text: String(text),
      fontSize: fontSize,
      fontFamily: 2,
      textAlign: textAlign,
      verticalAlign: "top",
      containerId: null,
      originalText: String(text),
    });

    return { x, y, w, h };
  }

  // --- Layout shape (rect, ellipse, etc.) ---
  function layoutShape(node, px, py, pw, ph, shapeType) {
    const fontSize = node.fontSize || 14;
    const text = extractText(node);
    const textW = estimateTextWidth(text, fontSize) + SHAPE_INSET * 2;
    const textH = estimateTextHeight(text, fontSize, pw || 800) + SHAPE_INSET * 2 + 4;

    let w, h;
    if (node.width != null && node.height != null) {
      w = resolveSize(node.width, pw || 200, textW);
      h = resolveSize(node.height, ph || 40, textH);
    } else {
      w = Math.max(textW + 20, 80);
      h = Math.max(textH + 8, 36);
    }

    const x = node.x != null ? px + node.x : px;
    const y = node.y != null ? py + node.y : py;

    const fillColor = hexColor(node.fillColor, DEFAULT_COLORS.fill);
    const borderColor = hexColor(node.borderColor, DEFAULT_COLORS.border);
    const borderWidth = node.borderWidth != null ? node.borderWidth : 2;
    const borderRadius = node.borderRadius || 8;
    const textColor = hexColor(node.textColor, DEFAULT_COLORS.text);
    const textAlign = node.textAlign || "center";
    const verticalAlign = node.verticalAlign || "middle";
    const opacity = node.opacity != null ? Math.round(node.opacity * 100) : 100;

    const elemType = shapeType === "ellipse" ? "ellipse" : "rectangle";

    const elem = {
      id: genId(),
      type: elemType,
      x: x,
      y: y,
      width: w,
      height: h,
      angle: 0,
      strokeColor: borderColor,
      backgroundColor: fillColor,
      fillStyle: "solid",
      strokeWidth: borderWidth,
      strokeStyle: node.borderDash === "dashed" ? "dashed" : node.borderDash === "dotted" ? "dotted" : "solid",
      roughness: 0,
      opacity: opacity,
      roundness: elemType === "ellipse" ? { type: 2 } : (borderRadius > 0 ? { type: 3 } : null),
      groupIds: [],
      boundElements: [],
      version: 1,
      isDeleted: false,
    };

    elements.push(elem);

    // Add text inside shape
    if (text) {
      const innerTextH = estimateTextHeight(text, fontSize, w - SHAPE_INSET * 2);
      const tw = textW - SHAPE_INSET * 2;
      const tx = textAlign === "center" ? x + w / 2 - tw / 2 :
                 textAlign === "right" ? x + w - tw - SHAPE_INSET : x + SHAPE_INSET;
      const ty = verticalAlign === "middle" ? y + h / 2 - innerTextH / 2 :
                 verticalAlign === "bottom" ? y + h - SHAPE_INSET - innerTextH : y + SHAPE_INSET;

      elements.push({
        id: genId(),
        type: "text",
        x: tx,
        y: ty,
        width: tw,
        height: innerTextH + 4,
        angle: 0,
        strokeColor: textColor,
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        roundness: null,
        groupIds: [],
        boundElements: [elem],
        version: 1,
        isDeleted: false,
        text: String(text),
        fontSize: fontSize,
        fontFamily: 2,
        textAlign: textAlign,
        verticalAlign: "top",
        containerId: elem.id,
        originalText: String(text),
      });
    }

    if (node.id) idToAbsPos.set(node.id, { x, y, w, h });
    return { x, y, w, h };
  }

  // --- Add frame background ---
  function addFrameBG(f, x, y, w, h) {
    const fillColor = hexColor(f.fillColor, "transparent");
    const borderColor = hexColor(f.borderColor, "transparent");
    const borderWidth = f.borderWidth || 0;
    const borderRadius = f.borderRadius || 0;

    if (fillColor === "transparent" && borderWidth === 0) return; // skip virtual frames

    elements.push({
      id: genId(),
      type: "rectangle",
      x: x,
      y: y,
      width: w,
      height: h,
      angle: 0,
      strokeColor: borderColor,
      backgroundColor: fillColor,
      fillStyle: "solid",
      strokeWidth: borderWidth,
      strokeStyle: f.borderDash === "dashed" ? "dashed" : f.borderDash === "dotted" ? "dotted" : "solid",
      roughness: 0,
      opacity: 100,
      roundness: borderRadius > 0 ? { type: 3 } : null,
      groupIds: [],
      boundElements: [],
      version: 1,
      isDeleted: false,
    });
  }

  // --- Make connector ---
  function makeConnector(node, posMap) {
    const c = node.connector;
    if (!c) return null;

    const fromPos = resolveAnchor(c.from, c.fromAnchor, posMap);
    const toPos = resolveAnchor(c.to, c.toAnchor, posMap);
    if (!fromPos || !toPos) return null;

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;

    const lineColor = hexColor(c.lineColor, "#555");
    const lineWidth = c.lineWidth || 2;

    const elem = {
      id: genId(),
      type: "arrow",
      x: fromPos.x,
      y: fromPos.y,
      width: dx,
      height: dy,
      angle: 0,
      strokeColor: lineColor,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: lineWidth,
      strokeStyle: c.lineStyle === "dashed" ? "dashed" : c.lineStyle === "dotted" ? "dotted" : "solid",
      roughness: 0,
      opacity: 100,
      roundness: { type: 2 },
      groupIds: [],
      boundElements: [],
      version: 1,
      isDeleted: false,
      points: [[0, 0], [dx, dy]],
      startBinding: null,
      endBinding: null,
      startArrowhead: (c.startArrow && c.startArrow !== "none") ? "arrow" : null,
      endArrowhead: (c.endArrow && c.endArrow !== "none") ? "arrow" : null,
    };

    // Add label if present
    if (c.label) {
      elem.boundElements = [{ id: genId(), type: "text" }];
      elements.push({
        id: elem.boundElements[0].id,
        type: "text",
        x: fromPos.x + dx / 2 - estimateTextWidth(c.label, 12) / 2,
        y: fromPos.y + dy / 2 - 8,
        width: estimateTextWidth(c.label, 12) + 8,
        height: 16,
        angle: 0,
        strokeColor: lineColor,
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        roundness: null,
        groupIds: [],
        boundElements: null,
        version: 1,
        isDeleted: false,
        text: c.label,
        fontSize: 12,
        fontFamily: 2,
        textAlign: "center",
        verticalAlign: "top",
        containerId: elem.id,
        originalText: c.label,
      });
    }

    return elem;
  }

  function resolveAnchor(ref, anchor, posMap) {
    if (typeof ref === "object" && ref.x != null && ref.y != null) {
      return { x: ref.x, y: ref.y };
    }
    const pos = posMap.get(ref);
    if (!pos) return null;
    const cx = pos.x + pos.w / 2;
    const cy = pos.y + pos.h / 2;
    switch (anchor) {
      case "top": return { x: cx, y: pos.y };
      case "bottom": return { x: cx, y: pos.y + pos.h };
      case "left": return { x: pos.x, y: cy };
      case "right": return { x: pos.x + pos.w, y: cy };
      default: return { x: cx, y: cy };
    }
  }
}

// --- Extract text from node ---
function extractText(node) {
  if (!node.text) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.text)) {
    return node.text.map(r => r.content || "").join("");
  }
  return String(node.text);
}

module.exports = { compileDSL };
