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
import { FPS } from "../script";
import type { LiveInfo } from "../episodes/types";
import { fontFamily } from "./Ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} mil` : String(Math.round(n));

const AVATAR_COLORS = ["#ff8fbf", "#7cf4ff", "#ffd23f", "#06d6a0", "#a66bff", "#ff6b6b"];
const colorFor = (u: string) => AVATAR_COLORS[[...u].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

/** Interfaz de transmisión en vivo encima del video. */
export const LiveOverlay: React.FC<{ live: LiveInfo }> = ({ live }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const viewers = interpolate(frame, [0, durationInFrames], live.viewers, clamp);
  const comments = (live.comments ?? []).filter((c) => frame >= c.at * FPS);

  return (
    <AbsoluteFill style={{ fontFamily, pointerEvents: "none" }}>
      {/* degradé abajo para que se lean los comentarios */}
      <AbsoluteFill
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)" }}
      />

      {/* cabecera: avatar, usuario, EN VIVO, espectadores */}
      <Interactive.Div
        name="Cabecera"
        style={{ position: "absolute", top: 150, left: 50, right: 50, display: "flex", alignItems: "center", gap: 18 }}
      >
        <Img src={staticFile("claudia-avatar.png")} style={{ width: 92, height: 92, borderRadius: 46, border: "4px solid #ff3b6b" }} />
        <div style={{ color: "white", fontSize: 36, fontWeight: 900, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
          claudiasinpermiso
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ padding: "8px 20px", borderRadius: 12, background: "#ff3b6b", color: "white", fontSize: 32, fontWeight: 900 }}>
          EN VIVO
        </div>
        <div
          style={{
            padding: "8px 20px",
            borderRadius: 12,
            background: "rgba(0,0,0,0.45)",
            color: "white",
            fontSize: 32,
            fontWeight: 800,
            minWidth: 150,
            textAlign: "center",
          }}
        >
          👁 {fmt(viewers)}
        </div>
      </Interactive.Div>

      {/* pregunta destacada */}
      {live.pinned ? (
        <Interactive.Div
          name="Pregunta"
          style={{
            position: "absolute",
            top: 1060,
            left: 50,
            maxWidth: 760,
            padding: "22px 28px",
            borderRadius: 28,
            background: "white",
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            display: "flex",
            gap: 20,
            alignItems: "center",
            scale: interpolate(frame, [0, 8], [0.6, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
            transformOrigin: "left center",
            opacity: interpolate(frame, [0, 4], [0, 1], clamp),
          }}
        >
          <div style={{ width: 66, height: 66, borderRadius: 33, background: colorFor(live.pinned.u), flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#8a80a8" }}>{live.pinned.u} pregunta:</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: "#1d1a2e", lineHeight: 1.1 }}>{live.pinned.t}</div>
          </div>
        </Interactive.Div>
      ) : null}

      {/* comentarios (los últimos 4, abajo a la izquierda) */}
      <Interactive.Div
        name="Comentarios"
        style={{
          position: "absolute",
          left: 50,
          bottom: 330,
          width: 700,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 14,
        }}
      >
        {comments.slice(-4).map((c) => {
          const f = c.at * FPS;
          return (
            <div
              key={c.u + c.t}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                opacity: interpolate(frame, [f, f + 4], [0, 1], clamp),
                translate: interpolate(frame, [f, f + 8], ["0px 30px", "0px 0px"], { ...clamp, easing: out }),
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 28, background: colorFor(c.u), flexShrink: 0 }} />
              <div style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 28, fontWeight: 800 }}>{c.u}</div>
                <div style={{ color: "white", fontSize: 38, fontWeight: 900 }}>{c.t}</div>
              </div>
            </div>
          );
        })}
      </Interactive.Div>

      {/* corazones flotando a la derecha */}
      {new Array(10).fill(0).map((_, i) => {
        const period = 50;
        const t = ((frame + i * 13) % period) / period;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              right: 70 + Math.sin(i * 1.7 + t * 6) * 30,
              bottom: 420 + t * 520,
              fontSize: 54,
              opacity: t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85,
              scale: 0.7 + t * 0.6,
            }}
          >
            {["💗", "❤️", "💜", "🩷", "😂"][i % 5]}
          </div>
        );
      })}

      {(live.comments ?? []).map((c) => (
        <Sequence key={c.u + c.t} from={Math.round(c.at * FPS)} durationInFrames={10} layout="none">
          <Audio src={staticFile("sfx/click.wav")} volume={0.25} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** Texto "POV: ..." grande al inicio. */
export const PovTitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <Interactive.Div
        name="POV"
        style={{
          position: "absolute",
          top: 330,
          width: 900,
          padding: "22px 34px",
          borderRadius: 24,
          background: "white",
          color: "#111",
          fontFamily,
          fontWeight: 900,
          fontSize: 58,
          lineHeight: 1.1,
          textAlign: "center",
          opacity: interpolate(frame, [0, 3, 58, 64], [0, 1, 1, 0], clamp),
          scale: interpolate(frame, [0, 6], [0.9, 1], { ...clamp, easing: out }),
        }}
      >
        {text}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
