import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../brand';
import {rand} from '../anim';

const W = 1920;
const H = 1080;
const HORIZON = 650;

type Pt = [number, number];

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

/** Polígono "grueso" a lo largo de una curva cuadrática con anchura variable. */
const ribbon = (a: Pt, c: Pt, b: Pt, width: (t: number) => number, steps = 18) => {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = quad(a, c, b, t);
    const q = quad(a, c, b, Math.min(1, t + 0.01));
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = width(t) / 2;
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  }
  return [...left, ...right.reverse()].map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
};

const makePalm = (baseX: number, topX: number, topY: number, scale: number, flip: number) => {
  const base: Pt = [baseX, H + 20];
  const top: Pt = [topX, topY];
  const ctrl: Pt = [(baseX + topX) / 2 + 60 * flip, (H + topY) / 2 + 40];
  const trunk = ribbon(base, ctrl, top, (t) => (48 - 26 * t) * scale, 24);
  const fronds: string[] = [];
  const angles = [-160, -128, -96, -64, -30, 6, 36];
  angles.forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const len = (250 + 60 * rand(i + baseX)) * scale;
    const end: Pt = [top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len * 0.55 + len * 0.42];
    const c: Pt = [top[0] + Math.cos(a) * len * 0.55, top[1] + Math.sin(a) * len * 0.6 - 40 * scale];
    fronds.push(ribbon(top, c, end, (t) => Math.sin(Math.PI * Math.min(1, t * 1.15)) * 46 * scale + 2, 16));
  });
  return {trunk, fronds, top};
};

const PALMS = [
  makePalm(150, 230, 470, 1.15, 1),
  makePalm(1790, 1700, 430, 1.25, -1),
  makePalm(1590, 1560, 600, 0.75, -1),
];

const BUILDINGS = (() => {
  const out: {x: number; w: number; h: number; windows: {x: number; y: number; on: number}[]}[] = [];
  let x = -40;
  let i = 0;
  while (x < W + 80) {
    const w = 38 + rand(i * 3.1) * 70;
    const central = Math.exp(-(((x - W / 2) / 520) ** 2));
    const h = 30 + rand(i * 7.7) * 90 + central * (60 + rand(i * 1.3) * 190);
    const windows: {x: number; y: number; on: number}[] = [];
    for (let wy = HORIZON - h + 10; wy < HORIZON - 8; wy += 16) {
      for (let wx = x + 7; wx < x + w - 8; wx += 13) {
        if (rand(wx * 0.37 + wy * 1.91) > 0.82) windows.push({x: wx, y: wy, on: rand(wx + wy)});
      }
    }
    out.push({x, w, h, windows});
    x += w + 4 + rand(i * 5.3) * 10;
    i++;
  }
  return out;
})();

const STARS = Array.from({length: 110}, (_, i) => ({
  x: rand(i * 2.3) * W,
  y: rand(i * 4.7) * (HORIZON - 160),
  r: 0.8 + rand(i * 9.1) * 1.8,
  phase: rand(i * 1.7) * Math.PI * 2,
  speed: 0.03 + rand(i * 3.3) * 0.06,
}));

const MOUNTAINS = (() => {
  const pts: Pt[] = [[0, HORIZON]];
  for (let x = 0; x <= W; x += 60) {
    const y = HORIZON - 40 - Math.abs(Math.sin(x / 210)) * 70 - rand(x) * 40;
    pts.push([x, y]);
  }
  pts.push([W, HORIZON]);
  return pts.map((p) => p.join(',')).join(' ');
})();

export const Background: React.FC<{dim?: number; sunY?: number}> = ({dim = 0, sunY = 0}) => {
  const frame = useCurrentFrame();
  const sunCy = HORIZON - 40 + Math.sin(frame / 90) * 6 + sunY;
  const gridPhase = (frame * 0.012) % 1;
  const sway = Math.sin(frame / 45) * 1.6;
  const drift = (frame * 0.12) % 40;

  const hLines = Array.from({length: 14}, (_, k) => {
    const p = (k + gridPhase) / 14;
    return HORIZON + (H - HORIZON) * Math.pow(p, 2.3);
  });
  const vLines = Array.from({length: 25}, (_, i) => (i - 12) * 260);

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#07061A" />
            <stop offset="0.45" stopColor={C.deep} />
            <stop offset="0.75" stopColor="#4A1670" />
            <stop offset="1" stopColor="#B0236E" />
          </linearGradient>
          <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.yellow} />
            <stop offset="0.5" stopColor={C.orange} />
            <stop offset="1" stopColor={C.magenta} />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={C.magenta} stopOpacity="0.55" />
            <stop offset="1" stopColor={C.magenta} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1B0B3A" />
            <stop offset="1" stopColor="#05040F" />
          </linearGradient>
          <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.65" />
          </radialGradient>
          <mask id="sunStripes">
            <rect x="0" y="0" width={W} height={H} fill="white" />
            {Array.from({length: 9}, (_, i) => {
              const y = sunCy + 20 + i * 30 + ((frame * 0.4) % 30);
              return <rect key={i} x="0" y={y} width={W} height={2 + i * 1.6} fill="black" />;
            })}
          </mask>
        </defs>

        <rect width={W} height={HORIZON} fill="url(#sky)" />
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#fff"
            opacity={0.25 + 0.65 * Math.abs(Math.sin(frame * s.speed + s.phase))}
          />
        ))}
        <circle cx={W / 2} cy={sunCy} r={560} fill="url(#glow)" />
        <circle cx={W / 2} cy={sunCy} r={290} fill="url(#sun)" mask="url(#sunStripes)" />
        <polygon points={MOUNTAINS} fill="#2A0F52" opacity={0.9} />
        <g transform={`translate(${-drift}, 0)`}>
          {BUILDINGS.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={HORIZON - b.h} width={b.w} height={b.h} fill="#0E0826" />
              {b.windows.map((w, j) => (
                <rect
                  key={j}
                  x={w.x}
                  y={w.y}
                  width={6}
                  height={8}
                  fill={w.on > 0.5 ? C.yellow : C.cyan}
                  opacity={0.35 + 0.4 * Math.abs(Math.sin(frame * 0.02 + w.on * 9))}
                />
              ))}
            </g>
          ))}
        </g>
        <rect y={HORIZON} width={W} height={H - HORIZON} fill="url(#floor)" />
        <rect y={HORIZON - 2} width={W} height={4} fill={C.magenta} opacity={0.9} />
        <g stroke={C.magenta} strokeWidth={2}>
          {hLines.map((y, i) => (
            <line key={i} x1={0} x2={W} y1={y} y2={y} opacity={0.15 + 0.6 * ((y - HORIZON) / (H - HORIZON))} />
          ))}
          {vLines.map((dx, i) => (
            <line key={`v${i}`} x1={W / 2 + dx * 0.04} y1={HORIZON} x2={W / 2 + dx * 2.2} y2={H} opacity={0.45} />
          ))}
        </g>
        {PALMS.map((p, i) => (
          <g key={i} transform={`rotate(${sway * (i === 1 ? -1 : 1)}, ${p.top[0]}, ${H})`} fill="#06030F">
            <polygon points={p.trunk} />
            {p.fronds.map((f, j) => (
              <polygon key={j} points={f} />
            ))}
          </g>
        ))}
        <rect width={W} height={H} fill="url(#vignette)" />
        <rect width={W} height={H} fill={C.night} opacity={dim} />
      </svg>
    </AbsoluteFill>
  );
};
