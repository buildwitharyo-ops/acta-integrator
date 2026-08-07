/**
 * The /learn conversion layer, as data (03-UI §13).
 *
 * Every user-facing string in the funnel lives here, verbatim from §13.2/§13.3,
 * so a copy change is one edit in one file rather than a grep across routes.
 * Route and body components import from here; they never inline CTA prose.
 *
 * Pure module — no React, no server-only, no I/O. `WaLearnCta` is a client
 * component and imports the message builder directly.
 *
 * The governing constraint is §13.1: **1 commercial CTA + 1 contextual CTA +
 * 0 interstitials per lesson.** CTA scarcity is the mechanism, not soft
 * language. The budget below is the machine-readable form of that rule.
 */

import { fmtInt } from "@/lib/learn/format";
import type { LearnRoleId } from "@/lib/learn/roles";
import { absoluteUrl } from "@/lib/site-url";

/**
 * GA4 `context` value for every learn-originated WhatsApp click (§14.7:
 * `whatsapp_click { context:'learn', ref, slug, jalur }`).
 *
 * It is a plain string, NOT a `WaContext` from `lib/wa.ts`. §13.4 asks for
 * `"learn"` to be added to that union "for GA4 cleanliness only", but the union
 * also drives `buildWaLink`'s message switch — and every learn CTA passes an
 * explicit `message`, which short-circuits the switch entirely. So the analytics
 * label lives here and `lib/wa.ts` stays untouched.
 */
export const LEARN_WA_CONTEXT = "learn";

/* ------------------------------------------------------------------ *
 * Taxonomy
 * ------------------------------------------------------------------ */

/**
 * §13.1 CTA classes.
 *   N  navigational — zero commitment, stays on site
 *   T  tool         — zero commitment, stays on site
 *   A  asset        — ungated download, low commitment
 *   H1 human, low   — WhatsApp
 *   H2 human, high  — site survey / on-site measurement
 */
export type CtaClass = "N" | "T" | "A" | "H1" | "H2";

/** Where a reader is in the funnel when a CTA is allowed to appear. */
export type LearnFunnelStage =
  /** Pure deposit. The lesson pays out and asks for nothing. */
  | "deposit"
  /** Zero-commitment next action: a calculator or an ungated file. */
  | "alat"
  /** Medium commitment: a WhatsApp message a human answers. */
  | "manusia"
  /** High commitment: someone drives to their building. */
  | "survei";

/** Every CTA that opens WhatsApp. T-class and A-class copy live separately below. */
export type LearnCtaId =
  | "tanya_engineer"
  | "review_spesifikasi"
  | "jadwal_survey"
  | "jadwal_stipa"
  | "kirim_hasil"
  | "kabari_revisi";

/** Which slot on the page a CTA is allowed to occupy. */
export type LearnCtaPlacement =
  | "akhir-pelajaran"
  | "halaman-jalur"
  | "hasil-kalkulator"
  | "kartu-unduhan";

export type LearnCtaCopy = {
  id: LearnCtaId;
  ctaClass: CtaClass;
  stage: LearnFunnelStage;
  /** Roles this CTA is written for. Empty means every role. */
  roles: readonly LearnRoleId[];
  /** Counts against the one-commercial-CTA-per-lesson budget. */
  commercial: boolean;
  placement: LearnCtaPlacement;
  /** The question (or statement) that opens the panel. */
  heading: string;
  /** One or two sentences under the heading. */
  body: string;
  /** The button face. Says what the READER gets — never "hubungi kami". */
  button: string;
  /** The line under the button: what actually happens next. */
  assurance: string;
  /** Optional bullet list rendered between body and button. */
  limits?: readonly string[];
};

/**
 * §13.2 — verbatim. Copy rules that produced these strings: name a specific
 * deliverable; state what happens next; no urgency, no scarcity, no "gratis!";
 * never promo / murah / diskon.
 *
 * ⚠️ `tanya_engineer.assurance` is deliberately the WEAK, TRUE version.
 * §13.2 forbids shipping "biasanya di bawah 4 jam" until `lib/notify.ts` has a
 * named owner plus backup with a stated coverage window. Upgrading this string
 * before that is staffed converts a trust asset into a trust liability at the
 * highest-value moment. Do not "improve" it.
 */
export const LEARN_CTA: Record<LearnCtaId, LearnCtaCopy> = {
  tanya_engineer: {
    id: "tanya_engineer",
    ctaClass: "H1",
    stage: "manusia",
    roles: ["pengambil-keputusan", "teknis-internal"],
    commercial: true,
    placement: "akhir-pelajaran",
    heading: "Ada yang tidak cocok dengan kondisi ruangan Anda?",
    body: "Kirim denah atau foto ruangan — insinyur kami baca dan balas apa adanya.",
    button: "Tanya Insinyur ACTA lewat WhatsApp",
    assurance: "Dibalas manusia pada hari kerja.",
  },

  review_spesifikasi: {
    id: "review_spesifikasi",
    ctaClass: "H1",
    stage: "manusia",
    roles: ["spesifier-pengadaan"],
    commercial: true,
    placement: "akhir-pelajaran",
    heading: "Sedang menyusun RKS atau BoQ tata suara?",
    body: "Kirim draft spesifikasi Anda. Kami review teknis tanpa biaya dan tanpa mengharuskan ACTA jadi pelaksana — hasilnya milik Anda.",
    button: "Kirim Draft Spesifikasi (WhatsApp)",
    assurance: "Kami tidak meneruskan draft Anda ke pihak lain.",
  },

  jadwal_survey: {
    id: "jadwal_survey",
    ctaClass: "H2",
    stage: "survei",
    roles: [],
    commercial: true,
    // H2 budget is ≤1 per JALUR, path page only — never on a lesson.
    placement: "halaman-jalur",
    heading: "Sudah punya ruangan dan rencana anggaran?",
    body: "Kami datang, ukur akustik dan kondisi eksisting, lalu kirim laporan temuan — apakah Anda lanjut dengan ACTA atau tidak.",
    button: "Jadwalkan Site Survey",
    assurance: "Jabodetabek: tanpa biaya. Luar Jabodetabek: kami diskusikan dulu.",
  },

  jadwal_stipa: {
    id: "jadwal_stipa",
    ctaClass: "H2",
    stage: "survei",
    roles: [],
    commercial: true,
    // §12.3: appears exactly where the RT60 tool refuses to output an STI number.
    placement: "hasil-kalkulator",
    heading: "Kejelasan suara (STI) tidak bisa dihitung dari dimensi ruang saja.",
    body: "STI menurut IEC 60268-16 dipengaruhi kebisingan latar, direktivitas loudspeaker, dan pantulan yang tidak terlihat di denah.",
    button: "Jadwalkan pengukuran STIPA →",
    assurance: "Kami ukur dengan alat STIPA di lokasi dan kirim hasilnya apa adanya.",
  },

  kirim_hasil: {
    id: "kirim_hasil",
    ctaClass: "H1",
    stage: "manusia",
    roles: [],
    commercial: true,
    placement: "hasil-kalkulator",
    heading: "Hasil lengkap di atas. Gratis, tanpa daftar.",
    body: "Yang kalkulator ini TIDAK bisa lihat:",
    limits: [
      "bentuk ruang yang tidak persegi",
      "balok struktur, ducting, grid plafon",
      "kebisingan latar (AC, lalu lintas, jamaah)",
      "material yang sebenarnya terpasang, bukan yang di gambar",
    ],
    button: "Kirim hasil ini + denah ke engineer ACTA →",
    assurance: "Kami balas dengan koreksi, bukan penawaran.",
  },

  kabari_revisi: {
    id: "kabari_revisi",
    ctaClass: "A",
    stage: "alat",
    roles: [],
    // Post-download opt-in, not a funnel ask: it sits BELOW a working link the
    // reader already used, so it costs the lesson nothing from the CTA budget.
    commercial: false,
    placement: "kartu-unduhan",
    heading: "Mau dikabari?",
    body: "Kami perbarui dokumen ini setiap ada revisi standar.",
    button: "Kabari saya",
    assurance: "Hanya dipakai untuk kabar revisi.",
  },
};

/**
 * §13.1 budget, machine-readable. `null` = unlimited.
 * `perJalur` applies to H2 only; everything else is counted per lesson.
 */
export const CTA_CLASS_BUDGET: Record<
  CtaClass,
  { perLesson: number | null; perJalur: number | null; leavesSite: boolean; commercial: boolean }
> = {
  N: { perLesson: null, perJalur: null, leavesSite: false, commercial: false },
  T: { perLesson: null, perJalur: null, leavesSite: false, commercial: false },
  A: { perLesson: 1, perJalur: null, leavesSite: false, commercial: true },
  H1: { perLesson: 1, perJalur: null, leavesSite: true, commercial: true },
  H2: { perLesson: 0, perJalur: 1, leavesSite: true, commercial: true },
};

/** The numeric rules from §13.1 that a review (or a test) can assert against. */
export const CTA_BUDGET = {
  /** At most one commercial CTA (A / H1 / H2) per lesson. */
  commercialPerLesson: 1,
  /** At most one contextual non-commercial CTA (N / T) inline per lesson. */
  contextualPerLesson: 1,
  /** Zero CTAs above the first H2. No hero button, no sidebar box, no sticky bar. */
  aboveFirstH2: 0,
  /** H-class density across a jalur: at most one lesson in three ends with a human CTA. */
  humanPerLessons: 3,
  /** No CTA in the first 40% of a jalur — lessons 1–3 of 8 are pure deposit. */
  depositFraction: 0.4,
} as const;

/* ------------------------------------------------------------------ *
 * Which CTA belongs where
 * ------------------------------------------------------------------ */

/** True while a lesson sits inside the opening deposit zone of its jalur. */
export function isDepositZone(position: number, total: number): boolean {
  if (!Number.isFinite(position) || !Number.isFinite(total)) return false;
  if (total <= 1 || position < 1) return false;
  return position / total <= CTA_BUDGET.depositFraction;
}

/** The human CTA a given reader gets. Spesifiers get the review offer, everyone else the engineer. */
export function humanCtaFor(
  role: LearnRoleId | null | undefined,
): Extract<LearnCtaId, "tanya_engineer" | "review_spesifikasi"> {
  return role === "spesifier-pengadaan" ? "review_spesifikasi" : "tanya_engineer";
}

/**
 * The default end-of-lesson CTA for a lesson at `position` of `total` in a jalur.
 *
 * Returns `null` for the majority of lessons — that is the point. A lesson that
 * ends with `next lesson` instead of an ask is the norm; the ask is the exception
 * that the surrounding substance pays for.
 *
 * Rules encoded, all from §13.1:
 *   • nothing in the first 40% of a jalur;
 *   • then every third lesson counted BACKWARDS from the last one, so the final
 *     lesson — the highest-intent moment in the jalur — always carries the ask,
 *     and the spacing above it stays at 1:3;
 *   • role decides which of the two H1 offers appears.
 *
 * Worked out for the two shapes that exist: an 8-lesson jalur asks at 5 and 8
 * (2 ÷ 8, inside the ≤1:3 cap); a 5-lesson jalur asks only at 5.
 *
 * A lesson with no published jalur (`total <= 1`) is an orphan: the density rule
 * has no denominator, so it may carry its role's CTA. It still gets exactly one.
 */
export function resolveLessonCta(input: {
  /** 1-based position inside the jalur. */
  position: number;
  /** Published lessons in the jalur. Take it from `steps.length`, never the join table. */
  total: number;
  role?: LearnRoleId | null;
}): LearnCtaId | null {
  const { position, total, role } = input;
  if (!Number.isFinite(position) || position < 1) return null;
  if (!Number.isFinite(total) || total <= 1) return humanCtaFor(role);
  if (position > total) return null;
  if (isDepositZone(position, total)) return null;
  if ((total - position) % CTA_BUDGET.humanPerLessons !== 0) return null;
  return humanCtaFor(role);
}

/** Review helper: does a jalur stay inside the ≤1:3 human-CTA density cap? */
export function humanCtaDensityOk(humanCtaCount: number, totalLessons: number): boolean {
  if (totalLessons <= 0) return humanCtaCount === 0;
  return humanCtaCount * CTA_BUDGET.humanPerLessons <= totalLessons;
}

/* ------------------------------------------------------------------ *
 * T — tools
 * ------------------------------------------------------------------ */

export const LEARN_TOOL_BASE = "/learn/alat";

/**
 * The three v1 calculators. `learn_tools` in the database is the source of truth
 * for what is published; this constant exists only to type the hard-coded CTA
 * copy and the ukuran-layar → proyektor handoff below.
 */
export const LEARN_TOOL_SLUGS = [
  "ukuran-layar",
  "rt60-sabine",
  "throw-distance-proyektor",
] as const;

export type LearnToolSlug = (typeof LEARN_TOOL_SLUGS)[number];

/**
 * §13.2 T-class copy. The RT60 parenthetical is load-bearing: it pre-empts the
 * reflexive "ini pasti minta email dulu" before the reader has to wonder.
 */
export const TOOL_CTA_LABEL: Record<LearnToolSlug, string> = {
  "ukuran-layar": "Hitung dengan Kalkulator Ukuran Layar →",
  "rt60-sabine":
    "Coba angka ruangan Anda sendiri di Kalkulator RT60 (tanpa daftar, hasil bisa disalin)",
  "throw-distance-proyektor":
    "Hitung jarak lempar dan kecerahan proyektor di Kalkulator Proyektor →",
};

/** Human name of each tool, for breadcrumbs, handoff copy and WhatsApp messages. */
export const TOOL_NAME: Record<LearnToolSlug, string> = {
  "ukuran-layar": "Kalkulator Ukuran Layar",
  "rt60-sabine": "Kalkulator RT60",
  "throw-distance-proyektor": "Kalkulator Throw Distance Proyektor",
};

/**
 * Build a tool URL with state carried in the query string.
 *
 * Numbers are written with a DOT decimal separator — the canonical share format
 * (§12.1). `parseNum()` reads both registers, so a hand-typed comma still works,
 * but every link the site generates uses the dot.
 */
export function toolHref(
  slug: string,
  params?: Readonly<Record<string, string | number | null | undefined>>,
): string {
  const base = `${LEARN_TOOL_BASE}/${slug}`;
  if (!params) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      search.set(key, String(value));
      continue;
    }
    search.set(key, value);
  }

  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Largest flat panel that exists as a commercial product (§12.2). Above this the
 * honest answer is a projector, not a bigger panel — so the display tool hands
 * off rather than printing a diagonal nobody can buy.
 */
export const MAX_COMMERCIAL_PANEL_INCHES = 110;

export function needsProjectorHandoff(requiredDiagonalInches: number): boolean {
  return (
    Number.isFinite(requiredDiagonalInches) &&
    requiredDiagonalInches > MAX_COMMERCIAL_PANEL_INCHES
  );
}

/**
 * Everything `<CalcHandoffCta>` needs to route a reader from one tool to the
 * next with their numbers already in the URL. Built by the source tool, never
 * hand-written in a page.
 */
export type CalcHandoff = {
  from: LearnToolSlug;
  to: LearnToolSlug;
  href: string;
  eyebrow: string;
  heading: string;
  body: string;
  label: string;
  note?: string;
};

/**
 * `ukuran-layar` → `throw-distance-proyektor` (§12.2 edge case).
 *
 * Above 110" the honest answer is a projector or direct-view LED, not a bigger
 * panel — so the display tool stops printing a diagonal nobody can buy and hands
 * the reader over with the image width carried in the query string.
 *
 * Returns `null` when the required diagonal still fits a real product, so the
 * component only exists on the pages where the handoff is true.
 */
export function buildProjectorHandoff(input: {
  /** Diagonal DISCAS says the room needs, in inches. */
  requiredDiagonalInches: number;
  /** Image WIDTH in metres — the projector tool's `w` param, not the diagonal. */
  imageWidthM: number;
  /** Seed for the projector tool's throw-ratio field. Default 1,5 (common 1-chip DLP). */
  throwRatio?: number;
  /** Seed for the screen-gain field. Default 1,0 (matte white). */
  gain?: number;
}): CalcHandoff | null {
  const { requiredDiagonalInches, imageWidthM, throwRatio = 1.5, gain = 1.0 } = input;
  if (!needsProjectorHandoff(requiredDiagonalInches)) return null;
  if (!Number.isFinite(imageWidthM) || imageWidthM <= 0) return null;

  const diagonal = fmtInt(Math.round(requiredDiagonalInches));
  const width = Math.round(imageWidthM * 100) / 100;

  return {
    from: "ukuran-layar",
    to: "throw-distance-proyektor",
    href: toolHref("throw-distance-proyektor", { w: width, tr: throwRatio, g: gain }),
    eyebrow: "Batas panel komersial",
    heading: `Ruangan ini butuh diagonal ${diagonal}" — di atas panel terbesar yang dijual (${MAX_COMMERCIAL_PANEL_INCHES}").`,
    body: "Panel datar berhenti di 110 inci. Untuk gambar sebesar ini jawabannya proyektor atau LED direct-view, bukan panel yang lebih besar. Lebar gambar Anda kami bawa ke kalkulator berikutnya.",
    label: "Lanjut ke Kalkulator Throw Distance Proyektor →",
    note: "Kecerahan, bukan jarak lempar, yang paling sering gagal di ruangan Indonesia. Kalkulator berikutnya menghitung keduanya.",
  };
}

/**
 * Ref-code axis for tool pages (§13.4). A calculator sits outside any jalur, so
 * its three-letter code is `ALT` and the two-digit slot carries the tool number
 * instead of a lesson index.
 */
export const TOOL_REF_JALUR = "ALT";

export const TOOL_REF_INDEX: Record<LearnToolSlug, number> = {
  "ukuran-layar": 1,
  "rt60-sabine": 2,
  "throw-distance-proyektor": 3,
};

/* ------------------------------------------------------------------ *
 * A — ungated lead magnets (§13.3, decision D9)
 * ------------------------------------------------------------------ */

export type LeadMagnetId = "rks-tata-suara" | "checklist-ruang-rapat-hybrid";

export type LeadMagnet = {
  id: LeadMagnetId;
  title: string;
  /**
   * Public path under /unduh. Ungated, crawlable, no redirect, no token.
   * The binaries ship separately; filename, version and review date must match
   * what is printed on page 1 of the file itself.
   */
  href: string;
  format: "DOCX" | "PDF";
  pages: number;
  version: string;
  /** Review date printed on page 1. Update both together or the card lies. */
  reviewed: string;
  /** One or two sentences: what the reader can do with it. */
  summary: string;
  /** Who it is written for. */
  audience: string;
  /** Noun used in the opt-in sentence: "Kami perbarui {noun} ini …". */
  noun: string;
  /** Button face on the download card. */
  downloadLabel: string;
  /** §13.2 A-class inline label — the full spec, used when the CTA is a lone link. */
  inlineLabel: string;
  /** Three-letter ref axis for the optional WhatsApp opt-in (§13.4). */
  refJalur: string;
  /** Two-digit slot of the ref code. Stable per asset — never renumber a shipped one. */
  refIndex: number;
};

/**
 * Two assets at launch, not six (§13.3). Each passes the four tests: a consultant
 * would pay Rp 150.000 for it; it is usable without ACTA; it carries ACTA's
 * technical language into a document that outlives the download; page 1 carries a
 * version number and a review date.
 */
export const LEAD_MAGNETS: Record<LeadMagnetId, LeadMagnet> = {
  "rks-tata-suara": {
    id: "rks-tata-suara",
    title: "Template RKS — Pekerjaan Sistem Tata Suara",
    href: "/unduh/acta-template-rks-tata-suara-v1.2.docx",
    format: "DOCX",
    pages: 14,
    version: "v1.2",
    reviewed: "Maret 2026",
    summary:
      "Pasal demi pasal untuk dokumen tender: lingkup pekerjaan, spesifikasi teknis minimum, metode pengujian, dan syarat serah terima. Brand-neutral — tidak ada nama produk ACTA di dalamnya.",
    audience: "Konsultan MEP, arsitek, panitia teknis, dan tim pengadaan.",
    noun: "template",
    // .docx, not .pdf: a procurement manager needs to paste rows into an RKS.
    downloadLabel: "Unduh Template (DOCX)",
    inlineLabel: "Unduh Template RKS Pekerjaan Sistem Tata Suara (DOCX, 14 halaman, v1.2)",
    refJalur: "RKS",
    refIndex: 1,
  },

  "checklist-ruang-rapat-hybrid": {
    id: "checklist-ruang-rapat-hybrid",
    title: "Checklist Spesifikasi Ruang Rapat Hybrid (8–30 orang)",
    href: "/unduh/acta-checklist-ruang-rapat-hybrid-v1.0.pdf",
    format: "PDF",
    pages: 4,
    version: "v1.0",
    reviewed: "Agustus 2026",
    summary:
      "Tiga band ukuran ruang, sizing layar turunan DISCAS lengkap dengan aritmetikanya, ambang lulus/gagal RT60, prasyarat jaringan dan daya, plus 12 pertanyaan yang harus Anda tanyakan ke vendor.",
    audience: "IT manager, facility manager, dan pemilik usaha.",
    noun: "checklist",
    downloadLabel: "Unduh Checklist (PDF)",
    inlineLabel: "Unduh Checklist Spesifikasi Ruang Rapat Hybrid (PDF, 4 halaman)",
    refJalur: "TSU",
    refIndex: 2,
  },
};

/** Printed under every download button. The single most important line on the card. */
export const ASSET_UNGATED_NOTE = "Unduh langsung. Tidak perlu isi form.";

/**
 * Labels for the optional, below-the-link identity ask (§13.3).
 *
 * It asks for a **WhatsApp number, never an email**: a facility manager types a
 * throwaway Gmail without hesitating, but the number is the one they answer, so
 * handing it over carries real perceived commitment. Nothing here gates the file
 * — the download link above it already works.
 */
export const ASSET_NOTIFY_COPY = {
  fieldLabel: "Nomor WhatsApp",
  fieldHint: "Contoh: 0812 3456 7890",
  submitLabel: LEARN_CTA.kabari_revisi.button,
  optionalTag: "Opsional",
  /** Shown when no capture action is wired: the reader opts in from WhatsApp itself. */
  waLabel: "Kabari saya lewat WhatsApp",
  /** Success state after the number is stored. */
  doneLabel: "Nomor Anda tercatat.",
  doneBody: "Kami hubungi hanya kalau dokumen ini direvisi.",
  errorLabel: "Nomor tidak terbaca. Coba tulis seperti 0812 3456 7890.",
} as const;

/** "Kami perbarui template ini setiap ada revisi standar." */
export function assetNotifyHeading(asset: LeadMagnet): string {
  return `Kami perbarui ${asset.noun} ini setiap ada revisi standar.`;
}

/** "DOCX · 14 halaman · v1.2 — ditinjau Maret 2026" */
export function assetMetaLine(asset: LeadMagnet): string {
  return `${asset.format} · ${asset.pages} halaman · ${asset.version} — ditinjau ${asset.reviewed}`;
}

/* ------------------------------------------------------------------ *
 * The RT60 refusal (§12.3)
 * ------------------------------------------------------------------ */

/** How the computed RT60 relates to the ≥0,50 STI requirement. */
export type StipaLikelihood = "gagal" | "batas" | "lolos";

/**
 * The tool refuses to output an STI number, and says why. The Peutz %ALcons
 * approximation is only valid for D < 3.16·Dc, assumes a single source, and
 * ignores background noise and loudspeaker directivity entirely.
 *
 * That refusal is the lead-gen mechanism, and it converts better than a number
 * would have — so this copy is a conversion asset, not a disclaimer. It must
 * never be softened into "perkiraan STI".
 */
export const STIPA_REFUSAL = {
  eyebrow: "Batas alat ini",
  headline: LEARN_CTA.jadwal_stipa.heading,
  why: LEARN_CTA.jadwal_stipa.body,
  scaleLabel: "Skala IEC 60268-16",
  scale: [
    { range: "<0,30", label: "Buruk" },
    { range: "0,30–0,45", label: "Kurang" },
    { range: "0,45–0,60", label: "Cukup" },
    { range: "0,60–0,75", label: "Baik" },
    { range: ">0,75", label: "Sangat Baik" },
  ],
  requirement: "Sistem tata suara darurat (IEC 60849 / EN 54-16) wajib ≥ 0,50.",
  /**
   * The bridge sentence into the CTA. `gagal` is §12.3 verbatim; the other two
   * exist so the block stays true on a room the calculator did not condemn.
   */
  bridge: {
    gagal:
      "Angka RT60 di atas menunjukkan ruangan ini kemungkinan besar tidak lolos 0,50 — tapi satu-satunya cara memastikannya adalah pengukuran STIPA di lokasi.",
    batas:
      "Angka RT60 di atas belum cukup untuk memastikan ruangan ini lolos 0,50 atau tidak — satu-satunya cara memastikannya adalah pengukuran STIPA di lokasi.",
    lolos:
      "Angka RT60 di atas tidak menutup kemungkinan ruangan ini lolos 0,50 — tapi satu-satunya cara memastikannya tetap pengukuran STIPA di lokasi.",
  },
} as const;

/** Secondary, non-commercial actions beside the calculator handoff (§13.2). */
export const CALC_RESULT_ACTIONS = {
  print: "Cetak / Simpan PDF",
  copyLink: "Salin tautan hasil",
} as const;

/* ------------------------------------------------------------------ *
 * The WhatsApp message body (§13.4)
 * ------------------------------------------------------------------ */

export type LearnWaSourceKind = "lesson" | "jalur" | "alat" | "unduhan";

export type LearnWaSource = {
  kind: LearnWaSourceKind;
  /** Title exactly as the reader saw it. Quoted back so the salesperson has context. */
  title: string;
  /** Site-relative path, e.g. "/learn/rt60-kenapa-ruangan-bergema". */
  path: string;
};

function opener(source: LearnWaSource): string {
  switch (source.kind) {
    case "lesson":
      return `Halo ACTA. Saya baru membaca "${source.title}" di situs ACTA.`;
    case "jalur":
      return `Halo ACTA. Saya membaca jalur "${source.title}" di situs ACTA.`;
    case "alat":
      return `Halo ACTA. Saya pakai ${source.title} di situs ACTA.`;
    case "unduhan":
      return `Halo ACTA. Saya baru mengunduh "${source.title}" dari situs ACTA.`;
  }
}

/**
 * The blank the reader fills in is deliberate (§13.4). A fully prefilled message
 * gets sent by accident and wastes sales time; a message they typed something
 * into is one they are invested in.
 */
const PROMPT: Record<LearnCtaId, string> = {
  tanya_engineer: "Kondisi ruangan saya:\n(silakan isi — ukuran ruang, fungsi, dan keluhan utamanya)",
  review_spesifikasi:
    "Draft yang sedang saya susun:\n(silakan isi — nama proyek, jenis ruangan, dan tahap dokumennya)",
  jadwal_survey:
    "Ruangan dan lokasinya:\n(silakan isi — alamat, jenis ruangan, dan perkiraan jadwal)",
  jadwal_stipa:
    "Ruangan dan lokasinya:\n(silakan isi — alamat, jenis ruangan, dan perkiraan jadwal)",
  kirim_hasil: "Denah atau foto ruangan:\n(silakan lampirkan di chat ini)",
  kabari_revisi: "Tolong kabari saya kalau ada revisi.",
};

/** Absolute URL without the scheme — WhatsApp autolinks a bare domain and it reads cleaner. */
function displayUrl(url: string): string {
  const absolute = url.startsWith("/") ? absoluteUrl(url) : url;
  return absolute.replace(/^https?:\/\//, "");
}

export type BuildLearnWaMessageInput = {
  cta: LearnCtaId;
  source: LearnWaSource;
  /** Computed facts echoed back, e.g. "Aula 20 × 12 × 6 m, RT60 hitungan 1,9 detik, target 1,0 detik." */
  detailLines?: readonly string[];
  /** Share URL of the computed result. Site-relative or absolute. */
  resultUrl?: string;
  /**
   * The visible attribution token, e.g. "AKU-07-4KM2". Generated client-side.
   * `null` when JS has not run yet — the message still sends, and the CRM records
   * `source_detail = 'learn:no-ref'` (§13.5 vocabulary).
   */
  ref?: string | null;
};

/**
 * Build the prefilled WhatsApp body.
 *
 * The ref code is visible TEXT inside the message, never a URL parameter: every
 * UTM, click id and cookie dies at the wa.me boundary, and the only thing that
 * crosses from web → WhatsApp → CRM is the text the human sends (§13.4).
 */
export function buildLearnWaMessage({
  cta,
  source,
  detailLines,
  resultUrl,
  ref,
}: BuildLearnWaMessageInput): string {
  const head = [opener(source)];
  if (detailLines) {
    for (const line of detailLines) {
      const trimmed = line.trim();
      if (trimmed) head.push(trimmed);
    }
  }
  if (resultUrl) head.push(`Tautan hasil: ${displayUrl(resultUrl)}`);

  const blocks = [head.join("\n"), PROMPT[cta]];
  if (ref) blocks.push(`—\nRef: ${ref}`);

  return blocks.join("\n\n");
}

/**
 * `source_detail` value the salesperson pastes into the ACTA-OS lead (§13.5).
 * Mandatory field — the ref code is worthless if it stops at WhatsApp.
 */
export function leadSourceDetail(ref: string | null | undefined): string {
  return ref ? `learn:${ref}` : "learn:no-ref";
}
