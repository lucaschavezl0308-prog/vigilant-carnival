import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, CHANNEL, F, GRADIENT} from '../brand';
import {clamp} from '../anim';
import type {Caption, Manifest} from '../types';

export const Logo: React.FC<{size?: number}> = ({size = 64}) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.yellow} />
        <stop offset="0.55" stopColor={C.orange} />
        <stop offset="1" stopColor={C.magenta} />
      </linearGradient>
      <clipPath id="lc">
        <rect x="0" y="0" width="64" height="64" rx="16" />
      </clipPath>
    </defs>
    <g clipPath="url(#lc)">
      <rect width="64" height="64" fill={C.deep} />
      <circle cx="32" cy="40" r="20" fill="url(#lg)" />
      {[38, 44, 50].map((y, i) => (
        <rect key={y} x="0" y={y} width="64" height={2 + i} fill={C.deep} />
      ))}
      <rect x="0" y="52" width="64" height="12" fill={C.night} />
      <path d="M0 52 H64" stroke={C.magenta} strokeWidth="2" />
    </g>
  </svg>
);

export const BrandBug: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <div style={{position: 'absolute', left: 70, top: 46, display: 'flex', alignItems: 'center', gap: 16, opacity}}>
    <Logo size={58} />
    <div style={{fontFamily: F.display, fontSize: 36, color: C.white, letterSpacing: 3}}>{CHANNEL.name}</div>
  </div>
);

export const Chrome: React.FC<{manifest: Manifest}> = ({manifest}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const chapter = [...manifest.chapters].reverse().find((c) => frame >= c.from);
  const chapterStart = chapter?.from ?? 0;
  const chIn = interpolate(frame, [chapterStart, chapterStart + 12], [0, 1], clamp);
  const progress = frame / durationInFrames;
  const showChapter = chapter && frame > 30 && chapter.title !== 'Intro';
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <BrandBug opacity={interpolate(frame, [0, 20], [0, 1], clamp)} />
      {showChapter ? (
        <div
          style={{
            position: 'absolute',
            right: 70,
            top: 52,
            padding: '10px 24px',
            borderRadius: 40,
            background: 'rgba(10,10,31,0.7)',
            border: `2px solid ${C.magenta}`,
            fontFamily: F.body,
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: 2,
            color: C.white,
            textTransform: 'uppercase',
            opacity: chIn,
            translate: `${interpolate(chIn, [0, 1], [30, 0])}px 0px`,
          }}
        >
          {chapter.title}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, bottom: 0, height: 8, width: '100%', background: 'rgba(255,255,255,0.08)'}}>
        <div style={{height: '100%', width: `${progress * 100}%`, background: GRADIENT}} />
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{captions: Caption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const cap = captions.find((c) => frame >= c.from && frame < c.to + 2);
  if (!cap) return null;
  const p = interpolate(frame, [cap.from, cap.from + 5], [0, 1], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 54, pointerEvents: 'none'}}>
      <div
        style={{
          maxWidth: 1500,
          padding: '12px 30px',
          borderRadius: 18,
          background: 'rgba(5,4,16,0.78)',
          fontFamily: F.body,
          fontWeight: 800,
          fontSize: 46,
          lineHeight: 1.2,
          color: C.white,
          textAlign: 'center',
          scale: String(interpolate(p, [0, 1], [0.94, 1])),
          opacity: p,
        }}
      >
        {cap.text}
      </div>
    </AbsoluteFill>
  );
};
