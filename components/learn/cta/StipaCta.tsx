import { ReferenceTable } from "@/components/learn/alat/_shared/ReferenceTable";
import { WaLearnCta } from "@/components/learn/cta/WaLearnCta";
import {
  LEARN_CTA,
  STIPA_REFUSAL,
  TOOL_NAME,
  TOOL_REF_INDEX,
  TOOL_REF_JALUR,
  toolHref,
  type LearnWaSource,
  type StipaLikelihood,
} from "@/lib/learn/cta";
import { cn } from "@/lib/utils";

export type StipaCtaProps = {
  /**
   * How the computed RT60 relates to the ≥0,50 STI requirement. It selects the
   * bridge sentence only — it never becomes an STI number, because the tool does
   * not have one and saying otherwise is the exact failure this block exists to
   * refuse.
   */
  likelihood: StipaLikelihood;
  /**
   * Room facts echoed into the WhatsApp message, already formatted, e.g.
   * `["Aula 20 × 12 × 6 m, RT60 hitungan 1,9 detik, target 1,0 detik."]`.
   */
  detailLines?: readonly string[];
  /** Share URL of the RT60 result. Site-relative or absolute. */
  resultUrl?: string;
  /** Overrides the default source (the RT60 tool page) when embedded in a lesson. */
  source?: LearnWaSource;
  /** GA4 `slug` of the page this block sits on. Defaults to the RT60 tool slug. */
  slug?: string | null;
  id?: string;
  className?: string;
};

const DEFAULT_SOURCE: LearnWaSource = {
  kind: "alat",
  title: TOOL_NAME["rt60-sabine"],
  path: toolHref("rt60-sabine"),
};

/**
 * The RT60 refusal block and the CTA it earns (03-UI §12.3 / §13.2).
 *
 * The calculator will not print an STI number. The Peutz `%ALcons` approximation
 * every competitor reaches for is valid only for `D < 3.16·Dc`, assumes a single
 * source, and ignores background noise and loudspeaker directivity outright — so
 * this block says what STI depends on, prints the IEC scale so the reader can
 * place their own measurement on it, states the ≥0,50 legal floor for emergency
 * sound systems, and offers the one thing that actually answers the question: a
 * STIPA measurement on site.
 *
 * **This is the highest-intent CTA on the platform, and it converts precisely
 * because it is a refusal.** A reader who has just watched a free tool decline to
 * guess believes the next number it gives them. Softening this into "perkiraan
 * STI" would destroy the mechanism and the block with it.
 */
export function StipaCta({
  likelihood,
  detailLines,
  resultUrl,
  source = DEFAULT_SOURCE,
  slug = "rt60-sabine",
  id,
  className,
}: StipaCtaProps) {
  const headingId = `${id ?? "stipa"}-judul`;
  const copy = LEARN_CTA.jadwal_stipa;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "relative flex gap-4 rounded-md border border-border bg-card p-5 md:p-6 print:break-inside-avoid",
        className,
      )}
    >
      <span aria-hidden className="w-0.5 shrink-0 bg-primary" />

      <div className="min-w-0 flex-1">
        <p className="mono-label text-muted-foreground">{STIPA_REFUSAL.eyebrow}</p>
        <p id={headingId} className="heading-lg mt-3 max-w-[44ch] text-foreground">
          {STIPA_REFUSAL.headline}
        </p>
        <p className="body-md mt-3 max-w-[62ch] text-muted-foreground">
          {STIPA_REFUSAL.why}
        </p>

        <ReferenceTable
          id={`${id ?? "stipa"}-skala`}
          className="mt-6"
          caption={STIPA_REFUSAL.scaleLabel}
          minWidth="20rem"
          columns={[
            { key: "range", label: "Nilai STI", mono: true, width: "10rem" },
            { key: "label", label: "Kualitas" },
          ]}
          rows={STIPA_REFUSAL.scale.map((band) => ({
            range: band.range,
            label: band.label,
          }))}
          note={STIPA_REFUSAL.requirement}
        />

        <p className="body-md mt-6 max-w-[62ch] text-foreground">
          {STIPA_REFUSAL.bridge[likelihood]}
        </p>

        <div className="mt-6">
          <WaLearnCta
            cta="jadwal_stipa"
            layout="button"
            source={source}
            detailLines={detailLines}
            resultUrl={resultUrl}
            refJalur={TOOL_REF_JALUR}
            refIndex={TOOL_REF_INDEX["rt60-sabine"]}
            slug={slug}
          />
        </div>
        <p className="caption mt-3 text-muted-foreground">{copy.assurance}</p>
      </div>
    </section>
  );
}
