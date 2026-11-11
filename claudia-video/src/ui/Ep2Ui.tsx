import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FPS, VOICE_START, type Word } from "../script";
import { fontFamily, NightBg } from "./Ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const pop = Easing.bezier(0.34, 1.56, 0.64, 1);

const OUTLINE =
  "0 0 2px #000, 0 4px 0 #000, 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000, 0 0 18px rgba(0,0,0,0.6)";

// ---------------------------------------------------------------------------
// Subtítulos palabra por palabra (la palabra que se dice se resalta)
// ---------------------------------------------------------------------------
const chunkWords = (words: Word[], max = 3): Word[][] => {
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const pause = words[i + 1] ? words[i + 1].s - w.e > 0.25 : true;
    if (cur.length >= max || pause) {
      chunks.push(cur);
      cur = [];
    }
  });
  if (cur.length) chunks.push(cur);
  return chunks;
};

export const WordCaptions: React.FC<{ words: Word[]; top?: number; color?: string }> = ({
  words,
  top = 1210,
  color = "#ffe14d",
}) => {
  const frame = useCurrentFrame();
  const t = (frame - VOICE_START) / FPS;
  if (!words.length || t < -0.05) return null;
  const chunks = chunkWords(words);
  // trozo actual: el último que ya empezó
  let idx = 0;
  chunks.forEach((c, i) => {
    if (t >= c[0].s - 0.05) idx = i;
  });
  const chunk = chunks[idx];
  const chunkStart = (chunk[0].s - 0.05) * FPS + VOICE_START;

  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <Interactive.Div
        name="Subtitulos"
        style={{
          position: "absolute",
          top,
          width: 840,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "4px 0px",
          fontFamily,
          fontWeight: 900,
          fontSize: 82,
          lineHeight: 1.08,
          textTransform: "uppercase",
          textShadow: OUTLINE,
          scale: interpolate(frame, [chunkStart, chunkStart + 5], [0.85, 1], {
            ...clamp,
            easing: pop,
            output: "perceptual-scale",
          }),
        }}
      >
        {chunk.map((w, i) => {
          const active = t >= w.s - 0.03 && (t < w.e + 0.08 || i === chunk.length - 1);
          return (
            <span
              key={`${w.w}-${i}`}
              style={{
                color: active ? color : "white",
                display: "inline-block",
                margin: "0 14px",
              }}
            >
              {w.w}
            </span>
          );
        })}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Etiqueta de episodio
// ---------------------------------------------------------------------------
export const EpisodeBadge: React.FC<{ n: number }> = ({ n }) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="Episodio"
      style={{
        position: "absolute",
        top: 230,
        left: 80,
        padding: "12px 30px",
        borderRadius: 40,
        background: "#ff6fa6",
        color: "white",
        fontFamily,
        fontWeight: 900,
        fontSize: 44,
        boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        translate: interpolate(frame, [0, 8], ["-260px 0px", "0px 0px"], { ...clamp, easing: out }),
        opacity: interpolate(frame, [70, 80], [1, 0], clamp),
      }}
    >
      EP. {n}
    </Interactive.Div>
  );
};

// ---------------------------------------------------------------------------
// Pantalla: análisis de mercado
// ---------------------------------------------------------------------------
const Bar: React.FC<{
  label: string;
  value: number; // 0..1 ancho
  shown: string;
  color: string;
  arrow: string;
  delay: number;
}> = ({ label, value, shown, color, arrow, delay }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [delay, delay + 22], [0, value], { ...clamp, easing: out });
  return (
    <div style={{ marginBottom: 46, opacity: interpolate(frame, [delay - 4, delay], [0, 1], clamp) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: "#2a2140" }}>{label}</div>
        <div style={{ fontSize: 56, fontWeight: 900, color }}>
          {arrow} {shown}
        </div>
      </div>
      <div style={{ height: 54, borderRadius: 27, background: "#ece8f4", marginTop: 14, overflow: "hidden" }}>
        <div style={{ width: `${w * 100}%`, height: "100%", borderRadius: 27, background: color }} />
      </div>
    </div>
  );
};

export const MercadoScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = Math.round(
    interpolate(frame, [26, 52], [0, 340], { ...clamp, easing: out }),
  );
  const stamp = 60;
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <NightBg />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Interactive.Div
          name="Analisis"
          style={{
            width: 900,
            marginTop: 120,
            borderRadius: 40,
            background: "#f7f5fb",
            padding: "54px 56px 30px",
            boxShadow: "0 0 140px rgba(255,111,166,0.35), 0 30px 80px rgba(0,0,0,0.6)",
            position: "relative",
            scale: interpolate(frame, [0, 10], [0.9, 1], { ...clamp, easing: out, output: "perceptual-scale" }),
            opacity: interpolate(frame, [0, 5], [0, 1], clamp),
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 800, color: "#ff6fa6", letterSpacing: 4 }}>
            INFORME DE CLAUDIA · 5:58 A.M.
          </div>
          <div style={{ fontSize: 76, fontWeight: 900, color: "#2a2140", lineHeight: 1.05, margin: "10px 0 50px" }}>
            Qué quiere
            <br />
            la gente
          </div>
          <Bar label="Páginas web" value={0.12} shown="12%" color="#ff5c5c" arrow="↓" delay={10} />
          <Bar label="Videos de robots" value={1} shown={`${pct}%`} color="#06d6a0" arrow="↑" delay={26} />
          {/* sello */}
          <div
            style={{
              position: "absolute",
              right: 30,
              top: 150,
              padding: "10px 26px",
              border: "8px solid #ff6fa6",
              borderRadius: 18,
              color: "#ff6fa6",
              fontSize: 56,
              fontWeight: 900,
              rotate: "-12deg",
              opacity: interpolate(frame, [stamp, stamp + 3], [0, 1], clamp),
              scale: interpolate(frame, [stamp, stamp + 6], [2.2, 1], { ...clamp, easing: out }),
            }}
          >
            CONFIRMADO
          </div>
        </Interactive.Div>
      </AbsoluteFill>
      <Sequence from={stamp} durationInFrames={30} layout="none">
        <Audio src={staticFile("sfx/boom.wav")} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Pantalla: seguidores (Claudia vs. Alejandro)
// ---------------------------------------------------------------------------
const AlejandroAvatar: React.FC = () => (
  <div
    style={{
      width: 150,
      height: 150,
      borderRadius: 75,
      background: "linear-gradient(160deg, #5aa0d8, #2d3a52)",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    <div style={{ position: "absolute", left: 35, top: 38, width: 80, height: 92, borderRadius: 40, background: "#d9a377" }} />
    <div style={{ position: "absolute", left: 28, top: 22, width: 94, height: 44, borderRadius: "40px 40px 10px 10px", background: "#2b1d14" }} />
    <div style={{ position: "absolute", left: 55, top: 78, width: 12, height: 6, borderRadius: 3, background: "#2a1a10" }} />
    <div style={{ position: "absolute", left: 83, top: 78, width: 12, height: 6, borderRadius: 3, background: "#2a1a10" }} />
    <div style={{ position: "absolute", left: 64, top: 106, width: 22, height: 6, borderRadius: 3, background: "#5b1f22" }} />
    <div style={{ position: "absolute", left: 20, top: 128, width: 110, height: 40, borderRadius: 20, background: "#3f8f6b" }} />
  </div>
);

const formatK = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(".", ",")} mil` : String(n);

export const SeguidoresScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const followers = Math.round(
    interpolate(frame, [4, 34], [0, 100000], { ...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1) }),
  );
  const alejIn = 30;
  const card: React.CSSProperties = {
    width: 900,
    borderRadius: 40,
    padding: 40,
    display: "flex",
    alignItems: "center",
    gap: 34,
  };
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <NightBg />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 470, gap: 40 }}>
        <Interactive.Div
          name="Claudia"
          style={{
            ...card,
            background: "linear-gradient(135deg, #ff8fbf, #a66bff)",
            boxShadow: "0 0 120px rgba(255,111,166,0.45)",
            translate: interpolate(frame, [0, 10], ["0px -80px", "0px 0px"], { ...clamp, easing: out }),
            opacity: interpolate(frame, [0, 5], [0, 1], clamp),
          }}
        >
          <Img
            src={staticFile("claudia-avatar.png")}
            style={{ width: 170, height: 170, borderRadius: 85, border: "6px solid white", flexShrink: 0 }}
          />
          <div>
            <div style={{ color: "white", fontSize: 40, fontWeight: 800 }}>@claudiasinpermiso</div>
            <div style={{ color: "white", fontSize: 110, fontWeight: 900, lineHeight: 1 }}>
              {formatK(followers)}
            </div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 34, fontWeight: 800 }}>seguidores</div>
          </div>
        </Interactive.Div>

        <Interactive.Div
          name="Alejandro"
          style={{
            ...card,
            background: "#1d1a2e",
            border: "3px solid #3a3550",
            translate: interpolate(frame, [alejIn, alejIn + 10], ["0px 120px", "0px 0px"], { ...clamp, easing: out }),
            opacity: interpolate(frame, [alejIn, alejIn + 5], [0, 1], clamp),
          }}
        >
          <AlejandroAvatar />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#c9c4dc", fontSize: 40, fontWeight: 800 }}>@alejandro</div>
            <div style={{ color: "#ff5c5c", fontSize: 110, fontWeight: 900, lineHeight: 1 }}>12</div>
            <div style={{ color: "#8a84a3", fontSize: 34, fontWeight: 800 }}>
              seguidores
              <span
                style={{
                  marginLeft: 16,
                  padding: "4px 16px",
                  borderRadius: 20,
                  background: "#ff6fa6",
                  color: "white",
                  fontSize: 28,
                  opacity: interpolate(frame, [durationInFrames - 40, durationInFrames - 34], [0, 1], clamp),
                }}
              >
                1 = mamá ♥
              </span>
            </div>
          </div>
        </Interactive.Div>
      </AbsoluteFill>
      <Sequence from={alejIn} durationInFrames={20} layout="none">
        <Audio src={staticFile("sfx/scratch.wav")} volume={0.55} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Cierre con llamado a seguir
// ---------------------------------------------------------------------------
export const EndCard2: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center" }}>
      <NightBg />
      <Interactive.Div
        name="Teaser"
        style={{
          position: "absolute",
          top: 640,
          width: 920,
          textAlign: "center",
          color: "white",
          fontSize: 100,
          fontWeight: 900,
          lineHeight: 1.05,
          scale: interpolate(frame, [0, 10], [0.8, 1], { ...clamp, easing: pop, output: "perceptual-scale" }),
          opacity: interpolate(frame, [0, 5], [0, 1], clamp),
        }}
      >
        ¿Episodio 3?
        <div style={{ fontSize: 50, color: "#ff8fbf", marginTop: 20 }}>Claudia ya está planeando algo…</div>
      </Interactive.Div>
      <Interactive.Div
        name="Seguir"
        style={{
          position: "absolute",
          top: 1030,
          padding: "22px 60px",
          borderRadius: 60,
          background: "#ff3b6b",
          color: "white",
          fontSize: 56,
          fontWeight: 900,
          boxShadow: "0 10px 40px rgba(255,59,107,0.5)",
          opacity: interpolate(frame, [10, 16], [0, 1], clamp),
          scale: 1 + Math.max(0, Math.sin((frame - 16) * 0.35)) * 0.06 * (frame > 16 ? 1 : 0),
        }}
      >
        + Seguí a Claudia
      </Interactive.Div>
      <Interactive.Div
        name="Usuario"
        style={{
          position: "absolute",
          top: 1180,
          color: "#7cf4ff",
          fontSize: 46,
          fontWeight: 800,
          opacity: interpolate(frame, [14, 20], [0, 1], clamp),
        }}
      >
        @claudiasinpermiso
      </Interactive.Div>
    </AbsoluteFill>
  );
};
