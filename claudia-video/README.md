# Claudia nunca duerme — @claudiasinpermiso

Corto vertical (1080×1920, ~40 s) en 3D low-poly hecho con Remotion + Three.js.
Alejandro le pregunta a su robotcita Claudia qué hizo toda la madrugada… y
resulta que hizo cinco páginas web y las vendió.

## Archivos

- `src/script.ts` — **el guion**: tomas, duración y subtítulos. Edita aquí los diálogos.
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
npx remotion still FotoPerfil out/foto-perfil-claudiasinpermiso.png
```

En una máquina sin internet hacia remotion.media, agrega
`--browser-executable=<ruta a chrome-headless-shell>`.

## Voces

El video va con subtítulos y efectos, sin voces. Para agregar voces con IA
(ElevenLabs), genera un MP3 por línea del guion en `public/voz/<id>.mp3` y
agrégalos con `<Audio>` en `src/ClaudiaVideo.tsx`.
