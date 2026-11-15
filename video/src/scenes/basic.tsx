import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, CHANNEL, F, GRADIENT} from '../brand';
import {clamp, enter, pop} from '../anim';
import {Big, Heading, Icon, IconChip, Panel, useReveal} from '../components/ui';
import type {SceneProps} from '../types';
import {Shell} from './Shell';

export const Intro: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const words: string[] = d.title.split(' ');
  const k = pop(frame, fps, 2, 12);
  return (
    <Shell duration={scene.duration} align="center" padding="120px 120px 230px">
      <div
        style={{
          fontFamily: F.body,
          fontWeight: 900,
          fontSize: 34,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: C.night,
          background: GRADIENT,
          padding: '12px 30px',
          borderRadius: 50,
          scale: String(k),
          marginBottom: 34,
        }}
      >
        {d.kicker}
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1650, columnGap: 34}}>
        {words.map((w, i) => {
          const p = enter(frame, 8 + i * 4, 18);
          return (
            <span
              key={i}
              style={{
                fontFamily: F.display,
                fontSize: 168,
                lineHeight: 1.04,
                textTransform: 'uppercase',
                color: C.white,
                opacity: p,
                translate: `0px ${interpolate(p, [0, 1], [70, 0])}px`,
                textShadow: `0 8px 0 ${C.magenta}, 0 18px 50px rgba(0,0,0,0.6)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      {d.subtitle ? (
        <div
          style={{
            marginTop: 40,
            fontFamily: F.body,
            fontWeight: 800,
            fontSize: 48,
            color: C.white,
            background: 'rgba(10,10,31,0.72)',
            padding: '14px 34px',
            borderRadius: 16,
            opacity: enter(frame, 26 + words.length * 4, 16),
          }}
        >
          {d.subtitle}
        </div>
      ) : null}
    </Shell>
  );
};

export const Stat: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const v = pop(frame, fps, 6, 13);
  const numeric = /^\d+$/.test(String(d.value));
  const shown = numeric && d.countUp
    ? Math.round(interpolate(frame, [6, 40], [0, Number(d.value)], clamp)).toString()
    : String(d.value);
  return (
    <Shell duration={scene.duration} align="center">
      {d.icon ? <div style={{scale: String(pop(frame, fps, 0)), marginBottom: 20}}><IconChip name={d.icon} size={110} /></div> : null}
      <div style={{display: 'flex', alignItems: 'baseline', gap: 24, scale: String(interpolate(v, [0, 1], [0.6, 1]))}}>
        <Big size={d.value.length > 6 ? 230 : 300} style={{filter: `drop-shadow(0 10px 40px ${C.magenta}66)`}}>{shown}</Big>
        {d.unit ? <div style={{fontFamily: F.display, fontSize: 120, color: C.white}}>{d.unit}</div> : null}
      </div>
      <div
        style={{
          fontFamily: F.display,
          fontSize: 76,
          color: C.white,
          textTransform: 'uppercase',
          marginTop: 10,
          opacity: enter(frame, 16),
          textAlign: 'center',
        }}
      >
        {d.label}
      </div>
      {d.sub ? (
        <div
          style={{
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 42,
            color: C.muted,
            marginTop: 18,
            opacity: enter(frame, 26),
            textAlign: 'center',
            maxWidth: 1400,
          }}
        >
          {d.sub}
        </div>
      ) : null}
    </Shell>
  );
};

export const Quote: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const words: string[] = d.text.split(' ');
  return (
    <Shell duration={scene.duration} align="center">
      <div style={{scale: String(pop(frame, fps, 0, 14)), marginBottom: 30}}>
        <IconChip name="quote" size={120} />
      </div>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 22, maxWidth: 1500}}>
        {words.map((w, i) => (
          <span
            key={i}
            style={{
              fontFamily: F.display,
              fontSize: d.text.length < 45 ? 124 : 96,
              lineHeight: 1.1,
              color: C.white,
              textTransform: 'uppercase',
              opacity: enter(frame, 6 + i * 3, 12),
            }}
          >
            {w}
          </span>
        ))}
      </div>
      {d.source ? (
        <div style={{marginTop: 34, fontFamily: F.body, fontWeight: 600, fontSize: 38, color: C.muted, opacity: enter(frame, 20 + words.length * 3)}}>
          — {d.source}
        </div>
      ) : null}
    </Shell>
  );
};

const OutroPoint: React.FC<{text: string; at: number}> = ({text, at}) => {
  const {p, o} = useReveal(at);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: o, translate: `${interpolate(p, [0, 1], [-40, 0])}px 0px`}}>
      <div style={{width: 56, height: 56, borderRadius: 28, background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
        <Icon name="check" size={34} color={C.night} stroke={3.4} />
      </div>
      <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 44, color: C.white}}>{text}</div>
    </div>
  );
};

export const Outro: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = scene.data;
  const b = scene.beats;
  const press = b[Math.min(2, b.length - 1)] + 10;
  const pressed = frame >= press + 4;
  const s = interpolate(frame, [press, press + 4, press + 10], [1, 0.9, 1], clamp);
  const points: string[] = d.points ?? [];
  return (
    <Shell duration={scene.duration}>
      <div style={{display: 'flex', gap: 70, alignItems: 'center'}}>
        <div style={{flex: 1.25, minWidth: 0}}>
          <Heading text={d.title} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
            {points.map((t, i) => (
              <OutroPoint key={i} text={t} at={8 + i * 10} />
            ))}
          </div>
        </div>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 34, alignItems: 'stretch'}}>
          {d.next ? (
            <Panel
              style={{height: 380, padding: '30px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: enter(frame, b[1] ?? 20), scale: String(pop(frame, fps, b[1] ?? 20, 15))}}
              accent={C.magenta}
            >
              <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: C.magenta, textTransform: 'uppercase'}}>
                Siguiente vídeo
              </div>
              <div style={{fontFamily: F.display, fontSize: 62, lineHeight: 1.05, color: C.white, marginTop: 10, textTransform: 'uppercase'}}>
                {d.next}
              </div>
            </Panel>
          ) : null}
          <div
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '22px 40px',
              borderRadius: 60,
              background: pressed ? 'rgba(255,255,255,0.14)' : GRADIENT,
              border: pressed ? `3px solid ${C.white}` : '3px solid transparent',
              scale: String(s * pop(frame, fps, (b[2] ?? 30) - 4, 14)),
            }}
          >
            <Icon name={pressed ? 'check' : 'bell'} size={46} color={pressed ? C.white : C.night} stroke={3} />
            <div style={{fontFamily: F.display, fontSize: 52, color: pressed ? C.white : C.night, letterSpacing: 2}}>
              {pressed ? 'SUSCRITO' : (d.cta ?? 'SUSCRÍBETE').toUpperCase().split(' ')[0]}
            </div>
          </div>
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 24, color: C.muted, opacity: enter(frame, 30)}}>
            {CHANNEL.disclaimer}
          </div>
        </div>
      </div>
    </Shell>
  );
};
