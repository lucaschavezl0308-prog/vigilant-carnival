export type SceneType =
  | 'intro'
  | 'stat'
  | 'table'
  | 'bullets'
  | 'checklist'
  | 'warning'
  | 'compare'
  | 'timeline'
  | 'map'
  | 'character'
  | 'cast'
  | 'storage'
  | 'quote'
  | 'outro';

export type Scene = {
  type: SceneType;
  from: number;
  duration: number;
  beats: number[];
  reveals: number[];
  chapter: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

export type Caption = {from: number; to: number; text: string};

export type ThumbnailData = {
  top: string;
  big: string;
  tag?: string;
  accent?: string;
  visual: string;
};

export type Manifest = {
  id: string;
  slug: string;
  fps: number;
  durationInFrames: number;
  audio: string;
  title: string;
  scenes: Scene[];
  captions: Caption[];
  chapters: {from: number; title: string}[];
  thumbnail: ThumbnailData;
};

export type SceneProps = {scene: Scene};
