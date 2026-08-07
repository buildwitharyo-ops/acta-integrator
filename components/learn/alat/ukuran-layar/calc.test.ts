import { describe, expect, it } from "vitest";
import {
  ARCMINUTES_PER_RADIAN,
  BDM_ACUITY_FACTOR,
  CLOSEST_VIEWER_IMAGE_HEIGHTS,
  COMMERCIAL_PANEL_SIZES_IN,
  IMAGE_BOTTOM_MIN_M,
  METRES_PER_INCH,
  aspectRatio,
  computeScreenSize,
  diagonalFactor,
  diagonalInFromHeight,
  evaluatePanel,
  heightFromDiagonalIn,
  imageHeightFromDistance,
  maxDistanceFromImageHeight,
  panelAvailability,
  type ScreenSizeAnswer,
  type ScreenSizeInput,
} from "./calc";
import {
  PARAM_RANGES,
  SCREEN_SIZE_DEFAULTS,
  hasScreenSizeParams,
  parseScreenSizeParams,
  screenSizeHref,
  serializeScreenSizeParams,
} from "./params";

/* ─────────────────────────────── helpers ──────────────────────────────────── */

function input(overrides: Partial<ScreenSizeInput> = {}): ScreenSizeInput {
  return { ...SCREEN_SIZE_DEFAULTS, ...overrides };
}

/** Narrows to the answer branch and fails loudly instead of throwing on `null`. */
function answer(overrides: Partial<ScreenSizeInput> = {}): ScreenSizeAnswer {
  const result = computeScreenSize(input(overrides));
  if (result.status !== "ok") {
    throw new Error(`expected an answer, got a refusal: ${result.refusal.code}`);
  }
  return result;
}

function codes(result: ScreenSizeAnswer): string[] {
  return result.findings.map((finding) => finding.code);
}

/* ───────────────────────────── the constants ──────────────────────────────── */

describe("constants", () => {
  it("uses the DISCAS-rounded arcminutes-per-radian, not Math.PI", () => {
    expect(ARCMINUTES_PER_RADIAN).toBe(3438);
    // 60 × 180 / π = 3437,7468 — the standard rounds it, and we match the standard
    // so our output equals AVIXA's own calculator.
    expect(ARCMINUTES_PER_RADIAN).toBeCloseTo((60 * 180) / Math.PI, 0);
  });

  it("keeps the BDM acuity factor at 200 (≈17,2 arcminutes per element)", () => {
    expect(BDM_ACUITY_FACTOR).toBe(200);
    expect(ARCMINUTES_PER_RADIAN / BDM_ACUITY_FACTOR).toBeCloseTo(17.19, 2);
  });

  it("keeps the mounting and closest-viewer constants", () => {
    expect(METRES_PER_INCH).toBe(0.0254);
    expect(IMAGE_BOTTOM_MIN_M).toBe(1.2);
    expect(CLOSEST_VIEWER_IMAGE_HEIGHTS).toBe(1.5);
    expect(COMMERCIAL_PANEL_SIZES_IN).toEqual([55, 65, 75, 86, 98, 110]);
  });
});

/* ───────────────────────────── plain geometry ─────────────────────────────── */

describe("geometry", () => {
  it("derives the 16:9 diagonal factor from the ratio: √337 / 9", () => {
    // 03-UI §12.2 prints ×2.0323 beside the same formula; that value does not
    // reproduce from √(1 + AR²) and is a transcription slip in the doc.
    expect(diagonalFactor("16x9")).toBeCloseTo(2.039729, 6);
    expect(diagonalFactor("16x9")).toBeCloseTo(Math.sqrt(337) / 9, 12);
    expect(diagonalFactor("4x3")).toBeCloseTo(1.666667, 6);
    expect(diagonalFactor("16x10")).toBeCloseTo(1.886796, 6);
  });

  it("converts a 65 inch 16:9 panel to 0,809 m of image height", () => {
    expect(heightFromDiagonalIn(65, "16x9")).toBeCloseTo(0.809421, 6);
    expect(diagonalInFromHeight(0.809421, "16x9")).toBeCloseTo(65, 4);
  });

  it("keeps aspect ratios exact rationals", () => {
    expect(aspectRatio("16x9")).toBe(16 / 9);
    expect(aspectRatio("4x3")).toBe(4 / 3);
    expect(aspectRatio("16x10")).toBe(1.6);
  });
});

/* ────────────────────────── the two DISCAS models ─────────────────────────── */

describe("models", () => {
  it("ADM: IH = FV × V_res / 3438, and inverts exactly", () => {
    const params = {
      model: "adm",
      verticalResolution: 1080,
      elementHeightPercent: 2,
    } as const;
    expect(imageHeightFromDistance(7, params)).toBeCloseTo((7 * 1080) / 3438, 9);
    expect(imageHeightFromDistance(3, params)).toBeCloseTo(0.942408, 6);
    expect(maxDistanceFromImageHeight(0.942408, params)).toBeCloseTo(3, 4);
  });

  it("ADM scales with resolution: 4K demands twice the height of 1080p", () => {
    const at = (verticalResolution: 1080 | 2160) =>
      imageHeightFromDistance(6, {
        model: "adm",
        verticalResolution,
        elementHeightPercent: 2,
      });
    expect(at(2160) / at(1080)).toBeCloseTo(2, 9);
  });

  it("BDM: FV = 2 × %EH × IH, and %EH = 3 collapses to the 6H rule", () => {
    const params = {
      model: "bdm",
      verticalResolution: 1080,
      elementHeightPercent: 3,
    } as const;
    expect(maxDistanceFromImageHeight(1.2, params)).toBeCloseTo(6 * 1.2, 9);
    expect(imageHeightFromDistance(7, params)).toBeCloseTo(7 / 6, 9);
  });

  it("BDM: denser content forces a bigger image", () => {
    const heightAt = (elementHeightPercent: 1 | 2 | 3) =>
      imageHeightFromDistance(7, {
        model: "bdm",
        verticalResolution: 1080,
        elementHeightPercent,
      });
    expect(heightAt(1)).toBeCloseTo(3.5, 9);
    expect(heightAt(2)).toBeCloseTo(1.75, 9);
    expect(heightAt(3)).toBeCloseTo(7 / 6, 9);
    expect(heightAt(1)).toBeGreaterThan(heightAt(3));
  });

  it("ignores %EH under ADM and ignores resolution under BDM", () => {
    expect(answer({ model: "adm", elementHeightPercent: 1 }).required.diagonalIn)
      .toBeCloseTo(
        answer({ model: "adm", elementHeightPercent: 3 }).required.diagonalIn,
        9,
      );
    expect(answer({ model: "bdm", verticalResolution: 720 }).required.diagonalIn)
      .toBeCloseTo(
        answer({ model: "bdm", verticalResolution: 2160 }).required.diagonalIn,
        9,
      );
  });
});

/* ────────────────────── golden values, mode "ukuran" ──────────────────────── */

describe("golden — Indonesian defaults (BDM, %EH 2, 7,0 m, 65\", plafon 2,8 m)", () => {
  const result = answer();

  it("requires a 1,75 m image and a 141 inch display", () => {
    expect(result.required.imageHeightM).toBeCloseTo(1.75, 9);
    expect(result.required.diagonalM).toBeCloseTo(3.569526, 6);
    expect(result.required.diagonalIn).toBeCloseTo(140.5325, 4);
    expect(result.required.diagonalCm).toBeCloseTo(356.95, 2);
    expect(result.headline.value).toBe("141");
    expect(result.headline.unit).toBe("inci");
  });

  it("finds no commercial panel large enough and hands off to the projector tool", () => {
    expect(result.recommended).toBeNull();
    expect(codes(result)).toContain("di-luar-panel");
    expect(result.handoff).not.toBeNull();
    expect(result.handoff?.href).toBe(
      "/learn/alat/throw-distance-proyektor?w=3.11",
    );
    expect(result.headline.tone).toBe("bad");
  });

  it("reports the planned 65 inch panel as good to 3,24 m", () => {
    expect(result.planned.maxDistanceM).toBeCloseTo(3.237685, 6);
    expect(result.shortfall).toBe(true);
    expect(codes(result)).toContain("panel-kurang");
  });

  it("generates the money sentence rather than hard-coding it", () => {
    expect(result.moneySentence).toBe(
      'Layar 65" yang Anda rencanakan hanya layak sampai jarak 3,24 m. ' +
        "Kursi terjauh Anda 7,0 m. " +
        'Anda butuh 141" — di luar ukuran panel komersial. ' +
        "Gunakan proyektor atau videowall LED.",
    );
  });

  it("raises the ceiling finding with the spec's verbatim sentence", () => {
    expect(result.mounting.requiredCeilingM).toBeCloseTo(2.95, 9);
    expect(result.mounting.ceilingFits).toBe(false);
    const ceiling = result.findings.find((f) => f.code === "plafon");
    expect(ceiling?.severity).toBe("critical");
    expect(ceiling?.detail).toContain(
      "Plafon 2,8 m tidak cukup untuk layar ini. Ini kendala arsitektur, bukan kendala AV.",
    );
  });

  it("derives the closest-viewer guideline as 1,5 × image height", () => {
    expect(result.distance.closestViewerGuidelineM).toBeCloseTo(2.625, 9);
    expect(result.distance.closestViewerIsAuto).toBe(true);
    expect(result.distance.closestViewerM).toBeCloseTo(2.625, 9);
    expect(codes(result)).not.toContain("penonton-terdekat");
  });

  it("computes mounting geometry from the 1,2 m bottom-of-image rule", () => {
    expect(result.mounting.imageBottomM).toBe(1.2);
    expect(result.mounting.imageTopM).toBeCloseTo(2.95, 9);
    expect(result.mounting.verticalAngleTopDeg).toBeCloseTo(14.42, 2);
  });
});

describe("golden — the spec's own example (BDM, %EH 3, 7,0 m, 65\")", () => {
  const result = answer({ elementHeightPercent: 3 });

  it("needs 93,7 inches and rounds up to a real 98 inch panel", () => {
    expect(result.required.imageHeightM).toBeCloseTo(7 / 6, 9);
    expect(result.required.diagonalIn).toBeCloseTo(93.6883, 4);
    expect(result.recommended?.diagonalIn).toBe(98);
    expect(result.recommended?.maxDistanceM).toBeCloseTo(7.32215, 5);
  });

  it("rejects 86 inches, which only reaches 6,43 m", () => {
    const eightySix = result.ladder.find((panel) => panel.diagonalIn === 86);
    expect(eightySix?.maxDistanceM).toBeCloseTo(6.42556, 5);
    expect(eightySix?.reachesFarthestViewer).toBe(false);
  });

  it("produces the money sentence in the spec's exact shape", () => {
    // 03-UI §12.2 prints "4,3 m" for the 65" leg; that figure does not reproduce
    // from any DISCAS model (%EH 2 → 3,24 m, %EH 3 → 4,86 m) and is illustrative
    // prose. The sentence is generated from the arithmetic, never transcribed.
    expect(result.moneySentence).toBe(
      'Layar 65" yang Anda rencanakan hanya layak sampai jarak 4,86 m. ' +
        "Kursi terjauh Anda 7,0 m. " +
        'Anda butuh 98" — atau proyektor.',
    );
  });

  it("flags 98 inch availability in Indonesia without inventing lead times", () => {
    expect(result.subject.availability).toBe("terbatas");
    expect(codes(result)).toContain("ketersediaan");
    expect(result.findings.find((f) => f.code === "ketersediaan")?.detail).not.toMatch(
      /\d+\s*(minggu|hari|bulan)/,
    );
  });

  it("fits under a 2,8 m ceiling, unlike the %EH 2 case", () => {
    expect(result.mounting.requiredCeilingM).toBeCloseTo(2.42036, 5);
    expect(result.mounting.ceilingFits).toBe(true);
    expect(codes(result)).not.toContain("plafon");
    expect(result.headline.tone).toBe("good");
  });
});

describe("golden — ADM analytical room (1080p, 3,0 m)", () => {
  const result = answer({
    model: "adm",
    farthestViewerM: 3,
    plannedDiagonalIn: 75,
    ceilingHeightM: 3,
  });

  it("needs 75,7 inches and therefore an 86 inch panel", () => {
    expect(result.required.imageHeightM).toBeCloseTo(0.942408, 6);
    expect(result.required.diagonalIn).toBeCloseTo(75.6794, 4);
    expect(result.recommended?.diagonalIn).toBe(86);
  });

  it("shows that a 75 inch panel misses by 3 cm of image height", () => {
    const seventyFive = result.ladder.find((panel) => panel.diagonalIn === 75);
    expect(seventyFive?.maxDistanceM).toBeCloseTo(2.97307, 5);
    expect(result.shortfall).toBe(true);
    expect(result.moneySentence).toBe(
      'Layar 75" yang Anda rencanakan hanya layak sampai jarak 2,97 m. ' +
        "Kursi terjauh Anda 3,0 m. " +
        'Anda butuh 86" — atau proyektor.',
    );
  });

  it("states which model it used and why", () => {
    expect(result.model.id).toBe("adm");
    expect(result.model.short).toBe("ADM");
    expect(result.model.reason).toContain("satu piksel");
    expect(result.steps[0]!.formula).toBe("IH = FV × V_res / 3438");
    expect(result.steps[0]!.result).toBe("ADM");
  });
});

/* ─────────────────────── golden values, mode "jarak" ──────────────────────── */

describe("golden — solving for distance instead of size", () => {
  it("turns a 98 inch panel into 7,32 m of reach under the 6H rule", () => {
    const result = answer({
      solveFor: "jarak",
      plannedDiagonalIn: 98,
      elementHeightPercent: 3,
    });
    expect(result.planned.maxDistanceM).toBeCloseTo(7.32215, 5);
    expect(result.headline.label).toBe("JARAK PENONTON TERJAUH");
    expect(result.headline.value).toBe("7,32");
    expect(result.headline.unit).toBe("m");
    expect(result.shortfall).toBe(false);
    expect(codes(result)).toContain("panel-cukup");
    expect(result.moneySentence).toBe(
      'Layar 98" yang Anda rencanakan terbaca sampai jarak 7,32 m. ' +
        "Kursi terjauh Anda 7,0 m — masih di dalam batas.",
    );
  });

  it("is the same equation solved the other way", () => {
    const size = answer({ elementHeightPercent: 3, farthestViewerM: 6 });
    const distance = answer({
      solveFor: "jarak",
      elementHeightPercent: 3,
      plannedDiagonalIn: size.required.diagonalIn,
    });
    expect(distance.planned.maxDistanceM).toBeCloseTo(6, 9);
  });

  it("describes the planned panel, not the recommended one, in mode jarak", () => {
    const result = answer({ solveFor: "jarak", plannedDiagonalIn: 55 });
    expect(result.subject.diagonalIn).toBe(55);
    expect(result.mounting.requiredCeilingM).toBeCloseTo(1.88489, 5);
  });
});

/* ───────────────────────────── the ladder ─────────────────────────────────── */

describe("commercial panel ladder", () => {
  const result = answer({ elementHeightPercent: 3 });

  it("is monotonic in size, reach and ceiling demand", () => {
    for (let i = 1; i < result.ladder.length; i += 1) {
      expect(result.ladder[i]!.diagonalIn).toBeGreaterThan(
        result.ladder[i - 1]!.diagonalIn,
      );
      expect(result.ladder[i]!.maxDistanceM).toBeGreaterThan(
        result.ladder[i - 1]!.maxDistanceM,
      );
      expect(result.ladder[i]!.requiredCeilingM).toBeGreaterThan(
        result.ladder[i - 1]!.requiredCeilingM,
      );
    }
  });

  it("picks the SMALLEST rung that reaches the farthest viewer", () => {
    const reaching = result.ladder.filter((panel) => panel.reachesFarthestViewer);
    expect(result.recommended?.diagonalIn).toBe(reaching[0]!.diagonalIn);
  });

  it("grades Indonesian availability by size", () => {
    expect(panelAvailability(55)).toBe("umum");
    expect(panelAvailability(86)).toBe("umum");
    expect(panelAvailability(98)).toBe("terbatas");
    expect(panelAvailability(110)).toBe("pesanan");
    expect(panelAvailability(140.53)).toBe("tidak-ada");
  });

  it("round-trips the required size back to the input distance", () => {
    const exact = evaluatePanel(result.required.diagonalIn, input({
      elementHeightPercent: 3,
    }));
    expect(exact.maxDistanceM).toBeCloseTo(7, 9);
    expect(exact.onLadder).toBe(false);
  });
});

/* ───────────────────────── aspect-ratio edge cases ────────────────────────── */

describe("content aspect ratio", () => {
  it("pillarboxes 4:3 content on a 16:9 panel: height kept, diagonal lost", () => {
    const result = answer({ elementHeightPercent: 3, contentAspect: "4x3" });
    // The image keeps the full panel height, so the required panel does not grow…
    expect(result.required.displayHeightM).toBeCloseTo(7 / 6, 9);
    expect(result.recommended?.diagonalIn).toBe(98);
    // …but a 98" panel showing 4:3 is an 80" image.
    expect(result.subject.effectiveDiagonalIn).toBeCloseTo(80.076, 3);
    expect(result.fit.mode).toBe("pillarbox");
    const finding = result.findings.find((f) => f.code === "rasio-konten");
    expect(finding?.severity).toBe("info");
    expect(finding?.detail).toContain('80,1"');
  });

  it("letterboxes 16:9 content on a 4:3 screen: image height drops 25%", () => {
    const result = answer({
      elementHeightPercent: 3,
      displayAspect: "4x3",
      contentAspect: "16x9",
    });
    expect(result.fit.mode).toBe("letterbox");
    expect(result.fit.ratio).toBeCloseTo(0.75, 9);
    // The image still has to be 1,167 m tall, so the SCREEN must be 1,556 m tall.
    expect(result.required.imageHeightM).toBeCloseTo(7 / 6, 9);
    expect(result.required.displayHeightM).toBeCloseTo(1.555556, 6);
    expect(result.required.diagonalIn).toBeCloseTo(102.0706, 4);
    expect(result.recommended?.diagonalIn).toBe(110);
    const finding = result.findings.find((f) => f.code === "rasio-konten");
    expect(finding?.severity).toBe("warning");
    expect(finding?.detail).toContain("25%");
  });

  it("adds no correction when content and display agree", () => {
    const result = answer();
    expect(result.fit.mode).toBe("penuh");
    expect(result.fit.ratio).toBe(1);
    expect(codes(result)).not.toContain("rasio-konten");
    expect(result.steps.map((step) => step.label)).not.toContain(
      "Koreksi rasio konten",
    );
  });
});

/* ──────────────────────────── refusals & warnings ─────────────────────────── */

describe("refusals", () => {
  it("refuses when the closest viewer sits beyond the farthest viewer", () => {
    const result = computeScreenSize(
      input({ farthestViewerM: 7, closestViewerM: 9 }),
    );
    expect(result.status).toBe("refused");
    if (result.status !== "refused") return;
    expect(result.refusal.code).toBe("penonton-terbalik");
    expect(result.refusal.detail).toContain("9 m");
    expect(result.refusal.detail).toContain("7 m");
    expect(result.refusal.detail).toContain("saling bertentangan");
  });

  it("accepts a closest viewer exactly at the farthest viewer", () => {
    const result = computeScreenSize(
      input({ farthestViewerM: 7, closestViewerM: 7 }),
    );
    expect(result.status).toBe("ok");
  });

  it("never emits a system contrast ratio anywhere (§12.8 rule 1)", () => {
    const serialised = JSON.stringify([
      answer(),
      answer({ elementHeightPercent: 3 }),
      answer({ model: "adm" }),
      answer({ solveFor: "jarak" }),
    ]);
    expect(serialised.toLowerCase()).not.toContain("kontras");
    expect(serialised).not.toMatch(/\b\d+\s*:\s*1\b/);
  });

  it("warns when the front row is closer than 1,5 × image height", () => {
    const result = answer({ elementHeightPercent: 3, closestViewerM: 1 });
    expect(result.distance.closestViewerIsAuto).toBe(false);
    const finding = result.findings.find((f) => f.code === "penonton-terdekat");
    // A guideline, not a requirement — so it must not be raised as critical.
    expect(finding?.severity).toBe("info");
    expect(finding?.detail).toContain("1,83 m");
  });

  it("clears the ceiling finding once the room is tall enough", () => {
    const result = answer({ ceilingHeightM: 3.6 });
    expect(result.mounting.ceilingFits).toBe(true);
    expect(result.mounting.headroomM).toBeCloseTo(0.65, 9);
    expect(codes(result)).not.toContain("plafon");
  });
});

/* ──────────────────────────── show-the-math steps ─────────────────────────── */

describe("steps", () => {
  it("always leads with the model and its reason", () => {
    const bdm = answer();
    expect(bdm.steps[0]!.label).toBe("Model penglihatan");
    expect(bdm.steps[0]!.result).toBe("BDM");
    expect(bdm.steps[0]!.note).toContain("17,2 arcmenit");
    expect(answer({ elementHeightPercent: 3 }).steps[0]!.note).toContain(
      "aturan 6H",
    );
  });

  it("prints substituted numbers for every step", () => {
    for (const step of answer().steps) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.formula.length).toBeGreaterThan(0);
      expect(step.substitution.length).toBeGreaterThan(0);
      expect(step.result.length).toBeGreaterThan(0);
      // Indonesian decimal comma, never a decimal point.
      expect(step.result).not.toMatch(/\d\.\d/);
    }
  });

  it("shows the arithmetic an engineer can check in five seconds", () => {
    const steps = answer({ elementHeightPercent: 3 }).steps;
    const height = steps.find((step) => step.label === "Tinggi gambar");
    expect(height?.formula).toBe("IH = FV / (2 × %EH)");
    expect(height?.substitution).toBe("7,0 / (2 × 3)");
    expect(height?.result).toBe("1,17 m");

    const diagonal = steps.find((step) => step.label === "Diagonal layar");
    expect(diagonal?.substitution).toBe("1,17 × 2,04");
    expect(diagonal?.result).toBe("2,38 m");

    const choice = steps.find((step) => step.label === "Panel komersial terdekat");
    expect(choice?.result).toBe('98"');
  });

  it("caps every printed value at three significant figures", () => {
    for (const step of answer({ model: "adm" }).steps) {
      for (const match of step.result.matchAll(/\d+(?:,\d+)?/g)) {
        const digits = match[0].replace(/[^\d]/g, "").replace(/^0+/, "");
        expect(digits.length).toBeLessThanOrEqual(4);
      }
    }
  });
});

/* ─────────────────────────────── purity ───────────────────────────────────── */

describe("purity", () => {
  it("is deterministic: the same input always gives the same output", () => {
    expect(JSON.stringify(answer())).toBe(JSON.stringify(answer()));
  });

  it("does not mutate its input", () => {
    const source = input({ elementHeightPercent: 3 });
    const snapshot = { ...source };
    computeScreenSize(source);
    expect(source).toEqual(snapshot);
  });
});

/* ────────────────────────── params: clamp to default ──────────────────────── */

describe("params — every param clamps to its default", () => {
  it("returns the Indonesian defaults for an empty query", () => {
    expect(parseScreenSizeParams(undefined)).toEqual(SCREEN_SIZE_DEFAULTS);
    expect(parseScreenSizeParams({})).toEqual(SCREEN_SIZE_DEFAULTS);
    expect(parseScreenSizeParams(null)).toEqual(SCREEN_SIZE_DEFAULTS);
    expect(SCREEN_SIZE_DEFAULTS).toEqual({
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
    });
  });

  it("survives every shape of garbage a link-scraper can send", () => {
    const parsed = parseScreenSizeParams({
      fv: "abc",
      d: "NaN",
      ch: "Infinity",
      he: "-9",
      eh: "7",
      vr: "9999",
      ar: "21x9",
      cr: "",
      m: "sabine",
      s: "<script>",
      cv: "null",
    });
    expect(parsed.farthestViewerM).toBe(7);
    expect(parsed.plannedDiagonalIn).toBe(65);
    expect(parsed.ceilingHeightM).toBe(2.8);
    expect(parsed.eyeHeightM).toBe(PARAM_RANGES.eyeHeightM.min);
    expect(parsed.elementHeightPercent).toBe(2);
    expect(parsed.verticalResolution).toBe(1080);
    expect(parsed.displayAspect).toBe("16x9");
    expect(parsed.contentAspect).toBe("16x9");
    expect(parsed.model).toBe("bdm");
    expect(parsed.solveFor).toBe("ukuran");
    expect(parsed.closestViewerM).toBeNull();
    expect(computeScreenSize(parsed).status).toBe("ok");
  });

  it("clamps absurd magnitudes into the range, and non-finite ones to the default", () => {
    expect(parseScreenSizeParams({ fv: "9999" }).farthestViewerM).toBe(60);
    expect(parseScreenSizeParams({ fv: "-5" }).farthestViewerM).toBe(1);
    expect(parseScreenSizeParams({ fv: "1e400" }).farthestViewerM).toBe(7);
    expect(parseScreenSizeParams({ d: "1e9" }).plannedDiagonalIn).toBe(300);
    expect(parseScreenSizeParams({ ch: "0.1" }).ceilingHeightM).toBe(2);
    expect(computeScreenSize(parseScreenSizeParams({ fv: "60" })).status).toBe("ok");
  });

  it("accepts both decimal registers, because humans and URLs disagree", () => {
    expect(parseScreenSizeParams({ fv: "7.5" }).farthestViewerM).toBe(7.5);
    expect(parseScreenSizeParams({ fv: "7,5" }).farthestViewerM).toBe(7.5);
    expect(parseScreenSizeParams({ fv: "1.500,25" }).farthestViewerM).toBe(60);
  });

  it("takes the first value of a repeated key and ignores the rest", () => {
    expect(parseScreenSizeParams({ fv: ["9", "3"] }).farthestViewerM).toBe(9);
    expect(parseScreenSizeParams({ fv: [] }).farthestViewerM).toBe(7);
  });

  it("reads URLSearchParams as happily as a plain object", () => {
    const params = new URLSearchParams("m=adm&fv=7.0&vr=1080&ar=16x9");
    const parsed = parseScreenSizeParams(params);
    expect(parsed.model).toBe("adm");
    expect(parsed.farthestViewerM).toBe(7);
    expect(parsed.verticalResolution).toBe(1080);
    expect(parsed.displayAspect).toBe("16x9");
  });

  it("is case-insensitive on enums", () => {
    expect(parseScreenSizeParams({ m: "ADM" }).model).toBe("adm");
    expect(parseScreenSizeParams({ ar: "16X9" }).displayAspect).toBe("16x9");
    expect(parseScreenSizeParams({ s: " Jarak " }).solveFor).toBe("jarak");
  });

  it("treats an empty or zero closest viewer as the 1,5 × IH guideline", () => {
    expect(parseScreenSizeParams({ cv: "" }).closestViewerM).toBeNull();
    expect(parseScreenSizeParams({ cv: "0" }).closestViewerM).toBeNull();
    expect(parseScreenSizeParams({ cv: "0,0" }).closestViewerM).toBeNull();
    expect(parseScreenSizeParams({ cv: "-3" }).closestViewerM).toBeNull();
    expect(parseScreenSizeParams({ cv: "2.5" }).closestViewerM).toBe(2.5);
  });

  it("keeps a genuine contradiction alive for compute() to refuse", () => {
    const parsed = parseScreenSizeParams({ fv: "5", cv: "9" });
    expect(parsed.closestViewerM).toBe(9);
    expect(computeScreenSize(parsed).status).toBe("refused");
  });
});

describe("params — serialisation", () => {
  it("omits defaults, so an untouched room is the bare indexable path", () => {
    expect(serializeScreenSizeParams(SCREEN_SIZE_DEFAULTS).toString()).toBe("");
    expect(screenSizeHref(SCREEN_SIZE_DEFAULTS)).toBe("/learn/alat/ukuran-layar");
  });

  it("writes short param names in the frozen order", () => {
    const href = screenSizeHref(
      input({ model: "adm", farthestViewerM: 9, displayAspect: "16x10" }),
    );
    expect(href).toBe("/learn/alat/ukuran-layar?m=adm&fv=9&ar=16x10");
  });

  it("writes canonical dot decimals", () => {
    expect(
      serializeScreenSizeParams(input({ farthestViewerM: 7.5 })).get("fv"),
    ).toBe("7.5");
    expect(
      serializeScreenSizeParams(input({ ceilingHeightM: 3.25 })).get("ch"),
    ).toBe("3.25");
  });

  it("round-trips any input through the URL unchanged", () => {
    const cases: ScreenSizeInput[] = [
      SCREEN_SIZE_DEFAULTS,
      input({ solveFor: "jarak", plannedDiagonalIn: 98 }),
      input({ model: "adm", verticalResolution: 2160, farthestViewerM: 4.5 }),
      input({ contentAspect: "4x3", displayAspect: "16x10" }),
      input({ closestViewerM: 2.4, eyeHeightM: 1.2, ceilingHeightM: 3.2 }),
      input({ elementHeightPercent: 1 }),
    ];
    for (const original of cases) {
      const query = Object.fromEntries(serializeScreenSizeParams(original));
      expect(parseScreenSizeParams(query)).toEqual(original);
    }
  });

  it("detects this tool's params without letting campaign tags de-index the page", () => {
    expect(hasScreenSizeParams({})).toBe(false);
    expect(hasScreenSizeParams({ utm_source: "wa", fbclid: "x" })).toBe(false);
    expect(hasScreenSizeParams({ fv: "9" })).toBe(true);
    expect(hasScreenSizeParams({ fv: "" })).toBe(false);
    expect(hasScreenSizeParams(new URLSearchParams("?m=adm"))).toBe(true);
  });
});
