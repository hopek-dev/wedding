"""Turn a photo of the venue into a crisp watercolour-style painting for the invitation.

Usage (from the project folder):

    pip install opencv-python-headless numpy
    python scripts/venue-watercolor.py path/to/venue-photo.jpg public/couple/venue-watercolor.webp [--view LEFT,TOP,WIDTH] [--trim-right FRACTION]

--view picks the window to paint, as fractions of the photo: its left edge, top edge and
width (the height follows from the 4:3 shape). Values can go past 0 or 1 to add margin
around the photo, which suits a tall photo. --trim-right cuts a strip off the right edge
first (signs, clutter).

How it works: the photo is turned into watercolour colour washes (the greens repainted
as soft sage), then its fine detail and pencil linework are laid back over the top so
the result stays sharp. There is no vignette. Where the painting ends, the edge is
ragged like paint that has run onto paper, and the open sky above the building simply
dissolves into the paper, so the building itself shapes the top of the picture.
The result has a transparent background, so it sits on the invitation's paper with no
box around it. Two files are written: the .webp you name (small, for the card) and a
compact PNG beside it ending in -og.png (for the WhatsApp preview image, which can't
read WebP). Tweak the numbers below to taste.
"""

import sys

import cv2
import numpy as np

SCALE = 2  # work at 2x so edges stay smooth
ASPECT = 4 / 3  # width / height of the saved painting
OUT_WIDTH = 1000
OG_WIDTH = 580
# Crop window around the building, as fractions of the photo (left, top, width).
CROP_LEFT, CROP_TOP, CROP_WIDTH = 0.04, 0.04, 0.90
TRIM_RIGHT = 0.0
WASH_LIGHTEN = 0.14  # 0 = full photo colour, 1 = white paper
WASH_SATURATION = 1.05
SHADOW_LIFT = 0.28  # how far the darkest tones are lifted toward a pale wash
DETAIL = 0.85  # how much of the photo's fine texture is laid back over the paint (sharpness)
LINEWORK = 0.55  # strength of the pencil outlines over the paint
FOLIAGE_LINES = 0.55  # how much of that linework survives in trees and grass (0 = none)
FOLIAGE_WASH = 0.70  # how far trees and grass are repainted as sage-green washes
FOLIAGE_COLOUR = (112, 164, 128)  # the green of those washes (BGR)
EDGE_RAGGED = 1.0  # 0 = clean edge, higher = more ragged, bleeding edge
SKY_FADE = 0.93  # how completely open sky dissolves into the paper (0 = keep the sky)
SEED = 11


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def noise(rng, shape, sigma):
    n = cv2.GaussianBlur(rng.random(shape).astype(np.float32), (0, 0), sigma)
    return (n - n.mean()) / (n.std() + 1e-6)


def build(path_in: str, path_out: str, view=None, trim_right: float = TRIM_RIGHT) -> None:
    crop_left, crop_top, crop_width = view or (CROP_LEFT, CROP_TOP, CROP_WIDTH)
    src = cv2.imread(path_in)
    if src is None:
        raise SystemExit(f"Can't read {path_in}")
    h0, w0 = src.shape[:2]
    src = src[:, : int(w0 * (1 - trim_right))]  # trim the right edge (signs, clutter)
    h0, w0 = src.shape[:2]
    up = cv2.resize(src, (w0 * SCALE, h0 * SCALE), interpolation=cv2.INTER_CUBIC)

    # where the photo is green (trees, hedges, grass)
    hsv_src = cv2.cvtColor(up, cv2.COLOR_BGR2HSV)
    hue, sat = hsv_src[..., 0], hsv_src[..., 1]
    green = ((hue > 24) & (hue < 78) & (sat > 32)).astype(np.float32)  # real greens only: not sky, suits or gravel
    # wherever the surrounding area is dark on average (shaded trees) counts as foliage too,
    # but only if it is leaf-coloured (a dark navy suit is not); windows and the door are small,
    # so their neighbourhood stays light and they are left alone
    area_value = cv2.GaussianBlur(hsv_src[..., 2].astype(np.float32), (0, 0), 6 * SCALE)
    leafy = (hue > 10) & (hue < 78) & (sat > 80)
    dark = ((area_value < 118) & leafy).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((8 * SCALE, 8 * SCALE), np.uint8))
    green = np.maximum(green, dark.astype(np.float32))
    green = cv2.GaussianBlur(green, (0, 0), 1.2 * SCALE)  # a tight feather, so the colour change has no halo

    # watercolour colour washes (kept light on smoothing so detail survives)
    wash = cv2.stylization(up, sigma_s=40, sigma_r=0.28)
    hsv = cv2.cvtColor(wash, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] *= WASH_SATURATION
    wash = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    wash = 255 - (255 - wash) * (1 - SHADOW_LIFT * (1 - wash / 255.0) ** 1.5)  # pale the dark tones most
    wash = wash * (1 - WASH_LIGHTEN) + 255 * WASH_LIGHTEN  # watered-down paint

    # repaint the green areas as fresh sage washes, keeping the leaf pattern as light and shade
    lum = (cv2.cvtColor(np.clip(wash, 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0)[..., None]
    lum = np.clip((lum - 0.30) / 0.45, 0, 1)
    sage = np.array(FOLIAGE_COLOUR, np.float32) * (0.60 + 0.65 * lum)
    m = (green * FOLIAGE_WASH)[..., None]
    wash = wash * (1 - m) + np.clip(sage, 0, 255) * m

    # lay the photo's fine texture back over the paint: this is what keeps it sharp
    gray = cv2.cvtColor(up, cv2.COLOR_BGR2GRAY).astype(np.float32)
    detail = gray - cv2.GaussianBlur(gray, (0, 0), 2.0)
    wash = wash + (DETAIL * (1 - 0.55 * green) * detail)[..., None]  # calmer texture in the foliage

    # fine pencil linework (difference of gaussians), unblurred, thinner in the foliage
    smooth = gray.astype(np.uint8)
    for _ in range(2):
        smooth = cv2.bilateralFilter(smooth, 9, 40, 9)
    g1 = cv2.GaussianBlur(smooth, (0, 0), 1.3).astype(np.float32)
    g2 = cv2.GaussianBlur(smooth, (0, 0), 1.3 * 1.6).astype(np.float32)
    dog = (g1 - 0.98 * g2) / 255.0
    edges = np.where(dog > 0.004, 1.0, 1.0 + np.tanh(18 * (dog - 0.004)))  # 1 = no line, <1 = line
    strength = LINEWORK * (1 - (1 - FOLIAGE_LINES) * green)
    line = 1 - (1 - edges) * strength
    ink = np.array([0x58, 0x56, 0x4E], np.float32)  # warm-grey pencil (BGR)
    out = wash * line[..., None] + ink * (1 - line[..., None])
    out = np.clip(out, 0, 255)

    # sky: open sky that touches the top of the picture (not windows reflecting it)
    value = hsv_src[..., 2].astype(np.float32)
    sky_like = (value > 150) & (((hue > 80) & (hue < 130) & (sat > 18)) | (sat < 45))
    sky_like = cv2.morphologyEx(sky_like.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

    # crop a window around the building; the window may reach past the photo, in which
    # case the edges are extended and the painted edge below stops at the photo's real edge
    h, w = out.shape[:2]
    pad = int(max(h, w) * 0.6)
    out = cv2.copyMakeBorder(out, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    sky_like = cv2.copyMakeBorder(sky_like, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    real = np.zeros(out.shape[:2], np.float32)
    real[pad : pad + h, pad : pad + w] = 1.0
    crop_w = int(w * crop_width)
    crop_h = int(crop_w / ASPECT)
    x0 = pad + int(w * crop_left)
    y0 = pad + int(h * crop_top)
    out = out[y0 : y0 + crop_h, x0 : x0 + crop_w]
    real = real[y0 : y0 + crop_h, x0 : x0 + crop_w]
    sky_like = sky_like[y0 : y0 + crop_h, x0 : x0 + crop_w]
    ch, cw = out.shape[:2]

    # keep only the sky regions connected to the top edge of the picture
    n, labels = cv2.connectedComponents(sky_like)
    top_labels = np.unique(labels[: max(3, ch // 80), :])
    sky = np.isin(labels, top_labels[top_labels > 0]).astype(np.float32)
    sky = cv2.GaussianBlur(sky, (0, 0), 1.4 * SCALE)

    # the painted edge: where the real photo ends, pushed about by noise so it looks like
    # a wash that has run and dried; a little more ragged toward the bottom
    rng = np.random.default_rng(SEED)
    yy, xx = np.mgrid[0:ch, 0:cw].astype(np.float32)
    cols = np.where(real.max(axis=0) > 0.5)[0]
    rows = np.where(real.max(axis=1) > 0.5)[0]
    dist = np.minimum.reduce([xx - cols.min(), cols.max() - xx, yy - rows.min(), rows.max() - yy]) / cw
    rag = EDGE_RAGGED * (0.8 + 0.6 * (yy / ch))
    shift = rag * (0.026 * noise(rng, (ch, cw), 0.05 * cw) + 0.010 * noise(rng, (ch, cw), 0.014 * cw) + 0.003 * noise(rng, (ch, cw), 2))
    alpha = smoothstep((dist + shift - 0.012) / 0.034)  # a soft feather, so the paint bleeds out into the paper

    # the sky dissolves into the paper, so the building defines the top of the picture
    alpha = alpha * (1 - SKY_FADE * sky)

    rgba = np.dstack([out.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    card = cv2.resize(rgba, (OUT_WIDTH, int(OUT_WIDTH / ASPECT)), interpolation=cv2.INTER_AREA)
    cv2.imwrite(path_out, card, [cv2.IMWRITE_WEBP_QUALITY, 90])
    og = cv2.resize(rgba, (OG_WIDTH, int(OG_WIDTH / ASPECT)), interpolation=cv2.INTER_AREA)
    og_path = path_out.rsplit(".", 1)[0] + "-og.png"
    cv2.imwrite(og_path, og, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"Wrote {path_out} and {og_path}")


if __name__ == "__main__":
    args = sys.argv[1:]
    view, trim = None, TRIM_RIGHT
    if "--view" in args:
        i = args.index("--view")
        view = tuple(float(v) for v in args[i + 1].split(","))
        del args[i : i + 2]
    if "--trim-right" in args:
        i = args.index("--trim-right")
        trim = float(args[i + 1])
        del args[i : i + 2]
    if len(args) != 2:
        raise SystemExit(__doc__)
    build(args[0], args[1], view, trim)
