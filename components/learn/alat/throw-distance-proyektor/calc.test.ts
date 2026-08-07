/**
 * Golden values for the throw + brightness engine.
 *
 * A wrong number here is the one defect that collapses the correctness
 * positioning of the whole /learn platform (03-UI §12.0), so this file asserts
 * three separate things: the arithmetic against hand-checked values, the
 * refusals the spec requires the tool to make, and the URL codec's promise that
 * no crafted query string can produce NaN, Infinity or a thrown error.
 *
 * Every float assertion is on a rounded value or a `toBeCloseTo`, and every
 * string assertion is on output that has already been through
 * `lib/learn/format`, so the suite is not brittle against IEEE-754 noise.
 */

import { describe, expect, it } from "vitest";
import {
  AMPLE_HEADROOM_RATIO,
  CD_M2_PER_FL,
  classifyBrightness,
  classifyThrow,
  compute,
  DEFAULT_INPUT,
  deriveScreen,
  footLamberts,
  FL_RECOMMENDED_ID,
  FL_TARGETS,
  FT2_PER_M2,
  LAMP_DERATE,
  LED_LUMEN_THRESHOLD,
  MARGINAL_RATIO,
  requiredLumens,
  requiredLumensForWidth,
  sanitizeInput,
  widthFromDiagonalInch,
  type ThrowFindingId,
  type ThrowInput,
} from "./calc";
import { EXAMPLES } from "./copy.id";
import {
  buildToolHref,
  hasParams,
  isDefaultInput,
  parseParams,
  serializeParams,
  TOOL_PATH,
  type RawSearchParams,
} from "./params";

/** Indexed access under `noUncheckedIndexedAccess` — fail loudly, never `!`. */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`expected an item at index ${index}, found none`);
  }
  return item;
}

const ids = (input: Partial<ThrowInput> | undefined): ThrowFindingId[] =>
  compute(input).findings.map((finding) => finding.id);

const withDefaults = (patch: Partial<ThrowInput>): ThrowInput => ({
  ...DEFAULT_INPUT,
  ...patch,
});

/* ------------------------------------------------------------------ */

describe("constants", () => {
  it("holds the values 03-UI §12.4 fixes, and they match their derivations", () => {
    expect(FT2_PER_M2).toBe(10.7639);
    // Exact identity: 1 / 0.3048² = 10.763910…
    expect(FT2_PER_M2).toBeCloseTo(1 / (0.3048 * 0.3048), 3);

    expect(CD_M2_PER_FL).toBe(3.426);
    // Exact identity: (1/π) cd/ft² × 10.7639 ft²/m² = 3.4263 cd/m²
    expect(CD_M2_PER_FL).toBeCloseTo((1 / Math.PI) * FT2_PER_M2, 3);

    expect(LAMP_DERATE).toBe(0.75);
    expect(LED_LUMEN_THRESHOLD).toBe(8000);
    expect(FL_TARGETS).toEqual({ gelap: 12, terkontrol: 22, tinggi: 40 });
    expect(FL_RECOMMENDED_ID).toBe(40);
  });

  it("uses the Indonesian default preset from the spec URL", () => {
    // ?tr=1.5&w=3.6&lm=4000&g=1.0
    expect(DEFAULT_INPUT.throwRatio).toBe(1.5);
    expect(DEFAULT_INPUT.screenWidthM).toBe(3.6);
    expect(DEFAULT_INPUT.lumens).toBe(4000);
    expect(DEFAULT_INPUT.gain).toBe(1);
    // 22 fL minimum is the Indonesian default; 40 fL is the recommendation.
    expect(FL_TARGETS[DEFAULT_INPUT.ambient]).toBe(22);
  });
});

describe("foot-lambert formula", () => {
  it("has NO π in it — fL = lumens ÷ ft² × gain", () => {
    const areaFt2 = 78.468831; // 3,6 × 2,025 m
    const fl = footLamberts(3000, areaFt2, 1);

    expect(fl).toBeCloseTo(38.2317, 3);
    // The two ways a π would sneak in, both of which ship in published tools:
    expect(fl).not.toBeCloseTo(38.2317 / Math.PI, 2);
    expect(fl).not.toBeCloseTo(38.2317 * Math.PI, 2);
  });

  it("is exactly the identity, for any sample", () => {
    for (const [lumens, area, gain] of [
      [4000, 78.468831, 1],
      [1200, 34.876, 0.8],
      [9500, 217.969, 1.8],
    ] as const) {
      expect(footLamberts(lumens, area, gain)).toBe((lumens / area) * gain);
    }
  });

  it("scales linearly with gain and inversely with area", () => {
    const base = footLamberts(4000, 100, 1);
    expect(footLamberts(4000, 100, 2)).toBeCloseTo(base * 2, 9);
    expect(footLamberts(4000, 200, 1)).toBeCloseTo(base / 2, 9);
  });

  it("never divides by a zero area", () => {
    expect(footLamberts(4000, 0, 1)).toBe(0);
    expect(Number.isFinite(footLamberts(4000, Number.NaN, 1))).toBe(true);
  });

  it("inverts: requiredLumens puts the target back on the screen", () => {
    const areaFt2 = 122.6075484375; // 4,5 m 16:9
    const rated = requiredLumens(40, areaFt2, 1);
    expect(footLamberts(rated * LAMP_DERATE, areaFt2, 1)).toBeCloseTo(40, 9);
  });
});

describe("screen geometry", () => {
  it("derives the default 3,6 m 16:9 screen", () => {
    const screen = deriveScreen(3.6, "16x9");
    expect(screen.heightM).toBeCloseTo(2.025, 6);
    expect(screen.areaM2).toBeCloseTo(7.29, 6);
    expect(screen.areaFt2).toBeCloseTo(78.468831, 6);
    expect(screen.diagonalM).toBeCloseTo(4.13045, 4);
    expect(screen.diagonalInch).toBeCloseTo(162.616, 3);
  });

  it("handles every aspect ratio", () => {
    expect(deriveScreen(3.2, "16x10").heightM).toBeCloseTo(2, 9);
    expect(deriveScreen(4, "4x3").heightM).toBeCloseTo(3, 9);
    expect(deriveScreen(4.2, "21x9").heightM).toBeCloseTo(1.8, 9);
  });

  it("falls back rather than producing a zero-area screen", () => {
    expect(deriveScreen(0, "16x9").widthM).toBe(DEFAULT_INPUT.screenWidthM);
    expect(deriveScreen(Number.NaN, "16x9").widthM).toBe(DEFAULT_INPUT.screenWidthM);
    expect(deriveScreen(-4, "16x9").widthM).toBe(DEFAULT_INPUT.screenWidthM);
  });

  it("round-trips the ukuran-layar handoff through the diagonal", () => {
    expect(widthFromDiagonalInch(162.616, "16x9")).toBeCloseTo(3.6, 4);
    expect(widthFromDiagonalInch(150, "16x9")).toBeCloseTo(3.3207, 4);
    expect(widthFromDiagonalInch(0, "16x9")).toBe(DEFAULT_INPUT.screenWidthM);
    expect(deriveScreen(widthFromDiagonalInch(98, "16x9"), "16x9").diagonalInch)
      .toBeCloseTo(98, 6);
  });
});

/* ------------------------------------------------------------------ */

describe("default preset — the golden case", () => {
  const result = compute(DEFAULT_INPUT);

  it("solves the geometry", () => {
    expect(result.model.id).toBe("jarak");
    expect(result.throwDistanceM).toBeCloseTo(5.4, 9); // D = 1,5 × 3,6
    expect(result.screen.widthM).toBe(3.6);
    expect(result.screen.heightM).toBeCloseTo(2.025, 6);
    expect(result.screen.areaFt2).toBeCloseTo(78.4688, 4);
    expect(result.throwClass).toBe("standar");
  });

  it("solves the brightness", () => {
    expect(result.brightness.lumensEffective).toBe(3000); // 4000 × 0,75
    expect(result.brightness.flRated).toBeCloseTo(50.9757, 4);
    expect(result.brightness.flEffective).toBeCloseTo(38.2317, 4);
    expect(result.brightness.nits).toBeCloseTo(130.982, 3);
    expect(result.brightness.targetFL).toBe(22);
    expect(result.brightness.targetRatio).toBeCloseTo(1.7378, 4);
    expect(result.brightness.verdict).toBe("aman");
    expect(result.brightness.lumensRequired).toBeCloseTo(2301.75, 2);
    expect(result.brightness.lumensRequiredRecommended).toBeCloseTo(4185.0, 1);
    expect(result.brightness.lumensShortfall).toBe(0);
    expect(result.ledRecommended).toBe(false);
  });

  it("prints eleven substituted steps in the documented order", () => {
    expect(result.steps.map((step) => step.label)).toEqual([
      "Tinggi layar",
      "Jarak lempar",
      "Diagonal layar",
      "Luas layar",
      "Konversi luas ke kaki persegi",
      "Cadangan lampu",
      "Kecerahan di layar",
      "Setara luminansi",
      "Target kecerahan",
      "Lumen yang dibutuhkan",
      "Penilaian",
    ]);

    expect(at(result.steps, 1)).toMatchObject({
      formula: "D = TR × W",
      substitution: "1,5 × 3,6",
      result: "5,4 m",
    });
    expect(at(result.steps, 5)).toMatchObject({
      substitution: "4.000 × 0,75",
      result: "3.000 lm",
    });
    expect(at(result.steps, 6)).toMatchObject({
      formula: "fL = lm_efektif ÷ A_ft² × gain",
      substitution: "3.000 ÷ 78,5 × 1",
      result: "38,2 fL",
    });
    expect(at(result.steps, 6).note).toContain("Tidak ada π");
    expect(at(result.steps, 9).result).toBe("2.302 lm");
    expect(at(result.steps, 10)).toMatchObject({
      substitution: "38,2 ÷ 22",
      result: "1,74×",
    });
  });

  it("uses Indonesian number formatting everywhere in the math panel", () => {
    const printed = result.steps
      .flatMap((step) => [step.substitution, step.result])
      .join(" ");
    // A dot may only ever be a thousands separator, so it is always followed by
    // exactly three digits. Anything else is an English decimal point leaking out.
    expect(printed).not.toMatch(/\.\d{1,2}(?!\d)/);
    expect(printed).not.toMatch(/\.\d{4,}/);
    expect(printed).not.toMatch(/NaN|Infinity|—/);
    expect(printed).toContain("3.000"); // thousands dot
    expect(printed).toContain("38,2"); // decimal comma
  });

  it("states the assumptions, including what it refuses to model", () => {
    expect(result.assumptions.length).toBeGreaterThanOrEqual(2);
    expect(result.assumptions.join(" ")).toContain("Offset lensa");
    expect(result.assumptions.join(" ")).toContain("0,75");
    expect(result.assumptions.join(" ")).toContain("5,4 m"); // room-depth caveat
  });

  it("flags that 38,2 fL still misses the 40 fL Indonesian recommendation", () => {
    expect(result.findings.map((f) => f.id)).toContain("belum-rekomendasi-id");
    expect(result.summary).toContain("38,2 fL");
    expect(result.summary).toContain("22 fL");
  });
});

/* ------------------------------------------------------------------ */

describe("model selection — the two solve directions", () => {
  it("mode 'jarak' solves D = TR × W and says so", () => {
    const result = compute(withDefaults({ mode: "jarak", throwRatio: 1.8, screenWidthM: 4.5 }));
    expect(result.model.id).toBe("jarak");
    expect(result.throwDistanceM).toBeCloseTo(8.1, 9);
    expect(result.model.reason).toContain("lebar layar diketahui");
    expect(at(result.steps, 0).label).toBe("Tinggi layar");
    expect(at(result.steps, 1).formula).toBe("D = TR × W");
  });

  it("mode 'lebar' solves W = D ÷ TR and leads with that step", () => {
    const result = compute(
      withDefaults({ mode: "lebar", throwDistanceM: 6, throwRatio: 1.2, ambient: "tinggi" }),
    );
    expect(result.model.id).toBe("lebar");
    expect(result.screen.widthM).toBeCloseTo(5, 9);
    expect(result.throwDistanceM).toBe(6);
    expect(at(result.steps, 0)).toMatchObject({
      label: "Lebar layar maksimum",
      formula: "W = D ÷ TR",
      substitution: "6 ÷ 1,2",
      result: "5 m",
    });
    expect(result.model.reason).toContain("jarak lensa ke layar diketahui");
  });

  it("the two directions are inverses of each other", () => {
    const forward = compute(withDefaults({ mode: "jarak", throwRatio: 1.4, screenWidthM: 4.2 }));
    const back = compute(
      withDefaults({
        mode: "lebar",
        throwRatio: 1.4,
        throwDistanceM: forward.throwDistanceM,
      }),
    );
    expect(back.screen.widthM).toBeCloseTo(4.2, 9);
  });

  it("ignores the unused geometry input in each mode", () => {
    const a = compute(withDefaults({ mode: "jarak", throwDistanceM: 42 }));
    const b = compute(withDefaults({ mode: "jarak", throwDistanceM: 3 }));
    expect(a.throwDistanceM).toBe(b.throwDistanceM);

    const c = compute(withDefaults({ mode: "lebar", throwDistanceM: 6, screenWidthM: 19 }));
    const d = compute(withDefaults({ mode: "lebar", throwDistanceM: 6, screenWidthM: 1 }));
    expect(c.screen.widthM).toBe(d.screen.widthM);
  });
});

/* ------------------------------------------------------------------ */

describe("lamp derate", () => {
  it("applies 0,75 to the datasheet number, always", () => {
    const result = compute(DEFAULT_INPUT);
    expect(result.brightness.lumensEffective).toBe(4000 * LAMP_DERATE);
    expect(result.brightness.flEffective).toBeCloseTo(
      result.brightness.flRated * LAMP_DERATE,
      9,
    );
  });

  it("sizes the requirement upward, so the system is still right in year three", () => {
    const result = compute(DEFAULT_INPUT);
    const withoutMargin =
      (result.brightness.targetFL * result.screen.areaFt2) / result.input.gain;
    expect(result.brightness.lumensRequired).toBeCloseTo(
      withoutMargin / LAMP_DERATE,
      6,
    );
    expect(result.brightness.lumensRequired).toBeGreaterThan(withoutMargin);
  });

  it("says so in the math panel and in the assumptions", () => {
    const result = compute(DEFAULT_INPUT);
    expect(at(result.steps, 5).note).toContain("25–50%");
    expect(result.assumptions.join(" ")).toContain("Cadangan lampu 0,75");
  });
});

describe("cd/m² conversion", () => {
  it("is fL × 3,426", () => {
    const result = compute(DEFAULT_INPUT);
    expect(result.brightness.nits).toBe(result.brightness.flEffective * CD_M2_PER_FL);
    expect(compute(withDefaults({ lumens: 1000 })).brightness.nits).toBeCloseTo(
      32.745,
      3,
    );
  });

  it("matches the published reference row values", () => {
    expect(12 * CD_M2_PER_FL).toBeCloseTo(41.1, 1);
    expect(22 * CD_M2_PER_FL).toBeCloseTo(75.4, 1);
    expect(40 * CD_M2_PER_FL).toBeCloseTo(137, 0);
  });
});

/* ------------------------------------------------------------------ */

describe("brightness verdict bands", () => {
  it("classifies on flEffective ÷ target", () => {
    expect(classifyBrightness(22, 22)).toBe("aman");
    expect(classifyBrightness(22.1, 22)).toBe("aman");
    expect(classifyBrightness(22 * MARGINAL_RATIO, 22)).toBe("marginal");
    expect(classifyBrightness(21.9, 22)).toBe("marginal");
    expect(classifyBrightness(22 * MARGINAL_RATIO - 0.01, 22)).toBe("kurang");
    expect(classifyBrightness(0, 22)).toBe("kurang");
  });

  it("returns 'kurang' with a shortfall for an under-specified projector", () => {
    const result = compute(withDefaults({ lumens: 1000 }));
    expect(result.brightness.flEffective).toBeCloseTo(9.5579, 4);
    expect(result.brightness.verdict).toBe("kurang");
    expect(result.brightness.lumensShortfall).toBeCloseTo(1301.75, 2);
    expect(ids(withDefaults({ lumens: 1000 }))).toContain("kurang-terang");
    expect(result.summary).toContain("hanya menghasilkan");
  });

  it("returns 'marginal' just under target, where a demo still looks fine", () => {
    const input = withDefaults({ lumens: 1100, ambient: "gelap" });
    const result = compute(input);
    expect(result.brightness.targetFL).toBe(12);
    expect(result.brightness.flEffective).toBeCloseTo(10.5137, 4);
    expect(result.brightness.targetRatio).toBeCloseTo(0.8761, 4);
    expect(result.brightness.verdict).toBe("marginal");
    expect(ids(input)).toContain("nyaris-target");
  });

  it("flags ample headroom instead of pretending more is always better", () => {
    const input = withDefaults({ screenWidthM: 2.4, lumens: 3500 });
    expect(compute(input).brightness.targetRatio).toBeGreaterThan(AMPLE_HEADROOM_RATIO);
    expect(ids(input)).toContain("cadangan-besar");
  });
});

/* ------------------------------------------------------------------ */

describe("throw-ratio classification and warnings", () => {
  it("uses the documented class boundaries", () => {
    expect(classifyThrow(0.25)).toBe("ust");
    expect(classifyThrow(0.399)).toBe("ust");
    expect(classifyThrow(0.4)).toBe("pendek"); // boundary is exclusive
    expect(classifyThrow(0.99)).toBe("pendek");
    expect(classifyThrow(1)).toBe("standar");
    expect(classifyThrow(2)).toBe("standar");
    expect(classifyThrow(2.01)).toBe("panjang");
  });

  it("raises geometry + keystone warnings below TR 0,4", () => {
    const input = withDefaults({ throwRatio: 0.25 });
    const result = compute(input);
    expect(result.throwClass).toBe("ust");
    expect(result.throwDistanceM).toBeCloseTo(0.9, 9);

    const finding = result.findings.find((item) => item.id === "ust-geometri");
    expect(finding?.severity).toBe("peringatan");
    expect(finding?.detail).toContain("keystone");
    expect(finding?.detail).toContain("rata");
    expect(ids(input)).not.toContain("throw-pendek");
  });

  it("notes short throw without alarming, and long throw with a room caveat", () => {
    expect(ids(withDefaults({ throwRatio: 0.6 }))).toContain("throw-pendek");
    expect(ids(withDefaults({ throwRatio: 0.6 }))).not.toContain("ust-geometri");

    // 1,8 × 4,5 m = 8,1 m, past the plausible ceiling-mount depth.
    expect(ids(withDefaults({ throwRatio: 1.8, screenWidthM: 4.5 }))).toContain(
      "throw-panjang",
    );
    expect(ids(DEFAULT_INPUT)).not.toContain("throw-panjang");
  });
});

describe("screen gain", () => {
  it("warns that high gain is not free lumens", () => {
    const input = withDefaults({ gain: 1.8 });
    const result = compute(input);
    expect(result.brightness.flEffective).toBeCloseTo(68.8171, 4);
    const finding = result.findings.find((item) => item.id === "gain-tinggi");
    expect(finding?.severity).toBe("peringatan");
    expect(finding?.detail).toContain("hotspot");
    expect(result.assumptions.join(" ")).toContain("Layar gain tinggi dan ALR");
  });

  it("explains low gain, which is what a painted wall really is", () => {
    expect(ids(withDefaults({ gain: 0.8 }))).toContain("gain-rendah");
    expect(ids(DEFAULT_INPUT)).not.toContain("gain-rendah");
    expect(ids(DEFAULT_INPUT)).not.toContain("gain-tinggi");
  });
});

/* ------------------------------------------------------------------ */

describe("refusals the spec requires", () => {
  it("always states that offset and lens shift are not modelled", () => {
    for (const input of [
      DEFAULT_INPUT,
      withDefaults({ throwRatio: 0.25 }),
      withDefaults({ lumens: 500 }),
      withDefaults({ mode: "lebar", throwDistanceM: 12 }),
    ]) {
      const finding = compute(input).findings.find(
        (item) => item.id === "offset-lensa",
      );
      expect(finding).toBeDefined();
      expect(finding?.detail).toContain("lens shift");
    }
  });

  it("routes to direct-view LED once the requirement passes 8.000 lumens", () => {
    // 6,0 m screen, ambient tinggi → 11.625 lm required.
    const input = withDefaults({ screenWidthM: 6, throwRatio: 1.2, lumens: 8000, ambient: "tinggi" });
    const result = compute(input);
    expect(result.brightness.lumensRequired).toBeCloseTo(11625.01, 2);
    expect(result.brightness.lumensRequired).toBeGreaterThan(LED_LUMEN_THRESHOLD);
    expect(result.ledRecommended).toBe(true);

    const finding = result.findings.find((item) => item.id === "led-direct-view");
    expect(finding?.severity).toBe("kritis");
    expect(finding?.detail).toContain("LED direct-view");
    expect(finding?.detail).toContain("kehilangan penjualan proyektor");
  });

  it("puts the LED threshold exactly at 8.000 required lumens", () => {
    const under = withDefaults({ screenWidthM: 4.97, ambient: "tinggi" });
    const over = withDefaults({ screenWidthM: 4.98, ambient: "tinggi" });
    expect(compute(under).brightness.lumensRequired).toBeLessThan(LED_LUMEN_THRESHOLD);
    expect(compute(under).ledRecommended).toBe(false);
    expect(compute(over).brightness.lumensRequired).toBeGreaterThan(LED_LUMEN_THRESHOLD);
    expect(compute(over).ledRecommended).toBe(true);
  });

  it("does not route a blackout room to LED just because the screen is large", () => {
    const result = compute(withDefaults({ screenWidthM: 6, ambient: "gelap" }));
    expect(result.brightness.lumensRequired).toBeCloseTo(3487.5, 1);
    expect(result.ledRecommended).toBe(false);
  });

  it("orders findings kritis → peringatan → info", () => {
    const rank = { kritis: 0, peringatan: 1, info: 2 } as const;
    const result = compute(
      withDefaults({ throwRatio: 0.25, gain: 1.8, lumens: 300, screenWidthM: 6, ambient: "tinggi" }),
    );
    const ranks = result.findings.map((finding) => rank[finding.severity]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(result.findings.length).toBeGreaterThan(2);
  });
});

/* ------------------------------------------------------------------ */

describe("worked examples (the always-present, no-JS section)", () => {
  it("ships three fully computable Indonesian rooms", () => {
    expect(EXAMPLES).toHaveLength(3);
    for (const example of EXAMPLES) {
      const result = compute(example.input);
      expect(Number.isFinite(result.brightness.flEffective)).toBe(true);
      expect(result.steps.length).toBe(11);
    }
  });

  it("1 · ruang rapat 2,4 m, tirai tertutup — passes with headroom", () => {
    const result = compute(at(EXAMPLES, 0).input);
    expect(result.throwDistanceM).toBeCloseTo(3.6, 6);
    expect(result.screen.areaFt2).toBeCloseTo(34.875, 3);
    expect(result.brightness.flEffective).toBeCloseTo(75.2687, 4);
    expect(result.brightness.verdict).toBe("aman");
    expect(result.ledRecommended).toBe(false);
    expect(result.findings.map((f) => f.id)).toContain("cadangan-besar");
  });

  it("2 · aula sekolah 4,5 m, jendela besar — marginal at 6.000 lm", () => {
    const result = compute(at(EXAMPLES, 1).input);
    expect(result.throwDistanceM).toBeCloseTo(8.1, 6);
    expect(result.brightness.targetFL).toBe(40);
    expect(result.brightness.flEffective).toBeCloseTo(36.7025, 4);
    expect(result.brightness.targetRatio).toBeCloseTo(0.9176, 4);
    expect(result.brightness.verdict).toBe("marginal");
    expect(result.brightness.lumensRequired).toBeCloseTo(6539.07, 2);
    expect(result.ledRecommended).toBe(false);
    expect(result.findings.map((f) => f.id)).toContain("throw-panjang");
  });

  it("3 · rumah ibadah 6,0 m, siang hari — refuse, and route to LED", () => {
    const result = compute(at(EXAMPLES, 2).input);
    expect(result.screen.areaFt2).toBeCloseTo(217.969, 3);
    expect(result.brightness.flEffective).toBeCloseTo(27.5269, 4);
    expect(result.brightness.verdict).toBe("kurang");
    expect(result.brightness.lumensRequired).toBeCloseTo(11625.01, 2);
    expect(result.ledRecommended).toBe(true);
    expect(at(result.findings, 0).severity).toBe("kritis");
  });
});

describe("reference matrix helper", () => {
  it("returns the published lumen requirements for 16:9 screens at gain 1,0", () => {
    const rounded = (width: number, target: number) =>
      Math.round(requiredLumensForWidth(width, "16x9", 1, target));

    expect(rounded(2.4, 12)).toBe(558);
    expect(rounded(2.4, 22)).toBe(1023);
    expect(rounded(2.4, 40)).toBe(1860);
    expect(rounded(3.6, 22)).toBe(2302);
    expect(rounded(3.6, 40)).toBe(4185);
    expect(rounded(4.5, 40)).toBe(6539);
    expect(rounded(6, 40)).toBe(11625);
  });

  it("is quadratic in screen width — doubling the width quadruples the lumens", () => {
    expect(requiredLumensForWidth(6, "16x9", 1, 22)).toBeCloseTo(
      requiredLumensForWidth(3, "16x9", 1, 22) * 4,
      6,
    );
  });
});

/* ------------------------------------------------------------------ */

describe("sanitizeInput", () => {
  it("clamps out-of-range numbers to the physical bound", () => {
    const input = sanitizeInput({
      throwRatio: -5,
      screenWidthM: 900,
      lumens: 1e9,
      gain: 0,
    });
    expect(input.throwRatio).toBe(0.2);
    expect(input.screenWidthM).toBe(20);
    expect(input.lumens).toBe(50000);
    expect(input.gain).toBe(0.4);
  });

  it("falls back to the preset for non-finite and wrong-typed values", () => {
    const input = sanitizeInput({
      throwRatio: Number.NaN,
      screenWidthM: Number.POSITIVE_INFINITY,
      lumens: Number.NEGATIVE_INFINITY,
    });
    expect(input.throwRatio).toBe(DEFAULT_INPUT.throwRatio);
    expect(input.screenWidthM).toBe(DEFAULT_INPUT.screenWidthM);
    expect(input.lumens).toBe(DEFAULT_INPUT.lumens);
  });

  it("rejects unknown enum members", () => {
    const input = sanitizeInput({
      mode: "bogus" as never,
      aspect: "5x4" as never,
      ambient: "terang" as never,
    });
    expect(input.mode).toBe("jarak");
    expect(input.aspect).toBe("16x9");
    expect(input.ambient).toBe("terkontrol");
  });

  it("lets compute() run on nothing at all", () => {
    expect(compute(undefined).brightness.flEffective).toBeCloseTo(38.2317, 4);
    expect(compute({}).screen.widthM).toBe(3.6);
  });
});

/* ------------------------------------------------------------------ */

describe("params — clamp to default, never throw", () => {
  it("reads the canonical spec URL", () => {
    const { input, fromUrl } = parseParams({
      tr: "1.5",
      w: "3.6",
      lm: "4000",
      g: "1.0",
    });
    expect(input).toEqual(DEFAULT_INPUT);
    expect(fromUrl).toBe(true);
  });

  it("accepts both decimal registers", () => {
    expect(parseParams({ w: "4,8" }).input.screenWidthM).toBe(4.8);
    expect(parseParams({ w: "4.8" }).input.screenWidthM).toBe(4.8);
    expect(parseParams({ lm: "6.500,5" }).input.lumens).toBeCloseTo(6500.5, 6);
  });

  it("clamps or defaults every kind of garbage", () => {
    const { input } = parseParams({
      m: "nope",
      tr: "abc",
      w: "-5",
      lm: "1e9",
      g: "0",
      ar: "21:9",
      amb: "BOGUS",
    });
    expect(input.mode).toBe("jarak");
    expect(input.throwRatio).toBe(1.5); // unparseable → default
    expect(input.screenWidthM).toBe(0.5); // negative → min
    expect(input.lumens).toBe(50000); // absurd → max
    expect(input.gain).toBe(0.4); // zero → min
    expect(input.aspect).toBe("21x9"); // "21:9" normalised
    expect(input.ambient).toBe("terkontrol"); // unknown enum → default
  });

  it("survives arrays, empty strings, whitespace and missing keys", () => {
    expect(parseParams({ w: ["", "4.2"] }).input.screenWidthM).toBe(4.2);
    expect(parseParams({ w: "" }).input.screenWidthM).toBe(3.6);
    expect(parseParams({ w: "   " }).input.screenWidthM).toBe(3.6);
    expect(parseParams({ w: undefined }).input.screenWidthM).toBe(3.6);
    expect(parseParams({}).input).toEqual(DEFAULT_INPUT);
    expect(parseParams(undefined).input).toEqual(DEFAULT_INPUT);
    expect(parseParams(null).input).toEqual(DEFAULT_INPUT);
  });

  it("never produces a non-finite number, whatever the URL says", () => {
    const attacks: RawSearchParams[] = [
      { tr: "0", w: "0", lm: "0", g: "0" },
      { tr: "Infinity", w: "-Infinity", lm: "NaN", g: "null" },
      { tr: "1e308", w: "1e308", d: "1e308", lm: "1e308", g: "1e308" },
      { tr: "0.0000001", w: "0.0000001", d: "0.0000001" },
      { m: "lebar", d: "0", tr: "0" },
      { m: "lebar", d: "1e9", tr: "0.0001" },
      { w: "3.6e", lm: "4_000", g: "1,0,0" },
      { ar: "<script>", amb: "'; drop table", m: "🙂" },
      { din: "abc", src: "evil" },
    ];

    for (const attack of attacks) {
      const { input } = parseParams(attack);
      const result = compute(input);
      const numbers = [
        result.throwDistanceM,
        result.screen.widthM,
        result.screen.heightM,
        result.screen.areaFt2,
        result.brightness.flEffective,
        result.brightness.nits,
        result.brightness.lumensRequired,
        result.brightness.targetRatio,
      ];
      for (const value of numbers) {
        expect(Number.isFinite(value)).toBe(true);
      }
      const printed = result.steps
        .flatMap((step) => [step.substitution, step.result])
        .join(" ");
      expect(printed).not.toMatch(/NaN|Infinity|—/);
    }
  });

  it("normalises aspect-ratio spellings", () => {
    for (const spelling of ["16:9", "16/9", "16X9", "16x9", "16×9"]) {
      expect(parseParams({ ar: spelling }).input.aspect).toBe("16x9");
    }
    expect(parseParams({ ar: "4:3" }).input.aspect).toBe("4x3");
  });

  it("tolerates the foot-lambert target as an ambient value", () => {
    expect(parseParams({ amb: "40" }).input.ambient).toBe("tinggi");
    expect(parseParams({ amb: "12" }).input.ambient).toBe("gelap");
    expect(parseParams({ amb: "99" }).input.ambient).toBe("terkontrol");
  });
});

describe("params — the ukuran-layar handoff", () => {
  it("accepts a screen width carried in the URL", () => {
    const parsed = parseParams({ w: "4.8", src: "ukuran-layar" });
    expect(parsed.input.screenWidthM).toBe(4.8);
    expect(parsed.handoff).toEqual({ source: "ukuran-layar", via: "w" });
  });

  it("accepts a diagonal in inches and converts it with the aspect ratio", () => {
    const parsed = parseParams({ din: "150", ar: "16x9", src: "ukuran-layar" });
    expect(parsed.input.screenWidthM).toBeCloseTo(3.3207, 4);
    expect(parsed.handoff).toEqual({ source: "ukuran-layar", via: "din" });
  });

  it("prefers an explicit width over the diagonal", () => {
    const parsed = parseParams({ w: "4.0", din: "150", src: "ukuran-layar" });
    expect(parsed.input.screenWidthM).toBe(4);
    expect(parsed.handoff?.via).toBe("w");
  });

  it("ignores an unknown source, and reports no handoff without a size", () => {
    expect(parseParams({ w: "4.8", src: "spam" }).handoff).toBeNull();
    expect(parseParams({ src: "ukuran-layar" }).handoff).toBeNull();
    expect(parseParams({ din: "junk", src: "ukuran-layar" }).handoff).toBeNull();
  });
});

describe("params — serialisation and the canonical bare path", () => {
  it("emits nothing for the default preset", () => {
    expect(serializeParams(DEFAULT_INPUT)).toBe("");
    expect(buildToolHref(DEFAULT_INPUT)).toBe(TOOL_PATH);
    expect(isDefaultInput(DEFAULT_INPUT)).toBe(true);
  });

  it("emits only what differs, in a stable order", () => {
    expect(
      serializeParams(
        withDefaults({ throwRatio: 1.8, screenWidthM: 4.5, lumens: 6000, ambient: "tinggi" }),
      ),
    ).toBe("tr=1.8&w=4.5&lm=6000&amb=tinggi");
  });

  it("never emits the derived geometry param of the active mode", () => {
    expect(serializeParams(withDefaults({ mode: "lebar", throwDistanceM: 6, throwRatio: 1.2 })))
      .toBe("m=lebar&tr=1.2&d=6");
    // In "jarak" mode the distance is derived, so it is not part of the state.
    expect(serializeParams(withDefaults({ throwDistanceM: 12 }))).toBe("");
  });

  it("writes canonical dot decimals that parse back identically", () => {
    for (const input of [
      DEFAULT_INPUT,
      withDefaults({ screenWidthM: 4.25, gain: 0.8, ambient: "tinggi" }),
      withDefaults({ mode: "lebar", throwDistanceM: 7.35, throwRatio: 2.4, aspect: "4x3" }),
      withDefaults({ lumens: 12500, aspect: "16x10", ambient: "gelap" }),
    ]) {
      const query = serializeParams(input);
      const raw: RawSearchParams = Object.fromEntries(
        new URLSearchParams(query).entries(),
      );
      const back = parseParams(raw).input;
      // The inactive geometry param is not serialised, so compare what is.
      expect(back.mode).toBe(input.mode);
      expect(back.throwRatio).toBe(input.throwRatio);
      expect(back.aspect).toBe(input.aspect);
      expect(back.lumens).toBe(input.lumens);
      expect(back.gain).toBe(input.gain);
      expect(back.ambient).toBe(input.ambient);
      if (input.mode === "lebar") {
        expect(back.throwDistanceM).toBe(input.throwDistanceM);
      } else {
        expect(back.screenWidthM).toBe(input.screenWidthM);
      }
      expect(compute(back).brightness.flEffective).toBeCloseTo(
        compute(input).brightness.flEffective,
        9,
      );
    }
  });

  it("detects whether a URL carried any recognised param", () => {
    expect(hasParams({})).toBe(false);
    expect(hasParams(undefined)).toBe(false);
    expect(hasParams({ w: "" })).toBe(false);
    expect(hasParams({ utm_source: "wa" })).toBe(false);
    expect(hasParams({ w: "3.6" })).toBe(true);
    expect(hasParams({ src: "ukuran-layar" })).toBe(true);
  });
});

/* ------------------------------------------------------------------ */

describe("purity", () => {
  it("is deterministic — same input, byte-identical output", () => {
    const a = JSON.stringify(compute(DEFAULT_INPUT));
    const b = JSON.stringify(compute(DEFAULT_INPUT));
    expect(a).toBe(b);
  });

  it("does not mutate its argument", () => {
    const input = withDefaults({ screenWidthM: 4.2 });
    const snapshot = JSON.stringify(input);
    compute(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("returns a clamped copy of the input it actually used", () => {
    const result = compute({ ...DEFAULT_INPUT, gain: 99 });
    expect(result.input.gain).toBe(2.5);
    expect(result.brightness.flEffective).toBeCloseTo(
      footLamberts(3000, result.screen.areaFt2, 2.5),
      9,
    );
  });
});
