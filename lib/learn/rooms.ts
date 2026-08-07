/**
 * ARSITEKTUR RUANG — the hand-written room archetypes behind `/learn/ruang/{slug}`.
 *
 * ## The rule this file exists to enforce
 *
 * **Every number on a room page is produced by the same audited `compute()` the
 * public calculators run.** Nothing is transcribed, nothing is rounded by hand,
 * nothing is "roughly". `computeRt60`, `computeScreenSize` and the projector
 * `compute` are imported directly from `components/learn/alat/<alat>/calc.ts`, so a
 * correction to a coefficient table or a model boundary moves the calculator and
 * the room page in the same commit. There is no second source of truth, which
 * means there is no way for the two surfaces to disagree — and that
 * impossibility is the entire correctness thesis of this section.
 *
 * **Everything that is not a number is hand-authored, per page.** Prose, failure
 * modes, design notes and product joins are written for one specific room and
 * are not derived from anything. That asymmetry is deliberate.
 *
 * ## What is deliberately NOT built (04-ROADMAP §17.3, R3)
 *
 * No parametric generation. No dimensions table permuted into forty URLs. That
 * shape is the competitor's content farm with better typography, and the penalty
 * for it is site-wide index-selection demotion rather than a page-level ranking
 * loss — so it would be paid for out of the lessons and the calculators, not out
 * of the archetypes themselves. The cap is **8 archetypes in year one, ≤2 per
 * month, each hand-written.** Three ship here.
 *
 * ## Room archetypes get no table
 *
 * 02-DATA-SEO §6.2 is explicit: eight hand-written pages do not justify a CMS
 * surface nobody will maintain. They live as a version-controlled TypeScript
 * constant, reviewed the way code is reviewed. `publishedAt` and `reviewedAt`
 * are bumped by hand on a substantive edit — never automatically, because
 * 04-ROADMAP §17.5 rule 4 makes the review date a trust signal and an
 * auto-bumped trust signal is a lie.
 *
 * ## Measurements are never invented
 *
 * Where a page would benefit from a real ACTA field measurement, this file
 * carries an explicit `perlu-data` placeholder that renders as a visible
 * "PERLU DATA ACTA" panel. Fabricating a measurement would destroy the one asset
 * §17.6 gate condition 3 says is not reproducible by a competitor with an LLM.
 * Filling one in is a type-checked edit: change `status` to `terisi` and the
 * compiler demands the value, the date and the site.
 *
 * Pure module: no React, no `server-only`, no I/O, no `next/*` import. The route
 * owns caching so this stays importable from anywhere.
 */

import {
  computeRt60,
  type Rt60Input,
  type Rt60Result,
} from "@/components/learn/alat/rt60-sabine/calc";
import {
  compute as computeProjector,
  type AmbientLevel,
  type ThrowInput,
  type ThrowResult,
} from "@/components/learn/alat/throw-distance-proyektor/calc";
import {
  computeScreenSize,
  type ScreenSizeAnswer,
  type ScreenSizeInput,
  type ScreenSizeResult,
} from "@/components/learn/alat/ukuran-layar/calc";
import { fmt, fmtFixed, fmtInt } from "@/lib/learn/format";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export const ROOM_ARCHETYPE_SLUGS = [
  "ruang-rapat-8-12-orang",
  "auditorium-200-kursi",
  "masjid-kapasitas-500",
] as const;

export type RoomArchetypeSlug = (typeof ROOM_ARCHETYPE_SLUGS)[number];

export const ROOM_BASE_PATH = "/learn/ruang";

/** One row of the spec table. Structurally assignable to `ReferenceRow`. */
export type RoomSpecRow = Readonly<Record<"param" | "value" | "source", string>>;

/** Structurally assignable to `ReferenceColumn`. */
export type RoomSpecColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  mono?: boolean;
  width?: string;
};

export const ROOM_SPEC_COLUMNS: readonly RoomSpecColumn[] = [
  { key: "param", label: "Parameter", width: "16rem" },
  { key: "value", label: "Nilai", mono: true, width: "11rem" },
  { key: "source", label: "Dihitung oleh" },
];

/**
 * "Apa yang biasanya salah" — the section a brochure cannot write, because every
 * entry names a failure of something the industry sells.
 */
export type RoomFailureMode = {
  id: string;
  title: string;
  /** What the client reports, in their words. */
  symptom: string;
  /** Why it happens, physically. */
  cause: string;
  /** What actually fixes it, in order of cost. */
  fix: string;
  /**
   * Optional line generated from the audited engines, so the failure mode is
   * anchored to this room's real arithmetic instead of a general claim.
   */
  evidence?: (numbers: RoomNumbers) => string;
};

/**
 * A field measurement ACTA owns. `perlu-data` is not a TODO — it is the published
 * state of a page that is honest about what it has not measured yet.
 */
export type RoomMeasurement =
  | {
      status: "perlu-data";
      id: string;
      /** What is to be measured. */
      label: string;
      /** How it will be measured, so the placeholder is actionable. */
      method: string;
      /** Why this specific measurement is worth a site visit. */
      why: string;
    }
  | {
      status: "terisi";
      id: string;
      label: string;
      method: string;
      why: string;
      /** The measured value, already formatted for print. */
      value: string;
      /** ISO date of the measurement. */
      measuredAt: string;
      /** Where it was measured, at the level of detail the client agreed to. */
      site: string;
    };

export type RoomJoin = {
  href: string;
  label: string;
  kind: "solusi" | "katalog";
  /** Why this link belongs on this page — never "produk terkait". */
  why: string;
};

export type RoomInputs = {
  acoustics: Rt60Input;
  display: ScreenSizeInput;
  /** A second display scenario, used by a failure mode. */
  displayAlt?: { label: string; input: ScreenSizeInput };
  /**
   * Projector parameters. The screen width is NOT specified here — it is taken
   * from `display`'s computed requirement, so the projector page and the display
   * page describe the same screen by construction.
   */
  projector?: {
    throwRatio: number;
    lumens: number;
    gain: number;
    ambient: AmbientLevel;
  };
};

export type RoomArchetype = {
  slug: RoomArchetypeSlug;
  /** Mono eyebrow. */
  eyebrow: string;
  /** `<h1>` and the breadcrumb leaf. */
  title: string;
  /** Short label for cards and the index. */
  shortTitle: string;
  /** One sentence: what this page settles. */
  promise: string;
  capacity: string;
  seoTitle: string;
  seoDescription: string;
  /** ISO date. Bumped by hand, never generated. */
  publishedAt: string;
  /** ISO date of the last substantive review. Feeds `dateModified` (02 §9.5). */
  reviewedAt: string;
  /** Hand-authored opening. Paragraphs, no computed numbers. */
  intro: readonly string[];
  /** Why these input assumptions and not others. */
  designNotes: readonly string[];
  inputs: RoomInputs;
  /** ≥3, hand-authored. */
  failureModes: readonly RoomFailureMode[];
  /** ≥1 real ACTA measurement slot. */
  measurements: readonly RoomMeasurement[];
  /** ≥2 links into solutions or the catalogue. */
  joins: readonly RoomJoin[];
  /** Planned lesson slugs (04-ROADMAP §17.5). Unresolved slugs are dropped, never rendered. */
  relatedLessons: readonly string[];
  /** Named standards behind the numbers. Feeds JSON-LD `citation`. */
  standards: readonly string[];
};

export type RoomNumbers = {
  slug: RoomArchetypeSlug;
  acoustics: Rt60Result;
  display: ScreenSizeAnswer;
  displayAlt: { label: string; answer: ScreenSizeAnswer } | null;
  projector: ThrowResult | null;
};

/* ------------------------------------------------------------------ *
 * The archetypes
 * ------------------------------------------------------------------ */

const RUANG_RAPAT: RoomArchetype = {
  slug: "ruang-rapat-8-12-orang",
  eyebrow: "ARSITEKTUR RUANG · 01",
  title: "Ruang Rapat 8–12 Orang",
  shortTitle: "Ruang rapat 8–12 orang",
  promise:
    "Ruangan paling sering dibangun di Indonesia, dan paling sering gagal pada dua hal yang sama: layar terlalu kecil untuk baris belakang, dan plafon gypsum yang tidak menyerap apa pun.",
  capacity: "8–12 orang",
  seoTitle: "Ruang Rapat 8–12 Orang: Angka Acuan Layar, Akustik, dan Audio",
  seoDescription:
    "Arketipe ruang rapat 8–12 orang: ukuran layar menurut DISCAS, waktu dengung menurut ISO 3382-1, dan tiga kegagalan yang paling sering terjadi di ruangan ini.",
  publishedAt: "2026-08-07",
  reviewedAt: "2026-08-07",
  intro: [
    "Ruang rapat delapan sampai dua belas orang adalah unit dasar gedung perkantoran di Indonesia. Ukurannya nyaris seragam karena dibentuk oleh modul kolom dan lebar meja, bukan oleh kebutuhan audio visual — dan justru karena itu masalahnya juga seragam. Halaman ini menghitung ruangan tipikal itu sampai selesai, dengan mesin yang sama yang menjalankan kalkulator publik di situs ini.",
    "Angka pada tabel di bawah bukan rekomendasi umum. Semuanya keluar dari satu set asumsi yang ditulis terbuka di bagian berikutnya, sehingga siapa pun bisa mengganti asumsi itu dengan dimensi ruangannya sendiri dan mendapat jawaban yang berbeda. Yang tidak berubah adalah metodenya.",
    "Prosa, daftar kegagalan, dan rekomendasi sistem di halaman ini ditulis tangan untuk ruangan ini. ACTA tidak membangkitkan halaman ruangan secara otomatis, dan tidak akan menerbitkan lebih dari delapan arketipe dalam satu tahun.",
  ],
  designNotes: [
    "Dimensi 7,2 × 4,8 m adalah modul kolom yang paling sering dipakai gedung perkantoran menengah di Jakarta; tinggi bersih 2,9 m adalah tinggi setelah plafon gantung terpasang, bukan tinggi struktur.",
    "Material dipilih dari konstruksi apa adanya, bukan dari kondisi ideal: karpet tipis di atas beton, dinding partisi gypsum, plafon gypsum, dan satu bidang kaca menghadap koridor atau taman. Ini adalah kondisi ruangan sebelum ada pekerjaan akustik.",
    "Jarak penonton terjauh 5,5 m diukur dari permukaan layar ke mata orang di kursi terakhir — bukan ke dinding belakang. Selisih keduanya sekitar satu meter dan cukup untuk memindahkan hasil satu tingkat ukuran panel.",
    "Perhitungan layar dijalankan pada dua jenis konten. Presentasi dihitung pada %EH 3, sedangkan dokumen kerja seperti tabel anggaran dan gambar teknik dihitung pada %EH 2. Keduanya memakai metode BDM dari ANSI/AVIXA V202.01, dan keduanya benar untuk kontennya masing-masing.",
  ],
  inputs: {
    acoustics: {
      length: 7.2,
      width: 4.8,
      height: 2.9,
      floor: "karpet-tipis",
      wall: "gypsum",
      ceiling: "gypsum",
      windowArea: 8,
      people: 12,
      room: "rapat",
    },
    display: {
      solveFor: "ukuran",
      model: "bdm",
      farthestViewerM: 5.5,
      plannedDiagonalIn: 75,
      elementHeightPercent: 3,
      verticalResolution: 1080,
      displayAspect: "16x9",
      contentAspect: "16x9",
      closestViewerM: null,
      ceilingHeightM: 2.9,
      eyeHeightM: 1.15,
    },
    displayAlt: {
      label: "Konten dokumen kerja (%EH 2)",
      input: {
        solveFor: "ukuran",
        model: "bdm",
        farthestViewerM: 5.5,
        plannedDiagonalIn: 75,
        elementHeightPercent: 2,
        verticalResolution: 1080,
        displayAspect: "16x9",
        contentAspect: "16x9",
        closestViewerM: null,
        ceilingHeightM: 2.9,
        eyeHeightM: 1.15,
      },
    },
  },
  failureModes: [
    {
      id: "layar-dibeli-untuk-presentasi-dipakai-untuk-spreadsheet",
      title: "Layar dibeli untuk presentasi, dipakai untuk spreadsheet",
      symptom:
        "Rapat berjalan normal sampai seseorang membuka tabel anggaran atau gambar denah, lalu orang di ujung meja berdiri dan mendekat, atau meminta filenya dikirim lewat chat.",
      cause:
        "Ukuran layar ditentukan dari jenis konten. Slide presentasi punya elemen besar; tabel dan gambar teknik punya elemen jauh lebih kecil, dan syarat ukurannya melompat, bukan bergeser sedikit. Panel yang benar untuk yang pertama bisa gagal telak untuk yang kedua.",
      fix: "Tetapkan jenis konten terberat yang akan benar-benar dibuka di ruangan itu sebelum memilih ukuran, bukan sesudahnya. Kalau dokumen kerja masuk daftar, sebagian besar ruang rapat berukuran ini tidak akan terselesaikan dengan satu panel datar dan pilihannya bergeser ke proyektor, ke layar yang lebih dekat, atau ke pengaturan tempat duduk yang lebih rapat.",
      evidence: (n) =>
        n.displayAlt
          ? `Pada ruangan ini: presentasi butuh ${fmt(n.display.required.diagonalIn)}" dan terselesaikan panel ${n.display.recommended ? `${fmtInt(n.display.recommended.diagonalIn)}"` : "di luar panel komersial"}, sedangkan dokumen kerja butuh ${fmt(n.displayAlt.answer.required.diagonalIn)}" — ${n.displayAlt.answer.recommended ? `panel ${fmtInt(n.displayAlt.answer.recommended.diagonalIn)}"` : "di luar ukuran panel komersial yang dijual sebagai produk jadi"}.`
          : "",
    },
    {
      id: "plafon-gypsum-dianggap-peredam",
      title: "Plafon gypsum dianggap sudah meredam",
      symptom:
        "Peserta jarak jauh mengeluh suaranya bergema atau seperti berbicara di dalam kaleng, padahal mikrofon dan perangkat konferensi yang dipakai kelas atas.",
      cause:
        "Plafon gypsum tampak lunak tetapi hampir tidak menyerap bunyi pada pita bicara. Dengan lantai karpet tipis dan dinding gypsum, permukaan yang benar-benar menyerap di ruangan ini nyaris hanya orang yang duduk di dalamnya — sehingga ruangan yang sama akan terdengar jauh lebih buruk pada rapat berisi tiga orang daripada pada rapat penuh.",
      fix: "Tambahkan serapan pada bidang yang benar-benar bekerja: plafon di area pembicara dan satu dinding yang berhadapan dengan dinding keras lain. Luas yang dibutuhkan ada di tabel spesifikasi, dan hampir selalu jauh lebih kecil daripada yang diperkirakan orang.",
      evidence: (n) =>
        `Pada ruangan ini waktu dengung hitungan ${fmt(n.acoustics.tMid)} detik terhadap target ${fmt(n.acoustics.treatment.targetRt60)} detik; selisihnya ditutup ${fmt(n.acoustics.treatment.additionalAbsorption)} m² sabin, setara sekitar ${fmt(n.acoustics.treatment.panelArea)} m² panel akustik 50 mm — ${fmt(n.acoustics.treatment.coverageRatio * 100)}% dari luas permukaan yang tersedia.`,
    },
    {
      id: "mik-plafon-dipasang-tanpa-memeriksa-akustik",
      title: "Mikrofon plafon dipasang tanpa memeriksa akustik lebih dulu",
      symptom:
        "Setelah mengganti mikrofon meja dengan array plafon, meja jadi bersih tetapi peserta jarak jauh justru bilang suaranya makin jauh dan makin bergema.",
      cause:
        "Array plafon berada jauh lebih jauh dari mulut pembicara daripada mikrofon meja, sementara energi pantul ruangan tidak ikut menjauh. Perbandingan suara langsung terhadap suara pantul yang sampai ke mikrofon turun, dan pembatalan gema bekerja lebih berat di ruangan yang lebih bergema.",
      fix: "Urutannya dibalik: selesaikan serapan ruangan lebih dulu, baru pilih posisi mikrofon. Kalau anggaran hanya cukup untuk salah satu, serapan memberi perbaikan yang terdengar oleh semua orang di kedua sisi panggilan; mikrofon yang lebih mahal tidak.",
      evidence: (n) =>
        `Jarak kritis ruangan ini ${fmt(n.acoustics.criticalDistance)} m — di luar jarak itu suara pantul mendominasi, dan array plafon hampir selalu berada di luarnya.`,
    },
  ],
  measurements: [
    {
      status: "perlu-data",
      id: "rt60-terukur-sebelum-sesudah",
      label: "RT60 terukur sebelum dan sesudah pemasangan panel akustik",
      method:
        "Pengukuran menurut ISO 3382-1 pada enam pita oktaf, tiga posisi sumber dan enam posisi mikrofon, dengan sistem tata udara menyala.",
      why: "Angka di tabel adalah hitungan Sabine dari koefisien serap publikasi. Satu pasang pengukuran sebelum-sesudah dari ruangan nyata di Jakarta mengubah halaman ini dari perhitungan yang benar menjadi bukti yang tidak bisa dibuat ulang siapa pun dengan menulis ulang teks.",
    },
    {
      status: "perlu-data",
      id: "kebisingan-latar-terukur",
      label: "Kebisingan latar terukur pada kondisi AC beroperasi",
      method:
        "Pengukuran tingkat tekanan suara per pita oktaf pada posisi duduk, alat kelas 1 menurut IEC 61672, sistem tata udara pada beban normal.",
      why: "Kebisingan latar menentukan seberapa keras sistem harus bekerja dan sering menjadi penyebab sebenarnya dari keluhan kejelasan. Nilai nyata dari beberapa gedung perkantoran Jakarta adalah data yang tidak tersedia di mana pun dalam bahasa Indonesia.",
    },
  ],
  joins: [
    {
      href: "/solutions/smart-meeting-room",
      label: "Smart Meeting Room",
      kind: "solusi",
      why: "Ruang lingkup pekerjaan lengkap untuk ruangan berukuran ini: tampilan, konferensi, kendali, dan pekerjaan akustik yang menyertainya.",
    },
    {
      href: "/products/c/conferencing-collaboration",
      label: "Katalog Conferencing & Collaboration",
      kind: "katalog",
      why: "Perangkat konferensi yang biasa dipakai pada ruangan seukuran ini, lengkap dengan jangkauan mikrofon dan platform yang disertifikasi.",
    },
    {
      href: "/products/c/display",
      label: "Katalog Display",
      kind: "katalog",
      why: "Panel datar pada rentang ukuran yang keluar dari perhitungan DISCAS di halaman ini — bandingkan diagonalnya terhadap angka pada tabel, bukan terhadap anggaran.",
    },
  ],
  relatedLessons: [
    "ukuran-layar-ruang-rapat-discas",
    "audio-video-call-putus-putus",
    "insulasi-vs-absorpsi",
    "rt60-akustik-ruang-bergema",
  ],
  standards: ["ANSI/AVIXA V202.01", "ISO 3382-1", "ISO 354", "IEC 60268-16"],
};

const AUDITORIUM: RoomArchetype = {
  slug: "auditorium-200-kursi",
  eyebrow: "ARSITEKTUR RUANG · 02",
  title: "Auditorium 200 Kursi",
  shortTitle: "Auditorium 200 kursi",
  promise:
    "Pada 200 kursi, panel datar sudah habis dan akustik berhenti menjadi urusan interior. Halaman ini menghitung di titik mana keduanya berpindah tangan.",
  capacity: "200 kursi",
  seoTitle: "Auditorium 200 Kursi: Ukuran Layar, Kecerahan Proyektor, dan RT60",
  seoDescription:
    "Arketipe auditorium 200 kursi: lebar citra menurut DISCAS, kebutuhan lumen proyektor, waktu dengung menurut ISO 3382-1, dan tiga kegagalan yang paling sering terjadi.",
  publishedAt: "2026-08-07",
  reviewedAt: "2026-08-07",
  intro: [
    "Auditorium dua ratus kursi adalah ukuran yang paling banyak dibangun kampus, rumah sakit, dan kantor pemerintah daerah di Indonesia. Ukurannya cukup besar untuk membuat setiap kesalahan mahal, dan cukup kecil untuk sering dikerjakan tanpa konsultan akustik.",
    "Dua keputusan di halaman ini saling mengunci. Lebar citra ditentukan jarak kursi terjauh, dan lebar citra itulah yang menentukan berapa lumen yang dibutuhkan proyektor — karena luas layar naik kuadratik terhadap lebarnya. Karena itu angka proyektor di bawah tidak dimasukkan tangan: lebarnya diambil langsung dari hasil perhitungan layar di baris sebelumnya.",
    "Prosa, daftar kegagalan, dan rekomendasi sistem di halaman ini ditulis tangan untuk ruangan ini.",
  ],
  designNotes: [
    "Dimensi 22 × 14 m dengan tinggi bersih 7 m adalah proporsi auditorium datar atau berundak landai untuk dua ratus kursi, termasuk area panggung dangkal dan gang samping.",
    "Material dipilih pada kondisi apa adanya: karpet tipis di area duduk, dinding bata berplester, plafon gypsum, tanpa bidang kaca besar. Ini adalah ruangan sebelum ada pekerjaan akustik, bukan ruangan yang sudah dirawat.",
    "Jarak penonton terjauh 19 m adalah mata penonton di baris terakhir, bukan dinding belakang. Konten dihitung pada %EH 3, yaitu presentasi dengan elemen besar — auditorium yang juga dipakai membaca tabel harus dihitung ulang pada %EH 2 dan hasilnya akan jauh lebih besar.",
    "Volume ruangan melewati ambang di mana serapan udara mulai berpengaruh, sehingga kalkulator RT60 memasukkannya pada pita 4 kHz mengikuti ISO 9613-1. Ini adalah salah satu perbedaan nyata antara ruang rapat dan aula, dan sering diabaikan pada perhitungan yang disalin dari ruangan kecil.",
    "Parameter proyektor pada tabel — rasio lempar 1,5 dan layar gain 1,0 pada kondisi ambient terkontrol — adalah titik awal yang harus diperiksa terhadap lensa dan layar yang benar-benar dibeli. Pergeseran lensa dan offset vertikal tidak dimodelkan.",
  ],
  inputs: {
    acoustics: {
      length: 22,
      width: 14,
      height: 7,
      floor: "karpet-tipis",
      wall: "bata",
      ceiling: "gypsum",
      windowArea: 0,
      people: 200,
      room: "auditorium",
    },
    display: {
      solveFor: "ukuran",
      model: "bdm",
      farthestViewerM: 19,
      plannedDiagonalIn: 110,
      elementHeightPercent: 3,
      verticalResolution: 1080,
      displayAspect: "16x9",
      contentAspect: "16x9",
      closestViewerM: null,
      ceilingHeightM: 7,
      eyeHeightM: 1.15,
    },
    projector: { throwRatio: 1.5, lumens: 7000, gain: 1, ambient: "terkontrol" },
  },
  failureModes: [
    {
      id: "lumen-dipilih-sebelum-lebar-layar",
      title: "Lumen proyektor dipilih sebelum lebar layar ditetapkan",
      symptom:
        "Proyektor sudah dibeli sesuai anggaran, lalu layar diperbesar agar baris belakang bisa membaca, dan gambar mendadak terlihat pucat begitu lampu ruangan dinyalakan setengah.",
      cause:
        "Luas layar naik kuadratik terhadap lebarnya. Melebarkan layar dari empat menjadi enam meter melipatgandakan luasnya lebih dari dua kali, sementara keluaran proyektor tidak berubah — sehingga terang di layar turun dalam proporsi yang sama.",
      fix: "Urutannya satu arah dan tidak bisa dibalik: tetapkan jarak kursi terjauh, hitung lebar citra minimum, baru hitung lumen yang dibutuhkan untuk lebar itu pada kondisi cahaya yang akan benar-benar dipakai. Menyisakan cadangan terhadap angka lembar data adalah bagian dari perhitungan, bukan kehati-hatian tambahan.",
      evidence: (n) =>
        n.projector
          ? `Pada ruangan ini lebar citra minimum ${fmt(n.display.required.imageWidthM)} m menghasilkan luas layar ${fmt(n.projector.screen.areaM2)} m², dan proyektor ${fmtInt(n.projector.input.lumens)} lumen memberi ${fmt(n.projector.brightness.flEffective)} fL setelah cadangan lampu. Untuk kondisi cahaya yang lebih terang, kelas yang dibutuhkan naik ke ${fmtInt(n.projector.brightness.lumensRequiredRecommended)} lumen.`
          : "",
    },
    {
      id: "karpet-dan-gorden-dianggap-menyelesaikan-akustik",
      title: "Karpet dan gorden dianggap menyelesaikan akustik",
      symptom:
        "Setelah lantai dikarpet dan dinding samping digorden, suara terdengar lebih tumpul tetapi pengumuman tetap tidak jelas, dan musik terdengar berat dan berlumpur.",
      cause:
        "Karpet dan gorden hampir hanya bekerja pada frekuensi menengah dan tinggi. Energi di pita rendah tetap tinggal, sehingga ekor bass justru menjadi lebih menonjol relatif terhadap pita bicara setelah pekerjaan itu selesai. Ruangan terdengar berbeda tanpa menjadi lebih jelas.",
      fix: "Perbaikan pita rendah membutuhkan penyerap dengan ketebalan atau rongga udara di belakangnya, dan ditempatkan di sudut serta pertemuan bidang tempat energi rendah menumpuk. Ini pekerjaan yang berbeda dari melapisi permukaan, dan biayanya tidak sebanding dengan luasnya.",
      evidence: (n) =>
        `Pada ruangan ini rasio bass ${fmt(n.acoustics.bassRatio)}× dan waktu dengung pada 125 Hz ${fmt(n.acoustics.bands[0]?.rt60 ?? 0)} detik, terhadap ${fmt(n.acoustics.tMid)} detik pada pita tengah.`,
    },
    {
      id: "daya-penguat-dinaikkan-untuk-kejelasan",
      title: "Daya penguat dinaikkan untuk mengejar kejelasan",
      symptom:
        "Pengumuman tidak jelas di belakang, volume dinaikkan, baris depan mulai terasa terlalu keras, dan baris belakang tetap tidak menangkap kata-katanya.",
      cause:
        "Di luar jarak kritis, menambah daya menaikkan suara langsung dan suara pantul dalam jumlah yang sama, sehingga perbandingan keduanya tidak berubah. Yang bertambah hanya kekerasan, dan kejelasan tetap di tempat.",
      fix: "Yang mengubah perbandingannya hanya tiga hal: mendekatkan loudspeaker ke pendengar dengan sistem terdistribusi atau delay, mempersempit pola pancar sehingga energi tidak jatuh ke plafon dan dinding belakang, dan mengurangi waktu dengung ruangan. Ketiganya mengubah geometri atau serapan; tidak satu pun mengubah angka watt.",
      evidence: (n) =>
        `Pada ruangan ini jarak kritis ${fmt(n.acoustics.criticalDistance)} m, sementara barisan kursi membentang jauh melewatinya — sebagian besar penonton duduk di wilayah yang didominasi suara pantul.`,
    },
  ],
  measurements: [
    {
      status: "perlu-data",
      id: "stipa-terukur-per-zona",
      label: "STIPA terukur per zona kursi, sebelum dan sesudah penyetelan",
      method:
        "Pengukuran STIPA menurut IEC 60268-16 pada minimal enam posisi mewakili baris depan, tengah dan belakang, dengan kebisingan latar tercatat pada tiap posisi.",
      why: "STI adalah satu-satunya kriteria audio yang bisa diverifikasi ulang oleh pihak ketiga. Data STIPA nyata dari auditorium Indonesia sebelum dan sesudah commissioning tidak tersedia di mana pun, dan itu persis jenis data yang membuat halaman ini tidak bisa ditiru.",
    },
    {
      status: "perlu-data",
      id: "luminansi-layar-terukur",
      label: "Luminansi layar terukur pada kondisi lampu ruangan nyata",
      method:
        "Pengukuran luminansi pada sembilan titik bidang layar dengan pola putih penuh, pada tiga skenario pencahayaan ruangan yang benar-benar dipakai saat acara.",
      why: "Perhitungan kecerahan di halaman ini memakai cadangan lampu terhadap angka lembar data. Nilai terukur dari auditorium yang sudah beroperasi akan menunjukkan seberapa jauh cadangan itu tepat, dan itu satu-satunya cara mengoreksinya secara jujur.",
    },
  ],
  joins: [
    {
      href: "/solutions/auditorium-performance-hall",
      label: "Auditorium & Performance Hall",
      kind: "solusi",
      why: "Ruang lingkup pekerjaan untuk aula pada skala ini: tata suara utama, tampilan, kendali, dan koordinasi dengan pekerjaan interior akustik.",
    },
    {
      href: "/products/c/display",
      label: "Katalog Display",
      kind: "katalog",
      why: "Proyektor dan LED display pada kelas kecerahan yang keluar dari perhitungan di halaman ini — periksa lumen dan pixel pitch terhadap angka pada tabel.",
    },
    {
      href: "/products/c/audio",
      label: "Katalog Audio",
      kind: "katalog",
      why: "Loudspeaker dengan pola pancar terkendali dan prosesor yang dibutuhkan ketika jarak kritis ruangan jauh lebih pendek daripada barisan kursinya.",
    },
  ],
  relatedLessons: [
    "rt60-akustik-ruang-bergema",
    "waktu-dengung-ideal-iso-3382",
    "jarak-pandang-ideal-videotron",
    "sistem-tata-suara-gedung-bgm-paging-emergency",
  ],
  standards: [
    "ANSI/AVIXA V202.01",
    "ISO 3382-1",
    "ISO 9613-1",
    "ISO 21118",
    "IEC 60268-16",
  ],
};

const MASJID: RoomArchetype = {
  slug: "masjid-kapasitas-500",
  eyebrow: "ARSITEKTUR RUANG · 03",
  title: "Masjid Kapasitas 500 Jamaah",
  shortTitle: "Masjid 500 jamaah",
  promise:
    "Masjid adalah satu-satunya arketipe di sini yang angka pita tengahnya bisa memenuhi target sementara ruangannya tetap terdengar buruk. Halaman ini menunjukkan kenapa.",
  capacity: "500 jamaah",
  seoTitle: "Masjid Kapasitas 500 Jamaah: Akustik, Kejelasan Suara, dan Layar",
  seoDescription:
    "Arketipe masjid 500 jamaah: waktu dengung per pita oktaf menurut ISO 3382-1, ekor bass, jarak kritis, dan ukuran citra menurut DISCAS. Angka dari kalkulator yang sama.",
  publishedAt: "2026-08-07",
  reviewedAt: "2026-08-07",
  intro: [
    "Masjid berkapasitas lima ratus jamaah adalah ruangan yang paling banyak dibangun di Indonesia dan paling jarang dihitung. Karpet tebal di seluruh lantai memberi serapan besar pada pita bicara, sehingga angka waktu dengung pita tengahnya sering terlihat baik — dan itulah yang membuat kesalahan di ruangan ini sulit didiagnosis.",
    "Yang tidak diserap karpet adalah energi di pita rendah. Kubah, dinding bata, dan plafon beton memantulkannya nyaris seutuhnya, sehingga suara imam dan khatib menumpuk pada nada rendah sementara konsonan yang membawa arti hilang. Halaman ini menghitung kedua sisi itu terpisah, karena satu angka rata-rata akan menyembunyikan persoalannya.",
    "Prosa, daftar kegagalan, dan rekomendasi sistem di halaman ini ditulis tangan untuk ruangan ini.",
  ],
  designNotes: [
    "Dimensi 24 × 24 m dengan tinggi rata-rata 9 m mewakili ruang salat utama berbentuk bujur sangkar dengan langit-langit tinggi. Tinggi yang dipakai adalah tinggi rata-rata setara; kubah tidak dimodelkan sebagai bentuk lengkung.",
    "Material dipilih dari konstruksi masjid yang paling umum: karpet tebal di seluruh lantai, dinding bata berplester, plafon beton, dan bidang kaca pada sisi terbuka.",
    "Lima ratus jamaah dimasukkan sebagai serapan, karena tubuh manusia adalah penyerap terbesar di ruangan ini. Konsekuensinya penting dan sering mengejutkan: masjid yang sama akan terdengar jauh lebih bergema pada salat subuh daripada pada salat Jumat, dan sistem yang disetel penuh akan terdengar berbeda saat kosong.",
    "Jarak pandang terjauh 20 m dan konten dihitung pada %EH 3 — teks Arab dan terjemahan berukuran besar. Perhitungan ini menentukan lebar citra, dan lebar citra itulah yang menentukan kelas kecerahan proyektor pada kondisi cahaya masjid yang biasanya terang.",
    "Model medan terdifusi yang dipakai rumus Sabine dan Eyring melemah pada ruangan dengan langit-langit setinggi ini. Kalkulator menandainya sendiri; angkanya tetap berguna sebagai perkiraan rancangan, tetapi nilai yang mengikat harus berupa hasil pengukuran.",
  ],
  inputs: {
    acoustics: {
      length: 24,
      width: 24,
      height: 9,
      floor: "karpet-tebal",
      wall: "bata",
      ceiling: "beton",
      windowArea: 60,
      people: 500,
      room: "masjid",
    },
    display: {
      solveFor: "ukuran",
      model: "bdm",
      farthestViewerM: 20,
      plannedDiagonalIn: 110,
      elementHeightPercent: 3,
      verticalResolution: 1080,
      displayAspect: "16x9",
      contentAspect: "16x9",
      closestViewerM: null,
      ceilingHeightM: 9,
      eyeHeightM: 1.15,
    },
    projector: { throwRatio: 1.8, lumens: 8000, gain: 1, ambient: "tinggi" },
  },
  failureModes: [
    {
      id: "angka-pita-tengah-menipu",
      title: "Angka pita tengah terlihat baik, ruangannya tetap tidak jelas",
      symptom:
        "Konsultan melaporkan waktu dengung masuk rentang target, tetapi jamaah di belakang tetap mengeluh suara imam menumpuk dan kata-katanya tidak tertangkap.",
      cause:
        "Karpet tebal menyerap kuat pada pita bicara dan hampir tidak menyerap pada pita rendah. Rata-rata pita tengah karena itu bisa memenuhi target sementara energi rendah bertahan jauh lebih lama, menutupi konsonan yang justru membawa arti kata.",
      fix: "Laporkan waktu dengung sebagai deret per pita oktaf, bukan satu angka. Kalau rasio antara pita rendah dan pita tengah melewati ambang, pekerjaan yang dibutuhkan adalah penyerap pita rendah di sudut dan pertemuan bidang — bukan menambah karpet atau gorden yang bekerja di pita yang sudah teratasi.",
      evidence: (n) =>
        `Pada ruangan ini pita tengah ${fmt(n.acoustics.tMid)} detik berada di dalam rentang target ${fmt(n.acoustics.treatment.targetRange[0])}–${fmt(n.acoustics.treatment.targetRange[1])} detik, sementara pita 125 Hz ${fmt(n.acoustics.bands[0]?.rt60 ?? 0)} detik — rasio bass ${fmt(n.acoustics.bassRatio)}×.`,
    },
    {
      id: "loudspeaker-tunggal-berdaya-besar",
      title: "Satu pasang loudspeaker berdaya besar untuk seluruh ruang salat",
      symptom:
        "Jamaah di saf depan merasa terlalu keras sampai memekakkan, jamaah di saf belakang tetap kesulitan menangkap kata, dan menaikkan volume memperburuk keduanya sekaligus.",
      cause:
        "Di luar jarak kritis, energi pantul mendominasi dan menambah daya menaikkan suara langsung dan pantul bersamaan. Pada ruang bujur sangkar seluas ini, sebagian besar saf berada jauh di luar jarak kritis, sehingga sistem terpusat menghukum saf depan tanpa menolong saf belakang.",
      fix: "Sistem terdistribusi dengan penundaan waktu, atau column array dengan pola vertikal yang dikendalikan sehingga energi jatuh ke jamaah dan bukan ke plafon dan dinding belakang. Keduanya menyelesaikan masalah yang sama dari arah yang berbeda: memperpendek jarak antara loudspeaker dan telinga.",
      evidence: (n) =>
        `Pada ruangan ini jarak kritis ${fmt(n.acoustics.criticalDistance)} m, sedangkan saf terjauh berada sekitar ${fmtFixed(n.display.distance.farthestViewerM, 0)} m dari sumber di depan.`,
    },
    {
      id: "proyektor-dipilih-untuk-ruang-gelap",
      title: "Proyektor dipilih seolah ruangannya gelap",
      symptom:
        "Teks Arab dan terjemahan terbaca saat uji coba malam hari, lalu tidak terbaca sama sekali pada salat Jumat ketika seluruh lampu dan jendela terbuka.",
      cause:
        "Kecerahan yang dirasakan mata ditentukan lumen dibagi luas layar, dan masjid adalah ruangan dengan cahaya sekitar tinggi hampir sepanjang waktu. Layar yang cukup lebar untuk saf terjauh sekaligus menurunkan luminansi pada proyektor yang sama.",
      fix: "Hitung kebutuhan lumen pada kondisi cahaya yang sebenarnya, bukan kondisi terbaik. Di atas kelas tertentu, jawaban yang jujur berhenti berupa proyektor yang lebih besar dan berpindah ke LED display, yang mempertahankan kontras pada ruangan terang karena pikselnya memancar sendiri.",
      evidence: (n) =>
        n.projector
          ? `Pada ruangan ini proyektor ${fmtInt(n.projector.input.lumens)} lumen menghasilkan ${fmt(n.projector.brightness.flEffective)} fL terhadap target ${fmtInt(n.projector.target.fL)} fL; kelas yang dibutuhkan ${fmtInt(n.projector.brightness.lumensRequired)} lumen${n.projector.ledRecommended ? ", dan pada titik itu kalkulator menyarankan LED direct-view" : ""}.`
          : "",
    },
  ],
  measurements: [
    {
      status: "perlu-data",
      id: "rt60-per-pita-masjid",
      label: "RT60 terukur per pita oktaf, kondisi kosong dan kondisi penuh",
      method:
        "Pengukuran menurut ISO 3382-1 pada enam pita oktaf, dua kondisi hunian, dengan posisi sumber di mihrab dan mikrofon tersebar pada saf depan, tengah dan belakang.",
      why: "Selisih antara masjid kosong dan masjid penuh adalah angka yang paling sering diminta dan paling jarang diukur. Satu set data dari masjid nyata di Indonesia akan menjadi rujukan yang tidak ada bandingannya dalam bahasa Indonesia.",
    },
    {
      status: "perlu-data",
      id: "stipa-saf-terjauh",
      label: "STIPA terukur pada saf terjauh saat khutbah Jumat",
      method:
        "Pengukuran STIPA menurut IEC 60268-16 pada kondisi hunian penuh, dengan kebisingan latar tercatat, minimal pada saf depan, tengah dan belakang.",
      why: "Kejelasan pada kondisi ramai adalah kriteria yang benar-benar penting di masjid, dan tidak bisa disimpulkan dari pengukuran ruangan kosong. Data ini juga yang membedakan rekomendasi sistem terdistribusi dari sekadar pendapat.",
    },
  ],
  joins: [
    {
      href: "/solutions/house-of-worship",
      label: "House of Worship AV",
      kind: "solusi",
      why: "Ruang lingkup pekerjaan untuk rumah ibadah: tata suara utama, penundaan waktu, tampilan teks, dan penanganan akustik ruang berlangit-langit tinggi.",
    },
    {
      href: "/products/c/audio",
      label: "Katalog Audio",
      kind: "katalog",
      why: "Column array dan prosesor dengan penundaan waktu — kelas perangkat yang dibutuhkan ketika jarak kritis jauh lebih pendek daripada kedalaman ruang salat.",
    },
    {
      href: "/products/c/display",
      label: "Katalog Display",
      kind: "katalog",
      why: "LED display dan proyektor kelas terang, untuk ukuran citra yang keluar dari perhitungan DISCAS di halaman ini pada kondisi cahaya masjid yang sebenarnya.",
    },
  ],
  relatedLessons: [
    "rt60-akustik-ruang-bergema",
    "waktu-dengung-ideal-iso-3382",
    "sistem-tata-suara-gedung-bgm-paging-emergency",
    "menghitung-jumlah-ceiling-speaker",
  ],
  standards: [
    "ISO 3382-1",
    "ISO 354",
    "ISO 9613-1",
    "ANSI/AVIXA V202.01",
    "ISO 21118",
    "IEC 60268-16",
  ],
};

export const ROOM_ARCHETYPES: readonly RoomArchetype[] = [
  RUANG_RAPAT,
  AUDITORIUM,
  MASJID,
];

/* ------------------------------------------------------------------ *
 * Lookup + computation
 * ------------------------------------------------------------------ */

export function isRoomArchetypeSlug(value: string): value is RoomArchetypeSlug {
  return (ROOM_ARCHETYPE_SLUGS as readonly string[]).includes(value);
}

export function getRoomArchetype(slug: string): RoomArchetype | undefined {
  return ROOM_ARCHETYPES.find((room) => room.slug === slug);
}

export function roomHref(slug: RoomArchetypeSlug): string {
  return `${ROOM_BASE_PATH}/${slug}`;
}

/**
 * The display engine can legitimately refuse an input (a front row further from
 * the screen than the back row). Archetype inputs are version-controlled
 * constants where that state is unreachable, so a refusal here means the
 * constant itself is wrong — and failing loudly at render is the correct
 * outcome, not a UI branch that quietly prints nothing.
 */
function requireAnswer(
  result: ScreenSizeResult,
  slug: RoomArchetypeSlug,
  which: string,
): ScreenSizeAnswer {
  if (result.status === "ok") return result;
  throw new Error(
    `Arketipe ruang "${slug}" (${which}) ditolak kalkulator ukuran layar: ${result.refusal.code}. ` +
      "Masukan arketipe adalah konstanta terkontrol versi — perbaiki konstantanya di lib/learn/rooms.ts.",
  );
}

const numbersCache = new Map<RoomArchetypeSlug, RoomNumbers>();

/**
 * Run all three engines for one archetype.
 *
 * The projector's screen width is taken from the display engine's computed
 * requirement rather than typed into `inputs`, so the two calculators describe
 * the same screen by construction. That chaining is the reason the projector
 * number on a room page can never drift from the display number above it.
 *
 * Pure and deterministic, so the result is memoised for the build.
 */
export function roomNumbers(archetype: RoomArchetype): RoomNumbers {
  const cached = numbersCache.get(archetype.slug);
  if (cached) return cached;

  const acoustics = computeRt60(archetype.inputs.acoustics);
  const display = requireAnswer(
    computeScreenSize(archetype.inputs.display),
    archetype.slug,
    "tampilan utama",
  );

  const displayAlt = archetype.inputs.displayAlt
    ? {
        label: archetype.inputs.displayAlt.label,
        answer: requireAnswer(
          computeScreenSize(archetype.inputs.displayAlt.input),
          archetype.slug,
          archetype.inputs.displayAlt.label,
        ),
      }
    : null;

  let projector: ThrowResult | null = null;
  if (archetype.inputs.projector) {
    const throwInput: ThrowInput = {
      mode: "jarak",
      throwRatio: archetype.inputs.projector.throwRatio,
      // ← chained from the display engine, never typed in by hand
      screenWidthM: display.required.imageWidthM,
      throwDistanceM: 0,
      aspect: archetype.inputs.display.displayAspect,
      lumens: archetype.inputs.projector.lumens,
      gain: archetype.inputs.projector.gain,
      ambient: archetype.inputs.projector.ambient,
    };
    projector = computeProjector(throwInput);
  }

  const numbers: RoomNumbers = {
    slug: archetype.slug,
    acoustics,
    display,
    displayAlt,
    projector,
  };
  numbersCache.set(archetype.slug, numbers);
  return numbers;
}

/* ------------------------------------------------------------------ *
 * Presentation helpers — every value below comes from `roomNumbers`
 * ------------------------------------------------------------------ */

const ENGINE = {
  rt60: "Kalkulator RT60 · ISO 3382-1",
  rt60Material: "Kalkulator RT60 · koefisien ISO 354",
  layar: "Kalkulator Ukuran Layar · ANSI/AVIXA V202.01",
  proyektor: "Kalkulator Proyektor · ISO 21118",
  input: "Asumsi arketipe (lihat catatan rancangan)",
} as const;

function panelLabel(answer: ScreenSizeAnswer): string {
  if (answer.recommended) {
    return `${fmtInt(answer.recommended.diagonalIn)}" (${answer.recommended.availability})`;
  }
  return "Di luar panel komersial";
}

/**
 * The spec table. ≥8 rows on every archetype, and every numeric cell is a value
 * one of the three engines produced in this render — nothing is transcribed.
 */
export function roomSpecRows(
  archetype: RoomArchetype,
  numbers: RoomNumbers = roomNumbers(archetype),
): readonly RoomSpecRow[] {
  const { acoustics: a, display: d, projector: p } = numbers;
  const input = archetype.inputs.acoustics;

  const rows: RoomSpecRow[] = [
    {
      param: "Dimensi (P × L × T)",
      value: `${fmtFixed(input.length, 1)} × ${fmtFixed(input.width, 1)} × ${fmtFixed(input.height, 1)} m`,
      source: ENGINE.input,
    },
    {
      param: "Volume ruangan",
      value: `${fmt(a.geometry.volume)} m³`,
      source: ENGINE.rt60,
    },
    {
      param: "Luas permukaan total",
      value: `${fmt(a.geometry.totalSurface)} m²`,
      source: ENGINE.rt60,
    },
    {
      param: "Kepadatan hunian",
      value: `${fmt(a.geometry.peopleDensity)} orang/m²`,
      source: ENGINE.rt60,
    },
    {
      param: "Waktu dengung hitungan (pita tengah)",
      value: `${fmt(a.tMid)} detik`,
      source: `${ENGINE.rt60} · model ${a.midModel === "eyring" ? "Eyring" : "Sabine"}`,
    },
    {
      param: "Target waktu dengung",
      value: `${fmt(a.treatment.targetRange[0])}–${fmt(a.treatment.targetRange[1])} detik`,
      source: `${ENGINE.rt60} · ${a.treatment.roomLabel}`,
    },
    {
      param: "Waktu dengung 125 Hz",
      value: `${fmt(a.bands[0]?.rt60 ?? 0)} detik`,
      source: ENGINE.rt60Material,
    },
    {
      param: "Rasio bass (125 Hz ÷ pita tengah)",
      value: `${fmt(a.bassRatio)}×`,
      source: ENGINE.rt60,
    },
    {
      param: "Serapan tambahan yang dibutuhkan",
      value: a.treatment.meetsTarget
        ? "0 m² sabin"
        : `${fmt(a.treatment.additionalAbsorption)} m² sabin`,
      source: ENGINE.rt60,
    },
    {
      param: "Setara panel akustik 50 mm",
      value: a.treatment.meetsTarget
        ? "Tidak diperlukan"
        : Number.isFinite(a.treatment.panelArea)
          ? `${fmt(a.treatment.panelArea)} m²`
          : "Panel saja tidak cukup",
      source: `${ENGINE.rt60} · NRC ${fmt(a.treatment.panelNrc)}`,
    },
    {
      param: "Jarak kritis (Dc)",
      value: `${fmt(a.criticalDistance)} m`,
      source: `${ENGINE.rt60} · Q = ${fmtInt(a.directivity)}`,
    },
    {
      param: "Frekuensi Schroeder",
      value: `${fmt(a.schroederFrequency)} Hz`,
      source: ENGINE.rt60,
    },
    {
      param: "Kecenderungan kejelasan bicara",
      value:
        a.stipa.likelihood === "lolos"
          ? "Cenderung lolos"
          : a.stipa.likelihood === "batas"
            ? "Di batas"
            : "Cenderung gagal",
      source: "Kalkulator RT60 · kecenderungan, bukan nilai STI",
    },
    {
      param: "Jarak penonton terjauh",
      value: `${fmtFixed(d.distance.farthestViewerM, 1)} m`,
      source: ENGINE.input,
    },
    {
      param: "Tinggi citra minimum",
      value: `${fmt(d.required.imageHeightM)} m`,
      source: `${ENGINE.layar} · ${d.model.short}`,
    },
    {
      param: "Lebar citra minimum",
      value: `${fmt(d.required.imageWidthM)} m`,
      source: `${ENGINE.layar} · ${d.model.short}`,
    },
    {
      param: "Diagonal minimum",
      value: `${fmt(d.required.diagonalIn)} inci`,
      source: ENGINE.layar,
    },
    {
      param: "Panel komersial terkecil yang memenuhi",
      value: panelLabel(d),
      source: ENGINE.layar,
    },
    {
      param: "Tinggi puncak citra dari lantai",
      value: `${fmt(d.mounting.imageTopM)} m`,
      source: `${ENGINE.layar} · bawah citra ${fmt(d.mounting.imageBottomM)} m`,
    },
    {
      param: "Jarak penonton terdepan minimum",
      value: `${fmt(d.distance.closestViewerM)} m`,
      source: ENGINE.layar,
    },
  ];

  if (p) {
    rows.push(
      {
        param: "Jarak lempar proyektor",
        value: `${fmt(p.throwDistanceM)} m`,
        source: `${ENGINE.proyektor} · rasio lempar ${fmt(p.throwRatio)}`,
      },
      {
        param: "Luas bidang layar",
        value: `${fmt(p.screen.areaM2)} m²`,
        source: ENGINE.proyektor,
      },
      {
        param: "Kecerahan efektif di layar",
        value: `${fmt(p.brightness.flEffective)} fL`,
        source: `${ENGINE.proyektor} · ${fmtInt(p.input.lumens)} lumen, cadangan lampu`,
      },
      {
        param: "Target kecerahan",
        value: `${fmtInt(p.target.fL)} fL`,
        source: `${ENGINE.proyektor} · ${p.target.label}`,
      },
      {
        param: "Lumen minimum untuk target",
        value: `${fmtInt(p.brightness.lumensRequired)} lumen`,
        source: ENGINE.proyektor,
      },
    );
  }

  return rows;
}

/** Rows for the second display scenario, when an archetype defines one. */
export function roomAltDisplayRows(
  numbers: RoomNumbers,
): readonly RoomSpecRow[] | null {
  const alt = numbers.displayAlt;
  if (!alt) return null;
  return [
    {
      param: "Tinggi citra minimum",
      value: `${fmt(alt.answer.required.imageHeightM)} m`,
      source: `${ENGINE.layar} · ${alt.answer.model.short}`,
    },
    {
      param: "Diagonal minimum",
      value: `${fmt(alt.answer.required.diagonalIn)} inci`,
      source: ENGINE.layar,
    },
    {
      param: "Panel komersial terkecil yang memenuhi",
      value: panelLabel(alt.answer),
      source: ENGINE.layar,
    },
    {
      param: "Jangkauan panel yang direncanakan",
      value: `${fmt(alt.answer.planned.maxDistanceM)} m`,
      source: `${ENGINE.layar} · panel ${fmtInt(alt.answer.planned.diagonalIn)}"`,
    },
  ];
}

/** Compact readouts for the card and the index page. */
export type RoomStat = { label: string; value: string };

export type RoomSummary = {
  slug: RoomArchetypeSlug;
  href: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  promise: string;
  capacity: string;
  stats: readonly RoomStat[];
  standards: readonly string[];
  reviewedAt: string;
};

export function roomSummary(archetype: RoomArchetype): RoomSummary {
  const numbers = roomNumbers(archetype);
  return {
    slug: archetype.slug,
    href: roomHref(archetype.slug),
    eyebrow: archetype.eyebrow,
    title: archetype.title,
    shortTitle: archetype.shortTitle,
    promise: archetype.promise,
    capacity: archetype.capacity,
    standards: archetype.standards,
    reviewedAt: archetype.reviewedAt,
    stats: [
      { label: "RT60 hitungan", value: `${fmt(numbers.acoustics.tMid)} detik` },
      {
        label: "Layar minimum",
        value: `${fmt(numbers.display.required.diagonalIn)} inci`,
      },
      { label: "Jarak kritis", value: `${fmt(numbers.acoustics.criticalDistance)} m` },
    ],
  };
}

export function roomSummaries(): readonly RoomSummary[] {
  return ROOM_ARCHETYPES.map(roomSummary);
}

/**
 * Facts echoed into the prefilled WhatsApp message, so the salesperson opens the
 * chat already knowing which room the reader was looking at and what the page
 * told them (03-UI §13.4).
 */
export function roomWaDetailLines(
  archetype: RoomArchetype,
  numbers: RoomNumbers = roomNumbers(archetype),
): readonly string[] {
  const input = archetype.inputs.acoustics;
  const lines = [
    `Arketipe: ${archetype.title} — ${fmtFixed(input.length, 1)} × ${fmtFixed(input.width, 1)} × ${fmtFixed(input.height, 1)} m.`,
    `RT60 hitungan ${fmt(numbers.acoustics.tMid)} detik terhadap target ${fmt(numbers.acoustics.treatment.targetRt60)} detik.`,
    `Layar minimum ${fmt(numbers.display.required.diagonalIn)} inci untuk jarak ${fmtFixed(numbers.display.distance.farthestViewerM, 1)} m.`,
  ];
  if (numbers.projector) {
    lines.push(
      `Proyektor: ${fmt(numbers.projector.brightness.flEffective)} fL terhadap target ${fmtInt(numbers.projector.target.fL)} fL.`,
    );
  }
  return lines;
}

/** Only the placeholders, for the "PERLU DATA ACTA" panel. */
export function pendingMeasurements(
  archetype: RoomArchetype,
): readonly Extract<RoomMeasurement, { status: "perlu-data" }>[] {
  return archetype.measurements.filter(
    (m): m is Extract<RoomMeasurement, { status: "perlu-data" }> =>
      m.status === "perlu-data",
  );
}

export function filledMeasurements(
  archetype: RoomArchetype,
): readonly Extract<RoomMeasurement, { status: "terisi" }>[] {
  return archetype.measurements.filter(
    (m): m is Extract<RoomMeasurement, { status: "terisi" }> => m.status === "terisi",
  );
}
