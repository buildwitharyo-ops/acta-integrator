/**
 * A small Indonesian affix stripper with consonant restoration.
 *
 * WHY THIS EXISTS AT ALL (02 §8.6, 03 §11.5 — verified, not assumed):
 * Postgres' built-in `indonesian` FTS config strips the `peN-` prefix class
 * WITHOUT restoring the elided root consonant, and that prefix class is exactly
 * what Indonesian AV vocabulary is built from:
 *
 *     to_tsvector('indonesian','perancangan akustik ruangan') → 'ancang' 'akustik' 'ruang'
 *     to_tsvector('indonesian','rancang akustik ruang')       → 'rancang' 'akustik' 'ruang'
 *     … @@ plainto_tsquery(…)                                 → FALSE
 *     pengeras → 'eras'      penguat → 'uat'
 *
 * The failure is cross-form recall (root-form query against affixed-form
 * document) and it produces EMPTY result sets, which is the failure mode users
 * never report. The standard remedy — synonym/stopword dictionaries in
 * `$SHAREDIR/tsearch_data` — needs filesystem access managed Supabase does not
 * grant at any price. So the stemmer lives here, client-side, next to the
 * synonym bridge that also cannot be expressed server-side.
 *
 * DESIGN: candidate sets, not a single answer. `peng-` + vowel is genuinely
 * ambiguous without a dictionary (`pengeras` → `keras`, but `pengukuran` →
 * `ukur`), so every plausible analysis is emitted and both the index and the
 * query expand the same way. Recall comes from the SET; `stem()` returns only
 * the most likely member and is documented as best-effort.
 *
 * Precision guards, in order of how much junk each one removes:
 *   1. an AV allowlist that is never touched;
 *   2. nasal prefixes only strip in front of the consonants they actually
 *      assimilate to (`men-` before d/c/j/z/s, `mem-` before b/f/v/p, …), which
 *      is what stops `pengeras` → `geras`;
 *   3. every candidate must open with a phonotactically legal Indonesian onset,
 *      which is what stops `perbaikan` → `rbaik`.
 */

/**
 * Never stemmed, never expanded. Acronyms and product-category terms whose
 * letters coincide with Indonesian affixes (`dsp` looks like nothing, but `led`
 * would survive a `-d` rule and `poe` opens with `pe-`).
 * Frozen list — adding to it is safe, removing from it is a recall regression.
 */
export const AV_TERMS: ReadonlySet<string> = new Set([
  "dante",
  "hdmi",
  "sdi",
  "rt60",
  "discas",
  "avixa",
  "led",
  "lcd",
  "dsp",
  "poe",
  "ptz",
  "usb",
  "hdbaset",
  "xlr",
  "stipa",
]);

/** Lowercase, strip diacritics, collapse everything that is not a letter or digit to one space. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Normalized word tokens. `rt60` survives as one token because digits are kept. */
export function tokenize(text: string): string[] {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}

/** A legal Indonesian syllable onset: a vowel, C, Cl/Cr, or one of the digraphs. */
const LEGAL_ONSET = /^(?:[aeiou]|(?:ng|ny|sy|kh)[aeiou]|[bcdfghjklmnpqrstvwyz][lr]?[aeiou])/;

/** Suffixes, longest first. `-nya` is a clitic and may stack on top of the others. */
const SUFFIXES = ["kan", "an", "i"] as const;

/**
 * `-i` is the dangerous one: it collides with the `-si`/`-asi` tail of every
 * Latin borrowing in the corpus (`spesifikasi`, `instalasi`, `konfigurasi`) and
 * with native nouns like `bunyi`. It is only peeled after a stop or affricate,
 * which is where the real verbal `-i` actually attaches (`menutupi` → `menutup`).
 */
const SUFFIX_I_OK = /[ptkgbdhcj]i$/;

type PrefixRule = {
  /** The surface prefix. */
  p: string;
  /** Root-initial letters this allomorph legally precedes. `"V"` means any vowel. */
  after: string[];
  /**
   * Consonants to try at the head of the root; `""` means nothing was elided.
   * A nasal prefix in front of a vowel carries BOTH readings because the choice
   * is undecidable without a dictionary: `pengeras` is peng+keras but
   * `pengukuran` is peng+ukur. Both are emitted; ordering picks a favourite.
   */
  restore: readonly string[];
};

/**
 * Every rule whose surface form AND environment match contributes candidates;
 * they are not mutually exclusive, because the `peN-` ambiguity is precisely the
 * thing that needs more than one reading.
 */
const PREFIXES: readonly PrefixRule[] = [
  { p: "meng", after: ["V"], restore: ["k", ""] }, // menguatkan → kuat
  { p: "peng", after: ["V"], restore: ["k", ""] }, // pengeras → keras · pengukuran → ukur
  { p: "meng", after: ["g", "h", "k"], restore: [""] }, // menghitung → hitung
  { p: "peng", after: ["g", "h", "k"], restore: [""] }, // penggunaan → guna
  { p: "meny", after: ["V"], restore: ["s", ""] }, // menyusun → susun
  { p: "peny", after: ["V"], restore: ["s", ""] }, // penyerapan → serap
  { p: "mem", after: ["V"], restore: ["p", ""] }, // memasang → pasang
  { p: "pem", after: ["V"], restore: ["p", ""] }, // pemasangan → pasang
  { p: "mem", after: ["b", "f", "v", "p"], restore: [""] }, // membaca → baca
  { p: "pem", after: ["b", "f", "v", "p"], restore: [""] },
  { p: "men", after: ["V"], restore: ["t", ""] }, // menulis → tulis
  { p: "pen", after: ["V"], restore: ["t", ""] }, // penulis → tulis
  { p: "men", after: ["d", "c", "j", "z", "s"], restore: [""] }, // mendengar → dengar
  { p: "pen", after: ["d", "c", "j", "z", "s"], restore: [""] },
  { p: "per", after: [], restore: [""] }, // perbaikan → baik
  { p: "ber", after: [], restore: [""] }, // bergaung  → gaung
  { p: "ter", after: [], restore: [""] }, // terpasang → pasang
  { p: "me", after: [], restore: [""] }, // melihat   → lihat
  { p: "pe", after: [], restore: [""] }, // perancangan → rancang (pe + rancang)
  { p: "di", after: [], restore: [""] }, // dipasang  → pasang
  { p: "ke", after: [], restore: [""] }, // kebisingan → bising
  { p: "se", after: [], restore: [""] }, // sepasang  → pasang
];

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/** Shortest root this stripper will reconstruct. Below it, `ke`+`ras` eats a root word. */
const MIN_ROOT = 4;

function environmentOk(rule: PrefixRule, rest: string): boolean {
  if (rest.length < 3) return false;
  // Bare `pe-`/`me-` never precede ng/ny: those spellings belong to the nasal
  // allomorphs above, and letting them through produces `pengeras` → `ngeras`.
  if (rule.after.length === 0) return !(rule.p === "pe" || rule.p === "me") || !/^n[gy]/.test(rest);
  if (rule.after.includes("V")) return VOWELS.has(rest[0]!);
  return rule.after.includes(rest[0]!);
}

/**
 * Every plausible root of `word`, most likely first, with the surface form last.
 * Feed this to BOTH the index and the query: a shared member is a match.
 */
export function stemVariants(word: string): string[] {
  const w = normalize(word);
  if (!w || w.length < 4 || AV_TERMS.has(w) || /\d/.test(w)) return w ? [w] : [];

  // Suffix layer first: the surface form, plus each stripped base. `-nya` stacks
  // on top of the others, so it is peeled before they are tried. A cut is only
  // kept when at least four letters remain, which is what stops `-an` from
  // eating the last syllable of root nouns that merely end in those letters
  // (`jalan` → `jal`, `bagan` → `bag`).
  const bases = new Set<string>([w]);
  const roots = w.endsWith("nya") && w.length >= 7 ? [w, w.slice(0, -3)] : [w];
  for (const base of roots) {
    bases.add(base);
    for (const s of SUFFIXES) {
      if (!base.endsWith(s)) continue;
      if (s === "i" && !SUFFIX_I_OK.test(base)) continue;
      const cut = base.slice(0, -s.length);
      if (cut.length >= 4) bases.add(cut);
    }
  }

  // Prefix layer: restored candidates rank above plain strips, and among plain
  // strips a consonant-initial root beats a vowel-initial one — the heuristic
  // that resolves perancangan → rancang rather than → ancang. Within a bucket
  // the deepest analysis (shortest candidate) wins, so pemasangan lands on
  // `pasang` and not on the still-suffixed `pasangan`.
  const restored: string[] = [];
  const plain: string[] = [];
  for (const base of bases) {
    for (const rule of PREFIXES) {
      if (!base.startsWith(rule.p)) continue;
      const rest = base.slice(rule.p.length);
      if (!environmentOk(rule, rest)) continue;
      for (const head of rule.restore) {
        const candidate = head + rest;
        if (candidate.length < MIN_ROOT || !LEGAL_ONSET.test(candidate)) continue;
        (head ? restored : plain).push(candidate);
      }
    }
  }
  const byDepth = (a: string, b: string) => a.length - b.length;
  restored.sort(byDepth);
  plain.sort((a, b) => Number(VOWELS.has(a[0]!)) - Number(VOWELS.has(b[0]!)) || byDepth(a, b));

  const ordered = [...restored, ...plain, ...Array.from(bases).sort(byDepth)];
  return Array.from(new Set(ordered)).slice(0, 6);
}

/**
 * The single most likely root. Best-effort by construction: `pengukuran` yields
 * `kukur` here while the correct root `ukur` sits in `stemVariants()`. Use this
 * for display or debugging; use `stemVariants()` for matching.
 */
export function stem(word: string): string {
  return stemVariants(word)[0] ?? normalize(word);
}

/** The union of every variant of every token — the form both sides of a match use. */
export function stemSet(text: string): Set<string> {
  const out = new Set<string>();
  for (const token of tokenize(text)) {
    for (const variant of stemVariants(token)) out.add(variant);
  }
  return out;
}
