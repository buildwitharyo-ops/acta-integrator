import "server-only";

// Mechanical HTTP call to remove.bg (PRD §4.4/§8 — CTO-selected provider), not a reasoning task.
// Sole file that knows remove.bg's request/response contract, mirroring the lib/acta-os.ts /
// lib/ai/providers/anthropic.ts "one adapter, locked contract" pattern.
const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";

export async function removeBackground(buffer: Buffer, filename = "image.jpg"): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) throw new Error("REMOVE_BG_API_KEY belum diset — tambahkan di .env.local sebelum menjalankan image pipeline.");

  const form = new FormData();
  // Buffer's ArrayBufferLike generic doesn't structurally match BlobPart's ArrayBuffer in this
  // TS lib version (same @types/node-vs-lib mismatch as parser.ts's exceljs cast) — harmless.
  form.append("image_file", new Blob([buffer as unknown as ArrayBuffer]), filename);
  form.append("size", "auto");
  form.append("format", "png");
  form.append("type", "product"); // remove.bg's product-photography-optimized mode — fits AV gear shots

  const res = await fetch(REMOVE_BG_ENDPOINT, {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { errors?: { title?: string; detail?: string }[] };
      const first = body.errors?.[0];
      if (first?.title) detail = first.detail ? `${first.title} — ${first.detail}` : first.title;
    } catch {
      // response body wasn't JSON — keep the plain HTTP status
    }
    throw new Error(`remove.bg gagal: ${detail}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
