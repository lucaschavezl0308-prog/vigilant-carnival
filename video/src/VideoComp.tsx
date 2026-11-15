import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp} from './anim';
import {Background} from './components/Background';
import {Captions, Chrome} from './components/Chrome';
import {SceneRenderer} from './scenes';
import type {Manifest, Scene} from './types';

const dimFor = (s: Scene) => (s.type === 'intro' ? 0.18 : s.type === 'outro' ? 0.45 : 0.6);

/** Destello diagonal en cada cambio de escena. */
const Sweep: React.FC<{boundaries: number[]}> = ({boundaries}) => {
  const frame = useCurrentFrame();
  const b = boundaries.find((x) => Math.abs(frame - x) <= 9);
  if (b === undefined) return null;
  const x = interpolate(frame, [b - 9, b + 9], [-60, 160], clamp);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: `${x}%`,
          width: '22%',
          height: '140%',
          rotate: '18deg',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), rgba(255,45,138,0.22), transparent)',
        }}
      />
    </AbsoluteFill>
  );
};

export const VideoComp: React.FC<{manifest: Manifest; captions?: boolean}> = ({manifest, captions = true}) => {
  const frame = useCurrentFrame();
  const scenes = manifest.scenes;
  const idx = Math.max(0, scenes.findIndex((s) => frame >= s.from && frame < s.from + s.duration));
  const cur = scenes[idx];
  const prev = scenes[Math.max(0, idx - 1)];
  const dim = interpolate(frame, [cur.from, cur.from + 14], [dimFor(prev), dimFor(cur)], clamp);
  return (
    <AbsoluteFill>
      <Background dim={dim} />
      {scenes.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.duration} premountFor={30} name={`${i + 1}. ${s.chapter ?? s.type}`}>
          <SceneRenderer scene={s} />
        </Sequence>
      ))}
      <Sweep boundaries={scenes.slice(1).map((s) => s.from)} />
      <Chrome manifest={manifest} />
      {captions ? <Captions captions={manifest.captions} /> : null}
      <Audio src={staticFile(manifest.audio)} />
    </AbsoluteFill>
  );
};
