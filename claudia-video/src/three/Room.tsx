import { useSmooth } from "./style";
import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { Mug } from "./Characters";

const Flat: React.FC<{ color: string; emissive?: string; ei?: number }> = ({
  color,
  emissive,
  ei = 0,
}) => (
  <meshStandardMaterial
    color={color}
    flatShading={!useSmooth()}
    roughness={0.9}
    emissive={emissive ?? "#000000"}
    emissiveIntensity={ei}
  />
);

/** Coloca la cámara en cada frame (todo guiado por useCurrentFrame). */
export const CameraRig: React.FC<{
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}> = ({ position, target, fov }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.fov = fov;
    camera.near = 0.02;
    camera.far = 60;
    camera.updateProjectionMatrix();
    camera.lookAt(...target);
  });
  return null;
};

// Números pseudoaleatorios deterministas (sin Math.random para no parpadear).
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const SKY_BANDS = [
  "#121a44",
  "#262c63",
  "#4b3b7a",
  "#8d5584",
  "#d7786c",
  "#f3a86a",
];

const Window: React.FC<{ frame: number }> = ({ frame }) => {
  const w = 1.7;
  const h = 1.25;
  const bandH = h / SKY_BANDS.length;
  // El amanecer avanza lentamente a lo largo del video.
  const dawn = Math.min(1, frame / 1200);
  return (
    <group position={[-0.15, 1.65, -1.19]}>
      {SKY_BANDS.map((c, i) => (
        <mesh key={c} position={[0, h / 2 - bandH * (i + 0.5), 0]}>
          <planeGeometry args={[w, bandH + 0.001]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
      {/* Sol asomándose */}
      <mesh position={[0.45, -h / 2 + 0.02 + dawn * 0.12, 0.003]}>
        <circleGeometry args={[0.16, 10]} />
        <meshBasicMaterial color="#ffd48a" toneMapped={false} />
      </mesh>
      {/* Estrellas */}
      {new Array(28).fill(0).map((_, i) => (
        <mesh
          key={i}
          position={[
            (rand(i) - 0.5) * w * 0.95,
            h / 2 - rand(i + 50) * h * 0.45,
            0.002,
          ]}
        >
          <circleGeometry args={[0.006 + rand(i + 9) * 0.006, 4]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={
              (0.4 + 0.6 * Math.abs(Math.sin(frame * 0.05 + i))) *
              (1 - dawn * 0.6)
            }
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Ciudad */}
      {new Array(11).fill(0).map((_, i) => {
        const bw = 0.12 + rand(i + 3) * 0.1;
        const bh = 0.15 + rand(i + 7) * 0.35;
        const x = -w / 2 + (i + 0.5) * (w / 11);
        return (
          <group key={i} position={[x, -h / 2 + bh / 2, 0.006]}>
            <mesh>
              <planeGeometry args={[bw, bh]} />
              <meshBasicMaterial color="#1a1530" toneMapped={false} />
            </mesh>
            {new Array(4).fill(0).map((__, j) =>
              rand(i * 10 + j) > 0.45 ? (
                <mesh
                  key={j}
                  position={[
                    (rand(j + i) - 0.5) * bw * 0.6,
                    (rand(j * 3 + i) - 0.3) * bh * 0.7,
                    0.001,
                  ]}
                >
                  <planeGeometry args={[0.018, 0.022]} />
                  <meshBasicMaterial color="#ffcf6b" toneMapped={false} />
                </mesh>
              ) : null,
            )}
          </group>
        );
      })}
      {/* Marco */}
      {[
        [0, h / 2 + 0.03, w + 0.12, 0.06],
        [0, -h / 2 - 0.03, w + 0.12, 0.06],
        [-w / 2 - 0.03, 0, 0.06, h],
        [w / 2 + 0.03, 0, 0.06, h],
        [0, 0, 0.04, h],
      ].map(([x, y, ww, hh], i) => (
        <mesh key={i} position={[x, y, 0.02]}>
          <boxGeometry args={[ww, hh, 0.05]} />
          <Flat color="#e9e2d6" />
        </mesh>
      ))}
    </group>
  );
};

/** Monitor de escritorio con pantalla brillante. */
const Monitor: React.FC<{ frame: number }> = ({ frame }) => (
  <group position={[-0.35, 0.86, -0.45]} rotation={[0, 0.25, 0]}>
    <mesh position={[0, 0.02, 0]}>
      <boxGeometry args={[0.25, 0.03, 0.18]} />
      <Flat color="#2b2b35" />
    </mesh>
    <mesh position={[0, 0.17, 0]}>
      <boxGeometry args={[0.05, 0.28, 0.05]} />
      <Flat color="#2b2b35" />
    </mesh>
    <mesh position={[0, 0.48, 0.02]}>
      <boxGeometry args={[0.9, 0.55, 0.05]} />
      <Flat color="#1e1e26" />
    </mesh>
    <mesh position={[0, 0.48, 0.046]}>
      <planeGeometry args={[0.84, 0.49]} />
      <meshBasicMaterial color="#2a3a6e" toneMapped={false} />
    </mesh>
    {/* líneas de "código" en la pantalla */}
    {new Array(8).fill(0).map((_, i) => (
      <mesh
        key={i}
        position={[-0.32 + (rand(i) * 0.12) / 2, 0.66 - i * 0.05, 0.048]}
      >
        <planeGeometry
          args={[
            0.12 +
              rand(i + 2) * 0.35 * Math.min(1, ((frame + i * 9) % 140) / 40),
            0.018,
          ]}
        />
        <meshBasicMaterial
          color={i % 3 === 0 ? "#ff8fbf" : "#8ee8ff"}
          toneMapped={false}
        />
      </mesh>
    ))}
    <pointLight
      position={[0, 0.5, 0.4]}
      intensity={1.6}
      distance={2.5}
      color="#7fb8ff"
    />
  </group>
);

const Plant: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => (
  <group position={position}>
    <mesh position={[0, 0.08, 0]}>
      <cylinderGeometry args={[0.09, 0.07, 0.16, 6]} />
      <Flat color="#b5583a" />
    </mesh>
    {new Array(7).fill(0).map((_, i) => (
      <mesh
        key={i}
        position={[Math.sin(i * 2.4) * 0.04, 0.3, Math.cos(i * 2.4) * 0.04]}
        rotation={[Math.cos(i * 2.4) * 0.35, 0, -Math.sin(i * 2.4) * 0.35]}
      >
        <coneGeometry args={[0.03, 0.34 + rand(i) * 0.12, 3]} />
        <Flat color={i % 2 ? "#3c7d4a" : "#4f9a5c"} />
      </mesh>
    ))}
  </group>
);

/** Habitación completa al amanecer. */
export const Room: React.FC<{
  frame: number;
  mugOnDesk?: boolean;
  mugX?: number;
  mugZ?: number;
  /** decoración navideña (luces, árbol) */
  xmas?: boolean;
}> = ({ frame, mugOnDesk = true, mugX = 0.75, mugZ = -0.25, xmas = false }) => {
  return (
    <group>
      {/* Luces */}
      <ambientLight intensity={xmas ? 0.22 : 0.35} color="#8a8fd0" />
      <hemisphereLight args={["#ffc9a0", "#20243f", xmas ? 0.3 : 0.45]} />
      {xmas ? <XmasDecor frame={frame} /> : null}
      <directionalLight
        position={[0.4, 2.2, -2.5]}
        intensity={1.1}
        color="#ffb48a"
      />
      <pointLight
        position={[1.4, 2.1, 1.2]}
        intensity={1.4}
        distance={5}
        color="#ffd9a8"
      />

      {/* Piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0, 0.8]}>
        <planeGeometry args={[6, 5]} />
        <Flat color="#5a4a5e" />
      </mesh>
      {/* Tapete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0.005, 1.1]}>
        <circleGeometry args={[0.9, 8]} />
        <Flat color="#7a5d8f" />
      </mesh>
      {/* Pared del fondo */}
      <mesh position={[0.6, 1.5, -1.22]}>
        <planeGeometry args={[6, 3]} />
        <Flat color="#3d3a63" />
      </mesh>
      {/* Pared frontal (detrás de Alejandro) */}
      <mesh position={[0.6, 1.5, 3.1]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[6, 3]} />
        <Flat color="#433e66" />
      </mesh>
      {/* Paredes laterales */}
      <mesh position={[-1.9, 1.5, 0.9]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[5, 3]} />
        <Flat color="#38355a" />
      </mesh>
      <mesh position={[3.1, 1.5, 0.9]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[5, 3]} />
        <Flat color="#38355a" />
      </mesh>

      {/* Detalles pared frontal: puerta, póster, repisa, lamparita */}
      <mesh position={[1.2, 1.0, 3.08]}>
        <boxGeometry args={[0.85, 2.0, 0.05]} />
        <Flat color="#6b4a3a" />
      </mesh>
      <mesh position={[0.9, 1.0, 3.04]}>
        <sphereGeometry args={[0.035, 6, 4]} />
        <Flat color="#d8b46a" />
      </mesh>
      <mesh position={[-0.35, 1.85, 3.08]}>
        <boxGeometry args={[0.6, 0.8, 0.02]} />
        <Flat color="#ff8fb5" emissive="#ff6fa6" ei={0.15} />
      </mesh>
      <mesh position={[-0.35, 1.85, 3.06]}>
        <circleGeometry args={[0.18, 6]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>
      <mesh position={[-0.35, 1.25, 3.0]}>
        <boxGeometry args={[0.9, 0.04, 0.2]} />
        <Flat color="#8a6a52" />
      </mesh>
      {[-0.65, -0.5, -0.38, -0.12].map((x, i) => (
        <mesh key={x} position={[x, 1.37, 3.0]}>
          <boxGeometry args={[0.08, 0.2 + i * 0.02, 0.15]} />
          <Flat color={["#e86a5c", "#5ca8e8", "#f0c05a", "#7ad38f"][i]} />
        </mesh>
      ))}
      <mesh position={[-1.3, 2.4, 2.9]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <pointLight
        position={[-1.3, 2.3, 2.7]}
        intensity={0.8}
        distance={2.5}
        color="#ffbf73"
      />

      <Window frame={frame} />

      {/* Escritorio */}
      <group>
        <mesh position={[0, 0.84, -0.55]}>
          <boxGeometry args={[1.9, 0.05, 0.9]} />
          <Flat color="#a8795a" />
        </mesh>
        {[
          [-0.88, -0.95],
          [0.88, -0.95],
          [-0.88, -0.15],
          [0.88, -0.15],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.41, z]}>
            <boxGeometry args={[0.06, 0.82, 0.06]} />
            <Flat color="#7d5a43" />
          </mesh>
        ))}
        {/* teclado */}
        <mesh position={[-0.25, 0.875, -0.22]} rotation={[0, 0.25, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.16]} />
          <Flat color="#e8e3f0" />
        </mesh>
      </group>
      <Monitor frame={frame} />
      <Plant position={[-0.8, 0.865, -0.8]} />
      {mugOnDesk ? (
        <group position={[mugX, 0.93, mugZ]}>
          <Mug steam={frame} />
        </group>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Navidad: guirnaldas de luces que titilan, árbol con estrella y regalos.
// ---------------------------------------------------------------------------
const XMAS_COLORS = ["#ff3b3b", "#2bd96b", "#ffd23f", "#3fa9ff", "#ff6fd8"];

/** ¿Está prendida la luz i en este frame? (patrón de titileo determinista) */
const lit = (frame: number, i: number) =>
  Math.sin(frame * 0.22 + i * 1.7) > -0.35;

const Garland: React.FC<{
  frame: number;
  from: [number, number, number];
  to: [number, number, number];
  count: number;
  sag?: number;
  seed?: number;
}> = ({ frame, from, to, count, sag = 0.12, seed = 0 }) => (
  <group>
    {new Array(count).fill(0).map((_, i) => {
      const t = i / (count - 1);
      const x = from[0] + (to[0] - from[0]) * t;
      const z = from[2] + (to[2] - from[2]) * t;
      // cae en ondas entre clavos
      const y =
        from[1] +
        (to[1] - from[1]) * t -
        Math.abs(Math.sin(t * Math.PI * 3)) * sag;
      const on = lit(frame, i + seed);
      const color = XMAS_COLORS[(i + seed) % XMAS_COLORS.length];
      return (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.022, 6, 4]} />
          <meshBasicMaterial
            color={on ? color : "#2a2433"}
            toneMapped={false}
          />
        </mesh>
      );
    })}
  </group>
);

const Tree: React.FC<{ frame: number; position: [number, number, number] }> = ({
  frame,
  position,
}) => (
  <group position={position}>
    <mesh position={[0, 0.12, 0]}>
      <cylinderGeometry args={[0.06, 0.07, 0.24, 6]} />
      <Flat color="#6b4a3a" />
    </mesh>
    {[
      [0.62, 0.55, 0.45],
      [0.5, 0.5, 0.85],
      [0.38, 0.45, 1.2],
      [0.24, 0.38, 1.5],
    ].map(([r, h, y], i) => (
      <mesh key={i} position={[0, y, 0]}>
        <coneGeometry args={[r, h, 7]} />
        <Flat color={i % 2 ? "#2f8a4c" : "#257a40"} />
      </mesh>
    ))}
    {/* esferas y lucecitas */}
    {new Array(22).fill(0).map((_, i) => {
      const y = 0.32 + (i / 22) * 1.25;
      const r = 0.6 * (1 - (y - 0.2) / 1.55) + 0.04;
      const a = i * 2.4;
      const on = lit(frame, i + 40);
      return (
        <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
          <sphereGeometry args={[i % 3 === 0 ? 0.045 : 0.025, 6, 4]} />
          {i % 3 === 0 ? (
            <Flat
              color={XMAS_COLORS[i % 5]}
              emissive={XMAS_COLORS[i % 5]}
              ei={0.35}
            />
          ) : (
            <meshBasicMaterial
              color={on ? XMAS_COLORS[i % 5] : "#2a2433"}
              toneMapped={false}
            />
          )}
        </mesh>
      );
    })}
    {/* estrella */}
    <mesh
      position={[0, 1.78, 0]}
      rotation={[0, 0, Math.PI / 5]}
      scale={1 + Math.sin(frame * 0.15) * 0.08}
    >
      <octahedronGeometry args={[0.1, 0]} />
      <meshBasicMaterial color="#ffd23f" toneMapped={false} />
    </mesh>
    <pointLight
      position={[0, 1.7, 0.2]}
      intensity={0.8}
      distance={1.6}
      color="#ffd23f"
    />
    {/* regalos */}
    {[
      [-0.35, 0.3, "#ff3b3b"],
      [0.32, 0.25, "#3fa9ff"],
      [0.05, 0.35, "#ff6fd8"],
    ].map(([x, z, c], i) => (
      <group
        key={i}
        position={[x as number, 0.1, z as number]}
        rotation={[0, i * 0.6, 0]}
      >
        <mesh>
          <boxGeometry args={[0.22, 0.2, 0.22]} />
          <Flat color={c as string} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.05, 0.205, 0.225]} />
          <Flat color="#ffd23f" />
        </mesh>
      </group>
    ))}
  </group>
);

export const XmasDecor: React.FC<{ frame: number }> = ({ frame }) => {
  // luces de color que tiñen la habitación al ritmo del titileo
  const pulse = (i: number) => (lit(frame, i) ? 1 : 0.35);
  return (
    <group>
      {/* sobre la ventana y la pared del fondo */}
      <Garland
        frame={frame}
        from={[-1.1, 2.38, -1.15]}
        to={[0.85, 2.38, -1.15]}
        count={26}
      />
      {/* alrededor del marco de la ventana */}
      <Garland
        frame={frame}
        from={[-1.0, 1.0, -1.14]}
        to={[-1.0, 2.25, -1.14]}
        count={10}
        sag={0.0}
        seed={3}
      />
      <Garland
        frame={frame}
        from={[0.7, 1.0, -1.14]}
        to={[0.7, 2.25, -1.14]}
        count={10}
        sag={0.0}
        seed={7}
      />
      {/* pared frontal (detrás de Alejandro) */}
      <Garland
        frame={frame}
        from={[-1.7, 2.35, 3.05]}
        to={[1.9, 2.35, 3.05]}
        count={34}
        sag={0.16}
        seed={11}
      />
      <Garland
        frame={frame}
        from={[-1.7, 1.75, 3.05]}
        to={[0.3, 1.75, 3.05]}
        count={18}
        sag={0.1}
        seed={5}
      />
      {/* escritorio */}
      <Garland
        frame={frame}
        from={[-0.95, 0.89, -0.1]}
        to={[0.95, 0.89, -0.1]}
        count={18}
        sag={0.05}
        seed={2}
      />
      <Tree frame={frame} position={[1.45, 0, -0.75]} />
      <pointLight
        position={[-0.5, 2.1, -0.8]}
        intensity={1.3 * pulse(1)}
        distance={3}
        color="#ff3b3b"
      />
      <pointLight
        position={[0.6, 2.1, -0.8]}
        intensity={1.3 * pulse(4)}
        distance={3}
        color="#2bd96b"
      />
      <pointLight
        position={[0, 2.1, 2.6]}
        intensity={1.6 * pulse(2)}
        distance={3}
        color="#ff6fd8"
      />
      <pointLight
        position={[1.2, 2.0, 2.6]}
        intensity={1.2 * pulse(6)}
        distance={3}
        color="#3fa9ff"
      />
    </group>
  );
};
