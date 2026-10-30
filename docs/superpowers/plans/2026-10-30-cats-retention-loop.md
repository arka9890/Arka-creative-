# Cats Retention Loop (HyperFrames) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-cut the 18-slide cats-hyperframes composition into an aggressive, beat-locked Shorts edit with a sub-second hook and a narratively seamless end→start VO loop, targeting ≥80% average viewed.

**Architecture:** `/tmp/opencode/gen-hf.py` is the single source of truth that emits `index.html` (markup + GSAP timeline). The re-edit = rewrite that generator: VO-clip-driven timing (probed with ffprobe), title collapsed into a 1.2s overlay + hook chip, word-pop captions with gold keywords, one punch-in per slide, SFX clips on hook/clip-boundaries/seam. One VO clip (`cats-06`) is regenerated with edge-tts to bridge the loop.

**Tech Stack:** HyperFrames CLI (pinned 0.8.216), HTML/CSS/GSAP (seek-safe tweens only), Python 3 generator, edge-tts (en-US-ChristopherNeural +8%), ffmpeg/ffprobe.

**Spec:** `docs/superpowers/specs/2026-10-30-cats-retention-loop-design.md`

## Global Constraints

- Retention target ≥80%: hook visible <1.0s, no static frame >~2s, pattern interrupt (cut/punch/SFX) every ≤5-7s.
- Loop seam: new `cats-06` ends "So — what happened if you killed one?" and must flow into clip 1's "Kill a cat in ancient Egypt…". Video ends the instant VO6 ends (tail ≤0.35s of silence).
- Every timed element: `data-start` + `data-duration` + `class="clip"`; one paused root GSAP timeline on `window.__timelines["main"]`; deterministic only.
- Two GSAP tweens must never animate the same property of the same element in overlapping time windows (punch lives on `#s{i}` container, Ken Burns on `#s{i} .fg/.bg`, transition on `#s{i}` xPercent/opacity — these three properties never overlap in time on one element).
- VO clips 1-5 unchanged; images = the 18 Flow files; captions stay English; SFX from `remotion-video/public/sfx/`.
- `npm run check` must pass before any render.

## Review Focus

- **Audio cut-off:** HyperFrames clips silence anything past `data-duration` — each `<audio>` duration must be its probed file length +0.05s, else the last word clips. → Pinned in Task 3 step: assert generated `data-duration >= probed+0.05` for all 6 clips (script check).
- **Loop seam dead-air:** if VO6 regen comes back longer than 10s it blows the 3-slides-per-clip mapping — → Task 2 asserts `≤9.9s`, else regenerate at +10% rate.
- **Word-pop vs lint:** caption `<span>` rewording can break lint's text/contrast checks — → Task 4 runs `npm run check` and treats errors as blockers; snapshots in Task 5 prove legibility.
- **SFX balance:** raw WAVs can drown the VO — → Task 1 measures `volumedetect` and rewrites them at -18dB peak; Task 5 frame/audio render review confirms.
- **First-frame hook:** if slide 1 fades in from opacity 0 the replay dips — → Task 3 removes s1's initial fade; Task 5 snapshots t=0.0 proves full visibility.

---

### Task 1: Asset prep (Flow images, SFX levels, hyperframes skill)

**Files:**
- Modify: `cats-hyperframes/assets/img/img-01..18.jpg` (overwrite)
- Create: `cats-hyperframes/assets/sfx/{hook-stamp,whoosh,seam-chime}.wav`
- Read: hyperframes skill installed by `npx hyperframes skills update` (AGENTS.md requirement)

**Interfaces:**
- Produces: 18 images at 768×1376 in `assets/img/`; three leveled SFX wavs at `assets/sfx/`.

- [ ] **Step 1: Install/refresh hyperframes skills, read the core contract + audio docs**

```bash
cd /root/workspace/cats-hyperframes && npx hyperframes skills update
npx hyperframes docs data-attributes   # note the audio volume attribute if any
```
Expected: skill files present; docs output captured (use its volume attr name in Step 4 if it exists).

- [ ] **Step 2: Copy the 18 Flow images over `assets/img/`**

```bash
for n in $(seq -w 1 18); do cp /root/workspace/flow-laptop/numbered/img-$n.jpg /root/workspace/cats-hyperframes/assets/img/img-$n.jpg; done
python3 -c "from PIL import Image; import glob; fs=sorted(glob.glob('/root/workspace/cats-hyperframes/assets/img/*.jpg')); assert len(fs)==18 and all(Image.open(f).size==(768,1376) for f in fs), fs; print('18 imgs ok')"
```
Expected: `18 imgs ok`.

- [ ] **Step 3: Copy + level the three SFX**

Source: `/root/workspace/remotion-video/public/sfx/{stamp,flip,chime}.wav` → `assets/sfx/{hook-stamp,whoosh,seam-chime}.wav`.
Measure each with `ffmpeg -i f.wav -af volumedetect -f null -` (note `max_volume`), then rewrite with `-af volume=<X>dB` so `max_volume` lands at **-18 dB** (X = -18 − measured). Re-measure after.

Expected: all three report `max_volume: -18.0 dB` (±0.5).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "assets: flow images + leveled sfx for retention re-cut"
```

---

### Task 2: Regenerate `cats-06.mp3` with the loop-bridging line

**Files:**
- Create: `cats-and-mummies/vo6-loop.txt` (the exact line)
- Modify: `cats-hyperframes/assets/vo/cats-06.mp3` (replace; back up old to `assets/vo/cats-06-v1.mp3`)
- Modify: `cats-and-mummies/vo-script.md` (append v3 line)

**Interfaces:**
- Produces: `assets/vo/cats-06.mp3`, duration ≤9.9s, ends on the bridge sentence.

- [ ] **Step 1: Write the exact VO6 line**

Text (pinned): `The cat was never just loved. It was worshipped, farmed, and sold. Devotion, mass-produced. So — what happened if you killed one?`

- [ ] **Step 2: Synthesize with edge-tts and check duration**

```bash
python3 -c "import asyncio,edge_tts; asyncio.run(edge_tts.Communicate(open('vo6-loop.txt').read(),'en-US-ChristopherNeural',rate='+8%').save('cats-06-new.mp3'))"
ffprobe -v error -show_entries format=duration -of csv=p=0 cats-06-new.mp3
```
Expected: ≤9.9s. If >9.9s, retry at rate `+10%` (loop until ≤9.9s).

- [ ] **Step 3: Swap in + record in vo-script.md, commit**

`cp cats-06-new.mp3 assets/vo/cats-06.mp3` (old saved as `cats-06-v1.mp3`); append v3 note to `vo-script.md`; commit `feat(vo): loop-bridging closing line`.

---

### Task 3: Rewrite `gen-hf.py` → retention timeline

**Files:**
- Modify: `/tmp/opencode/gen-hf.py` (full rewrite of timing/layout sections, keep emit structure)
- Output: `cats-hyperframes/index.html`

**Interfaces:**
- Consumes: `assets/vo/cats-01..06.mp3`, `assets/img/`, `assets/sfx/`.
- Produces: `index.html` with total = Σ durations + 5×0.12 gaps + 0.30 tail.

**Pinned design values:**
- Schedule: `clip_start[k] = Σ dur[0..k-1] + k*0.12`, probed via `ffprobe -show_entries format=duration`. `TOTAL = clip_start[5] + dur[5] + 0.30`.
- Slides: 3 per clip; slide slot = clip window split in 3; transitions `TR = 0.22` (all cuts, in and out).
- Title → overlay `#title data-duration="1.2"`, **no background fill** (transparent, sits over slide 1), word stagger 0.08s, rule at 0.75s; `#tsub` text = `KILL A CAT? YOU'D BE EXECUTED` (the hook chip) at 0.55s; overlay fades 1.0→1.2s.
- Slide 1: **no initial opacity fade** (replay must open on a full frame).
- Captions: text split into `<span class="w">` per word, pop-in stagger **0.04s/word** (scale 0.9→1, y 12→0, `power3.out`, 0.25s each) starting at slot start +0.05; gold `<span class="kw">` for the pinned keyword list below; rule animation unchanged.
- Caption copy for slides 16-18 (clip 6): `The cat was never just loved.` / `Worshipped, farmed, and sold.` / `So — what happened if you killed one?`
- Keyword list per slide (index 1-based): 1 `executed`, 2 `linen`, 3 `kings`, 4 `decoration`, 5 `rats`, 6 `rats`, 7 `eyebrows`, 8 `last one`, 9 `Herodotus`, 10 `industry`, 11 `Bubastis`, 12 `Bastet`, 13 `Hundreds of thousands`, 14 `offerings`, 15 `goddess`, 16 `loved`, 17 `worshipped`, 18 `killed one`.
- Punch-in: per slide at slot start +0.18, `tl.fromTo("#s{i}", {scale:1}, {scale:1.05, duration:0.12, ease:"power2.out"})` then `tl.to("#s{i}", {scale:1, duration:0.22, ease:"power2.inOut"}, slot+0.30)` — never overlapping the xPercent transition windows (transition occupies slot−0.22..slot+0.0), so punch window starts ≥0.18 after slot start.
- Ken Burns: keep existing `KB` modes cycling (`zoom-in, pan-up, zoom-in, pan-right, zoom-in, static` …) — no static slide left; force mode `static` entries → `zoom-in` so nothing freezes (Global Constraint).
- SFX `<audio class="clip" data-track-index="3">`: `hook-stamp` @0.00, `whoosh` @ each of the 5 clip starts, `seam-chime` @ `TOTAL-0.35`. Durations = probed lengths +0.05.
- VO `<audio>` data-start = clip_start, data-duration = probed +0.05.
- Last slide: keep hold (no exit); Ken Burns on s18 and s1 both `zoom-in` so motion direction matches across the replay cut.

- [ ] **Step 1: Rewrite generator per pinned values**

- [ ] **Step 2: Run it; assert schedule integrity**

```bash
python3 /tmp/opencode/gen-hf.py
```
Then a python check: parses emitted `index.html`, asserts for each of the 6 `<audio>` VO clips `float(data-duration) >= probed(file)+0.05`, asserts `data-duration` root == TOTAL, asserts exactly 18 slides + 18 captions, asserts `#title` duration == 1.2, asserts SFX count == 7. Print `schedule ok`.

- [ ] **Step 3: Commit** `feat(composition): vo-driven retention timeline with loop seam`.

---

### Task 4: `npm run check` green

- [ ] **Step 1:** `cd cats-hyperframes && npm run check`
- [ ] **Step 2:** Fix every ERROR (warnings: review & accept consciously); re-run until green. Expected: `0 errors`.
- [ ] **Step 3:** Commit fixes if any.

---

### Task 5: Visual/audio verification by snapshot

**Files:** snapshots under `.hyperframes/` or CLI-chosen output dir.

- [ ] **Step 1:** `npx hyperframes snapshot --at 0,0.5,3,16,34,57` (tune last to TOTAL−0.5).
- [ ] **Step 2: Read every frame** and verify: t=0 full-brightness slide 1 + title words mid-pop + hook chip visible by 0.55; captions word-popped with gold keyword; no empty/black frame anywhere; last frame shows s18 (replay-pair to t=0).
- [ ] **Step 3:** If any fail → fix generator → regenerate → re-check → re-snapshot (loop).

---

### Task 6: Render + final verification

- [ ] **Step 1:** `npm run render`
- [ ] **Step 2: Verify output**: `ffprobe` MP4 → video duration ≈ TOTAL (±0.1s), has audio stream; extract first & last video frames (`ffmpeg -sseof -0.1 …`), confirm last frame ≠ black and visually rhymes with frame 1 (same motion direction noted).
- [ ] **Step 3:** Confirm loop-seam timing: total audio duration equals video duration (no dead tail >0.35s) via `ffprobe` on both streams.
- [ ] **Step 4:** Commit render artifact policy: MP4 stays untracked (repo hygiene) unless user wants it committed; commit any generator/check fixes.

---

## Notes for executor

- `UV_LINK_MODE=copy` and `export npm_config_cache=/tmp/opencode/npm-cache` + `HYPERFRAMES_BROWSER_PATH=/root/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome` in every shell (env facts).
- procps is broken: kill via `/proc/[0-9]*/cmdline` scan + `kill -9`.
- Retention ≥80% is a live-platform metric — this plan pins every offline proxy (sub-second hook, ≤5-7s interrupts, zero dead air, seamless loop); actual % comes from YouTube Analytics after publish.
