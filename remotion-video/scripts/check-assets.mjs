// Task 1 gate: 18 Flow images @768x1376, loop VO6 (v3+v1 backup), 3 leveled SFX
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";

const PUB = new URL("../public/", import.meta.url).pathname;
let fails = [];
const check = (c, m) => { if (!c) fails.push(m); };
const probe = (f) => {
  try {
    return execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height",
      "-of", "csv=p=0", f], { encoding: "utf8" }).trim();
  } catch { return ""; }
};
const dur = (f) => {
  try {
    return parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "csv=p=0", f], { encoding: "utf8" }).trim());
  } catch { return NaN; }
};

// 1. exactly 18 images, right dimensions
const imgs = readdirSync(PUB + "cats").filter((f) => f.endsWith(".jpg"));
check(imgs.length === 18, `expected 18 jpgs, got ${imgs.length}: ${imgs.join(",")}`);
for (let n = 1; n <= 18; n++) {
  const f = `${PUB}cats/img-${String(n).padStart(2, "0")}.jpg`;
  if (!existsSync(f)) { fails.push(`missing ${f}`); continue; }
  check(probe(f) === "768,1376", `${f} dims: ${probe(f)}`);
}

// 2. VO6: v3 in place, v1 backed up
const d6 = dur(PUB + "vo/cats-06.mp3");
check(Math.abs(d6 - 10.824) < 0.01, `cats-06.mp3 = ${d6}s, want 10.824 (v3)`);
const d1 = dur(PUB + "vo/cats-06-v1.mp3");
check(Math.abs(d1 - 9.744) < 0.01, `cats-06-v1.mp3 = ${d1}s, want 9.744`);

// 3. three leveled SFX present and non-trivial
for (const s of ["hook-stamp", "whoosh", "seam-chime"]) {
  const f = `${PUB}sfx/${s}.wav`;
  check(existsSync(f) && statSync(f).size > 1000, `missing/too small: ${f}`);
}

if (fails.length) { console.error(fails.map((f) => " - " + f).join("\n")); process.exit(1); }
console.log("assets ok: 18 imgs 768x1376, VO6 v3=10.824s + v1 backup, 3 sfx");
