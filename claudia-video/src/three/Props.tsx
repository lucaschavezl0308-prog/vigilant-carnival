import { useSmooth } from "./style";
import React, { useLayoutEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { fontFamily } from "../ui/Ui";

const Flat: React.FC<{ color: string }> = ({ color }) => (
  <meshStandardMaterial color={color} flatShading={!useSmooth()} roughness={0.9} />
);

// ---------------------------------------------------------------------------
// Cama (contra la pared derecha). La cabecera queda hacia +z.
// ---------------------------------------------------------------------------
export const BED_HIP: [number, number, number] = [2.5, 0.52, 1.3];

export const Bed: React.FC = () => (
  <group>
    {/* base */}
    <mesh position={[2.5, 0.2, 1.55]}>
      <boxGeometry args={[1.05, 0.4, 2.15]} />
      <Flat color="#6b4a3a" />
    </mesh>
    {/* colchón */}
    <mesh position={[2.5, 0.45, 1.55]}>
      <boxGeometry args={[0.98, 0.12, 2.05]} />
      <Flat color="#e9e2f0" />
    </mesh>
    {/* cabecera */}
    <mesh position={[2.5, 0.75, 2.66]}>
      <boxGeometry args={[1.1, 0.8, 0.08]} />
      <Flat color="#5a3d30" />
    </mesh>
    {/* almohada */}
    <mesh position={[2.5, 0.56, 2.38]} rotation={[0.1, 0, 0]}>
      <boxGeometry args={[0.62, 0.12, 0.34]} />
      <Flat color="#f7f3ee" />
    </mesh>
    {/* frazada (tapa las piernas) */}
    <mesh position={[2.5, 0.58, 1.12]} rotation={[0, 0, 0]}>
      <boxGeometry args={[1.04, 0.2, 1.3]} />
      <Flat color="#5a4f9e" />
    </mesh>
    <mesh position={[2.5, 0.69, 1.7]} rotation={[-0.35, 0, 0]}>
      <boxGeometry args={[1.0, 0.06, 0.35]} />
      <Flat color="#6c61b5" />
    </mesh>
    {/* mesita de luz con lamparita */}
    <mesh position={[1.82, 0.28, 2.45]}>
      <boxGeometry args={[0.36, 0.56, 0.36]} />
      <Flat color="#7d5a43" />
    </mesh>
    <mesh position={[1.82, 0.68, 2.45]}>
      <coneGeometry args={[0.1, 0.16, 6]} />
      <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
    </mesh>
    <pointLight position={[1.82, 0.9, 2.3]} intensity={0.9} distance={2.2} color="#ffc98a" />
    {/* póster en la pared derecha */}
    <mesh position={[3.08, 1.6, 1.4]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[0.7, 0.9]} />
      <Flat color="#3fa9ff" />
    </mesh>
    <mesh position={[3.07, 1.65, 1.4]} rotation={[0, -Math.PI / 2, 0]}>
      <circleGeometry args={[0.2, 5]} />
      <meshBasicMaterial color="#ffd23f" />
    </mesh>
  </group>
);

// ---------------------------------------------------------------------------
// Celular sobre el escritorio, con pantalla dibujada en un canvas.
// on: 0..1 brillo de la pantalla. Sin sonido (la alarma se agrega aparte).
// ---------------------------------------------------------------------------
const W = 360;
const H = 760;

const drawScreen = (ctx: CanvasRenderingContext2D, on: number, frame: number) => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (on <= 0) return;
  ctx.globalAlpha = on;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#3a1d6e");
  g.addColorStop(0.55, "#c77dff");
  g.addColorStop(1, "#ff8fbf");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = `800 26px ${fontFamily}`;
  ctx.fillText("jueves, 12 de noviembre", W / 2, 120);
  ctx.font = `900 132px ${fontFamily}`;
  ctx.fillText("6:00", W / 2, 260);
  // tarjeta de alarma (late suavemente)
  const pulse = 1 + Math.max(0, Math.sin(frame * 0.5)) * 0.04;
  const cw = 300 * pulse;
  const ch = 150 * pulse;
  const cx = W / 2 - cw / 2;
  const cy = 360;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 28);
  ctx.fill();
  ctx.fillStyle = "#2a2140";
  ctx.font = `900 34px ${fontFamily}`;
  ctx.fillText("Alarma", W / 2, cy + 58);
  ctx.font = `800 26px ${fontFamily}`;
  ctx.fillStyle = "#8a80a8";
  ctx.fillText("6:00 a.m. · Levantate, Ale", W / 2, cy + 102);
  // botones
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.roundRect(40, 600, 130, 64, 32);
  ctx.roundRect(190, 600, 130, 64, 32);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = `800 22px ${fontFamily}`;
  ctx.fillText("Posponer", 105, 640);
  ctx.fillText("Detener", 255, 640);
  ctx.globalAlpha = 1;
};

export const Phone: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  on: number;
  frame: number;
  /** vibración visual (sin sonido) */
  buzz?: boolean;
}> = ({ position, rotationY = 0, on, frame, buzz = false }) => {
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return { canvas: c, texture: t };
  }, []);

  useLayoutEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawScreen(ctx, on, frame);
    texture.needsUpdate = true;
  }, [canvas, texture, on, frame]);

  const jitter = buzz ? Math.sin(frame * 2.9) * 0.003 : 0;
  const twist = buzz ? Math.sin(frame * 3.7) * 0.03 : 0;

  return (
    <group position={[position[0] + jitter, position[1], position[2]]} rotation={[0, rotationY + twist, 0]}>
      <mesh position={[0, 0.004, 0]}>
        <boxGeometry args={[0.078, 0.008, 0.158]} />
        <meshStandardMaterial color="#1b1a22" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.0085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.07, 0.148]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.08, 0]} intensity={0.12 * on} distance={0.35} color="#d9a0ff" />
    </group>
  );
};
