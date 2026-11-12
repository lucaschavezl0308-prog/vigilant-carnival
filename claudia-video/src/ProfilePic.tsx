import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Claudia } from "./three/Characters";
import { CameraRig } from "./three/Room";

/** Foto de perfil para @claudiasinpermiso (imagen fija cuadrada). */
export const ProfilePic: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 42%, #ffb3d1 0%, #c77dff 48%, #3a1d6e 100%)",
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraRig position={[0.02, 0.66, 1.75]} target={[0, 0.64, 0]} fov={34} />
        <ambientLight intensity={0.55} color="#ffe6f2" />
        <hemisphereLight args={["#ffffff", "#7a4fb0", 0.6]} />
        <directionalLight position={[1.2, 1.6, 2]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-1.5, 0.6, -0.5]} intensity={0.8} color="#7cf4ff" />
        {/* frame=20 → ojos abiertos (fuera del parpadeo) */}
        <Claudia frame={20} talking={false} rotationY={-0.18} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
