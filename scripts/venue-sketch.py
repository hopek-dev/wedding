"""Turn a photo of the venue into a pencil-style sketch for the invitation.

Usage (from the project folder):

    pip install opencv-python-headless numpy
    python scripts/venue-sketch.py path/to/venue-photo.jpg public/couple/card-2.jpg

How it works: a pencil "colour dodge" drawing gives the tone, a difference-of-
gaussians pass gives crisp edges, and the darker of the two is kept. Lines in
green areas (trees, hedges, lawn) are softened so the building stays the focus,
and the drawing fades into the paper toward the edges. The result is cropped to
4:3 to fill the photo card. Tweak the numbers below if a photo needs more or
less contrast.
"""

import sys

import cv2
import numpy as np

PAPER = np.array([246, 255, 255], np.float32)  # #fffff6 (BGR), the card's paper
INK = np.array([0x2F, 0x4A, 0x4D], np.float32)  # #4d4a2f (BGR), a deep olive pencil
SCALE = 3  # work at 3x so strokes stay smooth
FOLIAGE_SOFTEN = 0.74  # 0 = leave trees as drawn, 1 = erase them
OUT_WIDTH = 1600  # 4:3 output


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

    # fade out toward the edges, like a sketch on a page
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - 0.5 * w) / (0.60 * w)) ** 2 + ((yy - 0.54 * h) / (0.64 * h)) ** 2)
    vignette = np.clip(np.clip(1.15 - d, 0, 1) ** 1.2 * 1.6, 0, 1)

    ink = (1 - lines / 255.0) * strength * vignette  # 0 = paper, 1 = full pencil
    ink = np.clip(ink * 1.3, 0, 1)[..., None]
    out = np.clip(PAPER * (1 - ink) + INK * ink, 0, 255).astype(np.uint8)

    # crop to 4:3 around the centre and size for the card
    crop_w = int(h * 4 / 3)
    x0 = max(0, (w - crop_w) // 2)
    out = out[:, x0 : x0 + crop_w]
    out = cv2.resize(out, (OUT_WIDTH, OUT_WIDTH * 3 // 4), interpolation=cv2.INTER_AREA)
    cv2.imwrite(path_out, out, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"Wrote {path_out}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    sketch(sys.argv[1], sys.argv[2])
