import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// Chibi version of the reference sailor-uniform girl: black bob hair with
// ahoge, clasp hands, light-blue sailor collar, loose orange ribbon.
// Built with the svg-creator render-inspect-fix loop, then animated.
export const ChibiGirl = () => {
  const frame = useCurrentFrame();

  const bob = Math.sin(frame / 9) * 5;
  const tilt = Math.sin(frame / 16) * 2;
  const blinkPhase = frame % 110;
  const eyeOpen = blinkPhase >= 52 && blinkPhase <= 55 ? 0.12 : 1;
  const ribbonSway = Math.sin(frame / 7) * 7;
  const ahogeWiggle = Math.sin(frame / 5) * 6;
  const swish = Math.sin(frame / 9) * 4;
  const spark = (phase: number) => 0.3 + 0.35 * Math.sin(frame / 9 + phase);

  const skin = "#f3d5b8";
  const skinShade = "#e4bd99";

  const star = "M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z";
  const sparkles: Array<[number, number, number, number]> = [
    [30, 70, 0.9, 0],
    [246, 64, 0.7, 1.5],
    [250, 184, 0.8, 3],
    [28, 196, 0.6, 4.5],
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fef7ee 0%, #fdeee9 60%, #f8e7ee 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg width={487} height={660} viewBox="0 0 280 380" style={{ transform: `translateY(${bob}px)` }}>
        <defs>
          <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5f4b38" />
            <stop offset="60%" stopColor="#4e3b2b" />
            <stop offset="100%" stopColor="#3f2f22" />
          </linearGradient>
          <linearGradient id="skirtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ecbef" />
            <stop offset="100%" stopColor="#62a6dd" />
          </linearGradient>
          <linearGradient id="blouseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef0f3" />
          </linearGradient>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#ffe1ec" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffe1ec" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* soft halo + twinkling sparkles */}
        <circle cx={140} cy={170} r={110} fill="url(#halo)" />
        {sparkles.map(([x, y, s, p]) => (
          <g key={`${x}-${y}`} transform={`translate(${x},${y}) scale(${s})`} fill="#f4b860" opacity={spark(p)}>
            <path d={star} />
          </g>
        ))}

        {/* shadow */}
        <ellipse cx={140} cy={368} rx={58} ry={8} fill="#2d1b4e" opacity={0.12} />

        {/* ===== LEGS ===== */}
        <rect x={116} y={286} width={16} height={24} rx={8} fill={skin} />
        <rect x={144} y={286} width={16} height={24} rx={8} fill={skin} />
        <rect x={116} y={302} width={16} height={46} rx={7} fill="#ffffff" stroke="#e3e0d8" strokeWidth={1} />
        <rect x={144} y={302} width={16} height={46} rx={7} fill="#ffffff" stroke="#e3e0d8" strokeWidth={1} />
        <path d="M117 310 L131 310 M145 310 L159 310" stroke="#e3e0d8" strokeWidth={1.4} />
        <path d="M108 356 Q108 346 120 346 L126 346 Q136 346 136 355 L136 359 Q136 364 129 364 L114 364 Q108 364 108 359 Z" fill="#6b4a33" />
        <path d="M142 356 Q142 346 152 346 L160 346 Q170 346 170 355 L170 359 Q170 364 164 364 L147 364 Q142 364 142 359 Z" fill="#6b4a33" />
        <path d="M110 352 L133 351 M144 352 L167 351" stroke="#3f2a1a" strokeWidth={2.4} strokeLinecap="round" />

        {/* ===== SKIRT (swish) ===== */}
        <g transform={`translate(${swish}, 0)`}>
          <path
            d="M104 246 L176 246 L196 292
               Q188 306 180 296 Q174 308 164 296 Q154 308 144 296
               Q134 308 124 296 Q114 308 104 296 Q96 306 88 292 Z"
            fill="url(#skirtGrad)"
            stroke="#5b9ed2"
            strokeWidth={1.2}
          />
          <path d="M120 248 L112 298 M140 248 L140 300 M160 248 L168 298" stroke="#5b9ed2" strokeWidth={2} opacity={0.65} />
        </g>

        {/* ===== TORSO ===== */}
        <rect x={133} y={164} width={14} height={22} rx={6} fill={skin} />

        {/* sleeves as thick tubes, bending in to clasp */}
        <path d="M104 190 Q84 208 102 226" stroke="url(#blouseGrad)" strokeWidth={22} strokeLinecap="round" fill="none" />
        <path d="M178 190 Q198 208 180 224" stroke="url(#blouseGrad)" strokeWidth={22} strokeLinecap="round" fill="none" />

        {/* blouse body */}
        <path
          d="M108 182 Q140 172 172 182 Q186 214 184 246
             Q160 252 140 250 Q120 252 96 246 Q94 214 108 182 Z"
          fill="url(#blouseGrad)"
          stroke="#e6e1d8"
          strokeWidth={1}
        />
        <path d="M96 246 Q108 252 120 247 Q140 253 160 247 Q172 252 184 246" stroke="#e2ded4" strokeWidth={1.2} fill="none" />

        {/* sailor collar: one solid V panel */}
        <path
          d="M104 168 Q140 178 176 168 L176 174 Q176 190 140 212 Q104 190 104 174 Z"
          fill="#9dd2f1"
          stroke="#79b6e0"
          strokeWidth={1}
        />
        <path d="M112 180 L126 199 M168 180 L154 199" stroke="#ffffff" strokeWidth={1.8} opacity={0.9} fill="none" />

        {/* clasped hands: mitten bundle */}
        <g transform="rotate(-8 138 222)">
          <ellipse cx={131} cy={225} rx={10.5} ry={9.5} fill={skin} />
          <ellipse cx={146} cy={221} rx={11} ry={10} fill={skin} />
        </g>
        <path d="M141 214 q5 4 6 11 M147 212 q5 5 5 12" stroke={skinShade} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.6} />
        <path d="M127 221 q-4 4 -1 8" stroke={skinShade} strokeWidth={1.2} fill="none" strokeLinecap="round" opacity={0.6} />

        {/* orange ribbon: sways from the knot */}
        <g transform={`rotate(${ribbonSway}, 140, 210)`}>
          <circle cx={140} cy={209} r={4.2} fill="#f7a542" />
          <path d="M148 215 C158 228 152 242 162 256 C170 266 164 282 168 298" stroke="#f7a542" strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M148 215 C158 228 152 242 162 256 C170 266 164 282 168 298" stroke="#e08c2c" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.35} />
        </g>

        {/* ===== HEAD ===== */}
        <g transform={`rotate(${tilt}, 140, 150)`}>
          {/* hair back */}
          <path
            d="M50 104 Q50 12 140 12 Q230 12 230 104
               L230 128
               Q234 152 222 170 Q214 178 204 168 Q212 146 208 126
               L72 126
               Q68 146 76 168 Q66 178 58 170 Q46 152 50 128 Z"
            fill="url(#hairGrad)"
          />
          <path d="M66 140 Q76 156 88 146 Q98 158 112 148 Q126 158 140 148 Q154 158 168 148 Q182 158 192 146 Q204 156 214 140 L214 108 L66 108 Z" fill="url(#hairGrad)" />

          {/* face */}
          <circle cx={140} cy={112} r={68} fill={skin} />

          {/* bangs: full dome, shallow fringe */}
          <path
            d="M64 106 Q76 118 88 110 Q98 118 108 108 Q120 116 130 106
               Q140 114 150 106 Q162 116 172 108 Q184 118 196 110
               Q206 118 216 106 L216 92 Q216 28 140 26 Q64 28 64 92 Z"
            fill="url(#hairGrad)"
          />

          {/* ahoge wiggles */}
          <g transform={`rotate(${ahogeWiggle}, 142, 20)`}>
            <path d="M134 20 C130 0 158 -6 164 8 C150 4 142 12 145 24 Z" fill="url(#hairGrad)" />
          </g>
          <path d="M84 30 Q70 22 58 30 M206 34 Q220 26 230 34" stroke="#4e3b2b" strokeWidth={2.2} fill="none" strokeLinecap="round" />

          {/* eyebrows */}
          <path d="M100 116 Q112 112 124 116 M156 116 Q168 112 182 116" stroke="#4a372a" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.85} />

          {/* big brown eyes (blink) */}
          <g transform={`translate(140,133) scale(1,${eyeOpen}) translate(-140,-133)`}>
            <ellipse cx={112} cy={133} rx={12.5} ry={15} fill="#5f3c1f" />
            <circle cx={112} cy={128} r={5.5} fill="#8a5a2f" />
            <path d="M99 127 Q112 119 125 127" stroke="#38220f" strokeWidth={3} fill="none" strokeLinecap="round" />
            <circle cx={117} cy={123} r={4.6} fill="#ffffff" />
            <circle cx={107} cy={138} r={2.2} fill="#ffffff" opacity={0.9} />
            <ellipse cx={168} cy={133} rx={12.5} ry={15} fill="#5f3c1f" />
            <circle cx={168} cy={128} r={5.5} fill="#8a5a2f" />
            <path d="M155 127 Q168 119 181 127" stroke="#38220f" strokeWidth={3} fill="none" strokeLinecap="round" />
            <circle cx={173} cy={123} r={4.6} fill="#ffffff" />
            <circle cx={163} cy={138} r={2.2} fill="#ffffff" opacity={0.9} />
          </g>

          {/* blush */}
          <ellipse cx={92} cy={144} rx={10} ry={5.5} fill="#f0a08f" opacity={0.42} />
          <ellipse cx={188} cy={144} rx={10} ry={5.5} fill="#f0a08f" opacity={0.42} />
          <circle cx={146} cy={148} r={1.4} fill={skinShade} />
          {/* gentle smile */}
          <path d="M144 158 Q152 164 161 155" stroke="#8a5240" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
