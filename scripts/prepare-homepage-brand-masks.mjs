#!/usr/bin/env node
/*
 * Homepage-only alpha masks derived from the genuine public/brands PNGs.
 * Uses sharp already installed with Next.js; original assets remain untouched.
 * Run from the repository root: node scripts/prepare-homepage-brand-masks.mjs
 * Lossless refers to the resized alpha channel, verified byte-for-byte below.
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public/images/home-brand-masks");
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

async function main() {
  const source = await fs.readFile(path.join(root, "lib/brand-logos.ts"), "utf8");
  const brands = [...source.matchAll(/slug: "([^"]+)", name: "([^"]+)", src: "([^"]+)"/g)]
    .map((match) => ({ slug: match[1], name: match[2], sourceUrl: match[3] }));
  assert.equal(brands.length, 29, "Expected all 29 genuine source marks");
  await fs.mkdir(outputDir, { recursive: true });
  const assets = [];

  for (const brand of brands) {
    const original = await fs.readFile(path.join(root, "public", brand.sourceUrl));
    const sourceMeta = await sharp(original).metadata();
    // Largest homepage mask: 112 × 42 CSS pixels. Contain at 3× DPR.
    const alpha = await sharp(original)
      .ensureAlpha()
      .resize({ width: 336, height: 126, fit: "inside", withoutEnlargement: true })
      .extractChannel("alpha")
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width, height } = alpha.info;
    const output = await sharp({
      create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .joinChannel(alpha.data, { raw: { width, height, channels: 1 } })
      .webp({ lossless: true, effort: 6 })
      .toBuffer();
    const decodedAlpha = await sharp(output).extractChannel("alpha").raw().toBuffer();
    assert.deepEqual(decodedAlpha, alpha.data, `${brand.slug}: alpha must remain lossless`);
    const filename = `${brand.slug}.webp`;
    await fs.writeFile(path.join(outputDir, filename), output);
    assets.push({
      ...brand,
      sourceWidth: sourceMeta.width,
      sourceHeight: sourceMeta.height,
      sourceBytes: original.length,
      sourceSha256: sha256(original),
      outputUrl: `/images/home-brand-masks/${filename}`,
      width,
      height,
      outputBytes: output.length,
      outputSha256: sha256(output),
      alphaEquivalent: true,
    });
  }

  const sourceBytes = assets.reduce((sum, asset) => sum + asset.sourceBytes, 0);
  const outputBytes = assets.reduce((sum, asset) => sum + asset.outputBytes, 0);
  const manifest = {
    generator: "scripts/prepare-homepage-brand-masks.mjs",
    source: "lib/brand-logos.ts and public/brands/*.png",
    purpose: "Homepage monochrome CSS alpha masks only; About uses original assets.",
    displayedBoxCssPx: { width: 112, height: 42 },
    rasterScale: 3,
    alphaVerification: "Decoded lossless WebP alpha exactly equals the resized source alpha.",
    sourceBytes,
    outputBytes,
    savedPercent: Number(((1 - outputBytes / sourceBytes) * 100).toFixed(2)),
    assets,
  };
  await fs.writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const sourceMap = Object.fromEntries(assets.map((asset) => [asset.sourceUrl, asset.outputUrl]));
  await fs.writeFile(path.join(root, "lib/homepage-brand-masks.json"), `${JSON.stringify(sourceMap, null, 2)}\n`);
  console.log(JSON.stringify({ brands: assets.length, sourceBytes, outputBytes, savedPercent: manifest.savedPercent, alphaEquivalent: assets.every((asset) => asset.alphaEquivalent) }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
