"use client";

/**
 * The single hook for `Simpan` + Recently Viewed (03 §11.4, §14.4).
 *
 * There is exactly one, on purpose. Two hooks over one key means two hydration
 * paths, and the second one always forgets a rule.
 *
 * THE FOUR RULES, all load-bearing:
 *
 *  1. **Reads happen only inside an effect.** `useSyncExternalStore` calls
 *     `subscribeToStore` from a passive effect and `getServerStoreSnapshot`
 *     during SSR and hydration, both of which return `null`. Reading storage
 *     during render is the #1 failure mode in this area: the server HTML differs
 *     from the client HTML, React throws a hydration error, and the recovery
 *     re-render can drop event listeners so buttons stop working SILENTLY.
 *
 *  2. **`ready` is `false` on first paint, so every consumer renders `null`.**
 *     Consumers are leaves, never wrappers.
 *
 *  3. **Never gate, reorder or condition indexable text on this state.**
 *     Googlebot is always an empty-storage first visit, so the empty state is
 *     what gets indexed. If stored state can change what text exists on the
 *     page, the page has two different meanings and Google only ever sees one.
 *
 *  4. **Never a cookie.** `cookies()` converts every lesson page from SSG to
 *     dynamic and destroys the CDN cache.
 *
 * The same `ready === false` is returned when storage is unavailable — private
 * browsing, or an in-app webview with storage disabled. That is the point: the
 * unavailable path and the first-paint path are one code path, exercised on
 * every load, so it cannot rot into a white screen nobody notices.
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import type { SavedEntry, SeenEntry } from "@/lib/learn/save/schema";
import {
  addSaved,
  clearLearnData,
  getServerStoreSnapshot,
  getStoreSnapshot,
  isDegraded,
  recordSeen,
  removeSaved,
  subscribeToStore,
} from "@/lib/learn/save/store";

const NO_SAVED: readonly SavedEntry[] = [];
const NO_SEEN: readonly SeenEntry[] = [];
const NO_IDS: ReadonlySet<string> = new Set<string>();

export type UseSavedResult = {
  /**
   * `false` until the effect has read storage, and `false` forever when storage
   * is unavailable. **Render `null` while this is false** — never a spinner, and
   * never an empty state, because an empty state that flashes into a filled one
   * is the CLS the fixed-size `SaveButton` box exists to prevent.
   */
  ready: boolean;
  /** Newest first. Empty until `ready`. */
  saved: readonly SavedEntry[];
  /** Recently Viewed, newest first, capped at 8. Empty until `ready`. */
  seen: readonly SeenEntry[];
  /** Membership set over `saved`, for O(1) lookups in a list. */
  savedIds: ReadonlySet<string>;
  savedCount: number;
  /**
   * True when a write failed and this session's state will not survive a reload.
   * Nothing in the UI should shout about it — bookmarks silently not persisting
   * is acceptable, an error toast on a lesson page is not.
   */
  degraded: boolean;
  isSaved: (articleId: string) => boolean;
  save: (articleId: string) => void;
  unsave: (articleId: string) => void;
  /** Flips the bookmark and returns the state it landed in, for the analytics call. */
  toggle: (articleId: string) => boolean;
  /** Wipes the one key. Wire this to "Hapus data belajar saya" in the /learn footer. */
  clear: () => void;
};

export function useSaved(): UseSavedResult {
  const store = useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    getServerStoreSnapshot,
  );

  const saved = store?.saved ?? NO_SAVED;
  const seen = store?.seen ?? NO_SEEN;

  const savedIds = useMemo(
    () => (saved.length ? new Set(saved.map((row) => row.id)) : NO_IDS),
    [saved],
  );

  const isSaved = useCallback((articleId: string) => savedIds.has(articleId), [savedIds]);

  const toggle = useCallback(
    (articleId: string) => {
      const next = !savedIds.has(articleId);
      if (next) addSaved(articleId);
      else removeSaved(articleId);
      return next;
    },
    [savedIds],
  );

  return {
    ready: store !== null,
    saved,
    seen,
    savedIds,
    savedCount: saved.length,
    degraded: isDegraded(),
    isSaved,
    save: addSaved,
    unsave: removeSaved,
    toggle,
    clear: clearLearnData,
  };
}

/**
 * Push the current article onto Recently Viewed. Call once from the lesson page
 * with `articles.id`; pass `null` anywhere there is no article (the hub, a tool
 * page) and it does nothing.
 *
 * Deferred to a macrotask so the write never lands inside the hydration commit,
 * where it would compete with LCP on a mid-range Android.
 */
export function useRecordSeen(articleId: string | null | undefined): void {
  useEffect(() => {
    if (!articleId) return;
    const timer = window.setTimeout(() => recordSeen(articleId), 0);
    return () => window.clearTimeout(timer);
  }, [articleId]);
}
