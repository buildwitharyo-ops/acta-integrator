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
export const ELEMENT_HEIGHT_PERCENTS = [1, 2, 3] as const;
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
  /** Farthest viewer this panel serves under the chosen model, metres. */
  maxDistanceM: number;
  /** 1,2 m + panel height. */
  requiredCeilingM: number;
  availability: PanelAvailability;
  /** True when the diagonal is one of the commercial rungs. */
  onLadder: boolean;
  /** maxDistanceM ≥ the input's farthest viewer. */
  reachesFarthestViewer: boolean;
};

export type Finding = {
  code:
    | "plafon"
    | "di-luar-panel"
    | "panel-kurang"
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
  /** The size the room demands, before it is rounded up to a real product. */
  required: {
    imageHeightM: number;
    imageWidthM: number;
    displayHeightM: number;
    diagonalM: number;
    diagonalIn: number;
    diagonalCm: number;
  };
  /** Smallest commercial rung that reaches the farthest viewer, or null. */
  recommended: PanelFit | null;
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

  return {
    diagonalIn,
    diagonalCm: diagonalIn * METRES_PER_INCH * 100,
    displayHeightM,
    displayWidthM,
    imageHeightM,
    imageWidthM,
    effectiveDiagonalIn,
    maxDistanceM,
    requiredCeilingM: IMAGE_BOTTOM_MIN_M + displayHeightM,
    availability: panelAvailability(diagonalIn),
    onLadder: isLadderSize(diagonalIn),
    reachesFarthestViewer: maxDistanceM >= input.farthestViewerM - EPS,
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

  // 2. Round up to something a distributor actually sells.
  const ladder = COMMERCIAL_PANEL_SIZES_IN.map((size) =>
    evaluatePanel(size, input),
  );
  const recommended = ladder.find((panel) => panel.reachesFarthestViewer) ?? null;
  const requiredPanel = evaluatePanel(requiredDiagonalIn, input);
  const planned = evaluatePanel(input.plannedDiagonalIn, input);
  const subject =
    input.solveFor === "jarak" ? planned : (recommended ?? requiredPanel);

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
  const shortfall = !planned.reachesFarthestViewer;

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
  const largest = ladder.at(-1);
  if (recommended === null && largest) {
    findings.push({
      code: "di-luar-panel",
      severity: "critical",
      title: C.findings.diLuarPanel.title,
      detail: C.findings.diLuarPanel.detail(
        fmt(requiredDiagonalIn),
        fmtInt(largest.diagonalIn),
        fmt(largest.maxDistanceM),
      ),
      href: C.findings.diLuarPanel.href,
      hrefLabel: C.findings.diLuarPanel.hrefLabel,
    });
  }

  if (shortfall) {
    findings.push({
      code: "panel-kurang",
      severity: "warning",
      title: C.findings.panelKurang.title,
      detail: C.findings.panelKurang.detail(
        fmt(planned.diagonalIn),
        fmt(planned.maxDistanceM),
        fmtFixed(input.farthestViewerM, 1),
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

  const moneySentence = shortfall
    ? recommended
      ? C.money.shortfallWithPanel(
          fmt(planned.diagonalIn),
          fmt(planned.maxDistanceM),
          fmtFixed(input.farthestViewerM, 1),
          fmtInt(recommended.diagonalIn),
        )
      : C.money.shortfallNoPanel(
          fmt(planned.diagonalIn),
          fmt(planned.maxDistanceM),
          fmtFixed(input.farthestViewerM, 1),
          fmt(requiredDiagonalIn),
        )
    : C.money.within(
        fmt(planned.diagonalIn),
        fmt(planned.maxDistanceM),
        fmtFixed(input.farthestViewerM, 1),
      );

  // The projector handoff carries the required image WIDTH, which is the
  // parameter the throw calculator asks for (03-UI §12.4: ?w=…).
  const handoff: Handoff | null =
    recommended === null
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
    planned,
    shortfall,
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
    recommended,
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
    recommended,
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

function buildHeadline(args: {
  input: ScreenSizeInput;
  requiredDiagonalIn: number;
  requiredDiagonalM: number;
  requiredImageHeightM: number;
  requiredImageWidthM: number;
  recommended: PanelFit | null;
  planned: PanelFit;
  shortfall: boolean;
  ceilingFits: boolean;
}): ScreenSizeAnswer["headline"] {
  const {
    input,
    requiredDiagonalIn,
    requiredDiagonalM,
    requiredImageHeightM,
    requiredImageWidthM,
    recommended,
    planned,
    shortfall,
    ceilingFits,
  } = args;

  if (input.solveFor === "jarak") {
    return {
      label: C.results.maxDistance,
      value: fmt(planned.maxDistanceM),
      unit: C.results.unitMetre,
      caption: C.results.maxDistanceCaption(
        fmt(planned.diagonalIn),
        fmt(planned.imageHeightM),
      ),
      verdict: shortfall ? C.results.verdictShort : C.results.verdictWithin,
      tone: shortfall ? "bad" : ceilingFits ? "good" : "warning",
    };
  }

  return {
    label: C.results.requiredDiagonal,
    value: fmt(requiredDiagonalIn),
    unit: C.results.unitInch,
    caption: C.results.diagonalCaption(
      fmt(requiredDiagonalM * 100),
      fmt(requiredImageHeightM),
      fmt(requiredImageWidthM),
    ),
    verdict: recommended
      ? C.results.verdictPanel(fmtInt(recommended.diagonalIn))
      : C.results.verdictNoPanel,
    tone: recommended === null ? "bad" : ceilingFits ? "good" : "warning",
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
  recommended: PanelFit | null;
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
    recommended,
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
      label: C.steps.panelChoice,
      formula: "D_panel ≥ D_in",
      substitution: recommended
        ? `${fmtInt(recommended.diagonalIn)}" ≥ ${fmt(requiredDiagonalIn)}"`
        : `${fmtInt(LARGEST_PANEL_IN)}" < ${fmt(requiredDiagonalIn)}"`,
      result: recommended
        ? `${fmtInt(recommended.diagonalIn)}"`
        : C.results.verdictNoPanel,
      note: recommended ? C.availability[recommended.availability].note : undefined,
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
