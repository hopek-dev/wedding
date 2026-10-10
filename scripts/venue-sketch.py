"""Turn a photo of the venue into a pencil-style sketch for the invitation.

Usage (from the project folder):

    pip install opencv-python-headless numpy
    python scripts/venue-sketch.py path/to/venue-photo.jpg public/couple/venue-sketch.png

How it works: a pencil "colour dodge" drawing gives the tone, a difference-of-
gaussians pass gives crisp edges, and the darker of the two is kept. Lines in
green areas (trees, hedges, lawn) are softened so the building stays the focus,
and the drawing fades into the paper toward the edges. The result is a 3:2
crop saved as a transparent PNG (just the pencil lines), so it sits on the
invitation's paper with no visible edge. Tweak the numbers below if a photo
needs more or less contrast.
"""

import sys

import cv2
import numpy as np

PAPER = np.array([246, 255, 255], np.float32)  # #fffff6 (BGR), the card's paper
INK = np.array([0x2F, 0x4A, 0x4D], np.float32)  # #4d4a2f (BGR), a deep olive pencil
SCALE = 3  # work at 3x so strokes stay smooth
FOLIAGE_SOFTEN = 0.86  # 0 = leave trees as drawn, 1 = erase them
ASPECT = 3 / 2  # width / height of the saved sketch
OUT_WIDTH = 1000
# Where to crop, as fractions of the photo: left edge, top edge and width of the
# window around the building (its height follows from ASPECT).
CROP_LEFT, CROP_TOP, CROP_WIDTH = 0.16, 0.08, 0.80


def levels(x, lo, hi, gamma=1.0):
    return np.clip((x.astype(np.float32) - lo) / (hi - lo), 0, 1) ** gamma * 255


def sketch(path_in: str, path_out: str) -> None:
    src = cv2.imread(path_in)
    if src is None:
        raise SystemExit(f"Can't read {path_in}")
    h0, w0 = src.shape[:2]
    up = cv2.resize(src, (w0 * SCALE, h0 * SCALE), interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(up, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # tone: pencil sketch (colour dodge of the inverted, blurred image)
    inv = 255 - gray
    dodge = cv2.divide(gray, 255 - cv2.GaussianBlur(inv, (0, 0), 11), scale=256)

    # edges: difference of gaussians on a smoothed copy
    smooth = gray
    for _ in range(3):
        smooth = cv2.bilateralFilter(smooth, 9, 45, 9)
    g1 = cv2.GaussianBlur(smooth, (0, 0), 1.5).astype(np.float32)
    g2 = cv2.GaussianBlur(smooth, (0, 0), 1.5 * 1.6).astype(np.float32)
    dog = (g1 - 0.98 * g2) / 255.0
    edges = np.where(dog > 0.004, 1.0, 1.0 + np.tanh(18 * (dog - 0.004))) * 255

    lines = np.minimum(levels(dodge, 62, 232, 0.9), levels(edges, 55, 245, 1.0))

    # soften the lines wherever the photo is green (foliage, hedges, grass)
    hsv = cv2.cvtColor(up, cv2.COLOR_BGR2HSV)
    green = ((hsv[..., 0] > 30) & (hsv[..., 0] < 90) & (hsv[..., 1] > 35)).astype(np.float32)
    green = cv2.GaussianBlur(green, (0, 0), 6 * SCALE)
    strength = 1 - FOLIAGE_SOFTEN * green  # 1 on the building, lower in the trees

    ink = (1 - lines / 255.0) * strength  # 0 = paper, 1 = full pencil
    ink = np.clip(ink * 1.25, 0, 1).astype(np.float32)
    ink = cv2.dilate(ink, np.ones((3, 3), np.uint8))  # bolder strokes, so they survive being shown small

    # crop a window around the building
    crop_w = int(w * CROP_WIDTH)
    crop_h = int(crop_w / ASPECT)
    x0 = min(int(w * CROP_LEFT), w - crop_w)
    y0 = min(int(h * CROP_TOP), h - crop_h)
    ink = ink[y0 : y0 + crop_h, x0 : x0 + crop_w]

    # fade to nothing at every edge, like a sketch that dissolves into the page
    ch, cw = ink.shape
    yy, xx = np.mgrid[0:ch, 0:cw].astype(np.float32)
    d = np.sqrt(((xx - 0.5 * cw) / (0.5 * cw)) ** 2 + ((yy - 0.5 * ch) / (0.5 * ch)) ** 2)
    t = np.clip((1.0 - d) / 0.55, 0, 1)
    ink = ink * (t * t * (3 - 2 * t))

    ink = cv2.resize(ink, (OUT_WIDTH, int(OUT_WIDTH / ASPECT)), interpolation=cv2.INTER_AREA)

    if path_out.lower().endswith(".png"):
        # transparent background: only the pencil is drawn
        rgba = np.zeros((*ink.shape, 4), np.uint8)
        rgba[..., :3] = INK.astype(np.uint8)
        rgba[..., 3] = np.clip(ink * 255, 0, 255).astype(np.uint8)
        cv2.imwrite(path_out, rgba)
    else:
        t = ink[..., None]
        cv2.imwrite(path_out, np.clip(PAPER * (1 - t) + INK * t, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"Wrote {path_out}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    sketch(sys.argv[1], sys.argv[2])
