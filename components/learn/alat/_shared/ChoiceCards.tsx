"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export type ChoiceOption = {
  /** Submitted as the GET param value — short and URL-safe. */
  value: string;
  /** The plain-Bahasa question answer, e.g. "Rapat & presentasi". */
  label: string;
  /** One line of concrete examples. Keep it under ~60 characters. */
  description?: string;
  /** Right-aligned mono badge, e.g. "6H" — the engineering value behind the plain label. */
  badge?: string;
};

export type ChoiceCardsProps = {
  /** GET param name — this field participates in the native form. Required. */
  name: string;
  label: string;
  options: readonly ChoiceOption[];
  /** Uncontrolled seed (server render / no-JS path). */
  defaultValue?: string;
  /** Controlled value, for a client Panel that owns the state. */
  value?: string;
  onValueChange?: (value: string) => void;
  hint?: string;
  /** Side-by-side instead of stacked. Use only for 2–3 short options. */
  columns?: 1 | 2 | 3;
  className?: string;
};

const COLUMN_CLASS: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

/**
 * The primary question control: native radios painted as tappable cards.
 *
 * Not a Radix RadioGroup and not buttons — radios are the only version that
 * submits and restores correctly with JavaScript disabled (§12.6), and
 * `peer-checked:` paints the selection from CSS alone, so the server HTML is
 * already correct before hydration.
 *
 * This replaces a `<select>` wherever the choice is one the reader has to
 * *understand* rather than merely pick: a collapsed dropdown hides the options
 * that teach, and on a phone it costs a modal round trip per answer.
 */
export function ChoiceCards({
  name,
  label,
  options,
  defaultValue,
  value,
  onValueChange,
  hint,
  columns = 1,
  className,
}: ChoiceCardsProps) {
  const groupId = useId();
  const hintId = `${groupId}-hint`;
  const controlled = value !== undefined;

  return (
    <fieldset className={cn("min-w-0 border-0 p-0", className)}>
      <legend className="body-sm font-medium text-foreground">{label}</legend>
      <div className={cn("mt-2.5 grid gap-2", COLUMN_CLASS[columns])}>
        {options.map((option) => (
          <label key={option.value} className="relative block">
            <input
              type="radio"
              name={name}
              value={option.value}
              aria-describedby={hint ? hintId : undefined}
              onChange={() => onValueChange?.(option.value)}
              {...(controlled
                ? { checked: value === option.value }
                : { defaultChecked: option.value === defaultValue })}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-input px-3 py-2.5",
                "transition-colors peer-hover:border-primary/40 peer-hover:bg-muted/40",
                "peer-checked:border-primary/60 peer-checked:bg-primary/[0.07]",
                "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card",
              )}
            >
              <span className="min-w-0">
                <span className="body-sm block font-medium text-foreground">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="caption mt-0.5 block text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </span>
              {option.badge ? (
                <span className="shrink-0 font-mono text-[0.75rem] leading-none tracking-[0.02em] tabular-nums text-muted-foreground">
                  {option.badge}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {hint ? (
        <p id={hintId} className="caption mt-2 text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
