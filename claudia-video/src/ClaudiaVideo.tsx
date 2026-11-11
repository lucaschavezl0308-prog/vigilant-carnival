import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  Series,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { SHOTS, Shot, shotFrames } from "./script";
import { Scene3D } from "./three/Scene3D";
import { EndCard, fontFamily, Subtitle, VentasScreen, WebsScreen } from "./ui/Ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Reloj en pantalla para la toma de apertura. */
const Clock: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="Reloj"
      style={{
        position: "absolute",
        top: 330,
        width: "100%",
        textAlign: "center",
        fontFamily,
        fontWeight: 900,
        fontSize: 84,
        color: "white",
        textShadow: "0 4px 18px rgba(0,0,0,0.8)",
        opacity: interpolate(frame, [6, 14], [0, 1], clamp),
        translate: interpolate(frame, [6, 18], ["0px 20px", "0px 0px"], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      5:47 a.m.
    </Interactive.Div>
  );
};

const ShotView: React.FC<{ shot: Shot; offset: number }> = ({ shot, offset }) => {
  const body = (() => {
    switch (shot.kind) {
      case "webs":
        return <WebsScreen />;
      case "ventas":
        return <VentasScreen />;
      case "end":
        return <EndCard />;
      default:
        return (
          <Scene3D
            kind={shot.kind}
            talk={shot.talk}
            globalOffset={offset}
            surprised={shot.id === "cinco"}
            hasCoffee={shot.id === "me-sirve"}
          />
        );
    }
  })();

  return (
    <AbsoluteFill>
      {body}
      {shot.kind === "wide" ? (
        <>
          <Clock />
          {[4, 9, 13, 19, 24, 31, 36, 41, 50, 55, 61, 66, 72, 78].map((f) => (
            <Sequence key={f} from={f} durationInFrames={4} layout="none">
              <Audio src={staticFile("sfx/click.wav")} volume={0.35} />
            </Sequence>
          ))}
        </>
      ) : null}
      {shot.line ? (
        <Sequence from={2} layout="absolute-fill">
          <Subtitle text={shot.line} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

export const ClaudiaVideo: React.FC = () => {
  let offset = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#08070f" }}>
      <Series>
        {SHOTS.map((shot) => {
          const start = offset;
          offset += shotFrames(shot);
          return (
            <Series.Sequence key={shot.id} name={shot.id} durationInFrames={shotFrames(shot)}>
              <ShotView shot={shot} offset={start} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
