import React from "react";
import { Composition, Still } from "remotion";
import { EP1 } from "./episodes/ep1";
import { EP2 } from "./episodes/ep2";
import { EpisodeVideo } from "./Episode";
import { ProfilePic } from "./ProfilePic";
import { episodeFrames, FPS } from "./script";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ClaudiaMadrugada"
        component={EpisodeVideo}
        defaultProps={{ ep: EP1 }}
        durationInFrames={episodeFrames(EP1)}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ClaudiaEp2"
        component={EpisodeVideo}
        defaultProps={{ ep: EP2 }}
        durationInFrames={episodeFrames(EP2)}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Still id="FotoPerfil" component={ProfilePic} width={1080} height={1080} />
    </>
  );
};
