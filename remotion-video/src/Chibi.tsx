import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// A chibi character drawn fully in SVG, animated with frame-based math.
export const Chibi = () => {
  const frame = useCurrentFrame();

  // Idle: gentle bob using a spring-like sine
  const bob = Math.sin(frame / 7) * 6;
  const tilt = Math.sin(frame / 14) * 2.5;

  // Blink: eyes close for a few frames every ~3 seconds
  const blinkPhase = frame % 100;
  const eyeOpen = blinkPhase >= 45 && blinkPhase <= 48 ? 0.15 : 1;

  // Wave: arm rests down (170°), smoothly raises beside the head and waves
  const waveUp = interpolate(frame, [20, 40, 115, 135], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const waveAngle = 170 - waveUp * 120 + waveUp * Math.sin(frame / 2.5) * 15;

  // Floating hearts in the background
  const hearts = [0, 1, 2, 3, 4, 5].map((i) => ({
    x: 80 + i * 190 + Math.sin(frame / 12 + i) * 15,
    y: 640 - ((frame * (1 + i * 0.3) + i * 110) % 750),
    s: 0.6 + (i % 3) * 0.25,
    o: 0.35,
  }));

  const skin = "#ffe3c9";
  const hair = "#6b4226";
  const dress = "#ff8fb1";

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {hearts.map((h, i) => (
        <svg key={i} width={30 * h.s} height={30 * h.s} viewBox="0 0 24 24" style={{ position: "absolute", left: h.x, top: h.y, opacity: h.o }}>
          <path d="M12 21C12 21 3 14 3 8.5C3 5.5 5.5 3.5 8 3.5C9.8 3.5 11.3 4.5 12 6C12.7 4.5 14.2 3.5 16 3.5C18.5 3.5 21 5.5 21 8.5C21 14 12 21 12 21Z" fill="#ff9ec4" />
        </svg>
      ))}

      <svg
        width={380}
        height={456}
        viewBox="0 0 200 240"
        style={{ transform: `translateY(${bob}px)` }}
      >
        {/* shadow */}
        <ellipse cx={100} cy={226} rx={55} ry={8} fill="#00000018" />

        {/* legs */}
        <rect x={74} y={185} width={14} height={32} rx={7} fill={skin} />
        <rect x={112} y={185} width={14} height={32} rx={7} fill={skin} />
        {/* shoes */}
        <ellipse cx={81} cy={218} rx={11} ry={6} fill="#c25e7e" />
        <ellipse cx={119} cy={218} rx={11} ry={6} fill="#c25e7e" />

        {/* left arm (static, swinging slightly) */}
        <g transform={`rotate(${Math.sin(frame / 7) * 5}, 68, 148)`}>
          <rect x={58} y={145} width={13} height={40} rx={6.5} fill={skin} />
        </g>

        {/* body / dress */}
        <path d="M72 142 Q100 130 128 142 L136 195 Q100 208 64 195 Z" fill={dress} />
        <circle cx={100} cy={168} r={6} fill="#ffffff" opacity={0.85} />

        {/* right arm (the waving one) */}
        <g transform={`rotate(${waveAngle}, 132, 148)`}>
          <rect x={129} y={105} width={13} height={44} rx={6.5} fill={skin} />
          <circle cx={135.5} cy={105} r={9} fill={skin} />
        </g>

        {/* head group (extra-large chibi head, tilts slightly) */}
        <g transform={`rotate(${tilt}, 100, 120)`}>
          {/* hair back */}
          <circle cx={100} cy={78} r={60} fill={hair} />
          {/* face */}
          <circle cx={100} cy={86} r={50} fill={skin} />
          {/* bangs */}
          <path d="M50 78 Q52 24 100 24 Q148 24 150 78 Q138 60 124 66 Q118 44 100 46 Q82 44 76 66 Q62 60 50 78 Z" fill={hair} />
          {/* ahoge (little hair spike) */}
          <path d="M98 24 Q104 6 118 10 Q106 12 104 25 Z" fill={hair} />

          {/* eyes (blink) */}
          <g transform={`translate(100,90) scale(1,${eyeOpen}) translate(-100,-90)`}>
            <ellipse cx={78} cy={92} rx={8} ry={11} fill="#3b2a20" />
            <ellipse cx={122} cy={92} rx={8} ry={11} fill="#3b2a20" />
            <circle cx={80.5} cy={88} r={3} fill="#fff" />
            <circle cx={124.5} cy={88} r={3} fill="#fff" />
          </g>
          {/* blush */}
          <circle cx={66} cy={104} r={7} fill="#ffb3ba" opacity={0.7} />
          <circle cx={134} cy={104} r={7} fill="#ffb3ba" opacity={0.7} />
          {/* smile */}
          <path d="M92 110 Q100 118 108 110" stroke="#3b2a20" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
