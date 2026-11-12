import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fontFamily, NightBg } from "./Ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);

const COMPRAS = [
  { item: "400 luces LED de colores", monto: 180 },
  { item: "Árbol de navidad 2,10 m", monto: 240 },
  { item: "Gorro de Papá Noel (talle robot)", monto: 25 },
  { item: "Reno inflable gigante", monto: 310 },
  { item: "Nieve artificial (12 kg)", monto: 90 },
];

/** Movimientos de la tarjeta de Alejandro: van cayendo uno por uno. */
export const ComprasScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const start = 6;
  const gap = 11;
  const shown = COMPRAS.filter((_, i) => frame >= start + i * gap);
  const total = shown.reduce((a, c) => a + c.monto, 0);
  const lastF = start + (shown.length - 1) * gap;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <NightBg />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Interactive.Div
          name="Tarjeta"
          style={{
            width: 900,
            marginTop: 80,
            borderRadius: 44,
            background: "#f7f5fb",
            padding: "46px 46px 40px",
            boxShadow: "0 0 140px rgba(255,59,59,0.35), 0 30px 80px rgba(0,0,0,0.6)",
            translate: interpolate(frame, [0, 10], ["0px 160px", "0px 0px"], { ...clamp, easing: out }),
            opacity: interpolate(frame, [0, 5], [0, 1], clamp),
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 800, color: "#8a80a8" }}>Tarjeta de Alejandro · •••• 4821</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "8px 0 26px" }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#2a2140" }}>Movimientos</div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: "#e3262f",
                scale: interpolate(frame, [lastF, lastF + 3, lastF + 8], [1, 1.12, 1], clamp),
              }}
            >
              -${total}
            </div>
          </div>
          {COMPRAS.map((c, i) => {
            const f = start + i * gap;
            return (
              <div
                key={c.item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "20px 0",
                  borderTop: "2px solid #ece8f4",
                  opacity: interpolate(frame, [f, f + 3], [0, 1], clamp),
                  translate: interpolate(frame, [f, f + 8], ["0px -30px", "0px 0px"], { ...clamp, easing: out }),
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: ["#ff3b3b", "#2bd96b", "#e3262f", "#3fa9ff", "#c9c4dc"][i],
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, fontSize: 36, fontWeight: 800, color: "#2a2140" }}>{c.item}</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: "#e3262f" }}>-${c.monto}</div>
              </div>
            );
          })}
          <div
            style={{
              marginTop: 18,
              textAlign: "center",
              fontSize: 32,
              fontWeight: 800,
              color: "#ff6fa6",
              opacity: interpolate(frame, [start + COMPRAS.length * gap + 2, start + COMPRAS.length * gap + 6], [0, 1], clamp),
            }}
          >
            Comprado por: Claudia ♥
          </div>
        </Interactive.Div>
      </AbsoluteFill>
      {COMPRAS.map((c, i) => (
        <Sequence key={c.item} from={start + i * gap} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/ding.wav")} volume={0.4} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
