import {Easing, interpolate, spring} from 'remotion';

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 con easing suave a partir de `start` durante `dur` frames. */
export const enter = (frame: number, start: number, dur = 18) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: EASE_OUT});

/** Muelle 0→1 (con un pequeño rebote) para "pops". */
export const pop = (frame: number, fps: number, start: number, damping = 14) =>
  spring({frame: frame - start, fps, config: {damping, stiffness: 160, mass: 0.7}});

/** Pseudo-aleatorio determinista. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
