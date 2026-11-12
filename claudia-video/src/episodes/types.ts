import type { EyeStyle } from "../three/Characters";
import type { VisualStyle } from "../three/style";

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
  | "excited"
  | "deadpan";

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
  | "end2"
  | "xmasWide"
  | "compras"
  | "phone"
  | "bed"
  | "alejandroBed"
  | "pcSaldo"
  | "vendidos"
  | "empresa"
  | "live";

export type Sfx = "boom" | "scratch" | "ding" | "pop" | "whoosh";

export type LiveComment = { u: string; t: string; /** segundo (dentro de la toma) */ at: number };

export type LiveInfo = {
  /** espectadores al inicio y al final de la toma */
  viewers: [number, number];
  comments?: LiveComment[];
  /** pregunta destacada que Claudia está respondiendo */
  pinned?: { u: string; t: string };
};

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
  /** datos del vivo (formato "POV live") */
  live?: LiveInfo;
  /** Alejandro en la cama: acostado, se sienta en la toma, o ya sentado */
  aleSit?: "lying" | "rise" | "sitting";
  /** Claudia gira la cabeza hacia la cama */
  lookBack?: boolean;
  /** texto "POV: ..." al inicio de la toma */
  pov?: string;
  /** acercamiento extra de la cámara (1 = normal) */
  zoom?: number;
};

export type Episode = {
  id: string;
  /** número que aparece en pantalla ("EP. 2") o null */
  number: number | null;
  /** subtítulos palabra por palabra (estilo TikTok) */
  wordCaptions: boolean;
  /** cuánto avanzó el amanecer al empezar (en frames de 0..1200) */
  dawnStart: number;
  /** "lowpoly" (por defecto) o "suave": sin facetas, luz ambiente, brillo */
  style?: VisualStyle;
  /** no incluir el audio de las voces (se doblan aparte, p. ej. ElevenLabs) */
  muteVoices?: boolean;
  /** hay cama en la habitación (y celular en el escritorio) */
  bed?: boolean;
  /** decoración navideña y gorro de Papá Noel */
  xmas?: boolean;
  /** segundos de aire después de cada frase (menos = más ritmo) */
  voiceTail?: number;
  shots: Shot[];
};
