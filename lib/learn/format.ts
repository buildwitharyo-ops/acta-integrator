/**
 * Indonesian number formatting for the /learn calculators.
 *
 * Pure module: no React, no Intl, no Date, no I/O. It runs identically at build,
 * on the server, in the browser and in the test suite (03-UI §12.1).
 *
 * Convention (03-UI §12.5): decimal comma, thousands dot, and a hard ceiling of
 * THREE significant figures on computed values — printing "1,6234891 detik" from
 * ±20% inputs is false precision.
 */

const THOUSANDS_SEPARATOR = ".";
const DECIMAL_SEPARATOR = ",";
const RANGE_DASH = "–";

/** Rendered in place of a number that does not exist (NaN, Infinity). */
export const NO_VALUE = "—";

/** Units that sit flush against the number: 98" · 22% · 30° */
const TIGHT_UNITS = new Set(['"', "″", "%", "°", "'", "′"]);

function clampDigits(sigFigs: number): number {
  const digits = Math.trunc(sigFigs);
  if (!Number.isFinite(digits) || digits < 1) return 1;
  return digits > 21 ? 21 : digits;
}

function clampDecimals(decimals: number): number {
  const value = Math.trunc(decimals);
  if (!Number.isFinite(value) || value < 0) return 0;
  return value > 20 ? 20 : value;
}

/** Decimal places needed so that `value` shows exactly `digits` significant figures. */
function decimalsFor(value: number, digits: number): number {
  const abs = Math.abs(value);
  if (abs === 0) return 0;
  return clampDecimals(digits - 1 - Math.floor(Math.log10(abs)));
}

function groupThousands(intDigits: string): string {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
}

function compose(value: number, decimals: number, trimZeros: boolean): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const dot = fixed.indexOf(".");
  const intPart = dot === -1 ? fixed : fixed.slice(0, dot);
  let fracPart = dot === -1 ? "" : fixed.slice(dot + 1);
  if (trimZeros) fracPart = fracPart.replace(/0+$/, "");
  const body = fracPart
    ? `${groupThousands(intPart)}${DECIMAL_SEPARATOR}${fracPart}`
    : groupThousands(intPart);
  return value < 0 && Number(fixed) !== 0 ? `-${body}` : body;
}

function joinUnit(text: string, unit?: string): string {
  if (!unit) return text;
  return TIGHT_UNITS.has(unit) ? `${text}${unit}` : `${text} ${unit}`;
}

/**
 * Round to N significant figures. Returns the value unchanged for 0 and for
 * non-finite input, so callers can test for finiteness once.
 *
 * toSigFigs(1.6234891) === 1.62 · toSigFigs(123456) === 123000
 */
export function toSigFigs(value: number, sigFigs = 3): number {
  if (!Number.isFinite(value) || value === 0) return value;
  return Number(value.toPrecision(clampDigits(sigFigs)));
}

/**
 * The default readout formatter: N significant figures, decimal comma,
 * thousands dot, no trailing zeros.
 *
 * fmt(1.6234891) === "1,62" · fmt(0.079) === "0,079" · fmt(4235) === "4.240"
 */
export function fmt(value: number, sigFigs = 3): string {
  if (!Number.isFinite(value)) return NO_VALUE;
  const digits = clampDigits(sigFigs);
  const rounded = toSigFigs(value, digits);
  if (Math.abs(rounded) >= 1e21) {
    return rounded.toExponential(digits - 1).replace(".", DECIMAL_SEPARATOR);
  }
  return compose(rounded, decimalsFor(rounded, digits), true);
}

/**
 * Fixed decimal places, zeros kept — for echoing inputs where the trailing zero
 * carries meaning: fmtFixed(8, 1) === "8,0" (room 8,0 × 6,0 × 3,0 m).
 */
export function fmtFixed(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return NO_VALUE;
  return compose(value, clampDecimals(decimals), false);
}

/**
 * Exact integer with thousands dots — counts, lumens, currency-free quantities
 * where significant-figure rounding would lie: fmtInt(4235) === "4.235"
 */
export function fmtInt(value: number): string {
  if (!Number.isFinite(value)) return NO_VALUE;
  return compose(Math.round(value), 0, false);
}

/**
 * Number + unit. Percent, degree and inch marks sit flush; everything else gets
 * a space: fmtUnit(1.62, "detik") === "1,62 detik" · fmtUnit(98, '"') === '98"'
 */
export function fmtUnit(value: number, unit?: string, sigFigs = 3): string {
  if (!Number.isFinite(value)) return NO_VALUE;
  return joinUnit(fmt(value, sigFigs), unit);
}

/**
 * Inclusive range with an en dash, unit printed once:
 * fmtRange(1.4, 1.8, "detik") === "1,4–1,8 detik"
 */
export function fmtRange(
  min: number,
  max: number,
  unit?: string,
  sigFigs = 3,
): string {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return NO_VALUE;
  const lo = fmt(Math.min(min, max), sigFigs);
  const hi = fmt(Math.max(min, max), sigFigs);
  return joinUnit(lo === hi ? lo : `${lo}${RANGE_DASH}${hi}`, unit);
}

/**
 * Parse user or URL input into a number. Accepts both registers:
 * a string containing a comma is read Indonesian ("1.500,25" → 1500.25);
 * otherwise the dot is the decimal point ("7.0" → 7), which is what the
 * canonical share URLs use. Returns `fallback` when nothing parses.
 */
export function parseNum(
  raw: string | number | null | undefined,
  fallback = Number.NaN,
): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : fallback;
  if (raw == null) return fallback;
  let text = raw.trim().replace(/\s+/g, "");
  if (!text) return fallback;
  if (text.includes(DECIMAL_SEPARATOR)) {
    text = text.split(THOUSANDS_SEPARATOR).join("").replace(DECIMAL_SEPARATOR, ".");
  }
  if (text.endsWith(".")) text = text.slice(0, -1);
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Clamp-to-default, the rule that stops a crafted URL from 500-ing a calculator
 * (03-UI §12.1). Non-finite input returns `fallback`, then `min`, then 0.
 */
export function clampNum(
  value: number,
  min?: number,
  max?: number,
  fallback?: number,
): number {
  if (!Number.isFinite(value)) return fallback ?? min ?? 0;
  let out = value;
  if (min !== undefined && out < min) out = min;
  if (max !== undefined && out > max) out = max;
  return out;
}
