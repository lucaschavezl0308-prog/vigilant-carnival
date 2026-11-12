import { EP1 } from "./ep1";
import { EP2 } from "./ep2";
import { NAVIDAD } from "./navidad";
import { ALARMA } from "./alarma";
import { LIVE } from "./live";
import { JEFA } from "./jefa";
import { MAQUINA } from "./maquina";

export const EPISODES = [EP1, EP2, NAVIDAD, ALARMA, LIVE, JEFA, MAQUINA];
export type { Episode, Shot, ShotKind, Speaker, Mood, Sfx } from "./types";
