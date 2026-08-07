/**
 * The WhatsApp ref code (03 §13.4, §13.5).
 *
 * ~90% of first contact arrives on WhatsApp, and `wa.me` links are
 * fire-and-forget. Every UTM, click id, referrer and cookie **dies at the
 * `wa.me` boundary**. So:
 *
 * > The attribution token must be VISIBLE TEXT inside the message body, not a
 * > URL parameter — because the only thing that crosses from web → WhatsApp →
 * > CRM is the text of the message the human sends.
 *
 * A salesperson reading `Ref: AKU-08-4KM2` can see it, and paste it into
 * `source_detail` on the ACTA-OS lead. That is the whole mechanism. There is
 * **no Supabase table in v1**: `learn_intents` is gated on ref codes having been
 * demonstrably pasted into the CRM for three consecutive months (§13.5). If they
 * are not being pasted, the table would have measured nothing.
 *
 * ── ALPHABET ───────────────────────────────────────────────────────────────
 * Crockford base32 for the random block: `I`, `L`, `O` and `U` are absent, so a
 * code survives being read aloud over the phone (`I`/`1`, `O`/`0`) and retyped
 * from a screenshot. The three-letter PREFIX is exempt — `AKU` and `ALT` are
 * words, not entropy, and they are never ambiguous in context. Do not "fix" them.
 *
 * ── SSR ────────────────────────────────────────────────────────────────────
 * `buildLearnRef()` is random and time-dependent, so it must be called from an
 * EVENT HANDLER or an effect — never during render. A ref generated during
 * render differs between the server HTML and the client HTML and hydrates as a
 * mismatch. `lib/learn/cta.ts` already accepts `ref: null` for exactly this
 * reason: the message sends fine without one and the CRM records
 * `learn:no-ref`.
 */

/** The 32 Crockford characters, in value order. No I, L, O or U. */
export const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Characters in the random block. Four gives ~1M codes — plenty for correlation. */
export const REF_RANDOM_LENGTH = 4;

/**
 * Three-letter source codes (§13.4). `LRN` is the documented extension for a
 * lesson with no published jalur, and `LYR` for the display/ukuran-layar jalur
 * which §13.4's original four codes did not cover.
 */
export const LEARN_REF_PREFIXES = {
  akustik: "AKU",
  tataSuara: "TSU",
  spesifikasi: "RKS",
  alat: "ALT",
  layar: "LYR",
  umum: "LRN",
} as const;

export type LearnRefPrefix = (typeof LEARN_REF_PREFIXES)[keyof typeof LEARN_REF_PREFIXES];

const PREFIX_VALUES = new Set<string>(Object.values(LEARN_REF_PREFIXES));

/**
 * Keyword → prefix, checked in order. Ordered most specific first so
 * `spesifikasi-tata-suara` resolves to `RKS` (the procurement jalur) rather than
 * `TSU`. Both spellings of the specification jalur are covered because §8.2 and
 * §10 of doc 02 disagree on its slug.
 */
const PREFIX_RULES: ReadonlyArray<readonly [RegExp, LearnRefPrefix]> = [
  [/spesifikasi|pengadaan|rks|tender|boq/, LEARN_REF_PREFIXES.spesifikasi],
  [/akustik|rt60|dengung|gema|serap/, LEARN_REF_PREFIXES.akustik],
  [/layar|ukuran|pandang|display|proyektor|videotron/, LEARN_REF_PREFIXES.layar],
  [/tata-suara|suara|audio|speaker|sound/, LEARN_REF_PREFIXES.tataSuara],
];

export type LearnRefSource =
  | { kind: "alat" }
  | { kind: "jalur" | "pelajaran" | "ruang" | "unduhan"; jalurSlug?: string | null; slug?: string | null };

/**
 * Pick the three-letter code for a page.
 *
 * Every calculator is `ALT` regardless of topic — §13.4 is explicit, and it is
 * the one source whose conversion path is measurably different from a lesson's.
 * Everything else resolves from its jalur slug, falling back to its own slug,
 * falling back to `LRN`.
 */
export function learnRefPrefix(source: LearnRefSource): LearnRefPrefix {
  if (source.kind === "alat") return LEARN_REF_PREFIXES.alat;
  const haystack = `${source.jalurSlug ?? ""} ${source.slug ?? ""}`.toLowerCase();
  for (const [pattern, prefix] of PREFIX_RULES) {
    if (pattern.test(haystack)) return prefix;
  }
  return LEARN_REF_PREFIXES.umum;
}

function randomCrockford(length: number): string {
  const bytes = new Uint8Array(length);
  const webcrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (webcrypto?.getRandomValues) {
    webcrypto.getRandomValues(bytes);
  } else {
    // Never reached in a browser that can run this app. A weaker code costs a
    // little correlation quality and nothing else — it is not a secret.
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < length; i += 1) out += CROCKFORD_ALPHABET[bytes[i]! % 32]!;
  return out;
}

/** Two digits, `01`–`12`, in Asia/Jakarta — the month the reader actually read it. */
function jakartaMonth(now: Date): string {
  const month = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    month: "2-digit",
  }).format(now);
  return month.padStart(2, "0");
}

export type BuildLearnRefInput = {
  source: LearnRefSource;
  /**
   * Overrides the middle block. §13.4 spells it as a two-digit LESSON INDEX;
   * the default here is the two-digit MONTH, because the lesson is already
   * identified by the title quoted in the message body, whereas *when* the
   * reader read it is information nothing else in the chain carries — and a lead
   * that arrives three months later is the normal case, not the exception.
   * Pass a number to restore the doc's original spelling.
   */
  index?: number | null;
  /** Injectable clock, for tests. */
  now?: Date;
};

/**
 * `AKU-08-4KM2` — three-letter source, two digits, four Crockford characters.
 *
 * Call this from a click handler or an effect. Never during render.
 */
export function buildLearnRef({ source, index, now = new Date() }: BuildLearnRefInput): string {
  const prefix = learnRefPrefix(source);
  const middle =
    typeof index === "number" && Number.isFinite(index) && index >= 0
      ? String(Math.floor(index) % 100).padStart(2, "0")
      : jakartaMonth(now);
  return `${prefix}-${middle}-${randomCrockford(REF_RANDOM_LENGTH)}`;
}

export type ParsedLearnRef = {
  prefix: LearnRefPrefix;
  /** The middle block as typed — a month by default, a lesson index if overridden. */
  middle: string;
  random: string;
};

const REF_RE = /^([A-Z]{3})-(\d{2})-([0-9A-HJKMNP-TV-Z]{4})$/;

/**
 * Validate a code a salesperson typed or pasted. Case-insensitive, and it
 * repairs the two transcription errors Crockford exists to prevent (`O` → `0`,
 * `I`/`L` → `1`) before validating, so a hand-copied code is not rejected for
 * the exact reason the alphabet was chosen.
 */
export function parseLearnRef(input: string | null | undefined): ParsedLearnRef | null {
  if (!input) return null;
  const cleaned = input
    .trim()
    .toUpperCase()
    .replace(/^REF\s*:\s*/i, "")
    .replace(/\s+/g, "");
  const [head, middle, tail] = cleaned.split("-");
  if (!head || !middle || !tail) return null;
  const repaired = `${head}-${middle}-${tail.replace(/O/g, "0").replace(/[IL]/g, "1")}`;
  const match = REF_RE.exec(repaired);
  if (!match) return null;
  const [, prefix, digits, random] = match;
  if (!PREFIX_VALUES.has(prefix!)) return null;
  return { prefix: prefix as LearnRefPrefix, middle: digits!, random: random! };
}

export function isLearnRef(input: string | null | undefined): boolean {
  return parseLearnRef(input) !== null;
}

/** The line that goes at the bottom of the WhatsApp message. */
export const REF_LINE_PREFIX = "Ref:";

/**
 * `source_detail` for the ACTA-OS lead (§13.5 vocabulary). Kept here as well as
 * in `lib/learn/cta.ts` so an admin-side importer can normalise a pasted code
 * without pulling in the whole CTA copy module.
 */
export function refSourceDetail(input: string | null | undefined): string {
  const parsed = parseLearnRef(input);
  return parsed ? `learn:${parsed.prefix}-${parsed.middle}-${parsed.random}` : "learn:no-ref";
}
