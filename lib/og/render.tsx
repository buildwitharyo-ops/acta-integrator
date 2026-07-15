import { ImageResponse } from "next/og";
import { GENERAL_SANS_BOLD_B64, GENERAL_SANS_SEMIBOLD_B64, IBM_PLEX_MONO_MEDIUM_B64 } from "./fonts-data";

// Brand OG template (03 §7.3): Control Room #14161A, segmented amber meter, IBM Plex Mono eyebrow,
// General Sans display title, ACTA wordmark. NO gold luxury wash / serif italic (banned). A CMS
// cover is used when present + not a placeholder; otherwise the pure brand template renders.

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const BG = "#14161A";
const FG = "#F2F2EF";
const MUTED = "#9BA0A8";
const AMBER = "#D9962E";
const HAIRLINE = "#2A2E35";

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

// Fetch a CMS image and inline it as a data URI so a failed/slow/unsupported image degrades to the
// brand template instead of throwing inside Satori (which would break the build for an SSG OG).
async function fetchImageDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
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

const METER = [56, 18, 34, 10];
const METER_OPACITY = [1, 0.55, 0.82, 0.4];

export async function renderOgImage(opts: {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  heroUrl?: string | null;
}): Promise<ImageResponse> {
  const [gsSemibold, gsBold, mono] = loadFonts();
  const hero = await fetchImageDataUri(opts.heroUrl);
  const contentWidth = hero ? 700 : OG_SIZE.width;

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
                inset: 0,
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
            <div style={{ display: "flex", gap: 5 }}>
              {METER.map((w, i) => (
                <div key={i} style={{ width: w, height: 6, backgroundColor: AMBER, opacity: METER_OPACITY[i] }} />
              ))}
            </div>
            <div style={{ marginTop: 22, fontFamily: "IBM Plex Mono", fontSize: 22, letterSpacing: 3, color: MUTED }}>
              {opts.eyebrow.toUpperCase()}
            </div>
          </div>

          {/* Middle: title + optional subtitle */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "General Sans",
                fontWeight: 700,
                fontSize: 66,
                lineHeight: 1.04,
                color: FG,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {opts.title.length > 110 ? `${opts.title.slice(0, 110).trimEnd()}…` : opts.title}
            </div>
            {opts.subtitle ? (
              <div
                style={{
                  marginTop: 22,
                  fontFamily: "General Sans",
                  fontWeight: 600,
                  fontSize: 27,
                  lineHeight: 1.32,
                  color: MUTED,
                  display: "flex",
                }}
              >
                {opts.subtitle.length > 140 ? `${opts.subtitle.slice(0, 140).trimEnd()}…` : opts.subtitle}
              </div>
            ) : null}
          </div>

          {/* Bottom: wordmark + hairline + tag */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontFamily: "General Sans", fontWeight: 700, fontSize: 30, letterSpacing: 3, color: FG }}>ACTA</div>
            <div style={{ width: 52, height: 2, backgroundColor: HAIRLINE }} />
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: 16, letterSpacing: 2, color: MUTED }}>
              COMMERCIAL AV SYSTEMS INTEGRATOR
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "General Sans", data: gsSemibold, weight: 600, style: "normal" },
        { name: "General Sans", data: gsBold, weight: 700, style: "normal" },
        { name: "IBM Plex Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
