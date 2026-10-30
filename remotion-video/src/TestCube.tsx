import React from "react";
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";

const Canvas: React.FC<{ onReady: () => void }> = ({ onReady }) => (
  <ThreeCanvas
    width={1280}
    height={720}
    camera={{ fov: 38, position: [1.2, 3.8, 10.5], rotation: [-0.129703, 0.103104, 0.013424] }}
    gl={{ antialias: false }}
    onCreated={onReady}
  >
    <color attach="background" args={["#f6e3ae"]} />
    <ambientLight intensity={0.6} />
    <mesh position={[8, 0.05, -4]}>
      <boxGeometry args={[30, 0.4, 14]} />
      <meshBasicMaterial color="#00aa00" />
    </mesh>
    <mesh position={[0, 1.5, 0]}>
      <boxGeometry args={[3, 3, 3]} />
      <meshBasicMaterial color="#ff3333" />
    </mesh>
  </ThreeCanvas>
);

// Retries WebGL context creation until the GPU process survives it
class RetryBoundary extends React.Component<
  { onReady: () => void; children: React.ReactNode },
  { attempt: number; failed: boolean }
> {
  state = { attempt: 0, failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    console.log("CTX-FAIL attempt=" + this.state.attempt);
    setTimeout(() => this.setState((s) => ({ attempt: s.attempt + 1, failed: false })), 1500);
  }
  render() {
    if (this.state.failed) return null;
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }
}

console.log("MODULE-RUN");

export const TestCube: React.FC = () => {
  console.log("RENDER-COMP");
  const [hold] = React.useState(() => delayRender("wait-webgl", { timeoutInMilliseconds: 110000 }));
  const ready = React.useRef(false);
  const onReady = React.useCallback(() => {
    console.log("CTX-READY");
    if (!ready.current) {
      ready.current = true;
      continueRender(hold);
    }
  }, [hold]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#f6e3ae" }}>
      <RetryBoundary onReady={onReady}>
        <Canvas onReady={onReady} />
      </RetryBoundary>
    </AbsoluteFill>
  );
};
