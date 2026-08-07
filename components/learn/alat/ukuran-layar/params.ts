/**
 * ukuran-layar — URL state codec.
 *
 * PURE. Two hard rules from 03-UI §12.1:
 *
 *  1. **Short param names.** `?m=adm&fv=7.0&vr=1080&ar=16x9` — the exact spelling
 *     in the spec, extended with the params this tool actually needs.
 *  2. **Every param clamps to its default.** A calculator must never throw or 500
 *     on a crafted URL; bots and link-scrapers send garbage. NaN, Infinity, `-1`,
 *     `1e309`, an unknown enum value, a repeated key, a missing key and an empty
 *     string all resolve to a usable number — never to an exception.
 *
 * The parse is total: `parseScreenSizeParams()` has no failure mode. Genuine
 * contradictions (closest viewer beyond farthest viewer) survive the parse and are
 * refused with an explanation by `computeScreenSize()`, because silently repairing
 * a contradictory room is a lie, while silently repairing `fv=NaN` is hygiene.
 */

import { clampNum, parseNum } from "@/lib/learn/format";
import {
  ASPECT_IDS,
  COMMERCIAL_PANEL_SIZES_IN,
  ELEMENT_HEIGHT_PERCENTS,
  VERTICAL_RESOLUTIONS,
  type AspectId,
  type ElementHeightPercent,
  type ScreenSizeInput,
  type SolveFor,
  type VerticalResolution,
  type ViewingModel,
} from "./calc";
import { TOOL_PATH } from "./copy.id";

/** Frozen param spellings. Changing one breaks every shared link ever pasted. */
export const PARAM_KEYS = {
  solveFor: "s",
  model: "m",
  farthestViewerM: "fv",
  plannedDiagonalIn: "d",
  elementHeightPercent: "eh",
  verticalResolution: "vr",
  displayAspect: "ar",
  contentAspect: "cr",
  closestViewerM: "cv",
  ceilingHeightM: "ch",
  eyeHeightM: "he",
} as const;

/** Stable serialisation order, so the same room always produces the same URL. */
export const PARAM_ORDER = [
  PARAM_KEYS.solveFor,
  PARAM_KEYS.model,
  PARAM_KEYS.farthestViewerM,
  PARAM_KEYS.plannedDiagonalIn,
  PARAM_KEYS.elementHeightPercent,
  PARAM_KEYS.verticalResolution,
  PARAM_KEYS.displayAspect,
  PARAM_KEYS.contentAspect,
  PARAM_KEYS.closestViewerM,
  PARAM_KEYS.ceilingHeightM,
  PARAM_KEYS.eyeHeightM,
] as const;

/**
 * Indonesian defaults, and they are the differentiator (03-UI §12.2).
 *
 * `plannedDiagonalIn` is ACTA's own addition to the spec's list: 65" is the panel
 * most Indonesian meeting rooms are already planning, and having it on screen from
 * the first paint is what lets the money sentence appear with zero interaction.
 * `ceilingHeightM` 2,8 m is the modal finished ceiling of an Indonesian office
 * meeting room — the number the spec itself quotes in its hard warning.
 */
export const SCREEN_SIZE_DEFAULTS: ScreenSizeInput = {
  solveFor: "ukuran",
  model: "bdm",
  farthestViewerM: 7,
  plannedDiagonalIn: 65,
  elementHeightPercent: 2,
  verticalResolution: 1080,
  displayAspect: "16x9",
  contentAspect: "16x9",
  closestViewerM: null,
  ceilingHeightM: 2.8,
  eyeHeightM: 1.15,
};

/** Ranges. Outside them the value is clamped, never rejected. */
export const PARAM_RANGES = {
  /** 1 m is arm's length; 60 m is a stadium concourse. */
  farthestViewerM: { min: 1, max: 60 },
  /** Below 20" is a monitor; above 300" is a projection screen, not a panel. */
  plannedDiagonalIn: { min: 20, max: 300 },
  closestViewerM: { min: 0.3, max: 60 },
  /** 2 m is a crawlspace; 12 m is a sports hall. */
  ceilingHeightM: { min: 2, max: 12 },
  eyeHeightM: { min: 0.8, max: 1.8 },
} as const;

/** Next 15 `searchParams`, `URLSearchParams`, or a plain query object. */
export type ScreenSizeQuery =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined
  | null;

function readParam(query: ScreenSizeQuery, key: string): string | undefined {
  if (!query) return undefined;
  if (typeof URLSearchParams !== "undefined" && query instanceof URLSearchParams) {
    return query.get(key) ?? undefined;
  }
  const raw = (query as Record<string, string | string[] | undefined>)[key];
  // A repeated key (?fv=1&fv=2) arrives as an array — take the first, ignore the rest.
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value : undefined;
}

function pickEnum<T extends string | number>(
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (raw === undefined) return fallback;
  const text = raw.trim().toLowerCase();
  if (!text) return fallback;
  const match = allowed.find((option) => String(option).toLowerCase() === text);
  return match ?? fallback;
}

function pickNumber(
  raw: string | undefined,
  range: { min: number; max: number },
  fallback: number,
): number {
  if (raw === undefined) return fallback;
  if (!raw.trim()) return fallback;
  // parseNum returns NaN for garbage; clampNum turns NaN, ±Infinity and
  // out-of-range values into something the geometry can survive.
  return clampNum(parseNum(raw, Number.NaN), range.min, range.max, fallback);
}

/**
 * Total parse. Always returns a complete, computable `ScreenSizeInput`.
 */
export function parseScreenSizeParams(query: ScreenSizeQuery): ScreenSizeInput {
  const d = SCREEN_SIZE_DEFAULTS;

  const closestRaw = readParam(query, PARAM_KEYS.closestViewerM);
  const closestText = closestRaw?.trim() ?? "";
  const closestParsed = closestText ? parseNum(closestText, Number.NaN) : Number.NaN;
  // Empty, absent, unparseable or ≤ 0 all mean "use the 1,5 × IH guideline".
  const closestViewerM =
    Number.isFinite(closestParsed) && closestParsed > 0
      ? clampNum(
          closestParsed,
          PARAM_RANGES.closestViewerM.min,
          PARAM_RANGES.closestViewerM.max,
          PARAM_RANGES.closestViewerM.min,
        )
      : null;

  return {
    solveFor: pickEnum<SolveFor>(
      readParam(query, PARAM_KEYS.solveFor),
      ["ukuran", "jarak"],
      d.solveFor,
    ),
    model: pickEnum<ViewingModel>(
      readParam(query, PARAM_KEYS.model),
      ["adm", "bdm"],
      d.model,
    ),
    farthestViewerM: pickNumber(
      readParam(query, PARAM_KEYS.farthestViewerM),
      PARAM_RANGES.farthestViewerM,
      d.farthestViewerM,
    ),
    plannedDiagonalIn: pickNumber(
      readParam(query, PARAM_KEYS.plannedDiagonalIn),
      PARAM_RANGES.plannedDiagonalIn,
      d.plannedDiagonalIn,
    ),
    elementHeightPercent: pickEnum<ElementHeightPercent>(
      readParam(query, PARAM_KEYS.elementHeightPercent),
      ELEMENT_HEIGHT_PERCENTS,
      d.elementHeightPercent,
    ),
    verticalResolution: pickEnum<VerticalResolution>(
      readParam(query, PARAM_KEYS.verticalResolution),
      VERTICAL_RESOLUTIONS,
      d.verticalResolution,
    ),
    displayAspect: pickEnum<AspectId>(
      readParam(query, PARAM_KEYS.displayAspect),
      ASPECT_IDS,
      d.displayAspect,
    ),
    contentAspect: pickEnum<AspectId>(
      readParam(query, PARAM_KEYS.contentAspect),
      ASPECT_IDS,
      d.contentAspect,
    ),
    closestViewerM,
    ceilingHeightM: pickNumber(
      readParam(query, PARAM_KEYS.ceilingHeightM),
      PARAM_RANGES.ceilingHeightM,
      d.ceilingHeightM,
    ),
    eyeHeightM: pickNumber(
      readParam(query, PARAM_KEYS.eyeHeightM),
      PARAM_RANGES.eyeHeightM,
      d.eyeHeightM,
    ),
  };
}

/** Canonical dot decimal, at most 3 places, no trailing zeros: 7 · 2.8 · 1.15 */
function numberParam(value: number): string {
  return String(Number(value.toFixed(3)));
}

/**
 * Serialise, omitting every value that equals its default. All-defaults produces
 * an empty `URLSearchParams`, so the Panel's `history.replaceState` lands back on
 * the bare, indexable, self-canonical path.
 */
export function serializeScreenSizeParams(input: ScreenSizeInput): URLSearchParams {
  const d = SCREEN_SIZE_DEFAULTS;
  const params = new URLSearchParams();

  if (input.solveFor !== d.solveFor) params.set(PARAM_KEYS.solveFor, input.solveFor);
  if (input.model !== d.model) params.set(PARAM_KEYS.model, input.model);
  if (input.farthestViewerM !== d.farthestViewerM) {
    params.set(PARAM_KEYS.farthestViewerM, numberParam(input.farthestViewerM));
  }
  if (input.plannedDiagonalIn !== d.plannedDiagonalIn) {
    params.set(PARAM_KEYS.plannedDiagonalIn, numberParam(input.plannedDiagonalIn));
  }
  if (input.elementHeightPercent !== d.elementHeightPercent) {
    params.set(
      PARAM_KEYS.elementHeightPercent,
      String(input.elementHeightPercent),
    );
  }
  if (input.verticalResolution !== d.verticalResolution) {
    params.set(PARAM_KEYS.verticalResolution, String(input.verticalResolution));
  }
  if (input.displayAspect !== d.displayAspect) {
    params.set(PARAM_KEYS.displayAspect, input.displayAspect);
  }
  if (input.contentAspect !== d.contentAspect) {
    params.set(PARAM_KEYS.contentAspect, input.contentAspect);
  }
  if (input.closestViewerM !== null) {
    params.set(PARAM_KEYS.closestViewerM, numberParam(input.closestViewerM));
  }
  if (input.ceilingHeightM !== d.ceilingHeightM) {
    params.set(PARAM_KEYS.ceilingHeightM, numberParam(input.ceilingHeightM));
  }
  if (input.eyeHeightM !== d.eyeHeightM) {
    params.set(PARAM_KEYS.eyeHeightM, numberParam(input.eyeHeightM));
  }

  // Re-emit in the frozen order so the string is stable across engines.
  const ordered = new URLSearchParams();
  for (const key of PARAM_ORDER) {
    const value = params.get(key);
    if (value !== null) ordered.set(key, value);
  }
  return ordered;
}

/** `/learn/alat/ukuran-layar` when nothing differs from the defaults. */
export function screenSizeHref(
  input: ScreenSizeInput,
  basePath: string = TOOL_PATH,
): string {
  const query = serializeScreenSizeParams(input).toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * True when the URL carries at least one of THIS tool's params — the signal the
 * route uses for `noindex` + `rel=canonical` → the bare path (03-UI §12.1).
 * Unknown keys (utm_*, fbclid) are ignored on purpose: a campaign tag must not
 * de-index the page.
 */
export function hasScreenSizeParams(query: ScreenSizeQuery): boolean {
  return PARAM_ORDER.some((key) => {
    const value = readParam(query, key);
    return value !== undefined && value.trim() !== "";
  });
}

/**
 * The presets the route can link to from prose, the lesson embeds and the
 * worked-example section. Every entry is a real Indonesian room.
 */
export const SCREEN_SIZE_PRESETS: readonly {
  id: string;
  label: string;
  input: ScreenSizeInput;
}[] = [
  {
    id: "ruang-rapat-8-orang",
    label: "Ruang rapat 8 orang — slide bullet, kursi terjauh 5 m",
    input: { ...SCREEN_SIZE_DEFAULTS, farthestViewerM: 5, ceilingHeightM: 2.8 },
  },
  {
    id: "ruang-pelatihan-40-orang",
    label: "Ruang pelatihan 40 orang — kursi terjauh 9 m, plafon 3,2 m",
    input: {
      ...SCREEN_SIZE_DEFAULTS,
      farthestViewerM: 9,
      ceilingHeightM: 3.2,
      plannedDiagonalIn: 86,
    },
  },
  {
    id: "ruang-kontrol-cad",
    label: "Ruang kontrol / CAD — konten analitis 1080p, kursi terjauh 3 m",
    input: {
      ...SCREEN_SIZE_DEFAULTS,
      model: "adm",
      farthestViewerM: 3,
      plannedDiagonalIn: 75,
      ceilingHeightM: 3,
    },
  },
];

/** Sizes the ladder covers, exported so the route can print them in prose. */
export { COMMERCIAL_PANEL_SIZES_IN };
