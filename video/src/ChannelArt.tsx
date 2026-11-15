import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, CHANNEL, F, GRADIENT, GRADIENT_V, gradientText} from './brand';
import {Background} from './components/Background';
import {Logo} from './components/Chrome';

/** Banner de YouTube 2560×1440. Lo importante va en la zona segura central (1546×423). */
export const Banner: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.night}}>
    <Background dim={0.15} sunY={-40} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(5,3,15,0.65) 0%, rgba(5,3,15,0) 55%)'}} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 1546, height: 423, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 50}}>
        <Logo size={240} />
        <div>
          <div style={{fontFamily: F.display, fontSize: 170, lineHeight: 0.95, letterSpacing: 6, ...gradientText(GRADIENT_V), filter: 'drop-shadow(0 10px 0 #05030F)'}}>
            {CHANNEL.name}
          </div>
          <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 46, color: C.white, marginTop: 10, whiteSpace: 'nowrap', textShadow: '0 4px 20px #000'}}>
            GTA 6 sin rodeos · guías y todo lo que buscas
          </div>
        </div>
      </div>
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 18, background: GRADIENT}} />
  </AbsoluteFill>
);

/** Avatar del canal 800×800 (YouTube lo recorta en círculo). */
export const Avatar: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.deep, alignItems: 'center', justifyContent: 'center'}}>
    <Logo size={800} />
  </AbsoluteFill>
);
