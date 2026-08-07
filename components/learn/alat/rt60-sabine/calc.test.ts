/**
 * Nilai emas kalkulator RT60.
 *
 * Ini satu-satunya tempat tes wajib di platform ini (03-UI §14.9): satu angka
 * yang salah meruntuhkan seluruh posisi "benar secara teknis". Seluruh asersi
 * memakai `toBeCloseTo` atau keluaran yang sudah dibulatkan, supaya tes menguji
 * aritmetikanya, bukan sisa bit floating point.
 *
 * Cakupan: nilai emas dari spesifikasi, pemilihan model Sabine/Eyring beserta
 * sifat inversnya, pita oktaf, serapan udara, baris uang (m² panel), setiap
 * temuan dan penolakan yang disebut §12.3, monotonisitas, dan penjepitan
 * parameter dari URL yang dikarang.
 */

import { describe, expect, it } from "vitest";
import {
  ALPHA_BAR_EXTREME,
  AIR_4M_4KHZ,
  AIR_ABSORPTION_VOLUME_THRESHOLD,
  BASS_TAIL_RATIO,
  CEILING_ALPHA,
  CEILING_MATERIALS,
  CRITICAL_DISTANCE_CONSTANT,
  DIRECTIVITY_Q,
  EYRING_THRESHOLD,
  FLOOR_ALPHA,
  FLOOR_MATERIALS,
  GLASS_ALPHA,
  OCTAVE_BANDS,
  PANEL_50MM_ALPHA,
  PANEL_NRC,
  PERSON_ABSORPTION,
  ROOM_TARGETS,
  RT60_DEFAULT_INPUT,
  RT60_LIMITS,
  SABINE_CONSTANT,
  WALL_ALPHA,
  WALL_MATERIALS,
  buildWorkedExamples,
  computeRt60,
  criticalDistanceOf,
  eyringRt60,
  nrcOf,
  requiredAbsorption,
  roomConstantOf,
  rt60From,
  sabineRt60,
  sanitiseRt60Input,
  schroederFrequency,
  selectModel,
  type BandValues,
  type Rt60FindingId,
  type Rt60Input,
} from "./calc";
import {
  BASE_ASSUMPTIONS,
  FLOOR_IDS,
  STI_REFUSAL,
  WALL_IDS,
} from "./copy.id";
import {
  RT60_PARAM,
  RT60_TOOL_PATH,
  hasRt60Params,
  isDefaultRt60Input,
  parseRt60Params,
  rt60Href,
  serialiseRt60Params,
} from "./params";
import { fmt } from "@/lib/learn/format";

const DEFAULT = computeRt60(RT60_DEFAULT_INPUT);

function findingIds(ids: readonly { id: Rt60FindingId }[]): string[] {
  return ids.map((finding) => finding.id);
}

function bandAt(result: ReturnType<typeof computeRt60>, band: number) {
  const found = result.bands.find((entry) => entry.band === band);
  if (!found) throw new Error(`pita ${band} tidak ada`);
  return found;
}

/* ================================================================== *
 * Konstanta dan koefisien
 * ================================================================== */

describe("konstanta", () => {
  it("memakai konstanta Sabine SI 0,161", () => {
    expect(SABINE_CONSTANT).toBe(0.161);
  });

  it("0,141 adalah 1/√(16π)", () => {
    expect(CRITICAL_DISTANCE_CONSTANT).toBeCloseTo(
      1 / Math.sqrt(16 * Math.PI),
      3,
    );
  });

  it("berpindah model tepat di ᾱ = 0,20", () => {
    expect(EYRING_THRESHOLD).toBe(0.2);
    expect(selectModel(0.19999)).toBe("sabine");
    expect(selectModel(0.2)).toBe("sabine");
    expect(selectModel(0.20001)).toBe("eyring");
  });

  it("menghitung enam pita oktaf yang diwajibkan §12.3", () => {
    expect([...OCTAVE_BANDS]).toEqual([125, 250, 500, 1000, 2000, 4000]);
    expect(DEFAULT.bands).toHaveLength(6);
  });

  it("NRC panel acuan sama dengan klaim 'NRC 0,85' di baris uang", () => {
    // Kalau α panel diubah tanpa mengubah klaimnya, tes ini yang jatuh.
    expect(nrcOf(PANEL_50MM_ALPHA)).toBeCloseTo(PANEL_NRC, 6);
  });

  it("setiap material punya enam α yang sah", () => {
    const tables: readonly BandValues[] = [
      ...Object.values(FLOOR_ALPHA),
      ...Object.values(WALL_ALPHA),
      ...Object.values(CEILING_ALPHA),
      GLASS_ALPHA,
      PANEL_50MM_ALPHA,
      PERSON_ABSORPTION,
    ];
    for (const table of tables) {
      expect(table).toHaveLength(6);
      for (const value of table) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("serapan bervariasi ~10× lintas frekuensi — alasan pita oktaf wajib", () => {
    const carpet = FLOOR_ALPHA["karpet-tebal"];
    expect(carpet[5] / carpet[0]).toBeGreaterThan(8);
  });

  it("setiap material punya label dan sumber terbitan", () => {
    for (const material of [
      ...FLOOR_MATERIALS,
      ...WALL_MATERIALS,
      ...CEILING_MATERIALS,
    ]) {
      expect(material.label.length).toBeGreaterThan(3);
      expect(material.source).toMatch(/publikasi|produsen/i);
    }
  });
});

/* ================================================================== *
 * Nilai emas — ruangan default Indonesia 8 × 6 × 3 m
 * ================================================================== */

describe("nilai emas — 8 × 6 × 3 m, keramik / bata / gypsum, 8 orang", () => {
  it("menurunkan geometri dengan benar", () => {
    expect(DEFAULT.geometry.volume).toBeCloseTo(144, 6);
    expect(DEFAULT.geometry.floorArea).toBeCloseTo(48, 6);
    expect(DEFAULT.geometry.wallGrossArea).toBeCloseTo(84, 6);
    expect(DEFAULT.geometry.windowArea).toBeCloseTo(12, 6);
    expect(DEFAULT.geometry.wallNetArea).toBeCloseTo(72, 6);
    expect(DEFAULT.geometry.totalSurface).toBeCloseTo(180, 6);
  });

  it("menghitung absorpsi per pita", () => {
    const expected: Record<number, number> = {
      125: 15.96,
      250: 13.4,
      500: 13.6,
      1000: 12.24,
      2000: 13.32,
      4000: 13.44,
    };
    for (const band of OCTAVE_BANDS) {
      expect(bandAt(DEFAULT, band).absorption).toBeCloseTo(
        expected[band] ?? Number.NaN,
        6,
      );
    }
  });

  it("menghitung RT60 per pita", () => {
    const expected: Record<number, number> = {
      125: 1.452632,
      250: 1.730149,
      500: 1.704706,
      1000: 1.894118,
      2000: 1.740541,
      4000: 1.725,
    };
    for (const band of OCTAVE_BANDS) {
      expect(bandAt(DEFAULT, band).rt60).toBeCloseTo(
        expected[band] ?? Number.NaN,
        5,
      );
    }
  });

  it("T_mid adalah rata-rata 500 Hz dan 1 kHz", () => {
    expect(DEFAULT.tMid).toBeCloseTo(
      (bandAt(DEFAULT, 500).rt60 + bandAt(DEFAULT, 1000).rt60) / 2,
      9,
    );
    expect(DEFAULT.tMid).toBeCloseTo(1.799412, 5);
  });

  it("mengembalikan RT60 ≈ 1,4–1,8 detik seperti yang diwajibkan §12.3", () => {
    // Jawaban jujur untuk konstruksi Indonesia yang sebenarnya: buruk.
    expect(DEFAULT.tMid).toBeGreaterThanOrEqual(1.4);
    expect(DEFAULT.tMid).toBeLessThanOrEqual(1.8);
    expect(fmt(DEFAULT.tMid)).toBe("1,8");
  });

  it("memakai Sabine karena ᾱ jauh di bawah 0,20", () => {
    expect(DEFAULT.midAlphaBar).toBeCloseTo(0.071778, 5);
    expect(DEFAULT.midModel).toBe("sabine");
    expect(DEFAULT.midModelMixed).toBe(false);
    for (const band of DEFAULT.bands) expect(band.model).toBe("sabine");
  });

  it("menghitung konstanta ruang dan jarak kritis", () => {
    expect(DEFAULT.roomConstant).toBeCloseTo(13.9191, 3);
    expect(DEFAULT.criticalDistance).toBeCloseTo(0.7439, 3);
    expect(DEFAULT.directivity).toBe(DIRECTIVITY_Q);
  });

  it("menghitung frekuensi Schroeder", () => {
    expect(DEFAULT.schroederFrequency).toBeCloseTo(223.57, 1);
    expect(findingIds(DEFAULT.findings)).toContain("di-bawah-schroeder");
  });

  it("menandai ruangan gagal target rapat", () => {
    expect(DEFAULT.treatment.targetRt60).toBe(0.6);
    expect(DEFAULT.treatment.meetsTarget).toBe(false);
    expect(DEFAULT.verdict.tone).toBe("bad");
    expect(DEFAULT.verdict.text).toContain("3,0×");
    expect(findingIds(DEFAULT.findings)).toContain("di-atas-target");
  });

  it("bersifat murni — dua panggilan memberi hasil identik", () => {
    expect(JSON.stringify(computeRt60(RT60_DEFAULT_INPUT))).toBe(
      JSON.stringify(computeRt60(RT60_DEFAULT_INPUT)),
    );
  });
});

/* ================================================================== *
 * Sabine vs Eyring — cabang yang menjadi sinyal kompetensi
 * ================================================================== */

describe("pemilihan model Sabine / Eyring", () => {
  it("mereproduksi contoh perhitungan §12.5 (V = 144, A = 14,3)", () => {
    expect(sabineRt60(144, 14.3)).toBeCloseTo(1.62, 2);
  });

  it("Eyring selalu lebih pendek daripada Sabine pada ᾱ yang sama", () => {
    for (const alphaBar of [0.25, 0.4, 0.6, 0.8]) {
      const surface = 864;
      const sabine = sabineRt60(1440, alphaBar * surface);
      const eyring = eyringRt60(1440, surface, alphaBar);
      expect(eyring).toBeLessThan(sabine);
    }
  });

  it("berpindah ke Eyring pada ruang yang sudah diberi perlakuan, dan menyebutkannya", () => {
    const treated = computeRt60({
      length: 20,
      width: 12,
      height: 6,
      floor: "karpet-tipis",
      wall: "bata",
      ceiling: "akustik",
      windowArea: 20,
      people: 150,
      room: "auditorium",
    });
    expect(treated.midModel).toBe("eyring");
    expect(treated.midAlphaBar).toBeGreaterThan(EYRING_THRESHOLD);
    expect(treated.tMid).toBeCloseTo(0.6602, 3);

    const finding = treated.findings.find((f) => f.id === "model-eyring");
    expect(finding).toBeDefined();
    // Sinyal kompetensi: menyebut model DAN selisihnya, bukan catatan kaki.
    expect(finding?.detail).toMatch(/Sabine/);
    expect(finding?.detail).toMatch(/Eyring/);
  });

  it("memilih model per pita, bukan satu model untuk semua", () => {
    const mixed = computeRt60({ ...RT60_DEFAULT_INPUT, wall: "gorden" });
    expect(bandAt(mixed, 125).model).toBe("sabine");
    expect(bandAt(mixed, 250).model).toBe("sabine");
    expect(bandAt(mixed, 500).model).toBe("eyring");
    expect(bandAt(mixed, 4000).model).toBe("eyring");
  });

  it("kebutuhan absorpsi adalah invers eksak dari perhitungan maju", () => {
    const volume = 144;
    const surface = 180;
    for (const alphaBar of [0.05, 0.19, 0.2, 0.21, 0.5, 0.8]) {
      const forward = rt60From(volume, surface, alphaBar * surface);
      const back = requiredAbsorption(volume, surface, forward.rt60);
      expect(back.absorption).toBeCloseTo(alphaBar * surface, 9);
      expect(back.model).toBe(forward.model);
    }
  });

  it("tidak pernah menghasilkan NaN saat ᾱ mendekati 1", () => {
    const packed = computeRt60({ ...RT60_DEFAULT_INPUT, people: 5000 });
    expect(Number.isFinite(packed.tMid)).toBe(true);
    expect(packed.tMid).toBeGreaterThan(0);
    expect(findingIds(packed.findings)).toContain("serapan-ekstrem");
    expect(packed.midAlphaBar).toBeGreaterThan(ALPHA_BAR_EXTREME);
  });
});

/* ================================================================== *
 * Pita oktaf dan ekor bass
 * ================================================================== */

describe("pita oktaf dan ekor bass", () => {
  it("menaikkan temuan ekor bass saat RT60(125) > 1,3 × T_mid", () => {
    const masjid = computeRt60({
      length: 20,
      width: 12,
      height: 6,
      floor: "keramik",
      wall: "bata",
      ceiling: "beton",
      windowArea: 24,
      people: 150,
      room: "masjid",
    });
    expect(masjid.bassRatio).toBeGreaterThan(BASS_TAIL_RATIO);
    const finding = masjid.findings.find((f) => f.id === "ekor-bass");
    expect(finding).toBeDefined();
    expect(finding?.title).toBe(
      "Ruangan ini punya ekor bass — karpet dan gorden tidak akan memperbaikinya.",
    );
  });

  it("tidak menaikkan ekor bass pada ruang berplafon gypsum dan berkaca lebar", () => {
    // Gypsum dan kaca justru penyerap frekuensi rendah yang baik — menaikkan
    // temuan di sini akan menjadi peringatan palsu.
    expect(DEFAULT.bassRatio).toBeLessThan(BASS_TAIL_RATIO);
    expect(findingIds(DEFAULT.findings)).not.toContain("ekor-bass");
  });
});

/* ================================================================== *
 * Serapan udara
 * ================================================================== */

describe("serapan udara 4·m·V", () => {
  it("diabaikan di bawah 1000 m³, pada setiap pita", () => {
    expect(DEFAULT.geometry.volume).toBeLessThan(
      AIR_ABSORPTION_VOLUME_THRESHOLD,
    );
    for (const band of DEFAULT.bands) expect(band.airAbsorption).toBe(0);
    expect(findingIds(DEFAULT.findings)).not.toContain("serapan-udara");
    expect(DEFAULT.assumptions.some((line) => /diabaikan/.test(line))).toBe(
      true,
    );
  });

  it("disertakan HANYA di 4 kHz saat V > 1000 m³", () => {
    const big = computeRt60({
      ...RT60_DEFAULT_INPUT,
      length: 20,
      width: 12,
      height: 6,
      people: 150,
      windowArea: 24,
    });
    expect(big.geometry.volume).toBe(1440);
    for (const band of big.bands) {
      if (band.band === 4000) {
        expect(band.airAbsorption).toBeCloseTo(AIR_4M_4KHZ * 1440, 6);
      } else {
        expect(band.airAbsorption).toBe(0);
      }
    }
    expect(findingIds(big.findings)).toContain("serapan-udara");
    expect(big.assumptions.some((line) => /4·m·V/.test(line))).toBe(true);
  });
});

/* ================================================================== *
 * Baris uang — diagnosis menjadi lingkup pekerjaan dalam m²
 * ================================================================== */

describe("baris uang: absorpsi tambahan → m² panel", () => {
  it("mengubah kekurangan absorpsi menjadi luas panel", () => {
    expect(DEFAULT.treatment.targetModel).toBe("eyring");
    expect(DEFAULT.treatment.targetAbsorption).toBeCloseTo(34.7741, 3);
    expect(DEFAULT.treatment.governingBand).toBe(1000);
    expect(DEFAULT.treatment.additionalAbsorption).toBeCloseTo(22.5341, 3);
    expect(DEFAULT.treatment.panelArea).toBeCloseTo(25.0937, 3);
    expect(DEFAULT.treatment.availableArea).toBe(120);
    expect(DEFAULT.treatment.feasible).toBe(true);
  });

  it("memakai selisih α, bukan α panel mentah", () => {
    const { additionalAbsorption, panelArea, panelAlpha, replacedAlpha } =
      DEFAULT.treatment;
    expect(replacedAlpha).toBeGreaterThan(0);
    expect(panelArea).toBeCloseTo(
      additionalAbsorption / (panelAlpha - replacedAlpha),
      6,
    );
    // Memakai α mentah akan meremehkan lingkup pekerjaan.
    expect(panelArea).toBeGreaterThan(additionalAbsorption / panelAlpha);
  });

  it("tidak meminta panel apa pun saat ruangan sudah di dalam target", () => {
    const good = computeRt60({
      ...RT60_DEFAULT_INPUT,
      wall: "panel-akustik",
      ceiling: "metal-perforasi",
      room: "studio",
    });
    expect(good.treatment.meetsTarget).toBe(true);
    expect(good.treatment.additionalAbsorption).toBe(0);
    expect(good.treatment.panelArea).toBe(0);
    expect(good.verdict.tone).toBe("good");
    expect(findingIds(good.findings)).toContain("sudah-memenuhi");
  });

  it("mengaku kalau target tidak tercapai dengan panel dinding dan plafon saja", () => {
    const hall = computeRt60({
      length: 40,
      width: 25,
      height: 12,
      floor: "keramik",
      wall: "beton",
      ceiling: "beton",
      windowArea: 0,
      people: 0,
      room: "studio",
    });
    expect(hall.treatment.coverageRatio).toBeGreaterThan(1);
    expect(hall.treatment.feasible).toBe(false);
    expect(findingIds(hall.findings)).toContain("panel-tidak-cukup");
  });

  it("mencetak baris uang di langkah perhitungan", () => {
    const step = DEFAULT.steps.find((entry) =>
      entry.formula.startsWith("S_panel"),
    );
    expect(step).toBeDefined();
    expect(step?.result).toBe("25,1 m²");
  });
});

/* ================================================================== *
 * Jarak kritis — menyerap microphone planner yang dibatalkan
 * ================================================================== */

describe("jarak kritis Dc", () => {
  it("Dc = 0,141 × √(Q × R)", () => {
    const R = roomConstantOf(180, 0.071778);
    expect(R).toBeCloseTo(13.9191, 3);
    expect(criticalDistanceOf(R, 2)).toBeCloseTo(
      0.141 * Math.sqrt(2 * R),
      9,
    );
  });

  it("memendek saat ruangan makin bergema", () => {
    const live = computeRt60({ ...RT60_DEFAULT_INPUT, wall: "beton" });
    const dead = computeRt60({ ...RT60_DEFAULT_INPUT, wall: "panel-akustik" });
    expect(dead.criticalDistance).toBeGreaterThan(live.criticalDistance);
  });

  it("frekuensi Schroeder naik saat ruangan mengecil", () => {
    expect(schroederFrequency(1.8, 144)).toBeGreaterThan(
      schroederFrequency(1.8, 1440),
    );
  });
});

/* ================================================================== *
 * Penolakan STI — mekanisme lead-gen, bukan pesan galat
 * ================================================================== */

describe("penolakan STI (§12.3)", () => {
  it("tidak pernah mengeluarkan angka STI", () => {
    const serialised = JSON.stringify(DEFAULT);
    expect(serialised).not.toMatch(/"sti"\s*:\s*[\d.]/);
    expect(serialised).not.toMatch(/%ALcons/);
    expect(Object.keys(DEFAULT.stipa)).toEqual(["likelihood"]);
  });

  it("mengembalikan kecenderungan, bukan nilai", () => {
    expect(DEFAULT.stipa.likelihood).toBe("gagal");
    expect(
      computeRt60({ ...RT60_DEFAULT_INPUT, wall: "gorden" }).stipa.likelihood,
    ).toBe("lolos");
    expect(
      computeRt60({ ...RT60_DEFAULT_INPUT, people: 30 }).stipa.likelihood,
    ).toBe("batas");
  });

  it("menyimpan blok penolakan verbatim beserta skala IEC", () => {
    expect(STI_REFUSAL.headline).toBe(
      "Kejelasan suara (STI) tidak bisa dihitung dari dimensi ruang saja.",
    );
    expect(STI_REFUSAL.why).toContain("IEC 60268-16");
    expect(STI_REFUSAL.requirement).toBe(
      "Sistem tata suara darurat (IEC 60849 / EN 54-16) wajib ≥ 0,50.",
    );
    expect(STI_REFUSAL.bridge.gagal).toContain("kemungkinan besar");
    expect(STI_REFUSAL.cta).toBe("Jadwalkan pengukuran STIPA →");
    expect(STI_REFUSAL.scale.map((entry) => entry.label)).toEqual([
      "Buruk",
      "Kurang",
      "Cukup",
      "Baik",
      "Sangat Baik",
    ]);
  });
});

/* ================================================================== *
 * Asumsi dan langkah perhitungan
 * ================================================================== */

describe("show-the-math dan asumsi", () => {
  it("mencetak angka yang sudah disubstitusi, bukan hanya rumus", () => {
    const volumeStep = DEFAULT.steps[0];
    expect(volumeStep?.formula).toBe("V = P × L × T");
    expect(volumeStep?.substitution).toBe("8,0 × 6,0 × 3,0");
    expect(volumeStep?.result).toBe("144 m³");
  });

  it("menyatakan model yang dipakai dan alasannya", () => {
    const modelStep = DEFAULT.steps.find((step) => step.formula === "ᾱ = A / S");
    expect(modelStep?.result).toBe("0,0756");
    expect(modelStep?.note).toContain("Sabine berlaku");
  });

  it("memakai koma desimal dan maksimum tiga angka penting", () => {
    for (const step of DEFAULT.steps) {
      expect(step.result).not.toMatch(/\d\.\d/);
      expect(step.substitution.length).toBeGreaterThan(0);
    }
  });

  it("menyebut minimal dua hal yang TIDAK dimodelkan", () => {
    expect(BASE_ASSUMPTIONS.length).toBeGreaterThanOrEqual(2);
    const text = DEFAULT.assumptions.join(" ");
    expect(text).toMatch(/tidak dimodelkan/);
    expect(text).toMatch(/kebisingan latar/i);
    expect(text).toMatch(/nilai publikasi|publikasi produsen/i);
  });

  it("menyebut standar beserta versinya", () => {
    expect(DEFAULT.standards).toContain("ISO 3382-1");
    expect(DEFAULT.standards).toContain("IEC 60268-16");
    expect(DEFAULT.verifiedAt).toMatch(/^\d{4}-\d{2}$/);
  });
});

/* ================================================================== *
 * Invarian
 * ================================================================== */

describe("invarian", () => {
  it("menambah serapan tidak pernah menaikkan RT60", () => {
    const ladder: readonly (typeof WALL_IDS)[number][] = [
      "beton",
      "bata",
      "gypsum",
      "kayu-lapis",
      "gorden",
      "panel-akustik",
    ];
    let previous = Number.POSITIVE_INFINITY;
    for (const wall of ladder) {
      const current = computeRt60({ ...RT60_DEFAULT_INPUT, wall }).tMid;
      expect(current).toBeLessThan(previous);
      previous = current;
    }
  });

  it("menambah orang tidak pernah menaikkan RT60", () => {
    let previous = Number.POSITIVE_INFINITY;
    for (const people of [0, 4, 8, 20, 50]) {
      const current = computeRt60({ ...RT60_DEFAULT_INPUT, people }).tMid;
      expect(current).toBeLessThan(previous);
      previous = current;
    }
  });

  it("membesarkan ruangan tanpa mengubah material menaikkan RT60", () => {
    const small = computeRt60({ ...RT60_DEFAULT_INPUT, people: 0 }).tMid;
    const big = computeRt60({
      ...RT60_DEFAULT_INPUT,
      length: 16,
      width: 12,
      height: 6,
      people: 0,
    }).tMid;
    expect(big).toBeGreaterThan(small);
  });

  it("selalu mengembalikan angka terhingga untuk masukan yang bermusuhan", () => {
    const hostile: Rt60Input[] = [
      { ...RT60_DEFAULT_INPUT, length: 0, width: 0, height: 0 },
      { ...RT60_DEFAULT_INPUT, people: 5000, windowArea: 5000 },
      { ...RT60_DEFAULT_INPUT, length: 120, width: 120, height: 30 },
      { ...RT60_DEFAULT_INPUT, length: 1.5, width: 1.5, height: 2, people: 0 },
    ];
    for (const input of hostile) {
      const result = computeRt60(input);
      expect(Number.isFinite(result.tMid)).toBe(true);
      expect(Number.isFinite(result.roomConstant)).toBe(true);
      expect(Number.isFinite(result.criticalDistance)).toBe(true);
      expect(Number.isFinite(result.schroederFrequency)).toBe(true);
      for (const band of result.bands) {
        expect(Number.isFinite(band.rt60)).toBe(true);
        expect(band.rt60).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

/* ================================================================== *
 * Temuan tepi
 * ================================================================== */

describe("temuan tepi", () => {
  it("memotong luas kaca yang melebihi luas dinding dan mengatakannya", () => {
    const result = computeRt60({ ...RT60_DEFAULT_INPUT, windowArea: 999 });
    expect(result.geometry.windowArea).toBe(84);
    expect(result.geometry.wallNetArea).toBe(0);
    expect(findingIds(result.findings)).toContain("jendela-terlalu-luas");
  });

  it("memperingatkan ruang memanjang yang melanggar asumsi medan difus", () => {
    const corridor = computeRt60({
      ...RT60_DEFAULT_INPUT,
      length: 30,
      width: 3,
      height: 3,
    });
    expect(corridor.geometry.aspectRatio).toBeCloseTo(10, 6);
    expect(findingIds(corridor.findings)).toContain("medan-tidak-difus");
  });

  it("memperingatkan plafon yang lebih tinggi daripada sisi terpendek", () => {
    const tall = computeRt60({ ...RT60_DEFAULT_INPUT, height: 8 });
    expect(findingIds(tall.findings)).toContain("medan-tidak-difus");
  });

  it("memperingatkan kepadatan orang di luar rentang wajar", () => {
    const packed = computeRt60({ ...RT60_DEFAULT_INPUT, people: 400 });
    expect(findingIds(packed.findings)).toContain("kepadatan-tinggi");
  });

  it("menyebut kondisi ruang kosong sebagai kondisi terburuk", () => {
    const empty = computeRt60({ ...RT60_DEFAULT_INPUT, people: 0 });
    expect(empty.tMid).toBeGreaterThan(DEFAULT.tMid);
    expect(findingIds(empty.findings)).toContain("tanpa-orang");
  });

  it("setiap temuan punya judul dan penjelasan yang tidak kosong", () => {
    for (const finding of DEFAULT.findings) {
      expect(finding.title.length).toBeGreaterThan(3);
      expect(finding.detail.length).toBeGreaterThan(20);
    }
  });
});

/* ================================================================== *
 * Target per jenis ruangan
 * ================================================================== */

describe("target RT60 per jenis ruangan", () => {
  it("setiap jenis ruangan punya target di dalam rentangnya", () => {
    for (const [id, target] of Object.entries(ROOM_TARGETS)) {
      expect(target.target).toBeGreaterThanOrEqual(target.range[0]);
      expect(target.target).toBeLessThanOrEqual(target.range[1]);
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it("mengganti jenis ruangan mengubah target, bukan RT60 hitungan", () => {
    const rapat = computeRt60({ ...RT60_DEFAULT_INPUT, room: "rapat" });
    const masjid = computeRt60({ ...RT60_DEFAULT_INPUT, room: "masjid" });
    expect(masjid.tMid).toBeCloseTo(rapat.tMid, 9);
    expect(masjid.treatment.targetRt60).toBe(1.2);
    expect(masjid.treatment.additionalAbsorption).toBeLessThan(
      rapat.treatment.additionalAbsorption,
    );
  });
});

/* ================================================================== *
 * Contoh terhitung
 * ================================================================== */

describe("tiga ruangan Indonesia yang dihitung penuh", () => {
  const examples = buildWorkedExamples();

  it("menghitung ketiganya dengan mesin yang sama", () => {
    expect(examples).toHaveLength(3);
    for (const example of examples) {
      expect(example.title.length).toBeGreaterThan(5);
      expect(example.description.length).toBeGreaterThan(20);
      expect(Number.isFinite(example.result.tMid)).toBe(true);
    }
  });

  it("ruang rapat kecil dan ruang kelas gagal target masing-masing", () => {
    const meeting = examples.find((entry) => entry.id === "rapat-kecil");
    const classroom = examples.find((entry) => entry.id === "kelas-sma");
    expect(meeting?.result.tMid).toBeCloseTo(1.3815, 3);
    expect(classroom?.result.tMid).toBeCloseTo(1.37, 3);
    expect(meeting?.result.treatment.meetsTarget).toBe(false);
    expect(classroom?.result.treatment.meetsTarget).toBe(false);
  });

  it("masjid memunculkan ekor bass dan serapan udara sekaligus", () => {
    const mosque = examples.find((entry) => entry.id === "masjid-jamaah");
    expect(mosque?.result.tMid).toBeCloseTo(2.506, 2);
    expect(mosque?.result.geometry.volume).toBe(1440);
    const ids = mosque ? findingIds(mosque.result.findings) : [];
    expect(ids).toContain("ekor-bass");
    expect(ids).toContain("serapan-udara");
    expect(mosque?.result.treatment.panelArea).toBeCloseTo(94.28, 1);
  });
});

/* ================================================================== *
 * Kodek parameter URL — jepit-ke-default
 * ================================================================== */

describe("parameter URL", () => {
  it("memakai nama parameter yang dibekukan §12.1", () => {
    expect(RT60_PARAM.length).toBe("p");
    expect(RT60_PARAM.width).toBe("l");
    expect(RT60_PARAM.height).toBe("t");
    expect(RT60_PARAM.floor).toBe("lt");
    expect(RT60_PARAM.wall).toBe("dd");
    expect(RT60_PARAM.ceiling).toBe("pf");
    expect(RT60_PARAM.people).toBe("n");
  });

  it("membaca URL contoh dari spesifikasi", () => {
    const parsed = parseRt60Params(
      new URLSearchParams("p=8&l=6&t=3&lt=keramik&dd=bata&pf=gypsum&n=8"),
    );
    expect(parsed).toEqual(RT60_DEFAULT_INPUT);
  });

  it("tanpa parameter menghasilkan default Indonesia", () => {
    expect(parseRt60Params()).toEqual(RT60_DEFAULT_INPUT);
    expect(parseRt60Params(new URLSearchParams())).toEqual(RT60_DEFAULT_INPUT);
  });

  it("mengembalikan sampah ke default, bukan melempar", () => {
    const junk = parseRt60Params(
      new URLSearchParams(
        "p=NaN&l=bukan-angka&t=Infinity&lt=<script>&dd=1&pf=&n=1e999&jd=abc&rg=💥",
      ),
    );
    expect(junk).toEqual(RT60_DEFAULT_INPUT);
    expect(() =>
      parseRt60Params(new URLSearchParams("p=" + "9".repeat(400))),
    ).not.toThrow();
  });

  it("mengembalikan nilai negatif ke default", () => {
    const negative = parseRt60Params(
      new URLSearchParams("p=-5&l=-1&t=-2&n=-9&jd=-3"),
    );
    expect(negative).toEqual(RT60_DEFAULT_INPUT);
  });

  it("menjepit besaran di luar rentang ke batasnya", () => {
    const big = parseRt60Params(
      new URLSearchParams("p=9999&l=400&t=99&n=99999&jd=1000000"),
    );
    expect(big.length).toBe(RT60_LIMITS.length.max);
    expect(big.width).toBe(RT60_LIMITS.width.max);
    expect(big.height).toBe(RT60_LIMITS.height.max);
    expect(big.people).toBe(RT60_LIMITS.people.max);
    expect(big.windowArea).toBe(RT60_LIMITS.windowArea.max);

    const small = parseRt60Params(new URLSearchParams("p=0.4&l=0.1&t=0.5"));
    expect(small.length).toBe(RT60_LIMITS.length.min);
    expect(small.width).toBe(RT60_LIMITS.width.min);
    expect(small.height).toBe(RT60_LIMITS.height.min);
  });

  it("menerima dua register desimal", () => {
    expect(parseRt60Params(new URLSearchParams("p=12.5&t=2.8")).length).toBe(
      12.5,
    );
    expect(parseRt60Params(new URLSearchParams("p=12,5&t=2,8")).height).toBe(
      2.8,
    );
  });

  it("mengambil nilai pertama saat satu parameter diulang", () => {
    expect(parseRt60Params({ p: ["9", "3"] }).length).toBe(9);
  });

  it("menolak nilai enum yang tidak dikenal", () => {
    const parsed = parseRt60Params(
      new URLSearchParams("lt=marmer&dd=kaca&pf=jerami&rg=gudang"),
    );
    expect(parsed.floor).toBe(RT60_DEFAULT_INPUT.floor);
    expect(parsed.wall).toBe(RT60_DEFAULT_INPUT.wall);
    expect(parsed.ceiling).toBe(RT60_DEFAULT_INPUT.ceiling);
    expect(parsed.room).toBe(RT60_DEFAULT_INPUT.room);
    expect(FLOOR_IDS).toContain(parsed.floor);
  });

  it("menerima setiap id material yang diterbitkan", () => {
    for (const floor of FLOOR_IDS) {
      expect(parseRt60Params(new URLSearchParams(`lt=${floor}`)).floor).toBe(
        floor,
      );
    }
    for (const wall of WALL_IDS) {
      expect(parseRt60Params(new URLSearchParams(`dd=${wall}`)).wall).toBe(
        wall,
      );
    }
  });

  it("keadaan default menghasilkan lintasan telanjang yang indexable", () => {
    expect(serialiseRt60Params(RT60_DEFAULT_INPUT)).toBe("");
    expect(rt60Href(RT60_DEFAULT_INPUT)).toBe(RT60_TOOL_PATH);
    expect(isDefaultRt60Input(RT60_DEFAULT_INPUT)).toBe(true);
    expect(hasRt60Params(new URLSearchParams("utm_source=wa"))).toBe(false);
    expect(hasRt60Params(new URLSearchParams("p=9"))).toBe(true);
    expect(hasRt60Params()).toBe(false);
  });

  it("menulis titik desimal pada tautan kanonik", () => {
    const custom: Rt60Input = {
      ...RT60_DEFAULT_INPUT,
      length: 12.5,
      people: 0,
      room: "masjid",
    };
    const href = rt60Href(custom);
    expect(href).toBe("/learn/alat/rt60-sabine?p=12.5&n=0&rg=masjid");
    expect(href).not.toContain("%2C");
  });

  it("serialise → parse adalah putaran penuh", () => {
    const custom: Rt60Input = {
      length: 12.5,
      width: 7.5,
      height: 4,
      floor: "karpet-tebal",
      wall: "gorden",
      ceiling: "akustik",
      windowArea: 3,
      people: 24,
      room: "auditorium",
    };
    expect(
      parseRt60Params(new URLSearchParams(serialiseRt60Params(custom))),
    ).toEqual(custom);
  });

  it("sanitiseRt60Input menerima bentuk longgar tanpa melempar", () => {
    expect(sanitiseRt60Input()).toEqual(RT60_DEFAULT_INPUT);
    expect(sanitiseRt60Input({ floor: "tidak-ada" }).floor).toBe(
      RT60_DEFAULT_INPUT.floor,
    );
    expect(sanitiseRt60Input({ people: 8.6 }).people).toBe(9);
  });
});
