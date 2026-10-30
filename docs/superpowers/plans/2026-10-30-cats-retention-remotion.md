# Cats Retention — Remotion Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the approved retention re-cut to `remotion-video`'s `CatsShort` with content IDENTICAL to the shipped HyperFrames cut (18 Flow images, 18-caption script, VO6 v3 loop, −18dB SFX), rendering to `out/cats-shorts-retention.mp4` for a renderer-vs-renderer judgment.

**Architecture:** `scripts/probe-schedule.mjs` ffprobes `public/vo/cats-0*.mp3` and emits `src/catsSchedule.ts` (frame constants, fps 30). `Root.tsx` imports its total duration. `CatsShort.tsx` is reworked in place: variable-slot Sequences (3 slides per clip), title→1.2s transparent overlay + hook chip, word-pop captions with the pinned keyword list, punch-in per slide, forced-animated Ken Burns, VO/SFX audio Sequences.

**Tech Stack:** Remotion 4.0.539 (fps 30, 1080×1920), React/TS, Node ESM scripts, ffprobe. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-30-cats-retention-remotion-design.md` (parent: `2026-10-30-cats-retention-loop-design.md` — all levers/values inherited from it)

## Global Constraints

- Content parity: captions 1–18, keyword list, title words, chip text, KB modes (statics forced zoom-in), SFX placement — copied verbatim from the HyperFrames generator `cats-hyperframes/tools/gen-hf.py` (read it as the content source of truth).
- Deterministic only (no Date/random/network at render), every timed element a `<Sequence>` with integer `from`/`durationInFrames`, audio slots always ≥ real media length (else Remotion truncates).
- Pinned frame math (fps 30): gap G=4f (0.133s), TAIL=9f (0.30s), TR=7f (0.233s), TITLE=36f (1.2s). Expected schedule: durF = [294, 289, 270, 277, 293, 325] (round(dur·30)), startF = [0, 298, 591, 865, 1146, 1443], TOTAL_F = 1777 (59.233s < 60s). audioF = ceil((dur+0.05)·30) = [296, 291, 272, 279, 295, 327].
- Baseline artifacts untouchable: `out/cats-shorts-9x16.mp4` must not change; never `git add out/` (check gitignore/tracked state first).
- Render env: `npm_config_cache=/tmp/opencode/npm-cache`. procps broken (no pkill/ps — scan /proc). Preflight: zero chrome processes before rendering (contention stalled the last render).

## Review Focus

- **Silent integer truncation:** gap 0.12s = 3.6f → rounds to 4f; audio slots use ceil — → Task 2 `check-schedule.mjs` asserts slots ≥ media·30 read from its OWN ffprobe run, gaps ≥3f, TOTAL exact.
- **Caption/audio mismatch on the loop line:** captions 16–18 must match VO6 v3 text — → Task 3 copies them verbatim from gen-hf.py; Task 5 frame at ~58.7s reads them back.
- **Root duration drift:** Root.tsx hardcodes 1875 today — → Task 2 makes Root import `TOTAL_F` from `catsSchedule.ts`; check asserts the import exists.
- **TS/JSX breakage:** big component rework — → Task 3 gate: `npx tsc --noEmit` + `npx remotion compositions` must list CatsShort.
- **First/last frame regression:** first slide must NOT fade in; last slide holds to TOTAL_F — → Task 5 extracts frame 0 and last frame from the MP4 and reads them.

---

### Task 1: Asset prep (Flow images, VO6 v3, leveled SFX)

**Files:**
- Replace: `remotion-video/public/cats/img-01..18.jpg`; Delete: `img-19..24.jpg`
- Replace: `remotion-video/public/vo/cats-06.mp3` (backup old → `cats-06-v1.mp3`)
- Create: `remotion-video/public/sfx/{hook-stamp,whoosh,seam-chime}.wav` (copy from `cats-hyperframes/assets/sfx/`)

- [ ] **Step 1: Sync assets**

```bash
cd /root/workspace/remotion-video
for n in $(seq -w 1 18); do cp /root/workspace/flow-laptop/numbered/img-$n.jpg public/cats/img-$n.jpg; done
rm -f public/cats/img-{19,20,21,22,23,24}.jpg
cp public/vo/cats-06.mp3 public/vo/cats-06-v1.mp3
cp /root/workspace/cats-hyperframes/assets/vo/cats-06.mp3 public/vo/cats-06.mp3
mkdir -p public/sfx && cp /root/workspace/cats-hyperframes/assets/sfx/{hook-stamp,whoosh,seam-chime}.wav public/sfx/
```

- [ ] **Step 2: Verify** — write `remotion-video/scripts/check-assets.mjs`: 18 jpgs at 768×1376 (read JPEG SOF via sharp? No — no deps: assert count+filesize>10KB and dimension via ffprobe `image2` or `ffprobe -show_entries stream=width,height`), `cats-06.mp3` = 10.824s, v1 backup = 9.744s, 3 wavs present. RED first (run before copying? assets already partially… run against expected end state — it fails before Step 1, passes after).
- [ ] **Step 3: Commit** `assets(remotion): flow images + loop VO6 + leveled sfx for retention port` — stage only `remotion-video/public` + docs.

---

### Task 2: Schedule generator + invariant test (TDD)

**Files:**
- Create: `remotion-video/scripts/check-schedule.mjs` (the test)
- Create: `remotion-video/scripts/probe-schedule.mjs`
- Create: `remotion-video/src/catsSchedule.ts` (generated)
- Modify: `remotion-video/src/Root.tsx` (CatsShort `durationInFrames={TOTAL_F}` import)

- [ ] **Step 1: RED** — `check-schedule.mjs` asserts, reading `src/catsSchedule.ts` + its own ffprobe of `public/vo/cats-0*.mp3`:
  1. 6 clips: startF/durF/audioF arrays present; `durF[k] == round(durSec·30)` (±0 exact);
  2. `audioF[k] >= durSec·30` (no truncation) and audio slot start+audioF ≤ TOTAL_F for VO (chime exempt at boundary by design: chime end == TOTAL_F exactly);
  3. gaps: `startF[k+1] - (startF[k]+durF[k]) >= 3`;
  4. `TOTAL_F == startF[5]+durF[5]+9` and `TOTAL_F < 1800`;
  5. slide starts: 6 clips × 3 slots, monotonic inside clip windows;
  6. `Root.tsx` imports durationInFrames from `catsSchedule`.
  Run → must FAIL (file missing).
- [ ] **Step 2: GREEN** — write `probe-schedule.mjs` (spawns ffprobe, computes per pinned formulas, writes `src/catsSchedule.ts` with arrays + TOTAL_F + SFX constants: stamp@0, whoosh@startF[1..5], chime@TOTAL_F−chimeAudioF), update Root.tsx, run check → `schedule ok`.
- [ ] **Step 3: Commit** `feat(remotion): ffprobe-driven frame schedule with loop tail`.

---

### Task 3: Rework `CatsShort.tsx`

**Files:**
- Modify: `remotion-video/src/CatsShort.tsx`

**Pinned behavior** (content copied from `cats-hyperframes/tools/gen-hf.py`):
- SLIDES: the 18 (mode, caption) pairs from the generator; KWS: the pinned 18-entry keyword list; TITLE_WORDS + chip `KILL A CAT? YOU'D BE EXECUTED`.
- Structure: no TitleCard Sequence → `TitleOverlay` (36f, transparent, words at f 3+i·2.4 dur 13.5, chip f16.5 dur 10.5, rule f22.5 dur 13.5, fade f30→36, chip style gold border pill).
- Slides: Sequence per slide from slot-start−TR (slide 1 from 0, last slide duration to TOTAL_F); Slide local-frame: push in/out TR=7f (first: no in-fade; last: no out), dim on out, punch scale 1→1.05 over f5.4→9 then →1 over f9→16, KB `local/(frames−1)`, bg KB base scale 1.3.
- Captions: Sequence from slot-start, dur slot; word spans, pop `t_i = 1.5 + i·1.2` dur 7.5 (scale .9→1, y12→0, opacity), gold `.kw`, rule f6→22, out at `frames−6..frames`.
- Audio: VO Sequences startF[k]/audioF[k]; SFX Sequences (duration = ceil((pd+0.05)·30)): stamp@0, whoosh×5, chime@TOTAL_F−chimeAudioF.
- Caption 16/17/18 = generator's texts (loop line verbatim).
- [ ] **Step 1:** Rewrite component per pins.
- [ ] **Step 2: Gate** — `npx tsc --noEmit` clean; `npx remotion compositions` lists `CatsShort` (bundles the project). Fix until green.
- [ ] **Step 3: Commit** `feat(remotion): retention re-cut with loop seam` .

---

### Task 4: Render + artifact verification

- [ ] **Step 1:** preflight `/proc` scan — kill stray chrome if any (never match own cmdline: filter on `/proc/<pid>/exe` → chrome). `npx remotion render CatsShort out/cats-shorts-retention.mp4`
- [ ] **Step 2: Verify** — `scripts/check-render.mjs` (or shell): ffprobe duration == TOTAL_F/30 ±0.1, audio stream present == video duration, 1080×1920; extract frame 0, t=0.9, t=58.9, last frame → **read them** (hook legible, no black, loop caption gold).
- [ ] **Step 3: Commit** any fixes; MP4 stays untracked.

---

### Task 5: Final review + report

- [ ] **Step 1:** fresh-subagent review of `git diff` for this plan's commits (contract: Sequences integer, determinism, audio slots, baseline untouched, content parity vs gen-hf.py).
- [ ] **Step 2:** one fix pass (Critical/Important → RED→GREEN; Minor → ledger).
- [ ] **Step 3:** report to owner: side-by-side file paths (old vs new), rulings, deferred minors.

---

## Notes for executor

- `src/Root.tsx` has many compositions — touch ONLY the CatsShort entry.
- Remotion first render may download its headless browser (network OK); if download fails, `--browser-executable=/root/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome`.
- The HyperFrames generator `cats-hyperframes/tools/gen-hf.py` is the content source of truth — captions/keywords/timing values come from there, not from the old CatsShort.
- git: stage explicit paths only (`remotion-video/...`, `docs/superpowers/...`); repo root has unrelated untracked user files.
