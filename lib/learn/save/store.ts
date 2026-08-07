/**
 * The ONLY module in this codebase that touches `window.localStorage`.
 *
 * If you are about to write `localStorage` anywhere else under /learn: don't.
 * Route it through here, so quota handling, the LRU caps, cross-tab sync, the
 * migration ladder and the UU PDP erase control all keep working.
 *
 * ── WHY localStorage AND NOT IndexedDB (§14.4) ─────────────────────────────
 * The payload is a bounded array of UUIDs, and the SYNCHRONOUS API is a virtue
 * inside `useEffect`: one read, one `setState`, done in the same tick, with no
 * promise that can resolve after the component unmounted.
 *
 * ── WHY NEVER A COOKIE ─────────────────────────────────────────────────────
 * `cookies()` in a /learn route opts the whole route out of static rendering:
 * every lesson page becomes dynamic and the CDN cache is destroyed. A bookmark
 * is worth zero of that.
 *
 * ── SSR AND FIRST PAINT ────────────────────────────────────────────────────
 * `getStoreSnapshot()` returns `null` until `subscribeToStore()` runs, and
 * `subscribeToStore` only ever runs from an effect. So the server HTML and the
 * first client render are identical by construction — no hydration mismatch, and
 * therefore no recovery re-render that could silently drop event listeners.
 *
 * The same `null` is returned when storage is unavailable (private browsing,
 * blocked third-party context, an in-app webview with storage disabled). That is
 * deliberate: the unavailable path and the first-paint path are the SAME code
 * path, so it is exercised on every single page load and cannot rot.
 */

import {
  LEARN_STORAGE_KEY,
  MAX_SAVED,
  capStore,
  createStore,
  parseStore,
  serializeStore,
  type LearnStore,
  type SavedEntry,
  type SeenEntry,
} from "@/lib/learn/save/schema";

/* ------------------------------------------------------------------ *
 * Id minting
 * ------------------------------------------------------------------ */

/**
 * Crockford base32 — the ULID alphabet. I, L, O and U are absent so a code can
 * be read aloud or retyped without ambiguity. (`lib/learn/wa-ref.ts` carries its
 * own copy on purpose: the two modules must not depend on each other, and a
 * 32-character string is a cheaper duplicate than a coupling.)
 */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const webcrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (webcrypto?.getRandomValues) {
    webcrypto.getRandomValues(bytes);
    return bytes;
  }
  // Only reachable in an ancient or exotic engine. A weak id here degrades a
  // merge that does not exist yet; it never touches security.
  for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

/**
 * A ULID: 10 characters of millisecond timestamp then 16 of randomness.
 * Lexicographically sortable, collision-safe enough for one device, and already
 * the primary key of the `learner_bookmarks` table that does not exist yet.
 */
export function ulid(now: number = Date.now()): string {
  let time = "";
  let remaining = Math.max(0, Math.floor(now));
  for (let i = 0; i < 10; i += 1) {
    time = CROCKFORD[remaining % 32]! + time;
    remaining = Math.floor(remaining / 32);
  }
  const bytes = randomBytes(16);
  let random = "";
  for (let i = 0; i < 16; i += 1) random += CROCKFORD[bytes[i]! % 32]!;
  return time + random;
}

function newDeviceId(): string {
  const webcrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (webcrypto?.randomUUID) return webcrypto.randomUUID();
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* ------------------------------------------------------------------ *
 * Module state
 * ------------------------------------------------------------------ */

const CHANNEL_NAME = "acta.learn";
const PROBE_KEY = "acta.learn.probe";

/** `null` means "not hydrated yet, or storage is unavailable" — the same thing to a renderer. */
let cache: LearnStore | null = null;
let hydrated = false;
let available: boolean | null = null;
/** True once a write has failed and state is being kept in memory for the session only. */
let degraded = false;

const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
let storageListener: ((event: StorageEvent) => void) | null = null;

function notify(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      // A broken subscriber must not stop the others from updating.
    }
  }
}

/**
 * Write-probe feature detection. `typeof localStorage` is not enough: Safari in
 * private mode and locked-down in-app webviews expose the object and throw on
 * the first write.
 */
export function isStorageAvailable(): boolean {
  if (available !== null) return available;
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PROBE_KEY, "1");
    window.localStorage.removeItem(PROBE_KEY);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

/** True when writes are failing and the current state will not survive a reload. */
export function isDegraded(): boolean {
  return degraded;
}

function readFromStorage(fallbackDevice: string): LearnStore | null {
  if (!isStorageAvailable()) return null;
  try {
    return parseStore(window.localStorage.getItem(LEARN_STORAGE_KEY), fallbackDevice);
  } catch {
    return null;
  }
}

function write(store: LearnStore): void {
  if (!isStorageAvailable()) {
    degraded = true;
    return;
  }
  try {
    window.localStorage.setItem(LEARN_STORAGE_KEY, serializeStore(store));
    degraded = false;
    return;
  } catch {
    // Quota. Compact once — Recently Viewed goes first, then the oldest half of
    // the bookmarks — and retry exactly once.
  }
  const compacted = capStore({
    ...store,
    seen: [],
    saved: store.saved.slice(0, Math.max(1, Math.floor(MAX_SAVED / 4))),
  });
  try {
    window.localStorage.setItem(LEARN_STORAGE_KEY, serializeStore(compacted));
    degraded = false;
  } catch {
    // Give up quietly. Bookmarks silently not persisting is acceptable; a broken
    // lesson page is not. Never throw, never toast an error (§14.4).
    degraded = true;
  }
}

/**
 * Read → mutate → write inside ONE synchronous block. `localStorage` writes are
 * synchronous and same-origin serialized, so a read-append-write is effectively
 * atomic across tabs, and ULID ids make a duplicated row harmless anyway.
 */
function commit(mutate: (store: LearnStore) => LearnStore): void {
  if (typeof window === "undefined") return;
  // Storage unavailable is a total no-op, NOT an in-memory session store: the
  // subsystem must keep rendering `null`, which is the same path as first paint.
  // A write that merely EXCEEDS QUOTA is different — that one is kept in memory
  // for the session and flagged `degraded`, because the reader saw it succeed.
  if (!isStorageAvailable()) return;
  const device = cache?.device ?? newDeviceId();
  const base = readFromStorage(device) ?? cache ?? createStore(device);
  const next = capStore(mutate(base));
  cache = next;
  hydrated = true;
  write(next);
  try {
    channel?.postMessage(1);
  } catch {
    // A closed channel is not an error worth surfacing.
  }
  notify();
}

function hydrate(): void {
  if (typeof window === "undefined") return;
  const device = cache?.device ?? newDeviceId();
  const loaded = readFromStorage(device);
  cache = isStorageAvailable() ? (loaded ?? createStore(device)) : null;
  hydrated = true;
}

function refreshFromOtherContext(): void {
  if (!hydrated) return;
  const device = cache?.device ?? newDeviceId();
  const loaded = readFromStorage(device);
  cache = loaded ?? cache;
  notify();
}

/* ------------------------------------------------------------------ *
 * The `useSyncExternalStore` contract
 * ------------------------------------------------------------------ */

/**
 * The current store, or `null` before hydration and whenever storage is
 * unavailable. The reference is stable between notifications, which is what
 * `useSyncExternalStore` requires.
 */
export function getStoreSnapshot(): LearnStore | null {
  return cache;
}

/** Always `null`. The server has no storage, and Googlebot is always a first visit. */
export function getServerStoreSnapshot(): null {
  return null;
}

/**
 * Subscribe, hydrating on the first subscriber. React only calls this from an
 * effect, which is precisely why the synchronous read below is safe.
 */
export function subscribeToStore(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const first = listeners.size === 0;
  listeners.add(listener);

  if (first) {
    hydrate();
    storageListener = (event: StorageEvent) => {
      if (event.key === null || event.key === LEARN_STORAGE_KEY) refreshFromOtherContext();
    };
    window.addEventListener("storage", storageListener);
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = () => refreshFromOtherContext();
      } catch {
        channel = null;
      }
    }
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    if (storageListener) {
      window.removeEventListener("storage", storageListener);
      storageListener = null;
    }
    try {
      channel?.close();
    } catch {
      // Already closed.
    }
    channel = null;
  };
}

/* ------------------------------------------------------------------ *
 * Mutations
 * ------------------------------------------------------------------ */

/** Bookmark an article. Idempotent — re-saving refreshes the timestamp only. */
export function addSaved(articleId: string): void {
  if (!articleId) return;
  commit((store) => {
    const at = Date.now();
    const existing = store.saved.find((row) => row.id === articleId);
    const entry: SavedEntry = existing
      ? { ...existing, at }
      : { id: articleId, at, ulid: ulid(at) };
    return { ...store, saved: [entry, ...store.saved.filter((row) => row.id !== articleId)] };
  });
}

export function removeSaved(articleId: string): void {
  if (!articleId) return;
  commit((store) => ({ ...store, saved: store.saved.filter((row) => row.id !== articleId) }));
}

/** Flip the bookmark and return the state it landed in. */
export function toggleSaved(articleId: string): boolean {
  const next = !isSavedNow(articleId);
  if (next) addSaved(articleId);
  else removeSaved(articleId);
  return next;
}

/** Synchronous read of the in-memory mirror. `false` before hydration. */
export function isSavedNow(articleId: string): boolean {
  return Boolean(cache?.saved.some((row) => row.id === articleId));
}

/**
 * Push an article onto Recently Viewed. Fires once per mount from the lesson
 * page; the LRU cap means the write is bounded no matter how much someone reads.
 */
export function recordSeen(articleId: string): void {
  if (!articleId) return;
  commit((store) => {
    const entry: SeenEntry = { id: articleId, at: Date.now() };
    return { ...store, seen: [entry, ...store.seen.filter((row) => row.id !== articleId)] };
  });
}

/**
 * The "Hapus data belajar saya" control required in the /learn footer by the
 * UU PDP 27/2022 posture (§14.7). Removes the key outright — not just the rows —
 * so nothing about the reader survives except a freshly minted, empty store.
 */
export function clearLearnData(): void {
  if (typeof window === "undefined") return;
  try {
    if (isStorageAvailable()) window.localStorage.removeItem(LEARN_STORAGE_KEY);
  } catch {
    // Nothing to do — the next write will report degraded anyway.
  }
  cache = isStorageAvailable() ? createStore(newDeviceId()) : null;
  hydrated = true;
  degraded = false;
  try {
    channel?.postMessage(1);
  } catch {
    // Ignored.
  }
  notify();
}

/**
 * Test seam. Drops every listener and the in-memory mirror so a suite can start
 * from a known state. Never called from application code.
 */
export function resetStoreForTests(): void {
  listeners.clear();
  cache = null;
  hydrated = false;
  available = null;
  degraded = false;
  channel = null;
  storageListener = null;
}
