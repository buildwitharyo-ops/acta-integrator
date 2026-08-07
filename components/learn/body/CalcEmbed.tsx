import Link from "next/link";
import { ResultReadout, type ResultTone } from "@/components/learn/alat/_shared/ResultReadout";
import { ShowTheMath, type MathStep } from "@/components/learn/alat/_shared/ShowTheMath";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { fmt, fmtFixed, fmtInt, fmtRange } from "@/lib/learn/format";
import { LEARN_TOOL_SLUGS, TOOL_CTA_LABEL, TOOL_NAME, type LearnToolSlug } from "@/lib/learn/cta";

import { computeScreenSize } from "@/components/learn/alat/ukuran-layar/calc";
import { parseScreenSizeParams, screenSizeHref } from "@/components/learn/alat/ukuran-layar/params";
import { UKURAN_LAYAR_COPY } from "@/components/learn/alat/ukuran-layar/copy.id";

import { computeRt60 } from "@/components/learn/alat/rt60-sabine/calc";
import { parseRt60Params, rt60Href } from "@/components/learn/alat/rt60-sabine/params";
import { RT60_COPY } from "@/components/learn/alat/rt60-sabine/copy.id";

import { compute as computeThrow } from "@/components/learn/alat/throw-distance-proyektor/calc";
import { parseParams as parseThrowParams, buildToolHref } from "@/components/learn/alat/throw-distance-proyektor/params";
import { RESULT as THROW_RESULT, TOOL as THROW_TOOL } from "@/components/learn/alat/throw-distance-proyektor/copy.id";

import { cn } from "@/lib/utils";

/** Raw query-shaped preset, exactly as the tool's own URL would spell it. */
export type CalcPreset = Readonly<Record<string, string | number | null | undefined>>;

export type CalcEmbedProps = {
  tool: LearnToolSlug;
  /**
   * Seeds the embed with this lesson's worked example, written with the tool's
   * own param names (`fv`, `d`, `p`, `l`, `t`, `tr`, `w`, `lm`, …). Anything
   * missing or unparseable falls back to that tool's default preset — the parsers
   * are total, so a typo in the CMS produces a *different* correct answer, never
   * an error state.
   */
  preset?: CalcPreset;
  /** Overrides the tool's own name as the block heading. */
  title?: string;
  /** One line of framing above the result. */
  note?: string | null;
  id?: string;
  className?: string;
};

export function isLearnToolSlug(value: unknown): value is LearnToolSlug {
  return typeof value === "string" && (LEARN_TOOL_SLUGS as readonly string[]).includes(value);
}

type EmbedView = {
  href: string;
  inputEcho: string;
  headline: {
    label: string;
    value: string;
    unit?: string;
    caption?: string;
    verdict?: string;
    tone: ResultTone;
  } | null;
  refusal: { title: string; detail: string } | null;
  steps: readonly MathStep[];
  assumptions: readonly string[];
  standards: readonly string[];
  verifiedAt: string;
};

/** Normalise a CMS preset into the `Record<string, string>` every parser accepts. */
function toQuery(preset: CalcPreset | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!preset) return out;
  for (const [key, value] of Object.entries(preset)) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      out[key] = String(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

const THROW_TONE: Record<"aman" | "marginal" | "kurang", ResultTone> = {
  aman: "good",
  marginal: "warning",
  kurang: "bad",
};

function buildView(tool: LearnToolSlug, preset: CalcPreset | undefined): EmbedView {
  const query = toQuery(preset);

  if (tool === "ukuran-layar") {
    const input = parseScreenSizeParams(query);
    const result = computeScreenSize(input);
    const base: Pick<EmbedView, "href" | "inputEcho" | "standards" | "verifiedAt" | "assumptions"> = {
      href: screenSizeHref(input),
      inputEcho: `Kursi terjauh ${fmtFixed(input.farthestViewerM, 1)} m · layar rencana ${fmtInt(input.plannedDiagonalIn)}"`,
      standards: UKURAN_LAYAR_COPY.standardChip,
      verifiedAt: UKURAN_LAYAR_COPY.verifiedAt,
      assumptions: UKURAN_LAYAR_COPY.assumptions,
    };
    if (result.status === "refused") {
      // A refused room prints no numbers at all — that is the engine's contract,
      // and an embed must not soften it into a "roughly" answer.
      return { ...base, headline: null, refusal: result.refusal, steps: [] };
    }
    return {
      ...base,
      headline: {
        label: result.headline.label,
        value: result.headline.value,
        unit: result.headline.unit,
        caption: result.headline.caption,
        verdict: result.headline.verdict,
        tone: result.headline.tone,
      },
      refusal: null,
      steps: result.steps,
    };
  }

  if (tool === "rt60-sabine") {
    const input = parseRt60Params(query);
    const result = computeRt60(input);
    const { treatment } = result;
    const [targetMin, targetMax] = treatment.targetRange;
    return {
      href: rt60Href(input),
      inputEcho: `${fmtFixed(input.length, 1)} × ${fmtFixed(input.width, 1)} × ${fmtFixed(input.height, 1)} m · ${fmtInt(input.people)} orang`,
      headline: {
        label: RT60_COPY.result.headlineLabel,
        value: fmt(result.tMid),
        unit: RT60_COPY.result.headlineUnit,
        caption: RT60_COPY.result.headlineCaption({
          target: fmt(treatment.targetRt60),
          room: treatment.roomLabel,
          range: fmtRange(targetMin, targetMax),
        }),
        verdict: result.verdict.text,
        tone: result.verdict.tone,
      },
      refusal: null,
      steps: result.steps,
      assumptions: result.assumptions,
      standards: result.standards,
      verifiedAt: result.verifiedAt,
    };
  }

  const { input } = parseThrowParams(query);
  const result = computeThrow(input);
  return {
    href: buildToolHref(input),
    inputEcho: `Throw ratio ${fmt(result.throwRatio)} · layar ${fmtFixed(result.screen.widthM, 1)} m · ${fmtInt(input.lumens)} lumen`,
    headline: {
      label: THROW_RESULT.brightnessLabel,
      value: fmt(result.brightness.flEffective),
      unit: THROW_RESULT.brightnessUnit,
      caption: result.summary,
      verdict: THROW_RESULT.verdict[result.brightness.verdict]({
        target: fmt(result.brightness.targetFL),
      }),
      tone: THROW_TONE[result.brightness.verdict],
    },
    refusal: null,
    steps: result.steps,
    assumptions: result.assumptions,
    standards: THROW_TOOL.standardChips,
    verifiedAt: THROW_TOOL.verifiedAt,
  };
}

/**
 * A calculator inside a lesson body (03-UI §11.3, §14.1).
 *
 * **Server-rendered, zero client JavaScript, a real number in the HTML.** The
 * engine behind each tool is a pure isomorphic `compute()` with no React imports,
 * which is the entire reason this component can exist: the same function that
 * runs on the tool page runs here at render time, so the lesson ships the answer
 * as text — for the reader before hydration, for a crawler, for an answer engine,
 * and for the reader who printed the page.
 *
 * Three rules this block follows, each of which is a decision rather than a
 * detail:
 *
 *  1. **The embed never reads `searchParams`** (§14.1). Its numbers come from the
 *     lesson's own preset, so `/learn/{slug}` stays byte-identical for every
 *     visitor and stays SSG. Interaction lives one click away, on the tool page,
 *     where dynamic rendering is correct.
 *  2. **`ShowTheMath` is CLOSED here and open on the tool page** (§12.5). In a
 *     lesson the substituted arithmetic is supporting evidence the reader may
 *     want; on the tool page it is the product.
 *  3. **The deep link carries the preset**, built by the tool's own href builder,
 *     so it omits defaults, orders params canonically and writes dot decimals.
 *     The reader arrives on the full calculator with this lesson's room already
 *     loaded, which is also the URL they paste into a WhatsApp group.
 *
 * No `next/dynamic({ ssr: false })`, no lazy panel, no skeleton: a widget that
 * renders an empty box until JS lands is exactly the failure this design exists
 * to avoid.
 */
export function CalcEmbed({ tool, preset, title, note, id, className }: CalcEmbedProps) {
  const view = buildView(tool, preset);
  const heading = title ?? TOOL_NAME[tool];

  return (
    <section
      id={id}
      aria-label={heading}
      data-learn-calc-embed={tool}
      className={cn(
        "relative rounded-lg border border-border bg-card p-5 md:p-6 print:break-inside-avoid",
        className,
      )}
    >
      <CornerTicks size={10} />

      <p className="mono-label text-muted-foreground">KALKULATOR</p>
      <h3 className="heading-lg mt-2">{heading}</h3>
      <p className="mono-spec mt-2 text-muted-foreground">{view.inputEcho}</p>
      {note ? <p className="body-sm mt-3 text-foreground/85">{note}</p> : null}

      <div className="mt-6">
        {view.refusal ? (
          <div className="border-l-2 border-destructive pl-4">
            <p className="heading-md text-foreground">{view.refusal.title}</p>
            <p className="body-sm mt-2 text-muted-foreground">{view.refusal.detail}</p>
          </div>
        ) : view.headline ? (
          <ResultReadout
            label={view.headline.label}
            value={view.headline.value}
            unit={view.headline.unit}
            caption={view.headline.caption}
            verdict={view.headline.verdict}
            tone={view.headline.tone}
            size="md"
          />
        ) : null}
      </div>

      {view.steps.length > 0 ? (
        <ShowTheMath
          className="mt-6"
          steps={view.steps}
          assumptions={view.assumptions}
          standards={view.standards}
          verifiedAt={view.verifiedAt}
          open={false}
          tool={tool}
        />
      ) : null}

      <p className="mt-6">
        <Link
          href={view.href}
          className={cn(
            "mono-label inline-flex min-h-11 items-center text-accent-text",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {TOOL_CTA_LABEL[tool]}
        </Link>
      </p>
    </section>
  );
}
