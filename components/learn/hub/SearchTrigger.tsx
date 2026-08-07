"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PaletteShortcut } from "@/components/learn/search/CommandPalette";
import type { SearchDoc } from "@/lib/learn/search/corpus";
import { buildLearnWaMessage, type LearnWaSource } from "@/lib/learn/cta";
import { buildLearnRef } from "@/lib/learn/wa-ref";
import { buildWaLink } from "@/lib/wa";
import { cn } from "@/lib/utils";

/**
 * The search entry point (03-UI §11.1 / §11.5, 01 §4.6).
 *
 * **This component owns the keyboard shortcut, and the palette does not.** The
 * global ⌘K/Ctrl-K listener cannot live inside the chunk that ⌘K is supposed to
 * load, so the trigger keeps a listener that costs a few hundred bytes and the
 * palette — `cmdk`, the index builder, the synonym map — is `import()`ed on the
 * first open and never before. The palette is mounted with `hotkeys={false}`
 * once it exists, so exactly one listener is live at a time.
 *
 * Search is an accelerator, never the only path to content: every jalur, tool
 * and lesson on /learn is reachable through server-rendered links, so this
 * component failing to load costs speed and nothing else.
 *
 * SSR prints `Ctrl K` and swaps to `⌘K` after mount inside a fixed-width slot —
 * the Indonesian desktop market is overwhelmingly Windows, so `Ctrl K` is the
 * right guess to bake into static HTML, and the slot keeps the swap free of
 * layout shift (CLS budget is 0.05 on this section).
 */

const CommandPalette = dynamic(
  () => import("@/components/learn/search/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

const DEFAULT_WA_SOURCE: LearnWaSource = {
  kind: "lesson",
  title: "Pusat Belajar ACTA",
  path: "/learn",
};

export type SearchTriggerProps = {
  /** The static corpus, built server-side with `buildSearchCorpus()`. */
  docs: readonly SearchDoc[];
  /** Published jalur, offered in the palette's starting state. */
  jalur?: readonly PaletteShortcut[];
  /** Visible label on the pill. */
  label?: string;
  placeholder?: string;
  /**
   * What the WhatsApp handoff in the zero state says the reader was doing.
   * Defaults to the hub itself.
   */
  waSource?: LearnWaSource;
  /** "pill" is the header/hero affordance; "field" reads as a wide search box. */
  variant?: "pill" | "field";
  className?: string;
};

export function SearchTrigger({
  docs,
  jalur,
  label = "Cari materi",
  placeholder,
  waSource = DEFAULT_WA_SOURCE,
  variant = "field",
  className,
}: SearchTriggerProps) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [isMac, setIsMac] = useState(false);
  // One ref per mount, exactly like WaLearnCta: repeat asks from the same page
  // view are one visit and must not fan out into distinct codes.
  const refCode = useRef<string | null>(null);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad|ipod/i.test(window.navigator.userAgent));
  }, []);

  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const askEngineerHref = useCallback(
    (query: string) => {
      if (!refCode.current) {
        refCode.current = buildLearnRef({ source: { kind: "pelajaran" } });
      }
      const trimmed = query.trim();
      const message = buildLearnWaMessage({
        cta: "tanya_engineer",
        source: waSource,
        detailLines: trimmed
          ? [`Saya mencari "${trimmed}" di halaman Learn dan belum menemukan materinya.`]
          : [],
        ref: refCode.current,
      });
      return buildWaLink({ context: "general", message });
    },
    [waSource],
  );

  const shortcut = isMac ? "⌘K" : "Ctrl K";

  const trigger = useMemo(
    () =>
      variant === "pill"
        ? cn(
            "mono-spec inline-flex h-11 items-center gap-3 rounded-pill px-4 text-muted-foreground",
            "ring-1 ring-inset ring-border transition-colors hover:text-foreground hover:ring-foreground/40",
          )
        : cn(
            "mono-spec flex h-12 w-full items-center gap-3 rounded-pill bg-card px-5 text-left",
            "text-muted-foreground ring-1 ring-inset ring-border transition-colors",
            "hover:ring-foreground/40 sm:h-14",
          ),
    [variant],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          trigger,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        {/* Functional affordance, drawn inline at text size — not an icon in a
            circle (13 §C1/§O1). */}
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" strokeLinecap="round" />
        </svg>

        <span className="min-w-0 flex-1 truncate">{label}</span>

        <span
          aria-hidden
          className="hidden w-[3.75rem] shrink-0 text-right tabular-nums text-muted-foreground/70 sm:block"
        >
          {shortcut}
        </span>
      </button>

      {everOpened ? (
        <CommandPalette
          docs={docs}
          open={open}
          onOpenChange={setOpen}
          jalur={jalur}
          askEngineerHref={askEngineerHref}
          hotkeys={false}
          {...(placeholder ? { placeholder } : {})}
        />
      ) : null}
    </>
  );
}

export default SearchTrigger;
