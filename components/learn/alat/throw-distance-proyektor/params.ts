/**
 * URL codec for the throw + brightness calculator.
 *
 * Canonical share URL (03-UI §12.1):
 *   /learn/alat/throw-distance-proyektor?tr=1.5&w=3.6&lm=4000&g=1.0
 *
 * Two rules govern this file:
 *
 * 1. **Every param clamps to its default.** Bots, link scrapers and pasted
 *    fragments send garbage — NaN, Infinity, negatives, absurd magnitudes,
 *    wrong enum members, arrays, empty strings. None of them may throw, and none
 *    may produce a non-finite number downstream. Unparseable → default;
 *    out-of-range → the nearest physical bound.
 *
 * 2. **Bare path is canonical.** `serializeParams` emits only the params that
 *    differ from the default preset and returns "" when nothing does, so the
 *    Panel's `history.replaceState` writes the bare, self-canonical URL when the
 *    user returns to the defaults. Any URL that does carry params is noindex +
 *    canonical to the bare path — that decision belongs to the route, which can
 *    ask `hasParams(searchParams)`.
 */

import { parseNum } from "@/lib/learn/format";
import {
  AMBIENT_LEVELS,
  ASPECTS,
  DEFAULT_INPUT,
  FL_TARGETS,
  LIMITS,
  widthFromDiagonalInch,
  type AmbientLevel,
  type AspectRatioId,
  type ThrowInput,
  type ThrowMode,
} from "./calc";

export const TOOL_PATH = "/learn/alat/throw-distance-proyektor";

/** Frozen short names. Renaming one breaks every shared link ever pasted. */
export const PARAM = {
  mode: "m",
  throwRatio: "tr",
  screenWidth: "w",
  throwDistance: "d",
  aspect: "ar",
  lumens: "lm",
  gain: "g",
  ambient: "amb",
  /** Inbound handoff: screen diagonal in inches, when width is not supplied. */
  diagonalInch: "din",
  /** Inbound handoff: which tool sent the reader here. */
  source: "src",
} as const;

/** Order used when writing a URL, so the same state always spells the same URL. */
const PARAM_ORDER = [
  PARAM.mode,
  PARAM.throwRatio,
  PARAM.screenWidth,
  PARAM.throwDistance,
  PARAM.aspect,
  PARAM.lumens,
  PARAM.gain,
  PARAM.ambient,
] as const;

const KNOWN_KEYS: readonly string[] = Object.values(PARAM);

/** What Next.js hands a page as `searchParams` (after awaiting it). */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export type HandoffSource = "ukuran-layar";

export type Handoff = {
  source: HandoffSource;
  /** Which param carried the screen size. */
  via: "w" | "din";
};

export type ParsedThrowParams = {
  /** Always complete, always finite, always inside LIMITS. */
  input: ThrowInput;
  /** True when the URL carried at least one recognised param. */
  fromUrl: boolean;
  /** Set when the reader arrived from the ukuran-layar calculator. */
  handoff: Handoff | null;
};

/* ------------------------------------------------------------------ */
/* Readers                                                             */
/* ------------------------------------------------------------------ */

/** First non-empty occurrence. `?w=3.6&w=9` is a scraper artefact, not intent. */
function first(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function readNumber(
  raw: RawSearchParams,
  key: string,
  bounds: { min: number; max: number },
  fallback: number,
): number {
  const text = first(raw[key]);
  if (text === null) return fallback;
  // parseNum accepts both registers: "3.6" (canonical) and "3,6" (typed).
  const parsed = parseNum(text, Number.NaN);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < bounds.min) return bounds.min;
  if (parsed > bounds.max) return bounds.max;
  return parsed;
}

function normaliseEnum(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

function readMode(raw: RawSearchParams): ThrowMode {
  const text = first(raw[PARAM.mode]);
  if (text === null) return DEFAULT_INPUT.mode;
  const value = normaliseEnum(text);
  return value === "jarak" || value === "lebar" ? value : DEFAULT_INPUT.mode;
}

function readAspect(raw: RawSearchParams): AspectRatioId {
  const text = first(raw[PARAM.aspect]);
  if (text === null) return DEFAULT_INPUT.aspect;
  // "16:9", "16/9", "16×9" and "16 x 9" all mean the same thing to a human.
  const value = normaliseEnum(text).replace(/[:/×*_-]/g, "x");
  return value in ASPECTS ? (value as AspectRatioId) : DEFAULT_INPUT.aspect;
}

function readAmbient(raw: RawSearchParams): AmbientLevel {
  const text = first(raw[PARAM.ambient]);
  if (text === null) return DEFAULT_INPUT.ambient;
  const value = normaliseEnum(text);
  if (value === "gelap" || value === "terkontrol" || value === "tinggi") {
    return value;
  }
  // Tolerate the foot-lambert target itself, e.g. ?amb=40 — a plausible guess
  // from someone hand-editing the URL, and unambiguous.
  const asNumber = parseNum(value, Number.NaN);
  if (Number.isFinite(asNumber)) {
    const match = AMBIENT_LEVELS.find((level) => FL_TARGETS[level] === asNumber);
    if (match) return match;
  }
  return DEFAULT_INPUT.ambient;
}

function readSource(raw: RawSearchParams): HandoffSource | null {
  const text = first(raw[PARAM.source]);
  if (text === null) return null;
  const value = normaliseEnum(text).replace(/[_\s]/g, "-");
  return value === "ukuran-layar" || value === "ukuranlayar"
    ? "ukuran-layar"
    : null;
}

/* ------------------------------------------------------------------ */
/* parse                                                               */
/* ------------------------------------------------------------------ */

/**
 * Parse a Next.js `searchParams` object into a complete, clamped input.
 *
 * Screen width resolution order, which is also the ukuran-layar handoff:
 *   `w` (metres) → `din` (diagonal inches, converted with `ar`) → default.
 */
export function parseParams(
  raw: RawSearchParams | undefined | null,
): ParsedThrowParams {
  const params: RawSearchParams = raw ?? {};

  const mode = readMode(params);
  const aspect = readAspect(params);
  const ambient = readAmbient(params);

  const throwRatio = readNumber(
    params,
    PARAM.throwRatio,
    LIMITS.throwRatio,
    DEFAULT_INPUT.throwRatio,
  );
  const throwDistanceM = readNumber(
    params,
    PARAM.throwDistance,
    LIMITS.throwDistanceM,
    DEFAULT_INPUT.throwDistanceM,
  );
  const lumens = readNumber(
    params,
    PARAM.lumens,
    LIMITS.lumens,
    DEFAULT_INPUT.lumens,
  );
  const gain = readNumber(params, PARAM.gain, LIMITS.gain, DEFAULT_INPUT.gain);

  const hasWidth = first(params[PARAM.screenWidth]) !== null;
  const hasDiagonal = first(params[PARAM.diagonalInch]) !== null;

  let screenWidthM = DEFAULT_INPUT.screenWidthM;
  let widthVia: Handoff["via"] | null = null;

  if (hasWidth) {
    screenWidthM = readNumber(
      params,
      PARAM.screenWidth,
      LIMITS.screenWidthM,
      DEFAULT_INPUT.screenWidthM,
    );
    widthVia = "w";
  } else if (hasDiagonal) {
    // Diagonal arrives in inches from the screen-sizing tool; convert with the
    // aspect ratio, then clamp exactly like a directly supplied width.
    const diagonalInch = readNumber(
      params,
      PARAM.diagonalInch,
      { min: 20, max: 900 },
      Number.NaN,
    );
    if (Number.isFinite(diagonalInch)) {
      const derived = widthFromDiagonalInch(diagonalInch, aspect);
      screenWidthM = Math.min(
        LIMITS.screenWidthM.max,
        Math.max(LIMITS.screenWidthM.min, derived),
      );
      widthVia = "din";
    }
  }

  const source = readSource(params);

  return {
    input: {
      mode,
      throwRatio,
      screenWidthM,
      throwDistanceM,
      aspect,
      lumens,
      gain,
      ambient,
    },
    fromUrl: hasParams(params),
    handoff: source && widthVia ? { source, via: widthVia } : null,
  };
}

/** True when the URL carries any param this tool recognises. */
export function hasParams(raw: RawSearchParams | undefined | null): boolean {
  if (!raw) return false;
  for (const key of KNOWN_KEYS) {
    if (first(raw[key]) !== null) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* serialise                                                           */
/* ------------------------------------------------------------------ */

/** Canonical numeric spelling: dot decimal, no thousands separator, no noise. */
function numParam(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Number(value.toFixed(4)));
}

/**
 * Minimal canonical query string — only what differs from the default preset,
 * always in PARAM_ORDER. Returns "" when the input IS the default preset, so the
 * caller writes the bare (indexable, self-canonical) path.
 *
 * The inactive geometry param is never emitted: in "jarak" mode the distance is
 * derived, in "lebar" mode the width is.
 */
export function serializeParams(input: ThrowInput): string {
  const values: Record<string, string> = {};

  if (input.mode !== DEFAULT_INPUT.mode) values[PARAM.mode] = input.mode;
  if (input.throwRatio !== DEFAULT_INPUT.throwRatio) {
    values[PARAM.throwRatio] = numParam(input.throwRatio);
  }
  if (input.mode === "lebar") {
    if (input.throwDistanceM !== DEFAULT_INPUT.throwDistanceM) {
      values[PARAM.throwDistance] = numParam(input.throwDistanceM);
    }
  } else if (input.screenWidthM !== DEFAULT_INPUT.screenWidthM) {
    values[PARAM.screenWidth] = numParam(input.screenWidthM);
  }
  if (input.aspect !== DEFAULT_INPUT.aspect) values[PARAM.aspect] = input.aspect;
  if (input.lumens !== DEFAULT_INPUT.lumens) {
    values[PARAM.lumens] = numParam(input.lumens);
  }
  if (input.gain !== DEFAULT_INPUT.gain) values[PARAM.gain] = numParam(input.gain);
  if (input.ambient !== DEFAULT_INPUT.ambient) {
    values[PARAM.ambient] = input.ambient;
  }

  const pairs: string[] = [];
  for (const key of PARAM_ORDER) {
    const value = values[key];
    if (value !== undefined && value !== "") {
      pairs.push(`${key}=${encodeURIComponent(value)}`);
    }
  }
  return pairs.join("&");
}

/** Full href for a state — bare path when the state is the default preset. */
export function buildToolHref(input: ThrowInput, base: string = TOOL_PATH): string {
  const query = serializeParams(input);
  return query ? `${base}?${query}` : base;
}

/** True when this state would be written as the bare, indexable path. */
export function isDefaultInput(input: ThrowInput): boolean {
  return serializeParams(input) === "";
}
