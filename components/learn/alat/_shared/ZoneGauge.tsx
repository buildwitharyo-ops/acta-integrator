import { cn } from "@/lib/utils";
import type { ResultTone } from "./ResultReadout";

export type GaugeZone = {
  /** Short Bahasa label printed under the band, e.g. "Nyaman". */
  label: string;
  /**
   * Upper edge of the zone on the gauge's own scale. `null` marks the final,
   * open-ended zone — it always runs to `max`.
   */
  upTo: number | null;
  tone: ResultTone;
};

export type ZoneGaugeProps = {
  /** Mono eyebrow, e.g. "JARAK PANDANG". */
  label: string;
  /** Where the reader's room sits, on the same scale as the zones. */
  value: number;
  /** Already formatted, e.g. "6,6H" — this component never rounds. */
  valueLabel: string;
  /** Ascending by `upTo`; exactly one entry may carry `upTo: null`, and it must be last. */
  zones: readonly GaugeZone[];
  /** Right edge of the scale. Values beyond it pin to the edge. */
  max: number;
  /** Numbers printed on the axis under the zone edges, e.g. 6 → "6H". */
  ticks?: readonly { at: number; label: string }[];
  /** One short sentence under the band. */
  caption?: string;
  /**
   * The gauge's text twin. A band is a picture; screen readers, search engines
   * and printouts get this sentence instead (§12.7 — every diagram ships one).
   */
  description: string;
  id?: string;
  className?: string;
};

const BAND_TONE: Record<ResultTone, string> = {
  neutral: "bg-border",
  good: "bg-status/30",
  warning: "bg-primary/30",
  bad: "bg-destructive/25",
};

const EDGE_TONE: Record<ResultTone, string> = {
  neutral: "text-muted-foreground",
  good: "text-status-text",
  warning: "text-accent-text",
  bad: "text-destructive",
};

const MARKER_TONE: Record<ResultTone, string> = {
  neutral: "bg-foreground",
  good: "bg-status",
  warning: "bg-primary",
  bad: "bg-destructive",
};

function percent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/** The zone the value actually lands in — drives the marker colour. */
function zoneAt(value: number, zones: readonly GaugeZone[]): GaugeZone | undefined {
  return zones.find((zone) => zone.upTo === null || value <= zone.upTo) ?? zones.at(-1);
}

/**
 * A one-dimensional verdict band: where the reader's room sits between
 * "comfortable", "still readable" and "too far".
 *
 * This exists because a single threshold lies. AVIXA DISCAS, ISO 3382-1 and a
 * projector's lumen target all publish ONE number, and printing it as a pass/fail
 * gate produces advice the field contradicts — a 98" panel really is readable at
 * 8 m even though the 6H line falls at 7,3 m. The band keeps the standard's number
 * exactly where the standard puts it, and shows the tolerance around it instead of
 * pretending the tolerance does not exist.
 *
 * Pure presentation: no state, no JavaScript, no `motion/react` (§14.6 bans it
 * under /learn). Server-rendered, so it is in the HTML on the no-JS path too.
 */
export function ZoneGauge({
  label,
  value,
  valueLabel,
  zones,
  max,
  ticks,
  caption,
  description,
  id,
  className,
}: ZoneGaugeProps) {
  const here = zoneAt(value, zones);
  const markerLeft = percent(value, max);
  const pinned = value > max;

  let cursor = 0;
  const bands = zones.map((zone, index) => {
    const end = zone.upTo === null ? max : Math.min(zone.upTo, max);
    const width = Math.max(0, percent(end, max) - percent(cursor, max));
    cursor = end;
    return { ...zone, key: `${zone.label}-${index}`, width };
  });

  return (
    <figure id={id} className={cn("m-0 print:break-inside-avoid", className)}>
      {/* The band the reader landed in is named here, not only under the bar: a
          narrow band (RT60's 0,4–0,6 s target is ~10% of its scale) cannot hold
          its own label, and the verdict must never be the thing that gets
          truncated. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="mono-label text-muted-foreground">{label}</span>
        <span className="flex flex-wrap items-baseline gap-x-2">
          {here ? (
            <span
              className={cn(
                "font-mono text-[0.875rem] leading-none",
                EDGE_TONE[here.tone],
              )}
            >
              {`${here.label} ·`}
            </span>
          ) : null}
          <span
            className={cn(
              "font-mono text-[0.875rem] leading-none tabular-nums",
              here ? EDGE_TONE[here.tone] : "text-foreground",
            )}
          >
            {valueLabel}
          </span>
        </span>
      </div>

      {/* The band itself is decorative — `description` below carries the meaning. */}
      <div aria-hidden className="mt-3">
        <div className="relative h-2.5 w-full overflow-hidden rounded-sm bg-muted">
          <div className="absolute inset-0 flex">
            {bands.map((band) => (
              <span
                key={band.key}
                className={cn("h-full", BAND_TONE[band.tone])}
                style={{ width: `${band.width}%` }}
              />
            ))}
          </div>
        </div>

        {/* Marker sits in its own row so it can never be clipped by the band. */}
        <div className="relative h-4">
          <span
            className={cn(
              "absolute top-0 block h-3 w-0.5 -translate-x-1/2",
              here ? MARKER_TONE[here.tone] : "bg-foreground",
            )}
            style={{ left: `${markerLeft}%` }}
          />
        </div>

        {ticks && ticks.length > 0 ? (
          <div className="relative h-4">
            {ticks.map((tick) => (
              <span
                key={tick.label}
                className="absolute top-0 -translate-x-1/2 font-mono text-[0.6875rem] leading-none tabular-nums text-muted-foreground"
                style={{ left: `${percent(tick.at, max)}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        ) : null}

        {/* A legend, not labels sitting under their own bands.
            Band width is set by the data, and the most important band is often
            the narrowest — RT60's target range is ~10% of its scale, far too
            little to hold "Rentang target" without ellipsising it. A wrapped
            legend is legible at every band width, and the active entry is
            marked so the bar and the words agree. */}
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {bands.map((band) => {
            const active = band.label === here?.label;
            return (
              <li
                key={band.key}
                className={cn(
                  "flex items-center gap-1.5 font-mono text-[0.6875rem] leading-[1.4] tracking-[0.02em]",
                  active ? EDGE_TONE[band.tone] : "text-muted-foreground/70",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "block h-2 w-2 shrink-0 rounded-[1px]",
                    BAND_TONE[band.tone],
                    active && MARKER_TONE[band.tone],
                  )}
                />
                {band.label}
              </li>
            );
          })}
        </ul>
      </div>

      <figcaption className="sr-only">{description}</figcaption>
      {caption ? (
        <p className="body-sm mt-3 max-w-[52ch] text-muted-foreground">
          {caption}
          {pinned ? " Nilainya di luar skala — penanda ditahan di tepi kanan." : ""}
        </p>
      ) : null}
    </figure>
  );
}
