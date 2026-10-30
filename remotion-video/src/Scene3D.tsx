import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

// Temple cat scene — 3D toy version of the crayon picture book drawing.

const SKY = "#f6e3ae";
const SAND_TOP = "#f0d49c";
const SAND_WALL = "#dca55c";
const SAND_FAR = "#e9c994";
const OCHRE = "#e6b96e";
const OCHRE_L = "#e9c077";
const OCHRE_D = "#dfab5d";
const INDIGO = "#453f86";
const WHITE = "#fffdf7";
const CREAM = "#faf0dc";
const CORAL = "#e2765c";
const TEAL = "#55a8a1";
const GOLD = "#f2b632";
const PINK = "#f2a3b0";
const BRONZE = "#7a4a2b";
const CUB = "#c3b4a4";
const SKIN = "#fbe8d2";
const WATER = "#6ec7d4";

// stable object reference: r3f only applies the camera prop when it changes (shallow)
const CAM = {
  fov: 38,
  position: [1.2, 3.8, 10.5] as [number, number, number],
  rotation: [-0.129703, 0.103104, 0.013424] as [number, number, number],
};

const lam = (color: string) => <meshLambertMaterial color={color} />;

const limb = (a: number[], b: number[], r: number, color: string) => {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const mid = va.clone().add(dir.clone().multiplyScalar(0.5));
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={mid} quaternion={quat} castShadow>
      <cylinderGeometry args={[r, r, len, 10]} />
      {lam(color)}
    </mesh>
  );
};

const Ear: React.FC<{ p: [number, number, number]; rot: number; color: string; r?: number; h?: number }> = ({ p, rot, color, r = 0.4, h = 0.85 }) => (
  <mesh position={p} rotation={[0.15, 0, rot]} castShadow>
    <coneGeometry args={[r, h, 12]} />
    {lam(color)}
  </mesh>
);

const Cat: React.FC<{ color: string; scale?: number }> = ({ color, scale = 1 }) => (
  <group scale={scale}>
    {/* body */}
    <mesh position={[0, 1.05, -0.1]} scale={[1, 1.12, 1]} castShadow>
      <sphereGeometry args={[1.05, 20, 16]} />
      {lam(color)}
    </mesh>
    {/* front legs + paws */}
    <mesh position={[-0.45, 0.68, 0.72]} castShadow>
      <cylinderGeometry args={[0.24, 0.26, 1.3, 10]} />
      {lam(color)}
    </mesh>
    <mesh position={[0.45, 0.68, 0.72]} castShadow>
      <cylinderGeometry args={[0.24, 0.26, 1.3, 10]} />
      {lam(color)}
    </mesh>
    <mesh position={[-0.45, 0.15, 0.92]} scale={[1, 0.6, 1.4]} castShadow>
      <sphereGeometry args={[0.28, 12, 10]} />
      {lam(color)}
    </mesh>
    <mesh position={[0.45, 0.15, 0.92]} scale={[1, 0.6, 1.4]} castShadow>
      <sphereGeometry args={[0.28, 12, 10]} />
      {lam(color)}
    </mesh>
    {/* tail */}
    <mesh position={[-1.15, 0.75, -0.55]} rotation={[0.35, 0.4, 1.2]} castShadow>
      <torusGeometry args={[0.72, 0.17, 8, 20, Math.PI * 1.25]} />
      {lam(color)}
    </mesh>
    {/* head */}
    <mesh position={[0, 2.5, 0.12]} castShadow>
      <sphereGeometry args={[0.95, 20, 16]} />
      {lam(color)}
    </mesh>
    <Ear p={[-0.5, 3.3, 0.05]} rot={0.35} color={color} />
    <Ear p={[0.5, 3.3, 0.05]} rot={-0.35} color={color} />
    {/* eyes */}
    <mesh position={[-0.34, 2.6, 1.0]}>
      <circleGeometry args={[0.22, 16]} />
      <meshBasicMaterial color={GOLD} />
    </mesh>
    <mesh position={[0.34, 2.6, 1.0]}>
      <circleGeometry args={[0.22, 16]} />
      <meshBasicMaterial color={GOLD} />
    </mesh>
    <mesh position={[-0.34, 2.6, 1.02]}>
      <circleGeometry args={[0.1, 12]} />
      <meshBasicMaterial color={INDIGO} />
    </mesh>
    <mesh position={[0.34, 2.6, 1.02]}>
      <circleGeometry args={[0.1, 12]} />
      <meshBasicMaterial color={INDIGO} />
    </mesh>
    {/* cheeks */}
    <mesh position={[-0.6, 2.3, 0.86]} scale={[1, 0.65, 0.5]}>
      <sphereGeometry args={[0.16, 10, 8]} />
      <meshBasicMaterial color={PINK} />
    </mesh>
    <mesh position={[0.6, 2.3, 0.86]} scale={[1, 0.65, 0.5]}>
      <sphereGeometry args={[0.16, 10, 8]} />
      <meshBasicMaterial color={PINK} />
    </mesh>
    {/* nose */}
    <mesh position={[0, 2.34, 1.06]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.09, 0.1, 3]} />
      <meshBasicMaterial color={INDIGO} />
    </mesh>
  </group>
);

const Mother: React.FC = () => (
  <group>
    {/* legs */}
    {limb([-0.24, 0, 0], [-0.22, 2.3, 0], 0.16, INDIGO)}
    {limb([0.24, 0, 0], [0.22, 2.3, 0], 0.16, INDIGO)}
    {/* sarong */}
    <mesh position={[0, 3.1, 0]} castShadow>
      <cylinderGeometry args={[0.75, 1.2, 2.0, 18]} />
      {lam(CREAM)}
    </mesh>
    {/* top */}
    <mesh position={[0, 4.55, 0]} castShadow>
      <cylinderGeometry args={[0.7, 0.76, 1.0, 16]} />
      {lam(CORAL)}
    </mesh>
    {/* hair back + face */}
    <mesh position={[0, 5.75, -0.14]} scale={[1, 1.02, 0.9]} castShadow>
      <sphereGeometry args={[0.92, 20, 16]} />
      {lam(INDIGO)}
    </mesh>
    <mesh position={[0, 5.66, 0.24]}>
      <sphereGeometry args={[0.74, 20, 16]} />
      {lam(SKIN)}
    </mesh>
    {/* bangs */}
    <mesh position={[0, 6.2, 0.3]} rotation={[0.5, 0, 0]} scale={[1, 0.5, 0.75]}>
      <sphereGeometry args={[0.72, 16, 12]} />
      {lam(INDIGO)}
    </mesh>
    {/* eyes */}
    <mesh position={[-0.28, 5.7, 0.88]}>
      <circleGeometry args={[0.13, 14]} />
      <meshBasicMaterial color={INDIGO} />
    </mesh>
    <mesh position={[0.28, 5.7, 0.88]}>
      <circleGeometry args={[0.13, 14]} />
      <meshBasicMaterial color={INDIGO} />
    </mesh>
    {/* cheeks */}
    <mesh position={[-0.46, 5.44, 0.78]} scale={[1, 0.6, 0.4]}>
      <sphereGeometry args={[0.12, 10, 8]} />
      <meshBasicMaterial color={PINK} />
    </mesh>
    <mesh position={[0.46, 5.44, 0.78]} scale={[1, 0.6, 0.4]}>
      <sphereGeometry args={[0.12, 10, 8]} />
      <meshBasicMaterial color={PINK} />
    </mesh>
    {/* bundle */}
    <mesh position={[0.1, 4.45, 0.82]} rotation={[0, 0, Math.PI / 2 - 0.12]} castShadow>
      <cylinderGeometry args={[0.46, 0.46, 2.1, 14]} />
      {lam("#f7ecd8")}
    </mesh>
    {/* cub head */}
    <mesh position={[1.05, 4.75, 0.95]} castShadow>
      <sphereGeometry args={[0.46, 16, 14]} />
      {lam(CUB)}
    </mesh>
    <Ear p={[0.78, 5.2, 0.9]} rot={0.4} color={CUB} r={0.18} h={0.4} />
    <Ear p={[1.3, 5.2, 0.9]} rot={-0.4} color={CUB} r={0.18} h={0.4} />
    <mesh position={[0.94, 4.78, 1.36]}>
      <circleGeometry args={[0.07, 10]} />
      <meshBasicMaterial color={INDIGO} />
    </mesh>
    <mesh position={[1.16, 4.78, 1.36]}>
      <circleGeometry args={[0.07, 10]} />
      <meshBasicMaterial color={INDIGO} />
    </mesh>
    {/* arms wrapping the bundle */}
    {limb([-0.72, 4.9, 0.1], [-0.5, 4.15, 1.0], 0.17, INDIGO)}
    {limb([0.72, 4.9, 0.1], [0.55, 4.2, 1.05], 0.17, INDIGO)}
    <mesh position={[-0.5, 4.15, 1.05]}>
      <sphereGeometry args={[0.2, 10, 8]} />
      {lam(SKIN)}
    </mesh>
    <mesh position={[0.55, 4.2, 1.1]}>
      <sphereGeometry args={[0.2, 10, 8]} />
      {lam(SKIN)}
    </mesh>
  </group>
);

const Column: React.FC<{ x: number }> = ({ x }) => (
  <group position={[x, 0, -6]} scale={1.15}>
    <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.7, 0.7, 2.7]} />
      {lam(OCHRE_D)}
    </mesh>
    <mesh position={[0, 5.2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.85, 0.9, 9, 16]} />
      {lam(OCHRE)}
    </mesh>
    <mesh position={[0, 10.15, 0]} scale={[1, 0.5, 1]} castShadow>
      <sphereGeometry args={[1.35, 16, 12]} />
      {lam(OCHRE_L)}
    </mesh>
  </group>
);

const Scene: React.FC = () => {
  const f = useCurrentFrame(); // keep composition frame-driven (static scene)
  return (
    <AbsoluteFill style={{ backgroundColor: SKY }}>
      <ThreeCanvas width={1280} height={720} camera={CAM} gl={{ antialias: false }}>
        <color attach="background" args={[SKY]} />
        <hemisphereLight args={["#fff3d6", "#d99a55", 0.6]} />
        <ambientLight intensity={0.22} />
        <directionalLight
          position={[12, 16, 9]}
          intensity={0.95}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={24}
          shadow-camera-bottom={-12}
          shadow-camera-far={70}
        />

        {/* distant ground + dunes + sun */}
        <mesh position={[0, -3, -40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[400, 400]} />
          {lam(SAND_FAR)}
        </mesh>
        <mesh position={[16, -1.4, -40]} scale={[1.7, 0.28, 1]} receiveShadow>
          <sphereGeometry args={[8, 20, 14]} />
          {lam("#e8c78c")}
        </mesh>
        <mesh position={[-14, -1.8, -46]} scale={[1.9, 0.24, 1]}>
          <sphereGeometry args={[8, 20, 14]} />
          {lam("#ecd3a0")}
        </mesh>
        <mesh position={[7, 8, -42]}>
          <circleGeometry args={[3.4, 32]} />
          <meshBasicMaterial color="#f7d774" />
        </mesh>

        {/* water */}
        <mesh position={[10, -0.2, -34]}>
          <boxGeometry args={[36, 0.4, 10]} />
          <meshBasicMaterial color="#57bfcf" />
        </mesh>

        {/* platform: sand top + wall face */}
        <mesh position={[0, -1.5, 1.5]} receiveShadow castShadow>
          <boxGeometry args={[46, 3, 23]} />
          <meshLambertMaterial attach="material-0" color={SAND_WALL} />
          <meshLambertMaterial attach="material-1" color={SAND_WALL} />
          <meshLambertMaterial attach="material-2" color={SAND_TOP} />
          <meshLambertMaterial attach="material-3" color={SAND_WALL} />
          <meshLambertMaterial attach="material-4" color={SAND_WALL} />
          <meshLambertMaterial attach="material-5" color={SAND_WALL} />
        </mesh>

        {/* columns */}
        <Column x={-11} />
        <Column x={-8} />
        <Column x={-5} />
        <Column x={-2} />

        {/* sandstone blocks, right */}
        <mesh position={[7.5, 0.7, -2.5]} castShadow receiveShadow>
          <boxGeometry args={[4.6, 1.4, 3.4]} />
          {lam(OCHRE)}
        </mesh>
        <mesh position={[8.7, 1.9, -3.1]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 1.0, 2.4]} />
          {lam(OCHRE_L)}
        </mesh>

        {/* white cat */}
        <group position={[-3.5, 0, 1.5]}>
          <Cat color={WHITE} />
          {/* collar */}
          <mesh position={[0, 1.75, 0.1]} rotation={[Math.PI / 2 + 0.3, 0, 0]} castShadow>
            <torusGeometry args={[0.82, 0.12, 8, 24]} />
            {lam(TEAL)}
          </mesh>
          <mesh position={[0, 1.5, 0.86]}>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshLambertMaterial color={GOLD} />
          </mesh>
        </group>

        {/* bronze statue on pedestal */}
        <group position={[-0.5, 0, 2]}>
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.6, 1.5]} />
            {lam("#a06a3c")}
          </mesh>
          <group position={[0, 0.6, 0]} scale={0.68}>
            <Cat color={BRONZE} />
          </group>
        </group>

        {/* mother with swaddled cub */}
        <group position={[3.2, 0, 0.5]}>
          <Mother />
        </group>
      </ThreeCanvas>
      <div style={{ display: "none" }}>{f}</div>
    </AbsoluteFill>
  );
};

export const Scene3D: React.FC = () => <Scene />;
