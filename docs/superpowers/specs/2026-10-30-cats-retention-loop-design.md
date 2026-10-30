# Design — "Cats They Wrapped Like Kings": aggressive retention re-cut + seamless VO loop

Date: 2026-10-30 · Status: **approved** (2026-10-30, with stretch target) · Approach: **2 (aggressive re-edit)**

## Intent

Turn the existing 62.5s HyperFrames slideshow into a high-retention Shorts loop: hook inside the
first second, fast beat-locked motion, and a narratively seamless loop so the replay is invisible
and re-watches count as retention.

## Goals

- **Retention target: ≥ 80% average viewed.** Any legitimate strategy is in scope; the levers are:
  sub-second hook, pattern interrupts every ~5–7s (motion/SFX/caption changes), open loops in the
  copy (each section ends on curiosity), captions always animating (sound-off retention), no static
  frame ever held > ~2s without motion, and the seamless replay loop (re-watches count double).

- Hook lands < 1.0s (currently buried behind a 2.5s title card at t=2.5).
- Seamless **narrative** loop: the last VO sentence flows literally into the first.
- 18 Flow images (`flow-laptop/numbered/img-01..18.jpg`) replace the stale set in `assets/img/`.
- Punch-in zooms, word-pop captions with gold keyword highlights, tasteful SFX on key beats.
- `npm run check` green; every animation seek-safe and deterministic.

## Non-goals / anti-goals

- No re-record of VO clips 1–5 (only clip 6 is regenerated), no new images, no video generation.
- No Remotion changes (that comparison render comes later).
- Not busy-for-busy's-sake: SFX on ~6–8 moments, not every cut.

## Constraints

- VO drives timing: clips `cats-01..06` total 57.2s, natural lengths 9.0–9.8s each.
- HyperFrames rules: `data-start`+duration on every timed element, `class="clip"`, one paused
  root GSAP timeline, deterministic only (no Date/random/network).
- edge-tts `en-US-ChristopherNeural` rate +8% for the regenerated clip (matches clips 5–6).
- Composition regenerated via `/tmp/opencode/gen-hf.py` (owns the slide/caption/timeline math).

## Approaches considered

1. **Tight re-cut (light)** — VO at t=0, title overlay, loop craft, no extra effects.
2. **Aggressive re-edit (chosen)** — everything in (1), plus punch-in zooms at keyword beats,
   word-by-word caption pops + gold keyword highlight, SFX (existing `flip/stamp/chime.wav`),
   faster-feeling cut rhythm.
3. Remotion-first — rejected (user asked for HyperFrames).

Trade-off: (2) is more code and more ways to break the seek-safe contract, but VO length caps how
fast cuts can actually get — so motion/word-pop energy is where the extra speed comes from.

## The how

1. **Timeline rebuilt from VO**: clips placed back-to-back from t=0 (sum 57.2s + ~0.3s tail ≈ 57.5s
   total). 3 slides per clip; slide cuts split each clip slot evenly and land on VO boundaries.
2. **Title → overlay**: "THE CATS THEY WRAPPED LIKE KINGS" appears as kinetic overlay over slide 1
   (0–1.0s) combined with a hook chip ("Killed a cat? You'd be executed.") — no separate title
   screen; title card element removed.
3. **Loop seam**:
   - Regenerate `cats-06`: keeps the first 3 sentences, final question becomes
     "So — what happened if you killed one?" which flows directly into clip 1's
     "Kill a cat in ancient Egypt, and you could be executed."
   - Caption #18 matches the new line; video ends the instant VO 6 ends (no dead tail).
   - Final transition into slide 1 uses the same left-push + continuing zoom so the replay cut
     reads as continuous motion.
4. **Retention motion**: per-slide zoom continues; punch-in scale bursts (1.0→1.12 quick) at
   keyword beats; captions split into word spans, staggered pop-in (~40ms stagger), key words in
   gold; slide transitions shortened to ~0.22s.
5. **SFX**: `stamp.wav` on hook, `flip.wav` on the 5 inter-clip cuts, `chime.wav` on the loop seam
   (copied to `assets/sfx/`).
6. **Assets**: sync Flow images; regenerate `index.html` with `gen-hf.py` updated for all of the
   above; `npm run check`; snapshot key moments (0.3s, 10s, 30s, 56s, seam) and review frames;
   render MP4.

## Open to the owner

- The regenerated closing line wording (draft above) — change it if you want different phrasing.
