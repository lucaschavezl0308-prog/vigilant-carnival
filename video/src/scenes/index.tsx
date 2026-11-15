import React from 'react';
import type {SceneProps, SceneType} from '../types';
import {Intro, Outro, Quote, Stat} from './basic';
import {Bullets, Checklist, Compare, Storage, Table, Timeline, Warning} from './lists';
import {Cast, Character, MapScene} from './special';

const REGISTRY: Record<SceneType, React.FC<SceneProps>> = {
  intro: Intro,
  stat: Stat,
  quote: Quote,
  outro: Outro,
  bullets: Bullets,
  checklist: Checklist,
  warning: Warning,
  table: Table,
  compare: Compare,
  timeline: Timeline,
  storage: Storage,
  map: MapScene,
  character: Character,
  cast: Cast,
};

export const SceneRenderer: React.FC<SceneProps> = ({scene}) => {
  const Cmp = REGISTRY[scene.type];
  if (!Cmp) throw new Error(`Tipo de escena desconocido: ${scene.type}`);
  return <Cmp scene={scene} />;
};
