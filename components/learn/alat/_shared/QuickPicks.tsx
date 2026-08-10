"use client";

import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

export type QuickPick = {
  /** Submitted as the GET param value. */
  value: string;
  /** Chip face, e.g. `65"`. */
  label: string;
};

export type QuickPicksProps = {
  /** Same GET param name as the field these chips drive. */
  name: string;
  /**
   * Group name. Because the chips must render BEFORE their field (see below),
   * this doubles as the visible label for the whole distance/size question —
   * the field underneath carries the same text as an `sr-only` label, so the
   * chips never look orphaned above an unlabelled row.
   */
  label: string;
  /** Set false to keep `label` for screen readers only. */
  showLabel?: boolean;
  /** Right-aligned mono hint, e.g. the field's allowed range. */
  meta?: string;
  picks: readonly QuickPick[];
  /** Chip currently matching the field's value, so it can be painted as active. */
  active?: string;
  /** Called instead of submitting whenever JavaScript is running. */
  onPick?: (value: string) => void;
  className?: string;
};

/**
 * One-tap presets for a numeric field — "the six sizes distributors actually
 * stock", rather than making the reader know that 86" exists.
 *
 * Each chip is a real `<button type="submit" name value>`, which is what makes
 * this work with JavaScript disabled: only the *activated* submit button
 * contributes its name/value pair, so clicking a chip submits the form with that
 * value while the ordinary Hitung button submits whatever is typed in the field.
 *
 * Ordering is load-bearing on the no-JS path. These chips must render BEFORE the
 * field they drive, because a chip click sends the param twice (once from the
 * button, once from the field) and the URL codec keeps the FIRST occurrence.
 * With JavaScript on, `onPick` preempts the submit entirely and just moves state.
 */
export function QuickPicks({
  name,
  label,
  showLabel = true,
  meta,
  picks,
  active,
  onPick,
  className,
}: QuickPicksProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>, value: string) => {
    if (!onPick) return; // no handler → let the native submit happen
    event.preventDefault();
    onPick(value);
  };

  return (
    <div className={cn("min-w-0", className)}>
      {showLabel ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="body-sm font-medium text-foreground">{label}</p>
          {meta ? (
            <span className="font-mono text-[0.75rem] leading-none tracking-[0.02em] tabular-nums text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="sr-only">{label}</p>
      )}
      <div className={cn("flex flex-wrap gap-1.5", showLabel && "mt-2")}>
        {picks.map((pick) => {
          const isActive = active === pick.value;
          return (
            <button
              key={pick.value}
              type="submit"
              name={name}
              value={pick.value}
              aria-pressed={isActive}
              onClick={(event) => handleClick(event, pick.value)}
              className={cn(
                "inline-flex h-9 min-w-11 items-center justify-center rounded-pill border px-3",
                "font-mono text-[0.8125rem] leading-none tabular-nums transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isActive
                  ? "border-primary/60 bg-primary/[0.12] text-accent-text"
                  : "border-input text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {pick.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
