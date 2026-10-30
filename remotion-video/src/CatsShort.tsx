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
import {
  TITLE_F,
  TR_F,
  SLIDE_START_F,
  SLIDE_DUR_F,
  CLIP_START_F,
  VO_AUDIO_F,
  TOTAL_F,
  STAMP_START_F,
  STAMP_FRAMES,
  WHOOSH_START_F,
  WHOOSH_FRAMES,
  CHIME_START_F,
  CHIME_AUDIO_F,
} from "./catsSchedule";

// Retention re-cut, content-identical to the HyperFrames cut
// (source of truth for content: cats-hyperframes/tools/gen-hf.py).
// Schedule comes from probed VO durations — see scripts/probe-schedule.mjs.

const TRANS = TR_F;
const IMG_TOP = 410;
const IMG_BOX = 900;
const CAPTION_TOP = 1440;
const GOLD = "#e8b04b";
const INK = "#fffdf5";
const GROUND = "#0b0906";
const OUT_EASE = {easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

type Mode = "zoom-in" | "zoom-out" | "pan-up" | "pan-right" | "pan-left";

type SlideSpec = {mode: Mode; cap: string; kw: string};

const SLIDES: SlideSpec[] = [
  {mode: "zoom-in",   cap: "Kill a cat, and you could be executed", kw: "executed"},
  {mode: "pan-up",    cap: "So they wrapped it in linen", kw: "linen"},
  {mode: "zoom-in",   cap: "and buried it like kings.", kw: "kings"},
  {mode: "pan-right", cap: "Cats were never decoration.", kw: "decoration"},
  {mode: "zoom-in",   cap: "The grain drew rats.", kw: "rats"},
  {mode: "zoom-in",   cap: "The cats ended the rats.", kw: "rats"},
  {mode: "zoom-in",   cap: "When a cat died, the household shaved its eyebrows", kw: "eyebrows"},
  {mode: "zoom-in",   cap: "Every last one", kw: "last one"},
  {mode: "pan-left",  cap: "if Herodotus was telling the truth.", kw: "Herodotus"},
  {mode: "pan-right", cap: "Then devotion became an industry.", kw: "industry"},
  {mode: "zoom-in",   cap: "Pilgrims bought cat mummies at Bubastis", kw: "Bubastis"},
  {mode: "zoom-out",  cap: "as gifts for Bastet — priests supplied the demand.", kw: "Bastet"},
  {mode: "zoom-in",   cap: "Hundreds of thousands were sold.", kw: "Hundreds of thousands"},
  {mode: "zoom-in",   cap: "Most were not pets but offerings", kw: "offerings"},
  {mode: "zoom-in",   cap: "letters to a goddess — bronze cats for the poor.", kw: "goddess"},
  {mode: "zoom-out",  cap: "The cat was never just loved.", kw: "loved"},
  {mode: "zoom-in",   cap: "Worshipped, farmed, and sold.", kw: "worshipped"},
  {mode: "zoom-in",   cap: "So — what happened if you killed one?", kw: "killed one"},
];

const TITLE_WORDS = ["The", "Cats", "They", "Wrapped", "Like", "Kings"];

// Ken Burns, same motion table as the HyperFrames cut (no static mode exists)
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
  }
};

// Punch-in burst on the beat: 1 -> 1.05 over f5.4..9, back to 1 by f16
const punchScale = (f: number): number => {
  if (f <= 5.4) return 1;
  if (f < 9) return interpolate(f, [5.4, 9], [1, 1.05], OUT_EASE);
  return interpolate(f, [9, 16], [1.05, 1],
    {easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp"});
};

const Slide: React.FC<{index: number; mode: Mode; frames: number; first: boolean; last: boolean}> = ({
  index, mode, frames, first, last,
}) => {
  const f = useCurrentFrame();

  const inProgress = first ? 0 : f < TRANS ? 1 - f / TRANS : 0;
  const outStart = first ? frames - TRANS : frames;
  const outProgress = !last && f >= outStart ? Math.min((f - outStart) / TRANS, 1) : 0;

  const x = inProgress * 100 - outProgress * 100;
  const dim = 1 - 0.4 * outProgress;
  const kb = interpolate(f, [0, Math.max(frames - 1, 1)], [0, 1], {extrapolateRight: "clamp"});
  const src = staticFile(`cats/img-${String(index + 1).padStart(2, "0")}.jpg`);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: GROUND,
        transform: `translateX(${x}%) scale(${punchScale(f)})`,
        filter: `brightness(${dim})`,
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
          left: 90,
          width: IMG_BOX,
          height: IMG_BOX,
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

const Caption: React.FC<{text: string; kw: string; frames: number}> = ({text, kw, frames}) => {
  const f = useCurrentFrame();
  const outP = interpolate(f, [frames - 6, frames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rule = interpolate(f, [6, 22], [0, 1], OUT_EASE);
  const kwSet = new Set(kw.split(" ").map((w) => w.replace(/[.,—?!]/g, "").toLowerCase()));

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: CAPTION_TOP,
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: 1 - outP,
        }}
      >
        <div
          style={{
            fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 52,
            lineHeight: 1.3,
            fontWeight: 700,
            color: INK,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          {text.split(" ").map((w, i) => {
            const t = 1.5 + i * 1.2;
            const p = interpolate(f, [t, t + 7.5], [0, 1], {
              easing: Easing.out(Easing.poly(4)),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const gold = kwSet.has(w.replace(/[.,—?!]/g, "").toLowerCase());
            return (
              <span
                key={`${i}-${w}`}
                style={{
                  display: "inline-block",
                  color: gold ? GOLD : undefined,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 12}px) scale(${0.9 + 0.1 * p})`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        <div
          style={{
            height: 5,
            width: `${rule * 62}%`,
            margin: "20px auto 0",
            background: `linear-gradient(90deg, ${GOLD}, #f7dfae, ${GOLD})`,
            borderRadius: 3,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const TitleOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [30, TITLE_F], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rule = interpolate(f, [22.5, 36], [0, 1], OUT_EASE);
  const chip = interpolate(f, [16.5, 27], [0, 1], OUT_EASE);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        opacity: fade,
      }}
    >
      <div
        style={{
          fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 118,
          fontWeight: 800,
          lineHeight: 1.12,
          color: INK,
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "0 70px",
          textAlign: "center",
          maxWidth: "92%",
          textShadow: "0 6px 26px rgba(0,0,0,0.92), 0 2px 8px rgba(0,0,0,0.8)",
        }}
      >
        {TITLE_WORDS.map((w, i) => {
          const t = 3 + i * 2.4;
          const p = interpolate(f, [t, t + 13.5], [0, 1], OUT_EASE);
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
          background: `linear-gradient(90deg, ${GOLD}, #f7dfae, ${GOLD})`,
          borderRadius: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
        }}
      />
      <div
        style={{
          marginTop: 30,
          fontFamily: "'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: INK,
          opacity: chip,
          transform: `translateY(${(1 - chip) * 16}px)`,
          textTransform: "uppercase",
          textAlign: "center",
          padding: "14px 34px",
          border: `3px solid ${GOLD}`,
          borderRadius: 999,
          background: "rgba(11,9,6,0.72)",
          textShadow: "0 2px 8px rgba(0,0,0,0.9)",
        }}
      >
        Kill a cat? You'd be executed
      </div>
    </AbsoluteFill>
  );
};

export const CatsShort: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: GROUND}}>
      {SLIDES.map((s, i) => {
        const first = i === 0;
        const last = i === SLIDES.length - 1;
        const from = first ? 0 : SLIDE_START_F[i] - TRANS;
        const dur = last ? TOTAL_F - from : SLIDE_DUR_F[i] + (first ? 0 : TRANS);
        return (
          <Sequence key={`s${i}`} from={from} durationInFrames={dur}>
            <Slide index={i} mode={s.mode} frames={SLIDE_DUR_F[i]} first={first} last={last} />
          </Sequence>
        );
      })}

      {SLIDES.map((s, i) => (
        <Sequence key={`c${i}`} from={SLIDE_START_F[i]} durationInFrames={SLIDE_DUR_F[i]}>
          <Caption text={s.cap} kw={s.kw} frames={SLIDE_DUR_F[i]} />
        </Sequence>
      ))}

      <Sequence from={0} durationInFrames={TITLE_F}>
        <TitleOverlay />
      </Sequence>

      {CLIP_START_F.map((start, k) => (
        <Sequence key={`vo${k}`} from={start} durationInFrames={VO_AUDIO_F[k]}>
          <Audio src={staticFile(`vo/cats-0${k + 1}.mp3`)} />
        </Sequence>
      ))}

      <Sequence from={STAMP_START_F} durationInFrames={STAMP_FRAMES}>
        <Audio src={staticFile("sfx/hook-stamp.wav")} />
      </Sequence>
      {WHOOSH_START_F.map((start, k) => (
        <Sequence key={`wh${k}`} from={start} durationInFrames={WHOOSH_FRAMES}>
          <Audio src={staticFile("sfx/whoosh.wav")} />
        </Sequence>
      ))}
      <Sequence from={CHIME_START_F} durationInFrames={CHIME_AUDIO_F}>
        <Audio src={staticFile("sfx/seam-chime.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};
