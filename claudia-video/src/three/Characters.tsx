import React from "react";
import { RoundedBox } from "@react-three/drei";
import { useSeg, useSmooth } from "./style";

// Materiales low-poly (flatShading da el look facetado).
const Flat: React.FC<{ color: string; emissive?: string; ei?: number }> = ({
  color,
  emissive,
  ei = 0,
}) => {
  const smooth = useSmooth();
  return (
    <meshStandardMaterial
      color={color}
      flatShading={!smooth}
      roughness={smooth ? 0.55 : 0.85}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={ei}
    />
  );
};

const Glow: React.FC<{ color: string }> = ({ color }) => (
  <meshBasicMaterial color={color} toneMapped={false} />
);

/** Apertura de boca 0..1 a partir del frame (aleteo tipo marioneta). */
export const mouthOpen = (frame: number, talking: boolean) => {
  if (!talking) return 0;
  const v =
    Math.abs(Math.sin(frame * 0.55)) * 0.7 +
    Math.abs(Math.sin(frame * 0.23 + 1.3)) * 0.3;
  return Math.min(1, v);
};

/** Parpadeo: devuelve escala Y de los ojos. */
export const blink = (frame: number, offset = 0) => {
  const t = (frame + offset) % 95;
  return t < 3 ? 0.12 : 1;
};

// ---------------------------------------------------------------------------
// ALEJANDRO — recién despertado: pelo de almohada, ojeras, sudadera verde.
// Mira hacia +z en su espacio local.
// ---------------------------------------------------------------------------
const AlejandroLowPoly: React.FC<{
  frame: number;
  talking: boolean;
  sleepy?: number; // 0 = ojos abiertos, 1 = muy dormido
  surprised?: number; // 0..1, abre ojos y cejas
  sad?: number; // 0..1, cejas caídas y lágrimas
  holdingMug?: boolean;
  /** volumen de la voz 0..1 (sincroniza la boca); si falta, aleteo genérico */
  mouthLevel?: number;
  position?: [number, number, number];
  rotationY?: number;
}> = ({
  frame,
  talking,
  mouthLevel,
  sleepy = 0.55,
  surprised = 0,
  sad = 0,
  holdingMug = false,
  position = [0, 0, 0],
  rotationY = 0,
}) => {
  const skin = "#d9a377";
  const mouth = mouthLevel ?? mouthOpen(frame, talking);
  const lid = Math.max(0, sleepy - surprised * 0.9); // párpado caído
  const breathe = Math.sin(frame * 0.08) * 0.01;
  const headTilt =
    Math.sin(frame * 0.05) * 0.03 +
    (talking ? Math.sin(frame * 0.3) * 0.02 : 0);
  const eyeScale = blink(frame, 17) * (1 + surprised * 0.25);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Piernas */}
      <mesh position={[-0.13, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.22]} />
        <Flat color="#2d3a52" />
      </mesh>
      <mesh position={[0.13, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.22]} />
        <Flat color="#2d3a52" />
      </mesh>
      {/* Torso: sudadera */}
      <group position={[0, 1.08 + breathe, 0]}>
        <mesh>
          <boxGeometry args={[0.72, 0.78, 0.42]} />
          <Flat color="#3f8f6b" />
        </mesh>
        {/* bolsillo canguro */}
        <mesh position={[0, -0.2, 0.215]}>
          <boxGeometry args={[0.4, 0.18, 0.02]} />
          <Flat color="#357a5b" />
        </mesh>
        {/* cordones */}
        <mesh position={[-0.08, 0.18, 0.22]}>
          <boxGeometry args={[0.025, 0.22, 0.02]} />
          <Flat color="#eeeeee" />
        </mesh>
        <mesh position={[0.08, 0.18, 0.22]}>
          <boxGeometry args={[0.025, 0.22, 0.02]} />
          <Flat color="#eeeeee" />
        </mesh>
        {/* capucha */}
        <mesh position={[0, 0.38, -0.14]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.56, 0.18, 0.24]} />
          <Flat color="#357a5b" />
        </mesh>
        {/* brazos */}
        <mesh position={[-0.44, -0.02, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.17, 0.72, 0.2]} />
          <Flat color="#3f8f6b" />
        </mesh>
        <group
          position={[0.44, 0.3, 0]}
          rotation={[holdingMug ? -0.9 : 0, 0, holdingMug ? 0.35 : -0.08]}
        >
          <mesh position={[0, -0.34, 0]}>
            <boxGeometry args={[0.17, 0.72, 0.2]} />
            <Flat color="#3f8f6b" />
          </mesh>
        </group>
      </group>

      {/* Taza de café en la mano, frente al pecho */}
      {holdingMug ? (
        <group position={[0.24, 1.2, 0.32]} scale={1.1}>
          <Mug steam={frame} />
        </group>
      ) : null}

      {/* Cuello */}
      <mesh position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.12, 6]} />
        <Flat color={skin} />
      </mesh>

      {/* Cabeza */}
      <group
        position={[0, 1.78 + breathe, 0]}
        rotation={[headTilt, 0, headTilt * 0.6]}
      >
        <mesh scale={[1, 1.12, 0.95]}>
          <icosahedronGeometry args={[0.3, 1]} />
          <Flat color={skin} />
        </mesh>
        {/* orejas */}
        <mesh position={[-0.29, 0, 0]} scale={[0.5, 1, 0.8]}>
          <icosahedronGeometry args={[0.07, 0]} />
          <Flat color={skin} />
        </mesh>
        <mesh position={[0.29, 0, 0]} scale={[0.5, 1, 0.8]}>
          <icosahedronGeometry args={[0.07, 0]} />
          <Flat color={skin} />
        </mesh>
        {/* nariz */}
        <mesh position={[0, -0.03, 0.29]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.045, 0.1, 4]} />
          <Flat color="#c98f63" />
        </mesh>

        {/* Ojos */}
        {[-0.11, 0.11].map((x) => (
          <group key={x} position={[x, 0.06, 0.255]}>
            <mesh scale={[1, eyeScale, 1]}>
              <sphereGeometry args={[0.058, 8, 6]} />
              <meshStandardMaterial color="#f7f3ee" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.005, 0.045]} scale={[1, eyeScale, 1]}>
              <sphereGeometry args={[0.03, 8, 6]} />
              <meshStandardMaterial color="#2a1a10" roughness={0.2} />
            </mesh>
            <mesh position={[0.012, 0.012, 0.072]}>
              <sphereGeometry args={[0.008, 6, 4]} />
              <Glow color="#ffffff" />
            </mesh>
            {/* párpado superior (sueño) */}
            <mesh
              position={[0, 0.06 - lid * 0.055, 0.02]}
              scale={[1, 0.5 + lid * 0.6, 1]}
            >
              <boxGeometry args={[0.13, 0.07, 0.09]} />
              <Flat color="#cf9a6e" />
            </mesh>
            {/* ojeras */}
            <mesh position={[0, -0.07, 0.03]}>
              <boxGeometry args={[0.1, 0.018, 0.04]} />
              <Flat color="#a8735a" />
            </mesh>
            {/* lágrima */}
            {sad > 0.5 ? (
              <mesh
                position={[
                  x < 0 ? -0.02 : 0.02,
                  -0.09 - ((frame * 0.004) % 0.12),
                  0.05,
                ]}
                scale={[0.8, 1.2, 0.8]}
              >
                <sphereGeometry args={[0.018, 6, 4]} />
                <meshStandardMaterial
                  color="#8fd8ff"
                  emissive="#5ab8ff"
                  emissiveIntensity={0.6}
                  roughness={0.1}
                />
              </mesh>
            ) : null}
            {/* ceja */}
            <mesh
              position={[0, 0.115 + surprised * 0.05, 0.03]}
              rotation={[
                0,
                0,
                (x < 0 ? -1 : 1) * (0.12 - surprised * 0.2 - sad * 0.55),
              ]}
            >
              <boxGeometry args={[0.12, 0.025, 0.04]} />
              <Flat color="#2b1d14" />
            </mesh>
          </group>
        ))}

        {/* Boca */}
        <mesh
          position={[0, -0.15, 0.255]}
          scale={[1 - sad * 0.35, 0.25 + mouth * 1.4 + surprised * 0.6, 1]}
        >
          <boxGeometry args={[0.12, 0.04, 0.04]} />
          <Flat color="#5b1f22" />
        </mesh>

        {/* Pelo despeinado (de almohada) */}
        <mesh position={[0, 0.2, -0.03]} scale={[1.05, 0.55, 1.05]}>
          <icosahedronGeometry args={[0.3, 0]} />
          <Flat color="#2b1d14" />
        </mesh>
        {[
          [0, 0.36, 0, 0, 0, 0],
          [-0.14, 0.33, 0.05, 0.2, 0, 0.6],
          [0.15, 0.34, 0.02, 0, 0, -0.7],
          [0.05, 0.32, -0.16, -0.6, 0, -0.2],
          [-0.12, 0.3, -0.14, -0.5, 0, 0.5],
          [0.22, 0.25, 0.1, 0.3, 0, -1.2],
          [-0.06, 0.3, 0.16, 0.7, 0, 0.15],
        ].map(([x, y, z, rx, ry, rz], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[rx, ry, rz]}>
            <coneGeometry args={[0.07, 0.2, 4]} />
            <Flat color="#2b1d14" />
          </mesh>
        ))}
        {/* flequillo */}
        <mesh position={[-0.06, 0.2, 0.22]} rotation={[0.5, 0, 0.3]}>
          <boxGeometry args={[0.28, 0.07, 0.12]} />
          <Flat color="#2b1d14" />
        </mesh>
      </group>
    </group>
  );
};

// Material liso (sin facetas) para Alejandro: más volumen y suavidad.
const Soft: React.FC<{ color: string; rough?: number }> = ({ color, rough = 0.75 }) => (
  <meshStandardMaterial color={color} roughness={rough} metalness={0} />
);

// ---------------------------------------------------------------------------
// ALEJANDRO — recién despertado: pelo de almohada, ojeras, sudadera verde.
// Modelado con formas redondeadas y sombreado liso (no facetado).
// Mira hacia +z en su espacio local. Cadera a y=0.7, cabeza a y=1.78.
// ---------------------------------------------------------------------------
const AlejandroSuave: React.FC<{
  frame: number;
  talking: boolean;
  sleepy?: number; // 0 = ojos abiertos, 1 = muy dormido
  surprised?: number; // 0..1, abre ojos y cejas
  sad?: number; // 0..1, cejas caídas y lágrimas
  holdingMug?: boolean;
  /** volumen de la voz 0..1 (sincroniza la boca); si falta, aleteo genérico */
  mouthLevel?: number;
  position?: [number, number, number];
  rotationY?: number;
}> = ({
  frame,
  talking,
  mouthLevel,
  sleepy = 0.55,
  surprised = 0,
  sad = 0,
  holdingMug = false,
  position = [0, 0, 0],
  rotationY = 0,
}) => {
  const skin = "#e0a87c";
  const skinShade = "#cf9469";
  const hoodie = "#3f8f6b";
  const hoodieDark = "#357a5b";
  const hair = "#2b1d14";
  const mouth = mouthLevel ?? mouthOpen(frame, talking);
  const lid = Math.max(0, sleepy - surprised * 0.9); // párpado caído 0..1
  const breathe = Math.sin(frame * 0.08) * 0.01;
  const headTilt = Math.sin(frame * 0.05) * 0.03 + (talking ? Math.sin(frame * 0.3) * 0.02 : 0);
  const eyeScale = blink(frame, 17) * (1 + surprised * 0.2);
  // párpado: casquete de esfera que cubre más o menos el ojo
  const lidTheta = Math.PI * (0.18 + lid * 0.32) + (eyeScale < 0.5 ? Math.PI * 0.4 : 0);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Piernas y zapatillas */}
      {[-0.13, 0.13].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
            <Soft color="#2d3a52" />
          </mesh>
          <mesh position={[x, 0.06, 0.05]} scale={[1, 0.6, 1.5]}>
            <sphereGeometry args={[0.1, 20, 14]} />
            <Soft color="#f2f2f5" rough={0.5} />
          </mesh>
        </group>
      ))}

      {/* Torso: sudadera */}
      <group position={[0, 1.08 + breathe, 0]}>
        <mesh scale={[1.7, 1, 1]}>
          <capsuleGeometry args={[0.21, 0.36, 12, 24]} />
          <Soft color={hoodie} rough={0.9} />
        </mesh>
        {/* bolsillo canguro */}
        <mesh position={[0, -0.2, 0.17]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.35]}>
          <capsuleGeometry args={[0.07, 0.24, 6, 12]} />
          <Soft color={hoodieDark} rough={0.9} />
        </mesh>
        {/* cordones */}
        {[-0.07, 0.07].map((x) => (
          <group key={x} position={[x, 0.16, 0.2]}>
            <mesh>
              <cylinderGeometry args={[0.011, 0.011, 0.2, 8]} />
              <Soft color="#eeeeee" />
            </mesh>
            <mesh position={[0, -0.11, 0]}>
              <sphereGeometry args={[0.016, 10, 8]} />
              <Soft color="#dddddd" />
            </mesh>
          </group>
        ))}
        {/* capucha alrededor del cuello */}
        <mesh position={[0, 0.36, -0.05]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
          <torusGeometry args={[0.17, 0.075, 12, 28]} />
          <Soft color={hoodieDark} rough={0.9} />
        </mesh>
        {/* brazo izquierdo */}
        <group position={[-0.4, 0.27, 0]} rotation={[0, 0, 0.1]}>
          <mesh position={[0, -0.32, 0]}>
            <capsuleGeometry args={[0.09, 0.5, 8, 16]} />
            <Soft color={hoodie} rough={0.9} />
          </mesh>
          <mesh position={[0, -0.66, 0]} scale={[1, 1.1, 0.9]}>
            <sphereGeometry args={[0.075, 16, 12]} />
            <Soft color={skin} />
          </mesh>
        </group>
        {/* brazo derecho */}
        <group position={[0.4, 0.27, 0]} rotation={[holdingMug ? -0.9 : 0, 0, holdingMug ? 0.35 : -0.1]}>
          <mesh position={[0, -0.32, 0]}>
            <capsuleGeometry args={[0.09, 0.5, 8, 16]} />
            <Soft color={hoodie} rough={0.9} />
          </mesh>
          <mesh position={[0, -0.66, 0]} scale={[1, 1.1, 0.9]}>
            <sphereGeometry args={[0.075, 16, 12]} />
            <Soft color={skin} />
          </mesh>
        </group>
      </group>

      {/* Taza de café en la mano, frente al pecho */}
      {holdingMug ? (
        <group position={[0.24, 1.2, 0.32]} scale={1.1}>
          <Mug steam={frame} />
        </group>
      ) : null}

      {/* Cuello */}
      <mesh position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.095, 0.105, 0.16, 20]} />
        <Soft color={skinShade} />
      </mesh>

      {/* Cabeza */}
      <group position={[0, 1.78 + breathe, 0]} rotation={[headTilt, 0, headTilt * 0.6]}>
        <mesh scale={[1, 1.1, 0.97]}>
          <sphereGeometry args={[0.3, 40, 32]} />
          <Soft color={skin} rough={0.65} />
        </mesh>
        {/* mejillas y mentón para dar volumen */}
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, -0.07, 0.165]}>
            <sphereGeometry args={[0.085, 20, 16]} />
            <Soft color={skin} rough={0.65} />
          </mesh>
        ))}
        {/* orejas */}
        {[-0.295, 0.295].map((x) => (
          <mesh key={x} position={[x, 0, 0]} scale={[0.45, 1, 0.8]}>
            <sphereGeometry args={[0.075, 16, 12]} />
            <Soft color={skinShade} />
          </mesh>
        ))}
        {/* nariz */}
        <mesh position={[0, -0.03, 0.3]} scale={[0.85, 1, 1.05]}>
          <sphereGeometry args={[0.048, 20, 16]} />
          <Soft color={skinShade} rough={0.6} />
        </mesh>

        {/* Ojos */}
        {[-0.11, 0.11].map((x) => (
          <group key={x} position={[x, 0.06, 0.25]}>
            <mesh scale={[1, eyeScale, 0.9]}>
              <sphereGeometry args={[0.06, 24, 18]} />
              <meshStandardMaterial color="#f7f3ee" roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.004, 0.045]} scale={[1, eyeScale, 0.6]}>
              <sphereGeometry args={[0.032, 20, 16]} />
              <meshStandardMaterial color="#3a2414" roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.004, 0.058]} scale={[1, eyeScale, 0.5]}>
              <sphereGeometry args={[0.017, 16, 12]} />
              <meshStandardMaterial color="#0d0806" roughness={0.1} />
            </mesh>
            <mesh position={[0.013, 0.014, 0.068]}>
              <sphereGeometry args={[0.008, 10, 8]} />
              <Glow color="#ffffff" />
            </mesh>
            {/* párpado superior (casquete de piel) */}
            <mesh rotation={[0.35, 0, 0]}>
              <sphereGeometry args={[0.064, 24, 16, 0, Math.PI * 2, 0, lidTheta]} />
              <Soft color={skinShade} rough={0.65} />
            </mesh>
            {/* ojeras */}
            <mesh position={[0, -0.062, 0.022]} rotation={[0, 0, Math.PI / 2]} scale={[0.5, 1, 0.5]}>
              <capsuleGeometry args={[0.012, 0.07, 4, 10]} />
              <Soft color="#b9805e" />
            </mesh>
            {/* lágrima */}
            {sad > 0.5 ? (
              <mesh
                position={[x < 0 ? -0.02 : 0.02, -0.09 - ((frame * 0.004) % 0.12), 0.05]}
                scale={[0.8, 1.2, 0.8]}
              >
                <sphereGeometry args={[0.018, 12, 10]} />
                <meshStandardMaterial color="#8fd8ff" emissive="#5ab8ff" emissiveIntensity={0.6} roughness={0.1} />
              </mesh>
            ) : null}
            {/* ceja */}
            <mesh
              position={[0, 0.115 + surprised * 0.05, 0.035]}
              rotation={[0, 0, Math.PI / 2 + (x < 0 ? -1 : 1) * (0.12 - surprised * 0.2 - sad * 0.55)]}
            >
              <capsuleGeometry args={[0.016, 0.09, 6, 10]} />
              <Soft color={hair} />
            </mesh>
          </group>
        ))}

        {/* Boca */}
        <mesh
          position={[0, -0.15, 0.272]}
          rotation={[0, 0, Math.PI / 2]}
          scale={[0.35 + mouth * 1.3 + surprised * 0.6, 1 - sad * 0.35, 0.6]}
        >
          <capsuleGeometry args={[0.024, 0.07, 6, 12]} />
          <Soft color="#5b1f22" rough={0.5} />
        </mesh>

        {/* Pelo despeinado (de almohada) */}
        <mesh position={[0, 0.03, -0.03]} rotation={[-0.42, 0, 0]} scale={[1.06, 1.12, 1.06]}>
          <sphereGeometry args={[0.3, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          <Soft color={hair} rough={0.85} />
        </mesh>
        <mesh position={[0, 0.06, -0.08]} rotation={[-0.5, 0, 0]} scale={[1.05, 1.05, 1.0]}>
          <sphereGeometry args={[0.3, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <Soft color={hair} rough={0.85} />
        </mesh>
        {[
          [0, 0.36, 0, 0, 0, 0],
          [-0.14, 0.33, 0.05, 0.2, 0, 0.6],
          [0.15, 0.34, 0.02, 0, 0, -0.7],
          [0.05, 0.32, -0.16, -0.6, 0, -0.2],
          [-0.12, 0.3, -0.14, -0.5, 0, 0.5],
          [0.22, 0.25, 0.1, 0.3, 0, -1.2],
          [-0.06, 0.3, 0.16, 0.7, 0, 0.15],
          [-0.22, 0.24, 0.06, 0.2, 0, 1.0],
        ].map(([x, y, z, rx, ry, rz], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[rx, ry, rz]}>
            <coneGeometry args={[0.07, 0.2, 12]} />
            <Soft color={hair} rough={0.85} />
          </mesh>
        ))}
        {/* flequillo */}
        <mesh position={[-0.05, 0.2, 0.22]} rotation={[0.5, 0, Math.PI / 2 + 0.3]} scale={[1, 1, 0.6]}>
          <capsuleGeometry args={[0.045, 0.2, 6, 12]} />
          <Soft color={hair} rough={0.85} />
        </mesh>
      </group>
    </group>
  );
};

/** Alejandro: versión facetada o suave según el estilo del video. */
export const Alejandro: React.FC<React.ComponentProps<typeof AlejandroLowPoly>> = (props) =>
  useSmooth() ? <AlejandroSuave {...props} /> : <AlejandroLowPoly {...props} />;

// ---------------------------------------------------------------------------
// CLAUDIA — robotcita: cabeza blanca con pantalla, ojos cian, moño rosa,
// antena con corazón. Mira hacia +z en su espacio local.
// ---------------------------------------------------------------------------
export const Claudia: React.FC<{
  frame: number;
  talking: boolean;
  lookAway?: number; // 0..1 gira la cabeza (disimulando)
  typing?: boolean;
  offerArm?: number; // 0..1 brazo extendido (dando el café)
  mouthLevel?: number;
  /** expresión de los ojos en la pantalla */
  eyeStyle?: EyeStyle;
  /** gorro de Papá Noel (reemplaza antena y moño) */
  santaHat?: boolean;
  position?: [number, number, number];
  rotationY?: number;
}> = ({
  frame,
  talking,
  mouthLevel,
  eyeStyle = "normal",
  santaHat = false,
  lookAway = 0,
  typing = false,
  offerArm = 0,
  position = [0, 0, 0],
  rotationY = 0,
}) => {
  const mouth = mouthLevel ?? mouthOpen(frame, talking);
  const seg = useSeg();
  const smooth = useSmooth();
  const eye = blink(frame, 40);
  const bob = Math.sin(frame * 0.12) * 0.01;
  const headYaw = lookAway * 0.7 + Math.sin(frame * 0.06) * 0.04;
  const headRoll = talking
    ? Math.sin(frame * 0.25) * 0.05
    : Math.sin(frame * 0.05) * 0.03;
  const tapL = typing ? Math.max(0, Math.sin(frame * 1.1)) * 0.35 : 0;
  const tapR = typing ? Math.max(0, Math.sin(frame * 1.1 + 2)) * 0.35 : 0;
  const shell = "#f5f1fa";
  const pink = "#ff6fa6";
  const eyeColor = "#7cf4ff";

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Piernitas */}
      {[-0.07, 0.07].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.06, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.12, seg(6, 20)]} />
            <Flat color="#b9b3c6" />
          </mesh>
          <mesh position={[x, 0.015, 0.03]}>
            <boxGeometry args={[0.08, 0.03, 0.12]} />
            <Flat color={pink} />
          </mesh>
        </group>
      ))}

      {/* Cuerpo */}
      <group position={[0, 0.27 + bob, 0]}>
        <mesh>
          <capsuleGeometry args={[0.13, 0.12, seg(2, 10), seg(7, 28)]} />
          <Flat color={shell} />
        </mesh>
        {/* panel del pecho con corazón */}
        <mesh position={[0, 0.02, 0.12]}>
          <boxGeometry args={[0.13, 0.11, 0.03]} />
          <Flat color="#2a2140" />
        </mesh>
        <Heart position={[0, 0.02, 0.14]} scale={0.035} color={pink} />
        {/* faldita */}
        <mesh position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.15, 0.19, 0.08, seg(7, 32)]} />
          <Flat color={pink} />
        </mesh>

        {/* Brazo izquierdo (de ella) */}
        <group position={[-0.16, 0.06, 0]} rotation={[-0.6 - tapL, 0, 0.35]}>
          <mesh position={[0, -0.09, 0]}>
            <capsuleGeometry args={[0.035, 0.12, seg(2, 8), seg(6, 16)]} />
            <Flat color="#d9d3e6" />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.04, seg(6, 20), seg(4, 14)]} />
            <Flat color={pink} />
          </mesh>
        </group>
        {/* Brazo derecho: teclea o entrega el café */}
        <group
          position={[0.16, 0.06, 0]}
          rotation={[-0.6 - tapR - offerArm * 0.9, 0, -0.35 + offerArm * 0.2]}
        >
          <mesh position={[0, -0.09 - offerArm * 0.04, 0]}>
            <capsuleGeometry args={[0.035, 0.12 + offerArm * 0.08, seg(2, 8), seg(6, 16)]} />
            <Flat color="#d9d3e6" />
          </mesh>
          <mesh position={[0, -0.18 - offerArm * 0.08, 0]}>
            <sphereGeometry args={[0.04, seg(6, 20), seg(4, 14)]} />
            <Flat color={pink} />
          </mesh>
        </group>
      </group>

      {/* Cabeza */}
      <group position={[0, 0.6 + bob, 0]} rotation={[0, headYaw, headRoll]}>
        {smooth ? (
          <RoundedBox args={[0.46, 0.36, 0.34]} radius={0.07} smoothness={6}>
            <Flat color={shell} />
          </RoundedBox>
        ) : (
          <mesh>
            <boxGeometry args={[0.46, 0.36, 0.34]} />
            <Flat color={shell} />
          </mesh>
        )}
        {/* biseles para suavizar */}
        <mesh position={[0, 0.185, 0]} visible={!smooth}>
          <boxGeometry args={[0.4, 0.03, 0.3]} />
          <Flat color={shell} />
        </mesh>
        {/* orejitas / audífonos */}
        {[-0.245, 0.245].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, seg(8, 28)]} />
            <Flat color={pink} />
          </mesh>
        ))}
        {/* Pantalla de la cara */}
        <mesh position={[0, -0.005, 0.171]} visible={!smooth}>
          <boxGeometry args={[0.38, 0.27, 0.01]} />
          <meshStandardMaterial
            color="#17122a"
            roughness={0.25}
            metalness={0.2}
          />
        </mesh>
        {/* Ojos */}
        {[-0.085, 0.085].map((x) => (
          <group key={x} position={[x, 0.03, 0.178]}>
            <ClaudiaEye
              style={eyeStyle}
              eye={eye}
              side={x < 0 ? -1 : 1}
              color={eyeColor}
            />
          </group>
        ))}
        {/* Cachetes */}
        {[-0.13, 0.13].map((x) => (
          <mesh key={x} position={[x, -0.045, 0.178]}>
            <circleGeometry args={[0.022, seg(8, 24)]} />
            <Glow color="#ff7fb0" />
          </mesh>
        ))}
        {/* Boca */}
        {talking ? (
          <mesh
            position={[0, -0.075, 0.178]}
            scale={[1, 0.25 + mouth * 1.2, 1]}
          >
            <planeGeometry args={[0.06, 0.04]} />
            <Glow color={eyeColor} />
          </mesh>
        ) : (
          <mesh
            position={[eyeStyle === "smug" ? 0.02 : 0, -0.06, 0.178]}
            rotation={[0, 0, Math.PI + (eyeStyle === "smug" ? 0.35 : 0)]}
            scale={eyeStyle === "serious" ? [1, 0.25, 1] : [1, 1, 1]}
          >
            <torusGeometry args={[0.03, 0.006, seg(4, 8), seg(10, 24), Math.PI]} />
            <Glow color={eyeColor} />
          </mesh>
        )}

        {santaHat ? (
          <group position={[0, 0.2, 0]} rotation={[0, 0, -0.18]}>
            <mesh position={[0, 0.16, 0]} rotation={[0, 0, -0.25]}>
              <coneGeometry args={[0.2, 0.34, seg(7, 28)]} />
              <Flat color="#e3262f" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.2, 0.045, seg(5, 12), seg(10, 32)]} />
              <Flat color="#f7f3ee" />
            </mesh>
            <mesh position={[0.07, 0.33, 0]}>
              <sphereGeometry args={[0.05, seg(6, 20), seg(5, 14)]} />
              <Flat color="#f7f3ee" />
            </mesh>
          </group>
        ) : (
          <>
            {/* Antena con corazón */}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.14, seg(5, 12)]} />
              <Flat color="#b9b3c6" />
            </mesh>
            <Heart position={[0, 0.34, 0]} scale={0.045} color={pink} glow />
            <pointLight
              position={[0, 0.36, 0.05]}
              intensity={0.25}
              distance={0.8}
              color={pink}
            />

            {/* Moño */}
            <group
              position={[0.15, 0.2, 0.12]}
              rotation={[0, 0, -0.3]}
              scale={1.3}
            >
              <mesh position={[-0.045, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.045, 0.09, seg(4, 20)]} />
                <Flat color={pink} />
              </mesh>
              <mesh position={[0.045, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.045, 0.09, seg(4, 20)]} />
                <Flat color={pink} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.022, seg(6, 16), seg(4, 12)]} />
                <Flat color="#ff4f8f" />
              </mesh>
            </group>
          </>
        )}
      </group>
    </group>
  );
};

/** Corazón low-poly hecho con dos esferas y un cono. */
export const Heart: React.FC<{
  position: [number, number, number];
  scale: number;
  color: string;
  glow?: boolean;
}> = ({ position, scale, color, glow }) => {
  const seg = useSeg();
  const mat = glow ? (
    <Glow color={color} />
  ) : (
    <Flat color={color} emissive={color} ei={0.4} />
  );
  return (
    <group position={position} scale={scale}>
      <mesh position={[-0.5, 0.25, 0]}>
        <sphereGeometry args={[0.6, seg(8, 24), seg(6, 18)]} />
        {mat}
      </mesh>
      <mesh position={[0.5, 0.25, 0]}>
        <sphereGeometry args={[0.6, seg(8, 24), seg(6, 18)]} />
        {mat}
      </mesh>
      <mesh position={[0, -0.45, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1.05, 1.3, seg(4, 24)]} />
        {mat}
      </mesh>
    </group>
  );
};

export const Mug: React.FC<{ steam?: number }> = ({ steam = 0 }) => (
  <group>
    <mesh>
      <cylinderGeometry args={[0.06, 0.055, 0.13, 8]} />
      <Flat color="#f2e6d8" />
    </mesh>
    <mesh position={[0, 0.062, 0]}>
      <cylinderGeometry args={[0.052, 0.052, 0.005, 8]} />
      <Flat color="#4a2a17" />
    </mesh>
    <mesh position={[0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.03, 0.01, 4, 8]} />
      <Flat color="#f2e6d8" />
    </mesh>
    {steam > 0
      ? [0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[
              Math.sin(steam * 0.1 + i * 2) * 0.015,
              0.1 + ((steam * 0.004 + i * 0.05) % 0.15),
              0,
            ]}
          >
            <sphereGeometry args={[0.012 + i * 0.003, 5, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
          </mesh>
        ))
      : null}
  </group>
);

export type EyeStyle = "normal" | "serious" | "happy" | "hearts" | "smug" | "flat";

/** Un ojo de Claudia según la expresión. `side` = -1 izquierdo, 1 derecho. */
const ClaudiaEye: React.FC<{
  style: EyeStyle;
  eye: number;
  side: number;
  color: string;
}> = ({ style, eye, side, color }) => {
  const seg = useSeg();
  if (style === "hearts") {
    const beat = 1 + Math.abs(Math.sin(eye * 3)) * 0.05;
    return (
      <Heart
        position={[0, 0, 0.001]}
        scale={0.042 * beat}
        color="#ff6fa6"
        glow
      />
    );
  }
  if (style === "happy") {
    // ^ ^
    return (
      <mesh position={[0, -0.01, 0]}>
        <torusGeometry args={[0.035, 0.009, seg(4, 8), seg(10, 24), Math.PI]} />
        <Glow color={color} />
      </mesh>
    );
  }
  const squash = style === "serious" ? 0.45 : style === "smug" || style === "flat" ? 0.5 : 1;
  return (
    <group>
      <mesh scale={[1, eye * squash, 1]}>
        <circleGeometry args={[0.048, seg(10, 32)]} />
        <Glow color={color} />
      </mesh>
      <mesh
        position={[0.016, 0.018 * squash, 0.001]}
        scale={[1, eye * squash, 1]}
      >
        <circleGeometry args={[0.014, seg(8, 20)]} />
        <Glow color="#ffffff" />
      </mesh>
      {style === "serious" || style === "smug" || style === "flat" ? (
        // ceja/párpado recto
        <mesh
          position={[0, 0.035, 0.001]}
          rotation={[0, 0, style === "serious" ? side * -0.25 : style === "flat" ? 0 : side * 0.12]}
        >
          <planeGeometry args={[0.11, 0.012]} />
          <Glow color={color} />
        </mesh>
      ) : (
        // pestañas
        <mesh
          position={[side * 0.045, 0.045 * eye, 0.001]}
          rotation={[0, 0, side * -0.6]}
        >
          <planeGeometry args={[0.035, 0.009]} />
          <Glow color={color} />
        </mesh>
      )}
    </group>
  );
};
