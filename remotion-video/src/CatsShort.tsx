import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";
import React from "react";

// CatsSlideshow versi 9:16 murni (1080x1920) untuk YouTube Shorts / TikTok.
// Timeline, VO, dan caption identik dengan versi 16:9; stills 16:9 diletakkan
// di atas full-bleed blur supaya kanvas vertikal penuh, tanpa bar hitam.

const SLIDE = 75;
const TRANS = 10;
const TITLE = 75;
const SHIFT = TITLE;
const CLIP = 300;
const IMG_W = 1080;
const IMG_H = 608;
const IMG_TOP = 540;
const CAPTION_TOP = 1240;

type Mode = "zoom-in" | "zoom-out" | "pan-up" | "pan-right" | "pan-left" | "static";

const SLIDES: {n: number; mode: Mode; cap: string}[] = [
  {n: 1, mode: "zoom-in", cap: "In ancient Egypt, one animal could get you executed"},
  {n: 2, mode: "zoom-in", cap: "and then wrapped in linen"},
  {n: 3, mode: "pan-up", cap: "and buried like a king."},
  {n: 4, mode: "zoom-out", cap: "That animal was the cat."},
  {n: 5, mode: "pan-right", cap: "We picture cosy pets on cushions,"},
  {n: 6, mode: "zoom-in", cap: "but cats were not decoration."},
  {n: 7, mode: "static", cap: "They guarded the grain that kept Egypt alive,"},
  {n: 8, mode: "zoom-out", cap: "and they earned a goddess."},
  {n: 9, mode: "zoom-in", cap: "Grain stores drew rats."},
  {n: 10, mode: "static", cap: "Cats ended the rats."},
  {n: 11, mode: "pan-left", cap: "So when a cat died, the household"},
  {n: 12, mode: "zoom-in", cap: "shaved its eyebrows in mourning — if we trust Herodotus."},
  {n: 13, mode: "pan-right", cap: "Then devotion became an industry."},
  {n: 14, mode: "static", cap: "Pilgrims traveled to Bubastis"},
  {n: 15, mode: "zoom-in", cap: "and bought cat mummies as gifts for Bastet,"},
  {n: 16, mode: "zoom-out", cap: "the cat-headed goddess. Breeders supplied the demand."},
  {n: 17, mode: "zoom-in", cap: "Hundreds of thousands were made,"},
  {n: 18, mode: "static", cap: "and most were not pets but offerings,"},
  {n: 19, mode: "zoom-in", cap: "letters to a goddess."},
  {n: 20, mode: "pan-up", cap: "Bronze cats were offered too, when money was tight."},
  {n: 21, mode: "zoom-out", cap: "So the cat was never just loved."},
  {n: 22, mode: "static", cap: "It was worshipped, farmed, and sold."},
  {n: 23, mode: "zoom-in", cap: "If devotion can be mass-produced,"},
  {n: 24, mode: "static", cap: "was it still devotion? Would you have bought one?"},
];

const kenBurns = (mode: Mode, p: number): string => {
  switch (mode) {
    case "zoom-in":
      return `scale(${interpolate(p, [0, 1], [1, 1.07])})`;
    case "zoom-out":
      return `scale(${interpolate(p, [0, 1], [1.09, 1])})`;
    case "pan-up":
      return `scale(1.09) translateY(${interpolate(p, [0, 1], [2.5, -2.5])}%)`;
    case "pan-right":
      return `scale(1.09) translateX(${interpolate(p, [0, 1], [-2.5, 2.5])}%)`;
    case "pan-left":
      return `scale(1.09) translateX(${interpolate(p, [0, 1], [2.5, -2.5])}%)`;
    default:
      return "scale(1.03)";
  }
};

const Slide: React.FC<{n: number; mode: Mode; index: number}> = ({n, mode, index}) => {
  const frame = useCurrentFrame();
  const first = index === 0;

  const inProgress = first ? 0 : frame < TRANS ? 1 - frame / TRANS : 0;
  const outStart = first ? SLIDE - TRANS : SLIDE;
  const outProgress = frame >= outStart ? Math.min((frame - outStart) / TRANS, 1) : 0;

  const x = inProgress * 100 - outProgress * 100;
  const dim = 1 - 0.4 * outProgress;
  const enter = first ? interpolate(frame, [0, 8], [0, 1], {extrapolateRight: "clamp"}) : 1;
  const kb = interpolate(frame, [0, SLIDE - 1], [0, 1], {extrapolateRight: "clamp"});
  const src = staticFile(`cats/img-${String(n).padStart(2, "0")}.jpg`);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: "#0b0906",
        transform: `translateX(${x}%)`,
        filter: `brightness(${dim})`,
        opacity: enter,
      }}
    >
      <Img
        src={src}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(1.3) ${kenBurns(mode, kb)}`,
          filter: "blur(46px) brightness(0.42)",
        }}
      />
      <Img
        src={src}
        style={{
          position: "absolute",
          top: IMG_TOP,
          left: 0,
          width: IMG_W,
          height: IMG_H,
          objectFit: "cover",
          transform: kenBurns(mode, kb),
          borderRadius: 6,
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,6,3,0.35) 0%, rgba(8,6,3,0) 22%, rgba(8,6,3,0) 62%, rgba(8,6,3,0.55) 86%, rgba(8,6,3,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Caption: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const outP = interpolate(frame, [SLIDE - 6, SLIDE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rule = interpolate(frame, [6, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: CAPTION_TOP,
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: inP * (1 - outP),
          transform: `translateY(${(1 - inP) * 26}px)`,
        }}
      >
        <div
          style={{
            fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 52,
            lineHeight: 1.3,
            fontWeight: 700,
            color: "#fffdf5",
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          {text}
        </div>
        <div
          style={{
            height: 5,
            width: `${rule * 62}%`,
            margin: "20px auto 0",
            background: "linear-gradient(90deg, #e8b04b, #f7dfae, #e8b04b)",
            borderRadius: 3,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const words = ["The", "Cats", "They", "Wrapped", "Like", "Kings"];
  const out = interpolate(frame, [TITLE - 9, TITLE], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rule = interpolate(frame, [34, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const sub = interpolate(frame, [44, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0906",
        justifyContent: "center",
        alignItems: "center",
        opacity: out,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(232,176,75,0.18), rgba(11,9,6,0) 58%)",
        }}
      />
      <div
        style={{
          fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 118,
          fontWeight: 800,
          lineHeight: 1.12,
          color: "#fffdf5",
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "0 70px",
          textAlign: "center",
          maxWidth: "92%",
        }}
      >
        {words.map((w, i) => {
          const t = 6 + i * 4;
          const p = interpolate(frame, [t, t + 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          return (
            <span
              key={w}
              style={{
                opacity: p,
                transform: `translateY(${(1 - p) * 34}px)`,
                display: "inline-block",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div
        style={{
          height: 6,
          width: `${rule * 420}px`,
          marginTop: 34,
          background: "linear-gradient(90deg, #e8b04b, #f7dfae, #e8b04b)",
          borderRadius: 3,
        }}
      />
      <div
        style={{
          marginTop: 30,
          fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: "0.14em",
          color: "#f0dcb6",
          opacity: sub,
          transform: `translateY(${(1 - sub) * 16}px)`,
          textTransform: "uppercase",
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        Ancient Egypt · Bubastis · 600–300 BCE
      </div>
    </AbsoluteFill>
  );
};

export const CatsShort: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "#0b0906"}}>
      <Sequence from={0} durationInFrames={TITLE}>
        <TitleCard />
      </Sequence>

      {SLIDES.map((s, i) => {
        const from = SHIFT + (i === 0 ? 0 : i * SLIDE - TRANS);
        const dur = i === 0 ? SLIDE : SLIDE + TRANS;
        return (
          <Sequence key={`s${s.n}`} from={from} durationInFrames={dur}>
            <Slide n={s.n} mode={s.mode} index={i} />
          </Sequence>
        );
      })}

      {SLIDES.map((s, i) => (
        <Sequence key={`c${s.n}`} from={SHIFT + i * SLIDE} durationInFrames={SLIDE}>
          <Caption text={s.cap} />
        </Sequence>
      ))}

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Sequence key={`vo${i}`} from={SHIFT + i * CLIP}>
          <Audio src={staticFile(`vo/cats-0${i + 1}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
