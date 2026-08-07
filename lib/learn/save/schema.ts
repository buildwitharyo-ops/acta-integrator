/**
 * The persisted shape of `Simpan` + Recently Viewed (03 §11.4, §14.4).
 *
 * FROZEN NOW so it cannot be improvised later. One key, one version, one island.
 *
 * WHAT IS DELIBERATELY ABSENT, and must stay absent (§11.0, §11.4):
 * no progress, no completion, no percent, no certificates, no "Lanjutkan
 * Belajar". The decisive argument is not engineering cost — **a link opened from
 * a WhatsApp chat renders inside WhatsApp's in-app webview, whose storage
 * partition is entirely separate from the user's main browser.** WhatsApp group
 * forwarding is the dominant Indonesian B2B distribution channel, so on the
 * highest-value traffic path this store is empty on arrival and empty again on
 * the next visit. A progress module would therefore render its empty state most
 * often for the readers who matter most, teaching exactly those people that the
 * site is broken.
 *
 * `Simpan` survives that argument only because it is USER-INITIATED: its absence
 * after storage loss reads as "I didn't save that", not "the site forgot me".
 * That asymmetry is the entire test any future addition here must pass.
 *
 * ── KEYED BY `articles.id` (UUID), NEVER BY SLUG ────────────────────────────
 * Slugs are editorially mutable and `saveArticle` already inserts a `redirects`
 * row on rename, so a slug-keyed store would silently orphan every bookmark on
 * the first rename — invisibly, with no error and no way to recover the link.
 *
 * ── THE MIGRATION LADDER (§14.4) ───────────────────────────────────────────
 * The version lives INSIDE the payload, never in the key name: bumping the key
 * name is a data-loss migration disguised as a rename. Three rules:
 *   1. never throw;
 *   2. discard beats corrupt — bookmark state is not precious enough to risk a
 *      broken page for;
 *   3. a FUTURE version number means discard, because an older build cannot
 *      know what a newer one wrote and half-understanding it is worse than
 *      starting clean.
 */

/**
 * The one key. Never add a second — a second key is a second thing to migrate,
 * a second quota risk and a second thing to forget in "Hapus data belajar saya".
 */
export const LEARN_STORAGE_KEY = "acta.learn.v1";

/** Bump ONLY together with a `migrate()` branch that reads the old shape. */
export const CURRENT_VERSION = 1;

/** LRU caps (§14.4). Past these, the oldest entry is evicted on write. */
export const MAX_SAVED = 40;
export const MAX_SEEN = 8;

/** Serialized-length ceiling. Past it, evict oldest and re-serialize. */
export const MAX_SERIALIZED_CHARS = 24_000;

/** A bookmark. `ulid` and the store's `device` exist for a merge that does not exist yet. */
export type SavedEntry = {
  /** `articles.id` — a UUID. */
  id: string;
  /** Epoch ms the reader pressed Simpan. */
  at: number;
  /**
   * Client-minted ULID. Nothing reads it today. It costs nothing now and is the
   * only shape that merges cleanly if auth ever arrives: it becomes the primary
   * key of `learner_bookmarks`, which makes the merge idempotent by construction
   * (`ON CONFLICT DO NOTHING`).
   */
  ulid: string;
};

/** A Recently Viewed row. No ULID: it is a local convenience and never syncs. */
export type SeenEntry = {
  id: string;
  at: number;
};

export type LearnStore = {
  v: number;
  /** UUID minted once per browser profile. Only meaningful in a future merge. */
  device: string;
  /** Newest first. */
  saved: SavedEntry[];
  /** Newest first, capped at `MAX_SEEN`. */
  seen: SeenEntry[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `articles.id` is a Postgres uuid, so anything else in this slot is corruption. */
export function isArticleId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function createStore(device: string): LearnStore {
  return { v: CURRENT_VERSION, device, saved: [], seen: [] };
}

/** Newest first, one row per article id, capped. Pure. */
export function dedupeByNewest<T extends { id: string; at: number }>(
  entries: readonly T[],
  cap: number,
): T[] {
  const byId = new Map<string, T>();
  for (const entry of entries) {
    const existing = byId.get(entry.id);
    if (!existing || entry.at > existing.at) byId.set(entry.id, entry);
  }
  return Array.from(byId.values())
    .sort((a, b) => b.at - a.at)
    .slice(0, cap);
}

function readSaved(value: unknown): SavedEntry[] {
  if (!Array.isArray(value)) return [];
  const rows: SavedEntry[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const { id, at, ulid } = row as Record<string, unknown>;
    if (!isArticleId(id) || !isTimestamp(at)) continue;
    rows.push({ id, at, ulid: typeof ulid === "string" && ulid ? ulid : "" });
  }
  return dedupeByNewest(rows, MAX_SAVED);
}

function readSeen(value: unknown): SeenEntry[] {
  if (!Array.isArray(value)) return [];
  const rows: SeenEntry[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const { id, at } = row as Record<string, unknown>;
    if (!isArticleId(id) || !isTimestamp(at)) continue;
    rows.push({ id, at });
  }
  return dedupeByNewest(rows, MAX_SEEN);
}

/**
 * Coerce whatever was in storage into the current shape.
 *
 * Returns `null` to mean DISCARD — the caller writes a fresh store over it. That
 * happens for unparseable input, a non-object payload, and any version this
 * build does not recognise (including future ones).
 *
 * Individual bad ROWS are dropped rather than discarding the whole store: one
 * malformed bookmark should not cost a reader the other thirty-nine.
 *
 * `fallbackDevice` is used only when the stored device id is missing or invalid.
 * It is a parameter rather than an internal `crypto.randomUUID()` call so this
 * module stays pure and testable — minting lives in `store.ts`.
 */
export function migrate(raw: unknown, fallbackDevice: string): LearnStore | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const candidate = raw as Record<string, unknown>;
  const version = typeof candidate.v === "number" ? candidate.v : 0;
  if (version !== CURRENT_VERSION) return null;

  const device =
    typeof candidate.device === "string" && candidate.device.length >= 8
      ? candidate.device
      : fallbackDevice;

  return {
    v: CURRENT_VERSION,
    device,
    saved: readSaved(candidate.saved),
    seen: readSeen(candidate.seen),
  };
}

/** Parse + migrate in one step. Never throws; `null` means discard. */
export function parseStore(raw: string | null | undefined, fallbackDevice: string): LearnStore | null {
  if (!raw) return null;
  try {
    return migrate(JSON.parse(raw), fallbackDevice);
  } catch {
    return null;
  }
}

/** Apply both LRU caps. Always run this immediately before serializing. */
export function capStore(store: LearnStore): LearnStore {
  return {
    ...store,
    saved: dedupeByNewest(store.saved, MAX_SAVED),
    seen: dedupeByNewest(store.seen, MAX_SEEN),
  };
}

/**
 * Serialize, then shrink until it fits `MAX_SERIALIZED_CHARS`. Recently Viewed
 * is sacrificed before a bookmark: one is a convenience the reader never asked
 * for, the other is a thing they explicitly pressed a button to keep.
 */
export function serializeStore(store: LearnStore): string {
  let working = capStore(store);
  let text = JSON.stringify(working);
  while (text.length > MAX_SERIALIZED_CHARS && (working.seen.length > 0 || working.saved.length > 1)) {
    working =
      working.seen.length > 0
        ? { ...working, seen: working.seen.slice(0, -1) }
        : { ...working, saved: working.saved.slice(0, -1) };
    text = JSON.stringify(working);
  }
  return text;
}

/**
 * ── THE FUTURE AUTH-MERGE PATH, decided now so it is never improvised ───────
 *
 * If bookmarks ever sync, the table is:
 *
 *   create table learner_bookmarks (
 *     ulid        text primary key,            -- the CLIENT ulid → ON CONFLICT DO NOTHING
 *     user_id     uuid not null references auth.users(id) on delete cascade,
 *     device_id   uuid not null,
 *     article_id  uuid not null references articles(id) on delete cascade,
 *     saved_at    timestamptz not null,
 *     ingested_at timestamptz not null default now()
 *   );
 *
 * Merge = `dedupeByNewest([...remote, ...local])`, idempotent because the ULID is
 * the primary key. Writes go through a SERVICE-ROLE server action, never an anon
 * RLS policy: this codebase has zero anon INSERT policies and zero anon-callable
 * RPCs, and bookmark sync must not be the first.
 *
 * ── AND THE DECISION THAT IS ALREADY MADE ──────────────────────────────────
 * **If completion state is ever built, it must be an APPEND-ONLY EVENT LOG —
 * `{ ulid, deviceId, articleId, kind: "completed" | "uncompleted", at }` — never
 * a mutable boolean on a row.** `uncompleted` has to be an EVENT rather than a
 * deletion, because a deletion carries no timestamp and no device: merging two
 * devices where one deleted and the other kept becomes a coin flip decided by
 * whichever sync ran last. Recording this now costs nothing; discovering it
 * after 2,000 readers hold a mutable blob costs the data.
 *
 * ── AND THE CAVEAT THAT KILLED PROGRESS TRACKING ───────────────────────────
 * A link opened from a WhatsApp chat runs in an in-app webview with a SEPARATE
 * storage partition, so saves made there silently vanish when the same person
 * later opens the site in Chrome — and vice versa. There is no fix, no API and
 * no detection for this. It is the reason bookmarking is user-initiated and the
 * reason progress tracking was cut. Safari ITP's 7-day cap on script-writable
 * storage removes what is left.
 */
