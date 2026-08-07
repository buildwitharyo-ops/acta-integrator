"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import {
  LEARN_CTA,
  LEARN_WA_CONTEXT,
  buildLearnWaMessage,
  type LearnCtaId,
  type LearnWaSource,
} from "@/lib/learn/cta";
import { buildLearnRef, type LearnRefSource } from "@/lib/learn/wa-ref";
import { buildWaLink } from "@/lib/wa";
import { cn } from "@/lib/utils";

export type WaLearnCtaProps = {
  /** Which §13.2 copy block this is. Also the GA4 `cta_type`. */
  cta: LearnCtaId;
  /** The page the reader came from, quoted back inside the message. */
  source: LearnWaSource;
  /**
   * "block" prints the full §13.2 ask — heading, body, limits, button, assurance.
   * "button" prints the link alone, for callers that already wrote the framing
   * (the RT60 refusal block does).
   */
  layout?: "block" | "button";
  /** Overrides `LEARN_CTA[cta].button`. Use only when the surrounding copy demands it. */
  label?: string;
  /** Three-letter ref axis: `AKU` · `TSU` · `RKS` · `ALT` (§13.4). */
  refJalur?: string | null;
  /** 1-based lesson index inside the jalur, or the tool number on a tool page. */
  refIndex?: number | null;
  /** GA4 `slug` — the lesson, jalur or tool slug this CTA sits on. */
  slug?: string | null;
  /** GA4 `jalur` — the jalur slug, when the page belongs to one. */
  jalur?: string | null;
  /** Facts echoed into the message, e.g. "Aula 20 × 12 × 6 m, RT60 hitungan 1,9 detik." */
  detailLines?: readonly string[];
  /** Share URL of a computed result. Site-relative or absolute. */
  resultUrl?: string;
  size?: "sm" | "default" | "lg";
  buttonVariant?: "whatsapp" | "secondary" | "glass";
  id?: string;
  className?: string;
};

/**
 * The WhatsApp ask (03-UI §13.2 / §13.4).
 *
 * **The href is real HTML, not a click handler.** It is server-rendered as a
 * complete `wa.me` link carrying the full prefilled message, so it works with
 * JavaScript disabled, survives "copy link address", and is long-pressable on
 * Android — the platform ~90% of first contact arrives from. JavaScript adds
 * exactly one thing: the four-character ref code.
 *
 * **Why the ref is visible text and not a URL parameter.** Every UTM, click id
 * and cookie dies at the `wa.me` boundary. The only thing that crosses from web
 * → WhatsApp → CRM is the text of the message the human sends, so the token has
 * to be inside the body where a salesperson can read it aloud and paste it into
 * `source_detail`. Without JS the message ships without a ref and the lead is
 * recorded as `learn:no-ref` — a known, accepted 35–45% ceiling (§13.5), not a
 * bug to engineer around.
 *
 * The ref is minted once per mount, not once per click: repeat clicks from the
 * same page view are the same visit and must not fan out into distinct codes.
 */
export function WaLearnCta({
  cta,
  source,
  layout = "block",
  label,
  refJalur,
  refIndex,
  slug,
  jalur,
  detailLines,
  resultUrl,
  size = "default",
  buttonVariant = "whatsapp",
  id,
  className,
}: WaLearnCtaProps) {
  const copy = LEARN_CTA[cta];
  const [waRef, setWaRef] = useState<string | null>(null);

  useEffect(() => {
    // `LearnWaSource.kind` (copy taxonomy) and `LearnRefSource.kind` (ref-prefix
    // taxonomy) are deliberately different vocabularies — "lesson" is the copy's
    // word, "pelajaran" is the ref's. Map, don't merge.
    const refSource: LearnRefSource =
      source.kind === "alat"
        ? { kind: "alat" }
        : {
            kind: source.kind === "lesson" ? "pelajaran" : source.kind,
            jalurSlug: refJalur ?? jalur ?? null,
            slug: slug ?? null,
          };
    setWaRef(buildLearnRef({ source: refSource, index: refIndex ?? null }));
  }, [source.kind, refJalur, refIndex, jalur, slug]);

  const message = buildLearnWaMessage({
    cta,
    source,
    detailLines,
    resultUrl,
    ref: waRef,
  });

  // `message` short-circuits buildWaLink's context switch entirely; `context` is
  // only passed because the signature requires it. The WhatsApp number stays in
  // lib/wa.ts — this component never hard-codes one.
  const href = buildWaLink({ context: "general", message });

  const onClick = () => {
    trackEvent("whatsapp_click", {
      context: LEARN_WA_CONTEXT,
      ref: waRef,
      slug: slug ?? null,
      jalur: jalur ?? null,
      cta_type: cta,
      item: source.title,
    });
  };

  const link = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      id={layout === "button" ? id : undefined}
      data-wa-ref={waRef ?? undefined}
      data-cta={cta}
      className={cn(
        buttonVariants({ variant: buttonVariant, size }),
        // §13.2 labels are sentences, not verbs — the pill has to wrap on a
        // 360px Android screen instead of clipping or overflowing the viewport.
        "h-auto min-h-11 max-w-full whitespace-normal py-3 text-left",
        layout === "button" && className,
      )}
    >
      <WhatsAppGlyph className="h-4 w-4" />
      {label ?? copy.button}
    </a>
  );

  if (layout === "button") return link;

  return (
    <div id={id} className={cn("max-w-[54ch]", className)}>
      <p className="heading-lg text-foreground">{copy.heading}</p>
      <p className="body-md mt-3 text-muted-foreground">{copy.body}</p>

      {copy.limits ? (
        <ul className="mt-4 space-y-2">
          {copy.limits.map((limit) => (
            <li key={limit} className="body-sm flex gap-3 text-muted-foreground">
              <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-border" />
              <span>{limit}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6">{link}</div>
      <p className="caption mt-3 text-muted-foreground">{copy.assurance}</p>
    </div>
  );
}

// Same mark as components/shared/WhatsAppCTA. Duplicated rather than exported
// from there because that component owns its own href/tracking contract and this
// one needs the §14.7 learn params (ref, slug, jalur) it cannot express.
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.82c0 4.54-3.7 8.24-8.25 8.24a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-3.6 4.42c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.42 1.03 2.59.13.16 1.77 2.71 4.29 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.16-.48-.29-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.55-1.36-.76-1.86-.2-.48-.4-.42-.55-.42l-.48-.01Z" />
    </svg>
  );
}
