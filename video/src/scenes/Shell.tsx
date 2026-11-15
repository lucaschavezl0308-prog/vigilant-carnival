import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, enter} from '../anim';

/** Marco común de cada escena: entrada, salida y un leve "push-in" de cámara. */
export const Shell: React.FC<{
  duration: number;
  children: React.ReactNode;
  justify?: 'center' | 'flex-start';
  align?: 'center' | 'stretch' | 'flex-start';
  padding?: string;
}> = ({duration, children, justify = 'center', align = 'stretch', padding = '150px 130px 200px'}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, duration - 8, duration], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        padding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: justify,
        alignItems: align,
        opacity,
        scale: String(interpolate(frame, [0, duration], [1, 1.025], clamp)),
        translate: `0px ${interpolate(enter(frame, 0, 16), [0, 1], [26, 0])}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
