# Modo Leonida · Canal de GTA 6

Diez vídeos de YouTube listos para publicar el **jueves 19 de noviembre de 2026**, día de lanzamiento de GTA 6. Cada uno incluye guion, voz, música original, gráficos animados, subtítulos, miniatura y textos para YouTube.

Las carpetas `publicar/NN-…/` tienen todo lo que hay que subir. Lee primero **[publicar/CALENDARIO.md](publicar/CALENDARIO.md)**.

## Los 10 vídeos

<!-- TABLA_VIDEOS -->
| # | Título | Duración | Carpeta |
|---|---|---|---|
| 01 | ¿A qué hora sale GTA 6? Horario por países (España y Latinoamérica) | 3:45 | [`publicar/01-hora-de-lanzamiento/`](publicar/01-hora-de-lanzamiento/) |
| 02 | ¿Cuánto ocupa GTA 6? Espacio en PS5 y Xbox y cómo hacer sitio | 3:02 | [`publicar/02-cuanto-ocupa/`](publicar/02-cuanto-ocupa/) |
| 03 | GTA 6: ¿Estándar o Ultimate? Precio, qué incluye y cuál comprar | 2:26 | [`publicar/03-estandar-o-ultimate/`](publicar/03-estandar-o-ultimate/) |
| 04 | GTA 6 en físico NO trae disco: qué hay en la caja y si te conviene | 1:56 | [`publicar/04-fisico-sin-disco/`](publicar/04-fisico-sin-disco/) |
| 05 | GTA 6 a 30 FPS: PS5 vs PS5 Pro vs Xbox Series X y S, ¿dónde jugarlo? | 2:30 | [`publicar/05-fps-y-consolas/`](publicar/05-fps-y-consolas/) |
| 06 | ¿GTA 6 en PC? Lo que se sabe y cuidado con las descargas falsas | 2:01 | [`publicar/06-gta-6-pc/`](publicar/06-gta-6-pc/) |
| 07 | ¿GTA 6 tiene online? Lo que hay el día 19 (y lo que no) | 1:42 | [`publicar/07-gta-6-online/`](publicar/07-gta-6-online/) |
| 08 | El mapa de GTA 6: Leonida zona por zona (y sus lugares reales) | 1:53 | [`publicar/08-mapa-leonida/`](publicar/08-mapa-leonida/) |
| 09 | Personajes de GTA 6: quién es quién (Lucia, Jason y más) sin spoilers | 2:08 | [`publicar/09-personajes/`](publicar/09-personajes/) |
| 10 | Checklist GTA 6: 10 cosas que hacer antes de empezar a jugar | 2:03 | [`publicar/10-checklist-lanzamiento/`](publicar/10-checklist-lanzamiento/) |
<!-- /TABLA_VIDEOS -->

Elegí los temas pensando en las preguntas que más se buscan el día de un lanzamiento: hora, espacio, qué edición comprar, formato físico, rendimiento, PC, online, mapa y personajes, más una checklist para esa noche.

## Qué hay en cada carpeta de `publicar/`

| Archivo | Qué es |
|---|---|
| `NN-slug.mp4` | Vídeo final, 1920×1080, 30 fps, audio a −14 LUFS (el nivel de referencia de YouTube) |
| `miniatura.png` | Miniatura de 1280×720 |
| `youtube.md` | Título, descripción con capítulos, etiquetas, comentario fijado y ajustes |
| `subtitulos.srt` | Subtítulos en español (también van incrustados en la imagen) |
| `guion.md` | Guion completo con códigos de tiempo y lo que sale en pantalla |

Además: `publicar/canal/` (banner y avatar), [`CANAL.md`](publicar/CANAL.md) (cómo configurar el canal) y [`FUENTES.md`](publicar/FUENTES.md) (los datos usados y de dónde salen).

> Los `.mp4` no se suben al repositorio porque pesan demasiado. Se entregan aparte y se pueden volver a generar con los pasos de abajo.

## Cómo está hecho

```
contenido/*.yaml        guiones: escenas, datos en pantalla y frases de narración
pipeline/producir.py    voz frase a frase, mezcla con música y efectos, subtítulos y textos de YouTube
pipeline/voz.py         voz: Kokoro (local, licencia Apache 2.0, uso comercial permitido) o ElevenLabs
pipeline/audio_gen.py   música synthwave y efectos generados por código: sin Content ID
pipeline/pronunciacion.py  cómo debe sonar cada término (GTA 6 → «ge te a seis», 79,99 € → …)
video/                  proyecto Remotion: plantillas animadas, miniaturas, banner y avatar
```

Todo lo que se ve y se oye es original: no se usan imágenes, logos, tráileres ni música de Rockstar.

## Regenerar

Requisitos: Python 3.11+, Node 20+ y ffmpeg.

```bash
pip install kokoro-onnx soundfile scipy pyyaml numpy && pip install --no-deps num2words
cd video && npm install && cd ..

python3 pipeline/producir.py          # voz, mezcla, subtítulos y textos (descarga el modelo de voz la primera vez)
bash pipeline/renderizar.sh           # vídeos y miniaturas en publicar/
bash pipeline/renderizar.sh canal     # banner y avatar
```

Para ver y retocar los vídeos en el navegador: `cd video && npx remotion studio`.

### Cambiar un dato

1. Edita el `.yaml` del vídeo en `contenido/`: el texto de `lines` es la narración y `data` lo que sale en pantalla.
2. `python3 pipeline/producir.py 03` (solo se regeneran las frases que han cambiado).
3. `bash pipeline/renderizar.sh 03`

### Mejorar la voz con ElevenLabs

La cuenta conectada está en el **plan gratuito**: unos 9.500 caracteres disponibles (los 10 guiones suman unos 22.000) y, además, ese plan no permite uso comercial. Por eso la voz actual es Kokoro, que es libre y sin límites. Si contratas Starter (30.000 caracteres al mes, con licencia comercial) o un plan superior, basta con:

```bash
export ELEVENLABS_API_KEY=...        # en este entorno ya la inyecta el proxy
python3 pipeline/producir.py --motor elevenlabs --voz <voice_id>
bash pipeline/renderizar.sh
```

Para cambiar de voz Kokoro: `--voz ef_dora` (femenina) o `--voz em_santa`.

### Cambiar nombre o colores del canal

Edita `video/src/brand.ts` y vuelve a renderizar.
