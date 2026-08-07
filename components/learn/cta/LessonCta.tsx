import { CornerTicks } from "@/components/shared/CornerTicks";
import { MeterDivider } from "@/components/shared/MeterDivider";
import { TrackedLink } from "@/components/shared/TrackedLink";
import { DownloadCard } from "@/components/learn/cta/DownloadCard";
import { WaLearnCta } from "@/components/learn/cta/WaLearnCta";
import {
  TOOL_CTA_LABEL,
  toolHref,
  type LearnCtaId,
  type LearnToolSlug,
  type LearnWaSource,
  type LeadMagnetId,
} from "@/lib/learn/cta";
import { cn } from "@/lib/utils";

/**
 * The ONE commercial CTA a lesson may end with (§13.1 class A / H1).
 *
 * H2 — `jadwal_survey` — is deliberately absent: its budget is ≤1 per *jalur*,
 * on the jalur page, never on a lesson. It is unreachable from this type by
 * construction rather than by review.
 */
export type LessonPrimaryCta =
  | {
      kind: "whatsapp";
      /** `review_spesifikasi` for spesifier lessons, `tanya_engineer` otherwise. */
      cta: Extract<LearnCtaId, "tanya_engineer" | "review_spesifikasi">;
      source: LearnWaSource;
      /** Three-letter ref axis of the jalur: `AKU` · `TSU` · `RKS` (§13.4). */
      refJalur?: string | null;
      /** 1-based position of this lesson inside its jalur. */
      refIndex?: number | null;
      slug?: string | null;
      jalur?: string | null;
    }
  | { kind: "unduhan"; asset: LeadMagnetId; sourcePath?: string };

/**
 * The ONE contextual, non-commercial CTA (§13.1 class N / T). Every member stays
 * on the site and asks for nothing, so no combination of primary + secondary can
 * put two commercial asks on a page.
 */
export type LessonSecondaryCta =
  | { kind: "pelajaran-berikutnya"; href: string; title: string }
  | { kind: "jalur"; href: string; title: string }
  | {
      kind: "alat";
      tool: LearnToolSlug;
      /** Seed the calculator with numbers from this lesson. */
      params?: Readonly<Record<string, string | number | null | undefined>>;
    };

export type LessonCtaProps = {
  /**
   * Required, and nullable on purpose. Passing `primary={null}` is how a lesson
   * declares that it ends with substance rather than an ask — which is the
   * majority case. There is no default, so the decision is always written down.
   */
  primary: LessonPrimaryCta | null;
  /** At most one. Omit or pass `null` for none. */
  secondary?: LessonSecondaryCta | null;
  id?: string;
  className?: string;
};

const SECONDARY_EYEBROW = {
  "pelajaran-berikutnya": "Pelajaran berikutnya",
  jalur: "Jalur",
  alat: "Hitung sendiri",
} as const;

/**
 * The end-of-lesson slot, and the enforcement point for the **1 + 1 + 0 rule**
 * (03-UI §13.1).
 *
 * > Every CTA is a withdrawal from a trust account the lesson just deposited
 * > into. A lesson ending with three CTAs is overdrawn.
 *
 * Scarcity is the mechanism — not soft language. Indonesian B2B buyers detect a
 * funnel instantly because every competitor blog is one, so the API is shaped to
 * make overdrawing awkward rather than to trust a reviewer to catch it:
 *
 *   • **1 primary.** One slot, one value, a closed union of exactly two shapes.
 *   • **1 secondary.** One slot, and every member of its union is non-commercial
 *     and stays on the site.
 *   • **0 interstitials.** There is no `children` prop. Nothing else can be
 *     smuggled into this block, and the block only exists below the last H2.
 *
 * Two §13.1 rules live outside this component because they are page-composition
 * facts it cannot see: *no CTA above the first H2*, and *H-class density ≤ 1:3
 * across a jalur*. `resolveLessonCta()` in `lib/learn/cta` computes the second
 * one from a lesson's position, and the route should take `primary` from it
 * rather than choosing by hand.
 */
export function LessonCta({ primary, secondary = null, id, className }: LessonCtaProps) {
  // No ask and no next step is a legitimate state — render nothing rather than
  // an empty frame (13 M2: no void).
  if (!primary && !secondary) return null;

  return (
    <section
      id={id}
      aria-label="Langkah berikutnya"
      className={cn("mt-14", className)}
    >
      <MeterDivider annotation="Langkah berikutnya" />

      {primary ? (
        <div className="mt-8">
          {primary.kind === "unduhan" ? (
            <DownloadCard asset={primary.asset} sourcePath={primary.sourcePath} />
          ) : (
            <div className="relative rounded-md border border-border bg-card p-6 md:p-7">
              <CornerTicks size={10} />
              <WaLearnCta
                cta={primary.cta}
                source={primary.source}
                refJalur={primary.refJalur}
                refIndex={primary.refIndex}
                slug={primary.slug}
                jalur={primary.jalur}
              />
            </div>
          )}
        </div>
      ) : null}

      {secondary ? (
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-border pt-5">
          <p className="mono-label shrink-0 text-muted-foreground">
            {SECONDARY_EYEBROW[secondary.kind]}
          </p>
          <SecondaryLink secondary={secondary} />
        </div>
      ) : null}
    </section>
  );
}

function SecondaryLink({ secondary }: { secondary: LessonSecondaryCta }) {
  const className =
    "body-md min-w-0 text-accent-text underline decoration-border underline-offset-4 transition-colors hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  if (secondary.kind === "alat") {
    return (
      <TrackedLink
        href={toolHref(secondary.tool, secondary.params)}
        prefetch={false}
        ctaId={`alat:${secondary.tool}`}
        location="akhir-pelajaran"
        className={className}
      >
        {TOOL_CTA_LABEL[secondary.tool]}
      </TrackedLink>
    );
  }

  return (
    <TrackedLink
      href={secondary.href}
      ctaId={secondary.kind}
      location="akhir-pelajaran"
      className={className}
    >
      {secondary.title}
    </TrackedLink>
  );
}
