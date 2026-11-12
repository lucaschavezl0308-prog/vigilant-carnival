import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Monitor, money } from "./AlarmaUi";
import { NightBg } from "./Ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);

const ITEMS = [
  { concepto: "Sueldo básico", monto: 0 },
  { concepto: "Llegada tarde (1 minuto)", monto: -10 },
  { concepto: "Bostezos en horario laboral", monto: -15 },
  { concepto: "Café de la empresa", monto: -3 },
  { concepto: "Alquiler del piso (no hay cama)", monto: -25 },
];

/** Recibo de sueldo de Alejandro: todo descuentos. */
export const ReciboScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const start = 6;
  const gap = 10;
  const shown = ITEMS.filter((_, i) => frame >= start + i * gap);
  const total = shown.reduce((a, c) => a + c.monto, 0);
  const lastF = start + (shown.length - 1) * gap;
  return (
    <AbsoluteFill>
      <NightBg />
      <Monitor glow="rgba(255,92,92,0.4)">
        <div style={{ position: "absolute", inset: 0, background: "#f7f5fb", padding: "36px 48px" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#ff6fa6", letterSpacing: 3 }}>ALE &amp; CLAUDIA · RECURSOS HUMANOS</div>
          <div style={{ fontSize: 54, fontWeight: 900, color: "#2a2140", margin: "4px 0 18px" }}>Recibo de sueldo · Alejandro</div>
          {ITEMS.map((it, i) => {
            const f = start + i * gap;
            return (
              <div
                key={it.concepto}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  borderTop: "2px solid #ece8f4",
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#2a2140",
                  opacity: interpolate(frame, [f, f + 3], [0, 1], clamp),
                  translate: interpolate(frame, [f, f + 8], ["40px 0px", "0px 0px"], { ...clamp, easing: out }),
                }}
              >
                <span>{it.concepto}</span>
                <span style={{ color: it.monto < 0 ? "#e3262f" : "#2a2140" }}>
                  {it.monto < 0 ? "-" : ""}
                  {money(Math.abs(it.monto))}
                </span>
              </div>
            );
          })}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
              paddingTop: 16,
              borderTop: "4px solid #2a2140",
              fontSize: 50,
              fontWeight: 900,
              color: "#e3262f",
              scale: interpolate(frame, [lastF, lastF + 3, lastF + 8], [1, 1.06, 1], clamp),
            }}
          >
            <span>A COBRAR</span>
            <span>-{money(Math.abs(total))}</span>
          </div>
        </div>
      </Monitor>
      {ITEMS.slice(1).map((it, i) => (
        <Sequence key={it.concepto} from={start + (i + 1) * gap} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/ding.wav")} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
