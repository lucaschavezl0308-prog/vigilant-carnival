// Exporta el guion de un episodio con los tiempos de cada frase, para doblar
// las voces aparte (p. ej. con ElevenLabs) y pegarlas en el editor.
// Uso: npx tsx scripts/guion-elevenlabs.ts live > out/guion-live-elevenlabs.txt
import { EPISODES } from "../src/episodes/index";
import { FPS, shotFrames, VOICE_START, voiceInfo } from "../src/script";

const id = process.argv[2] ?? "live";
const ep = EPISODES.find((e) => e.id === id);
if (!ep) throw new Error(`No existe el episodio ${id}`);

const tc = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`;
};

const EMOCION: Record<string, string> = {
  excited: "emocionada, rápida",
  smug: "canchera, sobradora",
  deadpan: "cara de póker, plana, sin emoción",
  sleepy: "dormido, arrastrando las palabras",
  tender: "tierna, suave, como calmando a un nene",
  serious: "seria",
  shocked: "sorprendido, gritando",
  sad: "triste",
  hopeful: "esperanzado",
  suspicious: "desconfiado",
  proud: "orgullosa",
};

const lines: string[] = [];
lines.push(`GUION PARA DOBLAJE — ${ep.id}`);
lines.push("Cada frase empieza en el tiempo indicado y tiene que entrar en el espacio disponible.");
lines.push("Alejandro: hombre joven, acento argentino. Claudia: robot mujer, voz aguda y simpática.");
lines.push("");
let t = 0;
for (const shot of ep.shots) {
  const frames = shotFrames(ep, shot);
  const info = voiceInfo(ep.id, shot.id);
  if (shot.talk && shot.line) {
    const start = t + VOICE_START / FPS;
    const room = (frames - VOICE_START) / FPS;
    lines.push(`[${tc(start)}] ${shot.talk.toUpperCase()} — (${EMOCION[shot.mood ?? ""] ?? "normal"})`);
    lines.push(`  "${shot.say ?? shot.line}"`);
    lines.push(`  espacio: ${room.toFixed(1)} s  (referencia: ${info?.dur.toFixed(1) ?? "?"} s)`);
    lines.push("");
  }
  t += frames / FPS;
}
lines.push(`Duración total del video: ${tc(t)}`);
process.stdout.write(lines.join("\n") + "\n");
