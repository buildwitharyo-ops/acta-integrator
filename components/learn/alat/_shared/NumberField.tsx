"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { clampNum, fmt, parseNum } from "@/lib/learn/format";
import { cn } from "@/lib/utils";

export type NumberFieldProps = {
  /** GET param name — this field participates in the native form. Required. */
  name: string;
  label: string;
  /** Uncontrolled seed. A number is printed with the decimal comma; a string is
   *  used verbatim (pass the raw URL param when echoing user input). */
  defaultValue?: number | string;
  /** Controlled value, for a client Panel that owns the state. Typing is never
   *  fought: the text is only rewritten when this number actually changes. */
  value?: number;
  /** `value` is null while the text does not parse to a number. */
  onValueChange?: (value: number | null, raw: string) => void;
  /** Clamped on blur, and shown next to the label. */
  min?: number;
  max?: number;
  /** Unit suffix rendered inside the field, e.g. "m", "lm", "px". */
  unit?: string;
  /** Helper line under the field. */
  hint?: string;
  /** Fixed decimals when printing a numeric value, e.g. 1 → "7,0". */
  decimals?: number;
  /**
   * Keep the label for assistive tech but hide it visually. Used when a
   * `QuickPicks` row directly above already carries the same visible label —
   * the chips have to precede the field in the DOM, so the field cannot own the
   * heading without stranding the chips above an unlabelled row.
   */
  labelHidden?: boolean;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Input text never groups thousands — "4000", not "4.000", so the submitted
 *  GET param survives a round trip through parseNum. */
function toInputText(value: number, decimals?: number): string {
  if (!Number.isFinite(value)) return "";
  const text =
    decimals === undefined
      ? String(value)
      : value.toFixed(Math.min(20, Math.max(0, Math.trunc(decimals))));
  return text.replace(".", ",");
}

function rangeText(min?: number, max?: number): string | undefined {
  if (min !== undefined && max !== undefined) return `${fmt(min)}–${fmt(max)}`;
  if (min !== undefined) return `min ${fmt(min)}`;
  if (max !== undefined) return `maks ${fmt(max)}`;
  return undefined;
}

/**
 * Numeric input for the calculators. It is a real `<input name>` inside the
 * shell's GET form, renders its value into the server HTML, and accepts both
 * Indonesian ("7,5") and canonical ("7.5") decimal registers. Out-of-range or
 * unparseable text self-heals on blur rather than raising an error message.
 */
export function NumberField({
  name,
  label,
  defaultValue,
  value,
  onValueChange,
  min,
  max,
  unit,
  hint,
  decimals,
  labelHidden,
  id,
  required,
  disabled,
  className,
}: NumberFieldProps) {
  const reactId = useId();
  const fieldId = id ?? `nf${reactId}`;
  const hintId = `${fieldId}-hint`;
  const unitId = `${fieldId}-unit`;
  const rangeId = `${fieldId}-range`;

  const seed =
    value !== undefined
      ? toInputText(value, decimals)
      : typeof defaultValue === "number"
        ? toInputText(defaultValue, decimals)
        : (defaultValue ?? "");

  const [text, setText] = useState<string>(seed);
  const [external, setExternal] = useState<number | undefined>(value);
  const lastValid = useRef<number>(parseNum(seed, value ?? min ?? 0));

  // Re-sync from the parent only when the number itself changed (React's
  // "adjusting state when a prop changes" pattern — no effect, no flicker).
  if (value !== undefined && value !== external) {
    setExternal(value);
    if (parseNum(text, Number.NaN) !== value) {
      setText(toInputText(value, decimals));
      lastValid.current = value;
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setText(next);
    const parsed = parseNum(next, Number.NaN);
    if (Number.isFinite(parsed)) lastValid.current = parsed;
    onValueChange?.(Number.isFinite(parsed) ? parsed : null, next);
  };

  const handleBlur = () => {
    const parsed = parseNum(text, Number.NaN);
    const settled = Number.isFinite(parsed)
      ? clampNum(parsed, min, max, lastValid.current)
      : clampNum(lastValid.current, min, max, min ?? 0);
    if (settled === parsed) return;
    const settledText = toInputText(settled, decimals);
    lastValid.current = settled;
    setText(settledText);
    onValueChange?.(settled, settledText);
  };

  const range = rangeText(min, max);
  const describedBy =
    [range ? rangeId : null, unit ? unitId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(
          "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1",
          labelHidden && "sr-only",
        )}
      >
        <label
          htmlFor={fieldId}
          className="body-sm font-medium text-foreground"
        >
          {label}
        </label>
        {range ? (
          <span
            id={rangeId}
            className="font-mono text-[0.75rem] leading-none tracking-[0.02em] tabular-nums text-muted-foreground"
          >
            {range}
          </span>
        ) : null}
      </div>

      <div className={cn("relative", !labelHidden && "mt-2")}>
        <input
          id={fieldId}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="go"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-md border border-input bg-background px-3 font-mono text-base tabular-nums text-foreground",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            unit && "pr-12",
          )}
        />
        {unit ? (
          <span
            id={unitId}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[0.8125rem] leading-none tracking-[0.02em] text-muted-foreground"
          >
            {unit}
          </span>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} className="caption mt-2 text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
