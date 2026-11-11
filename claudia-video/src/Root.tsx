import React from "react";
import { Composition, Still } from "remotion";
import { ClaudiaVideo } from "./ClaudiaVideo";
import { ProfilePic } from "./ProfilePic";
import { FPS, TOTAL_FRAMES } from "./script";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClaudiaMadrugada"
        component={ClaudiaVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Still id="FotoPerfil" component={ProfilePic} width={1080} height={1080} />
    </>
  );
};
