import { CornerTicks } from "@/components/shared/CornerTicks";
import { TrackedLink } from "@/components/shared/TrackedLink";
import { buttonVariants } from "@/components/ui/button";
import type { CalcHandoff } from "@/lib/learn/cta";
import { cn } from "@/lib/utils";

export type CalcHandoffCtaProps = {
  /**
   * Built by a `build*Handoff()` factory in `lib/learn/cta` — never hand-written
   * in a page. The factory returns `null` when the handoff is not warranted, so
   * the usual call site is `{handoff ? <CalcHandoffCta handoff={handoff} /> : null}`
   * and the block cannot appear on a room that does not need it.
   */
  handoff: CalcHandoff;
  id?: string;
  className?: string;
};

/**
 * Routes a reader from one calculator to the next with their numbers already in
 * the query string (03-UI §12.2 edge case, §13.1 class T).
 *
 * This is a **zero-commitment CTA**: it stays on the site, asks for nothing, and
 * therefore does not spend the one commercial CTA a lesson is allowed. It exists
 * because the honest answer at the boundary — above 110" a bigger panel is not a
 * product that exists — is a different tool, not a bigger number.
 *
 * Dashed frame on purpose: this is a route, not a destination. It must not read
 * as another offer panel sitting next to the real one.
 */
export function CalcHandoffCta({ handoff, id, className }: CalcHandoffCtaProps) {
  const headingId = `${id ?? `handoff-${handoff.from}-${handoff.to}`}-judul`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "relative rounded-md border border-dashed border-border bg-background p-5 md:p-6 print:break-inside-avoid",
        className,
      )}
    >
      <CornerTicks size={8} />

      <p className="mono-label text-muted-foreground">{handoff.eyebrow}</p>
      <p id={headingId} className="heading-md mt-3 max-w-[46ch] text-foreground">
        {handoff.heading}
      </p>
      <p className="body-sm mt-3 max-w-[62ch] text-muted-foreground">{handoff.body}</p>

      <TrackedLink
        href={handoff.href}
        prefetch={false}
        ctaId={`alat_handoff:${handoff.to}`}
        location={`alat:${handoff.from}`}
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "mt-5 h-auto min-h-11 max-w-full whitespace-normal py-3 text-left",
        )}
      >
        {handoff.label}
      </TrackedLink>

      {handoff.note ? (
        <p className="caption mt-3 max-w-[62ch] text-muted-foreground">
          {handoff.note}
        </p>
      ) : null}
    </section>
  );
}
