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
import { shotFrames, VOICE_START, voiceInfo, type Episode, type Shot } from "./script";
import { Scene3D } from "./three/Scene3D";
import { EndCard, fontFamily, Subtitle, VentasScreen, WebsScreen } from "./ui/Ui";
import { EndCard2, EpisodeBadge, MercadoScreen, SeguidoresScreen, WordCaptions } from "./ui/Ep2Ui";
import { ComprasScreen } from "./ui/NavidadUi";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Reloj en pantalla para la toma de apertura del episodio 1. */
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

const UI_KINDS = new Set(["webs", "ventas", "mercado", "seguidores", "end", "end2", "compras"]);

const ShotView: React.FC<{ ep: Episode; shot: Shot; offset: number }> = ({ ep, shot, offset }) => {
  const voice = voiceInfo(ep.id, shot.id);
  const body = (() => {
    switch (shot.kind) {
      case "webs":
        return <WebsScreen />;
      case "ventas":
        return <VentasScreen />;
      case "mercado":
        return <MercadoScreen />;
      case "seguidores":
        return <SeguidoresScreen />;
      case "end":
        return <EndCard />;
      case "end2":
        return <EndCard2 />;
      case "compras":
        return <ComprasScreen />;
      default:
        return <Scene3D ep={ep} shot={shot} globalOffset={offset} />;
    }
  })();

  return (
    <AbsoluteFill>
      {body}
      {shot.kind === "wide" && ep.id === "ep1" ? (
        <>
          <Clock />
          {[4, 9, 13, 19, 24, 31, 36, 41, 50, 55, 61, 66, 72, 78].map((f) => (
            <Sequence key={f} from={f} durationInFrames={4} layout="none">
              <Audio src={staticFile("sfx/click.wav")} volume={0.35} />
            </Sequence>
          ))}
        </>
      ) : null}
      {shot.sfx ? (
        <Sequence durationInFrames={40} layout="none" name={`sfx-${shot.sfx}`}>
          <Audio src={staticFile(`sfx/${shot.sfx}.wav`)} volume={shot.sfx === "boom" ? 0.55 : 0.5} />
        </Sequence>
      ) : null}
      {voice ? (
        <Sequence from={VOICE_START} layout="none" name={`voz-${shot.id}`}>
          <Audio src={staticFile(`voz/${ep.id}/${shot.id}.mp3`)} volume={1} />
        </Sequence>
      ) : null}
      {shot.line ? (
        ep.wordCaptions && voice ? (
          <WordCaptions words={voice.words} top={UI_KINDS.has(shot.kind) ? 250 : 1210} />
        ) : (
          <Sequence from={2} layout="absolute-fill">
            <Subtitle text={shot.line} />
          </Sequence>
        )
      ) : null}
    </AbsoluteFill>
  );
};

export const EpisodeVideo: React.FC<{ ep: Episode }> = ({ ep }) => {
  let offset = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#08070f" }}>
      <Series>
        {ep.shots.map((shot) => {
          const start = offset;
          offset += shotFrames(ep, shot);
          return (
            <Series.Sequence key={shot.id} name={shot.id} durationInFrames={shotFrames(ep, shot)}>
              <ShotView ep={ep} shot={shot} offset={start} />
            </Series.Sequence>
          );
        })}
      </Series>
      {ep.number ? <EpisodeBadge n={ep.number} /> : null}
    </AbsoluteFill>
  );
};
