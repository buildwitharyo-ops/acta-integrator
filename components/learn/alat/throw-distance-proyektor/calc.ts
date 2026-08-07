/**
 * Throw distance + brightness engine.
 *
 * PURE (03-UI §12.1): zero React imports, zero I/O, no Date, no Math.random.
 * The same call runs at build (SSG default preset), on the server (?params) and
 * in the browser (live edit) and returns byte-identical output.
 *
 * The arithmetic is the product. Every constant below is named, and carries the
 * derivation it came from — a wrong number here collapses the correctness
 * positioning the whole /learn platform rests on.
 *
 * Geometry (03-UI §12.4)
 *   D      = TR × W                                   jarak lempar
 *   W      = D ÷ TR
 *   A_ft²  = (W_m × H_m) × 10,7639
 *
 * Photometry
 *   fL     = (lumen ÷ A_ft²) × gain                   ← NO π. See FT2_PER_M2 note.
 *   lumen  = fL_target × A_ft² ÷ gain
 *   cd/m²  = fL × 3,426
 *   lampu  : × 0,75 design margin
 */

import { fmt, fmtInt } from "@/lib/learn/format";
import {
  AMBIENT_LABELS,
  ASSUMPTIONS,
  FINDINGS,
  MATH,
  RESULT,
} from "./copy.id";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Which variable the user is solving for. Same equation, inverted. */
export type ThrowMode = "jarak" | "lebar";

/** Room light condition, which selects the foot-lambert target. */
export type AmbientLevel = "gelap" | "terkontrol" | "tinggi";

export type AspectRatioId = "16x9" | "16x10" | "4x3" | "21x9";

export type ThrowInput = {
  mode: ThrowMode;
  /** Projector throw ratio (D ÷ W), from the datasheet. */
  throwRatio: number;
  /** Image width in metres. Used when mode === "jarak". */
  screenWidthM: number;
  /** Lens-to-screen distance in metres. Used when mode === "lebar". */
  throwDistanceM: number;
  aspect: AspectRatioId;
  /** Datasheet light output (ANSI / ISO 21118) in lumens. */
  lumens: number;
  /** Screen gain. Matte white = 1,0. */
  gain: number;
  ambient: AmbientLevel;
};

export type ScreenGeometry = {
  widthM: number;
  heightM: number;
  diagonalM: number;
  diagonalInch: number;
  areaM2: number;
  areaFt2: number;
  aspect: AspectRatioId;
  /** width ÷ height, e.g. 16/9 = 1,777… */
  aspectRatio: number;
};

export type ThrowClass = "ust" | "pendek" | "standar" | "panjang";

export type BrightnessVerdict = "aman" | "marginal" | "kurang";

export type FindingSeverity = "kritis" | "peringatan" | "info";

export type ThrowFindingId =
  | "ust-geometri"
  | "throw-pendek"
  | "throw-panjang"
  | "kurang-terang"
  | "nyaris-target"
  | "belum-rekomendasi-id"
  | "cadangan-besar"
  | "led-direct-view"
  | "gain-tinggi"
  | "gain-rendah"
  | "offset-lensa";

export type ThrowFinding = {
  id: ThrowFindingId;
  severity: FindingSeverity;
  title: string;
  detail: string;
};

/**
 * One line of the show-the-math panel. Structurally identical to
 * `ShowTheMathProps["steps"][number]` — declared here so calc.ts stays free of
 * any import that could drag React into the pure layer.
 */
export type CalcStep = {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  note?: string;
};

export type ThrowBrightness = {
  /** Datasheet lumens, as entered. */
  lumensRated: number;
  /** After the 0,75 design margin. */
  lumensEffective: number;
  /** fL the datasheet number would give on day one. */
  flRated: number;
  /** fL after the design margin — the number the verdict is taken from. */
  flEffective: number;
  /** flEffective expressed as cd/m². */
  nits: number;
  targetFL: number;
  /** flEffective ÷ targetFL. */
  targetRatio: number;
  /** flEffective − targetFL. Negative means short of target. */
  headroomFL: number;
  verdict: BrightnessVerdict;
  /** Datasheet lumens needed to still hit targetFL after the design margin. */
  lumensRequired: number;
  /** Same, for the 40 fL Indonesian recommendation. */
  lumensRequiredRecommended: number;
  /** max(0, lumensRequired − lumensRated). */
  lumensShortfall: number;
};

export type ThrowResult = {
  /** The clamped input the numbers were produced from. */
  input: ThrowInput;
  screen: ScreenGeometry;
  /** Resolved lens-to-screen distance, whichever mode produced it. */
  throwDistanceM: number;
  throwRatio: number;
  throwClass: ThrowClass;
  /** Which branch ran, and why — printed above the math panel. */
  model: { id: ThrowMode; label: string; reason: string };
  target: { level: AmbientLevel; fL: number; label: string };
  brightness: ThrowBrightness;
  /** True when required datasheet lumens exceed the direct-view LED threshold. */
  ledRecommended: boolean;
  /** Sorted: kritis → peringatan → info. */
  findings: ThrowFinding[];
  /** Feeds <ShowTheMath steps={…} />. */
  steps: CalcStep[];
  /** Feeds <ShowTheMath assumptions={…} />. */
  assumptions: string[];
  /** One sentence, safe to use as the OG card line. */
  summary: string;
};

/* ------------------------------------------------------------------ */
/* Constants — every one with its provenance                           */
/* ------------------------------------------------------------------ */

/**
 * Square feet per square metre. Exact value is 1 ÷ 0,3048² = 10,763910…;
 * 03-UI §12.4 fixes the working constant at 10,7639, which differs by 8×10⁻⁷
 * relative — three orders of magnitude below the 3-significant-figure readout.
 */
export const FT2_PER_M2 = 10.7639;

/**
 * cd/m² per foot-lambert. Derivation: 1 fL = (1/π) cd/ft², and
 * (1/π) × 10,7639 = 3,4263. 03-UI §12.4 fixes it at 3,426.
 *
 * This is the ONLY place π enters projector photometry, and it is why the
 * foot-lambert formula itself has no π in it: a foot-lambert is defined as the
 * luminance of a perfect Lambertian diffuser reflecting one lumen per square
 * foot, so lumens/ft² × gain IS foot-lamberts. Dividing by π there is the most
 * common error in published projector calculators.
 */
export const CD_M2_PER_FL = 3.426;

/**
 * Design margin on datasheet lumens. Projector output falls 25–50% over lamp
 * life (03-UI §12.4); 0,75 sizes the system for year three, not for the demo.
 * Applied unconditionally and stated in the assumptions — it is deliberately
 * not a user-facing toggle, because switching it off produces a system that is
 * correct only on the day it is commissioned.
 */
export const LAMP_DERATE = 0.75;

/** Metres per inch, for the diagonal cross-check against panel sizes. */
export const M_PER_INCH = 0.0254;

/** Foot-lambert design targets by room light condition (03-UI §12.4). */
export const FL_TARGETS: Record<AmbientLevel, number> = {
  gelap: 12,
  terkontrol: 22,
  tinggi: 40,
};

/**
 * The Indonesian default pair: 22 fL is the minimum we accept, 40 fL is what we
 * recommend for rooms with large windows and no blackout — which is most of them.
 */
export const FL_MINIMUM_ID = 22;
export const FL_RECOMMENDED_ID = 40;

/**
 * Above this required datasheet output, direct-view LED wins on cost, noise,
 * maintenance and — decisively — on ambient light (03-UI §12.4). Saying so
 * costs ACTA a projector sale, which is exactly why it ships.
 */
export const LED_LUMEN_THRESHOLD = 8000;

/** Throw-ratio class boundaries. Industry convention for reading a datasheet. */
export const UST_MAX_THROW_RATIO = 0.4;
export const SHORT_MAX_THROW_RATIO = 1;
export const STANDARD_MAX_THROW_RATIO = 2;

/** Beyond this the lens position stops being a plausible ceiling mount. */
export const LONG_THROW_DISTANCE_M = 8;

/** Screen gain outside this band changes the viewing experience, not just fL. */
export const HIGH_GAIN = 1.3;
export const LOW_GAIN = 0.9;

/** flEffective ÷ target below 1 but at or above this reads as "marginal". */
export const MARGINAL_RATIO = 0.8;

/** Headroom above which eco mode is the better engineering choice. */
export const AMPLE_HEADROOM_RATIO = 2;

export const ASPECTS: Record<
  AspectRatioId,
  { id: AspectRatioId; label: string; w: number; h: number; ratio: number }
> = {
  "16x9": { id: "16x9", label: "16:9", w: 16, h: 9, ratio: 16 / 9 },
  "16x10": { id: "16x10", label: "16:10", w: 16, h: 10, ratio: 16 / 10 },
  "4x3": { id: "4x3", label: "4:3", w: 4, h: 3, ratio: 4 / 3 },
  "21x9": { id: "21x9", label: "21:9", w: 21, h: 9, ratio: 21 / 9 },
};

export const ASPECT_IDS = Object.keys(ASPECTS) as AspectRatioId[];
export const MODES: ThrowMode[] = ["jarak", "lebar"];
export const AMBIENT_LEVELS: AmbientLevel[] = ["gelap", "terkontrol", "tinggi"];

/**
 * Physically sane bounds. params.ts clamps URL input to these; compute() clamps
 * again, so a hand-built ThrowInput from a lesson embed cannot divide by zero.
 */
export const LIMITS = {
  throwRatio: { min: 0.2, max: 10 },
  screenWidthM: { min: 0.5, max: 20 },
  throwDistanceM: { min: 0.3, max: 60 },
  lumens: { min: 200, max: 50000 },
  gain: { min: 0.4, max: 2.5 },
} as const;

/**
 * The Indonesian default preset, and the exact URL of 03-UI §12.1:
 * ?tr=1.5&w=3.6&lm=4000&g=1.0 — a 3,6 m screen is the size at which a flat
 * panel stops being an option and the projector question actually starts.
 */
export const DEFAULT_INPUT: ThrowInput = {
  mode: "jarak",
  throwRatio: 1.5,
  screenWidthM: 3.6,
  throwDistanceM: 5.4,
  aspect: "16x9",
  lumens: 4000,
  gain: 1,
  ambient: "terkontrol",
};

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function isAspect(value: unknown): value is AspectRatioId {
  return typeof value === "string" && value in ASPECTS;
}

function isMode(value: unknown): value is ThrowMode {
  return value === "jarak" || value === "lebar";
}

function isAmbient(value: unknown): value is AmbientLevel {
  return value === "gelap" || value === "terkontrol" || value === "tinggi";
}

/**
 * Clamp every field into its physical range. Unparseable or out-of-range values
 * fall back to the default preset rather than throwing — a calculator must never
 * 500 on a crafted URL (03-UI §12.1).
 */
export function sanitizeInput(raw: Partial<ThrowInput> | undefined): ThrowInput {
  const source: Partial<ThrowInput> = raw ?? {};
  return {
    mode: isMode(source.mode) ? source.mode : DEFAULT_INPUT.mode,
    throwRatio: clamp(
      Number(source.throwRatio),
      LIMITS.throwRatio.min,
      LIMITS.throwRatio.max,
      DEFAULT_INPUT.throwRatio,
    ),
    screenWidthM: clamp(
      Number(source.screenWidthM),
      LIMITS.screenWidthM.min,
      LIMITS.screenWidthM.max,
      DEFAULT_INPUT.screenWidthM,
    ),
    throwDistanceM: clamp(
      Number(source.throwDistanceM),
      LIMITS.throwDistanceM.min,
      LIMITS.throwDistanceM.max,
      DEFAULT_INPUT.throwDistanceM,
    ),
    aspect: isAspect(source.aspect) ? source.aspect : DEFAULT_INPUT.aspect,
    lumens: clamp(
      Number(source.lumens),
      LIMITS.lumens.min,
      LIMITS.lumens.max,
      DEFAULT_INPUT.lumens,
    ),
    gain: clamp(
      Number(source.gain),
      LIMITS.gain.min,
      LIMITS.gain.max,
      DEFAULT_INPUT.gain,
    ),
    ambient: isAmbient(source.ambient) ? source.ambient : DEFAULT_INPUT.ambient,
  };
}

/**
 * Screen dimensions from an image width. Exported because Panel.tsx echoes the
 * derived height and diagonal live, and because the reference matrix needs it.
 */
export function deriveScreen(
  widthM: number,
  aspect: AspectRatioId,
): ScreenGeometry {
  const spec = ASPECTS[isAspect(aspect) ? aspect : DEFAULT_INPUT.aspect];
  const width =
    Number.isFinite(widthM) && widthM > 0 ? widthM : DEFAULT_INPUT.screenWidthM;
  const height = (width * spec.h) / spec.w;
  const diagonalM = Math.sqrt(width * width + height * height);
  const areaM2 = width * height;
  return {
    widthM: width,
    heightM: height,
    diagonalM,
    diagonalInch: diagonalM / M_PER_INCH,
    areaM2,
    areaFt2: areaM2 * FT2_PER_M2,
    aspect: spec.id,
    aspectRatio: spec.ratio,
  };
}

/** Screen width implied by a diagonal in inches — the ukuran-layar handoff. */
export function widthFromDiagonalInch(
  diagonalInch: number,
  aspect: AspectRatioId,
): number {
  const spec = ASPECTS[isAspect(aspect) ? aspect : DEFAULT_INPUT.aspect];
  if (!Number.isFinite(diagonalInch) || diagonalInch <= 0) {
    return DEFAULT_INPUT.screenWidthM;
  }
  const diagonalM = diagonalInch * M_PER_INCH;
  const heightPerWidth = spec.h / spec.w;
  return diagonalM / Math.sqrt(1 + heightPerWidth * heightPerWidth);
}

/** fL delivered by `lumens` on `areaFt2` at `gain`. No π — see CD_M2_PER_FL. */
export function footLamberts(
  lumens: number,
  areaFt2: number,
  gain: number,
): number {
  if (!Number.isFinite(areaFt2) || areaFt2 <= 0) return 0;
  return (lumens / areaFt2) * gain;
}

/**
 * Datasheet lumens required to hold `targetFL` on `areaFt2` after the lamp
 * design margin. This is the number to write in an RKS.
 */
export function requiredLumens(
  targetFL: number,
  areaFt2: number,
  gain: number,
): number {
  if (!Number.isFinite(gain) || gain <= 0) return Number.POSITIVE_INFINITY;
  return (targetFL * areaFt2) / gain / LAMP_DERATE;
}

/** Convenience for the reference matrix: required lumens for a screen width. */
export function requiredLumensForWidth(
  widthM: number,
  aspect: AspectRatioId,
  gain: number,
  targetFL: number,
): number {
  return requiredLumens(targetFL, deriveScreen(widthM, aspect).areaFt2, gain);
}

export function classifyThrow(throwRatio: number): ThrowClass {
  if (throwRatio < UST_MAX_THROW_RATIO) return "ust";
  if (throwRatio < SHORT_MAX_THROW_RATIO) return "pendek";
  if (throwRatio <= STANDARD_MAX_THROW_RATIO) return "standar";
  return "panjang";
}

export function classifyBrightness(
  flEffective: number,
  targetFL: number,
): BrightnessVerdict {
  if (targetFL <= 0) return "aman";
  const ratio = flEffective / targetFL;
  if (ratio >= 1) return "aman";
  if (ratio >= MARGINAL_RATIO) return "marginal";
  return "kurang";
}

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  kritis: 0,
  peringatan: 1,
  info: 2,
};

/* ------------------------------------------------------------------ */
/* compute                                                             */
/* ------------------------------------------------------------------ */

export function compute(raw: Partial<ThrowInput> | undefined): ThrowResult {
  const input = sanitizeInput(raw);
  const spec = ASPECTS[input.aspect];

  /* --- 1. Geometry branch ------------------------------------------ */
  const solvedWidthM =
    input.mode === "lebar" ? input.throwDistanceM / input.throwRatio : input.screenWidthM;
  const screen = deriveScreen(solvedWidthM, input.aspect);
  const throwDistanceM =
    input.mode === "lebar" ? input.throwDistanceM : input.throwRatio * screen.widthM;

  /* --- 2. Photometry ------------------------------------------------ */
  const lumensEffective = input.lumens * LAMP_DERATE;
  const flRated = footLamberts(input.lumens, screen.areaFt2, input.gain);
  const flEffective = footLamberts(lumensEffective, screen.areaFt2, input.gain);
  const nits = flEffective * CD_M2_PER_FL;

  const targetFL = FL_TARGETS[input.ambient];
  const targetRatio = targetFL > 0 ? flEffective / targetFL : 0;
  const lumensNeeded = requiredLumens(targetFL, screen.areaFt2, input.gain);
  const lumensNeededRecommended = requiredLumens(
    FL_RECOMMENDED_ID,
    screen.areaFt2,
    input.gain,
  );
  const verdict = classifyBrightness(flEffective, targetFL);
  const ledRecommended = lumensNeeded > LED_LUMEN_THRESHOLD;

  const brightness: ThrowBrightness = {
    lumensRated: input.lumens,
    lumensEffective,
    flRated,
    flEffective,
    nits,
    targetFL,
    targetRatio,
    headroomFL: flEffective - targetFL,
    verdict,
    lumensRequired: lumensNeeded,
    lumensRequiredRecommended: lumensNeededRecommended,
    lumensShortfall: Math.max(0, lumensNeeded - input.lumens),
  };

  const throwClass = classifyThrow(input.throwRatio);
  const ambientLabel = AMBIENT_LABELS[input.ambient];

  /* --- 3. Formatted tokens, shared by steps, findings and summary --- */
  const t = {
    width: fmt(screen.widthM),
    height: fmt(screen.heightM),
    diagonalM: fmt(screen.diagonalM),
    diagonalInch: fmt(screen.diagonalInch),
    areaM2: fmt(screen.areaM2),
    areaFt2: fmt(screen.areaFt2),
    distance: fmt(throwDistanceM),
    throwRatio: fmt(input.throwRatio),
    gain: fmt(input.gain),
    lumens: fmtInt(input.lumens),
    lumensEffective: fmtInt(lumensEffective),
    fl: fmt(flEffective),
    nits: fmt(nits),
    target: fmt(targetFL),
    ratio: fmt(targetRatio),
    required: fmtInt(lumensNeeded),
    requiredRecommended: fmtInt(lumensNeededRecommended),
    shortfall: fmtInt(brightness.lumensShortfall),
  };

  /* --- 4. Show-the-math -------------------------------------------- */
  const geometrySteps: CalcStep[] =
    input.mode === "lebar"
      ? [
          {
            label: MATH.steps.widthFromDistance,
            formula: MATH.formulas.widthFromDistance,
            substitution: `${t.distance} ÷ ${t.throwRatio}`,
            result: `${t.width} m`,
            note: MATH.notes.modeLebar,
          },
          {
            label: MATH.steps.screenHeight,
            formula: MATH.formulas.screenHeight({ h: spec.h, w: spec.w }),
            substitution: `${t.width} × ${spec.h} ÷ ${spec.w}`,
            result: `${t.height} m`,
          },
        ]
      : [
          {
            label: MATH.steps.screenHeight,
            formula: MATH.formulas.screenHeight({ h: spec.h, w: spec.w }),
            substitution: `${t.width} × ${spec.h} ÷ ${spec.w}`,
            result: `${t.height} m`,
          },
          {
            label: MATH.steps.throwDistance,
            formula: MATH.formulas.throwDistance,
            substitution: `${t.throwRatio} × ${t.width}`,
            result: `${t.distance} m`,
            note: MATH.notes.modeJarak,
          },
        ];

  const steps: CalcStep[] = [
    ...geometrySteps,
    {
      label: MATH.steps.diagonal,
      formula: MATH.formulas.diagonal,
      substitution: `√(${t.width}² + ${t.height}²)`,
      result: `${t.diagonalM} m (${t.diagonalInch}")`,
      note: MATH.notes.diagonal,
    },
    {
      label: MATH.steps.areaM2,
      formula: MATH.formulas.areaM2,
      substitution: `${t.width} × ${t.height}`,
      result: `${t.areaM2} m²`,
    },
    {
      label: MATH.steps.areaFt2,
      formula: MATH.formulas.areaFt2,
      substitution: `${t.areaM2} × 10,7639`,
      result: `${t.areaFt2} ft²`,
    },
    {
      label: MATH.steps.derate,
      formula: MATH.formulas.derate,
      substitution: `${t.lumens} × 0,75`,
      result: `${t.lumensEffective} lm`,
      note: MATH.notes.derate,
    },
    {
      label: MATH.steps.footLambert,
      formula: MATH.formulas.footLambert,
      substitution: `${t.lumensEffective} ÷ ${t.areaFt2} × ${t.gain}`,
      result: `${t.fl} fL`,
      note: MATH.notes.footLambert,
    },
    {
      label: MATH.steps.nits,
      formula: MATH.formulas.nits,
      substitution: `${t.fl} × 3,426`,
      result: `${t.nits} cd/m²`,
    },
    {
      label: MATH.steps.target,
      formula: MATH.formulas.target,
      substitution: ambientLabel,
      result: `${t.target} fL`,
      note: MATH.notes.target({ ambient: ambientLabel }),
    },
    {
      label: MATH.steps.requiredLumens,
      formula: MATH.formulas.requiredLumens,
      substitution: `${t.target} × ${t.areaFt2} ÷ ${t.gain} ÷ 0,75`,
      result: `${t.required} lm`,
      note: MATH.notes.requiredLumens,
    },
    {
      label: MATH.steps.verdict,
      formula: MATH.formulas.verdict,
      substitution: `${t.fl} ÷ ${t.target}`,
      result: `${t.ratio}×`,
      note:
        verdict === "aman"
          ? MATH.notes.verdictAman
          : verdict === "marginal"
            ? MATH.notes.verdictMarginal
            : MATH.notes.verdictKurang,
    },
  ];

  /* --- 5. Findings -------------------------------------------------- */
  const findings: ThrowFinding[] = [];
  const push = (
    id: ThrowFindingId,
    severity: FindingSeverity,
    body: { title: string; detail: string },
  ) => {
    findings.push({ id, severity, title: body.title, detail: body.detail });
  };

  if (throwClass === "ust") {
    push(
      "ust-geometri",
      "peringatan",
      FINDINGS.ustGeometri({
        tr: t.throwRatio,
        distance: t.distance,
        height: t.height,
      }),
    );
  } else if (throwClass === "pendek") {
    push(
      "throw-pendek",
      "info",
      FINDINGS.throwPendek({ tr: t.throwRatio, distance: t.distance }),
    );
  }

  if (throwDistanceM > LONG_THROW_DISTANCE_M) {
    push("throw-panjang", "info", FINDINGS.throwPanjang({ distance: t.distance }));
  }

  if (verdict === "kurang") {
    push(
      "kurang-terang",
      "kritis",
      FINDINGS.kurangTerang({
        fl: t.fl,
        target: t.target,
        ambient: ambientLabel,
        required: t.required,
        shortfall: t.shortfall,
      }),
    );
  } else if (verdict === "marginal") {
    push(
      "nyaris-target",
      "peringatan",
      FINDINGS.nyarisTarget({
        fl: t.fl,
        target: t.target,
        required: t.required,
      }),
    );
  } else {
    if (flEffective < FL_RECOMMENDED_ID && input.ambient !== "tinggi") {
      push(
        "belum-rekomendasi-id",
        "info",
        FINDINGS.belumRekomendasiId({ fl: t.fl }),
      );
    }
    if (targetRatio >= AMPLE_HEADROOM_RATIO) {
      push(
        "cadangan-besar",
        "info",
        FINDINGS.cadanganBesar({ fl: t.fl, target: t.target }),
      );
    }
  }

  if (ledRecommended) {
    push(
      "led-direct-view",
      "kritis",
      FINDINGS.ledDirectView({
        required: t.required,
        width: t.width,
        ambient: ambientLabel,
      }),
    );
  }

  if (input.gain > HIGH_GAIN) {
    push("gain-tinggi", "peringatan", FINDINGS.gainTinggi({ gain: t.gain }));
  } else if (input.gain < LOW_GAIN) {
    push("gain-rendah", "info", FINDINGS.gainRendah({ gain: t.gain }));
  }

  // Always present: the tool states what it does not model rather than guessing.
  push("offset-lensa", "info", FINDINGS.offsetLensa());

  findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  /* --- 6. Assumptions ----------------------------------------------- */
  const assumptions: string[] = [...ASSUMPTIONS.base];
  if (input.gain !== 1) assumptions.push(ASSUMPTIONS.gainNonUnity);
  assumptions.push(ASSUMPTIONS.roomDepth({ distance: t.distance }));

  /* --- 7. Summary ---------------------------------------------------- */
  const summary =
    verdict === "kurang"
      ? RESULT.summary.kurang({
          lumens: t.lumens,
          width: t.width,
          fl: t.fl,
          target: t.target,
          ambient: ambientLabel,
          required: t.required,
        })
      : verdict === "marginal"
        ? RESULT.summary.marginal({
            lumens: t.lumens,
            width: t.width,
            fl: t.fl,
            target: t.target,
            ambient: ambientLabel,
          })
        : RESULT.summary.aman({
            lumens: t.lumens,
            width: t.width,
            fl: t.fl,
            target: t.target,
            ambient: ambientLabel,
          });

  return {
    input,
    screen,
    throwDistanceM,
    throwRatio: input.throwRatio,
    throwClass,
    model: {
      id: input.mode,
      label:
        input.mode === "lebar"
          ? MATH.steps.widthFromDistance
          : MATH.steps.throwDistance,
      reason:
        input.mode === "lebar" ? MATH.notes.modeLebar : MATH.notes.modeJarak,
    },
    target: { level: input.ambient, fL: targetFL, label: ambientLabel },
    brightness,
    ledRecommended,
    findings,
    steps,
    assumptions,
    summary,
  };
}
