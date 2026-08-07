import { cache } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { slugify } from "@/lib/article";
import { cn } from "@/lib/utils";

/** ONE glossary page with `#anchor` per term — never a per-term route (§3.2, frozen). */
export const GLOSSARY_PATH = "/learn/glosarium";

/** 03-UI §11.3: max 3 glossary links per lesson. Beyond that it reads as SEO plumbing. */
export const MAX_GLOSSARY_LINKS_PER_LESSON = 3;

export type GlossaryLinkProps = {
  /** The term as it appears in the glossary, e.g. "RT60". Also the default anchor source. */
  term: string;
  /** Explicit anchor when the visible text differs from the glossary entry. */
  anchor?: string | null;
  /** Visible text. Defaults to `term` — pass children to link an inflected mention. */
  children?: ReactNode;
  className?: string;
};

type GlossaryLedger = { linked: Set<string>; count: number };

/**
 * Per-request ledger.
 *
 * `React.cache` is scoped to a single server render pass, which is exactly the
 * lifetime this rule needs: a module-level `Set` would leak between requests on a
 * warm Lambda and silently stop linking terms for the *next* reader, while
 * threading a ledger through props would mean touching every node type in the
 * body walker.
 */
const ledger = cache((): GlossaryLedger => ({ linked: new Set<string>(), count: 0 }));

function normalise(term: string): string {
  return term.trim().toLowerCase();
}

export function glossaryAnchor(term: string, explicit?: string | null): string {
  const raw = explicit?.trim() || term;
  return slugify(raw.replace(/^#/, ""));
}

/**
 * Links a term's FIRST mention to `/learn/glosarium#{anchor}` — and only the first.
 *
 * Two rules are enforced here rather than left to review, because both fail the
 * same way (nobody notices until the page is live and reads like a link farm):
 *
 *  1. **First mention only.** A per-render `Set` swallows every repeat of the same
 *     term. A lesson that says "RT60" fourteen times links it once; the other
 *     thirteen render as plain text.
 *  2. **At most three linked terms per lesson** (§11.3). Past three, the
 *     component degrades to plain text rather than throwing or truncating content
 *     — the sentence is unchanged, only the link disappears.
 *
 * Both rules are decided at build/render time on the server. There is no
 * client-side term scanner: rewriting body text in the browser would change the
 * DOM after hydration, which is precisely the pattern that breaks both the CLS
 * budget and the "what Googlebot sees is what the reader sees" guarantee.
 *
 * Server component by construction — `cache()` has no meaning in a client render,
 * so importing this into a `"use client"` module is a mistake the type system
 * cannot catch. Body blocks are all server-rendered; keep it that way.
 */
export function GlossaryLink({ term, anchor, children, className }: GlossaryLinkProps) {
  const label = children ?? term;
  const key = normalise(term);
  if (!key) return <>{label}</>;

  const state = ledger();
  const alreadyLinked = state.linked.has(key);
  const overBudget = !alreadyLinked && state.count >= MAX_GLOSSARY_LINKS_PER_LESSON;

  if (alreadyLinked || overBudget) return <>{label}</>;

  state.linked.add(key);
  state.count += 1;

  return (
    <Link
      href={`${GLOSSARY_PATH}#${glossaryAnchor(term, anchor)}`}
      data-glossary={key}
      className={cn(
        "border-b border-dashed border-foreground/40 text-foreground",
        "transition-colors hover:border-primary hover:text-accent-text",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {label}
    </Link>
  );
}
