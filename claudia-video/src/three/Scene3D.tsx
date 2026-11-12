import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Alejandro, Claudia } from "./Characters";
import { CameraRig, Room } from "./Room";
import { Bed, BED_HIP, Phone } from "./Props";
import { StyleProvider } from "./style";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { voiceLevel, type Episode, type Shot } from "../script";

type V3 = [number, number, number];

// Posiciones de los personajes en la habitación.
const CLAUDIA_POS: V3 = [0.35, 0.865, -0.3];
// En el vivo: Claudia en el piso, frente al celular, con la cama detrás.
const CLAUDIA_LIVE_POS: V3 = [1.45, 0, 0.72];
const CLAUDIA_LIVE_ROT = -2.27;
const ALEJANDRO_POS: V3 = [0.45, 0, 0.6];

// Encuadres de cámara: [posición, objetivo, fov].
const CAMS: Record<string, { pos: V3; target: V3; fov: number }> = {
  wide: { pos: [1.9, 1.75, 2.3], target: [0.05, 1.1, -0.4], fov: 50 },
  alejandro: { pos: [0.28, 1.74, -0.72], target: [0.45, 1.66, 0.6], fov: 52 },
  claudia: { pos: [0.44, 1.44, 1.0], target: [0.35, 1.3, -0.3], fov: 48 },
  claudiaAway: { pos: [0.5, 1.44, 0.95], target: [0.35, 1.32, -0.3], fov: 46 },
  claudiaClose: { pos: [0.4, 1.5, 0.85], target: [0.35, 1.42, -0.3], fov: 36 },
  xmasWide: { pos: [0.75, 1.55, 2.5], target: [0.55, 1.05, -0.6], fov: 58 },
  twoShot: { pos: [1.55, 1.85, 1.55], target: [0.35, 1.25, -0.25], fov: 48 },
  phone: { pos: [0.12, 1.12, 0.35], target: [0.0, 1.08, -0.45], fov: 58 },
  bed: { pos: [0.95, 1.75, -0.12], target: [2.5, 0.95, 1.4], fov: 55 },
  alejandroBed: { pos: [2.42, 1.48, 0.42], target: [2.5, 1.38, 1.3], fov: 50 },
  // cámara frontal del celular apoyado en el piso, mirando a Claudia
  live: { pos: [0.12, 1.22, -0.38], target: [2.0, 0.68, 1.22], fov: 52 },
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Expresión de Alejandro según la emoción de la toma.
const alejandroFace = (shot: Shot) => {
  const base = { sleepy: shot.coffee ? 0.15 : 0.6, surprised: 0, sad: 0 };
  switch (shot.mood) {
    case "sleepy":
      return { ...base, sleepy: 0.62 };
    case "shocked":
      return { ...base, sleepy: 0.1, surprised: 1 };
    case "sad":
      return { ...base, sleepy: 0.35, sad: 1 };
    case "hopeful":
      return { ...base, sleepy: 0.05, surprised: 0.35 };
    case "suspicious":
      return { ...base, sleepy: 0.5 };
    default:
      return base;
  }
};

export const Scene3D: React.FC<{
  ep: Episode;
  shot: Shot;
  /** frame global del video, para que el amanecer avance de corrido */
  globalOffset: number;
}> = ({ ep, shot, globalOffset }) => {
  const { kind, talk } = shot;
  const hasCoffee = shot.coffee ?? false;
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const g = frame + globalOffset + ep.dawnStart;
  const cam = CAMS[kind] ?? CAMS.wide;
  const level = voiceLevel(ep.id, shot.id, frame);
  const face = alejandroFace(shot);
  const ease = { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) };

  // Empuje lento de cámara + leve movimiento "a mano".
  const push = interpolate(frame, [0, durationInFrames], [0, 0.08], {
    ...clamp,
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });
  const pos: V3 = [
    cam.pos[0] +
      (cam.target[0] - cam.pos[0]) * push +
      Math.sin(g * 0.031) * 0.006,
    cam.pos[1] +
      (cam.target[1] - cam.pos[1]) * push +
      Math.sin(g * 0.047) * 0.005,
    cam.pos[2] + (cam.target[2] - cam.pos[2]) * push,
  ];
  // Sacudón de cámara cuando alguien se sorprende.
  if (shot.mood === "shocked") {
    const k = interpolate(frame, [0, 10], [1, 0], clamp);
    pos[0] += Math.sin(frame * 2.1) * 0.02 * k;
    pos[1] += Math.cos(frame * 2.7) * 0.015 * k;
  }
  // Zoom de golpe en el remate.
  const baseFov = cam.fov / (shot.zoom ?? 1);
  const fov = shot.punch
    ? interpolate(
        frame,
        [2, 6],
        [
          baseFov,
          baseFov * (kind === "claudiaClose" || kind === "live" ? 0.9 : 0.8),
        ],
        ease,
      )
    : baseFov;
  // Movimiento de celular en mano durante el vivo.
  if (kind === "live") {
    pos[0] += Math.sin(g * 0.11) * 0.006;
    pos[1] += Math.sin(g * 0.17 + 1) * 0.005;
  }

  const inBed = kind === "bed" || kind === "alejandroBed";
  const showAlejandro = kind === "twoShot" || kind === "alejandro";
  const showClaudia = kind !== "alejandro" && kind !== "phone" && !inBed;
  // Alejandro se sienta en la cama: de acostado (1.45 rad) a sentado.
  const riseFrom = kind === "bed" || shot.aleSit === "rise";
  const sitUp = riseFrom
    ? interpolate(frame, [4, 26], [1.45, 0.12], ease)
    : kind === "live" && shot.aleSit !== "sitting"
      ? 1.45
      : 0.12;
  const isLive = kind === "live";
  // Celular: la pantalla se prende y vibra (sin sonido).
  const phoneOn =
    kind === "phone"
      ? interpolate(frame, [10, 16], [0, 1], clamp)
      : ep.bed
        ? 0
        : -1;

  // Toma del café: Claudia empuja la taza hacia el borde.
  const give =
    kind === "twoShot"
      ? interpolate(frame, [20, 70], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })
      : 0;
  const mugX = interpolate(give, [0, 1], [0.75, 0.55]);
  const mugZ = interpolate(give, [0, 1], [-0.25, -0.13]);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      style={{ backgroundColor: "#0d0b1a" }}
    >
      <StyleProvider style={ep.style ?? "lowpoly"}>
        {ep.style === "suave" ? <SmoothExtras /> : null}
        <CameraRig position={pos} target={cam.target} fov={fov} />
        <Room
          frame={g}
          mugOnDesk={!hasCoffee}
          mugX={mugX}
          mugZ={mugZ}
          xmas={ep.xmas}
        />
        {ep.bed ? <Bed /> : null}
        {phoneOn >= 0 ? (
          <Phone
            position={[0.1, 0.8675, -0.22]}
            rotationY={0.18}
            on={phoneOn}
            frame={frame}
            buzz={kind === "phone" && frame > 14}
          />
        ) : null}
        {isLive ? (
          // luz del celular/aro de luz sobre Claudia
          <pointLight
            position={[0.75, 1.25, 0.05]}
            intensity={0.9}
            distance={2.4}
            color="#ffd6ec"
          />
        ) : null}
        {ep.bed && (inBed || isLive || kind === "phone" || kind === "wide") ? (
          // Alejandro en la cama: gira sobre la cadera para sentarse.
          <group position={BED_HIP} rotation={[sitUp, 0, 0]}>
            <Alejandro
              frame={g}
              talking={talk === "alejandro"}
              mouthLevel={talk === "alejandro" ? level : undefined}
              position={[0, -0.7, 0]}
              rotationY={Math.PI}
              sleepy={kind === "phone" ? 1 : face.sleepy}
              surprised={
                face.surprised * interpolate(frame, [0, 8], [0, 1], ease)
              }
              sad={face.sad}
            />
          </group>
        ) : null}
        {showClaudia ? (
          <Claudia
            frame={g}
            talking={talk === "claudia"}
            mouthLevel={talk === "claudia" ? level : undefined}
            position={isLive ? CLAUDIA_LIVE_POS : CLAUDIA_POS}
            rotationY={
              isLive
                ? CLAUDIA_LIVE_ROT
                : kind === "wide"
                  ? -0.75
                  : kind === "twoShot" || kind === "xmasWide"
                    ? 0.35
                    : 0.05
            }
            typing={kind === "wide"}
            lookAway={
              kind === "claudiaAway" || shot.lookBack
                ? interpolate(frame, [0, 12], [0, 1], {
                    ...clamp,
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  })
                : 0
            }
            offerArm={give}
            eyeStyle={shot.eyes ?? "normal"}
            santaHat={ep.xmas}
          />
        ) : null}
        {showAlejandro ? (
          <Alejandro
            frame={g}
            talking={talk === "alejandro"}
            mouthLevel={talk === "alejandro" ? level : undefined}
            position={ALEJANDRO_POS}
            rotationY={Math.PI}
            sleepy={face.sleepy}
            surprised={
              face.surprised * interpolate(frame, [0, 8], [0, 1], ease)
            }
            sad={face.sad}
            holdingMug={hasCoffee}
          />
        ) : null}
      </StyleProvider>
    </ThreeCanvas>
  );
};

/**
 * Extras del estilo suave: luz ambiente de estudio (sin descargar HDRs),
 * sombras de contacto suaves en el piso y el escritorio, brillo en las luces
 * y viñeta. Todo estático: no anima por su cuenta.
 */
const SmoothExtras: React.FC = () => (
  <>
    <Environment resolution={128} frames={1}>
      <Lightformer
        intensity={0.6}
        color="#ffd9ec"
        position={[0, 3, 2]}
        scale={[6, 2, 1]}
      />
      <Lightformer
        intensity={0.4}
        color="#9fb4ff"
        position={[-3, 1.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[4, 2, 1]}
      />
      <Lightformer
        intensity={0.3}
        color="#ffc28a"
        position={[3, 1, -2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[4, 2, 1]}
      />
    </Environment>
    <ContactShadows
      position={[0.6, 0.002, 0.9]}
      scale={6}
      resolution={512}
      blur={2.4}
      opacity={0.55}
      far={2}
      frames={1}
    />
    <ContactShadows
      position={[0, 0.868, -0.55]}
      scale={[2, 1]}
      resolution={256}
      blur={1.6}
      opacity={0.45}
      far={0.6}
      frames={1}
    />
  </>
);
