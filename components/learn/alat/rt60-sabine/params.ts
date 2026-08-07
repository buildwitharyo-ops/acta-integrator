/**
 * Kodek parameter URL untuk `/learn/alat/rt60-sabine`.
 *
 * Nama parameter dibekukan oleh 03-UI §12.1:
 *
 *   /learn/alat/rt60-sabine?p=8&l=6&t=3&lt=keramik&dd=bata&pf=gypsum&n=8
 *
 * `jd` (luas kaca) dan `rg` (jenis ruangan) adalah tambahan; tujuh nama di atas
 * tidak boleh berubah karena sudah beredar di dokumen dan tautan.
 *
 * Aturan tunggal yang mengatur seluruh berkas ini: **setiap parameter dijepit ke
 * nilai default.** Kalkulator tidak boleh melempar atau 500 karena URL yang
 * dikarang — bot dan pengikis tautan mengirim sampah, tanda kutip, emoji,
 * `Infinity`, dan angka sepanjang seratus digit. Semuanya berakhir pada default.
 *
 * Modul murni: tanpa React, tanpa I/O, tanpa `Date`.
 */

import { parseNum } from "@/lib/learn/format";
import {
  RT60_DEFAULT_INPUT,
  RT60_LIMITS,
  isCeilingId,
  isFloorId,
  isRoomTypeId,
  isWallId,
  sanitiseRt60Input,
  type Rt60Input,
} from "./calc";

/** Lintasan kanonik alat ini. Dipakai sebagai `action` form dan basis tautan. */
export const RT60_TOOL_PATH = "/learn/alat/rt60-sabine";

/** Peta medan → nama parameter URL. Tujuh yang pertama dibekukan oleh §12.1. */
export const RT60_PARAM = {
  length: "p",
  width: "l",
  height: "t",
  floor: "lt",
  wall: "dd",
  ceiling: "pf",
  people: "n",
  windowArea: "jd",
  room: "rg",
} as const;

export type Rt60ParamKey = (typeof RT60_PARAM)[keyof typeof RT60_PARAM];

/** Semua nama parameter yang dikenal, untuk `hasRt60Params()`. */
export const RT60_PARAM_KEYS: readonly Rt60ParamKey[] = [
  RT60_PARAM.length,
  RT60_PARAM.width,
  RT60_PARAM.height,
  RT60_PARAM.floor,
  RT60_PARAM.wall,
  RT60_PARAM.ceiling,
  RT60_PARAM.people,
  RT60_PARAM.windowArea,
  RT60_PARAM.room,
];

/**
 * Bentuk `searchParams` Next.js (sesudah di-await) maupun `URLSearchParams`
 * dari browser. Keduanya diterima supaya server dan Panel memakai kodek yang
 * sama persis.
 */
export type Rt60ParamSource =
  | URLSearchParams
  | Readonly<Record<string, string | string[] | undefined>>;

function readParam(
  source: Rt60ParamSource | undefined,
  key: string,
): string | undefined {
  if (!source) return undefined;
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const raw = source[key];
  // ?p=8&p=9 → ambil yang pertama, jangan pura-pura ini keadaan yang sah.
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

/**
 * Angka yang tidak terbaca, tak hingga, negatif, atau di luar batas akan
 * dijepit. `parseNum` menerima dua register: "7.5" (kanonik) dan "7,5"
 * (Indonesia, yang dikirim form native saat pengguna mengetik koma).
 */
function readNumber(
  source: Rt60ParamSource | undefined,
  key: string,
  fallback: number,
): number {
  const raw = readParam(source, key);
  if (raw === undefined) return fallback;
  // Batas panjang murah: string 100 digit tidak perlu sampai ke parser.
  if (raw.length > 24) return fallback;
  const parsed = parseNum(raw, Number.NaN);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readEnum(
  source: Rt60ParamSource | undefined,
  key: string,
): string | undefined {
  const raw = readParam(source, key);
  if (raw === undefined || raw.length > 32) return undefined;
  return raw;
}

/**
 * Baca `searchParams` menjadi masukan yang sudah sah dan sudah dijepit.
 * Tidak pernah melempar. Tanpa parameter sama sekali → default Indonesia.
 */
export function parseRt60Params(source?: Rt60ParamSource): Rt60Input {
  return sanitiseRt60Input({
    length: readNumber(source, RT60_PARAM.length, RT60_DEFAULT_INPUT.length),
    width: readNumber(source, RT60_PARAM.width, RT60_DEFAULT_INPUT.width),
    height: readNumber(source, RT60_PARAM.height, RT60_DEFAULT_INPUT.height),
    floor: readEnum(source, RT60_PARAM.floor),
    wall: readEnum(source, RT60_PARAM.wall),
    ceiling: readEnum(source, RT60_PARAM.ceiling),
    windowArea: readNumber(
      source,
      RT60_PARAM.windowArea,
      RT60_DEFAULT_INPUT.windowArea,
    ),
    people: readNumber(source, RT60_PARAM.people, RT60_DEFAULT_INPUT.people),
    room: readEnum(source, RT60_PARAM.room),
  });
}

/** Ada parameter alat ini di URL? Menentukan `noindex` + kanonik (§12.1). */
export function hasRt60Params(source?: Rt60ParamSource): boolean {
  if (!source) return false;
  return RT60_PARAM_KEYS.some((key) => readParam(source, key) !== undefined);
}

/** Masukan ini sama persis dengan default? Kalau ya, tautannya lintasan telanjang. */
export function isDefaultRt60Input(input: Rt60Input): boolean {
  const safe = sanitiseRt60Input(input);
  return (
    safe.length === RT60_DEFAULT_INPUT.length &&
    safe.width === RT60_DEFAULT_INPUT.width &&
    safe.height === RT60_DEFAULT_INPUT.height &&
    safe.floor === RT60_DEFAULT_INPUT.floor &&
    safe.wall === RT60_DEFAULT_INPUT.wall &&
    safe.ceiling === RT60_DEFAULT_INPUT.ceiling &&
    safe.windowArea === RT60_DEFAULT_INPUT.windowArea &&
    safe.people === RT60_DEFAULT_INPUT.people &&
    safe.room === RT60_DEFAULT_INPUT.room
  );
}

/**
 * Angka ditulis dengan titik desimal — format tautan kanonik (§12.1).
 * `parseNum` tetap membaca koma, tapi setiap tautan yang situs ini hasilkan
 * memakai titik. Maksimal tiga desimal; pembulatan di sini tidak pernah
 * mengubah hasil karena batas medan sendiri hanya satu desimal.
 */
function serialiseNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

/**
 * Bentuk query string kanonik. Medan yang sama dengan default DIHILANGKAN,
 * sehingga keadaan default menghasilkan string kosong dan tautannya kembali ke
 * lintasan telanjang yang indexable.
 */
export function serialiseRt60Params(input?: Partial<Rt60Input>): string {
  const safe = sanitiseRt60Input(input);
  const params = new URLSearchParams();

  if (safe.length !== RT60_DEFAULT_INPUT.length) {
    params.set(RT60_PARAM.length, serialiseNumber(safe.length));
  }
  if (safe.width !== RT60_DEFAULT_INPUT.width) {
    params.set(RT60_PARAM.width, serialiseNumber(safe.width));
  }
  if (safe.height !== RT60_DEFAULT_INPUT.height) {
    params.set(RT60_PARAM.height, serialiseNumber(safe.height));
  }
  if (safe.floor !== RT60_DEFAULT_INPUT.floor) {
    params.set(RT60_PARAM.floor, safe.floor);
  }
  if (safe.wall !== RT60_DEFAULT_INPUT.wall) {
    params.set(RT60_PARAM.wall, safe.wall);
  }
  if (safe.ceiling !== RT60_DEFAULT_INPUT.ceiling) {
    params.set(RT60_PARAM.ceiling, safe.ceiling);
  }
  if (safe.people !== RT60_DEFAULT_INPUT.people) {
    params.set(RT60_PARAM.people, serialiseNumber(safe.people));
  }
  if (safe.windowArea !== RT60_DEFAULT_INPUT.windowArea) {
    params.set(RT60_PARAM.windowArea, serialiseNumber(safe.windowArea));
  }
  if (safe.room !== RT60_DEFAULT_INPUT.room) {
    params.set(RT60_PARAM.room, safe.room);
  }

  return params.toString();
}

/**
 * Tautan siap pakai. Keadaan default → lintasan telanjang tanpa `?`, yang
 * adalah URL kanonik dan satu-satunya yang masuk sitemap.
 */
export function rt60Href(
  input?: Partial<Rt60Input>,
  basePath: string = RT60_TOOL_PATH,
): string {
  const query = serialiseRt60Params(input);
  return query ? `${basePath}?${query}` : basePath;
}

/** Nilai default untuk atribut `value` pada kolom isian (register Indonesia). */
export { RT60_DEFAULT_INPUT, RT60_LIMITS };

/** Penjaga enum diteruskan supaya rute tidak perlu mengimpor dari dua tempat. */
export { isCeilingId, isFloorId, isRoomTypeId, isWallId };
