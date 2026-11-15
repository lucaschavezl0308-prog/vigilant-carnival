import React from 'react';
import {Composition, Folder, Still} from 'remotion';
import {fontsReady} from './brand';
import {Avatar, Banner} from './ChannelArt';
import {MANIFESTS} from './data';
import {Thumbnail} from './Thumbnail';
import {VideoComp} from './VideoComp';

// Asegura que las fuentes están cargadas antes de renderizar
void fontsReady;

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Videos">
      {MANIFESTS.map((m) => (
        <Composition
          key={m.id}
          id={`Video${m.id}`}
          component={VideoComp}
          durationInFrames={m.durationInFrames}
          fps={m.fps}
          width={1920}
          height={1080}
          defaultProps={{manifest: m, captions: true}}
        />
      ))}
    </Folder>
    <Folder name="Canal">
      <Still id="Banner" component={Banner} width={2560} height={1440} />
      <Still id="Avatar" component={Avatar} width={800} height={800} />
    </Folder>
    <Folder name="Miniaturas">
      {MANIFESTS.map((m) => (
        <Still key={m.id} id={`Miniatura${m.id}`} component={Thumbnail} width={1280} height={720} defaultProps={{t: m.thumbnail}} />
      ))}
    </Folder>
  </>
);
