import Link from "next/link";
import { AssumptionsList } from "@/components/learn/alat/_shared/AssumptionsList";
import { ReferenceTable } from "@/components/learn/alat/_shared/ReferenceTable";
import { ResultReadout } from "@/components/learn/alat/_shared/ResultReadout";
import { ShowTheMath } from "@/components/learn/alat/_shared/ShowTheMath";
import { WidgetShell } from "@/components/learn/alat/_shared/WidgetShell";
import { RoomSection } from "@/components/learn/alat/ukuran-layar/RoomSection";
import { WaLearnCta } from "@/components/learn/cta/WaLearnCta";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { CornerTicks } from "@/components/shared/CornerTicks";
import { LEARN_TOOL_SLUGS, TOOL_REF_INDEX, TOOL_REF_JALUR, type LearnToolSlug } from "@/lib/learn/cta";
import { fmt, fmtFixed } from "@/lib/learn/format";
import {
  otherToolEntries,
  type ToolComputation,
  type ToolDiagram,
  type ToolEntry,
  type ToolFinding,
  type ToolReadout,
  type ToolTable,
} from "@/lib/learn/tool-registry";
import { cn } from "@/lib/utils";

/**
 * The calculator page body (03-UI §12.6).
 *
 * **The no-JS path is the primary implementation, not a fallback.** Everything
 * below is server-rendered text and SVG: the `<h1>` and its intro, the
 * `<form method="GET">` whose native submit reloads with params, the computed
 * result for those params (or for the default preset), the `<details>` math panel
 * with substituted numbers, the room section plus its data table, three fully
 * computed Indonesian rooms, the reference tables people bookmark, the FAQ as
 * plain headings and prose, and the standards list with a checked date. With
 * JavaScript disabled every one of those still works; JavaScript only replaces
 * the round-trip with a debounced URL rewrite.
 *
 * Nothing here imports `motion/react` — the §14.6 blacklist for `/learn/**` is
 * why `MeterDivider`, `SignalMeter` and `Reveal` are deliberately absent and the
 * dividers below are plain rules.
 *
 * The component is tool-agnostic: it renders the uniform `ToolComputation` the
 * registry produces, so adding a fourth calculator never edits this file.
 */

/** The editorial overlay from `learn_tools`, when a row exists. All optional. */
export type ToolRecordOverlay = {
  intro_md?: string | null;
  method_md?: string | null;
  standard_ref?: string | null;
  assumptions?: readonly string[] | null;
  worked_example_md?: string | null;
  related_slugs?: readonly string[] | null;
};

export type ToolPageBodyProps = {
  entry: ToolEntry;
  computation: ToolComputation;
  /**
   * The published `learn_tools` row. Optional on purpose: the arithmetic, the
   * method, the standards and the worked examples all live in the repo, so a
   * calculator whose CMS row has not been written yet still renders a complete,
   * correct page instead of a 404.
   */
  record?: ToolRecordOverlay | null;
  /** Lesson titles for `related_slugs`, keyed by slug. Missing keys are skipped. */
  relatedLessons?: Readonly<Record<string, string>>;
  className?: string;
};

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

/**
 * Renders CMS prose as paragraphs. Deliberately not a markdown parser and never
 * `dangerouslySetInnerHTML`: `learn_tools.*_md` is short editorial text, and a
 * calculator page must not grow an HTML injection surface to render two
 * paragraphs.
 */
function Prose({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
  if (paragraphs.length === 0) return null;
  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="body-md text-muted-foreground">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="max-w-[72ch]">
      {eyebrow ? <p className="mono-label text-muted-foreground">{eyebrow}</p> : null}
      <h2 id={id} className={cn("display-md", eyebrow && "mt-3")}>
        {title}
      </h2>
      {intro ? <p className="body-md mt-4 text-muted-foreground">{intro}</p> : null}
    </header>
  );
}

const FINDING_TONE: Record<ToolFinding["severity"], string> = {
  critical: "border-destructive/45",
  warning: "border-primary/45",
  info: "border-border",
};

const FINDING_LABEL: Record<ToolFinding["severity"], string> = {
  critical: "Kritis",
  warning: "Perhatian",
  info: "Catatan",
};

function toolSlugOf(key: string): LearnToolSlug | null {
  return LEARN_TOOL_SLUGS.find((slug) => slug === key) ?? null;
}

/* ------------------------------------------------------------------ *
 * Result region — the answer the server already computed
 * ------------------------------------------------------------------ */

function Readouts({ readouts }: { readouts: readonly ToolReadout[] }) {
  if (readouts.length === 0) return null;
  return (
    <div className="mt-8 grid gap-6 border-t border-border pt-7 sm:grid-cols-2">
      {readouts.map((readout) => (
        <ResultReadout
          key={readout.id}
          label={readout.label}
          value={readout.value}
          {...(readout.unit ? { unit: readout.unit } : {})}
          {...(readout.caption ? { caption: readout.caption } : {})}
          {...(readout.verdict ? { verdict: readout.verdict } : {})}
          tone={readout.tone}
          size={readout.size}
        />
      ))}
    </div>
  );
}

function Findings({ findings }: { findings: readonly ToolFinding[] }) {
  if (findings.length === 0) return null;
  return (
    <div className="mt-8 border-t border-border pt-7">
      <p className="mono-label text-muted-foreground">Temuan</p>
      <ul className="mt-4 space-y-4">
        {findings.map((finding) => (
          <li
            key={finding.id}
            className={cn(
              "border-l-2 pl-4 print:break-inside-avoid",
              FINDING_TONE[finding.severity],
            )}
          >
            <p className="body-sm font-medium text-foreground">
              <span className="mono-label mr-2 text-muted-foreground">
                {FINDING_LABEL[finding.severity]}
              </span>
              {finding.title}
            </p>
            <p className="body-sm mt-2 text-muted-foreground">{finding.detail}</p>
            {finding.href ? (
              <Link
                href={finding.href}
                className="body-sm mt-2 inline-flex min-h-11 items-center text-accent-text underline decoration-primary/40 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {finding.hrefLabel ?? "Lanjutkan →"}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultTables({ tables }: { tables: readonly ToolTable[] }) {
  if (tables.length === 0) return null;
  return (
    <div className="mt-8 space-y-8 border-t border-border pt-7">
      {tables.map((table) => (
        <ReferenceTable
          key={table.id}
          id={`hasil-${table.id}`}
          caption={table.caption}
          columns={table.columns}
          rows={table.rows}
          {...(table.note ? { note: table.note } : {})}
          {...(table.minWidth ? { minWidth: table.minWidth } : {})}
        />
      ))}
    </div>
  );
}

function ResultRegion({ computation }: { computation: ToolComputation }) {
  const { view } = computation;

  // A refused room prints no numbers at all — that is the point of refusing.
  if (view.refusal) {
    return (
      <div className="border-l-2 border-destructive pl-4">
        <p className="mono-label text-destructive">Perhitungan dihentikan</p>
        <p className="heading-md mt-3 text-foreground">{view.refusal.title}</p>
        <p className="body-md mt-3 text-muted-foreground">{view.refusal.detail}</p>
      </div>
    );
  }

  return (
    <>
      {view.lede ? (
        <p className="body-lg text-balance text-foreground">{view.lede}</p>
      ) : null}
      {view.headline ? (
        <ResultReadout
          className={view.lede ? "mt-7" : undefined}
          label={view.headline.label}
          value={view.headline.value}
          {...(view.headline.unit ? { unit: view.headline.unit } : {})}
          {...(view.headline.caption ? { caption: view.headline.caption } : {})}
          {...(view.headline.verdict ? { verdict: view.headline.verdict } : {})}
          tone={view.headline.tone}
          size="lg"
        />
      ) : null}
      <Readouts readouts={view.readouts} />
      <Findings findings={view.findings} />
      <ResultTables tables={view.tables} />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Diagrams — every one ships a text twin (§12.7)
 * ------------------------------------------------------------------ */

const STROKE_BORDER = "hsl(var(--border))";
const TEXT_MUTED = "hsl(var(--muted-foreground))";
const STROKE_ACCENT = "hsl(var(--primary))";

function DiagramFigure({
  id,
  title,
  desc,
  caption,
  tableCaption,
  rows,
  children,
  minWidth = "34rem",
}: {
  id: string;
  title: string;
  desc: string;
  caption: string;
  tableCaption: string;
  rows: readonly { label: string; value: string; note?: string }[];
  children: React.ReactNode;
  minWidth?: string;
}) {
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  return (
    <figure id={id} className="m-0 print:break-inside-avoid">
      <div
        role="group"
        aria-labelledby={titleId}
        tabIndex={0}
        className="overflow-x-auto rounded-md border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          viewBox="0 0 800 340"
          className="block h-auto w-full text-foreground"
          style={{ minWidth }}
        >
          <title id={titleId}>{title}</title>
          <desc id={descId}>{desc}</desc>
          {children}
        </svg>
      </div>
      <figcaption className="caption mt-3 text-muted-foreground">{caption}</figcaption>
      <div className="mt-5">
        <ReferenceTable
          id={`${id}-tabel`}
          caption={tableCaption}
          columns={[
            { key: "label", label: "Parameter", width: "20rem" },
            { key: "value", label: "Nilai", align: "right", mono: true },
            { key: "note", label: "Catatan" },
          ]}
          rows={rows.map((row) => ({
            label: row.label,
            value: row.value,
            note: row.note ?? "",
          }))}
          minWidth="38rem"
        />
      </div>
    </figure>
  );
}

/** Acoustic room section: the box, its three material surfaces, and Dc. */
function AcousticSection({
  diagram,
}: {
  diagram: Extract<ToolDiagram, { kind: "potongan-akustik" }>;
}) {
  const PAD = { left: 92, right: 40, top: 34, bottom: 62 };
  const floorY = 340 - PAD.bottom;
  const plotW = 800 - PAD.left - PAD.right;
  const plotH = floorY - PAD.top;
  const scale = Math.min(plotW / diagram.lengthM, plotH / diagram.heightM);
  const originX = PAD.left + (plotW - diagram.lengthM * scale) / 2;

  const x = (m: number) => originX + m * scale;
  const y = (m: number) => floorY - m * scale;

  const ceilingY = y(diagram.heightM);
  const backX = x(diagram.lengthM);
  const talkerX = x(Math.min(1.2, diagram.lengthM / 4));
  const headY = y(diagram.talkerHeightM);
  const dcRadius = diagram.criticalDistanceM * scale;

  return (
    <>
      {/* Room box */}
      <rect
        x={originX}
        y={ceilingY}
        width={backX - originX}
        height={floorY - ceilingY}
        fill="currentColor"
        fillOpacity={0.03}
        stroke={STROKE_BORDER}
        strokeWidth={1.75}
      />

      {/* Surface labels */}
      <text x={originX + 10} y={ceilingY + 18} fill={TEXT_MUTED} className="font-mono" fontSize={11}>
        {`PLAFON · ${diagram.ceilingLabel}`}
      </text>
      <text x={originX + 10} y={floorY - 10} fill={TEXT_MUTED} className="font-mono" fontSize={11}>
        {`LANTAI · ${diagram.floorLabel}`}
      </text>
      <text
        x={originX - 12}
        y={(ceilingY + floorY) / 2}
        fill={TEXT_MUTED}
        textAnchor="middle"
        className="font-mono"
        fontSize={11}
        transform={`rotate(-90 ${originX - 12} ${(ceilingY + floorY) / 2})`}
      >
        {`DINDING · ${diagram.wallLabel}`}
      </text>

      {/* Critical distance around the talker */}
      <circle
        cx={talkerX}
        cy={headY}
        r={Math.max(dcRadius, 2)}
        fill={STROKE_ACCENT}
        fillOpacity={0.08}
        stroke={STROKE_ACCENT}
        strokeWidth={1.25}
        strokeDasharray="5 5"
      />

      {/* Talker */}
      <g stroke="currentColor" strokeWidth={1.75} fill="none">
        <circle cx={talkerX} cy={headY} r={5} fill="currentColor" />
        <line x1={talkerX} y1={headY + 5} x2={talkerX} y2={floorY} />
      </g>
      <text
        x={talkerX + Math.max(dcRadius, 10) + 8}
        y={headY + 4}
        fill={STROKE_ACCENT}
        className="font-mono"
        fontSize={11}
      >
        {`Dc ${fmt(diagram.criticalDistanceM)} m`}
      </text>

      {/* Height dimension */}
      <g stroke={STROKE_BORDER} strokeWidth={1}>
        <line x1={originX - 46} y1={floorY} x2={originX - 46} y2={ceilingY} />
        <line x1={originX - 51} y1={floorY} x2={originX - 41} y2={floorY} />
        <line x1={originX - 51} y1={ceilingY} x2={originX - 41} y2={ceilingY} />
      </g>
      <text
        x={originX - 55}
        y={(floorY + ceilingY) / 2 + 4}
        textAnchor="end"
        fill={TEXT_MUTED}
        className="font-mono"
        fontSize={11}
      >
        {`${fmtFixed(diagram.heightM, 1)} m`}
      </text>

      {/* Length dimension */}
      <g stroke={STROKE_BORDER} strokeWidth={1}>
        <line x1={originX} y1={floorY + 22} x2={backX} y2={floorY + 22} />
        <line x1={originX} y1={floorY + 17} x2={originX} y2={floorY + 27} />
        <line x1={backX} y1={floorY + 17} x2={backX} y2={floorY + 27} />
      </g>
      <text
        x={(originX + backX) / 2}
        y={floorY + 40}
        textAnchor="middle"
        fill={TEXT_MUTED}
        className="font-mono"
        fontSize={11}
      >
        {`${fmtFixed(diagram.lengthM, 1)} m`}
      </text>
    </>
  );
}

/** Optical section: lens, beam, screen. No floor and no ceiling on purpose. */
function ProjectionSection({
  diagram,
}: {
  diagram: Extract<ToolDiagram, { kind: "potongan-proyeksi" }>;
}) {
  const PAD = { left: 70, right: 90, top: 40, bottom: 70 };
  const plotW = 800 - PAD.left - PAD.right;
  const plotH = 340 - PAD.top - PAD.bottom;
  const axisY = PAD.top + plotH / 2;
  const scale = Math.min(
    plotW / Math.max(diagram.throwDistanceM, 0.1),
    plotH / Math.max(diagram.screenHeightM * 1.6, 0.1),
  );

  const lensX = PAD.left;
  const screenX = lensX + diagram.throwDistanceM * scale;
  const halfHeight = (diagram.screenHeightM * scale) / 2;
  const screenTopY = axisY - halfHeight;
  const screenBottomY = axisY + halfHeight;

  return (
    <>
      {/* Beam */}
      <polygon
        points={`${lensX},${axisY} ${screenX},${screenTopY} ${screenX},${screenBottomY}`}
        fill={STROKE_ACCENT}
        fillOpacity={0.1}
        stroke={STROKE_ACCENT}
        strokeWidth={1.25}
      />

      {/* Optical axis */}
      <line
        x1={lensX}
        y1={axisY}
        x2={screenX}
        y2={axisY}
        stroke={STROKE_BORDER}
        strokeWidth={1}
        strokeDasharray="4 6"
      />

      {/* Lens */}
      <g stroke="currentColor" strokeWidth={1.75} fill="none">
        <circle cx={lensX} cy={axisY} r={7} />
        <rect x={lensX - 26} y={axisY - 13} width={20} height={26} rx={2} />
      </g>
      <text x={lensX - 30} y={axisY + 34} textAnchor="middle" fill={TEXT_MUTED} className="font-mono" fontSize={11}>
        LENSA
      </text>

      {/* Screen */}
      <rect
        x={screenX}
        y={screenTopY}
        width={8}
        height={Math.max(screenBottomY - screenTopY, 2)}
        fill="currentColor"
        fillOpacity={0.16}
        stroke="currentColor"
        strokeWidth={1.75}
      />
      <text x={screenX + 18} y={screenTopY - 10} fill={TEXT_MUTED} className="font-mono" fontSize={11}>
        LAYAR
      </text>

      {/* Screen-height dimension */}
      <g stroke="currentColor" strokeWidth={1} opacity={0.6}>
        <line x1={screenX + 24} y1={screenTopY} x2={screenX + 24} y2={screenBottomY} />
        <line x1={screenX + 19} y1={screenTopY} x2={screenX + 29} y2={screenTopY} />
        <line x1={screenX + 19} y1={screenBottomY} x2={screenX + 29} y2={screenBottomY} />
      </g>
      <text
        x={screenX + 34}
        y={(screenTopY + screenBottomY) / 2 + 4}
        fill="currentColor"
        className="font-mono"
        fontSize={11}
      >
        {`${fmt(diagram.screenHeightM)} m`}
      </text>

      {/* Throw-distance dimension */}
      <g stroke={STROKE_BORDER} strokeWidth={1}>
        <line x1={lensX} y1={axisY + halfHeight + 56} x2={screenX} y2={axisY + halfHeight + 56} />
        <line x1={lensX} y1={axisY + halfHeight + 51} x2={lensX} y2={axisY + halfHeight + 61} />
        <line x1={screenX} y1={axisY + halfHeight + 51} x2={screenX} y2={axisY + halfHeight + 61} />
      </g>
      <text
        x={(lensX + screenX) / 2}
        y={axisY + halfHeight + 74}
        textAnchor="middle"
        fill={TEXT_MUTED}
        className="font-mono"
        fontSize={11}
      >
        {`${fmt(diagram.throwDistanceM)} m jarak lempar`}
      </text>
    </>
  );
}

function ToolDiagramBlock({ diagram }: { diagram: ToolDiagram }) {
  if (diagram.kind === "ukuran-layar") {
    return <RoomSection answer={diagram.answer} />;
  }
  if (diagram.kind === "potongan-akustik") {
    return (
      <DiagramFigure
        id={diagram.id}
        title={diagram.title}
        desc={diagram.desc}
        caption={diagram.caption}
        tableCaption={diagram.tableCaption}
        rows={diagram.rows}
        minWidth="36rem"
      >
        <AcousticSection diagram={diagram} />
      </DiagramFigure>
    );
  }
  return (
    <DiagramFigure
      id={diagram.id}
      title={diagram.title}
      desc={diagram.desc}
      caption={diagram.caption}
      tableCaption={diagram.tableCaption}
      rows={diagram.rows}
      minWidth="34rem"
    >
      <ProjectionSection diagram={diagram} />
    </DiagramFigure>
  );
}

/* ------------------------------------------------------------------ *
 * The page body
 * ------------------------------------------------------------------ */

export function ToolPageBody({
  entry,
  computation,
  record,
  relatedLessons,
  className,
}: ToolPageBodyProps) {
  const { view } = computation;
  const examples = entry.examples();
  const referenceTables = entry.reference();
  const siblings = otherToolEntries(entry.key);
  // `entry.slug`, not `entry.key`: LEARN_TOOL_SLUGS holds the kebab-case URL
  // slugs, while `key` is the PascalCase `component_key` the CMS stores.
  const toolSlug = toolSlugOf(entry.slug);
  const refIndex = toolSlug ? TOOL_REF_INDEX[toolSlug] : null;
  const resultActions = computation.resultActions();

  // The CMS row may add assumptions the code does not know about (a reviewer's
  // note after a site visit, say). They are appended, never substituted — the
  // engine's own assumptions are the ones the arithmetic actually depends on.
  const assumptions = view.math
    ? [...view.math.assumptions, ...(record?.assumptions ?? [])]
    : (record?.assumptions ?? []);

  const relatedEntries = (record?.related_slugs ?? [])
    .map((slug) => ({ slug, title: relatedLessons?.[slug] }))
    .filter((item): item is { slug: string; title: string } => Boolean(item.title));

  return (
    <article className={cn("container py-section", className)}>
      <Breadcrumb
        items={[
          { name: "Learn", href: "/learn" },
          { name: "Alat", href: "/learn/alat" },
          { name: entry.shortName },
        ]}
      />

      <header className="mt-6 max-w-[72ch]">
        <p className="mono-label text-muted-foreground">{entry.eyebrow}</p>
        <h1 className="display-lg mt-3 text-balance">{entry.h1}</h1>
        <p className="body-lg mt-5 text-muted-foreground">{entry.intro}</p>
        <Prose text={record?.intro_md} className="mt-4" />
        <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-5">
          <div>
            <dt className="mono-label text-muted-foreground">Standar</dt>
            <dd className="mono-spec mt-1.5 text-foreground">
              {entry.standardChips.join(" · ")}
            </dd>
          </div>
          <div>
            <dt className="mono-label text-muted-foreground">Diverifikasi</dt>
            <dd className="mono-spec mt-1.5 text-foreground">{entry.verifiedAt} · ACTA</dd>
          </div>
          <div>
            <dt className="mono-label text-muted-foreground">Akses</dt>
            <dd className="mono-spec mt-1.5 text-foreground">
              Gratis · tanpa daftar · berfungsi tanpa JavaScript
            </dd>
          </div>
        </dl>
      </header>

      <WidgetShell
        className="mt-14"
        id="kalkulator"
        action={entry.path}
        title={entry.widgetTitle}
        fieldsLabel={entry.labels.fields}
        submitLabel={entry.labels.submit}
        resetLabel={entry.labels.reset}
        resultLabel={entry.labels.result}
        result={<ResultRegion computation={computation} />}
        math={
          view.math ? (
            <ShowTheMath
              steps={view.math.steps}
              assumptions={assumptions}
              standards={view.math.standards}
              verifiedAt={view.math.verifiedAt}
              open
              summaryLabel={entry.labels.math}
              tool={entry.slug}
            />
          ) : null
        }
      >
        {computation.panel()}
      </WidgetShell>

      {view.diagram ? (
        <section aria-labelledby="diagram-judul" className="mt-14">
          <SectionHeading
            id="diagram-judul"
            eyebrow="Potongan"
            title="Ruangan Anda, digambar"
            intro="Setiap diagram di situs ini punya kembaran teks: tabel di bawahnya berisi seluruh parameter dan nilai terhitung, sehingga angkanya tetap terbaca oleh pembaca layar, oleh mesin pencari, dan di hasil cetak."
          />
          <div className="mt-8">
            <ToolDiagramBlock diagram={view.diagram} />
          </div>
        </section>
      ) : null}

      {record?.method_md ? (
        <section aria-labelledby="metode-judul" className="mt-14">
          <SectionHeading id="metode-judul" eyebrow="Metode" title="Cara alat ini menghitung" />
          <Prose text={record.method_md} className="mt-6 max-w-[72ch]" />
          {record.standard_ref ? (
            <p className="mono-spec mt-5 text-muted-foreground">{record.standard_ref}</p>
          ) : null}
        </section>
      ) : null}

      {resultActions ? <div className="mt-12">{resultActions}</div> : null}

      {/* The one commercial ask on the page (§13.1, 1 + 1 + 0). */}
      <section className="mt-12">
        <WaLearnCta
          cta="kirim_hasil"
          source={{ kind: "alat", title: entry.name, path: entry.path }}
          refJalur={TOOL_REF_JALUR}
          refIndex={refIndex}
          slug={entry.slug}
          detailLines={computation.detailLines}
          resultUrl={computation.shareHref}
        />
      </section>

      {/* §12.6 item 6 — three real rooms, computed, never behind interaction. */}
      <section aria-labelledby="contoh-judul" className="mt-16">
        <SectionHeading
          id="contoh-judul"
          eyebrow="Contoh terhitung"
          title={entry.examplesTitle}
          intro={entry.examplesIntro}
        />
        <Prose text={record?.worked_example_md} className="mt-6 max-w-[72ch]" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {examples.map((example) => (
            <article
              key={example.id}
              className="relative flex flex-col rounded-md border border-border bg-card p-5 print:break-inside-avoid"
            >
              <CornerTicks size={10} />
              <h3 className="heading-md text-balance">
                <Link
                  href={example.href}
                  className="transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  {example.title}
                </Link>
              </h3>
              <p className="body-sm mt-3 text-muted-foreground">{example.context}</p>
              {example.facts.length > 0 ? (
                <dl className="mt-5 space-y-2 border-t border-border pt-4">
                  {example.facts.map((fact) => (
                    <div key={fact.label} className="flex items-baseline justify-between gap-4">
                      <dt className="caption text-muted-foreground">{fact.label}</dt>
                      <dd className="mono-spec text-right text-foreground">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <p className="body-sm mt-5 border-t border-border pt-4 text-muted-foreground">
                {example.verdict}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* §12.6 item 7 — the tables people bookmark and link to. */}
      {referenceTables.length > 0 ? (
        <section aria-labelledby="referensi-judul" className="mt-16">
          <SectionHeading
            id="referensi-judul"
            eyebrow="Referensi"
            title="Tabel acuan"
            intro="Halaman ini boleh ditandai dan ditautkan. Angka-angka di bawah dihitung oleh mesin yang sama seperti kalkulator, jadi tabel tidak bisa menyimpang dari hasil perhitungan."
          />
          <div className="mt-8 space-y-10">
            {referenceTables.map((table) => (
              <ReferenceTable
                key={table.id}
                id={`referensi-${table.id}`}
                caption={table.caption}
                columns={table.columns}
                rows={table.rows}
                {...(table.note ? { note: table.note } : {})}
                {...(table.minWidth ? { minWidth: table.minWidth } : {})}
              />
            ))}
          </div>
        </section>
      ) : null}

      {(entry.refusals.length > 0 || entry.limits.items.length > 0) && (
        <section aria-labelledby="batas-judul" className="mt-16">
          <SectionHeading
            id="batas-judul"
            eyebrow="Batas alat ini"
            title="Yang tidak kami hitung, dan kenapa"
          />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {entry.refusals.map((refusal) => (
              <div
                key={refusal.id}
                className="relative rounded-md border border-dashed border-border bg-background p-5 print:break-inside-avoid"
              >
                <h3 className="heading-md text-balance">{refusal.title}</h3>
                <p className="body-md mt-3 text-muted-foreground">{refusal.body}</p>
                {refusal.note ? (
                  <p className="body-sm mt-3 text-muted-foreground">{refusal.note}</p>
                ) : null}
              </div>
            ))}
            {entry.limits.items.length > 0 ? (
              <AssumptionsList title={entry.limits.title} items={entry.limits.items} />
            ) : null}
          </div>
        </section>
      )}

      {/* §12.6 item 8 — plain <h2> + prose. NO FAQPage JSON-LD: the rich result
          ended 2026-05-07, so the markup would earn nothing and still have to be
          maintained. The prose is the payload. */}
      {entry.faq.length > 0 ? (
        <section aria-labelledby="faq-judul" className="mt-16">
          <SectionHeading id="faq-judul" eyebrow="Pertanyaan" title={entry.faqTitle} />
          <div className="mt-8 max-w-[72ch] space-y-8">
            {entry.faq.map((item) => (
              <div key={item.q} className="print:break-inside-avoid">
                <h3 className="heading-md text-balance">{item.q}</h3>
                <p className="body-md mt-3 text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* §12.6 item 9 — every standard with the date it was last checked. */}
      {entry.standards.length > 0 ? (
        <section aria-labelledby="standar-judul" className="mt-16">
          <SectionHeading id="standar-judul" eyebrow="Standar" title="Sumber dan tanggal periksa" />
          <dl className="mt-8 max-w-[72ch] divide-y divide-border border-y border-border">
            {entry.standards.map((standard) => (
              <div key={standard.name} className="py-5 print:break-inside-avoid">
                <dt className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span className="mono-spec text-foreground">{standard.name}</span>
                  <span className="caption text-muted-foreground">
                    Diperiksa {standard.checkedAt}
                  </span>
                </dt>
                <dd className="body-sm mt-2 text-muted-foreground">
                  {standard.title ? (
                    <span className="text-foreground">{standard.title}. </span>
                  ) : null}
                  {standard.usedFor}
                </dd>
              </div>
            ))}
          </dl>
          {entry.standardsNote ? (
            <p className="body-sm mt-5 max-w-[72ch] text-muted-foreground">
              {entry.standardsNote}
            </p>
          ) : null}
        </section>
      ) : null}

      {relatedEntries.length > 0 ? (
        <section aria-labelledby="pelajaran-judul" className="mt-16">
          <SectionHeading id="pelajaran-judul" eyebrow="Pelajaran" title="Bacaan yang menjelaskan angkanya" />
          <ul className="mt-6 max-w-[72ch] divide-y divide-border border-y border-border">
            {relatedEntries.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/learn/${item.slug}`}
                  className="body-md flex min-h-11 items-center py-4 text-foreground transition-colors hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {siblings.length > 0 ? (
        <section aria-labelledby="alat-lain-judul" className="mt-16">
          <SectionHeading id="alat-lain-judul" eyebrow="Alat lain" title="Kalkulator ACTA lainnya" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {siblings.map((sibling) => (
              <Link
                key={sibling.key}
                href={sibling.path}
                className="group relative rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <CornerTicks size={10} />
                <p className="mono-label text-muted-foreground">{sibling.eyebrow}</p>
                <p className="heading-md mt-3 text-balance group-hover:text-accent-text">
                  {sibling.shortName}
                </p>
                <p className="body-sm mt-3 text-muted-foreground">{sibling.answers}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

export default ToolPageBody;
