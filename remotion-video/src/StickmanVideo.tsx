import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Caveat";

// "Nothing Filmed This" — B1 Minimal Handdrawn (极简手绘风) restyle:
// warm paper + faint grid, slender expressive stick figures, hand-lettered
// focal text + phrase captions. Storyboard from directing-stickman-videos.
const { fontFamily: HAND } = loadFont("normal", { weights: ["400", "700"] });

const PAPER = "#FDFDFC";
const INK = "#232A32";
const NAVY = "#24487F";
const RED = "#D6482F";
const GREEN = "#3E9B5F";
const YEL = "#F0B429";
const GROUND = 596;
const GR = 531; // hip Y so slender feet land on the ground line

const Grid = () => (
  <g fill="none" stroke="rgba(76,90,105,0.036)" strokeWidth={0.9}>
    {Array.from({ length: 20 }).map((_, i) => (
      <line key={`v${i}`} x1={i * 64} y1={0} x2={i * 64} y2={610} />
    ))}
    {Array.from({ length: 10 }).map((_, i) => (
      <line key={`h${i}`} x1={0} y1={i * 64} x2={1280} y2={i * 64} />
    ))}
  </g>
);

const GroundLine = () => (
  <path d="M 70 597 q 180 -2 570 0 q 380 2 570 -1" stroke={INK} strokeWidth={2.2} fill="none" opacity={0.4} />
);

const Focal: React.FC<{ text: string; color?: string; y?: number }> = ({ text, color = INK, y = 110 }) => (
  <div
    style={{
      position: "absolute",
      top: y,
      width: "100%",
      textAlign: "center",
      fontFamily: HAND,
      fontSize: 88,
      fontWeight: 700,
      color,
      transform: "rotate(-1.5deg)",
    }}
  >
    {text}
  </div>
);

const Cap: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      bottom: 22,
      width: "100%",
      textAlign: "center",
      fontFamily: HAND,
      fontSize: 34,
      color: INK,
      opacity: 0.92,
    }}
  >
    {text}
  </div>
);

type Expr = "smile" | "surprise" | "effort" | "worried" | "proud" | "grin";

type Pose = {
  x: number;
  y: number;
  s?: number;
  armL?: number;
  armR?: number;
  legL?: number;
  legR?: number;
  lean?: number;
  expr?: Expr;
};

const BStickman: React.FC<Pose> = ({ x, y, s = 1, armL = 8, armR = -8, legL = 0, legR = 0, lean = 0, expr = "smile" }) => {
  const A = 56;
  const L = 66;
  const pt = (ox: number, oy: number, len: number, deg: number): [number, number] => {
    const r = (deg * Math.PI) / 180;
    return [ox + Math.sin(r) * len, oy + Math.cos(r) * len];
  };
  const [lx, ly] = pt(0, 0, L, legL);
  const [rx, ry] = pt(0, 0, L, legR);
  const [alx, aly] = pt(0, -64, A, armL);
  const [arx, ary] = pt(0, -64, A, armR);
  const hy = -96; // head center
  const eye = (cx: number, cy: number) => {
    if (expr === "effort") return <line x1={cx - 3} y1={cy} x2={cx + 3} y2={cy} strokeWidth={2.8} />;
    if (expr === "proud") return <path d={`M ${cx - 4} ${cy + 1} q 4 -4.5 8 0`} strokeWidth={2.6} fill="none" />;
    if (expr === "surprise") return <ellipse cx={cx} cy={cy} rx={3.4} ry={5.2} fill={INK} stroke="none" />;
    return <ellipse cx={cx} cy={cy} rx={2.8} ry={4.6} fill={INK} stroke="none" />;
  };
  const brow = (cx: number, cy: number, tilt: number) => (
    <path d={`M ${cx - 6} ${cy + tilt} q 6 -4 12 ${-tilt}`} strokeWidth={2.6} fill="none" />
  );
  const mouth = () => {
    if (expr === "worried" || expr === "surprise")
      return <ellipse cx={0} cy={-82} rx={8.5} ry={10.5} fill={PAPER} strokeWidth={3.6} />;
    if (expr === "effort") return <ellipse cx={0} cy={-82} rx={8} ry={6.5} fill={PAPER} strokeWidth={3.6} />;
    if (expr === "grin" || expr === "proud") return <path d="M -9 -84 Q 0 -72 9 -84 Q 0 -79 -9 -84 Z" fill={PAPER} strokeWidth={3.4} />;
    return <path d="M -6 -82 Q 0 -76 6 -82" fill="none" strokeWidth={2.6} />;
  };
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${lean})`} stroke={INK} strokeWidth={4.4} strokeLinecap="round" fill="none">
      {/* compact torso + limbs */}
      <line x1={0} y1={0} x2={0} y2={-70} />
      <line x1={0} y1={0} x2={lx} y2={ly} />
      <line x1={0} y1={0} x2={rx} y2={ry} />
      <line x1={0} y1={-64} x2={alx} y2={aly} />
      <line x1={0} y1={-64} x2={arx} y2={ary} />
      {/* oval hands */}
      <ellipse cx={alx} cy={aly} rx={3.8} ry={5.6} fill={PAPER} />
      <ellipse cx={arx} cy={ary} rx={3.8} ry={5.6} fill={PAPER} />
      {/* oval feet */}
      <ellipse cx={lx + 5} cy={ly} rx={6.4} ry={3} fill={PAPER} />
      <ellipse cx={rx + 5} cy={ry} rx={6.4} ry={3} fill={PAPER} />
      {/* big sketchy head: doubled outline + hair strands */}
      <ellipse cx={1} cy={hy} rx={30} ry={28.5} fill={PAPER} strokeWidth={4.2} transform={`rotate(9 1 ${hy})`} />
      <ellipse cx={-1.5} cy={hy + 0.5} rx={29} ry={27.5} fill="none" opacity={0.5} strokeWidth={2.2} />
      <g strokeWidth={2.8}>
        <path d={`M -5 ${hy - 25} q -8 -12 -18 -15`} />
        <path d={`M 6 ${hy - 27} q 7 -13 3 -22`} />
      </g>
      {eye(-10, hy - 6)}
      {eye(10, hy - 6)}
      {expr === "surprise" ? (
        <>
          {brow(-10, hy - 16, -3)}
          {brow(10, hy - 16, 3)}
        </>
      ) : expr === "effort" ? (
        <>
          {brow(-10, hy - 15, 3)}
          {brow(10, hy - 15, -3)}
        </>
      ) : expr === "worried" ? (
        <>
          <path d={`M -18 ${hy - 15} q 6 3 12 2`} strokeWidth={2.6} fill="none" />
          <path d={`M 2 ${hy - 13} q 6 1 12 -3`} strokeWidth={2.6} fill="none" />
        </>
      ) : null}
      {mouth()}
    </g>
  );
};

const runPose = (f: number) => ({
  legL: Math.sin(f / 3) * 34,
  legR: -Math.sin(f / 3) * 34,
  armL: -Math.sin(f / 3) * 30 - 10,
  armR: Math.sin(f / 3) * 30 + 10,
});

const Card: React.FC<{ x: number; y: number; r?: number; doodle?: string; s?: number }> = ({ x, y, r = 0, doodle, s = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>
    <rect x={-30} y={-21} width={60} height={42} rx={5} fill="#ffffff" stroke={INK} strokeWidth={3.4} />
    {doodle === "run" ? (
      <g stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <line x1={-4} y1={12} x2={-4} y2={-4} />
        <circle cx={-4} cy={-10} r={5} />
        <line x1={-4} y1={12} x2={-11} y2={18} />
        <line x1={-4} y1={12} x2={3} y2={18} />
        <line x1={-4} y1={2} x2={-12} y2={8} />
        <line x1={-4} y1={2} x2={5} y2={-2} />
      </g>
    ) : null}
    {doodle === "heart" ? <path d="M0 4 C-10 -6 -6 -14 0 -8 C6 -14 10 -6 0 4 Z" fill={RED} stroke="none" /> : null}
    {doodle === "star" ? <path d="M0 -11 L3 -3 L11 -3 L5 2 L7 10 L0 5 L-7 10 L-5 2 L-11 -3 L-3 -3 Z" fill={YEL} stroke="none" /> : null}
    {doodle === "clock" ? (
      <g stroke={INK} strokeWidth={2.2} fill="none">
        <circle cx={0} cy={0} r={9} />
        <line x1={0} y1={0} x2={0} y2={-6} />
        <line x1={0} y1={0} x2={5} y2={2} />
      </g>
    ) : null}
  </g>
);

const Marker: React.FC<{ d: string; color?: string }> = ({ d, color = RED }) => (
  <path d={d} stroke={color} strokeWidth={3.6} fill="none" strokeLinecap="round" opacity={0.85} />
);

// ---------- CLIP 1: Golden Hook ----------
const Scene1 = () => {
  const f = useCurrentFrame() / 5;
  const run = runPose(f);
  const x = interpolate(f, [0, 45], [-120, 520], { extrapolateRight: "clamp" });
  const zoom = interpolate(f, [44, 60], [1, 1.16]);
  const idx = Math.floor(f / 6) % 4;
  const flicker = f >= 18 && f < 42;
  const focalIn = interpolate(f, [8, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Audio src={staticFile("vo/vo1.mp3")} />
      <Sequence from={210}>
        <Audio src={staticFile("sfx/flip.wav")} volume={0.55} />
      </Sequence>
      <Sequence from={230}>
        <Audio src={staticFile("sfx/flip.wav")} volume={0.55} />
      </Sequence>
      <Sequence from={250}>
        <Audio src={staticFile("sfx/flip.wav")} volume={0.55} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: PAPER }}>
        <div style={{ opacity: focalIn }}>
          <Focal text="no camera filmed it." color={INK} />
          <Marker d="M392 210 q 190 -26 500 -6" />
        </div>
        <Cap text={f < 28 ? "Everything you just saw moved — yet no camera filmed it." : "Animation is just still images, flipped fast enough to fool your eyes."} />
        <svg viewBox="0 0 1280 720" style={{ width: 1280, height: 720, position: "absolute", top: 0 }}>
          <Grid />
          <g transform={`translate(880,430) scale(${zoom}) translate(-880,-430)`}>
            <GroundLine />
            <g>
              <rect x={810} y={470} width={160} height={92} rx={12} fill="#ffffff" stroke={RED} strokeWidth={5} />
              <circle cx={975} cy={512} r={26} fill={RED} />
              <rect x={830} y={444} width={52} height={28} rx={7} fill="#ffffff" stroke={RED} strokeWidth={5} />
              <line x1={838} y1={562} x2={828} y2={GROUND} stroke={INK} strokeWidth={4} />
              <line x1={945} y1={562} x2={952} y2={GROUND} stroke={INK} strokeWidth={4} />
            </g>
            {flicker ? (
              <g opacity={0.95}>
                <Marker d="M1012 428 q 20 -60 40 -120" color={INK} />
                <Card x={1080} y={250} r={10 - idx * 5} doodle={idx === 0 ? "run" : idx === 1 ? "heart" : idx === 2 ? "star" : "clock"} />
              </g>
            ) : null}
            {f >= 42 ? <Card x={1160} y={210} r={12} doodle="star" s={0.9} /> : null}
            <BStickman x={x} y={GR} {...run} expr={f > 40 ? "grin" : "effort"} />
          </g>
        </svg>
      </AbsoluteFill>
    </>
  );
};

// ---------- CLIP 2: Disrupting Assumptions ----------
const Scene2 = () => {
  const f = useCurrentFrame() / 5;
  const zoom = interpolate(f, [44, 60], [1, 1.14]);
  const shown = Math.min(30, Math.max(0, Math.floor((f - 16) * 1.8)));
  const orbit = (k: number) => {
    const a = ((f * 70 + k * 120) * Math.PI) / 180;
    return [640 + Math.cos(a) * 46, 340 + Math.sin(a) * 22] as const;
  };
  return (
    <>
      <Audio src={staticFile("vo/vo2.mp3")} />
      <AbsoluteFill style={{ backgroundColor: PAPER }}>
        <div style={{ opacity: f >= 16 ? 1 : 0 }}>
          <Focal text="30 photos / second" color={NAVY} y={68} />
        </div>
        <Cap text={f < 28 ? "We assume video captures motion." : "30 fps is 30 photos each second — the movement lives in your head."} />
        <svg viewBox="0 0 1280 720" style={{ width: 1280, height: 720, position: "absolute", top: 0 }}>
          <Grid />
          <g transform={`translate(640,400) scale(${zoom}) translate(-640,-400)`}>
            <GroundLine />
            {f < 10 ? <Card x={interpolate(f, [0, 10], [1180, 150])} y={interpolate(f, [0, 10], [180, 430])} r={12} doodle="star" s={0.9} /> : null}
            <line x1={110} y1={492} x2={1170} y2={492} stroke={INK} strokeWidth={4} strokeLinecap="round" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Card key={i} x={168 + i * 134 - ((f * 26) % 134)} y={458} doodle={i % 3 === 0 ? "run" : i % 3 === 1 ? "heart" : "star"} />
            ))}
            <path d="M 1130 512 L 1168 512 M 1155 504 L 1168 512 L 1155 520" stroke={INK} strokeWidth={3.6} fill="none" strokeLinecap="round" />
            <g>
                {Array.from({ length: shown }).map((_, i) => (
                  <rect key={i} x={647 + (i - 15) * 22} y={228} width={16} height={12} rx={2.5} fill="none" stroke={NAVY} strokeWidth={2.4} />
                ))}
                {shown > 0 ? (
                  <>
                    <line x1={310} y1={254} x2={970} y2={254} stroke={NAVY} strokeWidth={4.4} strokeLinecap="round" />
                    <Marker d="M 990 250 q 26 4 18 22" color={NAVY} />
                  </>
                ) : null}
              </g>
              <BStickman x={210} y={GR} {...runPose(f)} expr="effort" />
              {f >= 44 ? (
                <g>
                  <circle cx={640} cy={428} r={56} stroke={NAVY} strokeWidth={3.6} opacity={0.7} fill="none" />
                  <BStickman x={640} y={GR} armL={14} armR={-14} expr="surprise" />
                  {[0, 1, 2].map((k) => {
                    const a = ((f * 34 + k * 120) * Math.PI) / 180;
                    const ox = 640 + Math.cos(a) * 46;
                    const oy = 428 + Math.sin(a) * 24;
                    return <rect key={k} x={ox - 12} y={oy - 9} width={24} height={18} rx={2.5} fill="none" stroke={NAVY} strokeWidth={3.2} />;
                  })}
                </g>
              ) : null}
          </g>
        </svg>
      </AbsoluteFill>
    </>
  );
};

// placeholder removed inline orbit ring
// ---------- CLIP 3: Insider Secret ----------
const Scene3 = () => {
  const f = useCurrentFrame() / 5;
  const dial = f * 60;
  const presses = [16, 31, 46];
  const pressed = presses.some((p) => f >= p && f < p + 10);
  const pressY = pressed ? 26 : 0;
  const pop = (start: number) => interpolate(f, [start, start + 8, start + 26], [0, 1.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const focalIn = interpolate(f, [10, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Audio src={staticFile("vo/vo3.mp3")} />
      <Sequence from={80}>
        <Audio src={staticFile("sfx/stamp.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={155}>
        <Audio src={staticFile("sfx/stamp.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={230}>
        <Audio src={staticFile("sfx/stamp.wav")} volume={0.75} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: PAPER }}>
        <div style={{ opacity: focalIn }}>
          <Focal text="ƒ(frame) → picture" color={NAVY} y={100} />
          <Marker d="M 480 226 q 160 18 330 0" color={GREEN} />
        </div>
        <Cap text={f < 28 ? "Remotion's secret: time becomes a number." : "Every frame re-renders from one input — the frame number."} />
        <svg viewBox="0 0 1280 720" style={{ width: 1280, height: 720, position: "absolute", top: 0 }}>
          <Grid />
          <GroundLine />
          <circle cx={360} cy={420} r={108} stroke={NAVY} strokeWidth={6} fill="none" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={360 + Math.cos(a) * 96}
                y1={420 + Math.sin(a) * 96}
                x2={360 + Math.cos(a) * 108}
                y2={420 + Math.sin(a) * 108}
                stroke={NAVY}
                strokeWidth={3}
              />
            );
          })}
          <line x1={360} y1={420} x2={360 + Math.cos((dial * Math.PI) / 180) * 86} y2={420 + Math.sin((dial * Math.PI) / 180) * 86} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <circle cx={360} cy={420} r={9} fill={INK} />
          <rect x={300} y={314} width={120} height={44} rx={9} fill="#ffffff" stroke={INK} strokeWidth={3.4} />
          {Array.from({ length: (Math.floor(f / 15) % 4) + 1 }).map((_, i) => (
            <circle key={i} cx={326 + i * 24} cy={336} r={6} fill={NAVY} />
          ))}
          <line x1={600} y1={250} x2={600} y2={560} stroke={INK} strokeWidth={6} />
          <g transform={`translate(0,${pressY})`}>
            <line x1={600} y1={250} x2={700} y2={330} stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <rect x={676} y={330} width={52} height={38} rx={7} fill={INK} />
          </g>
          <Marker d="M 480 330 q 80 -30 118 -10" color={RED} />
          {[0, 1, 2].map((k) =>
            f >= presses[k] ? <Card key={k} x={interpolate(f, [presses[k], presses[k] + 20], [740, 880 + k * 60])} y={interpolate(f, [presses[k], presses[k] + 20], [350, 470])} s={pop(presses[k])} doodle={k === 0 ? "run" : k === 1 ? "heart" : "clock"} /> : null
          )}
          <BStickman x={270} y={GR} armR={80} armL={-20} legL={6} legR={-6} expr="smile" />
          <BStickman x={655} y={GR} armL={-86} armR={20} legL={-5} legR={5} lean={-3} expr="effort" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// ---------- CLIP 4: Mechanism ----------
const Scene4 = () => {
  const f = useCurrentFrame() / 5;
  const openL = interpolate(f, [15, 25], [1, 0.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const openR = interpolate(f, [31, 41], [1, 0.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stackCount = Math.max(1, Math.floor((f - 32) / 1.6));
  const pressY = f >= 32 ? 22 - 22 * Math.abs(Math.sin(f / 1.5)) : 0;
  const zoom = f >= 50 ? interpolate(f, [50, 60], [1, 1.12]) : 1;
  const buttonPress = f === 15 || (f >= 30 && f <= 33);
  const expr: Expr = f < 15 ? "surprise" : f < 31 ? "worried" : "proud";
  return (
    <>
      <Audio src={staticFile("vo/vo4.mp3")} />
      <Sequence from={160}>
        <Audio src={staticFile("sfx/stamp.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={200}>
        <Audio src={staticFile("sfx/stamp.wav")} volume={0.7} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: PAPER }}>
        <Focal text="900 frames, one by one" color={NAVY} y={104} />
        <Cap text={f < 28 ? "Studio preview runs live." : "Rendering writes each frame cold — a 30s clip means 900 renders."} />
        <svg viewBox="0 0 1280 720" style={{ width: 1280, height: 720, position: "absolute", top: 0 }}>
          <Grid />
          <g transform={`translate(640,400) scale(${zoom}) translate(-640,-400)`}>
            <GroundLine />
            <rect x={548} y={528} width={224} height={68} rx={12} fill="#ffffff" stroke={INK} strokeWidth={4} />
            <circle cx={600} cy={528} r={16} fill={buttonPress ? RED : "#ffffff"} stroke={RED} strokeWidth={4.6} />
            <circle cx={720} cy={528} r={16} fill={f >= 30 ? NAVY : "#ffffff"} stroke={NAVY} strokeWidth={4.6} />
            <BStickman x={660} y={GR} armL={f >= 12 ? -38 : 8} armR={f >= 12 ? 38 : -8} expr={expr} />
            {/* left door: live preview */}
            <rect x={180} y={230} width={260} height={370} rx={10} fill="#ffffff" stroke={RED} strokeWidth={5} />
            {f >= 15 ? (
              <g>
                <circle cx={270} cy={360} r={58} stroke={INK} strokeWidth={4} fill="none" />
                <line x1={270} y1={360} x2={270 + Math.cos(f * 11) * 44} y2={360 + Math.sin(f * 11) * 44} stroke={RED} strokeWidth={4.4} strokeLinecap="round" />
                <line x1={270} y1={360} x2={270} y2={328} stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={200 + k * 62} y={252} width={44} height={30} rx={5} fill={Math.floor(f * 2) % 3 === k ? "#ffffff" : "#fdeceb"} stroke={RED} strokeWidth={2.8} />
                ))}
              </g>
            ) : null}
            <rect x={180} y={230} width={f >= 15 ? 260 * openL : 260} height={370} rx={10} fill={PAPER} />
            <path d="M 184 232 L 184 598" stroke={RED} strokeWidth={5} strokeLinecap="round" />
            {/* right door: cold render */}
            <rect x={840} y={230} width={260} height={370} rx={10} fill="#ffffff" stroke={NAVY} strokeWidth={5} />
            {f >= 31 ? (
              <g>
                {Array.from({ length: Math.min(9, stackCount) }).map((_, i) => (
                  <rect key={i} x={950} y={516 - i * 42} width={80} height={34} rx={5} fill="#eef2f8" stroke={NAVY} strokeWidth={2.8} />
                ))}
                <g transform={`translate(0,${pressY})`}>
                  <line x1={895} y1={262} x2={995} y2={312} stroke={INK} strokeWidth={6} strokeLinecap="round" />
                  <rect x={968} y={310} width={56} height={30} rx={6} fill={INK} />
                </g>
              </g>
            ) : null}
            <rect x={840} y={230} width={f >= 31 ? 260 * openR : 260} height={370} rx={10} fill={PAPER} />
            <path d="M 844 232 L 844 598" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
          </g>
        </svg>
      </AbsoluteFill>
    </>
  );
};

// ---------- CLIP 5: Ultimate Truth ----------
const Scene5 = () => {
  const f = useCurrentFrame() / 5;
  const cols = [380, 640, 900];
  const count = (t: number) => Math.min(9, Math.max(0, Math.floor((t - 4) / 3)));
  const merge = f >= 44 ? interpolate(f, [44, 56], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const chipScale = interpolate(f, [48, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = f >= 56 ? interpolate(f, [56, 60], [0, 60]) : 0;
  return (
    <>
      <Audio src={staticFile("vo/vo5.mp3")} />
      <Sequence from={150}>
        <Audio src={staticFile("sfx/chime.wav")} volume={0.6} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: PAPER }}>
        <Focal text="deterministic." color={GREEN} y={100} />
        <Cap text={f < 28 ? "Same frame number — always the same picture." : "So your scene splits across machines. Boring reliability is the point."} />
        <svg viewBox="0 0 1280 720" style={{ width: 1280, height: 720, position: "absolute", top: 0 }}>
          <Grid />
          <GroundLine />
          {cols.map((cx, ci) => {
            const offsetX = merge ? (640 - cx) * merge : 0;
            return (
              <g key={ci} transform={`translate(${offsetX},0)`}>
                {Array.from({ length: count(f + ci * 4) }).map((_, i) => (
                  <rect key={i} x={cx - 42} y={520 - i * 40} width={84} height={32} rx={5} fill="#eef2f8" stroke={NAVY} strokeWidth={2.8} />
                ))}
                <line x1={cx - 60} y1={230} x2={cx - 60} y2={330} stroke={INK} strokeWidth={5} />
                <line x1={cx - 60} y1={230} x2={cx - 18} y2={270} stroke={INK} strokeWidth={5} strokeLinecap="round" />
              </g>
            );
          })}
          {f >= 30 && merge === 0 ? (
            <>
              <rect x={598} y={520 - count(f + 8) * 40 - 46} width={84} height={38} rx={5} fill="none" stroke={YEL} strokeWidth={5} />
              <rect x={598} y={520 - count(f + 8) * 40 - 46} width={84} height={38} rx={5} fill="none" stroke={YEL} strokeWidth={5} opacity={0.4} strokeDasharray="6 10" />
            </>
          ) : null}
          <Marker d="M 350 250 q 90 40 160 30" color={GREEN} />
          {f >= 46 ? (
            <g transform={`translate(640,${500 - lift}) scale(${chipScale})`}>
              <rect x={-62} y={-46} width={124} height={92} rx={16} fill="#ffffff" stroke={YEL} strokeWidth={6} />
              {Array.from({ length: 3 }).map((_, i) => (
                <rect key={i} x={-40 + i * 28} y={-28} width={22} height={56} rx={4} fill="none" stroke={GREEN} strokeWidth={3.2} />
              ))}
            </g>
          ) : null}
          <BStickman x={merge > 0.7 ? 810 : 690} y={GR} armL={f >= 56 ? -42 : 10} armR={f >= 56 ? 42 : -10} expr={f > 46 ? "proud" : "grin"} />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// ---------- CLIP 6: Elevation ----------
const Scene6 = () => {
  const f = useCurrentFrame() / 5;
  const strip = interpolate(f, [28, 48], [0, 1]);
  const walk = interpolate(f, [46, 60], [870, 1030], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const halo = 1 + 0.08 * Math.sin(f / 2);
  const focalIn = interpolate(f, [44, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Audio src={staticFile("vo/vo6.mp3")} />
      <Sequence from={60}>
        <Audio src={staticFile("sfx/chime.wav")} volume={0.6} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: PAPER }}>
        <div style={{ opacity: focalIn }}>
          <Focal text="code = camera?" color={INK} y={96} />
          <Marker d="M 470 232 q 170 26 340 2" color={YEL} />
        </div>
        <Cap text={f < 28 ? "Stop filming your idea — describe it in code." : "What would you film if code were the camera?"} />
        <svg viewBox="0 0 1280 720" style={{ width: 1280, height: 720, position: "absolute", top: 0 }}>
          <Grid />
          <GroundLine />
          {f >= 12
            ? Array.from({ length: 8 }).map((_, i) => {
                const a = ((i * 45 + f * 15) * Math.PI) / 180;
                return (
                  <rect
                    key={i}
                    x={640 + Math.cos(a) * 330 - 26}
                    y={430 + Math.sin(a) * 120 - 18}
                    width={52}
                    height={36}
                    rx={5}
                    fill="none"
                    stroke={NAVY}
                    strokeWidth={3}
                    opacity={Math.max(0.18, Math.sin(a))}
                  />
                );
              })
            : null}
          <g transform={`translate(640,${470 - 40}) scale(${halo})`}>
            <rect x={-52} y={-38} width={104} height={76} rx={14} fill="#ffffff" stroke={YEL} strokeWidth={5.6} />
            {Array.from({ length: 3 }).map((_, i) => (
              <rect key={i} x={-34 + i * 24} y={-22} width={18} height={44} rx={4} fill="none" stroke={GREEN} strokeWidth={3} />
            ))}
          </g>
          <g opacity={strip}>
            <path d={`M ${640 - 580 * strip} 634 q 290 -6 580 -3`} stroke={INK} strokeWidth={4} fill="none" />
            {Array.from({ length: Math.floor(1160 * strip / 70) }).map((_, i) => (
              <rect key={i} x={640 - 580 * strip + i * 70 + 20} y={622} width={30} height={11} rx={3} fill="none" stroke={INK} strokeWidth={2} />
            ))}
          </g>
          {f >= 46 ? (
            <g stroke={RED} strokeWidth={5.6} fill="none" strokeLinecap="round">
              <path d="M 268 300 q 0 -30 30 -30 q 30 0 30 30 q 0 20 -22 27 q -5 2 -5 11" />
              <circle cx={302} cy={382} r={4.6} fill={RED} stroke="none" />
              <path d="M 952 300 q 0 -30 30 -30 q 30 0 30 30 q 0 20 -22 27 q -5 2 -5 11" />
              <circle cx={986} cy={382} r={4.6} fill={RED} stroke="none" />
            </g>
          ) : null}
          <BStickman
            x={walk}
            y={GR}
            armL={f < 46 ? 190 : 9}
            armR={f < 46 ? -190 : -9}
            expr={f < 46 ? "proud" : "grin"}
            legL={f >= 46 ? runPose(f).legL : 0}
            legR={f >= 46 ? runPose(f).legR : 0}
          />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// ---------- timeline ----------
export const StickmanVideo = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <Sequence durationInFrames={300}>
      <Scene1 />
    </Sequence>
    <Sequence from={300} durationInFrames={300}>
      <Scene2 />
    </Sequence>
    <Sequence from={600} durationInFrames={300}>
      <Scene3 />
    </Sequence>
    <Sequence from={900} durationInFrames={300}>
      <Scene4 />
    </Sequence>
    <Sequence from={1200} durationInFrames={300}>
      <Scene5 />
    </Sequence>
    <Sequence from={1500} durationInFrames={300}>
      <Scene6 />
    </Sequence>
  </AbsoluteFill>
);
