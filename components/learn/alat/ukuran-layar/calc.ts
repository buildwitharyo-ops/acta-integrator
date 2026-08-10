/**
 * ukuran-layar — AVIXA DISCAS display sizing.
 *
 * PURE (03-UI §12.1): zero React imports, zero I/O, no Date, no Math.random, no
 * randomness of any kind. The same input always produces the same output, so this
 * module runs identically at build (SSG default), on the server for `?params`, in
 * the browser for live edits, and in the test suite.
 *
 * ── The one equation ────────────────────────────────────────────────────────────
 * Display size and viewing distance are the SAME relationship solved for different
 * variables. Everything below is that relationship plus honest bookkeeping:
 *
 *   ADM   IH = FV × V_res / 3438            FV = IH × 3438 / V_res
 *   BDM   IH = FV / (2 × %EH)               FV = 2 × %EH × IH
 *   CV ≥ 1.5 × IH        D = IH × √(1 + AR²)        D_in = D_m / 0,0254
 *
 * ── What this module refuses to emit (03-UI §12.8 rule 1) ───────────────────────
 * System contrast ratio. ANSI/AVIXA V201.01:2021 defines the ISCR categories, the
 * values repeated across AV blogs could not be verified, and a wrong number would
 * collapse the correctness positioning of the whole platform. No contrast figure
 * appears anywhere in this file, and none may be added without the standard on file.
 */

import { fmt, fmtFixed, fmtInt } from "@/lib/learn/format";
import {
  PROJECTOR_TOOL_PATH,
  UKURAN_LAYAR_COPY as C,
} from "./copy.id";

/* ────────────────────────────── constants ─────────────────────────────────── */

/**
 * Arcminutes in one radian: 60 × 180 / π = 3437,7468…
 *
 * DISCAS specifies the rounded integer 3438, and using the standard's own value
 * keeps our output identical to AVIXA's published calculator. The difference is
 * 0,0074% — four orders of magnitude below the precision of a tape measure in a
 * meeting room. Named and commented so nobody "fixes" it into Math.PI later.
 */
export const ARCMINUTES_PER_RADIAN = 3438;

/**
 * BDM acuity factor. FV = (200 / 100) × %EH × IH = 2 × %EH × IH, i.e. the smallest
 * element subtends 3438 / 200 ≈ 17,2 arcminutes at the farthest viewer. At %EH = 3
 * this collapses to the familiar "6H rule": FV = 6 × IH.
 */
export const BDM_ACUITY_FACTOR = 200;

/**
 * Field tolerance — the one number in this file that is ACTA's judgement rather
 * than AVIXA's, and the reason the tool stopped lying.
 *
 * DISCAS publishes a single distance and every calculator built on it (including
 * this one, until now) printed that distance as a pass/fail gate. The field
 * contradicts the gate: a 98" panel is plainly readable from 8 m in an Indonesian
 * meeting room even though the 6H line falls at 7,32 m. The standard is not wrong
 * — it states the distance at which the content is COMFORTABLE, not the distance
 * at which it becomes unreadable, and collapsing those two claims into one
 * threshold is what produced advice nobody believed.
 *
 * So the standard's distance is kept exactly where the standard puts it, and a
 * second line is drawn one third further out. Beyond the first line the content
 * is still legible but the room is working for it; beyond the second, the back
 * row genuinely cannot follow.
 *
 * 4/3 is not tuned to a dataset — it is the smallest honest step, and it lands
 * the presentation band (6H) exactly on 8H, the passive-viewing distance the
 * industry already uses. Applied identically to ADM and BDM so the two models
 * cannot disagree about what "tolerable" means.
 */
export const FIELD_TOLERANCE = 4 / 3;

/**
 * How far past the comfortable distance a room sits.
 *
 *  - `nyaman`  — at or inside the standard's distance
 *  - `terbaca` — past it, inside the tolerance. Readable; not restful.
 *  - `jauh`    — past the tolerance. The back row stops following.
 */
export type ComfortZone = "nyaman" | "terbaca" | "jauh";

export const COMFORT_ZONES = ["nyaman", "terbaca", "jauh"] as const;

/**
 * Plain-language content classes, which is all the reader should ever have to
 * pick. Each one is nothing but a `%EH` in Bahasa: the engine still runs DISCAS,
 * the UI just stops asking people what an "element height percentage" is.
 */
export const CONTENT_CLASSES = ["padat", "detail", "presentasi", "pasif"] as const;
export type ContentClass = (typeof CONTENT_CLASSES)[number];

const CONTENT_CLASS_EH: Record<ContentClass, ElementHeightPercent> = {
  padat: 1,
  detail: 2,
  presentasi: 3,
  pasif: 4,
};

const EH_CONTENT_CLASS: Record<ElementHeightPercent, ContentClass> = {
  1: "padat",
  2: "detail",
  3: "presentasi",
  4: "pasif",
};

export function contentClassToEh(id: ContentClass): ElementHeightPercent {
  return CONTENT_CLASS_EH[id];
}

/** `%EH` is the source of truth; the class is only its label. */
export function ehToContentClass(percent: ElementHeightPercent): ContentClass {
  return EH_CONTENT_CLASS[percent];
}

/** Exact by definition (international inch). */
export const METRES_PER_INCH = 0.0254;

/** Closest-viewer guideline, NOT a requirement: CV ≥ 1.5 × image height. */
export const CLOSEST_VIEWER_IMAGE_HEIGHTS = 1.5;

/**
 * Bottom of the active image, metres from the finished floor. Keeps the image
 * clear of the heads in the row in front for every row behind the first.
 */
export const IMAGE_BOTTOM_MIN_M = 1.2;

/** Real commercial flat-panel diagonals, inches (03-UI §12.2). */
export const COMMERCIAL_PANEL_SIZES_IN = [55, 65, 75, 86, 98, 110] as const;

/**
 * Largest panel on the commercial ladder. Derived with Math.max rather than a
 * tail index so it stays correct if the ladder is ever reordered, and so it
 * types as `number` under noUncheckedIndexedAccess without a non-null assertion.
 */
export const LARGEST_PANEL_IN: number = Math.max(...COMMERCIAL_PANEL_SIZES_IN);

export const VERTICAL_RESOLUTIONS = [720, 1080, 1440, 2160] as const;
/** 4 extends the spec's 1–3 with the passive-viewing rung (8H). Additive: every
 *  link ever shared carries 1, 2 or 3 and still parses to the same %EH. */
export const ELEMENT_HEIGHT_PERCENTS = [1, 2, 3, 4] as const;
export const ASPECT_IDS = ["16x9", "16x10", "4x3"] as const;

/** Float guard. Every comparison of two computed lengths goes through it. */
const EPS = 1e-9;

/* ──────────────────────────────── types ───────────────────────────────────── */

export type SolveFor = "ukuran" | "jarak";
export type ViewingModel = "adm" | "bdm";
export type VerticalResolution = (typeof VERTICAL_RESOLUTIONS)[number];
export type ElementHeightPercent = (typeof ELEMENT_HEIGHT_PERCENTS)[number];
export type AspectId = (typeof ASPECT_IDS)[number];
export type PanelAvailability = "umum" | "terbatas" | "pesanan" | "tidak-ada";
export type FitMode = "penuh" | "pillarbox" | "letterbox";
export type FindingSeverity = "info" | "warning" | "critical";

/**
 * Structurally identical to `_shared/ResultReadout`'s ResultTone. Declared here
 * rather than imported so this module stays free of any import from a .tsx file.
 */
export type ResultTone = "neutral" | "good" | "warning" | "bad";

/** Structurally identical to `_shared/ShowTheMath`'s MathStep. Same reason. */
export type CalcStep = {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  note?: string;
};

export type ScreenSizeInput = {
  /** Which variable the user wants solved. Both are computed; this picks the headline. */
  solveFor: SolveFor;
  model: ViewingModel;
  /** Metres, to the EYE of the viewer in the last row — not to the back wall. */
  farthestViewerM: number;
  /** Inches. The panel the user is planning; drives the money sentence. */
  plannedDiagonalIn: number;
  elementHeightPercent: ElementHeightPercent;
  verticalResolution: VerticalResolution;
  displayAspect: AspectId;
  contentAspect: AspectId;
  /** Metres, or null for the 1,5 × IH guideline. */
  closestViewerM: number | null;
  ceilingHeightM: number;
  eyeHeightM: number;
};

export type PanelFit = {
  /** Panel diagonal, inches. */
  diagonalIn: number;
  diagonalCm: number;
  /** Physical active area of the panel. */
  displayHeightM: number;
  displayWidthM: number;
  /** The part of the panel the content actually occupies (pillarbox/letterbox). */
  imageHeightM: number;
  imageWidthM: number;
  /** Diagonal of the ACTIVE image — smaller than the panel when pillarboxed. */
  effectiveDiagonalIn: number;
  /** Farthest COMFORTABLE viewer under the chosen model, metres. The standard's number. */
  maxDistanceM: number;
  /** Farthest still-LEGIBLE viewer, metres: maxDistanceM × 4/3. ACTA's judgement. */
  toleratedDistanceM: number;
  /** 1,2 m + panel height. */
  requiredCeilingM: number;
  availability: PanelAvailability;
  /** True when the diagonal is one of the commercial rungs. */
  onLadder: boolean;
  /** maxDistanceM ≥ the input's farthest viewer — i.e. comfortable, not merely legible. */
  reachesFarthestViewer: boolean;
  /** toleratedDistanceM ≥ the input's farthest viewer — legible at worst. */
  coversFarthestViewer: boolean;
  /** Which band the input's farthest viewer lands in for THIS panel. */
  zone: ComfortZone;
  /** Farthest viewer ÷ this panel's image height, e.g. 6,55 for "6,6H". */
  heightMultiple: number;
};

export type Finding = {
  code:
    | "plafon"
    | "di-luar-panel"
    | "panel-kurang"
    | "panel-batas"
    | "panel-cukup"
    | "penonton-terdekat"
    | "rasio-konten"
    | "ketersediaan";
  severity: FindingSeverity;
  title: string;
  detail: string;
  href?: string;
  hrefLabel?: string;
};

export type Handoff = {
  href: string;
  label: string;
  reason: string;
};

export type ScreenSizeRefusal = {
  status: "refused";
  input: ScreenSizeInput;
  refusal: { code: "penonton-terbalik"; title: string; detail: string };
};

export type ScreenSizeAnswer = {
  status: "ok";
  input: ScreenSizeInput;
  /** Which model was used and WHY — the competence signal (03-UI §12.5). */
  model: { id: ViewingModel; label: string; short: string; reason: string };
  fit: { mode: FitMode; ratio: number; note: string };
  /** The size the room demands for COMFORT, before rounding up to a real product. */
  required: {
    imageHeightM: number;
    imageWidthM: number;
    displayHeightM: number;
    diagonalM: number;
    diagonalIn: number;
    diagonalCm: number;
  };
  /** The smallest size that is merely LEGIBLE at the farthest seat. */
  minimum: {
    imageHeightM: number;
    displayHeightM: number;
    diagonalIn: number;
  };
  /** Where the planned panel sits between the two lines — what the gauge draws. */
  comfort: {
    contentClass: ContentClass;
    zone: ComfortZone;
    /** Farthest viewer ÷ planned image height. */
    ratio: number;
    /** Distance ÷ image height at the comfortable line, e.g. 6 for "6H". */
    comfortableRatio: number;
    /** Same at the tolerance line, e.g. 8 for "8H". */
    toleratedRatio: number;
    /** The planned panel's own two distances, metres. */
    comfortableM: number;
    toleratedM: number;
  };
  /** Smallest commercial rung that is COMFORTABLE at the farthest viewer, or null. */
  recommended: PanelFit | null;
  /** Smallest commercial rung that is at least LEGIBLE there, or null. */
  recommendedMinimum: PanelFit | null;
  /** The exact required size as a (usually non-commercial) panel. */
  requiredPanel: PanelFit;
  /** The panel the user said they are planning. */
  planned: PanelFit;
  /** The panel every mounting/ceiling number below describes. */
  subject: PanelFit;
  ladder: PanelFit[];
  distance: {
    farthestViewerM: number;
    closestViewerM: number;
    closestViewerGuidelineM: number;
    closestViewerIsAuto: boolean;
    plannedMaxDistanceM: number;
  };
  mounting: {
    imageBottomM: number;
    imageTopM: number;
    requiredCeilingM: number;
    ceilingHeightM: number;
    headroomM: number;
    eyeHeightM: number;
    verticalAngleTopDeg: number;
    ceilingFits: boolean;
  };
  headline: {
    label: string;
    value: string;
    unit: string;
    caption: string;
    verdict: string;
    tone: ResultTone;
  };
  moneySentence: string;
  shortfall: boolean;
  findings: Finding[];
  handoff: Handoff | null;
  steps: CalcStep[];
};

export type ScreenSizeResult = ScreenSizeRefusal | ScreenSizeAnswer;

/* ───────────────────────────── geometry helpers ───────────────────────────── */

const ASPECT_RATIOS: Record<AspectId, { w: number; h: number }> = {
  "16x9": { w: 16, h: 9 },
  "16x10": { w: 16, h: 10 },
  "4x3": { w: 4, h: 3 },
};

/** Width ÷ height, from the exact integers — never a decimal literal. */
export function aspectRatio(id: AspectId): number {
  const { w, h } = ASPECT_RATIOS[id];
  return w / h;
}

export function aspectLabel(id: AspectId): string {
  return C.aspectLabels[id];
}

/**
 * D = H × √(1 + AR²).
 *
 * For 16:9 this is √(1 + (16/9)²) = √337 / 9 = 2,039729. 03-UI §12.2 prints
 * "16:9 → ×2.0323" next to the same formula; 2,0323 does not reproduce from it
 * (it implies AR ≈ 1,769) and is a transcription slip. The formula is
 * authoritative and the factor is always derived from the ratio, never stored.
 */
export function diagonalFactor(id: AspectId): number {
  const ratio = aspectRatio(id);
  return Math.sqrt(1 + ratio * ratio);
}

export function heightFromDiagonalIn(diagonalIn: number, id: AspectId): number {
  return (diagonalIn * METRES_PER_INCH) / diagonalFactor(id);
}

export function diagonalInFromHeight(heightM: number, id: AspectId): number {
  return (heightM * diagonalFactor(id)) / METRES_PER_INCH;
}

/**
 * How the content sits inside the display.
 *
 * Content narrower than the display (4:3 on 16:9) is pillarboxed: the image keeps
 * the FULL display height and loses width, so nothing about legibility changes —
 * what drops is the effective diagonal. Content wider than the display (16:9 on a
 * 4:3 screen) is letterboxed: the image height shrinks by displayAR / contentAR,
 * and image height is exactly what DISCAS sizes against, so the display must grow
 * to compensate. Both directions are handled; neither is guessed at.
 */
export function fitRatio(displayAspect: AspectId, contentAspect: AspectId): number {
  const display = aspectRatio(displayAspect);
  const content = aspectRatio(contentAspect);
  return content > display ? display / content : 1;
}

export function fitMode(displayAspect: AspectId, contentAspect: AspectId): FitMode {
  const display = aspectRatio(displayAspect);
  const content = aspectRatio(contentAspect);
  if (Math.abs(content - display) < EPS) return "penuh";
  return content > display ? "letterbox" : "pillarbox";
}

/* ───────────────────────────── the two models ─────────────────────────────── */

/** Farthest viewer served by an ACTIVE IMAGE of height `imageHeightM`, metres. */
export function maxDistanceFromImageHeight(
  imageHeightM: number,
  input: Pick<
    ScreenSizeInput,
    "model" | "verticalResolution" | "elementHeightPercent"
  >,
): number {
  if (input.model === "adm") {
    // One pixel must subtend ≥ 1 arcminute: FV = IH × 3438 / V_res.
    return (imageHeightM * ARCMINUTES_PER_RADIAN) / input.verticalResolution;
  }
  // FV = (200/100) × %EH × IH = 2 × %EH × IH.
  return (
    ((BDM_ACUITY_FACTOR / 100) * input.elementHeightPercent) * imageHeightM
  );
}

/**
 * Farthest viewer at which the image is still LEGIBLE, metres — the comfortable
 * distance stretched by the field tolerance. Same helper for both models, so ADM
 * and BDM can never disagree about the size of the tolerance.
 */
export function toleratedDistanceFromImageHeight(
  imageHeightM: number,
  input: Pick<
    ScreenSizeInput,
    "model" | "verticalResolution" | "elementHeightPercent"
  >,
): number {
  return maxDistanceFromImageHeight(imageHeightM, input) * FIELD_TOLERANCE;
}

/** Which band a viewing distance falls in, given a panel's two distances. */
export function comfortZoneAt(
  distanceM: number,
  comfortableM: number,
  toleratedM: number,
): ComfortZone {
  if (distanceM <= comfortableM + EPS) return "nyaman";
  if (distanceM <= toleratedM + EPS) return "terbaca";
  return "jauh";
}

/** Distance ÷ image height — the "6,6H" the gauge prints. */
export function heightMultiple(distanceM: number, imageHeightM: number): number {
  return imageHeightM > EPS ? distanceM / imageHeightM : Number.POSITIVE_INFINITY;
}

/** ACTIVE IMAGE height required to serve a viewer at `farthestViewerM`, metres. */
export function imageHeightFromDistance(
  farthestViewerM: number,
  input: Pick<
    ScreenSizeInput,
    "model" | "verticalResolution" | "elementHeightPercent"
  >,
): number {
  if (input.model === "adm") {
    return (farthestViewerM * input.verticalResolution) / ARCMINUTES_PER_RADIAN;
  }
  return (
    farthestViewerM / ((BDM_ACUITY_FACTOR / 100) * input.elementHeightPercent)
  );
}

/* ────────────────────────────── panel bookkeeping ─────────────────────────── */

/**
 * Market availability of a diagonal in Indonesia. This is ACTA's judgement, not a
 * clause of any standard, and the assumptions block says so — the difference
 * between "the standard says" and "we think" is the whole point of the platform.
 */
export function panelAvailability(diagonalIn: number): PanelAvailability {
  if (diagonalIn > LARGEST_PANEL_IN + EPS) {
    return "tidak-ada";
  }
  if (diagonalIn >= 110 - EPS) return "pesanan";
  if (diagonalIn >= 98 - EPS) return "terbatas";
  return "umum";
}

function isLadderSize(diagonalIn: number): boolean {
  return COMMERCIAL_PANEL_SIZES_IN.some(
    (size) => Math.abs(size - diagonalIn) < 1e-6,
  );
}

/** Everything derivable from one diagonal, given the room's model and aspects. */
export function evaluatePanel(
  diagonalIn: number,
  input: ScreenSizeInput,
): PanelFit {
  const displayHeightM = heightFromDiagonalIn(diagonalIn, input.displayAspect);
  const displayWidthM = displayHeightM * aspectRatio(input.displayAspect);
  const ratio = fitRatio(input.displayAspect, input.contentAspect);
  const imageHeightM = displayHeightM * ratio;
  const imageWidthM = imageHeightM * aspectRatio(input.contentAspect);
  const effectiveDiagonalIn = diagonalInFromHeight(
    imageHeightM,
    input.contentAspect,
  );
  const maxDistanceM = maxDistanceFromImageHeight(imageHeightM, input);
  const toleratedDistanceM = maxDistanceM * FIELD_TOLERANCE;

  return {
    diagonalIn,
    diagonalCm: diagonalIn * METRES_PER_INCH * 100,
    displayHeightM,
    displayWidthM,
    imageHeightM,
    imageWidthM,
    effectiveDiagonalIn,
    maxDistanceM,
    toleratedDistanceM,
    requiredCeilingM: IMAGE_BOTTOM_MIN_M + displayHeightM,
    availability: panelAvailability(diagonalIn),
    onLadder: isLadderSize(diagonalIn),
    reachesFarthestViewer: maxDistanceM >= input.farthestViewerM - EPS,
    coversFarthestViewer: toleratedDistanceM >= input.farthestViewerM - EPS,
    zone: comfortZoneAt(input.farthestViewerM, maxDistanceM, toleratedDistanceM),
    heightMultiple: heightMultiple(input.farthestViewerM, imageHeightM),
  };
}

/* ─────────────────────────────── the compute ──────────────────────────────── */

/**
 * The single entry point. Never throws: `params.ts` clamps every input into a
 * sane range before it arrives, and the one genuinely contradictory state
 * (closest viewer beyond the farthest viewer) is REFUSED with an explanation
 * rather than silently repaired — a calculator that quietly "fixes" your input is
 * lying to you.
 */
export function computeScreenSize(input: ScreenSizeInput): ScreenSizeResult {
  if (
    input.closestViewerM !== null &&
    input.closestViewerM > input.farthestViewerM + EPS
  ) {
    return {
      status: "refused",
      input,
      refusal: {
        code: "penonton-terbalik",
        title: C.refusals.penontonTerbalik.title,
        detail: C.refusals.penontonTerbalik.detail(
          fmt(input.closestViewerM),
          fmt(input.farthestViewerM),
        ),
      },
    };
  }

  const model = {
    id: input.model,
    label: C.models[input.model].label,
    short: C.models[input.model].short,
    reason: C.models[input.model].reason,
  };

  const mode = fitMode(input.displayAspect, input.contentAspect);
  const ratio = fitRatio(input.displayAspect, input.contentAspect);

  // 1. The size the room demands.
  const requiredImageHeightM = imageHeightFromDistance(
    input.farthestViewerM,
    input,
  );
  const requiredImageWidthM =
    requiredImageHeightM * aspectRatio(input.contentAspect);
  const requiredDisplayHeightM = requiredImageHeightM / ratio;
  const requiredDiagonalM =
    requiredDisplayHeightM * diagonalFactor(input.displayAspect);
  const requiredDiagonalIn = requiredDiagonalM / METRES_PER_INCH;

  // 1b. The same geometry at the tolerance line — the smallest size that is
  // merely legible from the last seat, which is the number an integrator quotes
  // when the budget will not stretch to the comfortable one.
  const minimumImageHeightM = requiredImageHeightM / FIELD_TOLERANCE;
  const minimumDisplayHeightM = minimumImageHeightM / ratio;
  const minimumDiagonalIn =
    (minimumDisplayHeightM * diagonalFactor(input.displayAspect)) / METRES_PER_INCH;

  // 2. Round up to something a distributor actually sells. Two rungs matter: the
  // smallest that is comfortable, and the smallest that is legible at all.
  const ladder = COMMERCIAL_PANEL_SIZES_IN.map((size) =>
    evaluatePanel(size, input),
  );
  const recommended = ladder.find((panel) => panel.reachesFarthestViewer) ?? null;
  const recommendedMinimum =
    ladder.find((panel) => panel.coversFarthestViewer) ?? null;
  const requiredPanel = evaluatePanel(requiredDiagonalIn, input);
  const planned = evaluatePanel(input.plannedDiagonalIn, input);
  const subject =
    input.solveFor === "jarak" ? planned : (recommended ?? requiredPanel);

  // The gauge always describes the panel the reader said they are planning —
  // "is the screen I already have good enough?" is the question people arrive with.
  const comfortableRatio = planned.imageHeightM > EPS
    ? planned.maxDistanceM / planned.imageHeightM
    : 0;
  const comfort = {
    contentClass: ehToContentClass(input.elementHeightPercent),
    zone: planned.zone,
    ratio: planned.heightMultiple,
    comfortableRatio,
    toleratedRatio: comfortableRatio * FIELD_TOLERANCE,
    comfortableM: planned.maxDistanceM,
    toleratedM: planned.toleratedDistanceM,
  };

  // 3. Distances.
  const closestViewerGuidelineM =
    CLOSEST_VIEWER_IMAGE_HEIGHTS * subject.imageHeightM;
  const closestViewerIsAuto = input.closestViewerM === null;
  const closestViewerM = input.closestViewerM ?? closestViewerGuidelineM;

  // 4. Mounting geometry.
  const imageBottomM = IMAGE_BOTTOM_MIN_M;
  const imageTopM = imageBottomM + subject.displayHeightM;
  const requiredCeilingM = subject.requiredCeilingM;
  const ceilingFits = input.ceilingHeightM >= requiredCeilingM - EPS;
  const verticalAngleTopDeg =
    (Math.atan(
      (imageTopM - input.eyeHeightM) / Math.max(input.farthestViewerM, EPS),
    ) *
      180) /
    Math.PI;

  // 5. Findings, money sentence, handoff.
  const findings: Finding[] = [];
  // "Shortfall" now means past the TOLERANCE, not past the standard's line. A
  // panel in the middle band is reported, but it is not reported as a failure.
  const shortfall = !planned.coversFarthestViewer;

  if (!ceilingFits) {
    findings.push({
      code: "plafon",
      severity: "critical",
      title: C.findings.plafon.title,
      detail: C.findings.plafon.detail(
        fmtFixed(input.ceilingHeightM, 1),
        fmt(requiredCeilingM),
        fmt(subject.diagonalIn),
        fmt(subject.displayHeightM),
      ),
    });
  }

  // `ladder` is built from COMMERCIAL_PANEL_SIZES_IN, which is a non-empty tuple,
  // so this is always defined — but noUncheckedIndexedAccess cannot prove it and
  // an assertion here would be a lie if the ladder ever became filterable.
  // Only a room that no panel can serve EVEN AT THE TOLERANCE gets sent to a
  // projector. Under the old binary test this fired for ordinary meeting rooms.
  const largest = ladder.at(-1);
  if (recommendedMinimum === null && largest) {
    findings.push({
      code: "di-luar-panel",
      severity: "critical",
      title: C.findings.diLuarPanel.title,
      detail: C.findings.diLuarPanel.detail(
        fmt(minimumDiagonalIn),
        fmtInt(largest.diagonalIn),
        fmt(largest.toleratedDistanceM),
      ),
      href: C.findings.diLuarPanel.href,
      hrefLabel: C.findings.diLuarPanel.hrefLabel,
    });
  }

  if (planned.zone === "jauh") {
    findings.push({
      code: "panel-kurang",
      severity: "warning",
      title: C.findings.panelKurang.title,
      detail: C.findings.panelKurang.detail(
        fmt(planned.diagonalIn),
        fmt(planned.toleratedDistanceM),
        fmtFixed(input.farthestViewerM, 1),
        recommendedMinimum ? fmtInt(recommendedMinimum.diagonalIn) : null,
      ),
    });
  } else if (planned.zone === "terbaca") {
    findings.push({
      code: "panel-batas",
      severity: "info",
      title: C.findings.panelBatas.title,
      detail: C.findings.panelBatas.detail(
        fmt(planned.diagonalIn),
        fmtFixed(planned.heightMultiple, 1),
        fmt(planned.maxDistanceM),
        recommended ? fmtInt(recommended.diagonalIn) : null,
      ),
    });
  } else {
    findings.push({
      code: "panel-cukup",
      severity: "info",
      title: C.findings.panelCukup.title,
      detail: C.findings.panelCukup.detail(
        fmt(planned.diagonalIn),
        fmt(planned.maxDistanceM),
        fmtFixed(input.farthestViewerM, 1),
      ),
    });
  }

  if (closestViewerM < closestViewerGuidelineM - EPS) {
    findings.push({
      code: "penonton-terdekat",
      severity: "info",
      title: C.findings.penontonTerdekat.title,
      detail: C.findings.penontonTerdekat.detail(
        fmt(closestViewerM),
        fmt(closestViewerGuidelineM),
      ),
    });
  }

  if (mode === "pillarbox") {
    findings.push({
      code: "rasio-konten",
      severity: "info",
      title: C.findings.rasioKontenPillarbox.title,
      detail: C.findings.rasioKontenPillarbox.detail(
        aspectLabel(input.contentAspect),
        aspectLabel(input.displayAspect),
        fmt(subject.diagonalIn),
        fmt(subject.effectiveDiagonalIn),
      ),
    });
  } else if (mode === "letterbox") {
    findings.push({
      code: "rasio-konten",
      severity: "warning",
      title: C.findings.rasioKontenLetterbox.title,
      detail: C.findings.rasioKontenLetterbox.detail(
        aspectLabel(input.contentAspect),
        aspectLabel(input.displayAspect),
        fmt((1 - ratio) * 100),
      ),
    });
  }

  if (subject.availability === "terbatas" || subject.availability === "pesanan") {
    findings.push({
      code: "ketersediaan",
      severity: "warning",
      title: C.findings.ketersediaan.title,
      detail: C.findings.ketersediaan.detail(
        fmt(subject.diagonalIn),
        C.availability[subject.availability].note,
      ),
    });
  }

  // One sentence, three shapes — one per band. The middle one is the whole point
  // of this rewrite: it reports the truth ("readable, not restful") instead of
  // rounding a workable room down to a failure.
  const moneySentence =
    planned.zone === "nyaman"
      ? C.money.within(
          fmt(planned.diagonalIn),
          fmt(planned.maxDistanceM),
          fmtFixed(input.farthestViewerM, 1),
        )
      : planned.zone === "terbaca"
        ? C.money.tolerated(
            fmt(planned.diagonalIn),
            fmtFixed(input.farthestViewerM, 1),
            fmtFixed(planned.heightMultiple, 1),
            fmt(planned.maxDistanceM),
            recommended ? fmtInt(recommended.diagonalIn) : null,
          )
        : recommendedMinimum
          ? C.money.shortfallWithPanel(
              fmt(planned.diagonalIn),
              fmt(planned.toleratedDistanceM),
              fmtFixed(input.farthestViewerM, 1),
              fmtInt(recommendedMinimum.diagonalIn),
            )
          : C.money.shortfallNoPanel(
              fmt(planned.diagonalIn),
              fmt(planned.toleratedDistanceM),
              fmtFixed(input.farthestViewerM, 1),
              fmt(minimumDiagonalIn),
            );

  // The projector handoff carries the required image WIDTH, which is the
  // parameter the throw calculator asks for (03-UI §12.4: ?w=…). It fires on the
  // tolerance line, not the comfort line — a room a 110" panel can still serve is
  // not a projector room.
  const handoff: Handoff | null =
    recommendedMinimum === null
      ? {
          href: `${PROJECTOR_TOOL_PATH}?w=${roundParam(requiredImageWidthM)}`,
          label: C.findings.diLuarPanel.hrefLabel,
          reason: C.findings.diLuarPanel.title,
        }
      : null;

  const headline = buildHeadline({
    input,
    requiredDiagonalIn,
    requiredDiagonalM,
    requiredImageHeightM,
    requiredImageWidthM,
    recommended,
    recommendedMinimum,
    planned,
    ceilingFits,
  });

  const steps = buildSteps({
    input,
    mode,
    ratio,
    requiredImageHeightM,
    requiredDisplayHeightM,
    requiredDiagonalM,
    requiredDiagonalIn,
    minimumDiagonalIn,
    recommended,
    recommendedMinimum,
    planned,
    subject,
    closestViewerGuidelineM,
    requiredCeilingM,
  });

  return {
    status: "ok",
    input,
    model,
    fit: { mode, ratio, note: C.fit[mode].note },
    required: {
      imageHeightM: requiredImageHeightM,
      imageWidthM: requiredImageWidthM,
      displayHeightM: requiredDisplayHeightM,
      diagonalM: requiredDiagonalM,
      diagonalIn: requiredDiagonalIn,
      diagonalCm: requiredDiagonalM * 100,
    },
    minimum: {
      imageHeightM: minimumImageHeightM,
      displayHeightM: minimumDisplayHeightM,
      diagonalIn: minimumDiagonalIn,
    },
    comfort,
    recommended,
    recommendedMinimum,
    requiredPanel,
    planned,
    subject,
    ladder,
    distance: {
      farthestViewerM: input.farthestViewerM,
      closestViewerM,
      closestViewerGuidelineM,
      closestViewerIsAuto,
      plannedMaxDistanceM: planned.maxDistanceM,
    },
    mounting: {
      imageBottomM,
      imageTopM,
      requiredCeilingM,
      ceilingHeightM: input.ceilingHeightM,
      headroomM: input.ceilingHeightM - requiredCeilingM,
      eyeHeightM: input.eyeHeightM,
      verticalAngleTopDeg,
      ceilingFits,
    },
    headline,
    moneySentence,
    shortfall,
    findings,
    handoff,
    steps,
  };
}

/** Canonical dot-decimal for a URL param, at most 2 decimals, no trailing zeros. */
function roundParam(value: number): string {
  return String(Number(value.toFixed(2)));
}

/* ─────────────────────────────── the headline ─────────────────────────────── */

/** Zone → readout tone. The middle band is amber, never red: it is a caveat. */
const ZONE_TONE: Record<ComfortZone, ResultTone> = {
  nyaman: "good",
  terbaca: "warning",
  jauh: "bad",
};

function buildHeadline(args: {
  input: ScreenSizeInput;
  requiredDiagonalIn: number;
  requiredDiagonalM: number;
  requiredImageHeightM: number;
  requiredImageWidthM: number;
  recommended: PanelFit | null;
  recommendedMinimum: PanelFit | null;
  planned: PanelFit;
  ceilingFits: boolean;
}): ScreenSizeAnswer["headline"] {
  const {
    input,
    requiredDiagonalIn,
    requiredDiagonalM,
    requiredImageHeightM,
    requiredImageWidthM,
    recommended,
    recommendedMinimum,
    planned,
    ceilingFits,
  } = args;

  // "How far does my panel reach?" — the headline is the tolerance line, because
  // that is the honest answer to "reach"; the comfort line rides in the caption.
  if (input.solveFor === "jarak") {
    return {
      label: C.results.maxDistance,
      value: fmt(planned.toleratedDistanceM),
      unit: C.results.unitMetre,
      caption: C.results.maxDistanceCaption(
        fmt(planned.diagonalIn),
        fmt(planned.imageHeightM),
        fmt(planned.maxDistanceM),
      ),
      verdict: C.results.zoneVerdict[planned.zone](
        fmtFixed(planned.heightMultiple, 1),
      ),
      tone:
        planned.zone === "nyaman" && !ceilingFits
          ? "warning"
          : ZONE_TONE[planned.zone],
    };
  }

  // "What size do I need?" — headline the panel a distributor can actually ship,
  // not the raw geometric diagonal. 141" was arithmetically true and useless.
  const target = recommended ?? recommendedMinimum;
  if (target) {
    return {
      label: C.results.recommendedPanel,
      value: fmtInt(target.diagonalIn),
      unit: C.results.unitInch,
      caption: C.results.panelCaption(
        fmt(target.imageHeightM),
        fmt(target.imageWidthM),
        fmt(target.maxDistanceM),
        fmt(target.toleratedDistanceM),
      ),
      verdict:
        recommended === null && recommendedMinimum
          ? C.results.verdictMinimumOnly(fmtInt(recommendedMinimum.diagonalIn))
          : recommendedMinimum && recommendedMinimum.diagonalIn < target.diagonalIn
            ? C.results.verdictPanelWithFloor(
                fmtInt(recommendedMinimum.diagonalIn),
              )
            : C.results.verdictPanel(fmtInt(target.diagonalIn)),
      tone: ceilingFits ? "good" : "warning",
    };
  }

  // No commercial rung reaches, even at the tolerance line. Now the exact
  // geometric diagonal IS the useful number, because a projector can hit it.
  return {
    label: C.results.requiredDiagonal,
    value: fmt(requiredDiagonalIn),
    unit: C.results.unitInch,
    caption: C.results.diagonalCaption(
      fmt(requiredDiagonalM * 100),
      fmt(requiredImageHeightM),
      fmt(requiredImageWidthM),
    ),
    verdict: C.results.verdictNoPanel,
    tone: "bad",
  };
}

/* ──────────────────────────────── the steps ───────────────────────────────── */

/**
 * The substituted-numbers trail (03-UI §12.5). Every step prints the symbolic
 * formula AND the same expression with this room's numbers in it, so an engineer
 * can check the arithmetic in five seconds. The first step always states which
 * model was chosen and why.
 */
function buildSteps(args: {
  input: ScreenSizeInput;
  mode: FitMode;
  ratio: number;
  requiredImageHeightM: number;
  requiredDisplayHeightM: number;
  requiredDiagonalM: number;
  requiredDiagonalIn: number;
  minimumDiagonalIn: number;
  recommended: PanelFit | null;
  recommendedMinimum: PanelFit | null;
  planned: PanelFit;
  subject: PanelFit;
  closestViewerGuidelineM: number;
  requiredCeilingM: number;
}): CalcStep[] {
  const {
    input,
    mode,
    ratio,
    requiredImageHeightM,
    requiredDisplayHeightM,
    requiredDiagonalM,
    requiredDiagonalIn,
    minimumDiagonalIn,
    recommended,
    recommendedMinimum,
    planned,
    subject,
    closestViewerGuidelineM,
    requiredCeilingM,
  } = args;

  const isAdm = input.model === "adm";
  const eh = String(input.elementHeightPercent);
  const displayFactorText = fmt(diagonalFactor(input.displayAspect));
  const steps: CalcStep[] = [];

  steps.push({
    label: C.steps.model,
    formula: isAdm ? "IH = FV × V_res / 3438" : "FV = 2 × %EH × IH",
    substitution: isAdm
      ? `V_res = ${fmtInt(input.verticalResolution)}`
      : `%EH = ${eh}%`,
    result: C.models[input.model].short,
    note: isAdm
      ? C.stepNotes.admBasis
      : input.elementHeightPercent === 3
        ? `${C.stepNotes.bdmBasis(eh)} ${C.stepNotes.sixH}`
        : C.stepNotes.bdmBasis(eh),
  });

  if (input.solveFor === "jarak") {
    steps.push({
      label: C.steps.displayHeightFromDiagonal,
      formula: "H = D × 0,0254 / √(1 + AR²)",
      substitution: `${fmt(planned.diagonalIn)} × 0,0254 / ${displayFactorText}`,
      result: `${fmt(planned.displayHeightM)} m`,
    });

    if (mode !== "penuh") {
      steps.push({
        label: C.steps.activeImageHeight,
        formula: "IH = H × (AR_layar / AR_konten)",
        substitution: `${fmt(planned.displayHeightM)} × ${fmt(ratio)}`,
        result: `${fmt(planned.imageHeightM)} m`,
        note: C.fit[mode].note,
      });
    }

    steps.push({
      label: C.steps.maxDistance,
      formula: isAdm ? "FV = IH × 3438 / V_res" : "FV = 2 × %EH × IH",
      substitution: isAdm
        ? `${fmt(planned.imageHeightM)} × 3438 / ${fmtInt(input.verticalResolution)}`
        : `2 × ${eh} × ${fmt(planned.imageHeightM)}`,
      result: `${fmt(planned.maxDistanceM)} m`,
    });

    steps.push({
      label: C.steps.tolerated,
      formula: "FV_batas = FV × 4/3",
      substitution: `${fmt(planned.maxDistanceM)} × 1,33`,
      result: `${fmt(planned.toleratedDistanceM)} m`,
      note: C.stepNotes.tolerance,
    });

    steps.push({
      label: C.steps.zone,
      formula: "R = FV_ruang / IH",
      substitution: `${fmtFixed(input.farthestViewerM, 1)} / ${fmt(planned.imageHeightM)}`,
      result: `${fmtFixed(planned.heightMultiple, 1)}H — ${C.zones[planned.zone].label}`,
    });
  } else {
    steps.push({
      label: C.steps.imageHeightFromDistance,
      formula: isAdm ? "IH = FV × V_res / 3438" : "IH = FV / (2 × %EH)",
      substitution: isAdm
        ? `${fmtFixed(input.farthestViewerM, 1)} × ${fmtInt(input.verticalResolution)} / 3438`
        : `${fmtFixed(input.farthestViewerM, 1)} / (2 × ${eh})`,
      result: `${fmt(requiredImageHeightM)} m`,
    });

    if (mode !== "penuh") {
      steps.push({
        label: C.steps.displayHeightFromImage,
        formula: "H = IH / (AR_layar / AR_konten)",
        substitution: `${fmt(requiredImageHeightM)} / ${fmt(ratio)}`,
        result: `${fmt(requiredDisplayHeightM)} m`,
        note: C.fit[mode].note,
      });
    }

    steps.push({
      label: C.steps.diagonalMetre,
      formula: "D = H × √(1 + AR²)",
      substitution: `${fmt(requiredDisplayHeightM)} × ${displayFactorText}`,
      result: `${fmt(requiredDiagonalM)} m`,
    });

    steps.push({
      label: C.steps.diagonalInch,
      formula: "D_in = D / 0,0254",
      substitution: `${fmt(requiredDiagonalM)} / 0,0254`,
      result: `${fmt(requiredDiagonalIn)}"`,
    });

    steps.push({
      label: C.steps.minimumDiagonal,
      formula: "D_min = D_in / (4/3)",
      substitution: `${fmt(requiredDiagonalIn)} / 1,33`,
      result: `${fmt(minimumDiagonalIn)}"`,
      note: C.stepNotes.tolerance,
    });

    steps.push({
      label: C.steps.panelChoice,
      formula: "D_panel ≥ D_min",
      substitution: recommendedMinimum
        ? `${fmtInt(recommendedMinimum.diagonalIn)}" ≥ ${fmt(minimumDiagonalIn)}"`
        : `${fmtInt(LARGEST_PANEL_IN)}" < ${fmt(minimumDiagonalIn)}"`,
      result: recommendedMinimum
        ? `${fmtInt(recommendedMinimum.diagonalIn)}"${recommended ? ` · nyaman ${fmtInt(recommended.diagonalIn)}"` : ""}`
        : C.results.verdictNoPanel,
      note: recommendedMinimum
        ? C.availability[recommendedMinimum.availability].note
        : undefined,
    });
  }

  steps.push({
    label: C.steps.closestViewer,
    formula: "CV ≥ 1,5 × IH",
    substitution: `1,5 × ${fmt(subject.imageHeightM)}`,
    result: `${fmt(closestViewerGuidelineM)} m`,
  });

  steps.push({
    label: C.steps.mounting,
    formula: "Plafon_min = 1,2 + H",
    substitution: `1,2 + ${fmt(subject.displayHeightM)}`,
    result: `${fmt(requiredCeilingM)} m`,
    note: C.stepNotes.bottomRule,
  });

  return steps;
}
