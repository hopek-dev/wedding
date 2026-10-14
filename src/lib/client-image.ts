// Shrinks a photo in the browser before it is uploaded. A phone photo is often 4 to 10 MB, which is more than the
// server accepts in one request (about 4 MB on Vercel), and far more than the site needs: pictures are kept at up
// to 2600 px on their long side anyway. The photo keeps its shape and its upright orientation (the camera's rotation
// flag is applied). If the browser can't read the format (some HEIC photos), the original is sent unchanged.

const MAX_SIDE = 2600;
const SEND_AS_IS_BYTES = 1_200_000;

export async function prepareImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    // small enough already: leave it exactly as it is
    if (scale === 1 && file.size <= SEND_AS_IS_BYTES) {
      bitmap.close();
      return file;
    }
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    // JPEG at high quality; a transparent PNG gets a white background first so it doesn't go black
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob || blob.size >= file.size) return file; // never make a small file bigger
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// The most one upload may be. Checked before sending so the person gets a clear message instead of a failed request.
export const MAX_UPLOAD_BYTES = 4_000_000;
