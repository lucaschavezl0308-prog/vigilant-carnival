#!/usr/bin/env bash
# Renderiza vídeos y miniaturas a partir de los manifiestos generados por producir.py
#   bash pipeline/renderizar.sh            # todos
#   bash pipeline/renderizar.sh 01 05      # algunos
#   bash pipeline/renderizar.sh canal      # sólo banner y avatar del canal
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
cd "$RAIZ/video"

if [[ "${1:-}" == "canal" ]]; then
  mkdir -p "$RAIZ/publicar/canal"
  npx remotion still Banner "$RAIZ/publicar/canal/banner.png"
  npx remotion still Avatar "$RAIZ/publicar/canal/avatar.png"
  exit 0
fi

if [[ $# -gt 0 ]]; then IDS="$*"; else IDS=$(ls src/data/[0-9][0-9].json | xargs -n1 basename | sed 's/\.json//'); fi

for id in $IDS; do
  slug=$(python3 -c "import json;print(json.load(open('src/data/$id.json'))['slug'])")
  carpeta="$RAIZ/publicar/$id-$slug"
  mkdir -p "$carpeta"
  echo "▶ $id $slug"
  npx remotion still "Miniatura$id" "$carpeta/miniatura.png"
  npx remotion render "Video$id" "$carpeta/$id-$slug.mp4" --crf=20 --audio-bitrate=192k --log=error
done
