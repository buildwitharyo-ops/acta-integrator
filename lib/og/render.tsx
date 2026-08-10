import { ImageResponse } from "next/og";
import { GENERAL_SANS_BOLD_B64, GENERAL_SANS_SEMIBOLD_B64, IBM_PLEX_MONO_MEDIUM_B64 } from "./fonts-data";

// Brand OG templates (03 §7.3): Control Room #14161A, segmented amber meter, IBM Plex Mono eyebrow,
// General Sans display title, ACTA wordmark. NO gold luxury wash / serif italic (banned).
//
// Three layouts, one chrome:
//   renderOgImage        — editorial split: copy left, cover photo bleeding off the right edge.
//                          For articles/solutions, where the photo is a scene and cropping is fine.
//   renderHomeOgImage    — centered, mirrors the homepage Hero one-to-one (04 §2).
//   renderProductOgImage — showcase: name left, the product itself on a lit panel right.
//                          Product shots are square cutouts; `cover` would amputate them.

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const BG = "#14161A";
const FG = "#F2F2EF";
const MUTED = "#9BA0A8";
const AMBER = "#D9962E";
const HAIRLINE = "#2A2E35";
const PANEL = "#F2F2EF";

// Decode the base64-embedded Satori fonts once. Embedded (not fs/import.meta.url) so it works in the
// OG route's Node runtime at build + on Vercel without any file-tracing config.
let fonts: [Buffer, Buffer, Buffer] | null = null;
function loadFonts() {
  if (!fonts) {
    fonts = [
      Buffer.from(GENERAL_SANS_SEMIBOLD_B64, "base64"),
      Buffer.from(GENERAL_SANS_BOLD_B64, "base64"),
      Buffer.from(IBM_PLEX_MONO_MEDIUM_B64, "base64"),
    ];
  }
  return fonts;
}

const OG_FONTS = () => {
  const [gsSemibold, gsBold, mono] = loadFonts();
  return [
    { name: "General Sans", data: gsSemibold, weight: 600 as const, style: "normal" as const },
    { name: "General Sans", data: gsBold, weight: 700 as const, style: "normal" as const },
    { name: "IBM Plex Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
};

// ── Image loading ────────────────────────────────────────────────────────────────────────

const OBJECT_PREFIX = "/storage/v1/object/public/";
const RENDER_PREFIX = "/storage/v1/render/image/public/";

// Pull a downscaled copy out of Supabase's transformer rather than the full-size original: a 960px
// catalog shot is ~100 KB against ~30 KB transformed, and that delta is paid 163× per build.
//
// `format=origin` is doing two jobs and neither is optional:
//   1. Without it the transformer answers WebP regardless of the Accept header we send (verified:
//      `Accept: image/png,image/jpeg` still comes back `content-type: image/webp`), and Satori's
//      decoder speaks only PNG/JPEG/GIF — the photo would silently vanish from the card.
//   2. Part of the catalog is stored AS WebP (media/seed02/*.webp). For those the plain object URL
//      is undecodable, so this transform is the only way the photo reaches the card at all —
//      `origin` transcodes them to PNG on the way out.
// `origin` is the only value the endpoint accepts; `format=png`/`jpeg` answer 400.
function transformedUrl(raw: string, width: number): string | null {
  try {
    const url = new URL(raw);
    if (!url.hostname.endsWith(".supabase.co") || !url.pathname.startsWith(OBJECT_PREFIX)) return null;
    url.pathname = RENDER_PREFIX + url.pathname.slice(OBJECT_PREFIX.length);
    url.searchParams.set("width", String(width));
    url.searchParams.set("resize", "contain");
    url.searchParams.set("quality", "80");
    url.searchParams.set("format", "origin");
    return url.toString();
  } catch {
    return null;
  }
}

async function loadDataUri(url: string): Promise<string | null> {
  try {
    // 15s, not 8s: a cold Supabase transform of a multi-hundred-KB source takes seconds, and at 8s
    // a run of catalog photos timed out mid-build and shipped photoless cards. `no-store` keeps
    // these image bodies out of Next's fetch cache — the route output is what gets cached, and
    // writing 163 half-megabyte entries only produced "Failed to set fetch cache" noise.
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    // Satori only decodes PNG/JPEG/GIF as <img> data URIs — WebP/AVIF/SVG throw INSIDE ImageResponse
    // (uncaught, which would abort the SSG build), so anything else degrades to the brand template.
    if (!/^image\/(png|jpe?g|gif)$/.test(ct)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 4_000_000) return null;
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

// Fetch an image and inline it as a data URI so a failed/slow/unsupported image degrades to the
// brand template instead of throwing inside Satori (which would break the build for an SSG OG).
// Tries the transform first, then the untouched original — a Storage bucket without the image
// transformer enabled must not cost us the photo.
async function fetchImageDataUri(url: string | null | undefined, width: number): Promise<string | null> {
  if (!url) return null;
  const transformed = transformedUrl(url, width);
  if (transformed) {
    const viaTransform = await loadDataUri(transformed);
    if (viaTransform) return viaTransform;
  }
  return loadDataUri(url);
}

// ── Shared chrome ────────────────────────────────────────────────────────────────────────

const METER = [56, 18, 34, 10];
const METER_OPACITY = [1, 0.55, 0.82, 0.4];

function Meter() {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {METER.map((w, i) => (
        <div key={i} style={{ width: w, height: 6, backgroundColor: AMBER, opacity: METER_OPACITY[i] }} />
      ))}
    </div>
  );
}

function Eyebrow({ text }: { text: string }) {
  return (
    <div style={{ marginTop: 22, fontFamily: "IBM Plex Mono", fontSize: 22, letterSpacing: 3, color: MUTED }}>
      {clamp(text.toUpperCase(), 58)}
    </div>
  );
}

// `compact` is for the product layout, whose copy column is 640px wide — at full size the
// tagline wraps onto a second line and the footer stops reading as one rule.
function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 12 : 16 }}>
      <div style={{ fontFamily: "General Sans", fontWeight: 700, fontSize: 30, letterSpacing: 3, color: FG }}>ACTA</div>
      <div style={{ width: compact ? 36 : 52, height: 2, backgroundColor: HAIRLINE }} />
      <div
        style={{
          fontFamily: "IBM Plex Mono",
          fontSize: compact ? 15 : 16,
          letterSpacing: compact ? 1.5 : 2,
          color: MUTED,
          whiteSpace: "nowrap",
        }}
      >
        COMMERCIAL AV SYSTEMS INTEGRATOR
      </div>
    </div>
  );
}

// Stand-in for the live hero's particle field (components/ui/particle-network) when no CMS hero
// image is set: Satori has no canvas, so the field becomes a static signal grid — same read
// (instrumented dark room), a fraction of the cost.
const DOT_COLS = 21;
const DOT_ROWS = 11;
const DOT_GAP_X = (OG_SIZE.width - 48) / (DOT_COLS - 1);
const DOT_GAP_Y = (OG_SIZE.height - 52) / (DOT_ROWS - 1);

// Satori resolves neither the `inset` shorthand nor percentage sizes on an absolute box the way a
// browser does — a `justify-content: space-between` grid built that way collapses into the corner.
// Every dot is therefore placed at an absolute pixel coordinate.
function DotField() {
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < DOT_ROWS; r++) {
    for (let c = 0; c < DOT_COLS; c++) {
      dots.push({ x: 24 + c * DOT_GAP_X, y: 26 + r * DOT_GAP_Y });
    }
  }
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: OG_SIZE.width, height: OG_SIZE.height, display: "flex" }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: d.y,
            left: d.x,
            width: 3,
            height: 3,
            borderRadius: 3,
            backgroundColor: "rgba(242,242,239,0.13)",
          }}
        />
      ))}
    </div>
  );
}

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

// Titles here are `seo_title`s written for a SERP, so they carry a "| ACTA" tail. On a card that
// already signs itself with the wordmark that tail is dead weight — and it is dead weight that
// pushes the display type down a size step.
function stripBrandSuffix(title: string): string {
  return title.replace(/\s*[|—–-]\s*ACTA\s*$/i, "").trim() || title;
}

// Satori has no text measurement to auto-fit with, so display sizes step down by length.
// The breakpoints are tuned against General Sans Bold at the widths each layout allows.
function stepSize(length: number, steps: [number, number][], min: number): number {
  for (const [maxLength, size] of steps) if (length <= maxLength) return size;
  return min;
}

// ── Editorial split (articles, solutions, category hubs) ──────────────────────────────────

export async function renderOgImage(opts: {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  heroUrl?: string | null;
}): Promise<ImageResponse> {
  const hero = await fetchImageDataUri(opts.heroUrl, 760);
  const contentWidth = hero ? 700 : OG_SIZE.width;

  // The copy column is only ~556px wide once the photo is in, and `justify-content: space-between`
  // does not protect anything: at a fixed 66px a four-line title runs straight through the
  // subtitle and out the bottom of the card. Size the display type to the title, then give the
  // subtitle a budget out of what the title left behind.
  const title = stripBrandSuffix(opts.title);
  const titleWidth = contentWidth - 144;
  const titleSize = hero
    ? stepSize(title.length, [[22, 62], [34, 54], [50, 46], [72, 40]], 34)
    : stepSize(title.length, [[46, 66], [70, 58], [100, 50]], 44);
  const titleLines = Math.max(1, Math.ceil(title.length / Math.max(1, titleWidth / (titleSize * 0.52))));
  const subtitleMax = titleLines >= 4 ? 85 : titleLines === 3 ? 115 : 140;

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          position: "relative",
          backgroundColor: BG,
          fontFamily: "General Sans",
          overflow: "hidden",
        }}
      >
        {hero ? (
          <div style={{ position: "absolute", top: 0, right: 0, width: 520, height: OG_SIZE.height, display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} width={520} height={OG_SIZE.height} style={{ width: 520, height: OG_SIZE.height, objectFit: "cover" }} alt="" />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 520,
                height: OG_SIZE.height,
                background: "linear-gradient(90deg, #14161A 0%, rgba(20,22,26,0.72) 42%, rgba(20,22,26,0) 100%)",
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: contentWidth,
            height: OG_SIZE.height,
            padding: 72,
            position: "relative",
          }}
        >
          {/* Top: signal meter + eyebrow */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Meter />
            <Eyebrow text={opts.eyebrow} />
          </div>

          {/* Middle: title + optional subtitle */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "General Sans",
                fontWeight: 700,
                fontSize: titleSize,
                lineHeight: 1.06,
                letterSpacing: -1,
                color: FG,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {clamp(title, 110)}
            </div>
            {opts.subtitle ? (
              <div
                style={{
                  marginTop: 20,
                  fontFamily: "General Sans",
                  fontWeight: 600,
                  fontSize: titleLines >= 4 ? 24 : 27,
                  lineHeight: 1.32,
                  color: MUTED,
                  display: "flex",
                }}
              >
                {clamp(opts.subtitle, subtitleMax)}
              </div>
            ) : null}
          </div>

          {/* Bottom: wordmark + hairline + tag */}
          <Wordmark />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: OG_FONTS() },
  );
}

// ── Homepage: a portrait of the live Hero ────────────────────────────────────────────────

/**
 * Mirrors `components/sections/Hero.tsx`: centered stack, two-line headline, subheadline,
 * the two CTA labels as pills. Every string comes from the CMS section the Hero itself reads,
 * so what a shared link previews is what the visitor lands on.
 *
 * `backdropUrl` is the Hero's CMS image (`home/hero.image_media_id`), laid in dark under the same
 * signal grid — present when an editor has set one, absent otherwise.
 */
export async function renderHomeOgImage(opts: {
  eyebrow: string;
  headline1: string;
  headline2?: string | null;
  subtitle?: string | null;
  ctaPrimary?: string | null;
  ctaSecondary?: string | null;
  backdropUrl?: string | null;
}): Promise<ImageResponse> {
  const backdrop = await fetchImageDataUri(opts.backdropUrl, 1200);
  const lines = [opts.headline1, opts.headline2].map((l) => (l ?? "").trim()).filter(Boolean).map((l) => clamp(l, 40));
  const longest = lines.reduce((n, l) => Math.max(n, l.length), 0);
  const titleSize = stepSize(longest, [[20, 70], [28, 62], [36, 52]], 44);

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          position: "relative",
          backgroundColor: BG,
          fontFamily: "General Sans",
          overflow: "hidden",
        }}
      >
        {/* Backdrop stack, bottom to top: the CMS hero photo (when set), the scrim that holds it
            to a room rather than a scene, then the signal grid. The live hero is a dark space with
            a particle field over it — a fully legible photograph here would advertise a different
            page than the one it links to.
            Flat siblings, never wrapped in a fragment: Satori drops `<>…</>` children silently. */}
        {backdrop ? (
          // The <img> stays in normal flow inside an absolute wrapper: Satori honours the wrapper's
          // geometry but not `position: absolute` set on the image element itself.
          <div style={{ position: "absolute", top: 0, left: 0, width: OG_SIZE.width, height: OG_SIZE.height, display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backdrop}
              width={OG_SIZE.width}
              height={OG_SIZE.height}
              style={{ width: OG_SIZE.width, height: OG_SIZE.height, objectFit: "cover" }}
              alt=""
            />
          </div>
        ) : null}
        {backdrop ? (
          // Linear, never radial. Satori paints `radial-gradient(...)` as an OPAQUE fill — alpha in
          // the stops is dropped — which silently buries the photo under a flat #14161A rectangle.
          // Verified by render, not by docs: swap this for a radial and the backdrop disappears.
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: OG_SIZE.width,
              height: OG_SIZE.height,
              background: "linear-gradient(180deg, rgba(20,22,26,0.88) 0%, rgba(20,22,26,0.80) 42%, rgba(20,22,26,0.92) 100%)",
            }}
          />
        ) : null}
        <DotField />
        {/* Edge fade — the flat-gradient stand-in for the hero's own radial vignette (Hero.tsx). */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: OG_SIZE.width,
            height: OG_SIZE.height,
            background: "linear-gradient(180deg, rgba(20,22,26,0.35) 0%, rgba(20,22,26,0) 30%, rgba(20,22,26,0) 70%, rgba(20,22,26,0.45) 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            width: OG_SIZE.width,
            height: OG_SIZE.height,
            padding: "58px 72px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Meter />
            <Eyebrow text={opts.eyebrow} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontFamily: "General Sans",
                fontWeight: 700,
                fontSize: titleSize,
                lineHeight: 1.06,
                letterSpacing: -1,
                color: FG,
                textAlign: "center",
              }}
            >
              {lines.map((line, i) => (
                <div key={i} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
            </div>

            {opts.subtitle ? (
              <div
                style={{
                  marginTop: 24,
                  maxWidth: 880,
                  fontFamily: "General Sans",
                  fontWeight: 600,
                  fontSize: 26,
                  lineHeight: 1.36,
                  color: MUTED,
                  textAlign: "center",
                  display: "flex",
                }}
              >
                {clamp(opts.subtitle, 150)}
              </div>
            ) : null}

            {opts.ctaPrimary || opts.ctaSecondary ? (
              <div style={{ display: "flex", gap: 16, marginTop: 32, alignItems: "center" }}>
                {opts.ctaPrimary ? (
                  <div
                    style={{
                      display: "flex",
                      padding: "15px 30px",
                      borderRadius: 999,
                      backgroundColor: AMBER,
                      color: BG,
                      fontFamily: "General Sans",
                      fontWeight: 700,
                      fontSize: 22,
                    }}
                  >
                    {clamp(opts.ctaPrimary, 28)}
                  </div>
                ) : null}
                {opts.ctaSecondary ? (
                  <div
                    style={{
                      display: "flex",
                      padding: "14px 29px",
                      borderRadius: 999,
                      border: `1px solid ${HAIRLINE}`,
                      backgroundColor: "rgba(242,242,239,0.06)",
                      color: FG,
                      fontFamily: "General Sans",
                      fontWeight: 600,
                      fontSize: 22,
                    }}
                  >
                    {clamp(opts.ctaSecondary, 28)}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <Wordmark />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: OG_FONTS() },
  );
}

// ── Product: the unit itself, uncropped ──────────────────────────────────────────────────

/**
 * Catalog share card: brand + product name on the left, the product photo on a lit bone panel
 * on the right, `objectFit: contain` so nothing is cut off.
 *
 * The panel is not decoration. Catalog photos are background-removed square cutouts (06 §4),
 * and half the catalog is matte-black hardware — a black display on the Control Room ground
 * is an invisible product. On bone it reads as a product sheet, which is what a catalog link is.
 *
 * With no usable photo this falls through to the editorial template rather than shipping an
 * empty panel.
 */
export async function renderProductOgImage(opts: {
  name: string;
  brand?: string | null;
  shortSpec?: string | null;
  photoUrl?: string | null;
}): Promise<ImageResponse> {
  const eyebrow = opts.brand ? `Product / ${opts.brand}` : "Product";
  // 480 ≈ the 432px box the photo is drawn into, plus headroom. `format=origin` re-encodes as PNG,
  // which is a heavy format for photographs, so asking for pixels we do not draw is expensive.
  const photo = await fetchImageDataUri(opts.photoUrl, 480);

  if (!photo) {
    return renderOgImage({ eyebrow, title: opts.name, subtitle: opts.shortSpec ?? null });
  }

  const name = clamp(opts.name, 64);
  const nameSize = stepSize(name.length, [[16, 66], [26, 56], [40, 46]], 38);

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          backgroundColor: BG,
          fontFamily: "General Sans",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 640,
            height: OG_SIZE.height,
            padding: "64px 24px 64px 68px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Meter />
            <Eyebrow text={eyebrow} />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "General Sans",
                fontWeight: 700,
                fontSize: nameSize,
                lineHeight: 1.06,
                letterSpacing: -1,
                color: FG,
              }}
            >
              {name}
            </div>
            {opts.shortSpec ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 20,
                  fontFamily: "General Sans",
                  fontWeight: 600,
                  fontSize: 24,
                  lineHeight: 1.34,
                  color: MUTED,
                }}
              >
                {clamp(opts.shortSpec, 120)}
              </div>
            ) : null}
          </div>

          <Wordmark compact />
        </div>

        <div style={{ display: "flex", width: 560, height: OG_SIZE.height, padding: "56px 56px 56px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 504,
              height: 518,
              borderRadius: 24,
              backgroundColor: PANEL,
              padding: 36,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              width={432}
              height={446}
              style={{ width: 432, height: 446, objectFit: "contain" }}
              alt=""
            />
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: OG_FONTS() },
  );
}
