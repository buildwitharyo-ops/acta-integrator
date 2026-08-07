import { ImageResponse } from "next/og";
import {
  GENERAL_SANS_BOLD_B64,
  GENERAL_SANS_SEMIBOLD_B64,
  IBM_PLEX_MONO_MEDIUM_B64,
} from "@/lib/og/fonts-data";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";
import { decodeToolOgSlug, getToolEntry, type ToolOgCard } from "@/lib/learn/tool-registry";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "ACTA — hasil kalkulator AV";

/**
 * The parameterised share card (03-UI §12.1).
 *
 * **This is the share loop.** A consultant computes a number, pastes the link into
 * a project WhatsApp group, and the preview shows *the answer* — the reverberation
 * time, the screen size, the foot-lamberts — with ACTA's name under it. An image
 * is not an indexable page, so unlike the HTML this route is happy to reflect the
 * reader's own parameters.
 *
 * **How the state gets here.** Next 15.5 compiles a metadata image file into
 * `export async function GET(_, ctx)` — the Request is discarded and the default
 * export receives `{ params, id }` only, so a query string cannot reach this
 * function. The state therefore travels in the one thing the handler does get, the
 * dynamic segment, which the page's `generateMetadata` writes as
 * `/learn/alat/rt60-sabine~p=8~l=6~t=3/opengraph-image`. `~` cannot occur in a
 * slug (`^[a-z0-9]+(-[a-z0-9]+)*$`), so the split is unambiguous; readers never
 * see this URL, and every distinct result gets a distinct image URL, which is what
 * makes the social caches (they key on the image URL) show a different card per
 * shared result instead of one stale preview for the whole tool.
 *
 * NO `generateStaticParams` (§14.1): a Satori render plus an Resvg encode is
 * ~300–600 ms, the parameter space is unbounded by definition, and the CDN caches
 * the result so the first crawler pays once.
 */

const BG = "#14161A";
const FG = "#F2F2EF";
const MUTED = "#9BA0A8";
const AMBER = "#D9962E";
const HAIRLINE = "#2A2E35";
const GOOD = "#3DBD7B";
const BAD = "#C22E2E";

const TONE_COLOR: Record<ToolOgCard["tone"], string> = {
  neutral: MUTED,
  good: GOOD,
  warning: AMBER,
  bad: BAD,
};

const METER = [56, 18, 34, 10];
const METER_OPACITY = [1, 0.55, 0.82, 0.4];

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function headlineSize(text: string): number {
  if (text.length <= 18) return 92;
  if (text.length <= 28) return 76;
  if (text.length <= 40) return 62;
  return 52;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { key, query } = decodeToolOgSlug(slug);
  const entry = getToolEntry(key);

  // An unknown `component_key` — or a hand-typed URL — degrades to the brand
  // template rather than 500-ing, because a 500 here is a broken link preview.
  if (!entry) {
    return renderOgImage({
      eyebrow: "Learn / Alat",
      title: "Kalkulator AV ACTA",
      subtitle: "Ukuran layar, waktu dengung, dan kecerahan proyektor — dihitung, bukan ditebak.",
    });
  }

  const card = entry.build(query).view.og;
  const toneColor = TONE_COLOR[card.tone];

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BG,
          fontFamily: "General Sans",
          padding: 72,
          position: "relative",
        }}
      >
        {/* Corner ticks — the same instrument frame the site uses. */}
        <div style={{ position: "absolute", left: 40, top: 40, width: 22, height: 22, borderLeft: `2px solid ${HAIRLINE}`, borderTop: `2px solid ${HAIRLINE}`, display: "flex" }} />
        <div style={{ position: "absolute", right: 40, top: 40, width: 22, height: 22, borderRight: `2px solid ${HAIRLINE}`, borderTop: `2px solid ${HAIRLINE}`, display: "flex" }} />
        <div style={{ position: "absolute", left: 40, bottom: 40, width: 22, height: 22, borderLeft: `2px solid ${HAIRLINE}`, borderBottom: `2px solid ${HAIRLINE}`, display: "flex" }} />
        <div style={{ position: "absolute", right: 40, bottom: 40, width: 22, height: 22, borderRight: `2px solid ${HAIRLINE}`, borderBottom: `2px solid ${HAIRLINE}`, display: "flex" }} />

        {/* Top — signal meter + which calculator this is */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {METER.map((width, index) => (
              <div
                key={index}
                style={{
                  width,
                  height: 6,
                  backgroundColor: AMBER,
                  opacity: METER_OPACITY[index] ?? 1,
                }}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 22,
              fontFamily: "IBM Plex Mono",
              fontSize: 21,
              letterSpacing: 3,
              color: MUTED,
              display: "flex",
            }}
          >
            {clamp(card.eyebrow.toUpperCase(), 46)}
          </div>
        </div>

        {/* Middle — THE ANSWER, then the numbers it was computed from */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "General Sans",
              fontWeight: 700,
              fontSize: headlineSize(card.headline),
              lineHeight: 1.02,
              letterSpacing: -1.5,
              color: FG,
            }}
          >
            {clamp(card.headline, 52)}
          </div>

          {card.verdict ? (
            <div style={{ display: "flex", marginTop: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: `2px solid ${toneColor}`,
                  borderRadius: 999,
                  padding: "10px 22px",
                  fontFamily: "General Sans",
                  fontWeight: 600,
                  fontSize: 24,
                  color: toneColor,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: toneColor, display: "flex" }} />
                {clamp(card.verdict, 58)}
              </div>
            </div>
          ) : null}

          {card.specs.length > 0 ? (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                paddingTop: 24,
                borderTop: `2px solid ${HAIRLINE}`,
                fontFamily: "IBM Plex Mono",
                fontSize: 25,
                lineHeight: 1.45,
                color: MUTED,
              }}
            >
              {clamp(card.specs.join("  ·  "), 118)}
            </div>
          ) : null}
        </div>

        {/* Bottom — who did the arithmetic */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "General Sans", fontWeight: 700, fontSize: 30, letterSpacing: 3, color: FG, display: "flex" }}>
            ACTA
          </div>
          <div style={{ width: 44, height: 2, backgroundColor: HAIRLINE, display: "flex" }} />
          <div style={{ fontFamily: "IBM Plex Mono", fontSize: 16, letterSpacing: 2, color: MUTED, display: "flex" }}>
            {clamp(`${entry.shortName.toUpperCase()} · DIVERIFIKASI ${entry.verifiedAt}`, 70)}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        {
          name: "General Sans",
          data: Buffer.from(GENERAL_SANS_SEMIBOLD_B64, "base64"),
          weight: 600,
          style: "normal",
        },
        {
          name: "General Sans",
          data: Buffer.from(GENERAL_SANS_BOLD_B64, "base64"),
          weight: 700,
          style: "normal",
        },
        {
          name: "IBM Plex Mono",
          data: Buffer.from(IBM_PLEX_MONO_MEDIUM_B64, "base64"),
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
