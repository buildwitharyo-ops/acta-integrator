"use client";

/**
 * ⌘K search over the static /learn payload (03 §11.5, §14.3).
 *
 * ── LAZY BY CONTRACT ───────────────────────────────────────────────────────
 * This module must NEVER sit in the initial bundle of a lesson page — cmdk plus
 * Radix Dialog plus the engine is most of the 10–20 KB a lesson page has left
 * after the framework (§14.6). Load it from the always-present `SearchTrigger`:
 *
 *   const CommandPalette = dynamic(() => import("@/components/learn/search/CommandPalette"), {
 *     ssr: false,        // there is nothing to server-render: it starts closed
 *   });
 *
 * and mount it only once the reader has signalled intent (focus, hover, or the
 * first ⌘K). It is CONTROLLED — `open` and `onOpenChange` are required — because
 * **the global shortcut has to live in the trigger, not in here.** A keyboard
 * handler that only exists after the chunk has loaded cannot be the thing that
 * loads the chunk. The trigger owns ⌘K/Ctrl-K and `/` before mount; once mounted
 * this component also handles them, and the two are idempotent by construction:
 * this one SETS a state rather than toggling it, so a trigger that toggles and a
 * palette that sets always agree on the result.
 *
 * ── PROGRESSIVE ENHANCEMENT ────────────────────────────────────────────────
 * Search is an accelerator, never a path. /learn must stay fully browsable with
 * JavaScript disabled — every lesson, every jalur, every room archetype reachable
 * by a plain link. Nothing here is allowed to become the only route to a page.
 *
 * ── PRIVACY ────────────────────────────────────────────────────────────────
 * The query string is NEVER sent to GA4. A free-text search box is the most
 * reliable accidental-PII vector on any site — people paste names, phone numbers
 * and project codes into them. Only `q_len` and `result_count` leave the page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SearchResultRow } from "@/components/learn/search/SearchResultRow";
import type { SearchDoc } from "@/lib/learn/search/corpus";
import {
  MIN_QUERY_LENGTH,
  createSearchIndex,
  flattenResults,
  searchLearn,
  type SearchResult,
} from "@/lib/learn/search/query";
import { cn } from "@/lib/utils";

/**
 * The /learn GA4 events (§14.7) are not in the `AnalyticsEvent` union in
 * `lib/analytics.ts`, which this task does not own. Calling `gtag` directly here
 * keeps that file untouched; the guard is the same one `trackEvent` uses.
 */
function track(event: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, params);
}

/** §11.5 — the announcement and the analytics are debounced, the results are not. */
const ANNOUNCE_DEBOUNCE_MS = 400;

export type PaletteShortcut = {
  label: string;
  href: string;
  /** Optional second line. */
  hint?: string;
};

export type CommandPaletteProps = {
  /** The static payload, built server-side by `buildSearchCorpus()`. */
  docs: readonly SearchDoc[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The published jalur, offered in the zero state. Two at launch. Pass them
   * from the hub rather than hard-coding: an unpublished jalur must be
   * unrepresentable here exactly as it is everywhere else.
   */
  jalur?: readonly PaletteShortcut[];
  /**
   * "Tidak ketemu? Tanya langsung ke engineer ACTA →" with the query prefilled.
   * Build the href with `buildLearnWaMessage()` + `buildLearnRef()` in the
   * caller — this component does not own CTA copy or ref generation.
   */
  askEngineerHref?: (query: string) => string;
  placeholder?: string;
  /** Set false when the mounting trigger already owns ⌘K and `/`. */
  hotkeys?: boolean;
};

const GLOSSARY_HREF = "/learn/glosarium";
const TOOLS_HREF = "/learn/alat";

export function CommandPalette({
  docs,
  open,
  onOpenChange,
  jalur = [],
  askEngineerHref,
  placeholder = "Cari pelajaran, jalur, alat, atau istilah…",
  hotkeys = true,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const lastReported = useRef<string>("");

  const index = useMemo(() => createSearchIndex(docs), [docs]);
  const outcome = useMemo(() => searchLearn(index, query), [index, query]);
  const flat = useMemo(() => flattenResults(outcome), [outcome]);
  const hasQuery = outcome.normalized.length >= MIN_QUERY_LENGTH;
  const isEmpty = hasQuery && outcome.total === 0;

  // Reset on close so the next open is a clean surface rather than the previous
  // reader's half-finished thought.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setAnnouncement("");
      lastReported.current = "";
    }
  }, [open]);

  // Debounced: one `aria-live` announcement and one GA4 event per pause, not one
  // per keystroke. Announcing every keystroke is worse than announcing nothing.
  useEffect(() => {
    if (!open || !hasQuery) return;
    const timer = window.setTimeout(() => {
      setAnnouncement(
        outcome.total === 0
          ? `Tidak ada hasil untuk pencarian ini.`
          : `${outcome.total} hasil ditemukan.`,
      );
      const key = `${outcome.normalized}:${outcome.total}`;
      if (lastReported.current === key) return;
      lastReported.current = key;
      const qLen = outcome.normalized.length;
      track("learn_search", { q_len: qLen, result_count: outcome.total });
      if (outcome.total === 0) track("learn_search_zero", { q_len: qLen });
    }, ANNOUNCE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [open, hasQuery, outcome.normalized, outcome.total]);

  // ⌘K / Ctrl-K and `/`. Set-based, never toggle-based, so this cannot fight the
  // trigger's own pre-mount handler.
  useEffect(() => {
    if (!hotkeys) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
        return;
      }
      if (event.key !== "/" || open) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      onOpenChange(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeys, open, onOpenChange]);

  const go = useCallback(
    (href: string, event: string, params: Record<string, unknown>) => {
      track(event, params);
      onOpenChange(false);
      if (/^https?:\/\//.test(href)) window.location.assign(href);
      else router.push(href);
    },
    [onOpenChange, router],
  );

  const selectResult = useCallback(
    (result: SearchResult) => {
      const rank = flat.findIndex((row) => row.doc.href === result.doc.href);
      go(result.doc.href, "learn_search_select", {
        rank: rank >= 0 ? rank + 1 : null,
        target_slug: result.doc.slug,
      });
    },
    [flat, go],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Mobile is a full-screen sheet, not a centred dialog: a 600px dialog on
        // a 390px viewport under a virtual keyboard is unusable.
        className={cn(
          "left-0 top-0 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0",
          "sm:left-1/2 sm:top-[8vh] sm:h-auto sm:max-w-2xl sm:-translate-x-1/2 sm:rounded-lg sm:border",
        )}
        onEscapeKeyDown={(event) => {
          // Two-stage Esc (Linear/Raycast muscle memory): clear first, close second.
          if (query.length > 0) {
            event.preventDefault();
            setQuery("");
          }
        }}
      >
        <DialogTitle className="sr-only">Cari materi ACTA Learn</DialogTitle>
        <DialogDescription className="sr-only">
          Ketik kata kunci. Gunakan panah atas dan bawah untuk memilih, Enter untuk membuka, Esc
          untuk menutup.
        </DialogDescription>

        <Command
          shouldFilter={false}
          loop
          label="Cari materi ACTA Learn"
          className="flex min-h-0 flex-1 flex-col rounded-none bg-transparent sm:rounded-lg"
        >
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
            className="h-12 pr-8"
          />

          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>

          <CommandList className="max-h-none flex-1 overflow-y-auto p-1 sm:max-h-[56vh]">
            {!hasQuery ? (
              <StarterGroups jalur={jalur} go={go} />
            ) : isEmpty ? (
              <ZeroState
                query={outcome.query}
                suggestions={outcome.suggestions}
                jalur={jalur}
                askEngineerHref={askEngineerHref}
                onSelectResult={selectResult}
                go={go}
              />
            ) : (
              outcome.groups.map((group) => (
                <CommandGroup key={group.kind} heading={group.label}>
                  {group.results.map((result) => (
                    <CommandItem
                      key={`${result.doc.kind}:${result.doc.slug}`}
                      value={`${result.doc.kind}:${result.doc.slug}`}
                      onSelect={() => selectResult(result)}
                      className="min-h-11 cursor-pointer items-start px-2 py-2"
                    >
                      <SearchResultRow result={result} />
                    </CommandItem>
                  ))}
                  {group.total > group.results.length ? (
                    <p className="px-2 pb-1 pt-0.5 text-xs text-muted-foreground">
                      +{group.total - group.results.length} lainnya di{" "}
                      {group.label.toLowerCase()}
                    </p>
                  ) : null}
                </CommandGroup>
              ))
            )}
          </CommandList>

          <FooterHints />
        </Command>
      </DialogContent>
    </Dialog>
  );
}

type GoFn = (href: string, event: string, params: Record<string, unknown>) => void;

/** Before anything is typed: the shape of the corpus, not a blank box. */
function StarterGroups({ jalur, go }: { jalur: readonly PaletteShortcut[]; go: GoFn }) {
  return (
    <>
      {jalur.length > 0 ? (
        <CommandGroup heading="Mulai dari jalur">
          {jalur.map((item) => (
            <ShortcutItem key={item.href} item={item} go={go} />
          ))}
        </CommandGroup>
      ) : null}
      <CommandGroup heading="Rujukan cepat">
        <ShortcutItem
          item={{ label: "Alat & kalkulator", href: TOOLS_HREF, hint: "Hitung ukuran layar, RT60, jarak proyektor" }}
          go={go}
        />
        <ShortcutItem
          item={{ label: "Glosarium istilah AV", href: GLOSSARY_HREF, hint: "RT60, DISCAS, STI, dan lainnya" }}
          go={go}
        />
      </CommandGroup>
    </>
  );
}

/**
 * The zero-result screen is the most useful screen in the product (§11.5), and
 * the order is deliberate: three near-misses (a typo is the likeliest cause),
 * then the jalur, then the glossary, then a human. Never a bare "no results".
 */
function ZeroState({
  query,
  suggestions,
  jalur,
  askEngineerHref,
  onSelectResult,
  go,
}: {
  query: string;
  suggestions: readonly SearchResult[];
  jalur: readonly PaletteShortcut[];
  askEngineerHref?: (query: string) => string;
  onSelectResult: (result: SearchResult) => void;
  go: GoFn;
}) {
  const waHref = askEngineerHref?.(query);
  return (
    <>
      <p className="px-3 pb-1 pt-3 text-sm text-foreground">
        Belum ada materi untuk «{query.trim()}»
      </p>

      {suggestions.length > 0 ? (
        <CommandGroup heading="Mungkin maksud Anda">
          {suggestions.map((result) => (
            <CommandItem
              key={`near:${result.doc.kind}:${result.doc.slug}`}
              value={`near:${result.doc.kind}:${result.doc.slug}`}
              onSelect={() => onSelectResult(result)}
              className="min-h-11 cursor-pointer items-start px-2 py-2"
            >
              <SearchResultRow result={result} />
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {jalur.length > 0 ? (
        <CommandGroup heading="Telusuri jalur">
          {jalur.map((item) => (
            <ShortcutItem key={item.href} item={item} go={go} />
          ))}
        </CommandGroup>
      ) : null}

      <CommandGroup heading="Atau">
        <ShortcutItem
          item={{ label: "Buka glosarium istilah AV", href: GLOSSARY_HREF }}
          go={go}
        />
        <ShortcutItem item={{ label: "Lihat semua alat & kalkulator", href: TOOLS_HREF }} go={go} />
        {waHref ? (
          <CommandItem
            value="tanya-engineer"
            onSelect={() => go(waHref, "learn_cta_click", { cta_type: "H1", slug: "search-zero" })}
            className="min-h-11 cursor-pointer px-2 py-2 text-sm font-medium text-accent-text"
          >
            Tidak ketemu? Tanya langsung ke engineer ACTA →
          </CommandItem>
        ) : null}
      </CommandGroup>
    </>
  );
}

function ShortcutItem({ item, go }: { item: PaletteShortcut; go: GoFn }) {
  return (
    <CommandItem
      value={item.href}
      onSelect={() => go(item.href, "learn_search_select", { rank: null, target_slug: item.href })}
      className="min-h-11 cursor-pointer flex-col items-start gap-0 px-2 py-2"
    >
      <span className="text-sm font-medium text-foreground">{item.label}</span>
      {item.hint ? <span className="text-xs text-muted-foreground">{item.hint}</span> : null}
    </CommandItem>
  );
}

/** Keyboard affordances, hidden on touch where they are noise. */
function FooterHints() {
  return (
    <div className="hidden items-center gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground sm:flex">
      <span>
        <kbd className="mono-spec">↑↓</kbd> pilih
      </span>
      <span>
        <kbd className="mono-spec">Enter</kbd> buka
      </span>
      <span>
        <kbd className="mono-spec">Esc</kbd> hapus lalu tutup
      </span>
    </div>
  );
}

export default CommandPalette;
