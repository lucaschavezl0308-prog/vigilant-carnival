// Utilidades de tiempo y voces compartidas por todos los episodios.
// Los guiones están en src/episodes/. Las voces las genera
// scripts/generar-voces.py y quedan en src/voice-data.json.
import voiceData from "./voice-data.json";
import type { Episode, Shot } from "./episodes/types";

export type { Episode, Shot, ShotKind, Speaker } from "./episodes/types";

export const FPS = 30;

/** Frame (dentro de la toma) en el que arranca la voz. */
export const VOICE_START = 4;
const VOICE_TAIL = 0.4; // segundos de aire después de cada frase

export type Word = { w: string; s: number; e: number };
type VoiceInfo = { dur: number; env: number[]; words: Word[] };

const data = voiceData as Record<string, VoiceInfo>;

export const voiceKey = (ep: string, id: string) => `${ep}/${id}`;
export const voiceInfo = (ep: string, id: string): VoiceInfo | undefined =>
  data[voiceKey(ep, id)];

/** Volumen de la voz (0..1) en un frame de la toma, para mover la boca. */
export const voiceLevel = (ep: string, id: string, frameInShot: number): number => {
  const env = voiceInfo(ep, id)?.env;
  if (!env) return 0;
  return env[frameInShot - VOICE_START] ?? 0;
};

export const shotFrames = (ep: Episode, s: Shot) => {
  const d = voiceInfo(ep.id, s.id)?.dur;
  const needed = d ? VOICE_START / FPS + d + (ep.voiceTail ?? VOICE_TAIL) : 0;
  return Math.round(Math.max(s.seconds, needed) * FPS);
};

export const episodeFrames = (ep: Episode) =>
  ep.shots.reduce((a, s) => a + shotFrames(ep, s), 0);
