# Proyecto Remotion · Modo Leonida

Plantillas animadas de los 10 vídeos. Los datos de cada vídeo (`src/data/NN.json`) los genera `pipeline/producir.py` a partir de `contenido/*.yaml`; no se editan a mano.

- `src/scenes/`: tipos de escena (intro, stat, table, bullets, checklist, warning, compare, timeline, storage, map, character, cast, quote, outro)
- `src/components/`: fondo synthwave, cabecera y capítulos, subtítulos e iconos
- `src/Thumbnail.tsx`, `src/ChannelArt.tsx`: miniaturas, banner y avatar
- `src/brand.ts`: nombre del canal, colores y fuentes

Vista previa: `npx remotion studio` · Render: `bash ../pipeline/renderizar.sh`
