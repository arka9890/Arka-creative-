// Task 2 gate: generated schedule matches an independent ffprobe recompute + invariants.
// Parses src/catsSchedule.ts textually (no TS runtime needed).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const VO = ROOT + "public/vo/";
const FPS = 30, GAP_F = 4, TAIL_F = 9, NCLIP = 6, NSLIDE = 18;

let fails = [];
const check = (c, m) => { if (!c) fails.push(m); };
const dur = (f) => parseFloat(execFileSync("ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
  { encoding: "utf8" }).trim());

// --- parse generated file + Root wiring (RED: file missing -> clean failure)
let src = "";
try { src = readFileSync(ROOT + "src/catsSchedule.ts", "utf8"); }
catch { fails.push("src/catsSchedule.ts missing"); }

const arr = (name) => {
  const m = src.match(new RegExp(`export const ${name} = \\[([^\\]]*)\\]`));
  if (!m) { fails.push(`array ${name} missing`); return null; }
  return m[1].split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
};
const num = (name) => {
  const m = src.match(new RegExp(`export const ${name} = (\\d+)`));
  if (!m) { fails.push(`number ${name} missing`); return null; }
  return Number(m[1]);
};

const durSec = [], durF = arr("CLIP_DUR_F"), startF = arr("CLIP_START_F"),
  audioF = arr("VO_AUDIO_F"), slideStart = arr("SLIDE_START_F"), slideDur = arr("SLIDE_DUR_F");
const TOTAL_F = num("TOTAL_F");
for (let k = 1; k <= NCLIP; k++) durSec.push(dur(`${VO}cats-0${k}.mp3`));

if (!fails.length) {
  // 1. clip frame counts == round(sec*30) exactly
  durSec.forEach((d, k) =>
    check(durF[k] === Math.round(d * FPS), `durF[${k}]=${durF[k]} != round(${d}*30)=${Math.round(d * FPS)}`));
  // 2. audio slots never shorter than real media (no truncation)
  audioF.forEach((a, k) =>
    check(a >= durSec[k] * FPS, `VO_AUDIO_F[${k}]=${a} < media ${durSec[k] * FPS}f -> truncation`));
  // 3. gaps survive rounding
  for (let k = 0; k < NCLIP - 1; k++) {
    const g = startF[k + 1] - (startF[k] + durF[k]);
    check(g >= 3, `gap[${k}]=${g}f < 3f`);
  }
  // 4. total + short-form budget
  check(TOTAL_F === startF[NCLIP - 1] + durF[NCLIP - 1] + TAIL_F,
    `TOTAL_F=${TOTAL_F} != ${startF[NCLIP - 1] + durF[NCLIP - 1] + TAIL_F}`);
  check(TOTAL_F < 1800, `TOTAL_F=${TOTAL_F} >= 1800f (60s)`);
  // 5. slide slots: 3 per clip, monotonic, clip windows closed
  check(slideStart.length === NSLIDE && slideDur.length === NSLIDE,
    `slide arrays ${slideStart?.length}/${slideDur?.length} != 18`);
  if (slideStart.length === NSLIDE) {
    for (let k = 0; k < NCLIP; k++) {
      const b = [0, 1, 2].map((j) => startF[k] + Math.round(j * durF[k] / 3));
      for (let j = 0; j < 3; j++) {
        const i = k * 3 + j;
        check(slideStart[i] === b[j], `slideStart[${i}]=${slideStart[i]} != ${b[j]}`);
        check(slideStart[i] + slideDur[i] === (j === 2 ? startF[k] + durF[k] : b[j + 1]),
          `slide window ${i} does not close`);
        check(slideStart[i] >= startF[k] && slideStart[i] + slideDur[i] <= startF[k] + durF[k],
          `slide ${i} outside clip ${k}`);
      }
    }
  }
  // 6. SFX: whoosh at clip starts 1..5, stamp at 0, chime ends exactly at root end
  const whoosh = arr("WHOOSH_START_F");
  if (whoosh) whoosh.forEach((s, k) =>
    check(s === startF[k + 1], `whoosh[${k}]=${s} != clip start ${startF[k + 1]}`));
  check(num("STAMP_START_F") === 0, "stamp not at 0");
  const chimeS = num("CHIME_START_F"), chimeF = num("CHIME_AUDIO_F");
  if (chimeS !== null && chimeF !== null)
    check(chimeS + chimeF === TOTAL_F, `chime ends ${chimeS + chimeF} != ${TOTAL_F}`);
  // 7. Root.tsx drives duration from the generated file
  const root = readFileSync(ROOT + "src/Root.tsx", "utf8");
  check(/import\s*{\s*TOTAL_F\s*}\s*from\s*"\.\/catsSchedule"/.test(root) &&
        /durationInFrames=\{TOTAL_F\}/.test(root),
    "Root.tsx does not use TOTAL_F from catsSchedule");
}

if (fails.length) { console.error(fails.map((f) => " - " + f).join("\n")); process.exit(1); }
console.log(`schedule ok: TOTAL_F=${TOTAL_F} (${(TOTAL_F / FPS).toFixed(3)}s), 6 clips, 18 slides`);
