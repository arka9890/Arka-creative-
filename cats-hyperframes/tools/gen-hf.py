#!/usr/bin/env python3
"""Generate index.html for cats-hyperframes: VO-driven retention re-cut with loop seam.

Schedule is built from probed VO durations (ffprobe): 6 clips back-to-back with
0.12s gaps, 3 slides per clip, title collapsed into a 1.2s transparent overlay.
"""

import subprocess

VO = "/root/workspace/cats-hyperframes/assets/vo"
SFX = "/root/workspace/cats-hyperframes/assets/sfx"
OUT = "/root/workspace/cats-hyperframes/index.html"

GAP = 0.12   # silence between VO clips (s)
TR = 0.22    # transition (s)
TAIL = 0.30  # after last VO end (s) — seam chime lives here
N = 18

def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
    return float(out)

VO_DUR = [probe(f"{VO}/cats-0{i}.mp3") for i in range(1, 7)]
clip_start = [sum(VO_DUR[:k]) + k * GAP for k in range(6)]
TOTAL = clip_start[5] + VO_DUR[5] + TAIL

# (kenburns mode, caption) — static forced to zoom-in so no frame ever freezes
SLIDES = [
    ("zoom-in",  "Kill a cat, and you could be executed"),
    ("pan-up",   "So they wrapped it in linen"),
    ("zoom-in",  "and buried it like kings."),
    ("pan-right","Cats were never decoration."),
    ("zoom-in",  "The grain drew rats."),
    ("zoom-in",  "The cats ended the rats."),
    ("zoom-in",  "When a cat died, the household shaved its eyebrows"),
    ("zoom-in",  "Every last one"),
    ("pan-left", "if Herodotus was telling the truth."),
    ("pan-right","Then devotion became an industry."),
    ("zoom-in",  "Pilgrims bought cat mummies at Bubastis"),
    ("zoom-out", "as gifts for Bastet — priests supplied the demand."),
    ("zoom-in",  "Hundreds of thousands were sold."),
    ("zoom-in",  "Most were not pets but offerings"),
    ("zoom-in",  "letters to a goddess — bronze cats for the poor."),
    ("zoom-out", "The cat was never just loved."),
    ("zoom-in",  "Worshipped, farmed, and sold."),
    ("zoom-in",  "So — what happened if you killed one?"),
]

# gold keyword per slide (1-based); every word of the phrase gets .kw
KWS = ["executed", "linen", "kings", "decoration", "rats", "rats", "eyebrows",
       "last one", "Herodotus", "industry", "Bubastis", "Bastet",
       "Hundreds of thousands", "offerings", "goddess", "loved", "worshipped",
       "killed one"]

KB = {
    "zoom-in":  ("1.00", "1.07", "0",   "0"),
    "zoom-out": ("1.09", "1.00", "0",   "0"),
    "pan-up":   ("1.09", "1.09", "2.5", "-2.5"),
    "pan-right":("1.09", "1.09", "-2.5","2.5"),
    "pan-left": ("1.09", "1.09", "2.5", "-2.5"),
}

TITLE_WORDS = ["The", "Cats", "They", "Wrapped", "Like", "Kings"]

def f(t):  # seconds with 3 decimals, trims trailing zeros
    s = f"{t:.3f}".rstrip("0").rstrip(".")
    return s if s else "0"

def words_html(cap, kw):
    """Split caption into word spans; keyword words get gold .kw."""
    kwset = {w.strip(".,—?!").lower() for w in kw.split()}
    out = []
    for w in cap.split(" "):
        cls = "kw w" if w.strip(".,—?!").lower() in kwset else "w"
        esc = w.replace("&", "&amp;").replace("<", "&lt;")
        out.append(f'<span class="{cls}">{esc}</span>')
    return " ".join(out)

slides_html, caps_html, tl_js = [], [], []

for i, (mode, cap) in enumerate(SLIDES, 1):
    k, j = (i - 1) // 3, (i - 1) % 3          # clip index, slot index in clip
    S = VO_DUR[k] / 3                          # slide slot = clip window / 3
    t0 = clip_start[k] + j * S                 # slot start
    t_in = t0 - TR if i > 1 else t0
    is_last = (i == N)
    t_end = TOTAL if is_last else (t0 + S)     # last slide holds through the tail
    src = f"assets/img/img-{i:02d}.jpg"
    slides_html.append(f'''
    <div class="clip slide" id="s{i}" data-start="{f(t_in)}" data-duration="{f(t_end - t_in)}" data-track-index="0">
      <img class="bg" src="{src}" alt="">
      <img class="fg" src="{src}" alt="">
      <div class="grad"></div>
    </div>''')

    caps_html.append(f'''
    <div class="clip cap" id="cap{i}" data-start="{f(t0)}" data-duration="{f(t_end - t0)}" data-track-index="1">
      <div class="cap-text">{words_html(cap, KWS[i - 1])}</div>
      <div class="cap-rule" id="r{i}"></div>
    </div>''')

    # --- timeline: slide i ---
    if i > 1:   # slide 1 opens at full frame (replay must never dip to black)
        tl_js.append(f'tl.fromTo("#s{i}", {{xPercent: 100}}, {{xPercent: 0, duration: {f(TR)}, ease: "none"}}, {f(t_in)});')
    if not is_last:  # last slide holds (loop seam pairs with slide 1's zoom-in)
        t_out = t0 + S - TR
        tl_js.append(f'tl.to("#s{i}", {{xPercent: -100, duration: {f(TR)}, ease: "none"}}, {f(t_out)});')
        tl_js.append(f'tl.to("#s{i}", {{filter: "brightness(0.6)", duration: {f(TR)}, ease: "none"}}, {f(t_out)});')

    # punch-in burst at the beat (own properties, never overlapping transition windows)
    tl_js.append(f'tl.fromTo("#s{i}", {{scale: 1}}, {{scale: 1.05, duration: 0.12, ease: "power2.out"}}, {f(t0 + 0.18)});')
    tl_js.append(f'tl.to("#s{i}", {{scale: 1, duration: 0.22, ease: "power2.inOut"}}, {f(t0 + 0.30)});')

    # ken burns on fg + bg (bg has extra 1.3 base like the Remotion original)
    ks, ke, ty0, ty1 = KB[mode]
    if mode in ("pan-up", "pan-right", "pan-left"):
        prop = "yPercent" if mode == "pan-up" else "xPercent"
        tl_js.append(f'tl.fromTo("#s{i} .fg", {{scale: {ks}, {prop}: {ty0}}}, {{scale: {ke}, {prop}: {ty1}, duration: {f(S)}, ease: "none"}}, {f(t0)});')
        tl_js.append(f'tl.fromTo("#s{i} .bg", {{scale: 1.3*{ks}, {prop}: {ty0}}}, {{scale: 1.3*{ke}, {prop}: {ty1}, duration: {f(S)}, ease: "none"}}, {f(t0)});')
    else:
        tl_js.append(f'tl.fromTo("#s{i} .fg", {{scale: {ks}}}, {{scale: {ke}, duration: {f(S)}, ease: "none"}}, {f(t0)});')
        tl_js.append(f'tl.fromTo("#s{i} .bg", {{scale: 1.3*{ks}}}, {{scale: 1.3*{ke}, duration: {f(S)}, ease: "none"}}, {f(t0)});')

    # caption: word-pop stagger + rule; container stays put
    tl_js.append(f'tl.fromTo("#cap{i} .w", {{scale: 0.9, y: 12, opacity: 0}}, {{scale: 1, y: 0, opacity: 1, duration: 0.25, stagger: 0.04, ease: "power3.out"}}, {f(t0 + 0.05)});')
    tl_js.append(f'tl.fromTo("#r{i}", {{scaleX: 0}}, {{scaleX: 1, duration: 0.53, ease: "power2.out"}}, {f(t0 + 0.2)});')
    tl_js.append(f'tl.to("#cap{i}", {{opacity: 0, duration: 0.2, ease: "none"}}, {f(t0 + S - 0.2)});')

# title → transparent overlay on slide 1 (hook chip lands at 0.55s)
for i, w in enumerate(TITLE_WORDS):
    tl_js.append(f'tl.fromTo("#w{i}", {{opacity: 0, y: 34}}, {{opacity: 1, y: 0, duration: 0.45, ease: "power2.out"}}, {f(0.10 + i * 0.08)});')
tl_js.append('tl.fromTo("#tsub", {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: 0.35, ease: "power2.out"}, 0.55);')
tl_js.append('tl.fromTo("#trule", {scaleX: 0}, {scaleX: 1, duration: 0.45, ease: "power2.out"}, 0.75);')
tl_js.append('tl.to("#title", {opacity: 0, duration: 0.2, ease: "none"}, 1.0);')

words_html_title = "\n        ".join(
    f'<span id="w{i}" class="tw">{w}</span>' for i, w in enumerate(TITLE_WORDS))

vo_audios = "\n    ".join(
    f'<audio id="vo-{k + 1}" class="clip" data-start="{f(clip_start[k])}" '
    f'data-duration="{f(VO_DUR[k] + 0.05)}" data-track-index="2" '
    f'src="assets/vo/cats-0{k + 1}.mp3"></audio>'
    for k in range(6))

sfx = [("sfx-stamp", "hook-stamp.wav", 0.0)]
sfx += [(f"sfx-whoosh-{k}", "whoosh.wav", clip_start[k]) for k in range(1, 6)]
# chime must fit inside root: start so it ends exactly at the loop cut
_sfx_chime_pd = probe(f"{SFX}/seam-chime.wav")
sfx += [("sfx-chime", "seam-chime.wav", TOTAL - (_sfx_chime_pd + 0.05))]
sfx_audios = "\n    ".join(
    f'<audio id="{sid}" class="clip" data-start="{f(t)}" '
    f'data-duration="{f(probe(f"{SFX}/{fn}") + 0.05)}" data-track-index="3" '
    f'src="assets/sfx/{fn}"></audio>'
    for sid, fn, t in sfx)

html = f'''<!doctype html>
<html lang="en" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      :root {{ --ground: #0b0906; --ink: #fffdf5; --gold: #e8b04b; --font-display: 'DejaVu Sans', Arial, sans-serif; }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: var(--ground); }}
      #root {{ position: relative; width: 100%; height: 100%; font-family: var(--font-display); background: var(--ground); }}
      .slide {{ position: absolute; inset: 0; overflow: hidden; }}
      .slide .bg {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(46px) brightness(0.42); }}
      .slide .fg {{ position: absolute; top: 410px; left: 90px; width: 900px; height: 900px; object-fit: cover;
                    border-radius: 6px; box-shadow: 0 18px 60px rgba(0,0,0,0.55); }}
      .slide .grad {{ position: absolute; inset: 0; background: linear-gradient(to bottom,
          rgba(8,6,3,0.35) 0%, rgba(8,6,3,0) 22%, rgba(8,6,3,0) 62%, rgba(8,6,3,0.55) 86%, rgba(8,6,3,0.6) 100%); }}
      .cap {{ position: absolute; top: 1440px; left: 70px; right: 70px; text-align: center; }}
      .cap-text {{ font-size: 52px; line-height: 1.3; font-weight: 700; color: #fffdf5; text-shadow: 0 2px 12px rgba(0,0,0,0.9); }}
      .cap .w {{ display: inline-block; }}
      .cap .kw {{ color: var(--gold); }}
      .cap-rule {{ height: 5px; width: 62%; margin: 20px auto 0; border-radius: 3px; transform-origin: center;
                   background: linear-gradient(90deg, #e8b04b, #f7dfae, #e8b04b); }}
      #title {{ position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center;
                align-items: center; }}
      #twords {{ display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; padding: 0 70px; max-width: 92%; text-align: center; }}
      .tw {{ font-size: 118px; font-weight: 800; line-height: 1.12; color: var(--ink);
             display: inline-block; text-shadow: 0 6px 26px rgba(0,0,0,0.92), 0 2px 8px rgba(0,0,0,0.8); }}
      #trule {{ height: 6px; width: 420px; margin-top: 34px; border-radius: 3px; transform-origin: center;
                background: linear-gradient(90deg, #e8b04b, #f7dfae, #e8b04b); box-shadow: 0 2px 10px rgba(0,0,0,0.6); }}
      #tsub {{ margin-top: 30px; font-size: 40px; font-weight: 700; letter-spacing: 0.1em; color: var(--ink);
               text-transform: uppercase; text-align: center; padding: 14px 34px; border: 3px solid var(--gold);
               border-radius: 999px; background: rgba(11,9,6,0.72); text-shadow: 0 2px 8px rgba(0,0,0,0.9); }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{f(TOTAL)}" data-width="1080" data-height="1920">
{"".join(slides_html)}

{"".join(caps_html)}

      <div id="title" class="clip" data-start="0" data-duration="1.2" data-track-index="1">
        <div id="twords">
        {words_html_title}
        </div>
        <div id="trule"></div>
        <div id="tsub">KILL A CAT? YOU'D BE EXECUTED</div>
      </div>

    {vo_audios}
    {sfx_audios}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      {chr(10).join("      " + s for s in tl_js)}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
'''

open(OUT, "w").write(html)
print(f"written: {N} slides, total {TOTAL:.3f}s, {len(tl_js)} tweens, "
      f"vo starts {[round(s,3) for s in clip_start]}")
