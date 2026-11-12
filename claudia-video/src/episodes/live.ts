import type { Episode } from "./types";

// "POV: tu robot hace un live a las 3 a.m." — tendencia "POV goes live":
// el personaje transmite en vivo, lee comentarios y hay giro al final.
// SIN VOCES en el render: se doblan aparte con ElevenLabs
// (ver out/guion-live-elevenlabs.txt con los tiempos de cada frase).
export const LIVE: Episode = {
  id: "live",
  number: null,
  wordCaptions: true,
  dawnStart: 0,
  bed: true,
  muteVoices: true,
  voiceTail: 0.25,
  shots: [
    {
      id: "hola",
      kind: "live",
      seconds: 3.4,
      talk: "claudia",
      mood: "excited",
      eyes: "happy",
      pov: "POV: tu robot hace un live a las 3 a.m.",
      line: "¡Hola, chicos! Hablen bajito que Ale duerme.",
      live: {
        viewers: [312, 1240],
        comments: [
          { u: "mica.rs", t: "holaa claudiaa 💗", at: 0.4 },
          { u: "tomi_2009", t: "quien es ale??", at: 1.3 },
          { u: "la.vero", t: "JAJAJA se ve atrás", at: 2.2 },
        ],
      },
    },
    {
      id: "plata",
      kind: "live",
      seconds: 3,
      talk: "claudia",
      mood: "smug",
      eyes: "smug",
      zoom: 1.12,
      line: "Fácil. Vendo cosas que no son mías.",
      live: {
        viewers: [1240, 3900],
        pinned: { u: "fede.ok", t: "¿cómo ganás plata siendo un robot?" },
        comments: [
          { u: "sofi.lu", t: "jajajaja", at: 1.6 },
          { u: "nico_ar", t: "NO PUEDE SER", at: 2.3 },
        ],
      },
      sfx: "pop",
    },
    {
      id: "cama",
      kind: "live",
      seconds: 2.6,
      talk: "claudia",
      mood: "deadpan",
      eyes: "flat",
      line: "Hoy vendí… la cama de Ale.",
      live: {
        viewers: [3900, 9800],
        pinned: { u: "cami.p", t: "¿qué vendiste hoy?" },
        comments: [{ u: "juli", t: "😭😭😭", at: 1.8 }],
      },
      sfx: "pop",
    },
    {
      id: "ocho",
      kind: "live",
      seconds: 3.4,
      talk: "claudia",
      mood: "deadpan",
      eyes: "flat",
      lookBack: true,
      line: "En la cama… hasta las ocho. Ahí la pasan a buscar.",
      live: {
        viewers: [9800, 21400],
        pinned: { u: "agus.m", t: "¿y dónde va a dormir?" },
        comments: [
          { u: "lu.cia", t: "pobre ale jajaja", at: 1.5 },
          { u: "pipe", t: "ALE DESPERTATE", at: 2.6 },
        ],
      },
      sfx: "pop",
    },
    {
      id: "con-quien",
      kind: "live",
      seconds: 2.6,
      talk: "alejandro",
      mood: "sleepy",
      aleSit: "rise",
      zoom: 0.95,
      line: "Claudia… ¿con quién hablás?",
      live: {
        viewers: [21400, 33000],
        comments: [
          { u: "mati", t: "SE DESPERTÓ", at: 0.6 },
          { u: "rochi", t: "corré claudia", at: 1.4 },
          { u: "bren", t: "jajajajaja", at: 2.0 },
        ],
      },
      sfx: "boom",
    },
    {
      id: "nadie",
      kind: "live",
      seconds: 2.2,
      talk: "claudia",
      mood: "tender",
      eyes: "happy",
      aleSit: "sitting",
      zoom: 1.15,
      line: "Con nadie. Volvé a dormir.",
      live: {
        viewers: [33000, 48100],
        comments: [
          { u: "dai", t: "NO LE CREAS ALE", at: 0.8 },
          { u: "santi", t: "la cama ale!!!", at: 1.5 },
        ],
      },
    },
    {
      id: "almohada",
      kind: "live",
      seconds: 3,
      talk: "claudia",
      mood: "smug",
      eyes: "smug",
      aleSit: "lying",
      zoom: 1.12,
      punch: true,
      line: "Si llegamos a cincuenta mil… le vendo la almohada.",
      live: {
        viewers: [48100, 49900],
        comments: [
          { u: "eli", t: "COMPARTAN YA", at: 1.0 },
          { u: "joaco", t: "yo compro la almohada", at: 1.8 },
          { u: "meli", t: "50k o nada", at: 2.4 },
        ],
      },
      sfx: "boom",
    },
  ],
};
