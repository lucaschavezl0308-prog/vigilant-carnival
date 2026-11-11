import React from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Nunito (fuente variable, incluida en public/fonts para render sin internet).
export const fontFamily = "Nunito";
loadFont({
  family: fontFamily,
  url: staticFile("fonts/Nunito-latin.woff2"),
  weight: "200 1000",
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = Easing.bezier(0.34, 1.56, 0.64, 1);

// ---------------------------------------------------------------------------
// Subtítulo estilo TikTok
// ---------------------------------------------------------------------------
export const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <Interactive.Div
        name="Subtitulo"
        style={{
          position: "absolute",
          top: 330,
          width: 900,
          textAlign: "center",
          fontFamily,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.2,
          color: "white",
          textShadow:
            "0 0 6px rgba(0,0,0,0.9), 0 3px 0 rgba(0,0,0,0.85), 0 -2px 0 rgba(0,0,0,0.6), 2px 0 0 rgba(0,0,0,0.6), -2px 0 0 rgba(0,0,0,0.6)",
          opacity: interpolate(frame, [0, 4], [0, 1], clamp),
          translate: interpolate(frame, [0, 6], ["0px 12px", "0px 0px"], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {text}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Fondo nocturno compartido para las pantallas 2D
// ---------------------------------------------------------------------------
export const NightBg: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 35%, #2b2a6b 0%, #14122e 55%, #08070f 100%)",
      }}
    >
      {new Array(40).fill(0).map((_, i) => {
        const x = (Math.sin(i * 91.3) * 0.5 + 0.5) * 1080;
        const y = (Math.sin(i * 47.7 + 3) * 0.5 + 0.5) * 1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 4,
              height: 4,
              borderRadius: 2,
              background: "white",
              opacity: 0.25 + 0.5 * Math.abs(Math.sin(frame * 0.06 + i)),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Pantalla: las 5 webs que hizo Claudia en la madrugada
// ---------------------------------------------------------------------------
const WEBS = [
  { name: "Panadería Doña Rosa", hora: "1:04 a.m.", c1: "#f6b26b", c2: "#8a4b2a" },
  { name: "Taller El Güero", hora: "1:52 a.m.", c1: "#5ca8e8", c2: "#1d3557" },
  { name: "Sonrisas Dental", hora: "2:37 a.m.", c1: "#7ad3c4", c2: "#ffffff" },
  { name: "Fuerza Gym", hora: "3:21 a.m.", c1: "#ff5c5c", c2: "#1a1a1a" },
  { name: "Flores Lupita", hora: "4:08 a.m.", c1: "#ff8fbf", c2: "#5a2a4a" },
];

export const WebsScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 10;
  const gap = 14;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <NightBg />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Interactive.Div
          name="Monitor"
          style={{
            width: 900,
            borderRadius: 36,
            background: "#f7f5fb",
            boxShadow: "0 0 120px rgba(126,184,255,0.45), 0 30px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
            marginTop: 220,
            scale: interpolate(frame, [0, 10], [0.92, 1], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: "perceptual-scale",
            }),
            opacity: interpolate(frame, [0, 6], [0, 1], clamp),
          }}
        >
          {/* barra del navegador */}
          <div
            style={{
              height: 84,
              background: "#2a2140",
              display: "flex",
              alignItems: "center",
              padding: "0 32px",
              gap: 14,
            }}
          >
            {["#ff6b6b", "#ffd166", "#06d6a0"].map((c) => (
              <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />
            ))}
            <div
              style={{
                marginLeft: 18,
                flex: 1,
                height: 46,
                borderRadius: 23,
                background: "#3d3260",
                color: "#cfc6ee",
                fontSize: 26,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                padding: "0 24px",
              }}
            >
              claudia.studio/mis-webs
            </div>
          </div>

          <div style={{ padding: "34px 40px 44px" }}>
            <div style={{ fontSize: 46, fontWeight: 900, color: "#2a2140" }}>
              Hecho esta madrugada
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#8a80a8", marginTop: 4, marginBottom: 26 }}>
              por Claudia · sin permiso
            </div>

            {WEBS.map((w, i) => {
              const f = start + i * gap;
              return (
                <div
                  key={w.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    padding: 18,
                    marginBottom: 16,
                    borderRadius: 24,
                    background: "white",
                    boxShadow: "0 6px 18px rgba(42,33,64,0.12)",
                    opacity: interpolate(frame, [f, f + 5], [0, 1], clamp),
                    translate: interpolate(frame, [f, f + 10], ["60px 0px", "0px 0px"], {
                      ...clamp,
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    }),
                  }}
                >
                  {/* miniatura de la web */}
                  <div
                    style={{
                      width: 150,
                      height: 100,
                      borderRadius: 14,
                      background: `linear-gradient(160deg, ${w.c1}, ${w.c2})`,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ width: "70%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.9)" }} />
                    <div style={{ width: "45%", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.6)" }} />
                    <div style={{ marginTop: "auto", width: 56, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.95)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: "#2a2140" }}>{w.name}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: "#8a80a8" }}>{w.hora}</div>
                  </div>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      background: "#06d6a0",
                      color: "white",
                      fontSize: 40,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      scale: interpolate(frame, [f + 6, f + 14], [0, 1], { ...clamp, easing: pop }),
                    }}
                  >
                    ✓
                  </div>
                </div>
              );
            })}
          </div>
        </Interactive.Div>
      </AbsoluteFill>
      {WEBS.map((w, i) => (
        <Sequence key={w.name} from={start + i * gap + 6} durationInFrames={Math.round(0.5 * fps)} layout="none">
          <Audio src={staticFile("sfx/pop.wav")} volume={0.6} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Pantalla: ventas — celular con notificaciones y contador
// ---------------------------------------------------------------------------
const VENTAS = [
  { cliente: "Panadería Doña Rosa", monto: 450 },
  { cliente: "Taller El Güero", monto: 520 },
  { cliente: "Sonrisas Dental", monto: 600 },
  { cliente: "Fuerza Gym", monto: 480 },
  { cliente: "Flores Lupita", monto: 400 },
];
const TOTAL = VENTAS.reduce((a, v) => a + v.monto, 0);

export const VentasScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = 12;
  const gap = 16;
  // monto acumulado según cuántas notificaciones van
  const shown = VENTAS.filter((_, i) => frame >= start + i * gap).length;
  const target = VENTAS.slice(0, shown).reduce((a, v) => a + v.monto, 0);
  const prev = VENTAS.slice(0, Math.max(0, shown - 1)).reduce((a, v) => a + v.monto, 0);
  const lastF = start + (shown - 1) * gap;
  const total = Math.round(
    shown === 0 ? 0 : interpolate(frame, [lastF, lastF + 10], [prev, target], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
  );
  const done = frame >= start + VENTAS.length * gap + 6;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <NightBg />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Interactive.Div
          name="Celular"
          style={{
            width: 640,
            height: 1240,
            marginTop: 140,
            borderRadius: 80,
            background: "#111018",
            border: "14px solid #2c2a38",
            boxShadow: "0 0 140px rgba(6,214,160,0.3), 0 40px 90px rgba(0,0,0,0.7)",
            padding: "70px 34px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            translate: interpolate(frame, [0, 12], ["0px 200px", "0px 0px"], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <div style={{ color: "#c9c4dc", fontSize: 30, fontWeight: 700, textAlign: "center" }}>
            Ventas de esta madrugada
          </div>
          <div
            style={{
              color: "#06d6a0",
              fontSize: 120,
              fontWeight: 900,
              textAlign: "center",
              lineHeight: 1,
              marginBottom: 20,
              scale: interpolate(frame, [lastF, lastF + 4, lastF + 10], [1, 1.08, 1], clamp),
            }}
          >
            ${total.toLocaleString("en-US")}
          </div>

          {VENTAS.map((v, i) => {
            const f = start + i * gap;
            return (
              <div
                key={v.cliente}
                style={{
                  borderRadius: 30,
                  background: "rgba(255,255,255,0.1)",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: interpolate(frame, [f, f + 4], [0, 1], clamp),
                  translate: interpolate(frame, [f, f + 10], ["0px -40px", "0px 0px"], {
                    ...clamp,
                    easing: Easing.bezier(0.16, 1, 0.3, 1),
                  }),
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: "#06d6a0",
                    color: "#0b2b22",
                    fontSize: 40,
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  $
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "white", fontSize: 30, fontWeight: 800 }}>Pago recibido</div>
                  <div style={{ color: "#a9a3c0", fontSize: 24, fontWeight: 700 }}>{v.cliente}</div>
                </div>
                <div style={{ color: "#06d6a0", fontSize: 36, fontWeight: 900 }}>+${v.monto}</div>
              </div>
            );
          })}

          <div
            style={{
              marginTop: "auto",
              textAlign: "center",
              color: "#ff8fbf",
              fontSize: 30,
              fontWeight: 800,
              opacity: done ? 1 : 0,
            }}
          >
            + 42 notificaciones más
          </div>
        </Interactive.Div>
      </AbsoluteFill>
      {VENTAS.map((v, i) => (
        <Sequence key={v.cliente} from={start + i * gap} durationInFrames={Math.round(0.7 * fps)} layout="none">
          <Audio src={staticFile("sfx/ding.wav")} volume={0.45} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const VENTAS_TOTAL = TOTAL;

// ---------------------------------------------------------------------------
// Cierre
// ---------------------------------------------------------------------------
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily, alignItems: "center", justifyContent: "center" }}>
      <NightBg />
      <Interactive.Div
        name="Titulo"
        style={{
          position: "absolute",
          top: 760,
          width: 920,
          textAlign: "center",
          color: "white",
          fontSize: 96,
          fontWeight: 900,
          lineHeight: 1.05,
          scale: interpolate(frame, [0, 12], [0.8, 1], { ...clamp, easing: pop, output: "perceptual-scale" }),
          opacity: interpolate(frame, [0, 6], [0, 1], clamp),
        }}
      >
        Claudia
        <br />
        <span style={{ color: "#ff8fbf" }}>nunca duerme.</span>
      </Interactive.Div>
      <Interactive.Div
        name="Usuario"
        style={{
          position: "absolute",
          top: 1060,
          padding: "16px 40px",
          borderRadius: 50,
          background: "rgba(255,255,255,0.12)",
          color: "#7cf4ff",
          fontSize: 48,
          fontWeight: 800,
          opacity: interpolate(frame, [12, 20], [0, 1], clamp),
        }}
      >
        @claudiasinpermiso
      </Interactive.Div>
    </AbsoluteFill>
  );
};
