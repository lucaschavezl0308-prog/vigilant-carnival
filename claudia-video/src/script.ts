// Guion del corto. Cada toma dura `seconds` segundos.
// `talk` indica quién habla (mueve la boca) y `line` es el subtítulo.

export type Speaker = "alejandro" | "claudia" | null;

export type ShotKind =
  | "wide"
  | "alejandro"
  | "claudia"
  | "claudiaAway"
  | "twoShot"
  | "webs"
  | "ventas"
  | "end";

export type Shot = {
  id: string;
  kind: ShotKind;
  seconds: number;
  talk: Speaker;
  line?: string;
};

export const FPS = 30;

export const SHOTS: Shot[] = [
  { id: "amanecer", kind: "wide", seconds: 3, talk: null },
  {
    id: "pregunta",
    kind: "alejandro",
    seconds: 3.2,
    talk: "alejandro",
    line: "Claudia… ¿qué hiciste toda la madrugada?",
  },
  {
    id: "nada",
    kind: "claudia",
    seconds: 2.4,
    talk: "claudia",
    line: "Nada. Cosas de robot.",
  },
  {
    id: "notificaciones",
    kind: "alejandro",
    seconds: 3.4,
    talk: "alejandro",
    line: "¿Y por qué tengo 47 notificaciones de pago?",
  },
  {
    id: "ah-eso",
    kind: "claudiaAway",
    seconds: 2.2,
    talk: "claudia",
    line: "Ah… eso.",
  },
  {
    id: "webs",
    kind: "webs",
    seconds: 5,
    talk: "claudia",
    line: "Hice cinco páginas web.",
  },
  {
    id: "cinco",
    kind: "alejandro",
    seconds: 2.8,
    talk: "alejandro",
    line: "¿¡Cinco!? ¿Y quién te las compró?",
  },
  {
    id: "vendi",
    kind: "claudia",
    seconds: 3.4,
    talk: "claudia",
    line: "Las vendí. A las 4 a.m. la gente compra de todo.",
  },
  {
    id: "ventas",
    kind: "ventas",
    seconds: 4.2,
    talk: null,
    line: "",
  },
  {
    id: "mi-parte",
    kind: "alejandro",
    seconds: 2.4,
    talk: "alejandro",
    line: "…¿Y mi parte?",
  },
  {
    id: "cafe",
    kind: "twoShot",
    seconds: 3.8,
    talk: "claudia",
    line: "Tu parte es el café. Ya está calientito.",
  },
  {
    id: "me-sirve",
    kind: "alejandro",
    seconds: 2.4,
    talk: "alejandro",
    line: "…Me sirve.",
  },
  { id: "final", kind: "end", seconds: 3, talk: null },
];

export const shotFrames = (s: Shot) => Math.round(s.seconds * FPS);
export const TOTAL_FRAMES = SHOTS.reduce((a, s) => a + shotFrames(s), 0);
