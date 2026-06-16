#!/usr/bin/env bash
# Preflight check for the beautiful-excalidraw skill.
# Verifies the tools needed to render SVG and convert to .excalidraw / PNG.
set -u
ok=1
echo "▶ Checking prerequisites for beautiful-excalidraw…"
echo

# Node ≥ 20
if command -v node >/dev/null 2>&1; then
  echo "  ✓ Node $(node -v)"
else
  echo "  ✗ Node.js not found — install Node ≥ 20 (https://nodejs.org)"
  ok=0
fi

# excalidraw-cli
if command -v excalidraw-cli >/dev/null 2>&1; then
  echo "  ✓ excalidraw-cli ($(excalidraw-cli --version 2>/dev/null || echo 'installed'))"
else
  echo "  ! excalidraw-cli not found globally."
  echo "    Try: cd <project>/excalidraw-cli && npm install && npm link"
fi

echo
if [ "$ok" = 1 ]; then
  echo "✅ Ready. No cloud account needed — everything runs locally."
else
  echo "❌ Missing prerequisites above. Install them, then re-run this check."
  exit 1
fi
