import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, GRADIENT, gradientText} from '../brand';
import {enter, pop} from '../anim';
import {Heading, Panel} from '../components/ui';
import type {SceneProps} from '../types';
import {Shell} from './Shell';

// ---------------------------------------------------------------------- Mapa
// Silueta estilizada y ficticia de "Leonida" (no es un calco de ningún mapa oficial).
export const LEONIDA_PATH =
  'M30 96 L560 88 C592 88 612 98 628 120 C664 200 694 320 738 450 C762 520 776 590 762 642 C746 694 690 714 638 696 C576 672 512 610 470 528 C432 452 404 372 384 306 C368 262 346 228 300 212 C238 192 150 188 30 186 Z';

export const REGION_NAMES: Record<string, string> = {
  'kalaga': 'Mount Kalaga',
  'port-gellhorn': 'Port Gellhorn',
  'ambrosia': 'Ambrosia',
  'grassrivers': 'Grassrivers',
  'vice-city': 'Vice City',
  'keys': 'Leonida Keys',
};

export const REGION_POS: Record<string, [number, number]> = {
  'kalaga': [360, 135],
  'port-gellhorn': [140, 160],
  'ambrosia': [548, 392],
  'grassrivers': [628, 590],
  'vice-city': [752, 548],
  'keys': [598, 742],
};

// Desplazamiento y alineación de cada etiqueta para que no se pisen
const LABEL: Record<string, [number, number, 'start' | 'middle' | 'end']> = {
  'kalaga': [24, 10, 'start'],
  'port-gellhorn': [0, -24, 'middle'],
  'ambrosia': [-26, 10, 'end'],
  'grassrivers': [-26, 10, 'end'],
  'vice-city': [-6, -26, 'end'],
  'keys': [0, 46, 'middle'],
};

const KEYS = Array.from({length: 9}, (_, i) => {
  const t = i / 8;
  return [690 - t * 200, 716 + t * 52 - t * t * 14, 9 - t * 3] as const;
});

export const LeonidaMap: React.FC<{active?: string; shown?: string[]; size?: number; labels?: Record<string, string>; pulse?: number}> = ({
  active, shown = [], size = 820, labels = {}, pulse = 0,
}) => (
  <svg width={size} height={size * (800 / 820)} viewBox="0 0 820 800">
    <defs>
      <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2B1460" />
        <stop offset="1" stopColor="#14093A" />
      </linearGradient>
      <pattern id="mgrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0 H0 V40" fill="none" stroke="rgba(34,228,212,0.12)" strokeWidth="1.5" />
      </pattern>
    </defs>
    <path d={LEONIDA_PATH} fill="url(#land)" />
    <path d={LEONIDA_PATH} fill="url(#mgrid)" />
    <path d={LEONIDA_PATH} fill="none" stroke={C.cyan} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={600} cy={470} rx={46} ry={36} fill="rgba(34,228,212,0.25)" stroke={C.cyan} strokeWidth={2} />
    {KEYS.map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#2B1460" stroke={C.cyan} strokeWidth={2.5} />
    ))}
    {Object.entries(REGION_POS).map(([id, [x, y]]) => {
      const visible = shown.includes(id);
      const isActive = id === active;
      if (!visible) return null;
      return (
        <g key={id}>
          {isActive ? <circle cx={x} cy={y} r={26 + pulse * 30} fill="none" stroke={C.magenta} strokeWidth={4} opacity={1 - pulse} /> : null}
          <circle cx={x} cy={y} r={isActive ? 18 : 12} fill={isActive ? C.magenta : C.yellow} stroke={C.night} strokeWidth={4} />
          {labels[id] ? (
            <text
              x={x + LABEL[id][0]}
              y={y + LABEL[id][1]}
              textAnchor={LABEL[id][2]}
              fontFamily={F.body}
              fontWeight={800}
              fontSize={isActive ? 36 : 28}
              fill={isActive ? C.white : C.muted}
              stroke={C.night}
              strokeWidth={7}
              paintOrder="stroke"
            >
              {labels[id]}
            </text>
          ) : null}
        </g>
      );
    })}
  </svg>
);

export const MapScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const regions = (d.regions ?? []) as {id: string; name: string; desc: string; real?: string}[];
  const r = scene.reveals;
  let current = -1;
  regions.forEach((_, i) => {
    if (frame >= (r[i] ?? 0)) current = i;
  });
  const cur = regions[current];
  const curAt = r[current] ?? 0;
  const pulse = ((frame - curAt) % 30) / 30;
  const context = (d.context ?? []) as string[];
  const labels: Record<string, string> = {};
  context.forEach((id) => (labels[id] = REGION_NAMES[id] ?? id));
  regions.forEach((g) => (labels[g.id] = g.name));
  const shown = [...context, ...regions.filter((_, i) => frame >= (r[i] ?? 0)).map((g) => g.id)];
  const cardIn = pop(frame, fps, curAt, 15);
  return (
    <Shell duration={scene.duration} padding="130px 110px 190px">
      <div style={{display: 'flex', alignItems: 'center', gap: 40}}>
        <div style={{flexShrink: 0, opacity: enter(frame, 0, 14)}}>
          <LeonidaMap active={cur?.id} shown={shown} labels={labels} pulse={pulse} size={760} />
        </div>
        <div style={{flex: 1}}>
          <Heading text={d.heading} size={80} />
          {cur ? (
            <Panel accent={C.magenta} style={{padding: '30px 38px', scale: String(interpolate(cardIn, [0, 1], [0.92, 1])), opacity: Math.min(1, cardIn * 1.4)}}>
              <div style={{fontFamily: F.display, fontSize: 76, color: C.white, textTransform: 'uppercase', lineHeight: 1}}>{cur.name}</div>
              {cur.real ? (
                <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', marginTop: 10, ...gradientText()}}>
                  Inspirado en: {cur.real}
                </div>
              ) : null}
              <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 36, color: '#E4DFFA', marginTop: 16, lineHeight: 1.3}}>{cur.desc}</div>
            </Panel>
          ) : null}
          {d.note ? <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 24, color: C.muted, marginTop: 20}}>{d.note}</div> : null}
        </div>
      </div>
    </Shell>
  );
};

// ----------------------------------------------------------------- Personaje
export const Silhouette: React.FC<{size: number; color: string; initials: string; variant?: 'a' | 'b'}> = ({size, color, initials, variant = 'a'}) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <defs>
      <linearGradient id={`sil-${initials}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={color} />
        <stop offset="1" stopColor={C.violet} />
      </linearGradient>
      <clipPath id={`clip-${initials}`}>
        <circle cx="100" cy="100" r="96" />
      </clipPath>
    </defs>
    <circle cx="100" cy="100" r="96" fill={`url(#sil-${initials})`} />
    <g clipPath={`url(#clip-${initials})`} fill="#0B0620">
      {variant === 'b' ? (
        <path d="M100 38 C126 38 140 58 140 84 C140 102 136 110 146 126 C130 128 120 120 116 116 L116 128 C150 134 176 150 182 200 L18 200 C24 150 50 134 84 128 L84 116 C80 120 70 128 54 126 C64 110 60 102 60 84 C60 58 74 38 100 38 Z" />
      ) : (
        <path d="M100 42 C124 42 138 60 138 84 C138 108 124 124 112 128 L112 134 C146 140 174 156 180 200 L20 200 C26 156 54 140 88 134 L88 128 C76 124 62 108 62 84 C62 60 76 42 100 42 Z" />
      )}
    </g>
    <text x="100" y="186" textAnchor="middle" fontFamily={F.display} fontSize="34" fill={C.white} opacity={0.9}>
      {initials}
    </text>
  </svg>
);

export const Character: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const traits = (d.traits ?? []) as string[];
  const s = pop(frame, fps, 0, 14);
  return (
    <Shell duration={scene.duration}>
      <div style={{display: 'flex', alignItems: 'center', gap: 80}}>
        <div style={{scale: String(interpolate(s, [0, 1], [0.7, 1])), filter: `drop-shadow(0 0 50px ${d.color ?? C.magenta}66)`}}>
          <Silhouette size={480} color={d.color ?? C.magenta} initials={d.initials} variant={d.variant ?? 'a'} />
        </div>
        <div style={{flex: 1}}>
          <div style={{fontFamily: F.body, fontWeight: 900, fontSize: 30, letterSpacing: 4, textTransform: 'uppercase', ...gradientText(), opacity: enter(frame, 4)}}>
            {d.role}
          </div>
          <div style={{fontFamily: F.display, fontSize: d.name.length > 14 ? 110 : 136, lineHeight: 1, color: C.white, textTransform: 'uppercase', marginTop: 8, opacity: enter(frame, 8), translate: `${interpolate(enter(frame, 8), [0, 1], [50, 0])}px 0px`}}>
            {d.name}
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 34}}>
            {traits.map((t, i) => {
              const at = scene.reveals[i] ?? 0;
              const p = pop(frame, fps, at, 15);
              return (
                <div
                  key={i}
                  style={{
                    padding: '14px 26px', borderRadius: 40, border: `3px solid ${d.color ?? C.magenta}`,
                    background: 'rgba(10,10,31,0.75)', fontFamily: F.body, fontWeight: 800, fontSize: 36,
                    color: C.white, scale: String(p), opacity: frame >= at ? 1 : 0,
                  }}
                >
                  {t}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Shell>
  );
};

export const Cast: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const people = d.people as {name: string; role: string; initials: string; color?: string}[];
  const cols = people.length > 6 ? 4 : 3;
  return (
    <Shell duration={scene.duration}>
      <Heading text={d.heading} size={84} />
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24}}>
        {people.map((p, i) => {
          const at = scene.reveals[i] ?? 0;
          const s = pop(frame, fps, at, 15);
          return (
            <Panel key={i} style={{padding: '26px 24px', display: 'flex', alignItems: 'center', gap: 18, scale: String(s), opacity: frame >= at ? 1 : 0}}>
              <div style={{width: 104, height: 104, borderRadius: 52, flexShrink: 0, background: p.color ? `linear-gradient(135deg, ${p.color}, ${C.violet})` : GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontSize: 40, color: C.white}}>
                {p.initials}
              </div>
              <div>
                <div style={{fontFamily: F.display, fontSize: 46, color: C.white, textTransform: 'uppercase', lineHeight: 1.05}}>{p.name}</div>
                <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 29, color: '#D9D4F2', marginTop: 6, lineHeight: 1.2}}>{p.role}</div>
              </div>
            </Panel>
          );
        })}
      </div>
    </Shell>
  );
};
