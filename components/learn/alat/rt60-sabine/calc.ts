/**
 * Mesin perhitungan waktu dengung (RT60) — Sabine / Eyring, enam pita oktaf.
 *
 * MURNI. Tanpa impor React, tanpa I/O, tanpa `Date`, tanpa `Math.random`.
 * Berjalan identik saat build (SSG), di server (?params), di browser (live edit)
 * dan di suite tes (03-UI §12.1). Satu angka yang salah meruntuhkan seluruh
 * posisi "benar secara teknis" yang menjadi dasar platform ini, jadi setiap
 * konstanta di bawah diberi nama dan sumbernya.
 *
 *   V   = P × L × T                                                   [m³]
 *   A   = Σ(Sᵢ × αᵢ) + (N_orang × A_orang) + 4·m·V                    [m² sabin]
 *   ᾱ   = A / S_total
 *   Sabine  (ᾱ ≤ 0,20)   RT60 = 0,161 · V / A
 *   Eyring  (ᾱ > 0,20)   RT60 = 0,161 · V / ( −S_total · ln(1 − ᾱ) )
 *   R   = S_total · ᾱ / (1 − ᾱ)                                       [m²]
 *   Dc  = 0,141 · √(Q · R)              0,141 = 1/√(16π)              [m]
 *
 * Fungsi `computeRt60()` bersifat TOTAL: tidak pernah melempar, tidak pernah
 * mengembalikan NaN, dan setiap masukan di luar batas dijepit ke nilai default
 * (03-UI §12.1 — kalkulator tidak boleh 500 karena URL yang dikarang bot).
 */

import type { StipaLikelihood } from "@/lib/learn/cta";
import { clampNum, fmt, fmtFixed, fmtInt } from "@/lib/learn/format";
import {
  AIR_LABEL,
  AIR_SOURCE,
  ASSUMPTION_AIR_IGNORED,
  ASSUMPTION_AIR_INCLUDED,
  BAND_LABEL,
  BASE_ASSUMPTIONS,
  CEILING_IDS,
  CEILING_LABEL,
  CEILING_SOURCE,
  EXAMPLE_COPY,
  EXAMPLE_IDS,
  FINDING_COPY,
  FLOOR_IDS,
  FLOOR_LABEL,
  FLOOR_SOURCE,
  GLASS_LABEL,
  GLASS_SOURCE,
  PERSON_LABEL,
  PERSON_SOURCE,
  ROOM_TYPE_IDS,
  ROOM_TYPE_LABEL,
  RT60_COPY,
  STANDARDS,
  STANDARDS_CHIP,
  STEP_LABEL,
  STEP_NOTE,
  VERIFIED_AT,
  WALL_IDS,
  WALL_LABEL,
  WALL_SOURCE,
  type CeilingId,
  type ExampleId,
  type FloorId,
  type RoomTypeId,
  type WallId,
} from "./copy.id";

export type { CeilingId, ExampleId, FloorId, RoomTypeId, WallId };
export {
  CEILING_IDS,
  EXAMPLE_IDS,
  FLOOR_IDS,
  ROOM_TYPE_IDS,
  STANDARDS,
  WALL_IDS,
};

/* ------------------------------------------------------------------ *
 * 1. Konstanta — setiap angka diberi asal-usulnya
 * ------------------------------------------------------------------ */

export const RT60_TOOL_SLUG = "rt60-sabine";

/**
 * Konstanta Sabine, satuan SI. Turunan: 24·ln(10)/c dengan c = 343 m/s pada
 * 20 °C → 55,26/343 = 0,1611. Nilai 0,161 adalah bentuk yang dipakai ISO 3382
 * dan seluruh literatur akustik arsitektur. Persamaannya sendiri bukan objek
 * hak cipta — yang tidak boleh direproduksi adalah tabel di dalam standar
 * berbayar (03-UI §12.8 Aturan 2).
 */
export const SABINE_CONSTANT = 0.161;

/** Ambang perpindahan Sabine → Eyring (03-UI §12.3). */
export const EYRING_THRESHOLD = 0.2;

/**
 * ᾱ maksimum yang boleh masuk ln(1 − ᾱ). Serapan total bisa melampaui luas
 * permukaan pada ruang yang padat orang; tanpa jepitan ini logaritmanya
 * menghasilkan NaN dan halaman ikut mati.
 */
const ALPHA_BAR_CEILING = 0.99;

/** Di atas nilai ini kedua model statistik sudah tidak bisa dipercaya. */
export const ALPHA_BAR_EXTREME = 0.35;

/** RT60(125 Hz) > 1,3 × T_mid ⇒ temuan "ekor bass" (03-UI §12.3). */
export const BASS_TAIL_RATIO = 1.3;

/**
 * Direktivitas sumber untuk jarak kritis. Q = 2 adalah nilai yang lazim
 * diterbitkan untuk suara manusia yang berbicara ke arah pendengar pada pita
 * bicara (setengah bola di depan pembicara). Bukan parameter masukan: memberi
 * pengguna kotak isian Q hanya memindahkan tebakan, tidak menghilangkannya.
 */
export const DIRECTIVITY_Q = 2;

/** 0,141 = 1/√(16π) = 1/7,0898 (03-UI §12.3). */
export const CRITICAL_DISTANCE_CONSTANT = 0.141;

/**
 * Serapan udara 4·m·V hanya disertakan pada V > 1000 m³ dan hanya di pita
 * 4 kHz (03-UI §12.3). Di bawah ambang itu kontribusinya lebih kecil daripada
 * ketidakpastian koefisien α itu sendiri, jadi menyertakannya hanya menambah
 * presisi palsu.
 */
export const AIR_ABSORPTION_VOLUME_THRESHOLD = 1000;

/**
 * Nilai 4m pada 4 kHz, 20 °C, kelembapan relatif 60 % — kondisi ruang ber-AC
 * di Indonesia. ISO 9613-1:1993; m ≈ 0,00725 m⁻¹, jadi 4m ≈ 0,029 m⁻¹.
 */
export const AIR_4M_4KHZ = 0.029;

/** Kepadatan orang di atas nilai ini membuat model serapan per-orang meleset. */
export const PEOPLE_DENSITY_LIMIT = 4;

/** Perbandingan sisi di atas nilai ini melanggar asumsi medan difus. */
export const ASPECT_RATIO_LIMIT = 3;

/** Ambang T_mid untuk peluang lolos STI ≥ 0,50 (indikasi kasar, bukan STI). */
export const STI_FAIL_RT60 = 1.2;
export const STI_MARGINAL_RT60 = 0.8;

/** Produk acuan baris uang: panel wol mineral 50 mm, NRC 0,85. */
export const PANEL_NRC = 0.85;

/** Selisih α minimum agar menempel panel masih berarti secara fisik. */
const PANEL_MIN_NET_ALPHA = 0.02;

export const RT60_VERIFIED_AT = VERIFIED_AT;
export const RT60_STANDARDS_CHIP = STANDARDS_CHIP;

/* ------------------------------------------------------------------ *
 * 2. Pita oktaf
 * ------------------------------------------------------------------ */

export const OCTAVE_BANDS = [125, 250, 500, 1000, 2000, 4000] as const;
export type OctaveBand = (typeof OCTAVE_BANDS)[number];

/** Enam nilai α, satu per pita, berurutan seperti `OCTAVE_BANDS`. */
export type BandValues = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
];

const INDEX_125 = 0;
const INDEX_500 = 2;
const INDEX_1K = 3;
const INDEX_4K = 5;

function bandAlpha(values: BandValues, index: number): number {
  return values[index] ?? 0;
}

/* ------------------------------------------------------------------ *
 * 3. Koefisien serapan — NILAI PUBLIKASI, bukan pengukuran di lokasi
 *
 * Sumber: tabel koefisien serapan pada buku teks akustik arsitektur
 * (Egan, "Architectural Acoustics"; Beranek & Vér, "Noise and Vibration
 * Control Engineering") dan lembar data produsen untuk produk setara.
 * Urutan: 125 / 250 / 500 / 1k / 2k / 4k Hz.
 * ------------------------------------------------------------------ */

export const FLOOR_ALPHA: Record<FloorId, BandValues> = {
  keramik: [0.01, 0.01, 0.02, 0.02, 0.02, 0.03],
  vinyl: [0.02, 0.03, 0.03, 0.03, 0.03, 0.02],
  kayu: [0.15, 0.11, 0.1, 0.07, 0.06, 0.07],
  "karpet-tipis": [0.02, 0.04, 0.08, 0.2, 0.35, 0.4],
  "karpet-tebal": [0.08, 0.24, 0.57, 0.69, 0.71, 0.73],
};

export const WALL_ALPHA: Record<WallId, BandValues> = {
  bata: [0.02, 0.02, 0.03, 0.04, 0.05, 0.05],
  beton: [0.01, 0.01, 0.02, 0.02, 0.02, 0.03],
  gypsum: [0.15, 0.1, 0.06, 0.04, 0.04, 0.05],
  "kayu-lapis": [0.42, 0.21, 0.1, 0.08, 0.06, 0.06],
  gorden: [0.07, 0.31, 0.49, 0.75, 0.7, 0.6],
  "panel-akustik": [0.22, 0.62, 0.9, 0.95, 0.92, 0.88],
};

export const CEILING_ALPHA: Record<CeilingId, BandValues> = {
  gypsum: [0.15, 0.11, 0.1, 0.07, 0.09, 0.09],
  beton: [0.01, 0.01, 0.02, 0.02, 0.02, 0.03],
  kalsiboard: [0.1, 0.08, 0.06, 0.05, 0.05, 0.06],
  akustik: [0.34, 0.55, 0.68, 0.78, 0.83, 0.85],
  "metal-perforasi": [0.4, 0.7, 0.85, 0.85, 0.8, 0.72],
};

/** Kaca jendela biasa 5–6 mm. Tidak dijadikan parameter: satu jenis sudah
 *  mewakili ~semua bangunan komersial Indonesia. */
export const GLASS_ALPHA: BandValues = [0.35, 0.25, 0.18, 0.12, 0.07, 0.04];

/** m² sabin per orang dewasa duduk, sudah termasuk kursi kayu/plastiknya. */
export const PERSON_ABSORPTION: BandValues = [
  0.33, 0.4, 0.44, 0.45, 0.45, 0.45,
];

/** Panel wol mineral 50 mm, 48 kg/m³, menempel permukaan. NRC hitungan 0,85. */
export const PANEL_50MM_ALPHA: BandValues = [
  0.22, 0.62, 0.9, 0.95, 0.92, 0.88,
];

/**
 * NRC = rata-rata α pada 250, 500, 1000, 2000 Hz, dibulatkan ke kelipatan 0,05
 * (ASTM C423). Dihitung, tidak ditulis tangan, supaya tabel referensi tidak
 * bisa menyimpang dari koefisien yang benar-benar dipakai mesin.
 */
export function nrcOf(values: BandValues): number {
  const mean =
    (bandAlpha(values, 1) +
      bandAlpha(values, 2) +
      bandAlpha(values, 3) +
      bandAlpha(values, 4)) /
    4;
  return Math.round(mean / 0.05) * 0.05;
}

/* ------------------------------------------------------------------ *
 * 4. Katalog material (α + label + sumber, satu baris satu material)
 * ------------------------------------------------------------------ */

export type MaterialKind = "lantai" | "dinding" | "plafon";

export type Rt60Material = {
  id: string;
  kind: MaterialKind;
  label: string;
  alpha: BandValues;
  nrc: number;
  source: string;
};

export const FLOOR_MATERIALS: readonly Rt60Material[] = FLOOR_IDS.map((id) => ({
  id,
  kind: "lantai" as const,
  label: FLOOR_LABEL[id],
  alpha: FLOOR_ALPHA[id],
  nrc: nrcOf(FLOOR_ALPHA[id]),
  source: FLOOR_SOURCE[id],
}));

export const WALL_MATERIALS: readonly Rt60Material[] = WALL_IDS.map((id) => ({
  id,
  kind: "dinding" as const,
  label: WALL_LABEL[id],
  alpha: WALL_ALPHA[id],
  nrc: nrcOf(WALL_ALPHA[id]),
  source: WALL_SOURCE[id],
}));

export const CEILING_MATERIALS: readonly Rt60Material[] = CEILING_IDS.map(
  (id) => ({
    id,
    kind: "plafon" as const,
    label: CEILING_LABEL[id],
    alpha: CEILING_ALPHA[id],
    nrc: nrcOf(CEILING_ALPHA[id]),
    source: CEILING_SOURCE[id],
  }),
);

export const GLASS_MATERIAL: Rt60Material = {
  id: "kaca",
  kind: "dinding",
  label: GLASS_LABEL,
  alpha: GLASS_ALPHA,
  nrc: nrcOf(GLASS_ALPHA),
  source: GLASS_SOURCE,
};

/** Untuk `<SelectField options>` di Panel dan di halaman rute. */
export function toSelectOptions(
  materials: readonly Rt60Material[],
): readonly { value: string; label: string }[] {
  return materials.map((material) => ({
    value: material.id,
    label: material.label,
  }));
}

/* ------------------------------------------------------------------ *
 * 5. Target RT60 per jenis ruangan
 *
 * Sasaran desain untuk kondisi TERISI, mengacu pada ISO 3382-1:2009 dan
 * DIN 18041:2016 sebagai sumber sasaran. Tabel standarnya sendiri tidak
 * direproduksi (03-UI §12.8 Aturan 2).
 * ------------------------------------------------------------------ */

export type RoomTarget = {
  /** Nilai desain tunggal yang dipakai baris uang. */
  target: number;
  /** Rentang yang masih dianggap wajar [min, maks]. */
  range: readonly [number, number];
};

export const ROOM_TARGETS: Record<RoomTypeId, RoomTarget> = {
  rapat: { target: 0.6, range: [0.4, 0.6] },
  kelas: { target: 0.6, range: [0.5, 0.8] },
  kantor: { target: 0.5, range: [0.4, 0.6] },
  auditorium: { target: 0.9, range: [0.8, 1.1] },
  masjid: { target: 1.2, range: [1.0, 1.4] },
  gereja: { target: 1.6, range: [1.4, 2.0] },
  musik: { target: 1.4, range: [1.2, 1.8] },
  studio: { target: 0.3, range: [0.2, 0.4] },
};

/* ------------------------------------------------------------------ *
 * 6. Masukan, batas, dan default Indonesia
 * ------------------------------------------------------------------ */

export type Rt60Input = {
  /** Panjang ruangan, m. Param URL `p`. */
  length: number;
  /** Lebar ruangan, m. Param URL `l`. */
  width: number;
  /** Tinggi plafon, m. Param URL `t`. */
  height: number;
  /** Material lantai. Param URL `lt`. */
  floor: FloorId;
  /** Material dinding. Param URL `dd`. */
  wall: WallId;
  /** Material plafon. Param URL `pf`. */
  ceiling: CeilingId;
  /** Luas kaca pada dinding, m². Param URL `jd`. */
  windowArea: number;
  /** Jumlah orang duduk. Param URL `n`. */
  people: number;
  /** Jenis ruangan, menentukan target. Param URL `rg`. */
  room: RoomTypeId;
};

/** Bentuk longgar yang boleh datang dari URL, tes, atau pemanggil lain. */
export type Rt60InputLike = {
  length?: number;
  width?: number;
  height?: number;
  floor?: string;
  wall?: string;
  ceiling?: string;
  windowArea?: number;
  people?: number;
  room?: string;
};

export type NumericLimit = {
  min: number;
  max: number;
  default: number;
  /** Angka desimal saat nilai dicetak ke kolom isian. */
  decimals: number;
};

export const RT60_LIMITS: Record<
  "length" | "width" | "height" | "windowArea" | "people",
  NumericLimit
> = {
  length: { min: 1.5, max: 120, default: 8, decimals: 1 },
  width: { min: 1.5, max: 120, default: 6, decimals: 1 },
  height: { min: 2, max: 30, default: 3, decimals: 1 },
  windowArea: { min: 0, max: 5000, default: 12, decimals: 1 },
  people: { min: 0, max: 5000, default: 8, decimals: 0 },
};

/**
 * Default Indonesia — konstruksi nyata ~90 % kantor, sekolah dan masjid di
 * Indonesia: keramik, bata berplester, plafon gypsum, kaca lebar, kursi
 * kayu/plastik. Ruangan 8 × 6 × 3 m dengan konfigurasi ini menghasilkan
 * T_mid ≈ 1,8 detik, yaitu buruk — dan itulah jawaban yang jujur sekaligus
 * berguna secara komersial (03-UI §12.3).
 */
export const RT60_DEFAULT_INPUT: Rt60Input = {
  length: 8,
  width: 6,
  height: 3,
  floor: "keramik",
  wall: "bata",
  ceiling: "gypsum",
  windowArea: 12,
  people: 8,
  room: "rapat",
};

export function isFloorId(value: unknown): value is FloorId {
  return typeof value === "string" && FLOOR_IDS.some((id) => id === value);
}

export function isWallId(value: unknown): value is WallId {
  return typeof value === "string" && WALL_IDS.some((id) => id === value);
}

export function isCeilingId(value: unknown): value is CeilingId {
  return typeof value === "string" && CEILING_IDS.some((id) => id === value);
}

export function isRoomTypeId(value: unknown): value is RoomTypeId {
  return typeof value === "string" && ROOM_TYPE_IDS.some((id) => id === value);
}

/**
 * Nilai negatif TIDAK dijepit ke batas bawah, melainkan dikembalikan ke default:
 * lebar −5 m bukan "terlalu kecil", melainkan omong kosong, dan menjepitnya ke
 * 1,5 m akan menghasilkan jawaban yang terlihat sah untuk masukan yang tidak
 * sah. Besaran yang cuma di luar rentang (0,5 m atau 400 m) tetap dijepit ke
 * batas, karena di situ maksud penggunanya masih jelas.
 */
function sanitiseNumber(raw: number | undefined, limit: NumericLimit): number {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
    return limit.default;
  }
  return clampNum(raw, limit.min, limit.max, limit.default);
}

/**
 * Jepit-ke-default untuk setiap medan. Tidak pernah melempar: NaN, Infinity,
 * negatif, besaran absurd, enum salah dan medan hilang semuanya berakhir pada
 * nilai default yang sah (03-UI §12.1).
 */
export function sanitiseRt60Input(input?: Rt60InputLike): Rt60Input {
  const source = input ?? {};
  return {
    length: sanitiseNumber(source.length, RT60_LIMITS.length),
    width: sanitiseNumber(source.width, RT60_LIMITS.width),
    height: sanitiseNumber(source.height, RT60_LIMITS.height),
    floor: isFloorId(source.floor) ? source.floor : RT60_DEFAULT_INPUT.floor,
    wall: isWallId(source.wall) ? source.wall : RT60_DEFAULT_INPUT.wall,
    ceiling: isCeilingId(source.ceiling)
      ? source.ceiling
      : RT60_DEFAULT_INPUT.ceiling,
    windowArea: sanitiseNumber(source.windowArea, RT60_LIMITS.windowArea),
    people: Math.round(sanitiseNumber(source.people, RT60_LIMITS.people)),
    room: isRoomTypeId(source.room) ? source.room : RT60_DEFAULT_INPUT.room,
  };
}

/* ------------------------------------------------------------------ *
 * 7. Persamaan telanjang — diekspor supaya bisa diuji satu per satu
 * ------------------------------------------------------------------ */

/** RT60 = 0,161 · V / A. Berlaku saat ᾱ ≤ 0,20. */
export function sabineRt60(volume: number, absorption: number): number {
  if (!(absorption > 0) || !(volume > 0)) return 0;
  return (SABINE_CONSTANT * volume) / absorption;
}

/** RT60 = 0,161 · V / (−S · ln(1 − ᾱ)). Berlaku saat ᾱ > 0,20. */
export function eyringRt60(
  volume: number,
  totalSurface: number,
  alphaBar: number,
): number {
  if (!(volume > 0) || !(totalSurface > 0)) return 0;
  const alpha = clampNum(alphaBar, 1e-6, ALPHA_BAR_CEILING, 1e-6);
  const equivalentAbsorption = -totalSurface * Math.log(1 - alpha);
  if (!(equivalentAbsorption > 0)) return 0;
  return (SABINE_CONSTANT * volume) / equivalentAbsorption;
}

/** Pemilih model. Satu-satunya tempat ambang 0,20 dipakai ke arah maju. */
export function selectModel(alphaBar: number): Rt60Model {
  return alphaBar > EYRING_THRESHOLD ? "eyring" : "sabine";
}

/** RT60 dengan model yang dipilih otomatis dari ᾱ. */
export function rt60From(
  volume: number,
  totalSurface: number,
  absorption: number,
): { rt60: number; model: Rt60Model; alphaBar: number } {
  const alphaBar = totalSurface > 0 ? absorption / totalSurface : 0;
  const model = selectModel(alphaBar);
  const rt60 =
    model === "sabine"
      ? sabineRt60(volume, absorption)
      : eyringRt60(volume, totalSurface, alphaBar);
  return { rt60, model, alphaBar };
}

/**
 * Kebalikan eksak dari `rt60From()`: berapa m² sabin yang harus ada supaya
 * RT60 sama dengan target.
 *
 * Uji cabangnya memakai ᾱ setara-Sabine, karena itulah besaran yang identik di
 * kedua arah pada titik ambang — sehingga fungsi ini benar-benar invers dan
 * tidak berayun bolak-balik antara dua model di sekitar ᾱ = 0,20.
 */
export function requiredAbsorption(
  volume: number,
  totalSurface: number,
  targetRt60: number,
): { absorption: number; alphaBar: number; model: Rt60Model } {
  if (!(volume > 0) || !(totalSurface > 0) || !(targetRt60 > 0)) {
    return { absorption: 0, alphaBar: 0, model: "sabine" };
  }
  const sabineAlpha =
    (SABINE_CONSTANT * volume) / (totalSurface * targetRt60);
  const model = selectModel(sabineAlpha);
  const alphaBar =
    model === "sabine"
      ? sabineAlpha
      : 1 - Math.exp(-Math.min(sabineAlpha, 12));
  return { absorption: totalSurface * alphaBar, alphaBar, model };
}

/** R = S · ᾱ / (1 − ᾱ). */
export function roomConstantOf(totalSurface: number, alphaBar: number): number {
  const alpha = clampNum(alphaBar, 0, ALPHA_BAR_CEILING, 0);
  if (!(totalSurface > 0) || alpha <= 0) return 0;
  return (totalSurface * alpha) / (1 - alpha);
}

/** Dc = 0,141 · √(Q · R). */
export function criticalDistanceOf(
  roomConstant: number,
  directivity = DIRECTIVITY_Q,
): number {
  if (!(roomConstant > 0) || !(directivity > 0)) return 0;
  return CRITICAL_DISTANCE_CONSTANT * Math.sqrt(directivity * roomConstant);
}

/**
 * f_s = 2000 · √(T / V). Di bawah frekuensi ini ruangan berperilaku modal dan
 * model statistik mana pun (Sabine maupun Eyring) hanya indikasi arah. Nyaris
 * tidak ada kalkulator lain yang menyebut batas ini.
 */
export function schroederFrequency(rt60: number, volume: number): number {
  if (!(rt60 > 0) || !(volume > 0)) return 0;
  return 2000 * Math.sqrt(rt60 / volume);
}

/* ------------------------------------------------------------------ *
 * 8. Bentuk hasil
 * ------------------------------------------------------------------ */

export type Rt60Model = "sabine" | "eyring";

export type Rt60Tone = "neutral" | "good" | "warning" | "bad";

export type SurfaceContribution = {
  /** "lantai" | "dinding" | "kaca" | "plafon" | "orang" | "udara" */
  id: string;
  label: string;
  materialLabel: string;
  area: number;
  alpha: number;
  absorption: number;
};

export type Rt60Band = {
  band: OctaveBand;
  label: string;
  surfaces: readonly SurfaceContribution[];
  surfaceAbsorption: number;
  peopleAbsorption: number;
  airAbsorption: number;
  absorption: number;
  alphaBar: number;
  model: Rt60Model;
  rt60: number;
};

export type Rt60Geometry = {
  volume: number;
  floorArea: number;
  ceilingArea: number;
  perimeter: number;
  wallGrossArea: number;
  /** Nilai yang benar-benar dipakai — sudah dijepit ke luas dinding kotor. */
  windowArea: number;
  /** Nilai yang diminta pengguna, sebelum dijepit. */
  requestedWindowArea: number;
  wallNetArea: number;
  totalSurface: number;
  aspectRatio: number;
  peopleDensity: number;
};

export type Rt60Treatment = {
  room: RoomTypeId;
  roomLabel: string;
  targetRt60: number;
  targetRange: readonly [number, number];
  targetModel: Rt60Model;
  targetAlphaBar: number;
  targetAbsorption: number;
  /** Pita tengah dengan serapan paling sedikit — pita penentu. */
  governingBand: OctaveBand;
  governingIndex: number;
  currentAbsorption: number;
  meetsTarget: boolean;
  /** ΔA, m² sabin. 0 bila target sudah terpenuhi. */
  additionalAbsorption: number;
  panelNrc: number;
  panelAlpha: number;
  /** ᾱ rata-rata berbobot luas dari permukaan yang akan tertutup panel. */
  replacedAlpha: number;
  netAlpha: number;
  /** m² panel akustik 50 mm. `Infinity` bila panel tidak lagi menambah apa pun. */
  panelArea: number;
  availableArea: number;
  coverageRatio: number;
  feasible: boolean;
};

export type Rt60FindingId =
  | "di-atas-target"
  | "sudah-memenuhi"
  | "ekor-bass"
  | "model-eyring"
  | "panel-tidak-cukup"
  | "serapan-ekstrem"
  | "medan-tidak-difus"
  | "di-bawah-schroeder"
  | "serapan-udara"
  | "jendela-terlalu-luas"
  | "kepadatan-tinggi"
  | "tanpa-orang";

export type Rt60Finding = {
  id: Rt60FindingId;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

/** Bentuknya identik dengan `MathStep` di `_shared/ShowTheMath`, tanpa
 *  mengimpor berkas React apa pun ke dalam mesin yang murni ini. */
export type Rt60MathStep = {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  note?: string;
};

export type Rt60Result = {
  input: Rt60Input;
  geometry: Rt60Geometry;
  bands: readonly Rt60Band[];
  /** Rata-rata RT60 pada 500 Hz dan 1 kHz. */
  tMid: number;
  /** Model pada pita tengah. `mixed` benar bila 500 Hz dan 1 kHz berbeda. */
  midModel: Rt60Model;
  midModelMixed: boolean;
  midAlphaBar: number;
  /** RT60(125 Hz) ÷ T_mid. > 1,3 berarti ekor bass. */
  bassRatio: number;
  roomConstant: number;
  criticalDistance: number;
  directivity: number;
  schroederFrequency: number;
  treatment: Rt60Treatment;
  /** Alat ini TIDAK pernah mengeluarkan angka STI — hanya kecenderungan. */
  stipa: { likelihood: StipaLikelihood };
  verdict: { tone: Rt60Tone; text: string };
  findings: readonly Rt60Finding[];
  steps: readonly Rt60MathStep[];
  assumptions: readonly string[];
  standards: readonly string[];
  verifiedAt: string;
};

/* ------------------------------------------------------------------ *
 * 9. Mesin
 * ------------------------------------------------------------------ */

function geometryOf(input: Rt60Input): Rt60Geometry {
  const floorArea = input.length * input.width;
  const perimeter = 2 * (input.length + input.width);
  const wallGrossArea = perimeter * input.height;
  const windowArea = Math.min(input.windowArea, wallGrossArea);
  return {
    volume: floorArea * input.height,
    floorArea,
    ceilingArea: floorArea,
    perimeter,
    wallGrossArea,
    windowArea,
    requestedWindowArea: input.windowArea,
    wallNetArea: wallGrossArea - windowArea,
    totalSurface: floorArea * 2 + wallGrossArea,
    aspectRatio:
      Math.max(input.length, input.width) / Math.min(input.length, input.width),
    peopleDensity: floorArea > 0 ? input.people / floorArea : 0,
  };
}

function bandOf(
  input: Rt60Input,
  geometry: Rt60Geometry,
  index: number,
  band: OctaveBand,
): Rt60Band {
  const floorAlphaValue = bandAlpha(FLOOR_ALPHA[input.floor], index);
  const wallAlphaValue = bandAlpha(WALL_ALPHA[input.wall], index);
  const glassAlphaValue = bandAlpha(GLASS_ALPHA, index);
  const ceilingAlphaValue = bandAlpha(CEILING_ALPHA[input.ceiling], index);
  const personAlphaValue = bandAlpha(PERSON_ABSORPTION, index);

  const surfaces: SurfaceContribution[] = [
    {
      id: "lantai",
      label: RT60_COPY.surface.floor,
      materialLabel: FLOOR_LABEL[input.floor],
      area: geometry.floorArea,
      alpha: floorAlphaValue,
      absorption: geometry.floorArea * floorAlphaValue,
    },
    {
      id: "dinding",
      label: RT60_COPY.surface.wall,
      materialLabel: WALL_LABEL[input.wall],
      area: geometry.wallNetArea,
      alpha: wallAlphaValue,
      absorption: geometry.wallNetArea * wallAlphaValue,
    },
    {
      id: "kaca",
      label: RT60_COPY.surface.window,
      materialLabel: GLASS_MATERIAL.label,
      area: geometry.windowArea,
      alpha: glassAlphaValue,
      absorption: geometry.windowArea * glassAlphaValue,
    },
    {
      id: "plafon",
      label: RT60_COPY.surface.ceiling,
      materialLabel: CEILING_LABEL[input.ceiling],
      area: geometry.ceilingArea,
      alpha: ceilingAlphaValue,
      absorption: geometry.ceilingArea * ceilingAlphaValue,
    },
  ];

  const surfaceAbsorption = surfaces.reduce(
    (total, surface) => total + surface.absorption,
    0,
  );
  const peopleAbsorption = input.people * personAlphaValue;

  // 4·m·V hanya pada V > 1000 m³ DAN hanya di pita 4 kHz (§12.3).
  const airAbsorption =
    band === 4000 && geometry.volume > AIR_ABSORPTION_VOLUME_THRESHOLD
      ? AIR_4M_4KHZ * geometry.volume
      : 0;

  const absorption = surfaceAbsorption + peopleAbsorption + airAbsorption;
  const { rt60, model, alphaBar } = rt60From(
    geometry.volume,
    geometry.totalSurface,
    absorption,
  );

  return {
    band,
    label: BAND_LABEL[band] ?? `${band} Hz`,
    surfaces,
    surfaceAbsorption,
    peopleAbsorption,
    airAbsorption,
    absorption,
    alphaBar,
    model,
    rt60,
  };
}

function treatmentOf(
  input: Rt60Input,
  geometry: Rt60Geometry,
  bands: readonly Rt60Band[],
  tMid: number,
): Rt60Treatment {
  const target = ROOM_TARGETS[input.room];
  const required = requiredAbsorption(
    geometry.volume,
    geometry.totalSurface,
    target.target,
  );

  const band500 = bands[INDEX_500];
  const band1k = bands[INDEX_1K];
  const absorption500 = band500?.absorption ?? 0;
  const absorption1k = band1k?.absorption ?? 0;

  // Pita penentu = pita tengah dengan serapan paling sedikit. Merancang pada
  // pita yang paling kurang serapan berarti pita lainnya otomatis lolos.
  const governingIndex = absorption1k <= absorption500 ? INDEX_1K : INDEX_500;
  const governingBand = OCTAVE_BANDS[governingIndex] ?? 1000;
  const currentAbsorption = Math.min(absorption500, absorption1k);

  const delta = required.absorption - currentAbsorption;
  const meetsTarget = tMid <= target.range[1] || delta <= 0;
  const additionalAbsorption = meetsTarget ? 0 : delta;

  const panelAlpha = bandAlpha(PANEL_50MM_ALPHA, governingIndex);
  const wallAlphaValue = bandAlpha(WALL_ALPHA[input.wall], governingIndex);
  const ceilingAlphaValue = bandAlpha(
    CEILING_ALPHA[input.ceiling],
    governingIndex,
  );
  const availableArea = geometry.wallNetArea + geometry.ceilingArea;
  const replacedAlpha =
    availableArea > 0
      ? (geometry.wallNetArea * wallAlphaValue +
          geometry.ceilingArea * ceilingAlphaValue) /
        availableArea
      : wallAlphaValue;
  const netAlpha = panelAlpha - replacedAlpha;

  // Dinding dan plafon yang sudah seserap panel tidak bisa ditolong dengan
  // menempel panel lagi. Jawaban jujurnya bukan angka besar, tapi "tidak bisa".
  const panelArea =
    additionalAbsorption <= 0
      ? 0
      : netAlpha >= PANEL_MIN_NET_ALPHA
        ? additionalAbsorption / netAlpha
        : Number.POSITIVE_INFINITY;

  const coverageRatio =
    availableArea > 0 ? panelArea / availableArea : Number.POSITIVE_INFINITY;

  return {
    room: input.room,
    roomLabel: ROOM_TYPE_LABEL[input.room],
    targetRt60: target.target,
    targetRange: target.range,
    targetModel: required.model,
    targetAlphaBar: required.alphaBar,
    targetAbsorption: required.absorption,
    governingBand,
    governingIndex,
    currentAbsorption,
    meetsTarget,
    additionalAbsorption,
    panelNrc: PANEL_NRC,
    panelAlpha,
    replacedAlpha,
    netAlpha,
    panelArea,
    availableArea,
    coverageRatio,
    feasible: Number.isFinite(panelArea) && panelArea <= availableArea,
  };
}

function likelihoodOf(tMid: number): StipaLikelihood {
  if (tMid >= STI_FAIL_RT60) return "gagal";
  if (tMid >= STI_MARGINAL_RT60) return "batas";
  return "lolos";
}

/** Pengali terhadap target selalu dicetak satu desimal ("3,0×", bukan "3×") —
 *  di layar instrumen, angka bulat tanpa desimal terbaca sebagai nilai eksak. */
function targetFactor(tMid: number, treatment: Rt60Treatment): number {
  return treatment.targetRt60 > 0 ? tMid / treatment.targetRt60 : Number.NaN;
}

function verdictOf(
  tMid: number,
  treatment: Rt60Treatment,
): { tone: Rt60Tone; text: string } {
  if (treatment.meetsTarget) {
    return {
      tone: "good",
      text: RT60_COPY.result.verdict.good({
        range: `${fmt(treatment.targetRange[0])}–${fmt(treatment.targetRange[1])}`,
      }),
    };
  }
  const factor = targetFactor(tMid, treatment);
  const args = {
    factor: fmtFixed(factor, 1),
    target: fmt(treatment.targetRt60),
  };
  return factor > 1.5
    ? { tone: "bad", text: RT60_COPY.result.verdict.bad(args) }
    : { tone: "warning", text: RT60_COPY.result.verdict.warning(args) };
}

function findingsOf(
  input: Rt60Input,
  geometry: Rt60Geometry,
  bands: readonly Rt60Band[],
  tMid: number,
  bassRatio: number,
  midAlphaBar: number,
  midModel: Rt60Model,
  schroeder: number,
  treatment: Rt60Treatment,
): readonly Rt60Finding[] {
  const findings: Rt60Finding[] = [];
  const band125 = bands[INDEX_125];
  const band4k = bands[INDEX_4K];
  const governing = bands[treatment.governingIndex];

  if (treatment.meetsTarget) {
    findings.push({
      id: "sudah-memenuhi",
      severity: "info",
      title: FINDING_COPY.sudahMemenuhi.title,
      detail: FINDING_COPY.sudahMemenuhi.detail({
        tMid: fmt(tMid),
        range: `${fmt(treatment.targetRange[0])}–${fmt(treatment.targetRange[1])}`,
        room: treatment.roomLabel,
      }),
    });
  } else {
    const factor = targetFactor(tMid, treatment);
    findings.push({
      id: "di-atas-target",
      severity: factor > 1.5 ? "critical" : "warning",
      title: FINDING_COPY.diAtasTarget.title,
      detail: FINDING_COPY.diAtasTarget.detail({
        tMid: fmt(tMid),
        target: fmt(treatment.targetRt60),
        room: treatment.roomLabel,
        factor: fmtFixed(factor, 1),
      }),
    });
  }

  if (band125 && tMid > 0 && bassRatio > BASS_TAIL_RATIO) {
    findings.push({
      id: "ekor-bass",
      severity: "warning",
      title: FINDING_COPY.ekorBass.title,
      detail: FINDING_COPY.ekorBass.detail({
        rt125: fmt(band125.rt60),
        ratio: fmt(bassRatio, 2),
        tMid: fmt(tMid),
      }),
    });
  }

  if (midModel === "eyring" && governing) {
    const sabine = sabineRt60(geometry.volume, governing.absorption);
    const eyring = eyringRt60(
      geometry.volume,
      geometry.totalSurface,
      governing.alphaBar,
    );
    const gap = eyring > 0 ? (sabine / eyring - 1) * 100 : 0;
    findings.push({
      id: "model-eyring",
      severity: "info",
      title: FINDING_COPY.modelEyring.title,
      detail: FINDING_COPY.modelEyring.detail({
        alpha: fmt(midAlphaBar),
        sabine: fmt(sabine),
        eyring: fmt(eyring),
        gap: fmt(gap, 2),
      }),
    });
  }

  if (!treatment.meetsTarget && !treatment.feasible) {
    findings.push({
      id: "panel-tidak-cukup",
      severity: "critical",
      title: FINDING_COPY.panelTidakCukup.title,
      detail: FINDING_COPY.panelTidakCukup.detail({
        need: fmt(treatment.panelArea),
        available: fmt(treatment.availableArea),
        target: fmt(treatment.targetRt60),
        room: treatment.roomLabel,
      }),
    });
  }

  if (midAlphaBar > ALPHA_BAR_EXTREME) {
    findings.push({
      id: "serapan-ekstrem",
      severity: "warning",
      title: FINDING_COPY.serapanEkstrem.title,
      detail: FINDING_COPY.serapanEkstrem.detail({ alpha: fmt(midAlphaBar) }),
    });
  }

  const shortestSide = Math.min(input.length, input.width);
  if (geometry.aspectRatio > ASPECT_RATIO_LIMIT || input.height > shortestSide) {
    findings.push({
      id: "medan-tidak-difus",
      severity: "warning",
      title: FINDING_COPY.medanTidakDifus.title,
      detail: FINDING_COPY.medanTidakDifus.detail({
        ratio: `${fmt(geometry.aspectRatio, 2)} : 1`,
      }),
    });
  }

  const bandsBelowSchroeder = OCTAVE_BANDS.filter((band) => band < schroeder);
  if (bandsBelowSchroeder.length > 0) {
    findings.push({
      id: "di-bawah-schroeder",
      severity: bandsBelowSchroeder.length > 1 ? "warning" : "info",
      title: FINDING_COPY.diBawahSchroeder.title,
      detail: FINDING_COPY.diBawahSchroeder.detail({
        frequency: fmtInt(schroeder),
        bands: bandsBelowSchroeder
          .map((band) => BAND_LABEL[band] ?? `${band} Hz`)
          .join(" dan "),
      }),
    });
  }

  if (band4k && band4k.airAbsorption > 0) {
    findings.push({
      id: "serapan-udara",
      severity: "info",
      title: FINDING_COPY.serapanUdara.title,
      detail: FINDING_COPY.serapanUdara.detail({
        volume: fmtInt(geometry.volume),
        absorption: fmt(band4k.airAbsorption),
      }),
    });
  }

  if (geometry.requestedWindowArea > geometry.wallGrossArea) {
    findings.push({
      id: "jendela-terlalu-luas",
      severity: "warning",
      title: FINDING_COPY.jendelaTerlaluLuas.title,
      detail: FINDING_COPY.jendelaTerlaluLuas.detail({
        input: fmt(geometry.requestedWindowArea),
        gross: fmt(geometry.wallGrossArea),
        used: fmt(geometry.windowArea),
      }),
    });
  }

  if (geometry.peopleDensity > PEOPLE_DENSITY_LIMIT) {
    findings.push({
      id: "kepadatan-tinggi",
      severity: "warning",
      title: FINDING_COPY.kepadatanTinggi.title,
      detail: FINDING_COPY.kepadatanTinggi.detail({
        people: fmtInt(input.people),
        area: fmt(geometry.floorArea),
        density: fmt(geometry.peopleDensity, 2),
      }),
    });
  }

  if (input.people === 0) {
    findings.push({
      id: "tanpa-orang",
      severity: "info",
      title: FINDING_COPY.tanpaOrang.title,
      detail: FINDING_COPY.tanpaOrang.detail({ room: treatment.roomLabel }),
    });
  }

  return findings;
}

function absorptionSubstitution(band: Rt60Band, people: number): string {
  const parts = band.surfaces
    .filter((surface) => surface.area > 0)
    .map(
      (surface) =>
        `(${fmtFixed(surface.area, 1)} × ${fmtFixed(surface.alpha, 2)})`,
    );
  if (people > 0) {
    const perPerson = people > 0 ? band.peopleAbsorption / people : 0;
    parts.push(`(${fmtInt(people)} × ${fmtFixed(perPerson, 2)})`);
  }
  if (band.airAbsorption > 0) {
    parts.push(`(4·m·V = ${fmt(band.airAbsorption)})`);
  }
  return parts.join(" + ");
}

function rt60Step(
  label: string,
  band: Rt60Band,
  geometry: Rt60Geometry,
): Rt60MathStep {
  if (band.model === "sabine") {
    return {
      label,
      formula: "RT60 = 0,161 × V / A",
      substitution: `0,161 × ${fmt(geometry.volume)} / ${fmt(band.absorption)}`,
      result: `${fmt(band.rt60)} detik`,
    };
  }
  return {
    label,
    formula: "RT60 = 0,161 × V / (−S × ln(1 − ᾱ))",
    substitution: `0,161 × ${fmt(geometry.volume)} / (−${fmt(geometry.totalSurface)} × ln(1 − ${fmt(band.alphaBar)}))`,
    result: `${fmt(band.rt60)} detik`,
  };
}

function stepsOf(
  input: Rt60Input,
  geometry: Rt60Geometry,
  bands: readonly Rt60Band[],
  tMid: number,
  midAlphaBar: number,
  roomConstant: number,
  criticalDistance: number,
  schroeder: number,
  treatment: Rt60Treatment,
): readonly Rt60MathStep[] {
  const band500 = bands[INDEX_500];
  const band1k = bands[INDEX_1K];
  const governing = bands[treatment.governingIndex];
  const steps: Rt60MathStep[] = [];

  steps.push({
    label: STEP_LABEL.volume,
    formula: "V = P × L × T",
    substitution: `${fmtFixed(input.length, 1)} × ${fmtFixed(input.width, 1)} × ${fmtFixed(input.height, 1)}`,
    result: `${fmt(geometry.volume)} m³`,
  });

  steps.push({
    label: STEP_LABEL.surface,
    formula: "S = 2(P × L) + 2(P + L) × T",
    substitution: `2 × ${fmt(geometry.floorArea)} + ${fmt(geometry.perimeter)} × ${fmtFixed(input.height, 1)}`,
    result: `${fmt(geometry.totalSurface)} m²`,
  });

  if (band500) {
    steps.push({
      label: STEP_LABEL.absorption500,
      formula: "A = Σ(Sᵢ × αᵢ) + (N × A_orang)",
      substitution: absorptionSubstitution(band500, input.people),
      result: `${fmt(band500.absorption)} m² sabin`,
    });
    steps.push({
      label: STEP_LABEL.model,
      formula: "ᾱ = A / S",
      substitution: `${fmt(band500.absorption)} / ${fmt(geometry.totalSurface)}`,
      result: fmt(band500.alphaBar),
      note:
        band500.model === "sabine" ? STEP_NOTE.sabine : STEP_NOTE.eyring,
    });
    steps.push(rt60Step(STEP_LABEL.rt500, band500, geometry));
  }

  if (band1k) {
    steps.push({
      label: STEP_LABEL.absorption1k,
      formula: "A = Σ(Sᵢ × αᵢ) + (N × A_orang)",
      substitution: absorptionSubstitution(band1k, input.people),
      result: `${fmt(band1k.absorption)} m² sabin`,
    });
    steps.push(rt60Step(STEP_LABEL.rt1k, band1k, geometry));
  }

  steps.push({
    label: STEP_LABEL.tMid,
    formula: "T_mid = (RT₅₀₀ + RT₁ₖ) / 2",
    substitution: `(${fmt(band500?.rt60 ?? 0)} + ${fmt(band1k?.rt60 ?? 0)}) / 2`,
    result: `${fmt(tMid)} detik`,
  });

  if (treatment.targetModel === "sabine") {
    steps.push({
      label: STEP_LABEL.targetAbsorption,
      formula: "A_target = 0,161 × V / RT_target",
      substitution: `0,161 × ${fmt(geometry.volume)} / ${fmt(treatment.targetRt60)}`,
      result: `${fmt(treatment.targetAbsorption)} m² sabin`,
      note: STEP_NOTE.targetSabine,
    });
  } else {
    steps.push({
      label: STEP_LABEL.targetAbsorption,
      formula: "A_target = S × (1 − e^(−0,161·V / (S × RT_target)))",
      substitution: `${fmt(geometry.totalSurface)} × (1 − e^(−${fmt((SABINE_CONSTANT * geometry.volume) / (geometry.totalSurface * treatment.targetRt60))}))`,
      result: `${fmt(treatment.targetAbsorption)} m² sabin`,
      note: STEP_NOTE.targetEyring,
    });
  }

  steps.push({
    label: STEP_LABEL.deltaAbsorption,
    formula: `ΔA = A_target − A${governing ? ` (${governing.label})` : ""}`,
    substitution: `${fmt(treatment.targetAbsorption)} − ${fmt(treatment.currentAbsorption)}`,
    result: `${fmt(treatment.additionalAbsorption)} m² sabin`,
    note: treatment.meetsTarget ? STEP_NOTE.targetMet : undefined,
  });

  if (!treatment.meetsTarget) {
    steps.push({
      label: STEP_LABEL.panelArea,
      formula: "S_panel = ΔA / (α_panel − ᾱ_terpasang)",
      substitution: `${fmt(treatment.additionalAbsorption)} / (${fmtFixed(treatment.panelAlpha, 2)} − ${fmt(treatment.replacedAlpha, 2)})`,
      result: `${fmt(treatment.panelArea)} m²`,
      note: STEP_NOTE.panelNet,
    });
  }

  steps.push({
    label: STEP_LABEL.roomConstant,
    formula: "R = S × ᾱ / (1 − ᾱ)",
    substitution: `${fmt(geometry.totalSurface)} × ${fmt(midAlphaBar)} / (1 − ${fmt(midAlphaBar)})`,
    result: `${fmt(roomConstant)} m²`,
  });

  steps.push({
    label: STEP_LABEL.criticalDistance,
    formula: "Dc = 0,141 × √(Q × R)",
    substitution: `0,141 × √(${fmtInt(DIRECTIVITY_Q)} × ${fmt(roomConstant)})`,
    result: `${fmt(criticalDistance)} m`,
    note: STEP_NOTE.directivity,
  });

  steps.push({
    label: STEP_LABEL.schroeder,
    formula: "f_s = 2000 × √(T_mid / V)",
    substitution: `2000 × √(${fmt(tMid)} / ${fmt(geometry.volume)})`,
    result: `${fmtInt(schroeder)} Hz`,
    note: STEP_NOTE.schroeder,
  });

  return steps;
}

function assumptionsOf(
  geometry: Rt60Geometry,
  bands: readonly Rt60Band[],
): readonly string[] {
  const band4k = bands[INDEX_4K];
  const airAbsorption = band4k?.airAbsorption ?? 0;
  return [
    ...BASE_ASSUMPTIONS,
    airAbsorption > 0
      ? ASSUMPTION_AIR_INCLUDED(fmtInt(geometry.volume), fmt(airAbsorption))
      : ASSUMPTION_AIR_IGNORED(fmt(geometry.volume)),
  ];
}

/**
 * Satu-satunya pintu masuk perhitungan. Total, murni, isomorfik.
 */
export function computeRt60(input?: Rt60InputLike): Rt60Result {
  const safe = sanitiseRt60Input(input);
  const geometry = geometryOf(safe);
  const bands = OCTAVE_BANDS.map((band, index) =>
    bandOf(safe, geometry, index, band),
  );

  const band125 = bands[INDEX_125];
  const band500 = bands[INDEX_500];
  const band1k = bands[INDEX_1K];

  const rt500 = band500?.rt60 ?? 0;
  const rt1k = band1k?.rt60 ?? 0;
  const tMid = (rt500 + rt1k) / 2;

  const midAlphaBar = ((band500?.alphaBar ?? 0) + (band1k?.alphaBar ?? 0)) / 2;
  const midModelMixed = (band500?.model ?? "sabine") !== (band1k?.model ?? "sabine");
  const midModel: Rt60Model = midModelMixed
    ? "eyring"
    : (band500?.model ?? "sabine");

  const bassRatio = tMid > 0 ? (band125?.rt60 ?? 0) / tMid : 0;
  const roomConstant = roomConstantOf(geometry.totalSurface, midAlphaBar);
  const criticalDistance = criticalDistanceOf(roomConstant, DIRECTIVITY_Q);
  const schroeder = schroederFrequency(tMid, geometry.volume);

  const treatment = treatmentOf(safe, geometry, bands, tMid);

  return {
    input: safe,
    geometry,
    bands,
    tMid,
    midModel,
    midModelMixed,
    midAlphaBar,
    bassRatio,
    roomConstant,
    criticalDistance,
    directivity: DIRECTIVITY_Q,
    schroederFrequency: schroeder,
    treatment,
    stipa: { likelihood: likelihoodOf(tMid) },
    verdict: verdictOf(tMid, treatment),
    findings: findingsOf(
      safe,
      geometry,
      bands,
      tMid,
      bassRatio,
      midAlphaBar,
      midModel,
      schroeder,
      treatment,
    ),
    steps: stepsOf(
      safe,
      geometry,
      bands,
      tMid,
      midAlphaBar,
      roomConstant,
      criticalDistance,
      schroeder,
      treatment,
    ),
    assumptions: assumptionsOf(geometry, bands),
    standards: STANDARDS_CHIP,
    verifiedAt: VERIFIED_AT,
  };
}

/* ------------------------------------------------------------------ *
 * 10. Data siap-render untuk halaman rute (semuanya murni)
 * ------------------------------------------------------------------ */

/** Baris tabel referensi koefisien α (03-UI §12.6 butir 7). */
export function buildAlphaReferenceRows(): readonly Readonly<
  Record<string, string | number>
>[] {
  const materials: readonly Rt60Material[] = [
    ...FLOOR_MATERIALS,
    ...WALL_MATERIALS,
    GLASS_MATERIAL,
    ...CEILING_MATERIALS,
  ];
  return materials.map((material) => ({
    material: material.label,
    f125: fmtFixed(bandAlpha(material.alpha, 0), 2),
    f250: fmtFixed(bandAlpha(material.alpha, 1), 2),
    f500: fmtFixed(bandAlpha(material.alpha, 2), 2),
    f1k: fmtFixed(bandAlpha(material.alpha, 3), 2),
    f2k: fmtFixed(bandAlpha(material.alpha, 4), 2),
    f4k: fmtFixed(bandAlpha(material.alpha, 5), 2),
    nrc: fmtFixed(material.nrc, 2),
  }));
}

/** Baris tabel target RT60 per jenis ruangan. */
export function buildTargetReferenceRows(): readonly Readonly<
  Record<string, string | number>
>[] {
  return ROOM_TYPE_IDS.map((id) => {
    const target = ROOM_TARGETS[id];
    return {
      room: ROOM_TYPE_LABEL[id],
      target: fmtFixed(target.target, 1),
      range: `${fmtFixed(target.range[0], 1)}–${fmtFixed(target.range[1], 1)}`,
    };
  });
}

/** Baris tabel daftar standar dengan tanggal periksa terakhir. */
export function buildStandardsReferenceRows(): readonly Readonly<
  Record<string, string | number>
>[] {
  return STANDARDS.map((standard) => ({
    name: standard.name,
    scope: standard.scope,
    checked: standard.checked,
  }));
}

/** Baris tabel RT60 per pita untuk satu hasil. */
export function buildBandReferenceRows(
  result: Rt60Result,
): readonly Readonly<Record<string, string | number>>[] {
  return result.bands.map((band) => ({
    band: band.label,
    absorption: fmt(band.absorption),
    alpha: fmt(band.alphaBar),
    model: RT60_COPY.result.modelValue[band.model],
    rt60: fmt(band.rt60),
  }));
}

/** Baris rincian absorpsi pada satu pita (default: pita penentu). */
export function buildSurfaceReferenceRows(
  result: Rt60Result,
  bandIndex = result.treatment.governingIndex,
): readonly Readonly<Record<string, string | number>>[] {
  const band = result.bands[bandIndex] ?? result.bands[INDEX_500];
  if (!band) return [];
  const rows: Readonly<Record<string, string | number>>[] = band.surfaces.map(
    (surface) => ({
      surface: surface.label,
      material: surface.materialLabel,
      area: fmt(surface.area),
      alpha: fmtFixed(surface.alpha, 2),
      absorption: fmt(surface.absorption),
    }),
  );
  if (result.input.people > 0) {
    rows.push({
      surface: RT60_COPY.surface.people,
      material: PERSON_LABEL,
      area: fmtInt(result.input.people),
      alpha: fmtFixed(band.peopleAbsorption / result.input.people, 2),
      absorption: fmt(band.peopleAbsorption),
    });
  }
  if (band.airAbsorption > 0) {
    rows.push({
      surface: RT60_COPY.surface.air,
      material: AIR_LABEL,
      area: fmt(result.geometry.volume),
      alpha: fmtFixed(AIR_4M_4KHZ, 3),
      absorption: fmt(band.airAbsorption),
    });
  }
  return rows;
}

/**
 * Catatan sumber untuk tabel rincian absorpsi. Setiap baris yang bukan
 * permukaan bangunan — orang dan udara — harus menyebut asal nilainya, karena
 * itulah dua baris yang paling sering dipertanyakan saat hasil ini dibawa ke
 * rapat teknis.
 */
export function surfaceTableNote(result: Rt60Result): string {
  const parts: string[] = [];
  if (result.input.people > 0) parts.push(PERSON_SOURCE);
  if ((result.bands[INDEX_4K]?.airAbsorption ?? 0) > 0) parts.push(AIR_SOURCE);
  return parts.join(" ");
}

/** Baris tabel geometri — kembaran teks untuk diagram potongan ruang. */
export function buildGeometryReferenceRows(
  result: Rt60Result,
): readonly Readonly<Record<string, string | number>>[] {
  const rows = RT60_COPY.result.geometryRows;
  const geometry = result.geometry;
  return [
    { item: rows.volume, value: `${fmt(geometry.volume)} m³` },
    { item: rows.floorArea, value: `${fmt(geometry.floorArea)} m²` },
    { item: rows.ceilingArea, value: `${fmt(geometry.ceilingArea)} m²` },
    { item: rows.wallGrossArea, value: `${fmt(geometry.wallGrossArea)} m²` },
    { item: rows.windowArea, value: `${fmt(geometry.windowArea)} m²` },
    { item: rows.wallNetArea, value: `${fmt(geometry.wallNetArea)} m²` },
    { item: rows.totalSurface, value: `${fmt(geometry.totalSurface)} m²` },
    {
      item: rows.schroeder,
      value: `${fmtInt(result.schroederFrequency)} Hz`,
    },
  ];
}

/* ------------------------------------------------------------------ *
 * 11. Contoh terhitung — tiga ruangan Indonesia (03-UI §12.6 butir 6)
 * ------------------------------------------------------------------ */

export const RT60_EXAMPLE_INPUT: Record<ExampleId, Rt60Input> = {
  "rapat-kecil": {
    length: 6,
    width: 4,
    height: 2.8,
    floor: "keramik",
    wall: "bata",
    ceiling: "gypsum",
    windowArea: 6,
    people: 6,
    room: "rapat",
  },
  "kelas-sma": {
    length: 9,
    width: 7,
    height: 3.5,
    floor: "keramik",
    wall: "bata",
    ceiling: "gypsum",
    windowArea: 10,
    people: 32,
    room: "kelas",
  },
  "masjid-jamaah": {
    length: 20,
    width: 12,
    height: 6,
    floor: "keramik",
    wall: "bata",
    ceiling: "beton",
    windowArea: 24,
    people: 150,
    room: "masjid",
  },
};

export type Rt60WorkedExample = {
  id: ExampleId;
  title: string;
  description: string;
  verdict: string;
  input: Rt60Input;
  result: Rt60Result;
};

/**
 * Dihitung oleh mesin yang sama, bukan angka yang ditulis tangan — kalau α
 * berubah, contoh di halaman ikut berubah dan tidak pernah berbohong.
 */
export function buildWorkedExamples(): readonly Rt60WorkedExample[] {
  return EXAMPLE_IDS.map((id) => {
    const input = RT60_EXAMPLE_INPUT[id];
    const copy = EXAMPLE_COPY[id];
    return {
      id,
      title: copy.title,
      description: copy.description,
      verdict: copy.verdict,
      input,
      result: computeRt60(input),
    };
  });
}
