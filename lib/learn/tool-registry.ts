import { createElement, type ComponentType, type ReactNode } from "react";
import type { ReferenceColumn, ReferenceRow } from "@/components/learn/alat/_shared/ReferenceTable";
import type { ResultTone } from "@/components/learn/alat/_shared/ResultReadout";
import type { MathStep } from "@/components/learn/alat/_shared/ShowTheMath";
import type { GaugeZone } from "@/components/learn/alat/_shared/ZoneGauge";
import { CalcHandoffCta } from "@/components/learn/cta/CalcHandoffCta";
import { StipaCta } from "@/components/learn/cta/StipaCta";
import { buildProjectorHandoff } from "@/lib/learn/cta";
import { fmt, fmtFixed, fmtInt } from "@/lib/learn/format";

/* ── ukuran-layar ────────────────────────────────────────────────────────── */
import {
  COMMERCIAL_PANEL_SIZES_IN,
  FIELD_TOLERANCE,
  computeScreenSize,
  heightFromDiagonalIn,
  maxDistanceFromImageHeight,
  panelAvailability,
  type ScreenSizeAnswer,
  type ScreenSizeInput,
} from "@/components/learn/alat/ukuran-layar/calc";
import {
  TOOL_PATH as UKURAN_PATH,
  UKURAN_LAYAR_COPY as UKURAN_COPY,
} from "@/components/learn/alat/ukuran-layar/copy.id";
import {
  SCREEN_SIZE_DEFAULTS,
  SCREEN_SIZE_PRESETS,
  hasScreenSizeParams,
  parseScreenSizeParams,
  screenSizeHref,
} from "@/components/learn/alat/ukuran-layar/params";
import { Panel as UkuranPanel } from "@/components/learn/alat/ukuran-layar/Panel";

/* ── rt60-sabine ─────────────────────────────────────────────────────────── */
import {
  buildAlphaReferenceRows,
  buildBandReferenceRows,
  buildGeometryReferenceRows,
  buildStandardsReferenceRows,
  buildSurfaceReferenceRows,
  buildTargetReferenceRows,
  buildWorkedExamples,
  computeRt60,
  surfaceTableNote,
  type Rt60Input,
  type Rt60Result,
} from "@/components/learn/alat/rt60-sabine/calc";
import {
  CEILING_LABEL,
  FLOOR_LABEL,
  RT60_COPY,
  STANDARDS as RT60_STANDARDS,
  STANDARDS_CHIP as RT60_STANDARDS_CHIP,
  VERIFIED_AT as RT60_VERIFIED,
  WALL_LABEL,
} from "@/components/learn/alat/rt60-sabine/copy.id";
import {
  RT60_DEFAULT_INPUT,
  RT60_TOOL_PATH,
  hasRt60Params,
  parseRt60Params,
  rt60Href,
} from "@/components/learn/alat/rt60-sabine/params";
import { Rt60Panel } from "@/components/learn/alat/rt60-sabine/Panel";

/* ── throw-distance-proyektor ────────────────────────────────────────────── */
import {
  DEFAULT_INPUT as THROW_DEFAULTS,
  MARGINAL_RATIO,
  compute as computeThrow,
  requiredLumensForWidth,
  type ThrowInput,
  type ThrowResult,
} from "@/components/learn/alat/throw-distance-proyektor/calc";
import {
  AMBIENT_LABELS,
  COPY as THROW_COPY,
  EXAMPLES as THROW_EXAMPLES,
  FAQ as THROW_FAQ,
  FIELDS as THROW_FIELDS,
  LIMITS_COPY as THROW_LIMITS,
  MATH as THROW_MATH,
  REFERENCE as THROW_REFERENCE,
  REFUSALS as THROW_REFUSALS,
  RESULT as THROW_RESULT,
  STANDARDS as THROW_STANDARDS,
  TOOL as THROW_TOOL,
} from "@/components/learn/alat/throw-distance-proyektor/copy.id";
import {
  TOOL_PATH as THROW_PATH,
  buildToolHref,
  hasParams as hasThrowParams,
  parseParams as parseThrowParams,
} from "@/components/learn/alat/throw-distance-proyektor/params";
import { Panel as ThrowPanel } from "@/components/learn/alat/throw-distance-proyektor/Panel";

/**
 * The calculator registry (03-UI §12.1, §12.6, §14.5).
 *
 * A frozen, hand-written object literal mapping `learn_tools.component_key` to the
 * five moving parts of one calculator: its pure `compute()`, its default preset,
 * its URL codec, its Bahasa Indonesia copy, and its `"use client"` Panel.
 *
 * **It is a lookup table, not a plugin framework.** Nothing here is `eval`'d and
 * nothing is `import()`ed from user data — a `component_key` that is not one of the
 * three literal keys below resolves to `undefined` and the route renders nothing.
 * §12.0's challenge to the brief stands: three ordinary server-rendered pages, and
 * the only surviving piece of the framework spec is the one that protects the
 * differentiator — a pure isomorphic engine in its own file.
 *
 * Each entry erases its own input/result types behind `build(query)`, which returns
 * the uniform `ToolComputation` that `components/learn/alat/ToolPageBody.tsx`
 * renders. That is what keeps the page component tool-agnostic without a single
 * `switch` on a slug, and what makes "unknown key renders nothing" a type-level
 * fact rather than a runtime check.
 *
 * This module is imported only by server components (the two routes and the OG
 * image). It pulls all three engines and all three copy files, so it must never be
 * imported from a `"use client"` module — that would push ~90 KB of copy into the
 * browser and blow the §14.6 budget.
 */

/* ------------------------------------------------------------------ *
 * The uniform view model
 * ------------------------------------------------------------------ */

/** Next 15 `searchParams`, already awaited. Every codec below accepts this shape. */
export type ToolQuery = Readonly<Record<string, string | string[] | undefined>>;

export type ToolReadout = {
  id: string;
  /** Mono eyebrow, e.g. "WAKTU DENGUNG · T_MID". */
  label: string;
  /** Already formatted through `lib/learn/format` — nothing downstream rounds. */
  value: string;
  unit?: string;
  caption?: string;
  verdict?: string;
  tone: ResultTone;
  size: "lg" | "md";
};

export type ToolFindingSeverity = "critical" | "warning" | "info";

export type ToolFinding = {
  id: string;
  severity: ToolFindingSeverity;
  title: string;
  detail: string;
  href?: string;
  hrefLabel?: string;
};

export type ToolTable = {
  id: string;
  caption: string;
  columns: readonly ReferenceColumn[];
  rows: readonly ReferenceRow[];
  note?: string;
  minWidth?: string;
};

/** A standing refusal — §12.8 rule 1 copy that ships on every render. */
export type ToolProse = { id: string; title: string; body: string; note?: string };

export type ToolStandard = {
  name: string;
  title?: string;
  usedFor: string;
  /** The date ACTA last checked the version in force (§12.6 item 9). */
  checkedAt: string;
};

export type ToolFaq = { q: string; a: string };

/** §12.6 item 6 — a real Indonesian room, computed by the same engine. */
export type ToolExample = {
  id: string;
  title: string;
  context: string;
  facts: readonly { label: string; value: string }[];
  verdict: string;
  /** Preset URL on this tool, so the reader can open the room and edit it. */
  href: string;
};

export type ToolMath = {
  steps: readonly MathStep[];
  assumptions: readonly string[];
  standards: readonly string[];
  verifiedAt: string;
};

/** The share card (§12.1). An image is not an indexable page, so it carries the answer. */
export type ToolOgCard = {
  eyebrow: string;
  toolName: string;
  /** The answer, e.g. "RT60 1,8 detik". */
  headline: string;
  /** Supporting facts, joined with " · " on the card. */
  specs: readonly string[];
  verdict: string | null;
  tone: ResultTone;
};

export type ToolDiagramRow = { label: string; value: string; note?: string };

/**
 * Diagram data, never a React tree — a `.ts` module cannot author SVG, and passing
 * elements around would put the drawing outside the file that owns the page's
 * markup. `ToolPageBody` renders all three variants, and every one of them ships
 * the mandatory text twin (§12.7): `role="img"` + `<title>`/`<desc>` + a visible
 * table carrying every parameter and computed value.
 */
export type ToolDiagram =
  /** The DISCAS cross-section, already hand-authored by the tool that owns it. */
  | { kind: "ukuran-layar"; answer: ScreenSizeAnswer }
  /** Room box with its material surfaces, the talker, and the critical distance. */
  | {
      kind: "potongan-akustik";
      id: string;
      title: string;
      desc: string;
      caption: string;
      tableCaption: string;
      rows: readonly ToolDiagramRow[];
      lengthM: number;
      heightM: number;
      floorLabel: string;
      wallLabel: string;
      ceilingLabel: string;
      criticalDistanceM: number;
      talkerHeightM: number;
    }
  /** Optical section: lens, beam, screen. No floor and no ceiling — see the note. */
  | {
      kind: "potongan-proyeksi";
      id: string;
      title: string;
      desc: string;
      caption: string;
      tableCaption: string;
      rows: readonly ToolDiagramRow[];
      throwDistanceM: number;
      screenHeightM: number;
      screenWidthM: number;
    };

/**
 * The verdict band under the headline. Every one of these calculators answers a
 * question whose real answer is a range, and each already knew it internally —
 * DISCAS has a comfort distance and a tolerance, ISO 3382-1 publishes an RT60
 * range around each target, and the projector engine grades brightness
 * aman/marginal/kurang. This is where that range finally reaches the reader,
 * instead of being flattened into a single pass/fail line.
 */
export type ToolGauge = {
  label: string;
  value: number;
  valueLabel: string;
  zones: readonly GaugeZone[];
  max: number;
  ticks?: readonly { at: number; label: string }[];
  caption?: string;
  /** The gauge's text twin (§12.7). Required — a band with no sentence is a picture. */
  description: string;
};

export type ToolResultView = {
  /** Set when the engine refused to compute. A refused room prints no numbers. */
  refusal: { title: string; detail: string } | null;
  /** The money sentence — one line that turns a number into a decision. */
  lede: string | null;
  headline: ToolReadout | null;
  /** Rendered between the headline and the readouts. */
  gauge: ToolGauge | null;
  readouts: readonly ToolReadout[];
  findings: readonly ToolFinding[];
  /** Result-dependent tables (octave bands, the panel-size ladder, geometry). */
  tables: readonly ToolTable[];
  diagram: ToolDiagram | null;
  math: ToolMath | null;
  og: ToolOgCard;
};

export type ToolComputation = {
  /**
   * True when the URL carries at least one of THIS tool's params. Drives
   * `noindex` + `rel=canonical` → the bare path. Campaign tags (`utm_*`,
   * `fbclid`) are ignored by every codec, so a tagged link stays indexable.
   */
  hasParams: boolean;
  /** Canonical, site-relative share URL. Collapses to the bare path when default. */
  shareHref: string;
  /** `{slug}~{k}={v}~…` — the OG image's path segment. See `decodeToolOgSlug`. */
  ogSlug: string;
  /** Room facts echoed into the WhatsApp message (§13.4). */
  detailLines: readonly string[];
  view: ToolResultView;
  /**
   * Lazily built React trees. The OG route reads `view.og` and never calls these,
   * so a share card never instantiates a client Panel it cannot render anyway.
   */
  panel: () => ReactNode;
  resultActions: () => ReactNode | null;
};

export type ToolEntry = {
  /**
   * `learn_tools.component_key` — PascalCase, because the column carries a DB
   * CHECK of `^[A-Z][A-Za-z0-9]*$` (see `20260722100000_learn_platform.sql`).
   * It is deliberately NOT the URL slug: the slug is kebab-case and frozen by
   * §12.1, so a single string cannot legally be both. Keying the registry on the
   * component key is what lets a published `learn_tools` row resolve to code at
   * all — matching on the slug would silently drop every row's editorial fields.
   */
  key: string;
  /** The frozen kebab-case URL slug (§12.1). Never derived from `key`. */
  slug: string;
  /** Bare tool path — the form action, the canonical, and the reset href. */
  path: string;
  /** Editorial order on `/learn/alat`. */
  order: number;

  name: string;
  shortName: string;
  eyebrow: string;
  h1: string;
  /** The `<h2>` inside the widget shell; the page keeps the single `<h1>`. */
  widgetTitle: string;
  intro: string;
  /** One line for the index card: what question this tool answers. */
  answers: string;
  seoTitle: string;
  seoDescription: string;
  verifiedAt: string;
  standardChips: readonly string[];
  labels: {
    fields: string;
    submit: string;
    reset: string;
    result: string;
    math: string;
  };

  /* §12.6 items 6–9 — static, always in the HTML, never behind interaction. */
  examplesTitle: string;
  examplesIntro: string;
  examples: () => readonly ToolExample[];
  reference: () => readonly ToolTable[];
  refusals: readonly ToolProse[];
  limits: { title: string; items: readonly string[] };
  faqTitle: string;
  faq: readonly ToolFaq[];
  standards: readonly ToolStandard[];
  standardsNote: string | null;

  /* The five moving parts the registry exists to hold. */
  /** The tool's own default preset — the state the bare path renders. */
  defaults: Readonly<Record<string, unknown>>;
  /** The tool's `copy.id.ts` aggregate, kept so a `component_key` leads to its copy. */
  copy: object;
  /**
   * The `"use client"` input panel. Deliberately un-renderable from outside: only
   * `build().panel()` knows its prop type, which is what stops a caller from
   * mounting a Panel without the server-computed `initial` state.
   */
  Panel: ComponentType<never>;
  hasParams: (query: ToolQuery) => boolean;
  href: (query: ToolQuery) => string;
  /** Parse → compute → uniform view. Pure, total, never throws (§12.1). */
  build: (query: ToolQuery) => ToolComputation;
};

/* ------------------------------------------------------------------ *
 * OG slug codec
 * ------------------------------------------------------------------ *
 *
 * §12.1 asks the OG route to render the computed answer, because an image is not
 * an indexable page. Next 15.5's file-based `opengraph-image.tsx` cannot do that
 * through a query string: the generated route handler is
 * `export async function GET(_, ctx)` — the Request is discarded and the default
 * export receives `{ params, id }` only. So the state travels in the ONE thing the
 * handler does receive, the dynamic segment:
 *
 *   /learn/alat/rt60-sabine~p=8~l=6~t=3/opengraph-image
 *
 * `~` is unreserved in a path segment and the frozen slug grammar
 * (`^[a-z0-9]+(-[a-z0-9]+)*$`) can never produce one, so the split is unambiguous.
 * Only the page's `generateMetadata` ever writes this URL; readers never see it.
 * Every share state gets its own image URL, which is also what makes the social
 * caches (which key on the image URL) show a different card per shared result.
 */

const OG_STATE_SEPARATOR = "~";

/** `("rt60-sabine", "/learn/alat/rt60-sabine?p=8&l=6") → "rt60-sabine~p=8~l=6"` */
function toOgSlug(slug: string, shareHref: string): string {
  const query = shareHref.split("?")[1];
  if (!query) return slug;
  const pairs = query.split("&").filter((pair) => pair.length > 0);
  if (pairs.length === 0) return slug;
  return [slug, ...pairs].join(OG_STATE_SEPARATOR);
}

/**
 * The inverse, for the OG route. Total: a malformed segment degrades to the tool's
 * default preset rather than throwing, because an exception inside an image route
 * is a 500 and a 500 is a broken link preview in every WhatsApp group it reaches.
 */
export function decodeToolOgSlug(raw: string): { key: string; query: ToolQuery } {
  const parts = raw.split(OG_STATE_SEPARATOR);
  const key = parts[0] ?? "";
  const query: Record<string, string> = {};
  for (const part of parts.slice(1)) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq);
    const value = part.slice(eq + 1);
    try {
      query[name] = decodeURIComponent(value);
    } catch {
      query[name] = value;
    }
  }
  return { key, query };
}

/* ------------------------------------------------------------------ *
 * 01 · ukuran-layar — DISCAS display sizing
 * ------------------------------------------------------------------ */

const UKURAN_LADDER_COLUMNS: readonly ReferenceColumn[] = [
  { key: "size", label: UKURAN_COPY.results.ladderColumns.size, mono: true, width: "6.5rem" },
  { key: "height", label: UKURAN_COPY.results.ladderColumns.height, align: "right", mono: true },
  { key: "width", label: UKURAN_COPY.results.ladderColumns.width, align: "right", mono: true },
  { key: "distance", label: UKURAN_COPY.results.ladderColumns.distance, align: "right", mono: true },
  { key: "tolerated", label: UKURAN_COPY.results.ladderColumns.tolerated, align: "right", mono: true },
  { key: "ceiling", label: UKURAN_COPY.results.ladderColumns.ceiling, align: "right", mono: true },
  { key: "availability", label: UKURAN_COPY.results.ladderColumns.availability },
];

/**
 * The reference table people bookmark (§12.6 item 7). Static: it does not depend
 * on the reader's room, only on the geometry, so it is identical in every render
 * and is the part of the page that earns links. Every number is produced by the
 * same pure helpers the calculator uses — the table cannot drift from the engine.
 */
function ukuranReferenceTables(): readonly ToolTable[] {
  const rows: ReferenceRow[] = COMMERCIAL_PANEL_SIZES_IN.map((size) => {
    const imageHeight = heightFromDiagonalIn(size, "16x9");
    const bdm = (percent: 1 | 2 | 3 | 4) =>
      maxDistanceFromImageHeight(imageHeight, {
        model: "bdm",
        elementHeightPercent: percent,
        verticalResolution: 1080,
      });
    const adm = (resolution: 1080 | 2160) =>
      maxDistanceFromImageHeight(imageHeight, {
        model: "adm",
        elementHeightPercent: 2,
        verticalResolution: resolution,
      });
    return {
      size: `${fmtInt(size)}"`,
      height: fmt(imageHeight),
      bdm4: fmt(bdm(4)),
      bdm3: fmt(bdm(3)),
      // The pair the whole rewrite turns on: comfortable at 6H, still legible at 8H.
      bdm3max: fmt(bdm(3) * FIELD_TOLERANCE),
      bdm2: fmt(bdm(2)),
      bdm1: fmt(bdm(1)),
      adm1080: fmt(adm(1080)),
      adm2160: fmt(adm(2160)),
      ceiling: fmt(1.2 + imageHeight),
      availability: UKURAN_COPY.availability[panelAvailability(size)].label,
    };
  });

  return [
    {
      id: "ukuran-jangkauan",
      caption: "Jarak penonton terjauh per ukuran panel komersial (16:9)",
      minWidth: "62rem",
      columns: [
        { key: "size", label: "Panel", mono: true, width: "5.5rem" },
        { key: "height", label: "Tinggi gambar (m)", align: "right", mono: true },
        { key: "bdm3", label: "Presentasi 6H (m)", align: "right", mono: true },
        { key: "bdm3max", label: "…batas 8H (m)", align: "right", mono: true },
        { key: "bdm2", label: "Detail 4H (m)", align: "right", mono: true },
        { key: "bdm4", label: "Pasif 8H (m)", align: "right", mono: true },
        { key: "bdm1", label: "Teks padat 2H (m)", align: "right", mono: true },
        { key: "adm1080", label: "ADM 1080p (m)", align: "right", mono: true },
        { key: "adm2160", label: "ADM 2160p (m)", align: "right", mono: true },
        { key: "ceiling", label: "Plafon min. (m)", align: "right", mono: true },
        { key: "availability", label: "Ketersediaan" },
      ],
      rows,
      note:
        "Jarak dihitung ke MATA penonton di kursi terakhir. Kolom BDM memakai FV = 2 × %EH × tinggi gambar; " +
        "kolom ADM memakai FV = tinggi gambar × 3438 / resolusi vertikal. Kolom “batas 8H” adalah kolom " +
        "presentasi dikali toleransi lapangan 4/3 — penilaian ACTA, bukan bagian dari DISCAS, dan hanya " +
        "dicetak untuk band presentasi karena itu band yang paling sering dipakai. Plafon minimum = 1,2 m " +
        "ke bawah gambar + tinggi gambar. Kolom ketersediaan adalah penilaian pasar ACTA per " +
        UKURAN_COPY.verifiedAt +
        ", bukan bagian dari standar AVIXA.",
    },
    {
      id: "ukuran-model",
      caption: "Memilih band menurut konten yang ditayangkan",
      minWidth: "46rem",
      columns: [
        { key: "konten", label: "Konten di layar", width: "17rem" },
        { key: "pilihan", label: "Pilihan di kalkulator", width: "11rem" },
        { key: "nyaman", label: "Nyaman", mono: true, width: "5rem" },
        { key: "batas", label: "Batas", mono: true, width: "5rem" },
        { key: "parameter", label: "Yang menentukan ukuran" },
      ],
      rows: [
        {
          konten: "Slide, video call, papan tulis digital",
          pilihan: "Rapat & presentasi",
          nyaman: "6H",
          batas: "8H",
          parameter: "Tinggi elemen terkecil (%EH 3). Ini kondisi mayoritas ruang rapat Indonesia.",
        },
        {
          konten: "Spreadsheet, dashboard, denah, tabel harga",
          pilihan: "Angka & detail",
          nyaman: "4H",
          batas: "5,3H",
          parameter: "Tinggi elemen terkecil (%EH 2). Menuntut layar 1,5× lebih tinggi dari band presentasi.",
        },
        {
          konten: "Signage, hiburan, konten yang ditonton saja",
          pilihan: "Tayangan & video",
          nyaman: "8H",
          batas: "10,7H",
          parameter: "Tinggi elemen terkecil (%EH 4). Tidak ada yang perlu dibaca kata per kata.",
        },
        {
          konten: "Notulen dan dokumen yang dibaca bersama",
          pilihan: "Teks sangat padat",
          nyaman: "2H",
          batas: "2,7H",
          parameter: "Tinggi elemen terkecil (%EH 1). Menuntut layar dua kali lebih tinggi dari band detail.",
        },
        {
          konten: "Gambar kerja CAD, GIS, single line, citra medis",
          pilihan: "Model ADM (lanjutan)",
          nyaman: "—",
          batas: "—",
          parameter: "Resolusi vertikal: setiap piksel harus menyudut 1 arcmenit di kursi terjauh.",
        },
      ],
      note:
        "Kolom “nyaman” adalah AVIXA DISCAS: FV = 2 × %EH × tinggi gambar. Kolom “batas” adalah kolom nyaman " +
        "dikali toleransi lapangan 4/3 — penilaian ACTA, bukan bagian dari standar. Di antara keduanya konten " +
        "masih terbaca tetapi baris belakang harus lebih berusaha. Salah memilih band mengubah ukuran layar " +
        "satu sampai dua tingkat penuh; kalau ragu, pilih konten terpadat yang benar-benar akan ditayangkan — " +
        "bukan konten yang dipakai saat demo.",
    },
  ];
}

function ukuranExamples(): readonly ToolExample[] {
  return SCREEN_SIZE_PRESETS.map((preset) => {
    const result = computeScreenSize(preset.input);
    if (result.status === "refused") {
      return {
        id: preset.id,
        title: preset.label,
        context: result.refusal.detail,
        facts: [],
        verdict: result.refusal.title,
        href: screenSizeHref(preset.input, UKURAN_PATH),
      };
    }
    const comfortable = result.recommended;
    const floor = result.recommendedMinimum;
    return {
      id: preset.id,
      title: preset.label,
      context: `${result.model.short}. Kursi terjauh ${fmtFixed(preset.input.farthestViewerM, 1)} m, plafon ${fmtFixed(preset.input.ceilingHeightM, 1)} m, rencana panel ${fmtInt(preset.input.plannedDiagonalIn)}".`,
      facts: [
        {
          label: "Minimal",
          value: floor ? `${fmtInt(floor.diagonalIn)}"` : UKURAN_COPY.results.verdictNoPanel,
        },
        {
          label: "Nyaman",
          value: comfortable
            ? `${fmtInt(comfortable.diagonalIn)}"`
            : UKURAN_COPY.results.verdictNoPanel,
        },
        {
          label: "Rencana Anda",
          value: `${fmtFixed(result.comfort.ratio, 1)}H — ${UKURAN_COPY.zones[result.comfort.zone].short}`,
        },
        {
          label: "Plafon minimum",
          value: `${fmt(result.mounting.requiredCeilingM)} m`,
        },
      ],
      verdict: result.moneySentence,
      href: screenSizeHref(preset.input, UKURAN_PATH),
    };
  });
}

function ukuranView(input: ScreenSizeInput, result: ReturnType<typeof computeScreenSize>): ToolResultView {
  if (result.status === "refused") {
    return {
      refusal: { title: result.refusal.title, detail: result.refusal.detail },
      lede: null,
      headline: null,
      gauge: null,
      readouts: [],
      findings: [],
      tables: [],
      diagram: null,
      math: null,
      og: {
        eyebrow: UKURAN_COPY.eyebrow,
        toolName: UKURAN_COPY.shortName,
        headline: result.refusal.title,
        specs: [],
        verdict: null,
        tone: "bad",
      },
    };
  }

  const {
    comfort,
    recommended,
    recommendedMinimum,
    planned,
    subject,
    mounting,
    distance,
    model,
  } = result;

  const readouts: ToolReadout[] = [
    {
      id: "minimal",
      label: UKURAN_COPY.results.minimumPanel,
      value: recommendedMinimum ? `${fmtInt(recommendedMinimum.diagonalIn)}"` : "—",
      caption: recommendedMinimum
        ? `Terbaca sampai ${fmt(recommendedMinimum.toleratedDistanceM)} m. ${UKURAN_COPY.availability[recommendedMinimum.availability].label}.`
        : UKURAN_COPY.availability["tidak-ada"].note,
      tone: recommendedMinimum ? "warning" : "bad",
      size: "md",
    },
    // The comfortable panel is already the headline, so this slot carries the
    // number that actually drives every other one instead of repeating it.
    {
      id: "tinggi-gambar",
      label: UKURAN_COPY.results.imageHeight,
      value: fmt(subject.imageHeightM),
      unit: "m",
      caption: `Lebar gambar ${fmt(subject.imageWidthM)} m. Tinggi gambar inilah yang menentukan keterbacaan, bukan diagonal.`,
      tone: "neutral",
      size: "md",
    },
    {
      id: "pemasangan",
      label: UKURAN_COPY.results.mountHeight,
      value: fmt(mounting.requiredCeilingM),
      unit: "m",
      caption: `Bawah gambar ${fmt(mounting.imageBottomM)} m + tinggi panel ${fmt(subject.displayHeightM)} m. Plafon Anda ${fmtFixed(mounting.ceilingHeightM, 1)} m.`,
      verdict: mounting.ceilingFits ? "Plafon cukup" : "Plafon tidak cukup",
      tone: mounting.ceilingFits ? "good" : "bad",
      size: "md",
    },
    {
      id: "penonton-terdekat",
      label: UKURAN_COPY.results.closestViewer,
      value: fmt(distance.closestViewerM),
      unit: "m",
      caption: distance.closestViewerIsAuto
        ? `Otomatis: 1,5 × tinggi gambar. Sudut pandang vertikal ke tepi atas ${fmt(mounting.verticalAngleTopDeg)}°.`
        : `Diisi manual. Pedoman DISCAS 1,5 × tinggi gambar = ${fmt(distance.closestViewerGuidelineM)} m.`,
      tone: "neutral",
      size: "md",
    },
  ];

  /**
   * The band, drawn in metres against the PLANNED panel — "is the screen I am
   * already holding good enough?", which is the question people arrive with.
   * The scale runs a little past the tolerance so the third zone is visible
   * even when the room sits comfortably inside the first.
   */
  const gaugeMax = Math.max(
    planned.toleratedDistanceM * 1.25,
    distance.farthestViewerM * 1.1,
  );
  const gauge: ToolGauge = {
    label: UKURAN_COPY.results.gaugeLabel,
    value: distance.farthestViewerM,
    valueLabel: `${fmtFixed(distance.farthestViewerM, 1)} m · ${fmtFixed(comfort.ratio, 1)}H`,
    max: gaugeMax,
    zones: [
      { label: UKURAN_COPY.zones.nyaman.label, upTo: planned.maxDistanceM, tone: "good" },
      {
        label: UKURAN_COPY.zones.terbaca.label,
        upTo: planned.toleratedDistanceM,
        tone: "warning",
      },
      { label: UKURAN_COPY.zones.jauh.label, upTo: null, tone: "bad" },
    ],
    ticks: [
      { at: planned.maxDistanceM, label: `${fmt(planned.maxDistanceM)} m` },
      { at: planned.toleratedDistanceM, label: `${fmt(planned.toleratedDistanceM)} m` },
    ],
    caption: `Panel ${fmt(planned.diagonalIn)}". ${UKURAN_COPY.toleranceNote}`,
    description: UKURAN_COPY.results.gaugeDescription(
      fmtFixed(distance.farthestViewerM, 1),
      fmtFixed(comfort.ratio, 1),
      UKURAN_COPY.zones[comfort.zone].short,
      fmt(planned.maxDistanceM),
      fmt(planned.toleratedDistanceM),
    ),
  };

  const ladderRows: ReferenceRow[] = result.ladder.map((panel) => ({
    size: `${fmtInt(panel.diagonalIn)}"`,
    height: fmt(panel.imageHeightM),
    width: fmt(panel.imageWidthM),
    distance: fmt(panel.maxDistanceM),
    tolerated: fmt(panel.toleratedDistanceM),
    ceiling: fmt(panel.requiredCeilingM),
    availability: UKURAN_COPY.availability[panel.availability].label,
  }));

  return {
    refusal: null,
    lede: result.moneySentence,
    headline: {
      id: "headline",
      label: result.headline.label,
      value: result.headline.value,
      unit: result.headline.unit,
      caption: result.headline.caption,
      verdict: result.headline.verdict,
      tone: result.headline.tone,
      size: "lg",
    },
    gauge,
    readouts,
    findings: result.findings.map((finding) => ({
      id: finding.code,
      severity: finding.severity,
      title: finding.title,
      detail: finding.detail,
      ...(finding.href ? { href: finding.href } : {}),
      ...(finding.hrefLabel ? { hrefLabel: finding.hrefLabel } : {}),
    })),
    tables: [
      {
        id: "ladder",
        caption: UKURAN_COPY.results.ladderCaption,
        columns: UKURAN_LADDER_COLUMNS,
        rows: ladderRows,
        minWidth: "44rem",
        note: `Dihitung untuk ${model.label}, konten ${UKURAN_COPY.aspectLabels[input.contentAspect]} pada layar ${UKURAN_COPY.aspectLabels[input.displayAspect]}. ${result.fit.note}`,
      },
    ],
    // The DISCAS section is hand-authored by the tool that owns it, and it already
    // ships its own <title>/<desc> and data table. Rows stay empty here on purpose.
    diagram: { kind: "ukuran-layar", answer: result },
    math: {
      steps: result.steps,
      assumptions: UKURAN_COPY.assumptions,
      standards: UKURAN_COPY.standardChip,
      verifiedAt: UKURAN_COPY.verifiedAt,
    },
    og: {
      eyebrow: UKURAN_COPY.eyebrow,
      toolName: UKURAN_COPY.shortName,
      headline: `${result.headline.value} ${result.headline.unit}`,
      specs: [
        `Kursi terjauh ${fmtFixed(distance.farthestViewerM, 1)} m · ${fmtFixed(comfort.ratio, 1)}H`,
        `${model.short} · %EH ${fmtInt(input.elementHeightPercent)} · ${UKURAN_COPY.zones[comfort.zone].short}`,
        recommendedMinimum
          ? `Minimal ${fmtInt(recommendedMinimum.diagonalIn)}" · nyaman ${recommended ? `${fmtInt(recommended.diagonalIn)}"` : "—"}`
          : UKURAN_COPY.results.verdictNoPanel,
        `Plafon ${fmtFixed(mounting.ceilingHeightM, 1)} m`,
      ],
      verdict: result.headline.verdict,
      tone: result.headline.tone,
    },
  };
}

const UKURAN_ENTRY: ToolEntry = {
  key: "UkuranLayar",
  slug: "ukuran-layar",
  path: UKURAN_PATH,
  order: 1,
  name: UKURAN_COPY.toolName,
  shortName: UKURAN_COPY.shortName,
  eyebrow: UKURAN_COPY.eyebrow,
  h1: UKURAN_COPY.h1,
  widgetTitle: UKURAN_COPY.h2,
  intro: UKURAN_COPY.intro,
  answers: "Berapa inci layar yang masih terbaca dari kursi paling belakang, dan apakah plafon Anda cukup untuk layar itu.",
  seoTitle: "Kalkulator Ukuran Layar (AVIXA DISCAS) — Hitung Diagonal dan Jarak Pandang",
  seoDescription:
    "Hitung ukuran layar minimum dari jarak penonton terjauh dengan metode AVIXA DISCAS, lengkap dengan perhitungannya. Panel komersial 55–110 inci, aturan plafon 1,2 m, dan tabel jangkauan per ukuran.",
  verifiedAt: UKURAN_COPY.verifiedAt,
  standardChips: UKURAN_COPY.standardChip,
  labels: {
    fields: UKURAN_COPY.fieldsLabel,
    submit: UKURAN_COPY.submitLabel,
    reset: UKURAN_COPY.resetLabel,
    result: UKURAN_COPY.resultLabel,
    math: UKURAN_COPY.mathSummary,
  },
  examplesTitle: "Empat ruangan Indonesia, dihitung penuh",
  examplesIntro:
    "Dihitung oleh mesin yang sama seperti kalkulator di atas. Klik judulnya untuk membuka ruangan itu.",
  examples: ukuranExamples,
  reference: ukuranReferenceTables,
  refusals: [
    {
      id: "kontras",
      title: UKURAN_COPY.contrastRefusal.title,
      body: UKURAN_COPY.contrastRefusal.body,
      note: "Kecerahan dan kontras adalah dua hal berbeda. Alat ini hanya menghitung geometri: jarak, tinggi gambar, dan ketajaman mata.",
    },
  ],
  limits: { title: "Yang tidak dilihat kalkulator ini", items: UKURAN_COPY.limits },
  faqTitle: "Pertanyaan yang sering muncul",
  faq: [
    {
      q: "Kenapa yang diminta jarak ke mata penonton, bukan ke dinding belakang?",
      a: "Karena yang membaca layar adalah mata, bukan dinding. Di ruang rapat, kursi terakhir biasanya berjarak 0,8–1,2 m dari dinding belakang, dan selisih 1 m pada jarak 7 m sudah cukup untuk menggeser kebutuhan ukuran layar satu tingkat panel penuh. Ukur ke posisi mata orang yang duduk paling belakang, dalam tata letak kursi yang benar-benar akan dipakai.",
    },
    {
      q: "Apa bedanya ADM dan BDM, dan mana yang harus saya pilih?",
      a: "BDM (Basic Decision Making) dipakai ketika penonton hanya perlu membaca elemen terkecil di slide — judul, bullet, angka dashboard. Ukurannya ditentukan oleh tinggi elemen terkecil sebagai persentase tinggi gambar (%EH), dan pada %EH 3 persamaannya sama dengan aturan 6H yang dikenal luas. ADM (Analytical Decision Making) dipakai ketika penonton harus membedakan detail sebesar satu piksel — gambar kerja CAD, GIS, single line diagram, citra medis. Ukurannya ditentukan oleh resolusi vertikal, bukan oleh tinggi huruf. Sekitar 80% ruangan Indonesia adalah BDM.",
    },
    {
      q: "Kenapa layar 65 inci yang biasa dipakai sering ternyata terlalu kecil?",
      a: "Karena 65 inci adalah ukuran yang dipilih dari daftar harga, bukan dari geometri ruangan. Panel 65 inci 16:9 memberi tinggi gambar sekitar 0,81 m. Untuk konten bullet (%EH 2) itu terbaca sampai sekitar 3,2 m, sementara ruang rapat 8–12 orang di Indonesia biasanya punya kursi terjauh 6–7 m. Layarnya tidak salah; jaraknya yang tidak pernah dihitung.",
    },
    {
      q: "Kalau resolusinya dinaikkan ke 4K, apakah layarnya boleh lebih kecil?",
      a: "Tidak, dan pada konten analitis justru sebaliknya. Pada model BDM resolusi sama sekali tidak masuk persamaan: yang menentukan adalah tinggi elemen terkecil, dan huruf 4K yang kecil tetap kecil. Pada model ADM, menaikkan resolusi vertikal dari 1080 ke 2160 menuntut tinggi gambar dua kali lipat, karena setiap piksel tetap harus menyudut satu arcmenit di mata penonton terjauh. Resolusi lebih tinggi membeli detail, bukan jarak pandang.",
    },
    {
      q: "Plafon saya hanya 2,8 m dan kalkulator bilang tidak cukup. Apa yang bisa dilakukan?",
      a: "Ini kendala arsitektur, bukan kendala AV, dan lebih baik diketahui sebelum panel dibeli. Aturannya: bawah gambar 1,2 m dari lantai agar baris belakang tidak terhalang kepala baris depan, ditambah tinggi panel. Pilihan yang tersisa biasanya memindahkan kursi terjauh lebih dekat, menurunkan tuntutan konten (dari teks padat ke slide judul besar), memakai proyektor dengan layar yang bisa naik-turun, atau menerima bahwa baris terakhir tidak akan bisa membaca konten terpadat.",
    },
    {
      q: "Kenapa alat ini tidak menampilkan rasio kontras sistem?",
      a: "Karena kami belum bisa memverifikasinya. Nilai per kategori ISCR yang beredar di blog AV saling bertentangan, dan ANSI/AVIXA V201.01:2021 adalah dokumen berbayar yang tidak boleh kami reproduksi. Kami lebih memilih tidak menerbitkan angka daripada mengulang folklore. Kontras sistem diukur di ruangan, bukan dihitung dari denah.",
    },
  ],
  standards: UKURAN_COPY.standards.map((standard) => ({
    name: standard.name,
    title: standard.title,
    usedFor: standard.scope,
    checkedAt: standard.checked,
  })),
  standardsNote: `${UKURAN_COPY.standardsNote} ${UKURAN_COPY.constantsNote}`,
  defaults: SCREEN_SIZE_DEFAULTS,
  copy: UKURAN_COPY,
  Panel: UkuranPanel as ComponentType<never>,
  hasParams: (query) => hasScreenSizeParams(query),
  href: (query) => screenSizeHref(parseScreenSizeParams(query), UKURAN_PATH),
  build(query) {
    const input = parseScreenSizeParams(query);
    const result = computeScreenSize(input);
    const shareHref = screenSizeHref(input, UKURAN_PATH);
    const handoff =
      result.status === "ok"
        ? buildProjectorHandoff({
            requiredDiagonalInches: result.required.diagonalIn,
            imageWidthM: result.required.imageWidthM,
          })
        : null;

    const detailLines =
      result.status === "ok"
        ? [
            `Kursi terjauh ${fmtFixed(input.farthestViewerM, 1)} m, plafon ${fmtFixed(input.ceilingHeightM, 1)} m, konten ${result.model.short} %EH ${fmtInt(input.elementHeightPercent)}.`,
            `Hitungan ACTA: minimal ${result.recommendedMinimum ? `${fmtInt(result.recommendedMinimum.diagonalIn)}"` : `${fmt(result.minimum.diagonalIn)}" (di luar panel)`}, nyaman ${result.recommended ? `${fmtInt(result.recommended.diagonalIn)}"` : `${fmt(result.required.diagonalIn)}" (di luar panel)`}.`,
            `Rencana ${fmtInt(input.plannedDiagonalIn)}" pada ${fmtFixed(result.comfort.ratio, 1)}× tinggi gambar — ${UKURAN_COPY.zones[result.comfort.zone].short}.`,
          ]
        : [`Input kalkulator ukuran layar saling bertentangan: ${result.refusal.detail}`];

    return {
      hasParams: hasScreenSizeParams(query),
      shareHref,
      ogSlug: toOgSlug("ukuran-layar", shareHref),
      detailLines,
      view: ukuranView(input, result),
      panel: () => createElement(UkuranPanel, { initial: input, basePath: UKURAN_PATH }),
      resultActions: () => (handoff ? createElement(CalcHandoffCta, { handoff }) : null),
    };
  },
};

/* ------------------------------------------------------------------ *
 * 02 · rt60-sabine — reverberation & intelligibility
 * ------------------------------------------------------------------ */

function rt60ExampleFacts(result: Rt60Result): readonly { label: string; value: string }[] {
  return [
    { label: RT60_COPY.exampleLabel.tMid, value: `${fmt(result.tMid)} detik` },
    { label: RT60_COPY.exampleLabel.target, value: `${fmtFixed(result.treatment.targetRt60, 1)} detik` },
    {
      label: RT60_COPY.exampleLabel.model,
      value: RT60_COPY.result.modelValue[result.midModel],
    },
    {
      label: RT60_COPY.exampleLabel.treatment,
      value: result.treatment.meetsTarget
        ? RT60_COPY.result.treatmentMetValue
        : `${fmt(result.treatment.additionalAbsorption)} m² sabin ≈ ${fmt(result.treatment.panelArea)} m² panel`,
    },
  ];
}

function rt60Examples(): readonly ToolExample[] {
  return buildWorkedExamples().map((example) => ({
    id: example.id,
    title: example.title,
    context: example.description,
    facts: rt60ExampleFacts(example.result),
    verdict: example.verdict,
    href: rt60Href(example.input, RT60_TOOL_PATH),
  }));
}

function rt60ReferenceTables(): readonly ToolTable[] {
  return [
    {
      id: "alpha",
      caption: RT60_COPY.reference.alphaCaption,
      columns: RT60_COPY.reference.alphaColumns,
      rows: buildAlphaReferenceRows(),
      note: RT60_COPY.reference.alphaNote,
      minWidth: "52rem",
    },
    {
      id: "target",
      caption: RT60_COPY.reference.targetCaption,
      columns: RT60_COPY.reference.targetColumns,
      rows: buildTargetReferenceRows(),
      note: RT60_COPY.reference.targetNote,
      minWidth: "38rem",
    },
    {
      id: "standar",
      caption: RT60_COPY.reference.standardsCaption,
      columns: RT60_COPY.reference.standardsColumns,
      rows: buildStandardsReferenceRows(),
      note: RT60_COPY.reference.standardsNote,
      minWidth: "42rem",
    },
  ];
}

function rt60View(result: Rt60Result): ToolResultView {
  const { input, geometry, treatment } = result;
  const targetRange = `${fmtFixed(treatment.targetRange[0], 1)}–${fmtFixed(treatment.targetRange[1], 1)}`;

  const readouts: ToolReadout[] = [
    {
      id: "model",
      label: RT60_COPY.result.modelLabel,
      value: RT60_COPY.result.modelValue[result.midModel],
      caption: RT60_COPY.result.modelCaption[result.midModel],
      tone: "neutral",
      size: "md",
    },
    treatment.meetsTarget
      ? {
          id: "treatment",
          label: RT60_COPY.result.treatmentMetLabel,
          value: RT60_COPY.result.treatmentMetValue,
          caption: RT60_COPY.result.treatmentMetCaption,
          tone: "good",
          size: "md",
        }
      : {
          id: "treatment",
          label: RT60_COPY.result.treatmentLabel,
          value: RT60_COPY.result.treatmentValue({
            sabin: fmt(treatment.additionalAbsorption),
            panel: fmt(treatment.panelArea),
          }),
          caption: RT60_COPY.result.treatmentCaption({
            coverage: `${fmt(treatment.coverageRatio * 100)}%`,
            available: fmt(treatment.availableArea),
            band: `${fmtInt(treatment.governingBand)} Hz`,
          }),
          tone: treatment.feasible ? "warning" : "bad",
          size: "md",
        },
    {
      id: "dc",
      label: RT60_COPY.result.dcLabel,
      value: fmt(result.criticalDistance),
      unit: RT60_COPY.result.dcUnit,
      caption: RT60_COPY.result.dcCaption({ dc: fmt(result.criticalDistance) }),
      tone: "neutral",
      size: "md",
    },
    {
      id: "room-constant",
      label: RT60_COPY.result.roomConstantLabel,
      value: fmt(result.roomConstant),
      unit: "m²",
      caption: `Volume ${fmt(geometry.volume)} m³, luas permukaan ${fmt(geometry.totalSurface)} m², frekuensi Schroeder ${fmtInt(result.schroederFrequency)} Hz.`,
      tone: "neutral",
      size: "md",
    },
  ];

  // ISO 3382-1 / DIN 18041 targets were always a RANGE in the engine
  // (`ROOM_TARGETS[].range`); the readout only ever printed the midpoint. The
  // band is two-sided here, unlike the display tool: a room can be too dead.
  const [rangeLow, rangeHigh] = treatment.targetRange;
  const rt60Gauge: ToolGauge = {
    label: RT60_COPY.result.gaugeLabel,
    value: result.tMid,
    valueLabel: `${fmt(result.tMid)} detik`,
    max: Math.max(rangeHigh * 2.4, result.tMid * 1.15),
    zones: [
      { label: RT60_COPY.result.gaugeZones.mati, upTo: rangeLow, tone: "warning" },
      { label: RT60_COPY.result.gaugeZones.target, upTo: rangeHigh, tone: "good" },
      { label: RT60_COPY.result.gaugeZones.agak, upTo: rangeHigh * 1.5, tone: "warning" },
      { label: RT60_COPY.result.gaugeZones.gema, upTo: null, tone: "bad" },
    ],
    ticks: [
      { at: rangeLow, label: fmtFixed(rangeLow, 1) },
      { at: rangeHigh, label: fmtFixed(rangeHigh, 1) },
    ],
    caption: RT60_COPY.result.gaugeCaption({
      room: treatment.roomLabel,
      range: targetRange,
    }),
    description: RT60_COPY.result.gaugeDescription({
      tMid: fmt(result.tMid),
      room: treatment.roomLabel,
      range: targetRange,
    }),
  };

  return {
    refusal: null,
    lede: null,
    headline: {
      id: "headline",
      label: RT60_COPY.result.headlineLabel,
      value: fmt(result.tMid),
      unit: RT60_COPY.result.headlineUnit,
      caption: RT60_COPY.result.headlineCaption({
        target: fmtFixed(treatment.targetRt60, 1),
        room: treatment.roomLabel,
        range: targetRange,
      }),
      verdict: result.verdict.text,
      tone: result.verdict.tone,
      size: "lg",
    },
    gauge: rt60Gauge,
    readouts,
    findings: result.findings.map((finding) => ({
      id: finding.id,
      severity: finding.severity,
      title: finding.title,
      detail: finding.detail,
    })),
    tables: [
      {
        id: "bands",
        caption: RT60_COPY.result.bandsCaption,
        columns: RT60_COPY.result.bandsColumns,
        rows: buildBandReferenceRows(result),
        note: RT60_COPY.result.bandsNote,
        minWidth: "38rem",
      },
      {
        id: "surfaces",
        caption: RT60_COPY.result.surfacesCaption({ band: `${fmtInt(treatment.governingBand)} Hz` }),
        columns: RT60_COPY.result.surfacesColumns,
        rows: buildSurfaceReferenceRows(result),
        note: surfaceTableNote(result),
        minWidth: "44rem",
      },
    ],
    diagram: {
      kind: "potongan-akustik",
      id: "rt60-potongan",
      title: `Potongan ruang ${fmtFixed(input.length, 1)} × ${fmtFixed(input.width, 1)} × ${fmtFixed(input.height, 1)} m`,
      desc:
        `Potongan memanjang ruang sedalam ${fmtFixed(input.length, 1)} m dengan plafon ${fmtFixed(input.height, 1)} m. ` +
        `Lantai ${FLOOR_LABEL[input.floor]}, dinding ${WALL_LABEL[input.wall]}, plafon ${CEILING_LABEL[input.ceiling]}. ` +
        `Seorang pembicara berdiri di dekat dinding depan; lingkaran di sekelilingnya menandai jarak kritis ${fmt(result.criticalDistance)} m, ` +
        `batas ketika suara pantulan mulai melebihi suara langsung.`,
      caption: `Potongan memanjang. Lingkaran putus-putus adalah jarak kritis Dc = ${fmt(result.criticalDistance)} m dari pembicara.`,
      tableCaption: RT60_COPY.result.geometryCaption,
      rows: buildGeometryReferenceRows(result).map((row) => ({
        label: String(row["item"] ?? ""),
        value: String(row["value"] ?? ""),
      })),
      lengthM: input.length,
      heightM: input.height,
      floorLabel: FLOOR_LABEL[input.floor],
      wallLabel: WALL_LABEL[input.wall],
      ceilingLabel: CEILING_LABEL[input.ceiling],
      criticalDistanceM: result.criticalDistance,
      talkerHeightM: 1.6,
    },
    math: {
      steps: result.steps,
      assumptions: result.assumptions,
      standards: result.standards,
      verifiedAt: result.verifiedAt,
    },
    og: {
      eyebrow: RT60_COPY.eyebrow,
      toolName: RT60_COPY.shortName,
      headline: `RT60 ${fmt(result.tMid)} detik`,
      specs: [
        `Target ${fmtFixed(treatment.targetRt60, 1)} detik`,
        `Ruang ${fmtFixed(input.length, 1)} × ${fmtFixed(input.width, 1)} × ${fmtFixed(input.height, 1)} m`,
        treatment.meetsTarget
          ? "Sudah memenuhi target"
          : `Butuh ${fmt(treatment.panelArea)} m² panel akustik`,
      ],
      verdict: result.verdict.text,
      tone: result.verdict.tone,
    },
  };
}

const RT60_ENTRY: ToolEntry = {
  key: "Rt60Sabine",
  slug: "rt60-sabine",
  path: RT60_TOOL_PATH,
  order: 2,
  name: RT60_COPY.name,
  shortName: RT60_COPY.shortName,
  eyebrow: RT60_COPY.eyebrow,
  h1: RT60_COPY.name,
  widgetTitle: RT60_COPY.title,
  intro: RT60_COPY.intro,
  answers: "Berapa lama suara menggantung di ruangan Anda, dan berapa meter persegi panel akustik yang harus masuk RAB.",
  seoTitle: "Kalkulator RT60 (Sabine & Eyring) — Waktu Dengung dan Kejelasan Suara",
  seoDescription:
    "Hitung RT60 pada enam pita oktaf dengan Sabine atau Eyring, lengkap dengan perhitungannya, koefisien α material bangunan Indonesia, dan luas panel akustik yang dibutuhkan dalam m².",
  verifiedAt: RT60_VERIFIED,
  standardChips: RT60_STANDARDS_CHIP,
  labels: {
    fields: RT60_COPY.fieldsLabel,
    submit: RT60_COPY.submitLabel,
    reset: RT60_COPY.resetLabel,
    result: RT60_COPY.resultLabel,
    math: RT60_COPY.mathSummary,
  },
  examplesTitle: RT60_COPY.examplesTitle,
  examplesIntro: RT60_COPY.examplesIntro,
  examples: rt60Examples,
  reference: rt60ReferenceTables,
  // The STI refusal is NOT listed here: it ships as <StipaCta>, which frames the
  // refusal, prints the IEC scale and carries the ask. Rendering both would print
  // the same refusal twice on one page.
  refusals: [],
  limits: {
    title: "Yang tidak dilihat kalkulator ini",
    items: [
      "kebisingan latar dari AC, lalu lintas, dan ruang sebelah — penentu kejelasan yang tidak terlihat di denah",
      "bentuk ruang yang tidak kotak: balok, ceruk, mezanin, dan kubah",
      "distribusi panel akustik; luas yang benar dengan penempatan yang salah tetap memberi akustik yang buruk",
      "perabot, rak, dan partisi yang menyerap dan menyebarkan suara di ruangan yang benar-benar terpakai",
    ],
  },
  faqTitle: RT60_COPY.faqTitle,
  faq: RT60_COPY.faq,
  standards: RT60_STANDARDS.map((standard) => ({
    name: standard.name,
    usedFor: standard.scope,
    checkedAt: standard.checked,
  })),
  standardsNote: RT60_COPY.reference.standardsNote,
  defaults: RT60_DEFAULT_INPUT,
  copy: RT60_COPY,
  Panel: Rt60Panel as ComponentType<never>,
  hasParams: (query) => hasRt60Params(query),
  href: (query) => rt60Href(parseRt60Params(query), RT60_TOOL_PATH),
  build(query) {
    const input: Rt60Input = parseRt60Params(query);
    const result = computeRt60(input);
    const shareHref = rt60Href(input, RT60_TOOL_PATH);

    const detailLines = [
      `Ruang ${fmtFixed(input.length, 1)} × ${fmtFixed(input.width, 1)} × ${fmtFixed(input.height, 1)} m, ${result.treatment.roomLabel.toLowerCase()}.`,
      `Hitungan ACTA: RT60 ${fmt(result.tMid)} detik (target ${fmtFixed(result.treatment.targetRt60, 1)} detik).`,
      result.treatment.meetsTarget
        ? "Ruangan sudah di dalam rentang target."
        : `Perlu tambahan ${fmt(result.treatment.additionalAbsorption)} m² sabin ≈ ${fmt(result.treatment.panelArea)} m² panel akustik 50 mm.`,
    ];

    return {
      hasParams: hasRt60Params(query),
      shareHref,
      ogSlug: toOgSlug("rt60-sabine", shareHref),
      detailLines,
      view: rt60View(result),
      panel: () => createElement(Rt60Panel, { initial: input, action: RT60_TOOL_PATH }),
      resultActions: () =>
        createElement(StipaCta, {
          likelihood: result.stipa.likelihood,
          detailLines,
          resultUrl: shareHref,
        }),
    };
  },
};

/* ------------------------------------------------------------------ *
 * 03 · throw-distance-proyektor — throw + brightness
 * ------------------------------------------------------------------ */

const THROW_TONE: Record<ThrowResult["brightness"]["verdict"], ResultTone> = {
  aman: "good",
  marginal: "warning",
  kurang: "bad",
};

const THROW_SEVERITY: Record<"kritis" | "peringatan" | "info", ToolFindingSeverity> = {
  kritis: "critical",
  peringatan: "warning",
  info: "info",
};

function throwExamples(): readonly ToolExample[] {
  return THROW_EXAMPLES.map((example) => {
    const result = computeThrow(example.input);
    return {
      id: example.id,
      title: example.title,
      context: example.context,
      facts: [
        { label: "Kecerahan di layar", value: `${fmt(result.brightness.flEffective)} fL` },
        { label: "Target", value: `${fmtInt(result.target.fL)} fL · ${result.target.label}` },
        { label: "Jarak lempar", value: `${fmt(result.throwDistanceM)} m` },
        {
          label: "Lumen minimum",
          value: `${fmtInt(Math.ceil(result.brightness.lumensRequired))} lm`,
        },
      ],
      verdict: example.takeaway,
      href: buildToolHref(example.input, THROW_PATH),
    };
  });
}

function throwReferenceTables(): readonly ToolTable[] {
  const matrixRows: ReferenceRow[] = THROW_REFERENCE.matrix.widthsM.map((width) => {
    const height = (width * 9) / 16;
    return {
      width: `${fmtFixed(width, 1)} m`,
      area: `${fmt(width * height)} m²`,
      dark: fmtInt(Math.ceil(requiredLumensForWidth(width, "16x9", 1, 12))),
      controlled: fmtInt(Math.ceil(requiredLumensForWidth(width, "16x9", 1, 22))),
      high: fmtInt(Math.ceil(requiredLumensForWidth(width, "16x9", 1, 40))),
    };
  });

  return [
    {
      id: "brightness",
      caption: THROW_REFERENCE.brightness.caption,
      columns: THROW_REFERENCE.brightness.columns,
      rows: THROW_REFERENCE.brightness.rows,
      note: THROW_REFERENCE.brightness.note,
      minWidth: "44rem",
    },
    {
      id: "matrix",
      caption: THROW_REFERENCE.matrix.caption,
      columns: [
        { key: "width", label: THROW_REFERENCE.matrix.columns.width, mono: true, width: "8rem" },
        { key: "area", label: THROW_REFERENCE.matrix.columns.area, align: "right", mono: true },
        { key: "dark", label: THROW_REFERENCE.matrix.columns.dark, align: "right", mono: true },
        { key: "controlled", label: THROW_REFERENCE.matrix.columns.controlled, align: "right", mono: true },
        { key: "high", label: THROW_REFERENCE.matrix.columns.high, align: "right", mono: true },
      ],
      rows: matrixRows,
      note: THROW_REFERENCE.matrix.note,
      minWidth: "40rem",
    },
    {
      id: "throw-classes",
      caption: THROW_REFERENCE.throwClasses.caption,
      columns: THROW_REFERENCE.throwClasses.columns,
      rows: THROW_REFERENCE.throwClasses.rows,
      note: THROW_REFERENCE.throwClasses.note,
      minWidth: "46rem",
    },
    {
      id: "gains",
      caption: THROW_REFERENCE.gains.caption,
      columns: THROW_REFERENCE.gains.columns,
      rows: THROW_REFERENCE.gains.rows,
      note: THROW_REFERENCE.gains.note,
      minWidth: "42rem",
    },
  ];
}

function throwView(result: ThrowResult): ToolResultView {
  const { input, screen, brightness, target } = result;
  const tone = THROW_TONE[brightness.verdict];
  const ambientLabel = AMBIENT_LABELS[input.ambient];

  const geometryReadout: ToolReadout =
    input.mode === "jarak"
      ? {
          id: "throw",
          label: THROW_RESULT.throwLabel,
          value: fmt(result.throwDistanceM),
          unit: "m",
          caption: THROW_RESULT.throwCaption({
            tr: fmt(result.throwRatio),
            width: fmt(screen.widthM),
          }),
          tone: "neutral",
          size: "md",
        }
      : {
          id: "width",
          label: THROW_RESULT.widthLabel,
          value: fmt(screen.widthM),
          unit: "m",
          caption: THROW_RESULT.widthCaption({
            tr: fmt(result.throwRatio),
            distance: fmt(result.throwDistanceM),
          }),
          tone: "neutral",
          size: "md",
        };

  // aman / marginal / kurang already existed in the engine (`classifyBrightness`,
  // MARGINAL_RATIO 0,8) — it just arrived as a chip. Drawn as a band, "18 fL
  // against a 16 fL target" stops reading as a bare number and starts reading as
  // headroom, which is the actual decision.
  const marginalFL = target.fL * MARGINAL_RATIO;
  const throwGauge: ToolGauge = {
    label: THROW_RESULT.gaugeLabel,
    value: brightness.flEffective,
    valueLabel: `${fmt(brightness.flEffective)} fL`,
    max: Math.max(target.fL * 2, brightness.flEffective * 1.15),
    zones: [
      { label: THROW_RESULT.gaugeZones.kurang, upTo: marginalFL, tone: "bad" },
      { label: THROW_RESULT.gaugeZones.marginal, upTo: target.fL, tone: "warning" },
      { label: THROW_RESULT.gaugeZones.aman, upTo: null, tone: "good" },
    ],
    ticks: [
      { at: marginalFL, label: fmt(marginalFL) },
      { at: target.fL, label: `${fmtInt(target.fL)} fL` },
    ],
    caption: THROW_RESULT.gaugeCaption({
      target: fmtInt(target.fL),
      ambient: ambientLabel,
    }),
    description: THROW_RESULT.gaugeDescription({
      fl: fmt(brightness.flEffective),
      target: fmtInt(target.fL),
      ambient: ambientLabel,
    }),
  };

  return {
    refusal: null,
    lede: result.summary,
    headline: {
      id: "headline",
      label: THROW_RESULT.brightnessLabel,
      value: fmt(brightness.flEffective),
      unit: THROW_RESULT.brightnessUnit,
      caption: THROW_RESULT.brightnessCaption({
        lumens: fmtInt(brightness.lumensRated),
        effective: fmtInt(Math.round(brightness.lumensEffective)),
        ambient: `${fmtInt(target.fL)} fL · ${ambientLabel}`,
      }),
      verdict: THROW_RESULT.verdict[brightness.verdict]({ target: fmtInt(target.fL) }),
      tone,
      size: "lg",
    },
    gauge: throwGauge,
    readouts: [
      geometryReadout,
      {
        id: "lumens",
        label: THROW_RESULT.lumensLabel,
        value: fmtInt(Math.ceil(brightness.lumensRequired)),
        unit: THROW_RESULT.lumensUnit,
        caption: THROW_RESULT.lumensCaption({
          target: fmtInt(target.fL),
          recommended: fmtInt(Math.ceil(brightness.lumensRequiredRecommended)),
        }),
        tone: brightness.lumensShortfall > 0 ? "warning" : "neutral",
        size: "md",
      },
      {
        id: "nits",
        label: THROW_RESULT.nitsLabel,
        value: fmt(brightness.nits),
        unit: THROW_RESULT.nitsUnit,
        caption: `Konversi 1 fL = 3,426 cd/m². Angka ini untuk membandingkan dengan panel LED, yang dijual dalam cd/m².`,
        tone: "neutral",
        size: "md",
      },
      {
        id: "screen",
        label: THROW_RESULT.screenLabel,
        value: `${fmt(screen.widthM)} × ${fmt(screen.heightM)} m`,
        caption: THROW_RESULT.screenCaption({
          width: fmt(screen.widthM),
          height: fmt(screen.heightM),
          diagonalInch: fmt(screen.diagonalInch),
          areaM2: fmt(screen.areaM2),
        }),
        tone: "neutral",
        size: "md",
      },
    ],
    findings: result.findings.map((finding) => ({
      id: finding.id,
      severity: THROW_SEVERITY[finding.severity],
      title: finding.title,
      detail: finding.detail,
    })),
    tables: [],
    diagram: {
      kind: "potongan-proyeksi",
      id: "throw-potongan",
      title: `Potongan optik: lensa ${fmt(result.throwDistanceM)} m dari layar ${fmt(screen.widthM)} m`,
      desc:
        `Potongan memanjang jalur proyeksi. Lensa berada ${fmt(result.throwDistanceM)} m tegak lurus dari layar ` +
        `selebar ${fmt(screen.widthM)} m dan setinggi ${fmt(screen.heightM)} m, dengan throw ratio ${fmt(result.throwRatio)}. ` +
        `Dua garis dari lensa ke tepi atas dan tepi bawah layar menandai berkas cahaya. ` +
        `Tinggi pemasangan dan offset lensa tidak digambar karena tidak dimodelkan oleh alat ini.`,
      caption:
        "Potongan optik, bukan potongan ruangan: sumbu lensa digambar tegak lurus di tengah tinggi layar. " +
        "Tinggi pemasangan, offset lensa, dan lens shift berbeda per unit dan hanya ada di lembar data proyektor.",
      tableCaption: "Data diagram — geometri proyeksi",
      rows: [
        { label: "Throw ratio", value: `${fmt(result.throwRatio)} ×` },
        { label: "Jarak lensa ke layar", value: `${fmt(result.throwDistanceM)} m` },
        { label: "Lebar layar", value: `${fmt(screen.widthM)} m` },
        { label: "Tinggi layar", value: `${fmt(screen.heightM)} m` },
        { label: "Diagonal layar", value: `${fmt(screen.diagonalInch)}"` },
        { label: "Luas layar", value: `${fmt(screen.areaM2)} m² (${fmt(screen.areaFt2)} ft²)` },
        { label: "Rasio aspek", value: screen.aspect },
        { label: "Lumen lembar data", value: `${fmtInt(brightness.lumensRated)} lm` },
        { label: "Lumen setelah cadangan 0,75", value: `${fmtInt(Math.round(brightness.lumensEffective))} lm` },
        { label: "Kecerahan di layar", value: `${fmt(brightness.flEffective)} fL` },
        { label: "Target kecerahan", value: `${fmtInt(target.fL)} fL · ${ambientLabel}` },
      ],
      throwDistanceM: result.throwDistanceM,
      screenHeightM: screen.heightM,
      screenWidthM: screen.widthM,
    },
    math: {
      steps: result.steps,
      assumptions: result.assumptions,
      standards: THROW_TOOL.standardChips,
      verifiedAt: THROW_TOOL.verifiedAt,
    },
    og: {
      eyebrow: THROW_TOOL.eyebrow,
      toolName: THROW_TOOL.shortName,
      headline: `${fmt(brightness.flEffective)} fL di layar`,
      specs: [
        `Target ${fmtInt(target.fL)} fL · ${ambientLabel}`,
        `Layar ${fmt(screen.widthM)} × ${fmt(screen.heightM)} m`,
        `${fmtInt(brightness.lumensRated)} lm · TR ${fmt(result.throwRatio)} · jarak ${fmt(result.throwDistanceM)} m`,
      ],
      verdict: THROW_RESULT.verdict[brightness.verdict]({ target: fmtInt(target.fL) }),
      tone,
    },
  };
}

const THROW_ENTRY: ToolEntry = {
  key: "ThrowDistanceProyektor",
  slug: "throw-distance-proyektor",
  path: THROW_PATH,
  order: 3,
  name: THROW_TOOL.name,
  shortName: THROW_TOOL.shortName,
  eyebrow: THROW_TOOL.eyebrow,
  h1: THROW_TOOL.h1,
  widgetTitle: THROW_TOOL.widgetTitle,
  intro: THROW_TOOL.intro,
  answers: "Berapa jarak lensa ke layar, dan — yang lebih sering gagal di ruangan Indonesia — apakah lumennya cukup.",
  seoTitle: THROW_TOOL.seoTitle,
  seoDescription: THROW_TOOL.seoDescription,
  verifiedAt: THROW_TOOL.verifiedAt,
  standardChips: THROW_TOOL.standardChips,
  labels: {
    fields: THROW_FIELDS.legend,
    submit: THROW_FIELDS.submitLabel,
    reset: THROW_FIELDS.resetLabel,
    result: "Hasil perhitungan proyektor",
    math: THROW_MATH.summaryLabel,
  },
  examplesTitle: "Tiga ruangan Indonesia, dihitung penuh",
  examplesIntro:
    "Tiga konfigurasi yang paling sering kami temui, dihitung oleh mesin yang sama seperti kalkulator di atas. Judul setiap ruangan membuka kembali konfigurasi itu di kalkulator.",
  examples: throwExamples,
  reference: throwReferenceTables,
  refusals: [
    {
      id: "iscr",
      title: THROW_REFUSALS.iscr.title,
      body: THROW_REFUSALS.iscr.body,
      note: THROW_REFUSALS.iscr.note,
    },
  ],
  limits: { title: THROW_LIMITS.title, items: THROW_LIMITS.items },
  faqTitle: "Pertanyaan yang sering muncul",
  faq: THROW_FAQ,
  standards: THROW_STANDARDS.map((standard) => ({
    name: standard.name,
    title: standard.title,
    usedFor: standard.usedFor,
    checkedAt: standard.checkedAt,
  })),
  standardsNote:
    "ACTA menerbitkan matematikanya — konversi kaki persegi, foot-lambert, dan cadangan lampu — dan menyebut " +
    "standarnya, tetapi tidak pernah mereproduksi tabel di dalam standar berbayar.",
  defaults: THROW_DEFAULTS,
  copy: THROW_COPY,
  Panel: ThrowPanel as ComponentType<never>,
  hasParams: (query) => hasThrowParams(query),
  href: (query) => buildToolHref(parseThrowParams(query).input, THROW_PATH),
  build(query) {
    const parsed = parseThrowParams(query);
    const input: ThrowInput = parsed.input;
    const result = computeThrow(input);
    const shareHref = buildToolHref(input, THROW_PATH);

    const detailLines = [
      `Layar ${fmt(result.screen.widthM)} × ${fmt(result.screen.heightM)} m, throw ratio ${fmt(result.throwRatio)}, jarak lempar ${fmt(result.throwDistanceM)} m.`,
      `Hitungan ACTA: ${fmt(result.brightness.flEffective)} fL di layar, target ${fmtInt(result.target.fL)} fL untuk ${AMBIENT_LABELS[input.ambient]}.`,
      result.ledRecommended
        ? `Kebutuhan lumen ${fmtInt(Math.ceil(result.brightness.lumensRequired))} lm melewati batas wajar proyektor — mohon tinjau opsi LED direct-view.`
        : `Lumen minimum yang harus tertulis di lembar data: ${fmtInt(Math.ceil(result.brightness.lumensRequired))} lm.`,
    ];

    return {
      hasParams: hasThrowParams(query),
      shareHref,
      ogSlug: toOgSlug("throw-distance-proyektor", shareHref),
      detailLines,
      view: throwView(result),
      panel: () => createElement(ThrowPanel, { initial: input, path: THROW_PATH }),
      // The LED routing already ships as a `kritis` finding inside the result, and
      // §13.1 allows exactly one commercial ask per page. A second block here would
      // spend the budget the WhatsApp CTA at the foot of the page is holding.
      resultActions: () => null,
    };
  },
};

/* ------------------------------------------------------------------ *
 * The registry
 * ------------------------------------------------------------------ */

/**
 * `component_key` → calculator. Three literal entries, frozen.
 *
 * Keyed by the PascalCase `learn_tools.component_key`, which is what the column's
 * `^[A-Z][A-Za-z0-9]*$` CHECK permits — the kebab-case URL slug is a *different*
 * string and lives on `entry.slug`. A key that is not spelled here resolves to
 * `undefined`, which is how the routes render nothing for an unknown
 * `component_key` instead of 500-ing on a CMS row that names code nobody wrote.
 */
export const TOOL_REGISTRY: Readonly<Record<string, ToolEntry>> = Object.freeze({
  UkuranLayar: UKURAN_ENTRY,
  Rt60Sabine: RT60_ENTRY,
  ThrowDistanceProyektor: THROW_ENTRY,
});

/** Editorial order, for `/learn/alat` and for cross-links between tools. */
export const TOOL_ENTRIES: readonly ToolEntry[] = Object.freeze(
  Object.values(TOOL_REGISTRY).sort((a, b) => a.order - b.order),
);

/** The three `component_key` values, i.e. the keys of `TOOL_REGISTRY`. */
export const TOOL_KEYS: readonly string[] = TOOL_ENTRIES.map((entry) => entry.key);

/**
 * The three URL slugs. This — not `TOOL_KEYS` — is what `generateStaticParams`
 * must emit, because the dynamic segment is the slug.
 */
export const TOOL_SLUGS: readonly string[] = TOOL_ENTRIES.map((entry) => entry.slug);

/** Slug → entry, built once. Keeps `getToolEntry` a lookup rather than a scan. */
const BY_SLUG: Readonly<Record<string, ToolEntry>> = Object.freeze(
  Object.fromEntries(TOOL_ENTRIES.map((entry) => [entry.slug, entry])),
);

/**
 * The only lookup, and it accepts both key spaces on purpose.
 *
 * `component_key` first — that is what `learn_tools` stores and what the CMS
 * hands us — then the URL slug, which is what the route receives from the
 * dynamic segment and what `decodeToolOgSlug` recovers from the share card. The
 * two spaces cannot collide: a `component_key` must start uppercase and a slug
 * must be lowercase, so no string is ever a legal member of both.
 *
 * Resolving by slug is also what lets a calculator render before its CMS row has
 * been written: the code in this repo already carries the method, the standards,
 * the assumptions and the worked examples that §9.3's publish gate asks a row to
 * prove, so a missing row costs the editorial overlay, not the page.
 */
export function getToolEntry(key: string | null | undefined): ToolEntry | null {
  if (!key) return null;
  return TOOL_REGISTRY[key] ?? BY_SLUG[key] ?? null;
}

/** Sibling calculators, for the cross-link strip at the foot of a tool page. */
export function otherToolEntries(key: string): readonly ToolEntry[] {
  return TOOL_ENTRIES.filter((entry) => entry.key !== key);
}
