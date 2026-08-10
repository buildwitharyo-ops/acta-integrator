import { ReferenceTable } from "@/components/learn/alat/_shared/ReferenceTable";
import { fmt, fmtFixed, fmtUnit } from "@/lib/learn/format";
import { cn } from "@/lib/utils";
import { IMAGE_BOTTOM_MIN_M, type ScreenSizeAnswer } from "./calc";
import { UKURAN_LAYAR_COPY as C } from "./copy.id";

export type RoomSectionProps = {
  /** Only the `status: "ok"` branch has geometry to draw. */
  answer: ScreenSizeAnswer;
  id?: string;
  className?: string;
};

/* Drawing frame. Hand-authored for this one cross-section — there is no diagram
 * engine and no CMS authoring form (03-UI §12.7). */
const VIEWBOX_W = 800;
const VIEWBOX_H = 360;
const PAD = { left: 68, right: 30, top: 26, bottom: 52 };
const PLOT_W = VIEWBOX_W - PAD.left - PAD.right;
const PLOT_H = VIEWBOX_H - PAD.top - PAD.bottom;
const FLOOR_Y = VIEWBOX_H - PAD.bottom;
/** Panel thickness in drawing units — a wall section, not a scaled dimension. */
const PANEL_DEPTH = 7;

const STROKE_BORDER = "hsl(var(--border))";
const TEXT_MUTED = "hsl(var(--muted-foreground))";
const STROKE_ACCENT = "hsl(var(--primary))";
const STROKE_BAD = "hsl(var(--destructive))";

function metres(value: number): string {
  return `${fmt(value)} m`;
}

/**
 * Potongan Ruang — the room cross-section that renders the DISCAS result
 * (03-UI §12.7). Server component, inline SVG, `currentColor` + token strokes, no
 * JavaScript and nothing to animate, so `prefers-reduced-motion` has nothing to
 * respect. It ships a text twin: `role="img"` with `<title>`/`<desc>`, and a
 * visible table underneath carrying every parameter and computed value, so a
 * screen-reader user gets numbers instead of "graphic" and the diagram's data
 * stays retrievable as plain text.
 */
export function RoomSection({ answer, id, className }: RoomSectionProps) {
  const baseId = id ?? "ukuran-layar-potongan";
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  const { input, subject, distance, mounting } = answer;

  const depthM = distance.farthestViewerM + 1;
  const heightM = Math.max(
    input.ceilingHeightM,
    mounting.imageTopM + 0.2,
    input.eyeHeightM + 0.4,
  );
  const scale = Math.min(PLOT_W / depthM, PLOT_H / heightM);
  const originX = PAD.left + (PLOT_W - depthM * scale) / 2;

  const x = (m: number) => originX + m * scale;
  const y = (m: number) => FLOOR_Y - m * scale;

  const panelX = x(0);
  const panelFaceX = panelX + PANEL_DEPTH;
  const imageTopY = y(mounting.imageTopM);
  const imageBottomY = y(mounting.imageBottomM);
  const ceilingY = y(input.ceilingHeightM);
  const eyeY = y(input.eyeHeightM);
  const backX = x(depthM);

  const rows = [
    {
      p: C.diagram.rows.depth,
      v: `${fmtFixed(distance.farthestViewerM, 1)} m`,
      c: C.fields.farthestViewer.hint,
    },
    {
      p: C.diagram.rows.ceiling,
      v: `${fmtFixed(input.ceilingHeightM, 1)} m`,
      c: C.fields.ceilingHeight.hint,
    },
    {
      p: C.diagram.rows.requiredCeiling,
      v: metres(mounting.requiredCeilingM),
      c: mounting.ceilingFits
        ? C.diagram.notes.ceilingOk
        : C.diagram.notes.ceilingShort,
    },
    {
      p: C.diagram.rows.panel,
      v: `${fmt(subject.diagonalIn)}"`,
      c: C.availability[subject.availability].label,
    },
    {
      p: C.diagram.rows.imageHeight,
      v: metres(subject.imageHeightM),
      c: `${C.aspectLabels[input.contentAspect]} — ${C.fit[answer.fit.mode].label}`,
    },
    { p: C.diagram.rows.imageWidth, v: metres(subject.imageWidthM), c: "" },
    {
      p: C.diagram.rows.imageBottom,
      v: metres(mounting.imageBottomM),
      c: C.diagram.notes.bottomRule,
    },
    { p: C.diagram.rows.imageTop, v: metres(mounting.imageTopM), c: "" },
    {
      p: C.diagram.rows.eyeHeight,
      v: metres(input.eyeHeightM),
      c: C.diagram.notes.eyeHeight,
    },
    {
      p: C.diagram.rows.closestViewer,
      v: metres(distance.closestViewerM),
      c: distance.closestViewerIsAuto
        ? C.diagram.notes.closestAuto
        : C.diagram.notes.closestManual,
    },
    {
      p: C.diagram.rows.farthestViewer,
      v: `${fmtFixed(distance.farthestViewerM, 1)} m`,
      c: "",
    },
    {
      p: C.diagram.rows.verticalAngle,
      v: fmtUnit(mounting.verticalAngleTopDeg, "°"),
      c: C.diagram.notes.verticalAngle,
    },
  ];

  return (
    <figure id={id} className={cn("m-0 print:break-inside-avoid", className)}>
      <div
        role="group"
        aria-labelledby={titleId}
        tabIndex={0}
        className="overflow-x-auto rounded-md border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          className="block h-auto w-full min-w-[34rem] text-foreground"
        >
          <title id={titleId}>{C.diagram.title}</title>
          <desc id={descId}>
            {C.diagram.desc(
              fmtFixed(distance.farthestViewerM, 1),
              fmtFixed(input.ceilingHeightM, 1),
              fmt(subject.diagonalIn),
              fmt(subject.imageHeightM),
            )}
          </desc>

          {/* Ceiling */}
          <line
            x1={panelX}
            y1={ceilingY}
            x2={backX}
            y2={ceilingY}
            stroke={STROKE_BORDER}
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />
          {/* Floor */}
          <line
            x1={panelX}
            y1={FLOOR_Y}
            x2={backX}
            y2={FLOOR_Y}
            stroke={STROKE_BORDER}
            strokeWidth={1.75}
          />
          {/* Front wall */}
          <line
            x1={panelX}
            y1={FLOOR_Y}
            x2={panelX}
            y2={Math.min(ceilingY, imageTopY) - 6}
            stroke={STROKE_BORDER}
            strokeWidth={1.75}
          />
          {/* Eye level */}
          <line
            x1={panelFaceX}
            y1={eyeY}
            x2={backX}
            y2={eyeY}
            stroke={STROKE_BORDER}
            strokeWidth={1}
            strokeDasharray="3 6"
          />

          {/* Sightlines from the farthest eye to both edges of the image */}
          <g stroke={STROKE_ACCENT} strokeWidth={1} opacity={0.75}>
            <line
              x1={x(distance.farthestViewerM)}
              y1={eyeY}
              x2={panelFaceX}
              y2={imageTopY}
            />
            <line
              x1={x(distance.farthestViewerM)}
              y1={eyeY}
              x2={panelFaceX}
              y2={imageBottomY}
            />
          </g>

          {/* The image */}
          <rect
            x={panelX}
            y={imageTopY}
            width={PANEL_DEPTH}
            height={Math.max(imageBottomY - imageTopY, 1)}
            fill="currentColor"
            fillOpacity={0.14}
            stroke="currentColor"
            strokeWidth={1.5}
          />
          {/* The part of the image that has no ceiling to live under */}
          {!mounting.ceilingFits ? (
            <rect
              x={panelX}
              y={imageTopY}
              width={PANEL_DEPTH}
              height={Math.max(ceilingY - imageTopY, 1)}
              fill={STROKE_BAD}
              fillOpacity={0.22}
              stroke={STROKE_BAD}
              strokeWidth={1.5}
            />
          ) : null}

          {/* Viewers */}
          <Viewer
            cx={x(distance.closestViewerM)}
            eyeY={eyeY}
            label="TERDEPAN"
          />
          <Viewer
            cx={x(distance.farthestViewerM)}
            eyeY={eyeY}
            label="TERJAUH"
          />

          {/* Ceiling-height dimension, left of the wall */}
          <g stroke={STROKE_BORDER} strokeWidth={1}>
            <line x1={panelX - 16} y1={FLOOR_Y} x2={panelX - 16} y2={ceilingY} />
            <line x1={panelX - 21} y1={FLOOR_Y} x2={panelX - 11} y2={FLOOR_Y} />
            <line x1={panelX - 21} y1={ceilingY} x2={panelX - 11} y2={ceilingY} />
          </g>
          <text
            x={panelX - 25}
            y={(FLOOR_Y + ceilingY) / 2 + 4}
            textAnchor="end"
            fill={TEXT_MUTED}
            className="font-mono"
            fontSize={11}
          >
            {`${fmtFixed(input.ceilingHeightM, 1)} m`}
          </text>

          {/* Image-height and mounting-height labels, right of the panel */}
          <g stroke="currentColor" strokeWidth={1} opacity={0.6}>
            <line
              x1={panelFaceX + 12}
              y1={imageTopY}
              x2={panelFaceX + 12}
              y2={imageBottomY}
            />
            <line
              x1={panelFaceX + 7}
              y1={imageTopY}
              x2={panelFaceX + 17}
              y2={imageTopY}
            />
            <line
              x1={panelFaceX + 7}
              y1={imageBottomY}
              x2={panelFaceX + 17}
              y2={imageBottomY}
            />
          </g>
          <text
            x={panelFaceX + 22}
            y={(imageTopY + imageBottomY) / 2 + 4}
            fill="currentColor"
            className="font-mono"
            fontSize={11}
          >
            {metres(subject.imageHeightM)}
          </text>
          <text
            x={panelFaceX + 22}
            y={(imageBottomY + FLOOR_Y) / 2 + 4}
            fill={TEXT_MUTED}
            className="font-mono"
            fontSize={11}
          >
            {`${fmtFixed(IMAGE_BOTTOM_MIN_M, 1)} m`}
          </text>

          {/* Farthest-viewer dimension, under the floor */}
          <g stroke={STROKE_BORDER} strokeWidth={1}>
            <line
              x1={panelX}
              y1={FLOOR_Y + 20}
              x2={x(distance.farthestViewerM)}
              y2={FLOOR_Y + 20}
            />
            <line x1={panelX} y1={FLOOR_Y + 15} x2={panelX} y2={FLOOR_Y + 25} />
            <line
              x1={x(distance.farthestViewerM)}
              y1={FLOOR_Y + 15}
              x2={x(distance.farthestViewerM)}
              y2={FLOOR_Y + 25}
            />
          </g>
          <text
            x={(panelX + x(distance.farthestViewerM)) / 2}
            y={FLOOR_Y + 38}
            textAnchor="middle"
            fill={TEXT_MUTED}
            className="font-mono"
            fontSize={11}
          >
            {`${fmtFixed(distance.farthestViewerM, 1)} m ke mata penonton terjauh`}
          </text>
        </svg>
      </div>

      <figcaption className="caption mt-3 max-w-[64ch] text-muted-foreground">
        {C.diagram.caption}
      </figcaption>

      <ReferenceTable
        id={`${baseId}-tabel`}
        className="mt-5"
        caption={C.diagram.tableCaption}
        columns={[
          { key: "p", label: C.diagram.columns.parameter, width: "18rem" },
          { key: "v", label: C.diagram.columns.value, align: "right", mono: true },
          { key: "c", label: C.diagram.columns.note },
        ]}
        rows={rows}
        minWidth="38rem"
      />
    </figure>
  );
}

function Viewer({
  cx,
  eyeY,
  label,
}: {
  cx: number;
  eyeY: number;
  label: string;
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={eyeY}
        r={4.5}
        fill="currentColor"
        fillOpacity={0.18}
        stroke="currentColor"
        strokeWidth={1.25}
      />
      <line
        x1={cx}
        y1={eyeY + 6}
        x2={cx}
        y2={FLOOR_Y}
        stroke="currentColor"
        strokeWidth={1.25}
        opacity={0.55}
      />
      <text
        x={cx}
        y={eyeY - 12}
        textAnchor="middle"
        fill={TEXT_MUTED}
        className="font-mono"
        fontSize={10}
        letterSpacing="0.12em"
      >
        {label}
      </text>
    </g>
  );
}
