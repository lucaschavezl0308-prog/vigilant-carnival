import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, GRADIENT, gradientText} from '../brand';
import {EASE_OUT, clamp, enter, pop} from '../anim';
import {Big, Heading, Icon, IconChip, Panel, useReveal} from '../components/ui';
import type {SceneProps} from '../types';
import {Shell} from './Shell';

const isLatest = (reveals: number[], i: number, frame: number) =>
  frame >= reveals[i] && (i === reveals.length - 1 || frame < reveals[i + 1]);

// ------------------------------------------------------------------ Bullets
const BulletRow: React.FC<{item: {icon?: string; text: string; sub?: string}; at: number; active: boolean; size: number}> = ({
  item, at, active, size,
}) => {
  const {p, o} = useReveal(at);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 30,
        padding: '18px 30px',
        borderRadius: 26,
        background: active ? 'rgba(255,45,138,0.16)' : C.panel,
        border: `2px solid ${active ? C.magenta : C.panelBorder}`,
        opacity: o,
        translate: `${interpolate(p, [0, 1], [-60, 0])}px 0px`,
      }}
    >
      <IconChip name={item.icon ?? 'star'} size={size * 1.6} />
      <div>
        <div style={{fontFamily: F.body, fontWeight: 800, fontSize: size, color: C.white, lineHeight: 1.15}}>{item.text}</div>
        {item.sub ? <div style={{fontFamily: F.body, fontWeight: 600, fontSize: size * 0.66, color: C.muted, marginTop: 6}}>{item.sub}</div> : null}
      </div>
    </div>
  );
};

export const Bullets: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const d = scene.data;
  const items = d.items as {icon?: string; text: string; sub?: string}[];
  const size = items.length > 4 ? 42 : 48;
  return (
    <Shell duration={scene.duration}>
      <Heading text={d.heading} size={items.length > 4 ? 84 : 96} />
      <div style={{display: 'flex', flexDirection: 'column', gap: items.length > 4 ? 16 : 22}}>
        {items.map((it, i) => (
          <BulletRow key={i} item={it} at={scene.reveals[i] ?? 0} active={isLatest(scene.reveals, i, frame)} size={size} />
        ))}
      </div>
    </Shell>
  );
};

// ---------------------------------------------------------------- Checklist
const CheckRow: React.FC<{text: string; at: number; idx: number}> = ({text, at}) => {
  const frame = useCurrentFrame();
  const {p, o} = useReveal(at);
  const draw = interpolate(frame, [at + 4, at + 16], [1, 0], {...clamp, easing: EASE_OUT});
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 30, opacity: Math.max(0.28, o), translate: `${interpolate(p, [0, 1], [-30, 0])}px 0px`}}>
      <svg width={74} height={74} viewBox="0 0 74 74" style={{flexShrink: 0}}>
        <rect x={4} y={4} width={66} height={66} rx={16} fill={frame >= at ? C.cyan : 'transparent'} stroke={frame >= at ? C.cyan : C.muted} strokeWidth={4} />
        <path d="M20 38 L32 50 L55 24" fill="none" stroke={C.night} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
      </svg>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 50, color: C.white}}>{text}</div>
    </div>
  );
};

export const Checklist: React.FC<SceneProps> = ({scene}) => {
  const d = scene.data;
  const items = d.items as string[];
  return (
    <Shell duration={scene.duration}>
      <Heading text={d.heading} size={items.length > 5 ? 80 : 92} />
      <Panel style={{padding: '36px 46px', display: 'flex', flexDirection: 'column', gap: items.length > 5 ? 18 : 26}}>
        {items.map((t, i) => (
          <CheckRow key={i} text={t} at={scene.reveals[i] ?? 0} idx={i} />
        ))}
      </Panel>
    </Shell>
  );
};

// ------------------------------------------------------------------ Warning
export const Warning: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const items = d.items as string[];
  return (
    <Shell duration={scene.duration}>
      <div style={{display: 'flex', alignItems: 'center', gap: 30, marginBottom: 34}}>
        <div style={{scale: String(pop(frame, fps, 2))}}>
          <IconChip name={d.icon ?? 'alert'} size={110} color={`linear-gradient(135deg, ${C.yellow}, ${C.orange})`} />
        </div>
        <div style={{fontFamily: F.display, fontSize: 88, color: C.white, textTransform: 'uppercase', lineHeight: 1.02, opacity: enter(frame, 4)}}>
          {d.heading}
        </div>
      </div>
      <Panel accent={C.orange} style={{padding: '34px 44px', display: 'flex', flexDirection: 'column', gap: 24}}>
        {items.map((t, i) => {
          const at = scene.reveals[i] ?? 0;
          const o = interpolate(frame, [at, at + 8], [0, 1], clamp);
          const active = isLatest(scene.reveals, i, frame);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 26, opacity: o, translate: `${interpolate(o, [0, 1], [-30, 0])}px 0px`}}>
              <div
                style={{
                  width: 58, height: 58, borderRadius: 29, flexShrink: 0,
                  background: active ? C.orange : 'rgba(255,138,31,0.18)',
                  color: active ? C.night : C.orange,
                  fontFamily: F.display, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {i + 1}
              </div>
              <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 46, color: active ? C.white : '#D9D4F2'}}>{t}</div>
            </div>
          );
        })}
      </Panel>
    </Shell>
  );
};

// -------------------------------------------------------------------- Table
const looksLikeValue = (s: string) => /(\d{1,2}:\d{2}|€|\$|£|GB|TB|fps|%|^\d|≈|\bmin\b)/i.test(s);

export const Table: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const d = scene.data;
  const cols = d.columns as string[];
  const rows = d.rows as string[][];
  const template = cols.map((_, i) => (i === 0 ? '1.6fr' : '1fr')).join(' ');
  const big = rows.length <= 3;
  return (
    <Shell duration={scene.duration}>
      <Heading text={d.heading} />
      <Panel style={{padding: '22px 44px', overflow: 'hidden'}}>
        <div style={{display: 'grid', gridTemplateColumns: template, padding: '10px 0 16px', borderBottom: `2px solid ${C.panelBorder}`}}>
          {cols.map((c, i) => (
            <div key={i} style={{fontFamily: F.body, fontWeight: 800, fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, textAlign: i === 0 ? 'left' : 'center'}}>
              {c}
            </div>
          ))}
        </div>
        {rows.map((r, i) => {
          const at = scene.reveals[i] ?? 0;
          const o = interpolate(frame, [at, at + 10], [0, 1], {...clamp, easing: EASE_OUT});
          const active = isLatest(scene.reveals, i, frame);
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: template,
                alignItems: 'center',
                padding: big ? '26px 0' : '16px 0',
                borderBottom: i < rows.length - 1 ? `2px solid ${C.panelBorder}` : 'none',
                opacity: Math.max(o, 0),
                translate: `${interpolate(o, [0, 1], [60, 0])}px 0px`,
                boxShadow: active ? `inset 8px 0 0 ${C.magenta}` : 'none',
                paddingLeft: 24,
              }}
            >
              {r.map((cell, j) => (
                <div
                  key={j}
                  style={
                    j === 0
                      ? {fontFamily: F.body, fontWeight: 800, fontSize: big ? 52 : 44, color: C.white}
                      : looksLikeValue(cell)
                        ? {fontFamily: F.mono, fontWeight: 700, fontSize: big ? 66 : 54, textAlign: 'center', ...(active ? gradientText() : {color: C.yellow})}
                        : {fontFamily: F.body, fontWeight: 600, fontSize: big ? 44 : 38, color: C.muted, textAlign: 'center'}
                  }
                >
                  {cell}
                </div>
              ))}
            </div>
          );
        })}
      </Panel>
      {d.note ? (
        <div style={{marginTop: 22, fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.muted, opacity: enter(frame, 20)}}>{d.note}</div>
      ) : null}
    </Shell>
  );
};

// ------------------------------------------------------------------ Compare
type Side = {title: string; price?: string; tag?: string; items: string[]; icon?: string};

const CompareCard: React.FC<{side: Side; at: number; accent: string}> = ({side, at, accent}) => {
  const {p, o} = useReveal(at);
  return (
    <Panel accent={accent} style={{flex: 1, padding: '34px 40px', opacity: o, translate: `0px ${interpolate(p, [0, 1], [60, 0])}px`, position: 'relative'}}>
      {side.tag ? (
        <div style={{position: 'absolute', top: -24, right: 30, background: accent, color: C.night, fontFamily: F.body, fontWeight: 900, fontSize: 24, letterSpacing: 2, padding: '8px 18px', borderRadius: 30, textTransform: 'uppercase'}}>
          {side.tag}
        </div>
      ) : null}
      <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
        {side.icon ? <Icon name={side.icon} size={54} color={accent} /> : null}
        <div style={{fontFamily: F.display, fontSize: 70, color: C.white, textTransform: 'uppercase', lineHeight: 1}}>{side.title}</div>
      </div>
      {side.price ? <Big size={92} style={{marginTop: 12}}>{side.price}</Big> : null}
      <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22}}>
        {side.items.map((t, i) => (
          <div key={i} style={{display: 'flex', gap: 14, alignItems: 'flex-start'}}>
            <div style={{marginTop: 4}}><Icon name="check" size={34} color={accent} stroke={3.2} /></div>
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 34, color: C.white, lineHeight: 1.25}}>{t}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export const Compare: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const d = scene.data;
  const r = scene.reveals;
  const vAt = r[2] ?? 99999;
  const vo = interpolate(frame, [vAt, vAt + 10], [0, 1], clamp);
  return (
    <Shell duration={scene.duration}>
      <Heading text={d.heading} size={84} />
      <div style={{display: 'flex', gap: 50, alignItems: 'stretch'}}>
        <CompareCard side={d.left} at={r[0] ?? 0} accent={C.cyan} />
        <CompareCard side={d.right} at={r[1] ?? 0} accent={C.magenta} />
      </div>
      {d.verdict ? (
        <div
          style={{
            marginTop: 30, alignSelf: 'center', padding: '16px 36px', borderRadius: 20, background: GRADIENT,
            fontFamily: F.body, fontWeight: 900, fontSize: 38, color: C.night, opacity: vo,
            scale: String(interpolate(vo, [0, 1], [0.9, 1])),
          }}
        >
          {d.verdict}
        </div>
      ) : null}
    </Shell>
  );
};

// ----------------------------------------------------------------- Timeline
export const Timeline: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const pts = d.points as {date: string; label: string; sub?: string}[];
  const r = scene.reveals;
  const n = pts.length;
  const xs = pts.map((_, i) => (n === 1 ? 0.5 : 0.06 + (0.88 * i) / (n - 1)));
  // La línea crece hasta el último punto revelado
  let reach = 0;
  pts.forEach((_, i) => {
    const at = r[i] ?? 0;
    const prevX = i === 0 ? 0 : xs[i - 1];
    reach = Math.max(reach, interpolate(frame, [at - 10, at], [prevX, xs[i]], clamp) * (frame >= at - 10 ? 1 : 0));
  });
  return (
    <Shell duration={scene.duration}>
      <Heading text={d.heading} />
      <div style={{position: 'relative', height: 420, marginTop: 30}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 182, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.12)'}} />
        <div style={{position: 'absolute', left: 0, width: `${reach * 100}%`, top: 182, height: 10, borderRadius: 5, background: GRADIENT}} />
        {pts.map((p, i) => {
          const at = r[i] ?? 0;
          const s = pop(frame, fps, at, 12);
          const o = enter(frame, at, 12);
          const active = isLatest(r, i, frame);
          return (
            <div key={i} style={{position: 'absolute', left: `${xs[i] * 100}%`, top: 0, width: 400, marginLeft: -200, textAlign: 'center', opacity: o}}>
              <div style={{height: 140, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
                <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 66, lineHeight: 1.05, ...(active ? gradientText() : {color: C.yellow})}}>{p.date}</div>
              </div>
              <div style={{margin: '14px auto', width: 64, height: 64, borderRadius: 32, background: active ? C.magenta : C.white, border: `8px solid ${C.night}`, scale: String(s), boxShadow: active ? `0 0 30px ${C.magenta}` : 'none'}} />
              <div style={{fontFamily: F.display, fontSize: 64, color: C.white, lineHeight: 1.05, textTransform: 'uppercase', marginTop: 6}}>{p.label}</div>
              {p.sub ? <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 34, color: C.muted, marginTop: 8}}>{p.sub}</div> : null}
            </div>
          );
        })}
      </div>
      {d.note ? <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.muted, opacity: enter(frame, 30)}}>{d.note}</div> : null}
    </Shell>
  );
};

// ------------------------------------------------------------------ Storage
export const Storage: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const d = scene.data;
  const game = Number(d.game);
  const consoles = d.consoles as {name: string; usable: number; label?: string}[];
  const max = Math.max(...consoles.map((c) => c.usable));
  const BAR = 880;
  return (
    <Shell duration={scene.duration}>
      <Heading text={d.heading} size={88} />
      <div style={{display: 'flex', gap: 30, alignItems: 'center', marginBottom: 26, opacity: enter(frame, 6)}}>
        <Legend color={C.magenta} text={`GTA 6 · hasta ${game} GB`} />
        <Legend color={C.cyan} text="Espacio libre que te queda" />
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
        {consoles.map((c, i) => {
          const at = scene.reveals[i] ?? 0;
          const o = enter(frame, at, 10);
          const fill = interpolate(frame, [at + 4, at + 26], [0, 1], {...clamp, easing: EASE_OUT});
          const w = (c.usable / max) * BAR;
          const gw = Math.min(game / c.usable, 1) * w * fill;
          const free = c.usable - game;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 34, opacity: o}}>
              <div style={{width: 400, flexShrink: 0}}>
                <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 40, color: C.white}}>{c.name}</div>
                <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 28, color: C.muted}}>{c.label ?? `${c.usable} GB útiles`}</div>
              </div>
              <div style={{width: BAR, height: 64, position: 'relative'}}>
                <div style={{position: 'absolute', left: 0, top: 0, height: 64, width: w, borderRadius: 14, background: 'rgba(34,228,212,0.25)', border: `2px solid ${C.cyan}`}} />
                <div style={{position: 'absolute', left: 0, top: 0, height: 64, width: gw, borderRadius: 14, background: GRADIENT}} />
              </div>
              <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 38, color: free < 60 ? C.danger : C.cyan, opacity: fill, width: 240, textAlign: 'right'}}>
                {free > 0 ? `+${free} GB` : 'No cabe'}
              </div>
            </div>
          );
        })}
      </div>
      {d.note ? <div style={{marginTop: 26, fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.muted, opacity: enter(frame, 30)}}>{d.note}</div> : null}
    </Shell>
  );
};

const Legend: React.FC<{color: string; text: string}> = ({color, text}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <div style={{width: 30, height: 30, borderRadius: 8, background: color}} />
    <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 30, color: C.white}}>{text}</div>
  </div>
);
