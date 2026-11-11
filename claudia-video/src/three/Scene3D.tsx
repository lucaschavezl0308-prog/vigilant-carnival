import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Alejandro, Claudia } from "./Characters";
import { CameraRig, Room } from "./Room";
import type { ShotKind, Speaker } from "../script";

type V3 = [number, number, number];

// Posiciones de los personajes en la habitación.
const CLAUDIA_POS: V3 = [0.35, 0.865, -0.3];
const ALEJANDRO_POS: V3 = [0.45, 0, 0.6];

// Encuadres de cámara: [posición, objetivo, fov].
const CAMS: Record<string, { pos: V3; target: V3; fov: number }> = {
  wide: { pos: [1.9, 1.75, 2.3], target: [0.05, 1.1, -0.4], fov: 50 },
  alejandro: { pos: [0.28, 1.74, -0.72], target: [0.45, 1.66, 0.6], fov: 52 },
  claudia: { pos: [0.44, 1.44, 1.0], target: [0.35, 1.3, -0.3], fov: 48 },
  claudiaAway: { pos: [0.5, 1.44, 0.95], target: [0.35, 1.32, -0.3], fov: 46 },
  twoShot: { pos: [1.55, 1.85, 1.55], target: [0.35, 1.25, -0.25], fov: 48 },
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Scene3D: React.FC<{
  kind: ShotKind;
  talk: Speaker;
  /** frame global del video, para que el amanecer avance de corrido */
  globalOffset: number;
  /** ¿Alejandro ya tiene el café? */
  hasCoffee?: boolean;
  /** Expresión de sorpresa de Alejandro */
  surprised?: boolean;
}> = ({ kind, talk, globalOffset, hasCoffee = false, surprised = false }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const g = frame + globalOffset;
  const cam = CAMS[kind] ?? CAMS.wide;

  // Empuje lento de cámara + leve movimiento "a mano".
  const push = interpolate(frame, [0, durationInFrames], [0, 0.08], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });
  const pos: V3 = [
    cam.pos[0] + (cam.target[0] - cam.pos[0]) * push + Math.sin(g * 0.031) * 0.006,
    cam.pos[1] + (cam.target[1] - cam.pos[1]) * push + Math.sin(g * 0.047) * 0.005,
    cam.pos[2] + (cam.target[2] - cam.pos[2]) * push,
  ];

  const showAlejandro = kind === "twoShot" || kind === "alejandro";
  const showClaudia = kind !== "alejandro";

  // Toma del café: Claudia empuja la taza hacia el borde.
  const give = kind === "twoShot" ? interpolate(frame, [20, 70], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }) : 0;
  const mugX = interpolate(give, [0, 1], [0.75, 0.55]);
  const mugZ = interpolate(give, [0, 1], [-0.25, -0.13]);

  return (
    <ThreeCanvas width={width} height={height} style={{ backgroundColor: "#0d0b1a" }}>
      <CameraRig position={pos} target={cam.target} fov={cam.fov} />
      <Room frame={g} mugOnDesk={!hasCoffee} mugX={mugX} mugZ={mugZ} />
      {showClaudia ? (
        <Claudia
          frame={g}
          talking={talk === "claudia"}
          position={CLAUDIA_POS}
          rotationY={kind === "wide" ? -0.75 : kind === "twoShot" ? 0.35 : 0.05}
          typing={kind === "wide"}
          lookAway={
            kind === "claudiaAway"
              ? interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })
              : 0
          }
          offerArm={give}
        />
      ) : null}
      {showAlejandro ? (
        <Alejandro
          frame={g}
          talking={talk === "alejandro"}
          position={ALEJANDRO_POS}
          rotationY={Math.PI}
          sleepy={hasCoffee ? 0.15 : 0.6}
          surprised={
            surprised
              ? interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) })
              : 0
          }
          holdingMug={hasCoffee}
        />
      ) : null}
    </ThreeCanvas>
  );
};
