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
import { FPS, VOICE_START, type Word } from "../script";
import { fontFamily, NightBg } from "./Ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);
const pop = Easing.bezier(0.34, 1.56, 0.64, 1);

/** Marco de monitor de PC: lo que "mira" Alejandro. */
const Monitor: React.FC<{ children: React.ReactNode; glow?: string }> = ({ children, glow = "rgba(126,184,255,0.4)" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily }}>
      <Interactive.Div
        name="Monitor"
        style={{
          marginTop: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          scale: interpolate(frame, [0, 12], [1.12, 1], { ...clamp, easing: out, output: "perceptual-scale" }),
        }}
      >
        <div
          style={{
            width: 960,
            height: 720,
            borderRadius: 30,
            background: "#1e1e26",
            padding: 22,
            boxShadow: `0 0 160px ${glow}, 0 30px 80px rgba(0,0,0,0.7)`,
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: 14, overflow: "hidden", position: "relative" }}>
            {children}
          </div>
        </div>
        <div style={{ width: 90, height: 120, background: "#2b2b35" }} />
        <div style={{ width: 320, height: 22, borderRadius: 11, background: "#2b2b35" }} />
      </Interactive.Div>
    </AbsoluteFill>
  );
};

const money = (n: number) => `US$ ${Math.round(n).toLocaleString("es-AR")}`;

// ---------------------------------------------------------------------------
// Saldo de 5 mil dólares
// ---------------------------------------------------------------------------
export const PcSaldoScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const saldo = interpolate(frame, [8, 34], [37, 5000], { ...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1) });
  return (
    <AbsoluteFill>
      <NightBg />
      <Monitor glow="rgba(6,214,160,0.45)">
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #0f2b26, #0b1a24)", padding: "48px 56px" }}>
          <div style={{ color: "#7fd6bf", fontSize: 34, fontWeight: 800 }}>Mi banco · Cuenta de Alejandro</div>
          <div style={{ color: "#a9c9c0", fontSize: 32, fontWeight: 700, marginTop: 60 }}>Saldo disponible</div>
          <div
            style={{
              color: "#06d6a0",
              fontSize: 150,
              fontWeight: 900,
              lineHeight: 1.05,
              scale: interpolate(frame, [34, 38, 44], [1, 1.07, 1], clamp),
              transformOrigin: "left center",
            }}
          >
            {money(saldo)}
          </div>
          <div style={{ color: "#a9c9c0", fontSize: 30, fontWeight: 700, marginTop: 40, opacity: interpolate(frame, [36, 42], [0, 1], clamp) }}>
            Ayer: US$ 37 · <span style={{ color: "#ff8fbf" }}>3 depósitos esta madrugada</span>
          </div>
        </div>
      </Monitor>
      <Sequence from={34} durationInFrames={25} layout="none">
        <Audio src={staticFile("sfx/ding.wav")} volume={0.45} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Lo que vendió Claudia (el sello cae cuando ella nombra cada cosa)
// ---------------------------------------------------------------------------
const ITEMS = [
  { key: "play", nombre: "Play 4 chipeada", precio: 900, color: "#3fa9ff" },
  { key: "televisor", nombre: 'Televisor 65"', precio: 2300, color: "#ffd23f" },
  { key: "sill", nombre: "Sillón de 3 cuerpos", precio: 1800, color: "#ff8fbf" },
];

/** frame (dentro de la toma) en que se dice la palabra que empieza con `key` */
const wordFrame = (words: Word[], key: string, fallback: number) => {
  const w = words.find((x) => x.w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").startsWith(key));
  return w ? Math.round(w.s * FPS) + VOICE_START : fallback;
};

const Icon: React.FC<{ k: string; color: string }> = ({ k, color }) => {
  const base: React.CSSProperties = { position: "absolute", background: color };
  return (
    <div style={{ width: 150, height: 110, position: "relative", flexShrink: 0 }}>
      {k === "play" ? (
        <>
          <div style={{ ...base, left: 10, top: 30, width: 130, height: 60, borderRadius: 30 }} />
          <div style={{ position: "absolute", left: 32, top: 50, width: 22, height: 22, borderRadius: 11, background: "#1d1a2e" }} />
          <div style={{ position: "absolute", left: 96, top: 50, width: 22, height: 22, borderRadius: 11, background: "#1d1a2e" }} />
        </>
      ) : k === "televisor" ? (
        <>
          <div style={{ ...base, left: 5, top: 5, width: 140, height: 85, borderRadius: 8 }} />
          <div style={{ position: "absolute", left: 15, top: 15, width: 120, height: 65, borderRadius: 4, background: "#1d1a2e" }} />
          <div style={{ ...base, left: 60, top: 92, width: 30, height: 14 }} />
        </>
      ) : (
        <>
          <div style={{ ...base, left: 10, top: 45, width: 130, height: 45, borderRadius: 12 }} />
          <div style={{ ...base, left: 20, top: 15, width: 110, height: 40, borderRadius: 12, opacity: 0.8 }} />
          <div style={{ ...base, left: 0, top: 35, width: 26, height: 55, borderRadius: 10 }} />
          <div style={{ ...base, left: 124, top: 35, width: 26, height: 55, borderRadius: 10 }} />
        </>
      )}
    </div>
  );
};

export const VendidosScreen: React.FC<{ words: Word[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const stamps = ITEMS.map((it, i) => wordFrame(words, it.key, 12 + i * 14));
  return (
    <AbsoluteFill>
      <NightBg />
      <Monitor glow="rgba(255,111,166,0.4)">
        <div style={{ position: "absolute", inset: 0, background: "#f7f5fb", padding: "40px 46px" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#ff6fa6", letterSpacing: 3 }}>MERCADO DE USADOS · VENDEDORA: CLAUDIA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 26 }}>
            {ITEMS.map((it, i) => {
              const f = stamps[i];
              return (
                <div
                  key={it.key}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 26,
                    padding: "16px 22px",
                    borderRadius: 24,
                    background: "white",
                    boxShadow: "0 6px 18px rgba(42,33,64,0.12)",
                    opacity: interpolate(frame, [i * 4, i * 4 + 6], [0, 1], clamp),
                  }}
                >
                  <Icon k={it.key} color={it.color} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: "#2a2140" }}>{it.nombre}</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: "#8a80a8" }}>de Alejandro</div>
                  </div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: "#06a77d" }}>{money(it.precio)}</div>
                  <div
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 30,
                      padding: "4px 22px",
                      border: "7px solid #e3262f",
                      borderRadius: 14,
                      color: "#e3262f",
                      fontSize: 44,
                      fontWeight: 900,
                      background: "rgba(255,255,255,0.85)",
                      rotate: "-10deg",
                      opacity: interpolate(frame, [f, f + 2], [0, 1], clamp),
                      scale: interpolate(frame, [f, f + 6], [2.4, 1], { ...clamp, easing: out }),
                    }}
                  >
                    VENDIDO
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Monitor>
      {stamps.map((f, i) => (
        <Sequence key={i} from={f} durationInFrames={20} layout="none">
          <Audio src={staticFile("sfx/pop.wav")} volume={0.7} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// La empresa nueva
// ---------------------------------------------------------------------------
export const EmpresaScreen: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <NightBg />
      <Monitor glow="rgba(124,244,255,0.45)">
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 30%, #3b2a7a, #120f26)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 40,
              background: "linear-gradient(135deg, #ff8fbf, #7cf4ff)",
              color: "#120f26",
              fontSize: 76,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scale: interpolate(frame, [4, 14], [0, 1], { ...clamp, easing: pop }),
            }}
          >
            A&C
          </div>
          <div style={{ color: "white", fontSize: 76, fontWeight: 900, opacity: interpolate(frame, [10, 16], [0, 1], clamp) }}>
            Ale &amp; Claudia
          </div>
          <div style={{ color: "#7cf4ff", fontSize: 40, fontWeight: 800, opacity: interpolate(frame, [14, 20], [0, 1], clamp) }}>
            Agencia digital · Fundada hoy
          </div>
          <div
            style={{
              marginTop: 26,
              padding: "16px 34px",
              borderRadius: 40,
              background: "#ff3b6b",
              color: "white",
              fontSize: 38,
              fontWeight: 900,
              opacity: interpolate(frame, [22, 27], [0, 1], clamp),
              translate: interpolate(frame, [22, 30], ["0px 30px", "0px 0px"], { ...clamp, easing: out }),
            }}
          >
            Primera reunión: hoy 7:00 a.m.
          </div>
        </div>
      </Monitor>
      <Sequence from={4} durationInFrames={20} layout="none">
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
