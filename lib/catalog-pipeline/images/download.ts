import "server-only";

// Download + validate a proposed product image from an external URL. Mechanical only (PRD §4.4 —
// this is not a reasoning task). Mirrors the checks proven during manual seeding this session:
// trust magic bytes over Content-Type (some CDNs lie), reject anything too small to be a real
// product photo, timeout so one slow host can't hang a whole job.
const MIN_BYTES = 3000;
const MIN_DIMENSION = 300;

export type DownloadedImage = { buffer: Buffer; width: number; height: number };

function looksLikeImage(buf: Buffer, contentType: string): boolean {
  if (buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return true; // jpg
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true; // png
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return true; // webp
  return contentType.startsWith("image/");
}

export async function downloadImage(url: string): Promise<DownloadedImage> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < MIN_BYTES) throw new Error(`terlalu kecil (${buffer.length}B)`);
  if (!looksLikeImage(buffer, contentType)) throw new Error(`bukan gambar (content-type=${contentType || "kosong"})`);

  // Dimension probe via sharp — imported lazily so this module stays usable even in contexts
  // where sharp's native binary isn't available (kept consistent with transform.ts's usage).
  const sharp = (await import("sharp")).default;
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(`resolusi terlalu kecil (${width}x${height}, minimum ${MIN_DIMENSION}px)`);
  }

  return { buffer, width, height };
}
