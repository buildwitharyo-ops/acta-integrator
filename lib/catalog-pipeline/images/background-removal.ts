import "server-only";

// Mechanical HTTP call to a self-hosted rembg instance (Oracle Cloud Ampere A1, behind Caddy
// basic auth + TLS on the same domain n8n uses). Swapped from remove.bg after live-testing showed
// remove.bg's real free tier is watermarked/preview-resolution only — unusable for catalog images,
// and real credits are paid. Sole file that knows this contract, mirroring the lib/acta-os.ts /
// lib/ai/providers/anthropic.ts "one adapter, locked contract" pattern.

export async function removeBackground(buffer: Buffer, filename = "image.jpg"): Promise<Buffer> {
  const baseUrl = process.env.BG_REMOVAL_URL;
  if (!baseUrl) throw new Error("BG_REMOVAL_URL belum diset — tambahkan di .env.local sebelum menjalankan image pipeline.");
  const user = process.env.BG_REMOVAL_USER;
  const password = process.env.BG_REMOVAL_PASSWORD;

  const form = new FormData();
  // Buffer's ArrayBufferLike generic doesn't structurally match BlobPart's ArrayBuffer in this
  // TS lib version (same @types/node-vs-lib mismatch as parser.ts's exceljs cast) — harmless.
  form.append("file", new Blob([buffer as unknown as ArrayBuffer]), filename);

  const url = new URL("/api/remove", baseUrl);
  url.searchParams.set("model", "isnet-general-use"); // cleaner edges for product photography than default u2net

  const headers: Record<string, string> = {};
  if (user && password) headers.Authorization = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: form,
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.text();
      if (body) detail = body.slice(0, 300);
    } catch {
      // response body unreadable — keep the plain HTTP status
    }
    throw new Error(`rembg self-hosted gagal: ${detail}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
