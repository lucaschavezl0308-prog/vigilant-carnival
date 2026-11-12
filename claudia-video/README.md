# Claudia — serie para @claudiasinpermiso

Corto vertical (1080×1920, ~40 s) en 3D low-poly hecho con Remotion + Three.js.
Alejandro le pregunta a su robotcita Claudia qué hizo toda la madrugada… y
resulta que hizo cinco páginas web y las vendió.

## Episodios

| Composición | Episodio | Archivo |
| --- | --- | --- |
| `ClaudiaMadrugada` | 1 — Claudia nunca duerme | `src/episodes/ep1.ts` |
| `ClaudiaEp2` | 2 — Claudia analizó el mercado | `src/episodes/ep2.ts` |
| `ClaudiaNavidad` | Ya es Navidad (video suelto) | `src/episodes/navidad.ts` |
| `ClaudiaAlarma` | Alarma de las 6 (video suelto, sin sonido de alarma) | `src/episodes/alarma.ts` |

Cada toma tiene `line` (subtítulo), `mood` (emoción de la voz), `eyes`
(expresión de Claudia), `coffee`, `punch` (zoom en el remate) y `sfx`.

## Archivos

- `src/episodes/` — **los guiones** de cada episodio.
- `src/script.ts` — tiempos y datos de voz compartidos.
- `src/Episode.tsx` — arma un episodio a partir de su guion.
- `src/ui/Ep2Ui.tsx` — subtítulos palabra por palabra, análisis de mercado, seguidores y cierre del episodio 2.
- `src/three/Characters.tsx` — modelos de Alejandro y Claudia (y la taza).
- `src/three/Room.tsx` — la habitación al amanecer y la cámara.
- `src/three/Scene3D.tsx` — encuadres de cámara por tipo de toma.
- `src/ui/Ui.tsx` — subtítulos, pantalla de webs, celular de ventas y cierre.
- `src/ProfilePic.tsx` — foto de perfil de Claudia (1080×1080).
- `public/sfx/` — efectos cortos (teclado, pop, ding). Sin música de fondo.

## Comandos

```bash
npm i
npx remotion studio                 # vista previa
npx remotion render ClaudiaMadrugada out/claudia-madrugada.mp4
npx remotion render ClaudiaEp2 out/claudia-ep2.mp4
npx remotion render ClaudiaNavidad out/claudia-navidad.mp4
npx remotion render ClaudiaAlarma out/claudia-alarma.mp4
npx remotion still FotoPerfil out/foto-perfil-claudiasinpermiso.png
```

En una máquina sin internet hacia remotion.media, agrega
`--browser-executable=<ruta a chrome-headless-shell>`.

## Voces

Las voces se generan con edge-tts (voces neuronales de Microsoft, acento
argentino): Tomás para Alejandro y Elena para Claudia, con un toque robótico.

```bash
pip install edge-tts
python scripts/generar-voces.py        # todos los episodios
python scripts/generar-voces.py ep2    # solo uno
```

El script lee los guiones de `src/episodes/` (usa `say` si la voz debe leer
algo distinto al subtítulo, y `mood` para la emoción) y escribe
`public/voz/<ep>/<id>.mp3` más `src/voice-data.json` (duración, volumen por
frame y tiempo de cada palabra). Las tomas se alargan
solas si la frase no entra, y la boca se mueve con el volumen de la voz.
