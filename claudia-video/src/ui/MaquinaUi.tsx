import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { fontFamily, NightBg } from "./Ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const pop = Easing.bezier(0.34, 1.56, 0.64, 1);

/** Celular grande con una notificación que cae de golpe (gancho y loop). */
export const NotifScreen: React.FC<{ from: string; text: string }> = ({ from, text }) => {
  const frame = useCurrentFrame();
  const shake = frame > 3 && frame < 16 ? Math.sin(frame * 3.1) * 10 : 0;
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <NightBg />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 700,
            height: 1360,
            marginTop: 160,
            borderRadius: 90,
            background: "linear-gradient(170deg, #3a1d6e, #c77dff 60%, #ff8fbf)",
            border: "16px solid #15141c",
            boxShadow: "0 0 160px rgba(199,125,255,0.45), 0 40px 90px rgba(0,0,0,0.7)",
            position: "relative",
            rotate: `${shake * 0.15}deg`,
            translate: `${shake}px 0px`,
          }}
        >
          <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", color: "white" }}>
            <div style={{ fontSize: 34, fontWeight: 800, opacity: 0.85 }}>jueves, 12 de noviembre</div>
            <div style={{ fontSize: 170, fontWeight: 900, lineHeight: 1 }}>7:00</div>
          </div>
          {/* notificación */}
          <div
            style={{
              position: "absolute",
              top: 420,
              left: 30,
              right: 30,
              padding: "26px 30px",
              borderRadius: 40,
              background: "rgba(255,255,255,0.96)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
              display: "flex",
              gap: 22,
              alignItems: "center",
              translate: interpolate(frame, [2, 9], ["0px -260px", "0px 0px"], { ...clamp, easing: pop }),
              opacity: interpolate(frame, [2, 5], [0, 1], clamp),
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 22,
                background: "#25c26b",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
              }}
            >
              💬
            </div>
            <div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#1d1a2e" }}>{from}</div>
              <div style={{ fontSize: 38, fontWeight: 800, color: "#3a3550", lineHeight: 1.15 }}>{text}</div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <Sequence from={2} durationInFrames={20} layout="none">
        <Audio src={staticFile("sfx/ding.wav")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};

type Msg = { who: "ale" | "jefe"; text: string; hora?: string; at: number; tiny?: boolean; big?: boolean };

// "ale" son los mensajes que mandó Claudia haciéndose pasar por Ale.
const MSGS: Msg[] = [
  { who: "ale", text: "Buen día jefe! Ya terminé el informe ✅", hora: "3:12", at: 2 },
  { who: "ale", text: "También hice el del mes que viene", hora: "3:13", at: 9 },
  { who: "ale", text: "Y le arreglé la impresora a Marta", hora: "3:14", at: 16 },
  { who: "jefe", text: "Alejandro… sos una máquina 🤯", hora: "8:01", at: 26, big: true },
  // easter egg: se lee pausando / en la segunda vista
  { who: "ale", text: "jaja literal. pd: vendí el sillón de la oficina", hora: "8:02", at: 34, tiny: true },
];

/** Chat de trabajo: Claudia contestó todo como si fuera Ale. */
export const ChatScreen: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <NightBg />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 860,
            height: 1260,
            marginTop: 200,
            borderRadius: 60,
            background: "#ece5dd",
            overflow: "hidden",
            boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            scale: interpolate(frame, [0, 8], [1.08, 1], { ...clamp, easing: out, output: "perceptual-scale" }),
          }}
        >
          <div style={{ background: "#1f7a52", padding: "30px 36px", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, background: "#9fd8b8" }} />
            <div>
              <div style={{ color: "white", fontSize: 40, fontWeight: 900 }}>Jefe Rodríguez</div>
              <div style={{ color: "#cfeedd", fontSize: 28, fontWeight: 700 }}>en línea</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "30px 30px", display: "flex", flexDirection: "column", gap: 18 }}>
            {MSGS.filter((m) => frame >= m.at).map((m) => (
              <div
                key={m.text}
                style={{
                  alignSelf: m.who === "ale" ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                  padding: m.tiny ? "8px 16px" : "18px 24px",
                  borderRadius: 26,
                  background: m.who === "ale" ? "#d6f8c2" : "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
                  fontSize: m.tiny ? 22 : m.big ? 50 : 38,
                  fontWeight: m.big ? 900 : 700,
                  color: "#1d1a2e",
                  scale: interpolate(frame, [m.at, m.at + 6], [0.6, 1], { ...clamp, easing: pop }),
                  transformOrigin: m.who === "ale" ? "right bottom" : "left bottom",
                }}
              >
                {m.text}
                {m.hora ? (
                  <span style={{ marginLeft: 14, fontSize: m.tiny ? 16 : 24, color: "#7a8a80", fontWeight: 700 }}>{m.hora}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
      {MSGS.map((m) => (
        <Sequence key={m.text} from={m.at} durationInFrames={10} layout="none">
          <Audio src={staticFile("sfx/pop.wav")} volume={0.5} />
        </Sequence>
      ))}
      <Img src={staticFile("claudia-avatar.png")} style={{ display: "none" }} />
    </AbsoluteFill>
  );
};
