#!/usr/bin/env bash
set -euo pipefail
PROJ="/home/bryanchasko/blender-projects"
BLEND="$PROJ/latrodectus-bishopi-hand.blend"
PY="$PROJ/scripts/blender-contact-sheet.py"
if [ ! -f "$BLEND" ]; then BLEND="/tmp/adobe-express-mcp-lab/blender-projects/latrodectus-bishopi-hand.blend"; fi
echo "[contact-sheet] blender -b $BLEND --python $PY"
blender -b "$BLEND" --python "$PY"
echo "[contact-sheet] done: 8 views×9 hosts=72 PNGs renders/contact-sheet/<host>/<view>.png"
