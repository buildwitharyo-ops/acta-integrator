"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ChoiceCards } from "@/components/learn/alat/_shared/ChoiceCards";
import { NumberField } from "@/components/learn/alat/_shared/NumberField";
import { QuickPicks } from "@/components/learn/alat/_shared/QuickPicks";
import { SelectField } from "@/components/learn/alat/_shared/SelectField";
import { fmt } from "@/lib/learn/format";
import { cn } from "@/lib/utils";
import {
  ASPECT_IDS,
  COMMERCIAL_PANEL_SIZES_IN,
  computeScreenSize,
  type AspectId,
  type ElementHeightPercent,
  type ScreenSizeInput,
  type SolveFor,
  type VerticalResolution,
  type ViewingModel,
} from "./calc";
import { UKURAN_LAYAR_COPY as C, TOOL_PATH } from "./copy.id";
import { PARAM_KEYS, PARAM_RANGES, screenSizeHref } from "./params";

export type PanelProps = {
  /** The input the server computed the visible result from. */
  initial: ScreenSizeInput;
  /** Bare tool path used when rewriting the URL. */
  basePath?: string;
  className?: string;
};

const ASPECT_OPTIONS = ASPECT_IDS.map((id) => ({
  value: id,
  label: C.aspectLabels[id],
}));

/** The depths Indonesian rooms actually come in — one tap instead of typing. */
const DISTANCE_PICKS = [4, 5, 6, 8, 10, 12].map((m) => ({
  value: String(m),
  label: `${m} m`,
}));

const PANEL_PICKS = COMMERCIAL_PANEL_SIZES_IN.map((size) => ({
  value: String(size),
  label: `${size}"`,
}));

function sameInput(a: ScreenSizeInput, b: ScreenSizeInput): boolean {
  return (
    a.solveFor === b.solveFor &&
    a.model === b.model &&
    a.farthestViewerM === b.farthestViewerM &&
    a.plannedDiagonalIn === b.plannedDiagonalIn &&
    a.elementHeightPercent === b.elementHeightPercent &&
    a.verticalResolution === b.verticalResolution &&
    a.displayAspect === b.displayAspect &&
    a.contentAspect === b.contentAspect &&
    a.closestViewerM === b.closestViewerM &&
    a.ceilingHeightM === b.ceilingHeightM &&
    a.eyeHeightM === b.eyeHeightM
  );
}

const ZONE_PREVIEW_TONE = {
  nyaman: "text-status-text",
  terbaca: "text-accent-text",
  jauh: "text-destructive",
} as const;

/**
 * Inputs only (03-UI §12.1). The server owns the authoritative result, the math
 * panel and the diagram; this component owns the fields, the shareable URL, and a
 * debounced live summary so an edit answers instantly without an RSC round trip.
 *
 * Four properties are load-bearing:
 *
 *  - **It is server-rendered.** Next renders client components on the server, so
 *    every field, its value and the segmented control are in the initial HTML.
 *    With JavaScript off, the native GET form in `WidgetShell` still submits and
 *    the server still computes (§12.6). `next/dynamic({ssr:false})` is banned here.
 *  - **`history.replaceState`, never `router.push`.** One RSC fetch per keystroke
 *    would destroy INP. The URL is rewritten 300 ms after typing stops, so the
 *    link in the address bar is always the room currently on screen.
 *  - **Uncontrolled fields.** The DOM owns the text; React mirrors it. Typing is
 *    never fought, and the value that gets submitted natively is the one the user
 *    can see. The two numeric fields are the exception — the quick-pick chips have
 *    to be able to move them, so they are controlled.
 *  - **Four questions, not twelve.** Everything that is not distance, content,
 *    panel or ceiling now lives behind `Setelan lanjutan`. The fields did not go
 *    away and the params did not change; they simply stopped being the first
 *    thing a facility manager has to read.
 */
export function Panel({ initial, basePath = TOOL_PATH, className }: PanelProps) {
  const [input, setInput] = useState<ScreenSizeInput>(initial);
  const [settled, setSettled] = useState<ScreenSizeInput>(initial);
  const summaryId = useId();

  useEffect(() => {
    // Reference equality: true only on the first render, so an untouched page
    // never rewrites its own URL.
    if (input === initial) return;
    const timer = setTimeout(() => {
      setSettled(input);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", screenSizeHref(input, basePath));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [input, initial, basePath]);

  const dirty = !sameInput(settled, initial);
  const preview = useMemo(() => computeScreenSize(settled), [settled]);

  const patch = (next: Partial<ScreenSizeInput>) =>
    setInput((current) => ({ ...current, ...next }));

  const isAdm = input.model === "adm";

  return (
    <div className={cn("space-y-6", className)}>
      <SegmentedRadio
        name={PARAM_KEYS.solveFor}
        label={C.fields.solve.label}
        options={C.fields.solve.options}
        defaultValue={initial.solveFor}
        onValueChange={(value) => patch({ solveFor: value as SolveFor })}
      />

      {/* Chips FIRST, then the field they drive — see QuickPicks: on the no-JS
          path a chip click sends the param twice and the codec keeps the first. */}
      <div className="space-y-2">
        <QuickPicks
          name={PARAM_KEYS.farthestViewerM}
          label={C.fields.farthestViewer.label}
          meta={`${PARAM_RANGES.farthestViewerM.min}–${PARAM_RANGES.farthestViewerM.max} m`}
          picks={DISTANCE_PICKS}
          active={String(input.farthestViewerM)}
          onPick={(value) => patch({ farthestViewerM: Number(value) })}
        />
        <NumberField
          name={PARAM_KEYS.farthestViewerM}
          label={C.fields.farthestViewer.label}
          labelHidden
          value={input.farthestViewerM}
          decimals={1}
          min={PARAM_RANGES.farthestViewerM.min}
          max={PARAM_RANGES.farthestViewerM.max}
          unit={C.fields.farthestViewer.unit}
          hint={C.fields.farthestViewer.hint}
          onValueChange={(value) =>
            value !== null ? patch({ farthestViewerM: value }) : undefined
          }
        />
      </div>

      <ChoiceCards
        name={PARAM_KEYS.elementHeightPercent}
        label={C.fields.contentClass.label}
        options={C.fields.contentClass.options}
        value={String(input.elementHeightPercent)}
        {...(isAdm ? { hint: C.fields.contentClass.hintInactive } : {})}
        onValueChange={(value) =>
          patch({ elementHeightPercent: Number(value) as ElementHeightPercent })
        }
      />

      <div className="space-y-2">
        <QuickPicks
          name={PARAM_KEYS.plannedDiagonalIn}
          label={C.fields.plannedDiagonal.label}
          meta={`${PARAM_RANGES.plannedDiagonalIn.min}–${PARAM_RANGES.plannedDiagonalIn.max} inci`}
          picks={PANEL_PICKS}
          active={String(input.plannedDiagonalIn)}
          onPick={(value) => patch({ plannedDiagonalIn: Number(value) })}
        />
        <NumberField
          name={PARAM_KEYS.plannedDiagonalIn}
          label={C.fields.plannedDiagonal.label}
          labelHidden
          value={input.plannedDiagonalIn}
          decimals={0}
          min={PARAM_RANGES.plannedDiagonalIn.min}
          max={PARAM_RANGES.plannedDiagonalIn.max}
          unit={C.fields.plannedDiagonal.unit}
          onValueChange={(value) =>
            value !== null ? patch({ plannedDiagonalIn: value }) : undefined
          }
        />
      </div>

      <NumberField
        name={PARAM_KEYS.ceilingHeightM}
        label={C.fields.ceilingHeight.label}
        defaultValue={initial.ceilingHeightM}
        decimals={1}
        min={PARAM_RANGES.ceilingHeightM.min}
        max={PARAM_RANGES.ceilingHeightM.max}
        unit={C.fields.ceilingHeight.unit}
        hint={C.fields.ceilingHeight.hint}
        onValueChange={(value) =>
          value !== null ? patch({ ceilingHeightM: value }) : undefined
        }
      />

      {/* Still inside the form, so every advanced field submits with zero JS. */}
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
            {C.fields.advancedSummary}
          </span>
        </summary>

        <div className="space-y-5 border-t border-border px-3 py-4">
          <SelectField
            name={PARAM_KEYS.model}
            label={C.fields.model.label}
            options={C.fields.model.options}
            defaultValue={initial.model}
            hint={C.fields.model.hint}
            onValueChange={(value) => patch({ model: value as ViewingModel })}
          />

          <SelectField
            name={PARAM_KEYS.verticalResolution}
            label={C.fields.verticalResolution.label}
            options={C.fields.verticalResolution.options}
            defaultValue={String(initial.verticalResolution)}
            hint={
              isAdm
                ? C.fields.verticalResolution.hint
                : C.fields.verticalResolution.hintInactive
            }
            onValueChange={(value) =>
              patch({ verticalResolution: Number(value) as VerticalResolution })
            }
          />

          <SelectField
            name={PARAM_KEYS.displayAspect}
            label={C.fields.displayAspect.label}
            options={ASPECT_OPTIONS}
            defaultValue={initial.displayAspect}
            onValueChange={(value) => patch({ displayAspect: value as AspectId })}
          />

          <SelectField
            name={PARAM_KEYS.contentAspect}
            label={C.fields.contentAspect.label}
            options={ASPECT_OPTIONS}
            defaultValue={initial.contentAspect}
            hint={C.fields.contentAspect.hint}
            onValueChange={(value) => patch({ contentAspect: value as AspectId })}
          />

          <NumberField
            name={PARAM_KEYS.closestViewerM}
            label={C.fields.closestViewer.label}
            defaultValue={
              initial.closestViewerM === null ? "" : initial.closestViewerM
            }
            decimals={1}
            unit={C.fields.closestViewer.unit}
            hint={C.fields.closestViewer.hint}
            onValueChange={(value, raw) =>
              patch({
                closestViewerM:
                  raw.trim() === "" ? null : value !== null && value > 0 ? value : null,
              })
            }
          />

          <NumberField
            name={PARAM_KEYS.eyeHeightM}
            label={C.fields.eyeHeight.label}
            defaultValue={initial.eyeHeightM}
            decimals={2}
            min={PARAM_RANGES.eyeHeightM.min}
            max={PARAM_RANGES.eyeHeightM.max}
            unit={C.fields.eyeHeight.unit}
            onValueChange={(value) =>
              value !== null ? patch({ eyeHeightM: value }) : undefined
            }
          />
        </div>
      </details>

      {/* Always mounted so the live region is registered before it first fills;
          an empty div renders nothing. Updates arrive on the 300 ms debounce, so
          nothing is announced per keystroke. */}
      <div
        aria-live="polite"
        className={cn(
          dirty && "rounded-md border border-primary/40 bg-primary/5 p-4",
        )}
      >
        {dirty ? (
          <>
            <p id={`${summaryId}-title`} className="mono-label text-muted-foreground">
              {C.panel.liveTitle}
            </p>
            {preview.status === "refused" ? (
              <p className="body-sm mt-3 text-foreground">{C.panel.liveRefused}</p>
            ) : (
              <>
                <p className="mt-3 flex flex-wrap items-baseline gap-x-2 font-mono text-2xl leading-none tabular-nums text-foreground">
                  <span className="font-medium">{preview.headline.value}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {preview.headline.unit}
                  </span>
                </p>
                <p
                  className={cn(
                    "body-sm mt-2",
                    ZONE_PREVIEW_TONE[preview.comfort.zone],
                  )}
                >
                  {`${C.zones[preview.comfort.zone].short} — ${fmt(preview.comfort.ratio)}× tinggi gambar`}
                </p>
                <p className="caption mt-3 text-muted-foreground">
                  {C.panel.liveHint}
                </p>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────── the segmented control ──────────────────────────── */

type SegmentedRadioProps = {
  name: string;
  label: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
  defaultValue: string;
  onValueChange: (value: string) => void;
};

/**
 * Native radios, styled as segments. Not a Radix ToggleGroup and not a button
 * group: radios are the only version that submits and restores correctly with
 * JavaScript disabled, and `peer-checked:` paints the selected segment from CSS
 * alone, so the server HTML already looks right.
 */
function SegmentedRadio({
  name,
  label,
  hint,
  options,
  defaultValue,
  onValueChange,
}: SegmentedRadioProps) {
  const groupId = useId();
  const hintId = `${groupId}-hint`;

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="body-sm font-medium text-foreground">{label}</legend>
      <div
        role="presentation"
        className="mt-2 grid grid-cols-2 gap-1 rounded-md border border-input p-1"
      >
        {options.map((option) => (
          <label key={option.value} className="relative block">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              aria-describedby={hint ? hintId : undefined}
              onChange={() => onValueChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex min-h-9 cursor-pointer items-center justify-center rounded-sm px-3 text-center",
                "body-sm text-muted-foreground transition-colors",
                "peer-hover:text-foreground",
                "peer-checked:bg-primary/10 peer-checked:text-accent-text peer-checked:ring-1 peer-checked:ring-primary/45",
                "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
              )}
            >
              {option.label}
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
