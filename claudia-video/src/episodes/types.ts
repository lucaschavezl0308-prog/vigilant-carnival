import type { EyeStyle } from "../three/Characters";

export type Speaker = "alejandro" | "claudia" | null;

/** Emoción de la voz (cambia velocidad/tono en scripts/generar-voces.py). */
export type Mood =
  | "neutral"
  | "sleepy"
  | "shocked"
  | "sad"
  | "hopeful"
  | "suspicious"
  | "serious"
  | "proud"
  | "tender"
  | "smug"
  | "excited";

export type ShotKind =
  | "wide"
  | "alejandro"
  | "claudia"
  | "claudiaClose"
  | "claudiaAway"
  | "twoShot"
  | "webs"
  | "ventas"
  | "mercado"
  | "seguidores"
  | "end"
  | "end2";

export type Sfx = "boom" | "scratch" | "ding" | "pop" | "whoosh";

export type Shot = {
  id: string;
  kind: ShotKind;
  seconds: number;
  talk: Speaker;
  /** subtítulo */
  line?: string;
  /** texto para la voz si debe leerse distinto al subtítulo */
  say?: string;
  mood?: Mood;
  /** ¿Alejandro tiene el café en la mano? */
  coffee?: boolean;
  /** expresión de Claudia */
  eyes?: EyeStyle;
  /** zoom de golpe en el remate */
  punch?: boolean;
  /** efecto de sonido al empezar la toma */
  sfx?: Sfx;
};

export type Episode = {
  id: string;
  /** número que aparece en pantalla ("EP. 2") o null */
  number: number | null;
  /** subtítulos palabra por palabra (estilo TikTok) */
  wordCaptions: boolean;
  /** cuánto avanzó el amanecer al empezar (en frames de 0..1200) */
  dawnStart: number;
  /** segundos de aire después de cada frase (menos = más ritmo) */
  voiceTail?: number;
  shots: Shot[];
};
