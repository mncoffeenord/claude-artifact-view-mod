"""Generate the plugin listing icon: an old scroll with the web globe badge.

Draws at 4x and downsamples with LANCZOS for smooth edges. Output is a square
1024x1024 PNG at .claude-plugin/icon.png (the path the plugin directory looks for).

Run from the repo root:  python assets/gen_icon.py
"""
import math
import os
from PIL import Image, ImageDraw

S = 4                      # supersample factor
N = 1024 * S               # working canvas
OUT = os.path.join(".claude-plugin", "icon.png")

SLATE = (43, 48, 59, 255)      # background
PARCH = (233, 216, 178, 255)   # parchment sheet
PARCH_DK = (201, 169, 106, 255)  # scroll rolls / edges
INK = (150, 120, 80, 255)      # faux text lines
GLOBE = (62, 139, 214, 255)    # web blue
WHITE = (255, 255, 255, 255)

img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def rr(box, radius, **kw):
    d.rounded_rectangle(box, radius=radius, **kw)


# --- rounded-square background ---
rr([0, 0, N - 1, N - 1], 190 * S, fill=SLATE)

# --- scroll sheet ---
cx = cy = 512 * S
sw, sh = 430 * S, 530 * S
sx0, sy0 = cx - sw // 2, cy - sh // 2
sx1, sy1 = cx + sw // 2, cy + sh // 2

# soft drop shadow
rr([sx0 + 14 * S, sy0 + 18 * S, sx1 + 14 * S, sy1 + 18 * S], 26 * S,
   fill=(0, 0, 0, 70))
# sheet
rr([sx0, sy0, sx1, sy1], 26 * S, fill=PARCH)

# faux text lines (a couple shortened for a hand-written look)
for i in range(6):
    ly = sy0 + 118 * S + i * 70 * S
    short = 120 * S if i in (2, 5) else 0
    rr([sx0 + 64 * S, ly, sx1 - 64 * S - short, ly + 16 * S], 8 * S, fill=INK)

# --- rolled ends (top and bottom curls) ---
roll_overhang = 44 * S
roll_h = 56 * S
for ry in (sy0, sy1 - roll_h):
    rr([sx0 - roll_overhang, ry, sx1 + roll_overhang, ry + roll_h],
       roll_h // 2, fill=PARCH_DK)
    # end caps
    for ex in (sx0 - roll_overhang, sx1 + roll_overhang - roll_h):
        d.ellipse([ex, ry, ex + roll_h, ry + roll_h], fill=PARCH)
        d.ellipse([ex, ry, ex + roll_h, ry + roll_h], outline=PARCH_DK,
                  width=10 * S)

# --- web globe badge, lower-right ---
gr = 196 * S
gcx, gcy = N - 288 * S, N - 288 * S
lw = 7 * S

# white ring to lift it off the scroll
d.ellipse([gcx - gr - 16 * S, gcy - gr - 16 * S, gcx + gr + 16 * S, gcy + gr + 16 * S],
          fill=WHITE)
# globe disc
d.ellipse([gcx - gr, gcy - gr, gcx + gr, gcy + gr], fill=GLOBE)
# outline
d.ellipse([gcx - gr, gcy - gr, gcx + gr, gcy + gr], outline=WHITE, width=lw)
# meridians (vertical ellipses + centre line)
for k in (0.56, 0.0):
    ew = gr * k
    if ew < 1:
        d.line([gcx, gcy - gr, gcx, gcy + gr], fill=WHITE, width=lw)
    else:
        d.ellipse([gcx - ew, gcy - gr, gcx + ew, gcy + gr], outline=WHITE, width=lw)
# parallels (chord lines)
for off in (-gr * 0.55, 0.0, gr * 0.55):
    dx = math.sqrt(max(0.0, gr * gr - off * off))
    d.line([gcx - dx, gcy + off, gcx + dx, gcy + off], fill=WHITE, width=lw)

# --- downsample and save ---
os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.resize((1024, 1024), Image.LANCZOS).save(OUT)
print("wrote", OUT)
