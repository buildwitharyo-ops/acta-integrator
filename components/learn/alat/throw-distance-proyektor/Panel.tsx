"use client";

import { useEffect, useRef, useState } from "react";
import { ChoiceCards } from "@/components/learn/alat/_shared/ChoiceCards";
import { NumberField } from "@/components/learn/alat/_shared/NumberField";
import { SelectField } from "@/components/learn/alat/_shared/SelectField";
import { fmtFixed, fmtInt } from "@/lib/learn/format";
import { cn } from "@/lib/utils";
import {
  AMBIENT_LEVELS,
  ASPECT_IDS,
  deriveScreen,
  LIMITS,
  type AmbientLevel,
  type AspectRatioId,
  type ThrowInput,
  type ThrowMode,
} from "./calc";
import { FIELDS } from "./copy.id";
import { PARAM, serializeParams, TOOL_PATH } from "./params";

export type ThrowPanelProps = {
  /** Parsed from the URL by the route, or the default preset. */
  initial: ThrowInput;
  /** Bare tool path — must match the shell's form action. */
  path?: string;
  className?: string;
};

/** Canonical dot-decimal spelling for the hidden continuity inputs. */
function canonical(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(4))) : "";
}

/* A <select> can only ever emit one of its own option values, but the state is
   narrowed rather than cast so a mangled DOM cannot poison the URL codec. */

function toMode(value: string, fallback: ThrowMode): ThrowMode {
  return value === "jarak" || value === "lebar" ? value : fallback;
}

function toAspect(value: string, fallback: AspectRatioId): AspectRatioId {
  return ASPECT_IDS.find((id) => id === value) ?? fallback;
}

function toAmbient(value: string, fallback: AmbientLevel): AmbientLevel {
  return AMBIENT_LEVELS.find((level) => level === value) ?? fallback;
}

/**
 * The interactive layer of the throw + brightness calculator.
 *
 * Inputs only (03-UI §12.1). The authoritative result is server-rendered from
 * `searchParams`, so this component never computes the answer on screen — it
 * owns field state, keeps the URL share-ready, and hands the native GET form
 * everything it needs.
 *
 * Two hard constraints, both from §12.1 and §12.6:
 *
 * - **`history.replaceState`, never `router.push`.** A push per keystroke means
 *   an RSC fetch per keystroke, which destroys INP on the mid-range Android this
 *   platform is built for. The URL is kept current for sharing; the result is
 *   recomputed by the server on submit.
 * - **It degrades completely.** Every field is a real `<input name>`/`<select
 *   name>` inside the shell's `<form method="GET">`, and this component
 *   server-renders its own markup, so with JavaScript disabled the native submit
 *   still produces a correct, fully server-computed answer.
 */
export function Panel({ initial, path = TOOL_PATH, className }: ThrowPanelProps) {
  const [values, setValues] = useState<ThrowInput>(initial);
  const touched = useRef(false);

  const query = serializeParams(values);
  const initialQuery = serializeParams(initial);
  const dirty = query !== initialQuery;

  // Debounced so a fast typist does not write one history entry per keystroke,
  // and so the aria-live result region is never re-announced mid-word.
  useEffect(() => {
    if (!touched.current) return;
    const timer = window.setTimeout(() => {
      const href = query ? `${path}?${query}` : path;
      window.history.replaceState(
        window.history.state,
        "",
        `${href}${window.location.hash}`,
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, path]);

  const update = (patch: Partial<ThrowInput>) => {
    touched.current = true;
    setValues((current) => ({ ...current, ...patch }));
  };

  const solvedWidth =
    values.mode === "lebar"
      ? values.throwDistanceM / values.throwRatio
      : values.screenWidthM;
  const screen = deriveScreen(solvedWidth, values.aspect);
  const solvedDistance =
    values.mode === "lebar"
      ? values.throwDistanceM
      : values.throwRatio * screen.widthM;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Light first. It is the single biggest lever on the answer, it is the one
          thing the reader knows without a datasheet, and as cards the three levels
          teach the trade-off instead of hiding it inside a closed dropdown. */}
      <ChoiceCards
        name={PARAM.ambient}
        label={FIELDS.ambient.label}
        options={FIELDS.ambient.cards}
        value={values.ambient}
        onValueChange={(value) => {
          update({ ambient: toAmbient(value, values.ambient) });
        }}
      />

      <fieldset className="min-w-0 border-0 p-0">
        <legend className="body-sm font-medium text-foreground">
          {FIELDS.opticsLabel}
        </legend>
        <div className="mt-2.5 space-y-3">
          <SelectField
            name={PARAM.mode}
            label={FIELDS.mode.label}
            options={FIELDS.mode.options}
            value={values.mode}
            onValueChange={(value) => {
              update({ mode: toMode(value, values.mode) });
            }}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              name={PARAM.throwRatio}
              label={FIELDS.throwRatio.label}
              unit={FIELDS.throwRatio.unit}
              min={LIMITS.throwRatio.min}
              max={LIMITS.throwRatio.max}
              value={values.throwRatio}
              onValueChange={(value) => {
                if (value !== null) update({ throwRatio: value });
              }}
            />

            {values.mode === "lebar" ? (
              <>
                <NumberField
                  name={PARAM.throwDistance}
                  label={FIELDS.throwDistance.label}
                  unit={FIELDS.throwDistance.unit}
                  min={LIMITS.throwDistanceM.min}
                  max={LIMITS.throwDistanceM.max}
                  value={values.throwDistanceM}
                  onValueChange={(value) => {
                    if (value !== null) update({ throwDistanceM: value });
                  }}
                />
                {/* Continuity: switching back to "jarak" keeps the width just solved. */}
                <input
                  type="hidden"
                  name={PARAM.screenWidth}
                  value={canonical(screen.widthM)}
                />
              </>
            ) : (
              <>
                <NumberField
                  name={PARAM.screenWidth}
                  label={FIELDS.screenWidth.label}
                  unit={FIELDS.screenWidth.unit}
                  min={LIMITS.screenWidthM.min}
                  max={LIMITS.screenWidthM.max}
                  value={values.screenWidthM}
                  onValueChange={(value) => {
                    if (value !== null) update({ screenWidthM: value });
                  }}
                />
                {/* Continuity: switching to "lebar" keeps the distance just solved. */}
                <input
                  type="hidden"
                  name={PARAM.throwDistance}
                  value={canonical(solvedDistance)}
                />
              </>
            )}
          </div>

          <p className="caption text-muted-foreground">
            <span className="font-mono tabular-nums">
              {FIELDS.derived({
                width: fmtFixed(screen.widthM, 2),
                height: fmtFixed(screen.heightM, 2),
                diagonalInch: fmtInt(screen.diagonalInch),
              })}
            </span>
          </p>
        </div>
      </fieldset>

      <NumberField
        name={PARAM.lumens}
        label={FIELDS.lumens.label}
        unit={FIELDS.lumens.unit}
        hint={FIELDS.lumens.hint}
        min={LIMITS.lumens.min}
        max={LIMITS.lumens.max}
        value={values.lumens}
        onValueChange={(value) => {
          if (value !== null) update({ lumens: value });
        }}
      />

      <details className="group rounded-md border border-border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <svg
            aria-hidden
            viewBox="0 0 10 10"
            className="h-2.5 w-2.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
          >
            <path d="M2 1 L7 5 L2 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="body-sm font-medium text-foreground">
            {FIELDS.advancedSummary}
          </span>
        </summary>
        <div className="space-y-5 border-t border-border px-3 py-4">
          <SelectField
            name={PARAM.aspect}
            label={FIELDS.aspect.label}
            hint={FIELDS.aspect.hint}
            options={FIELDS.aspect.options}
            value={values.aspect}
            onValueChange={(value) => {
              update({ aspect: toAspect(value, values.aspect) });
            }}
          />

          <NumberField
            name={PARAM.gain}
            label={FIELDS.gain.label}
            unit={FIELDS.gain.unit}
            hint={FIELDS.gain.hint}
            min={LIMITS.gain.min}
            max={LIMITS.gain.max}
            value={values.gain}
            onValueChange={(value) => {
              if (value !== null) update({ gain: value });
            }}
          />
        </div>
      </details>

      {dirty ? (
        <p
          role="status"
          className="caption rounded-sm border border-border px-3 py-2 text-muted-foreground"
        >
          {FIELDS.dirtyNotice}
        </p>
      ) : null}
    </div>
  );
}
