"use client";

/**
 * `Simpan` — the only persisted, user-initiated state in /learn (03 §11.4).
 *
 * It survives the cut that removed progress tracking, completion, percentages
 * and "Lanjutkan Belajar" for one reason: it is USER-INITIATED, so its absence
 * after storage loss reads as *"I didn't save that"* rather than *"the site
 * forgot me"*. A link opened from a WhatsApp chat runs in an in-app webview with
 * a separate storage partition, so on the highest-value traffic path this state
 * is routinely empty — and only a user-initiated control degrades gracefully
 * under that.
 *
 * ── ZERO CLS BY CONSTRUCTION ───────────────────────────────────────────────
 * The box is a FIXED SIZE and the label swaps inside it. Nothing reflows when
 * the store hydrates, which matters because bookmark hydration is the only CLS
 * risk on a lesson page and the budget is 0.05 — tighter than the site default.
 *
 * Size note: §11.4 specifies `h-10`, §11.6 requires `min-h-11` (44px) on every
 * new /learn interactive element for the mid-range-Android reality. 44px wins —
 * the CLS mechanism is the FIXED box, not its particular height, so honouring
 * the touch target costs nothing that §11.4 was protecting.
 *
 * Renders `null` until the store has hydrated, and forever when storage is
 * unavailable. Those are the same code path, so it is exercised on every load.
 */

import { useCallback, useState } from "react";

import { useSaved } from "@/lib/learn/save/useSaved";
import { cn } from "@/lib/utils";

/** See the note in `CommandPalette.tsx`: `lib/analytics.ts` is not owned here. */
function track(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, params);
}

export type SaveButtonProps = {
  /** `articles.id` — the UUID. Never the slug: a rename would orphan the record. */
  articleId: string;
  /** Optional lesson title, used only in the screen-reader confirmation. */
  title?: string;
  className?: string;
};

export function SaveButton({ articleId, title, className }: SaveButtonProps) {
  const { ready, isSaved, toggle } = useSaved();
  const [confirmation, setConfirmation] = useState("");

  const saved = isSaved(articleId);

  const onClick = useCallback(() => {
    const next = toggle(articleId);
    track("learn_bookmark", { action: next ? "save" : "unsave" });
    setConfirmation(
      next
        ? `Tersimpan${title ? `: ${title}` : ""}. Buka daftar simpanan di halaman Learn.`
        : `Dihapus dari simpanan${title ? `: ${title}` : ""}.`,
    );
  }, [articleId, title, toggle]);

  // Rule 2 of §14.4: null on first paint, null when storage is unavailable.
  if (!ready) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-11 min-w-[9.5rem] items-center justify-center gap-2 rounded-pill",
          "border px-4 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          saved
            ? "border-primary/40 bg-primary/10 text-accent-text"
            : "border-border text-foreground hover:border-foreground/40 hover:bg-foreground/[0.03]",
          className,
        )}
      >
        {saved ? (
          <span aria-hidden="true" className="text-base leading-none">
            ✓
          </span>
        ) : null}
        {saved ? "Tersimpan" : "Simpan"}
      </button>
      {/* One of the three surfaces permitted an aria-live region (§11.6). Empty
          on mount, so hydration never announces anything. */}
      <span role="status" aria-live="polite" className="sr-only">
        {confirmation}
      </span>
    </>
  );
}

export default SaveButton;
