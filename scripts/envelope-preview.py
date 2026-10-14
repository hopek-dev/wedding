"""Draws the WhatsApp link-preview picture: the closed envelope guests see when they open their invitation,
using the same colours and proportions as src/components/rsvp/envelope.css.

    python scripts/envelope-preview.py public/couple/envelope-og.jpg

It is 1200 x 630 (the size link previews use). The envelope is kept narrower than 630 px so the small square
WhatsApp cuts from the middle of the picture still shows all of it. Drawn at 3x and scaled down for crisp edges."""
import sys, os, io
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else "public/couple/envelope-og.jpg"
K = 3                      # draw at 3x, then shrink
CW, CH = 1200 * K, 630 * K
PAPER = (255, 255, 236)    # the site's cream, #ffffec

W = 580 * K                # envelope width
H = int(W * 0.66)          # same shape as the real envelope
X0 = (CW - W) // 2
Y0 = (CH - H) // 2 - 6 * K

def lerp(c1, c2, t): return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def gradient(size, c1, c2, angle_deg):
    w, h = size
    a = np.deg2rad(angle_deg)
    ys, xs = np.mgrid[0:h, 0:w]
    # CSS-style angle: 180deg = top to bottom, 90deg = left to right
    dx, dy = np.sin(a), -np.cos(a)
    t = ((xs - w / 2) * dx + (ys - h / 2) * dy) / (abs(w * dx) + abs(h * dy) + 1e-9) + 0.5
    t = np.clip(t, 0, 1)[..., None]
    arr = np.array(c1)[None, None, :] * (1 - t) + np.array(c2)[None, None, :] * t
    return Image.fromarray(arr.astype("uint8"), "RGB")

def poly_layer(points, c1, c2, angle):
    """A gradient-filled polygon on an envelope-sized transparent layer (points are fractions of W, H)."""
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon([(int(px * W), int(py * H)) for px, py in points], fill=255)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(gradient((W, H), c1, c2, angle), (0, 0), mask)
    return layer

canvas = Image.new("RGB", (CW, CH), PAPER)

# soft shadow under the envelope
sh = Image.new("L", (CW, CH), 0)
ImageDraw.Draw(sh).rounded_rectangle((X0 + 10 * K, Y0 + 34 * K, X0 + W - 10 * K, Y0 + H + 22 * K), radius=14 * K, fill=120)
sh = sh.filter(ImageFilter.GaussianBlur(26 * K))
canvas.paste(Image.new("RGB", (CW, CH), (118, 106, 52)), (0, 0), sh.point(lambda v: int(v * 0.42)))

env = Image.new("RGBA", (W, H), (0, 0, 0, 0))
# back of the envelope
back = Image.new("RGBA", (W, H), (0, 0, 0, 0))
m = Image.new("L", (W, H), 0)
ImageDraw.Draw(m).rounded_rectangle((0, 0, W - 1, H - 1), radius=4 * K, fill=255)
back.paste(Image.new("RGB", (W, H), (226, 220, 171)), (0, 0), m)
env.alpha_composite(back)
# the pocket: left and right panels and the bottom panel, meeting just below the middle
env.alpha_composite(poly_layer([(0, 0), (0.52, 0.57), (0, 1)], (224, 218, 167), (232, 226, 180), 100))
env.alpha_composite(poly_layer([(1, 0), (0.48, 0.57), (1, 1)], (224, 218, 167), (232, 226, 180), 260))
env.alpha_composite(poly_layer([(0, 1), (0.5, 0.54), (1, 1)], (235, 230, 186), (228, 222, 173), 180))
# a faint shadow where the flap lies on the pocket
fs = Image.new("L", (W, H), 0)
ImageDraw.Draw(fs).polygon([(0, 0), (W, 0), (W // 2, int(H * 0.60))], fill=90)
fs = fs.filter(ImageFilter.GaussianBlur(7 * K))
shade = Image.new("RGBA", (W, H), (96, 86, 40, 0)); shade.putalpha(fs.point(lambda v: int(v * 0.55)))
env.alpha_composite(shade)
# the flap
env.alpha_composite(poly_layer([(0, 0), (1, 0), (0.5, 0.58)], (241, 237, 199), (230, 224, 178), 180))
# keep everything inside the rounded rectangle
clip = Image.new("L", (W, H), 0)
ImageDraw.Draw(clip).rounded_rectangle((0, 0, W - 1, H - 1), radius=4 * K, fill=255)
a = env.getchannel("A"); env.putalpha(Image.composite(a, Image.new("L", (W, H), 0), clip))
canvas.paste(env.convert("RGB"), (X0, Y0), env.getchannel("A"))

# the seal, at the tip of the flap
fonts = "src/app/rsvp/[token]/fonts"
def ttf_from_woff(name):
    from fontTools.ttLib import TTFont
    path = os.path.join(fonts, name); f = TTFont(path); f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0); return buf
sx, sy = X0 + W // 2, Y0 + int(H * 0.58)
R = int(W * 0.085)
seal = Image.new("RGBA", (R * 2 + 40 * K, R * 2 + 40 * K), (0, 0, 0, 0))
cx = cy = R + 20 * K
sd = Image.new("L", seal.size, 0); ImageDraw.Draw(sd).ellipse((cx - R, cy - R + 8 * K, cx + R, cy + R + 8 * K), fill=150)
sd = sd.filter(ImageFilter.GaussianBlur(9 * K))
seal.paste(Image.new("RGB", seal.size, (40, 34, 14)), (0, 0), sd.point(lambda v: int(v * 0.6)))
disc = gradient((R * 2, R * 2), (93, 86, 59), (44, 41, 25), 135)
dm = Image.new("L", (R * 2, R * 2), 0); ImageDraw.Draw(dm).ellipse((0, 0, R * 2 - 1, R * 2 - 1), fill=255)
seal.paste(disc, (cx - R, cy - R), dm)
ImageDraw.Draw(seal).ellipse((cx - R + 4 * K, cy - R + 4 * K, cx + R - 4 * K, cy + R - 4 * K), outline=(160, 130, 66, 200), width=max(2, int(1.6 * K)))
tinos = ImageFont.truetype(ttf_from_woff("tinos-400.woff"), int(W * 0.066))  # needs: pip install fonttools
d = ImageDraw.Draw(seal)
d.text((cx, cy), "V&H", font=tinos, fill=(210, 171, 87), anchor="mm")
canvas.paste(seal, (sx - cx, sy - cy), seal)

# "You are invited", in the script of the envelope's address line
script = ImageFont.truetype(os.path.join(fonts, "LuxuriousScript-Regular.ttf"), int(W * 0.125))
d = ImageDraw.Draw(canvas)
d.text((X0 + W // 2, Y0 + int(H * 0.83)), "You are invited", font=script, fill=(119, 113, 80), anchor="mm")

out = canvas.resize((1200, 630), Image.LANCZOS)
os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
out.save(OUT, "JPEG", quality=92, optimize=True, subsampling=0)
print("wrote", OUT, out.size, os.path.getsize(OUT) // 1024, "KB")
