import "server-only";
import sharp from "sharp";

// Trim transparent border, cap max dimension, pad a margin, encode webp — same parameters proven
// during manual seeding this session (visually spot-checked clean cutouts across multiple brands).
const MAX_DIMENSION = 2048;
const MARGIN_PCT = 0.06;
const TRIM_THRESHOLD = 10;

export async function finalizeProductImage(pngWithAlpha: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  const trimmed = await sharp(pngWithAlpha).trim({ threshold: TRIM_THRESHOLD }).toBuffer();

  let pipe = sharp(trimmed);
  const meta = await sharp(trimmed).metadata();
  if ((meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION) {
    pipe = pipe.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside" });
  }
  const resized = await pipe.toBuffer({ resolveWithObject: true });

  const pad = Math.round(Math.max(resized.info.width, resized.info.height) * MARGIN_PCT);
  const webp = await sharp(resized.data)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, effort: 5 })
    .toBuffer();

  const finalMeta = await sharp(webp).metadata();
  return { buffer: webp, width: finalMeta.width ?? 0, height: finalMeta.height ?? 0 };
}
