import Link from "next/link";
import { CornerTicks } from "@/components/shared/CornerTicks";
import {
  REGISTER_LABEL,
  REGISTER_ORDER,
  getGlossaryTerm,
  type GlossaryTerm,
} from "@/lib/learn/glossary";
import { cn } from "@/lib/utils";

/**
 * One glossary term, addressed by `#anchor` (02-DATA-SEO §8.5, decision D8).
 *
 * **Server component, zero client JavaScript.** The glossary carries ~54 entries
 * on one URL and has to clear a 90+ mobile Lighthouse score, so nothing here
 * hydrates: no disclosure widget, no copy-link button, no in-page search. Search
 * is the command palette's job, and it lives on the hub.
 *
 * The three-register block is the reason this page can rank. A buyer types
 * *"ruangan bergema"*, an engineer types *"reverberation time"*, and a consultant
 * writes *"waktu dengung"* — three queries, three vocabularies, one object.
 * Printing all three in the visible body (not only in `alternateName`) is what
 * lets a reader recognise their own word and what gives the passage something to
 * be retrieved on.
 *
 * Related links are resolved by the page against what is actually published and
 * passed in already-filtered. A link that cannot resolve is not rendered — there
 * is no "segera hadir", because a reference page that promises pages it does not
 * have is a reference page nobody trusts twice.
 */

export type GlossaryEntryLink = { href: string; label: string };

export type GlossaryEntryProps = {
  term: GlossaryTerm;
  /** Published lessons only. Resolved by the route. */
  lessonLinks?: readonly GlossaryEntryLink[];
  /** Published calculators only. Resolved by the route. */
  toolLinks?: readonly GlossaryEntryLink[];
  className?: string;
};

export function GlossaryEntry({
  term,
  lessonLinks = [],
  toolLinks = [],
  className,
}: GlossaryEntryProps) {
  const crossTerms = (term.related?.terms ?? [])
    .map((id) => getGlossaryTerm(id))
    .filter((entry): entry is GlossaryTerm => Boolean(entry));

  const hasLinks = lessonLinks.length > 0 || toolLinks.length > 0 || crossTerms.length > 0;

  return (
    <article
      id={term.id}
      // The letter rail is sticky on desktop; without this a jump lands the
      // headword underneath it.
      className={cn("scroll-mt-28 border-t border-border pt-8 md:scroll-mt-32", className)}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="heading-lg text-pretty">{term.term}</h3>
        <Link
          href={`#${term.id}`}
          aria-label={`Tautan langsung ke istilah ${term.term}`}
          className={cn(
            "mono-spec text-muted-foreground/70 transition-colors hover:text-accent-text",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          #{term.id}
        </Link>
      </div>

      {/* The three registers. A definition list, because that is what it is. */}
      <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
        {REGISTER_ORDER.map((key) => (
          <div key={key} className="contents">
            <dt className="mono-label pt-1 text-muted-foreground">{REGISTER_LABEL[key]}</dt>
            <dd className="body-sm text-foreground">
              {term.register[key].join(" · ")}
            </dd>
          </div>
        ))}
      </dl>

      <p className="body-md mt-5 max-w-[68ch] text-muted-foreground">{term.definition}</p>

      {term.confusedWith ? (
        <div className="relative mt-5 max-w-[68ch] border-l-2 border-primary/60 bg-card px-5 py-4">
          <CornerTicks size={7} />
          <p className="mono-label text-muted-foreground">Sering tertukar dengan</p>
          <p className="body-sm mt-2 text-foreground">{term.confusedWith}</p>
        </div>
      ) : null}

      {term.standards && term.standards.length > 0 ? (
        <p className="mono-spec mt-4 text-muted-foreground">
          Acuan: {term.standards.join(" · ")}
        </p>
      ) : null}

      {hasLinks ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2">
          {toolLinks.map((link) => (
            <EntryLink key={link.href} href={link.href} label={link.label} kind="Alat" />
          ))}
          {lessonLinks.map((link) => (
            <EntryLink key={link.href} href={link.href} label={link.label} kind="Pelajaran" />
          ))}
          {crossTerms.map((entry) => (
            <EntryLink
              key={entry.id}
              href={`#${entry.id}`}
              label={entry.term}
              kind="Istilah"
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function EntryLink({
  href,
  label,
  kind,
}: {
  href: string;
  label: string;
  kind: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-3 py-2",
        "transition-colors hover:border-primary/60 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "focus-visible:ring-offset-background",
      )}
    >
      <span className="mono-label text-muted-foreground">{kind}</span>
      <span className="body-sm text-foreground">{label}</span>
    </Link>
  );
}
