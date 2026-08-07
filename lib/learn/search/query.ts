/**
 * Scoring and grouping for /learn search (03 §11.5, §14.3).
 *
 * Pure and unit-testable: no React, no DOM, no fetch. `createSearchIndex()` does
 * every normalisation and stemming once; `searchLearn()` is then a linear scan
 * over ~30 prepared documents, which is microseconds and needs no debouncing.
 * (The 400 ms debounce in the UI is for the `aria-live` announcement and the
 * GA4 event, not for the query.)
 *
 * The ranking ladder, highest first:
 *
 *   1. exact title          the whole query IS the title
 *   2. title prefix         the title starts with the whole query
 *   3. title phrase         the title contains the whole query, on word bounds
 *   4. title token          a query word equals a title word
 *   5. title stem           a query word shares a root with a title word
 *                           — this is the tier Postgres FTS gets wrong
 *   6. synonym              the doc speaks a different register than the reader
 *   7. excerpt
 *   8. tag / slug
 *
 * Synonym sits BELOW stemmed title on purpose: a document that uses the
 * reader's own word is a better answer than one that uses a word we decided is
 * equivalent, even when both are correct.
 *
 * Groups are emitted in the fixed `SEARCH_KIND_ORDER`, never relevance-ordered,
 * and capped at four rows each.
 *
 * PRIVACY: nothing here logs, stores or transmits the query. Free-text search is
 * the most reliable accidental-PII vector on any site, so the caller reports
 * `q_len` and `result_count` to GA4 and NEVER the query string (§14.7).
 */

import {
  SEARCH_KIND_LABEL,
  SEARCH_KIND_ORDER,
  type SearchDoc,
  type SearchKind,
} from "@/lib/learn/search/corpus";
import { stemVariants } from "@/lib/learn/search/stem";
import { expandQuery } from "@/lib/learn/search/synonyms";

/* ------------------------------------------------------------------ *
 * Normalisation that can be mapped back to the original string
 * ------------------------------------------------------------------ */

type NormalizedText = {
  /** Lowercased, de-accented, punctuation collapsed to single spaces. */
  norm: string;
  /** `map[i]` is the index in the ORIGINAL string of `norm[i]`. */
  map: number[];
};

/**
 * The character-for-character twin of `normalize()` in `stem.ts`, plus an index
 * map. Folding happens per character (a precomposed `é` folds to one `e`) so the
 * mapping stays 1:1 and `<mark>` ranges can be cut out of the ORIGINAL text —
 * highlighting must never render de-accented, lowercased prose back at a reader.
 */
function normalizeWithMap(text: string): NormalizedText {
  const out: string[] = [];
  const map: number[] = [];
  let pendingSpace = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    const folded = (ch.normalize("NFD")[0] ?? ch).toLowerCase();
    if (/[a-z0-9]/.test(folded)) {
      if (pendingSpace && out.length > 0) {
        out.push(" ");
        map.push(i);
        pendingSpace = false;
      }
      out.push(folded);
      map.push(i);
    } else {
      pendingSpace = true;
    }
  }

  return { norm: out.join(""), map };
}

type IndexedWord = {
  /** Offsets into the normalized string. */
  start: number;
  end: number;
  word: string;
  stems: Set<string>;
};

type IndexedField = {
  raw: string;
  norm: string;
  /** `" ${norm} "` — lets a phrase test assert word boundaries with `includes`. */
  padded: string;
  map: number[];
  words: IndexedWord[];
  stems: Set<string>;
};

function buildField(raw: string): IndexedField {
  const { norm, map } = normalizeWithMap(raw);
  const words: IndexedWord[] = [];
  const stems = new Set<string>();

  let i = 0;
  while (i < norm.length) {
    if (norm[i] === " ") {
      i += 1;
      continue;
    }
    let j = i;
    while (j < norm.length && norm[j] !== " ") j += 1;
    const word = norm.slice(i, j);
    const variants = stemVariants(word);
    for (const v of variants) stems.add(v);
    words.push({ start: i, end: j, word, stems: new Set(variants) });
    i = j;
  }

  return { raw, norm, padded: ` ${norm} `, map, words, stems };
}

/* ------------------------------------------------------------------ *
 * Index
 * ------------------------------------------------------------------ */

type IndexedDoc = {
  doc: SearchDoc;
  title: IndexedField;
  excerpt: IndexedField;
  tags: IndexedField;
  slug: IndexedField;
};

export type SearchIndex = {
  docs: IndexedDoc[];
  /** Number of documents indexed. */
  size: number;
};

/**
 * Prepare the payload once. Cheap enough to run inside a `useMemo` on the client
 * (~30 docs × ~40 words), and stable: the same payload always yields the same
 * index, so the memo key is the payload reference.
 */
export function createSearchIndex(docs: readonly SearchDoc[]): SearchIndex {
  const indexed = docs.map((doc) => ({
    doc,
    title: buildField(doc.title),
    excerpt: buildField(doc.excerpt),
    tags: buildField(doc.tags.join(" ")),
    slug: buildField(doc.slug.replace(/-/g, " ")),
  }));
  return { docs: indexed, size: indexed.length };
}

/* ------------------------------------------------------------------ *
 * Query preparation
 * ------------------------------------------------------------------ */

export type PreparedQueryToken = {
  token: string;
  variants: Set<string>;
};

export type PreparedQuery = {
  /** What the reader typed, untouched. */
  raw: string;
  /** Normalized form used for every comparison. */
  norm: string;
  tokens: PreparedQueryToken[];
  /** Alternative-register spellings pulled in by the synonym map. */
  phrases: string[];
  /** Synonym cluster ids that fired. Useful for a "mencari juga:" hint. */
  clusters: string[];
};

/** Shortest query that runs. One character matches most of a 30-document corpus. */
export const MIN_QUERY_LENGTH = 2;

export function prepareQuery(raw: string): PreparedQuery {
  const { query: norm, clusters, terms } = expandQuery(raw);
  const tokens = norm
    ? norm.split(" ").map((token) => ({ token, variants: new Set(stemVariants(token)) }))
    : [];
  return { raw, norm, tokens, phrases: terms, clusters };
}

/* ------------------------------------------------------------------ *
 * Scoring
 * ------------------------------------------------------------------ */

export type MatchRule =
  | "title-exact"
  | "title-prefix"
  | "title-phrase"
  | "title-token"
  | "title-token-prefix"
  | "title-stem"
  | "synonym-title"
  | "synonym-body"
  | "excerpt-token"
  | "excerpt-stem"
  | "tag"
  | "slug"
  | "nearest";

/** Every rule that carries points. `nearest` is similarity, not scoring. */
export type ScoreRule = Exclude<MatchRule, "nearest">;

/** The ladder, as data, so a test can assert the ORDER rather than the numbers. */
export const SEARCH_SCORE: Record<ScoreRule, number> = {
  "title-exact": 1000,
  "title-prefix": 600,
  "title-phrase": 420,
  "title-token": 240,
  "title-token-prefix": 190,
  "title-stem": 150,
  "synonym-title": 120,
  "synonym-body": 95,
  "excerpt-token": 80,
  "excerpt-stem": 55,
  tag: 45,
  slug: 35,
};

/** Added in proportion to how many query words the document actually answered. */
const COVERAGE_BONUS = 70;

export type HighlightSegment = { text: string; match: boolean };

export type SearchResult = {
  doc: SearchDoc;
  score: number;
  /** The strongest rule that fired. For debugging and for `learn_search_select`. */
  rule: MatchRule;
  /** `doc.title`, split for `<mark>` rendering. */
  titleSegments: HighlightSegment[];
  /** `doc.excerpt`, split for `<mark>` rendering. */
  excerptSegments: HighlightSegment[];
};

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const v of a) if (b.has(v)) return true;
  return false;
}

function containsPhrase(field: IndexedField, phrase: string): boolean {
  return phrase.length > 0 && field.padded.includes(` ${phrase} `);
}

/** Best score any single word of `field` gives `token`, plus which rule it was. */
type Hit = { points: number; rule: ScoreRule };

function scoreTokenAgainst(
  field: IndexedField,
  token: PreparedQueryToken,
  exactRule: ScoreRule,
  prefixRule: ScoreRule | null,
  stemRule: ScoreRule,
): Hit | null {
  const best: { value: Hit | null } = { value: null };
  const consider = (rule: ScoreRule) => {
    const points = SEARCH_SCORE[rule];
    if (!best.value || points > best.value.points) best.value = { points, rule };
  };

  for (const word of field.words) {
    if (word.word === token.token) {
      consider(exactRule);
      break; // nothing in this field can beat an exact word match
    }
    if (prefixRule && token.token.length >= 3 && word.word.startsWith(token.token)) {
      consider(prefixRule);
      continue;
    }
    if (intersects(word.stems, token.variants)) consider(stemRule);
  }

  return best.value;
}

function scoreDoc(entry: IndexedDoc, q: PreparedQuery): { score: number; rule: ScoreRule } | null {
  const acc: { score: number; rule: ScoreRule | null; points: number } = {
    score: 0,
    rule: null,
    points: -1,
  };

  const add = (rule: ScoreRule, points = SEARCH_SCORE[rule]) => {
    acc.score += points;
    if (points > acc.points) {
      acc.points = points;
      acc.rule = rule;
    }
  };

  // Whole-query rules. Only the strongest of the three counts — they are nested
  // conditions, not independent signals.
  if (entry.title.norm === q.norm) {
    add("title-exact");
  } else if (
    entry.title.norm.startsWith(q.norm) &&
    entry.title.norm[q.norm.length] === " "
  ) {
    add("title-prefix");
  } else if (q.norm.includes(" ") && containsPhrase(entry.title, q.norm)) {
    add("title-phrase");
  }

  // Per-word rules: each query word contributes its single best field hit.
  let matched = 0;
  for (const token of q.tokens) {
    const hit =
      scoreTokenAgainst(entry.title, token, "title-token", "title-token-prefix", "title-stem") ??
      scoreTokenAgainst(entry.excerpt, token, "excerpt-token", null, "excerpt-stem") ??
      scoreTokenAgainst(entry.tags, token, "tag", null, "tag") ??
      scoreTokenAgainst(entry.slug, token, "slug", null, "slug");
    if (!hit) continue;
    matched += 1;
    add(hit.rule, hit.points);
  }

  // Synonyms score ONCE per surface, not once per spelling: a document that
  // happens to list five names for the same object is not five times as relevant.
  let synTitle = false;
  let synBody = false;
  for (const phrase of q.phrases) {
    if (!synTitle && containsPhrase(entry.title, phrase)) synTitle = true;
    else if (
      !synBody &&
      (containsPhrase(entry.excerpt, phrase) ||
        containsPhrase(entry.tags, phrase) ||
        containsPhrase(entry.slug, phrase))
    ) {
      synBody = true;
    }
    if (synTitle && synBody) break;
  }
  if (synTitle) add("synonym-title");
  if (synBody) add("synonym-body");

  if (acc.score <= 0 || acc.rule === null) return null;
  if (q.tokens.length > 0 && matched > 0) {
    acc.score += Math.round((COVERAGE_BONUS * matched) / q.tokens.length);
  }
  return { score: acc.score, rule: acc.rule };
}

/* ------------------------------------------------------------------ *
 * Highlighting
 * ------------------------------------------------------------------ */

/**
 * Split `field.raw` into marked and unmarked runs.
 *
 * A word is marked when it equals a query word, starts with one, or SHARES A
 * ROOT with one — so a search for `rancang` visibly marks `Perancangan`, which
 * is the moment the stemmer stops being invisible plumbing and starts being an
 * explanation of why this row is in the list. Matched synonym phrases are marked
 * too, for the same reason: it answers "why is `LED display` here when I typed
 * `videotron`?" without a word of UI copy.
 */
function highlightField(field: IndexedField, q: PreparedQuery): HighlightSegment[] {
  if (!field.raw) return [];
  const marked = new Set<number>();

  field.words.forEach((word, index) => {
    for (const token of q.tokens) {
      if (
        word.word === token.token ||
        (token.token.length >= 3 && word.word.startsWith(token.token)) ||
        intersects(word.stems, token.variants)
      ) {
        marked.add(index);
        return;
      }
    }
  });

  for (const phrase of q.phrases) {
    if (!containsPhrase(field, phrase)) continue;
    let from = 0;
    for (;;) {
      const at = field.padded.indexOf(` ${phrase} `, from);
      if (at < 0) break;
      const start = at; // ` ` offset in padded == start offset in norm
      const end = start + phrase.length;
      field.words.forEach((word, index) => {
        if (word.start >= start && word.end <= end) marked.add(index);
      });
      from = at + 1;
    }
  }

  if (marked.size === 0) return [{ text: field.raw, match: false }];

  // Normalized word offsets → original offsets, merged when adjacent.
  const ranges: Array<[number, number]> = [];
  for (const index of Array.from(marked).sort((a, b) => a - b)) {
    const word = field.words[index]!;
    const start = field.map[word.start]!;
    const end = field.map[word.end - 1]! + 1;
    const last = ranges[ranges.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else ranges.push([start, end]);
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) segments.push({ text: field.raw.slice(cursor, start), match: false });
    segments.push({ text: field.raw.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < field.raw.length) segments.push({ text: field.raw.slice(cursor), match: false });
  return segments;
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

export type SearchGroup = {
  kind: SearchKind;
  /** Bahasa Indonesia heading. */
  label: string;
  /** Capped at `groupCap`. */
  results: SearchResult[];
  /** Matches in this group BEFORE the cap — render "…dan 3 lainnya" from this. */
  total: number;
};

export type SearchOutcome = {
  /** Untouched input, for rendering «…» in the zero state. */
  query: string;
  normalized: string;
  /** True when the query is below `MIN_QUERY_LENGTH`; groups are empty. */
  tooShort: boolean;
  /** Non-empty groups only, in the fixed kind order. */
  groups: SearchGroup[];
  /** Matches across every group, before capping. */
  total: number;
  /** Rows actually rendered, after capping. */
  shown: number;
  /** Synonym clusters the query touched. */
  clusters: string[];
  /** Populated ONLY when `total === 0`: the three nearest titles. */
  suggestions: SearchResult[];
};

export type SearchOptions = {
  /** Rows per group. §11.5 fixes this at 4. */
  groupCap?: number;
  /** How many near-miss rows the zero state offers. */
  suggestLimit?: number;
};

/** §11.5 — every group is capped at four rows. */
export const GROUP_CAP = 4;

export function searchLearn(
  index: SearchIndex,
  rawQuery: string,
  options: SearchOptions = {},
): SearchOutcome {
  const groupCap = options.groupCap ?? GROUP_CAP;
  const q = prepareQuery(rawQuery);
  const empty: SearchOutcome = {
    query: rawQuery,
    normalized: q.norm,
    tooShort: q.norm.length < MIN_QUERY_LENGTH,
    groups: [],
    total: 0,
    shown: 0,
    clusters: q.clusters,
    suggestions: [],
  };
  if (empty.tooShort) return empty;

  const hits: SearchResult[] = [];
  for (const entry of index.docs) {
    const scored = scoreDoc(entry, q);
    if (!scored) continue;
    hits.push({
      doc: entry.doc,
      score: scored.score,
      rule: scored.rule,
      titleSegments: highlightField(entry.title, q),
      excerptSegments: highlightField(entry.excerpt, q),
    });
  }

  if (hits.length === 0) {
    return { ...empty, suggestions: suggestNearest(index, rawQuery, options.suggestLimit) };
  }

  const kindRank = new Map<SearchKind, number>(SEARCH_KIND_ORDER.map((k, i) => [k, i]));
  hits.sort(
    (a, b) =>
      b.score - a.score ||
      (kindRank.get(a.doc.kind) ?? 0) - (kindRank.get(b.doc.kind) ?? 0) ||
      a.doc.title.length - b.doc.title.length ||
      a.doc.title.localeCompare(b.doc.title, "id"),
  );

  const groups: SearchGroup[] = [];
  let shown = 0;
  for (const kind of SEARCH_KIND_ORDER) {
    const inKind = hits.filter((h) => h.doc.kind === kind);
    if (inKind.length === 0) continue;
    const results = inKind.slice(0, groupCap);
    shown += results.length;
    groups.push({ kind, label: SEARCH_KIND_LABEL[kind], results, total: inKind.length });
  }

  return { ...empty, groups, total: hits.length, shown, suggestions: [] };
}

/* ------------------------------------------------------------------ *
 * Near-miss suggestions for the zero state
 * ------------------------------------------------------------------ */

function bigrams(text: string): Set<string> {
  const padded = ` ${text} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 1; i += 1) out.add(padded.slice(i, i + 2));
  return out;
}

/** Sørensen–Dice over character bigrams: forgiving of one or two typos. */
function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}

/** Similarity floor. Below this the "nearest match" is noise and hurts trust. */
const NEAREST_MIN = 0.2;

/**
 * The three closest titles when nothing matched. This is the misspelling
 * fallback — `pengeras suara` typed as `pengerass suarra` still lands, without
 * `pg_trgm` and without a round-trip.
 *
 * The zero state is the most useful screen in the product (§11.5): these three,
 * then the jalur, then the glossary, then a WhatsApp handoff with the query
 * prefilled. Never a bare "no results".
 */
export function suggestNearest(
  index: SearchIndex,
  rawQuery: string,
  limit = 3,
): SearchResult[] {
  const q = prepareQuery(rawQuery);
  if (q.norm.length < MIN_QUERY_LENGTH) return [];
  const queryGrams = bigrams(q.norm);

  return index.docs
    .map((entry) => ({
      entry,
      similarity: Math.max(dice(queryGrams, bigrams(entry.title.norm)), ...q.tokens.map((t) =>
        Math.max(0, ...entry.title.words.map((w) => dice(bigrams(t.token), bigrams(w.word)))),
      )),
    }))
    .filter((row) => row.similarity >= NEAREST_MIN)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(({ entry, similarity }) => ({
      doc: entry.doc,
      score: Math.round(similarity * 1000),
      rule: "nearest" as const,
      titleSegments: [{ text: entry.doc.title, match: false }],
      excerptSegments: [{ text: entry.doc.excerpt, match: false }],
    }));
}

/** Flat, render-order list — the order arrow keys will walk. */
export function flattenResults(outcome: SearchOutcome): SearchResult[] {
  return outcome.groups.flatMap((g) => g.results);
}
