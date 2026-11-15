import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, GRADIENT, GRADIENT_V, gradientText} from './brand';
import {Background} from './components/Background';
import {Logo} from './components/Chrome';
import {Icon} from './components/ui';
import {LeonidaMap, Silhouette} from './scenes/special';
import type {ThumbnailData} from './types';

const outline = (w: number, color = '#05030F') => ({
  WebkitTextStroke: `${w}px ${color}`,
  paintOrder: 'stroke fill' as const,
});

const Visual: React.FC<{t: ThumbnailData}> = ({t}) => {
  const accent = t.accent ?? '';
  switch (t.visual) {
    case 'clock':
      return (
        <div style={{position: 'relative', width: 660, height: 660}}>
          <svg width={660} height={660} viewBox="0 0 200 200">
            <defs>
              <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={C.yellow} />
                <stop offset="1" stopColor={C.magenta} />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="92" fill="#0E0826" stroke="url(#ring)" strokeWidth="10" />
            {Array.from({length: 12}, (_, i) => (
              <rect key={i} x="98" y="16" width="4" height={i % 3 === 0 ? 16 : 9} fill={C.white} transform={`rotate(${i * 30} 100 100)`} />
            ))}
            <rect x="96" y="44" width="8" height="60" rx="4" fill={C.white} />
            <rect x="97.5" y="30" width="5" height="74" rx="2.5" fill={C.magenta} />
            <circle cx="100" cy="100" r="8" fill={C.yellow} />
          </svg>
          <div style={{position: 'absolute', bottom: -40, left: 0, right: 0, textAlign: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 150, color: C.yellow, ...outline(10)}}>
            {accent}
          </div>
        </div>
      );
    case 'storage':
      return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
          <Icon name="hard-drive" size={300} color={C.cyan} stroke={1.6} />
          <div style={{fontFamily: F.display, fontSize: 210, lineHeight: 1, ...gradientText(GRADIENT_V), filter: 'drop-shadow(0 10px 0 #05030F)'}}>{accent}</div>
          <div style={{width: 600, height: 70, borderRadius: 18, border: `5px solid ${C.white}`, padding: 6, background: '#05030F'}}>
            <div style={{width: '92%', height: '100%', borderRadius: 10, background: GRADIENT}} />
          </div>
        </div>
      );
    case 'compare': {
      const [a, b] = accent.split('|');
      return (
        <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
          {[a, b].map((p, i) => (
            <div key={i} style={{width: 330, padding: '40px 20px', borderRadius: 30, background: '#0E0826', border: `6px solid ${i ? C.magenta : C.cyan}`, textAlign: 'center', rotate: i ? '4deg' : '-4deg'}}>
              <div style={{fontFamily: F.display, fontSize: 64, color: C.white}}>{i ? 'ULTIMATE' : 'ESTÁNDAR'}</div>
              <div style={{fontFamily: F.display, fontSize: 96, color: i ? C.magenta : C.cyan, marginTop: 10}}>{p}</div>
            </div>
          ))}
        </div>
      );
    }
    case 'disc':
      return (
        <svg width={640} height={640} viewBox="0 0 200 200">
          <defs>
            <radialGradient id="disc" cx="0.4" cy="0.35" r="0.8">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.35" stopColor="#B9F3FF" />
              <stop offset="0.6" stopColor="#E7A8FF" />
              <stop offset="1" stopColor="#6E5BFF" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="86" fill="url(#disc)" stroke="#05030F" strokeWidth="5" />
          <circle cx="100" cy="100" r="22" fill="#0E0826" stroke="#05030F" strokeWidth="4" />
          <circle cx="100" cy="100" r="96" fill="none" stroke={C.danger} strokeWidth="14" />
          <line x1="32" y1="32" x2="168" y2="168" stroke={C.danger} strokeWidth="14" strokeLinecap="round" />
        </svg>
      );
    case 'fps':
      return (
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: F.display, fontSize: 430, lineHeight: 0.9, ...gradientText(GRADIENT_V), filter: 'drop-shadow(0 14px 0 #05030F)'}}>{accent || '30'}</div>
          <div style={{fontFamily: F.display, fontSize: 150, color: C.white, ...outline(8)}}>FPS</div>
        </div>
      );
    case 'pc':
      return (
        <div style={{position: 'relative'}}>
          <Icon name="monitor" size={600} color={C.cyan} stroke={1.5} />
          <div style={{position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', fontFamily: F.display, fontSize: 330, color: C.yellow, ...outline(10)}}>?</div>
        </div>
      );
    case 'online':
      return (
        <div style={{position: 'relative'}}>
          <Icon name="globe" size={580} color={C.cyan} stroke={1.4} />
          <div style={{position: 'absolute', right: -20, bottom: 0, width: 230, height: 230, borderRadius: 115, background: C.danger, border: '10px solid #05030F', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="x" size={170} color={C.white} stroke={4} />
          </div>
        </div>
      );
    case 'map':
      return <LeonidaMap size={760} shown={['vice-city', 'keys', 'grassrivers', 'port-gellhorn', 'ambrosia', 'kalaga']} active="vice-city" />;
    case 'cast':
      return (
        <div style={{display: 'flex', alignItems: 'flex-end'}}>
          <Silhouette size={430} color={C.magenta} initials="L" variant="b" />
          <div style={{marginLeft: -90}}>
            <Silhouette size={470} color={C.cyan} initials="J" />
          </div>
        </div>
      );
    case 'checklist':
      return (
        <div style={{padding: '40px 50px', borderRadius: 36, background: '#0E0826', border: `6px solid ${C.cyan}`, rotate: '3deg'}}>
          {['Espacio', 'HDR', 'Sin spoilers'].map((x) => (
            <div key={x} style={{display: 'flex', alignItems: 'center', gap: 26, margin: '22px 0'}}>
              <div style={{width: 96, height: 96, borderRadius: 22, background: C.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon name="check" size={76} color={C.night} stroke={4} />
              </div>
              <div style={{fontFamily: F.display, fontSize: 86, color: C.white}}>{x.toUpperCase()}</div>
            </div>
          ))}
        </div>
      );
    default:
      return <div style={{fontFamily: F.display, fontSize: 300, ...gradientText()}}>{accent}</div>;
  }
};

/** Miniatura 1280×720 (se diseña a 1920×1080 y se escala). */
export const Thumbnail: React.FC<{t: ThumbnailData}> = ({t}) => (
  <AbsoluteFill style={{backgroundColor: C.night}}>
    <div style={{width: 1920, height: 1080, flexShrink: 0, transform: 'scale(0.6666667)', transformOrigin: 'top left', position: 'relative', overflow: 'hidden'}}>
      <Background dim={0.08} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(5,3,15,0.92) 0%, rgba(5,3,15,0.65) 45%, rgba(5,3,15,0) 70%)'}} />
      <div style={{position: 'absolute', left: 90, top: 110, width: 1050}}>
        {t.tag ? (
          <div style={{display: 'inline-block', background: C.magenta, color: C.white, fontFamily: F.display, fontSize: 84, padding: '6px 34px', borderRadius: 18, rotate: '-3deg', border: '6px solid #05030F', marginBottom: 26}}>
            {t.tag}
          </div>
        ) : null}
        <div style={{fontFamily: F.display, fontSize: Math.min(168, Math.round(1800 / Math.max(t.top.length, 1))), lineHeight: 0.98, color: C.white, textTransform: 'uppercase', ...outline(12)}}>
          {t.top}
        </div>
        <div style={{fontFamily: F.display, fontSize: Math.min(290, Math.round(1900 / Math.max(t.big.length, 1))), lineHeight: 0.95, textTransform: 'uppercase', ...gradientText(GRADIENT_V), filter: 'drop-shadow(0 12px 0 #05030F) drop-shadow(0 0 40px rgba(255,45,138,0.5))'}}>
          {t.big}
        </div>
      </div>
      <div style={{position: 'absolute', right: 80, top: 0, bottom: 0, width: 820, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Visual t={t} />
      </div>
      <div style={{position: 'absolute', left: 90, bottom: 70, display: 'flex', alignItems: 'center', gap: 18}}>
        <Logo size={70} />
        <div style={{fontFamily: F.display, fontSize: 46, color: C.white, letterSpacing: 3, ...outline(6)}}>MODO LEONIDA</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, background: GRADIENT}} />
    </div>
  </AbsoluteFill>
);
