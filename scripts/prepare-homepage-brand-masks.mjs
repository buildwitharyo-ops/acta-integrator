#!/usr/bin/env node
/*
 * Homepage-only alpha masks from the genuine embedded profile logos.
 * Run extraction first when changing the source PDF:
 *   python3 scripts/extract-homepage-brand-partners.py /path/to/profile.pdf
 * Then: node scripts/prepare-homepage-brand-masks.mjs
 * Existing sharp dependency only. Original public/brands PNGs remain available.
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
  const spec = JSON.parse(await fs.readFile(path.join(root, "lib/homepage-brand-partners.json"), "utf8"));
  const provenance = JSON.parse(await fs.readFile(path.join(root, "public/brands/homepage-profile/provenance.json"), "utf8"));
  assert.equal(spec.brands.length, 24, "Expected the 24 unique marks on the profile's partner slide");
  await fs.mkdir(outputDir, { recursive: true });
  const assets = [];

  for (const brand of spec.brands) {
    const sourceUrl = `/brands/homepage-profile/${brand.slug}.png`;
    const original = await fs.readFile(path.join(root, "public", sourceUrl));
    const sourceMeta = await sharp(original).metadata();
    const rgba = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const alpha = Buffer.alloc(rgba.info.width * rgba.info.height);
    for (let index = 0; index < alpha.length; index += 1) {
      const offset = index * 4;
      // Yamaha and Martin Audio are white marks embedded on black. Shure's mark
      // includes a black backing plate. Remove only that black source backing;
      // all other supplied marks use their existing PDF soft-mask alpha unchanged.
      const intensity = brand.maskMode === "remove-black"
        ? Math.max(rgba.data[offset], rgba.data[offset + 1], rgba.data[offset + 2]) / 255
        : 1;
      alpha[index] = Math.round(rgba.data[offset + 3] * intensity);
    }

    const silhouette = await sharp({
      create: {
        width: rgba.info.width,
        height: rgba.info.height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).joinChannel(alpha, {
      raw: { width: rgba.info.width, height: rgba.info.height, channels: 1 },
    }).png().toBuffer();

    // Crop transparent padding and preserve the complete mark's proportions.
    // Existing homepage display box stays 112×42 CSS px; output supports 3× DPR.
    const trimmed = await sharp(silhouette).trim({ threshold: 0 }).png().toBuffer();
    const resized = await sharp(trimmed)
      .resize({ width: 336, height: 126, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const output = await sharp(resized).webp({ lossless: true, effort: 6 }).toBuffer();
    const targetAlpha = await sharp(resized).ensureAlpha().extractChannel("alpha").raw().toBuffer();
    const decodedAlpha = await sharp(output).ensureAlpha().extractChannel("alpha").raw().toBuffer();
    assert.deepEqual(decodedAlpha, targetAlpha, `${brand.slug}: output alpha must remain lossless`);
    assert(decodedAlpha.some((value) => value > 0), `${brand.slug}: empty mark`);
    assert(decodedAlpha.some((value) => value === 0), `${brand.slug}: source backing must not become an opaque rectangle`);

    const outputMeta = await sharp(output).metadata();
    const filename = `${brand.slug}.webp`;
    await fs.writeFile(path.join(outputDir, filename), output);
    assets.push({
      ...brand,
      sourcePage: spec.sourcePage,
      sourceUrl,
      sourceWidth: sourceMeta.width,
      sourceHeight: sourceMeta.height,
      sourceBytes: original.length,
      sourceSha256: sha256(original),
      outputUrl: `/images/home-brand-masks/${filename}`,
      width: outputMeta.width,
      height: outputMeta.height,
      outputBytes: output.length,
      outputSha256: sha256(output),
      alphaEquivalent: true,
    });
  }

  // This directory is exclusively generated homepage output. Remove obsolete
  // legacy-lineup masks so stale unapproved marks cannot remain referenced.
  const expected = new Set(assets.map((asset) => path.basename(asset.outputUrl)));
  for (const filename of await fs.readdir(outputDir)) {
    if (filename.endsWith(".webp") && !expected.has(filename)) {
      await fs.unlink(path.join(outputDir, filename));
    }
  }

  const sourceBytes = assets.reduce((sum, asset) => sum + asset.sourceBytes, 0);
  const outputBytes = assets.reduce((sum, asset) => sum + asset.outputBytes, 0);
  const manifest = {
    generator: "scripts/prepare-homepage-brand-masks.mjs",
    source: "lib/homepage-brand-partners.json and public/brands/homepage-profile/*.png",
    sourcePdfSha256: provenance.sourcePdfSha256,
    sourcePage: spec.sourcePage,
    purpose: "Partner marks from the supplied company profile for the homepage and About marquees.",
    groups: spec.groups,
    uniqueBrands: assets.length,
    groupPlacements: spec.groups.reduce((sum, group) => sum + group.slugs.length, 0),
    groupingNote: provenance.groupingNote,
    displayedBoxCssPx: { width: 112, height: 42 },
    rasterScale: 3,
    alphaVerification: "Decoded lossless WebP alpha exactly equals the trimmed/resized source silhouette.",
    sourceBytes,
    outputBytes,
    savedPercent: Number(((1 - outputBytes / sourceBytes) * 100).toFixed(2)),
    assets,
  };
  await fs.writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const sourceMap = Object.fromEntries(assets.map((asset) => [asset.sourceUrl, asset.outputUrl]));
  await fs.writeFile(path.join(root, "lib/homepage-brand-masks.json"), `${JSON.stringify(sourceMap, null, 2)}\n`);
  console.log(JSON.stringify({ brands: assets.length, sourceBytes, outputBytes, savedPercent: manifest.savedPercent, alphaEquivalent: true }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
