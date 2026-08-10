/**
 * ALL user-facing copy for the throw-distance + brightness calculator.
 *
 * Pure data and pure template functions — no React, no I/O, no Date. The
 * calculator's engine (`calc.ts`) imports the templates it needs so that every
 * Bahasa Indonesia string on the page has exactly one home (03-UI §12.1).
 *
 * Type imports from `./calc` are erased at compile time, so there is no runtime
 * import cycle: copy.id.ts → calc.ts is types only, calc.ts → copy.id.ts is real.
 *
 * Positioning (03-UI §12.4): BenQ already owns "throw distance" in Indonesian
 * with a manufacturer's budget. The lead here is BRIGHTNESS — the thing that
 * actually fails in Indonesian rooms (jendela besar, tanpa blackout, siang
 * tropis) and the thing manufacturers underplay.
 */

import type { AmbientLevel, AspectRatioId, ThrowInput, ThrowMode } from "./calc";

/* ------------------------------------------------------------------ */
/* Page-level identity                                                 */
/* ------------------------------------------------------------------ */

export const TOOL = {
  slug: "throw-distance-proyektor",
  path: "/learn/alat/throw-distance-proyektor",
  name: "Kalkulator Throw Distance & Kecerahan Proyektor",
  shortName: "Kalkulator Proyektor",
  eyebrow: "ALAT 03 · THROW + KECERAHAN",
  h1: "Kalkulator Throw Distance & Kecerahan Proyektor",
  widgetTitle: "Hitung jarak lempar dan kecerahan",
  seoTitle:
    "Kalkulator Throw Distance & Lumen Proyektor — Hitung Jarak dan Kecerahan",
  seoDescription:
    "Hitung jarak lempar proyektor dari throw ratio, lalu periksa apakah lumennya cukup untuk ruangan Anda. Target 12/22/40 fL, cadangan lampu 0,75, dan batas ketika LED lebih masuk akal.",
  intro:
    "Jarak lempar hanya perkalian sederhana; yang membuat proyektor gagal di ruangan Indonesia hampir selalu kecerahan. Kalkulator ini menghitung keduanya, memakai cadangan lampu 0,75, dan mengatakan dengan jelas ketika proyektor bukan jawaban yang tepat.",
  /** Printed by ShowTheMath as "Diverifikasi: {verifiedAt} · ACTA". */
  verifiedAt: "2026-08",
  /** Header chip of the math panel. */
  standardChips: ["ANSI/AVIXA V201.01:2021", "ISO 21118:2020"],
} as const;

/* ------------------------------------------------------------------ */
/* Form fields — imported by Panel.tsx and by the server-rendered form  */
/* ------------------------------------------------------------------ */

export const MODE_OPTIONS: readonly { value: ThrowMode; label: string }[] = [
  { value: "jarak", label: "Jarak lempar — dari lebar layar" },
  { value: "lebar", label: "Lebar layar maksimum — dari jarak" },
];

export const ASPECT_OPTIONS: readonly {
  value: AspectRatioId;
  label: string;
}[] = [
  { value: "16x9", label: "16:9 — layar lebar standar" },
  { value: "16x10", label: "16:10 — banyak proyektor & laptop" },
  { value: "4x3", label: "4:3 — layar lama / dokumen" },
  { value: "21x9", label: "21:9 — ultrawide" },
];

export const AMBIENT_OPTIONS: readonly {
  value: AmbientLevel;
  label: string;
}[] = [
  { value: "gelap", label: "Gelap total — blackout penuh (12 fL)" },
  { value: "terkontrol", label: "Terkontrol — tirai tertutup, lampu redup (22 fL)" },
  { value: "tinggi", label: "Tinggi — jendela besar, siang hari (40 fL)" },
];

/**
 * The same three levels as cards. Room light is the biggest single lever on the
 * answer and the only input a reader can judge by looking up from their desk —
 * as a dropdown it read like a technical setting, as cards it reads like the
 * question it is.
 */
export const AMBIENT_CARDS: readonly {
  value: AmbientLevel;
  label: string;
  description: string;
  badge: string;
}[] = [
  {
    value: "terkontrol",
    label: "Terkontrol",
    description: "Tirai tertutup, lampu diredupkan",
    badge: "22 fL",
  },
  {
    value: "tinggi",
    label: "Cahaya tinggi",
    description: "Jendela besar, siang hari, lampu menyala",
    badge: "40 fL",
  },
  {
    value: "gelap",
    label: "Gelap total",
    description: "Blackout penuh — bioskop, studio",
    badge: "12 fL",
  },
];

export const FIELDS = {
  legend: "Parameter proyektor & layar",
  mode: {
    label: "Yang ingin dihitung",
    hint: "Persamaan yang sama, dibalik: D = TR × W dan W = D ÷ TR.",
    options: MODE_OPTIONS,
  },
  throwRatio: {
    /** Short: it now shares a two-column row and the long form wrapped. */
    label: "Throw ratio (TR)",
    unit: "×",
    hint: "Ambil dari lembar data proyektor, biasanya 1,2–1,8. Angka kecil berarti proyektor boleh lebih dekat ke layar.",
  },
  screenWidth: {
    label: "Lebar layar",
    unit: "m",
    hint: "Lebar area gambar, bukan lebar bingkai atau casing.",
  },
  throwDistance: {
    label: "Jarak lensa ke layar",
    unit: "m",
    hint: "Diukur dari permukaan lensa, tegak lurus ke layar.",
  },
  aspect: {
    label: "Rasio aspek layar",
    hint: "Menentukan tinggi layar, dan karena itu menentukan luas dan kecerahan.",
    options: ASPECT_OPTIONS,
  },
  lumens: {
    label: "Kecerahan proyektor",
    unit: "lm",
    hint: "Angka lumen dari lembar data (ANSI / ISO 21118). Angka “LED lumens” di marketplace bukan angka yang sama.",
  },
  gain: {
    label: "Gain layar",
    unit: "×",
    hint: "Layar matte putih = 1,0. Dinding cat putih ≈ 0,7–0,9. Gain tinggi tidak gratis — sudut pandangnya menyempit.",
  },
  ambient: {
    label: "Kondisi cahaya ruangan",
    hint: "Pilih kondisi terburuk yang akan dipakai, bukan kondisi ideal saat demo.",
    options: AMBIENT_OPTIONS,
    cards: AMBIENT_CARDS,
  },
  opticsLabel: "Lensa & layar",
  advancedSummary: "Setelan lanjutan",
  submitLabel: "Hitung",
  resetLabel: "Atur ulang",
  /** Shown by the Panel when the inputs no longer match the rendered result. */
  dirtyNotice:
    "Nilai berubah. Tekan Hitung untuk memperbarui hasil dan tautan berbagi.",
  /** Live echo of the derived screen geometry, next to the inputs. */
  derived: (v: { width: string; height: string; diagonalInch: string }) =>
    `Layar ${v.width} × ${v.height} m · diagonal ${v.diagonalInch}"`,
} as const;

/* ------------------------------------------------------------------ */
/* Result panel                                                        */
/* ------------------------------------------------------------------ */

export const AMBIENT_LABELS: Record<AmbientLevel, string> = {
  gelap: "ruang gelap",
  terkontrol: "ambient terkontrol",
  tinggi: "ambient tinggi",
};

export const RESULT = {
  brightnessLabel: "KECERAHAN DI LAYAR · SETELAH CADANGAN LAMPU",
  brightnessUnit: "fL",
  throwLabel: "JARAK LEMPAR",
  widthLabel: "LEBAR LAYAR MAKSIMUM",
  lumensLabel: "LUMEN MINIMUM YANG PERLU DIBELI",
  lumensUnit: "lm",
  nitsLabel: "SETARA LUMINANSI",
  nitsUnit: "cd/m²",
  screenLabel: "GEOMETRI LAYAR",
  verdict: {
    aman: (v: { target: string }) => `Memenuhi target ${v.target} fL`,
    marginal: (v: { target: string }) => `Nyaris — di bawah target ${v.target} fL`,
    kurang: (v: { target: string }) => `Kurang terang untuk target ${v.target} fL`,
  },

  /** The band. Same three grades the engine already computed, drawn instead of chipped. */
  gaugeLabel: "POSISI KECERAHAN ANDA",
  gaugeZones: {
    kurang: "Kurang",
    marginal: "Marginal",
    aman: "Aman",
  },
  gaugeCaption: (v: { target: string; ambient: string }) =>
    `Target ${v.target} fL untuk kondisi ${v.ambient}. Zona marginal mulai 20% di bawah target — ` +
    `masih terlihat, tanpa cadangan untuk lampu yang menua atau tirai yang lupa ditutup.`,
  gaugeDescription: (v: { fl: string; target: string; ambient: string }) =>
    `Kecerahan di layar ${v.fl} fL terhadap target ${v.target} fL untuk kondisi ${v.ambient}.`,

  brightnessCaption: (v: {
    lumens: string;
    effective: string;
    ambient: string;
  }) =>
    `${v.lumens} lumen di lembar data menjadi ${v.effective} lumen setelah cadangan desain 0,75, lalu dibagi luas layar. Target ${v.ambient}.`,
  throwCaption: (v: { tr: string; width: string }) =>
    `Throw ratio ${v.tr} × lebar layar ${v.width} m. Diukur dari lensa, tegak lurus ke layar.`,
  widthCaption: (v: { tr: string; distance: string }) =>
    `Jarak ${v.distance} m dibagi throw ratio ${v.tr}. Ini batas atas — layar boleh lebih kecil.`,
  lumensCaption: (v: { target: string; recommended: string }) =>
    `Untuk target ${v.target} fL, sudah termasuk cadangan lampu 0,75. Untuk ruang dengan cahaya tinggi, siapkan ${v.recommended} lumen.`,
  screenCaption: (v: {
    width: string;
    height: string;
    diagonalInch: string;
    areaM2: string;
  }) =>
    `${v.width} × ${v.height} m, diagonal ${v.diagonalInch}", luas ${v.areaM2} m². Luas layar inilah yang menentukan kecerahan.`,
  findingsLabel: "Temuan",
  /** One-sentence headline sentence, used above the readouts and in the OG card. */
  summary: {
    aman: (v: {
      lumens: string;
      width: string;
      fl: string;
      target: string;
      ambient: string;
    }) =>
      `Proyektor ${v.lumens} lumen pada layar ${v.width} m menghasilkan ${v.fl} fL setelah cadangan lampu — di atas target ${v.target} fL untuk ${v.ambient}.`,
    marginal: (v: {
      lumens: string;
      width: string;
      fl: string;
      target: string;
      ambient: string;
    }) =>
      `Proyektor ${v.lumens} lumen pada layar ${v.width} m menghasilkan ${v.fl} fL setelah cadangan lampu — tepat di bawah target ${v.target} fL untuk ${v.ambient}. Ruang seperti ini terlihat baik saat demo dan mengecewakan saat dipakai.`,
    kurang: (v: {
      lumens: string;
      width: string;
      fl: string;
      target: string;
      ambient: string;
      required: string;
    }) =>
      `Proyektor ${v.lumens} lumen pada layar ${v.width} m hanya menghasilkan ${v.fl} fL setelah cadangan lampu, sementara ${v.ambient} butuh ${v.target} fL. Kelas yang tepat untuk layar ini adalah ${v.required} lumen.`,
  },
} as const;

/* ------------------------------------------------------------------ */
/* Findings — input-dependent, ordered by severity in calc.ts          */
/* ------------------------------------------------------------------ */

export const FINDINGS = {
  ustGeometri: (v: { tr: string; distance: string; height: string }) => ({
    title: "Throw ratio ini kelas ultra-short-throw",
    detail: `TR ${v.tr} menempatkan lensa hanya ${v.distance} m dari layar, dengan sudut proyeksi yang sangat curam. Konsekuensinya nyata: layar harus benar-benar rata dan tegak (gelombang 3 mm pada kain akan terlihat sebagai bayangan), bracket harus kaku karena pergeseran 1 mm menggeser gambar beberapa sentimeter, dan koreksi keystone digital memotong resolusi asli — jangan dipakai untuk menutup kesalahan pemasangan. Alat ini tidak menghitung tinggi pemasangan; UST punya offset vertikal besar yang hanya ada di lembar data unit tersebut.`,
  }),
  throwPendek: (v: { tr: string; distance: string }) => ({
    title: "Kelas short-throw",
    detail: `TR ${v.tr} berarti lensa cukup ${v.distance} m dari layar. Bagus untuk ruang dangkal dan mengurangi bayangan presenter, tetapi periksa bahwa bracket dan jalur kabel tersedia di posisi itu.`,
  }),
  throwPanjang: (v: { distance: string }) => ({
    title: "Jarak lempar melebihi kedalaman banyak ruangan",
    detail: `Lensa perlu berada ${v.distance} m dari layar. Alat ini tidak tahu ukuran ruangan Anda — pastikan titik itu masih di dalam ruang, tidak tertutup balok atau unit AC, dan tidak berada tepat di atas kepala penonton baris terakhir. Jika tidak muat, yang diubah adalah throw ratio (lensa lain), bukan lumen.`,
  }),
  kurangTerang: (v: {
    fl: string;
    target: string;
    ambient: string;
    required: string;
    shortfall: string;
  }) => ({
    title: `Kecerahan kurang: ${v.fl} fL terhadap target ${v.target} fL`,
    detail: `Untuk ${v.ambient}, layar seukuran ini butuh ${v.required} lumen di lembar data — kurang ${v.shortfall} lumen dari unit yang Anda masukkan. Ada tiga cara jujur menutupnya: perkecil layar (kecerahan berbanding terbalik dengan luas), kendalikan cahaya ruangan, atau naikkan kelas proyektor. Menaikkan gain layar adalah cara keempat yang biasanya menimbulkan masalah baru.`,
  }),
  nyarisTarget: (v: { fl: string; target: string; required: string }) => ({
    title: `Tipis: ${v.fl} fL terhadap target ${v.target} fL`,
    detail: `Selisih sekecil ini akan habis oleh hal-hal yang tidak terlihat di angka: lampu yang menua, lensa berdebu, posisi zoom paling lebar, dan mode warna yang menurunkan keluaran. Kelas ${v.required} lumen membuat sistem ini tetap benar di tahun ketiga, bukan hanya di hari pertama.`,
  }),
  belumRekomendasiId: (v: { fl: string }) => ({
    title: "Aman untuk kondisi yang dipilih, belum untuk siang hari terbuka",
    detail: `${v.fl} fL memenuhi target yang Anda pilih, tetapi di bawah 40 fL yang kami pakai sebagai rekomendasi untuk ruang Indonesia dengan jendela besar tanpa blackout. Jika tirai kadang dibuka atau rapat dilakukan siang hari, hitung ulang dengan kondisi “Tinggi”.`,
  }),
  cadanganBesar: (v: { fl: string; target: string }) => ({
    title: "Cadangan kecerahan besar",
    detail: `${v.fl} fL jauh di atas target ${v.target} fL. Ini bukan masalah, tetapi mode eco akan memperpanjang umur lampu, menurunkan kebisingan kipas, dan pada ruang gelap justru menurunkan kelelahan mata. Gambar yang terlalu terang di ruang gelap terlihat pucat, bukan tajam.`,
  }),
  ledDirectView: (v: { required: string; width: string; ambient: string }) => ({
    title: "Pada ukuran ini, LED direct-view lebih masuk akal daripada proyektor",
    detail: `Layar ${v.width} m pada ${v.ambient} menuntut ${v.required} lumen — di atas ambang 8.000 lumen tempat proyektor mulai kalah secara teknis dan ekonomis: unit sebesar itu mahal, berisik, butuh perawatan lampu, dan tetap kehilangan kontras begitu lampu ruangan dinyalakan. LED direct-view tidak punya masalah ambient sama sekali. Kami menyebutkan ini walaupun artinya kehilangan penjualan proyektor.`,
  }),
  gainTinggi: (v: { gain: string }) => ({
    title: `Gain layar ${v.gain} bukan lumen gratis`,
    detail: `Layar gain tinggi memantulkan lebih banyak cahaya ke arah tengah dengan cara mengambilnya dari sudut. Akibatnya: penonton di sisi kiri dan kanan melihat gambar lebih redup, sering muncul hotspot terang di tengah, dan permukaannya lebih memperlihatkan kerutan. Perhitungan di atas mengasumsikan penonton duduk di dalam sudut pandang efektif layar.`,
  }),
  gainRendah: (v: { gain: string }) => ({
    title: `Gain ${v.gain} menurunkan kecerahan secara proporsional`,
    detail: `Permukaan gain rendah — layar abu-abu, ALR, atau dinding cat — mengembalikan lebih sedikit cahaya ke penonton. Angka di atas sudah memperhitungkannya. Layar ALR adalah keputusan kontras, bukan keputusan kecerahan, dan hanya bekerja untuk arah cahaya tertentu.`,
  }),
  offsetLensa: () => ({
    title: "Offset dan lens shift tidak dimodelkan",
    detail:
      "Alat ini tidak menghitung tinggi pemasangan bracket, offset vertikal lensa, maupun rentang lens shift, karena ketiganya berbeda per unit dan hanya ada di lembar data proyektor tersebut. Menebaknya akan menghasilkan bracket yang salah. Ambil angka offset dari lembar data, atau kirim tipe proyektornya kepada kami.",
  }),
} as const;

/* ------------------------------------------------------------------ */
/* Show-the-math                                                       */
/* ------------------------------------------------------------------ */

export const MATH = {
  summaryLabel: "Tampilkan perhitungan",
  steps: {
    widthFromDistance: "Lebar layar maksimum",
    screenHeight: "Tinggi layar",
    diagonal: "Diagonal layar",
    throwDistance: "Jarak lempar",
    areaM2: "Luas layar",
    areaFt2: "Konversi luas ke kaki persegi",
    derate: "Cadangan lampu",
    footLambert: "Kecerahan di layar",
    nits: "Setara luminansi",
    target: "Target kecerahan",
    requiredLumens: "Lumen yang dibutuhkan",
    verdict: "Penilaian",
  },
  notes: {
    diagonal: "Untuk membandingkan dengan ukuran panel LED/LCD yang dijual dalam inci.",
    derate: "Margin desain: keluaran proyektor turun 25–50% sepanjang umur pakai lampu.",
    footLambert:
      "Tidak ada π dalam rumus ini. Foot-lambert adalah lumen per kaki persegi yang dipantulkan layar difus gain 1,0.",
    target: (v: { ambient: string }) =>
      `12 fL ruang gelap · 22 fL ambient terkontrol · 40 fL ambient tinggi. Kondisi yang dipilih: ${v.ambient}.`,
    requiredLumens:
      "Dibagi 0,75 karena angka ini adalah lumen yang harus tertulis di lembar data, bukan lumen di tahun ketiga.",
    verdictAman: "Rasio ≥ 1 — target terpenuhi.",
    verdictMarginal: "Rasio 0,8–1,0 — di bawah target, tetapi masih dalam rentang toleransi pengukuran.",
    verdictKurang: "Rasio < 0,8 — target tidak terpenuhi.",
    modeJarak: "Mode dipilih: lebar layar diketahui, jarak lempar dihitung.",
    modeLebar: "Mode dipilih: jarak lensa ke layar diketahui, lebar layar maksimum dihitung.",
  },
  formulas: {
    widthFromDistance: "W = D ÷ TR",
    screenHeight: (v: { h: number; w: number }) => `H = W × ${v.h} ÷ ${v.w}`,
    diagonal: "diag = √(W² + H²)",
    throwDistance: "D = TR × W",
    areaM2: "A = W × H",
    areaFt2: "A_ft² = A × 10,7639",
    derate: "lm_efektif = lm × 0,75",
    footLambert: "fL = lm_efektif ÷ A_ft² × gain",
    nits: "cd/m² = fL × 3,426",
    target: "fL_target",
    requiredLumens: "lm_minimum = fL_target × A_ft² ÷ gain ÷ 0,75",
    verdict: "fL ÷ fL_target",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Assumptions + limits                                                */
/* ------------------------------------------------------------------ */

export const ASSUMPTIONS = {
  base: [
    "Layar rata dan tegak lurus terhadap sumbu lensa, dan proyektor berada di tengah lebar layar.",
    "Offset lensa, lens shift, dan tinggi pemasangan bracket tidak dimodelkan — angkanya berbeda per unit dan hanya ada di lembar data proyektor.",
    "Cadangan lampu 0,75 diterapkan pada lumen lembar data, karena keluaran turun 25–50% sepanjang umur pakai.",
    "Lumen dianggap hasil ukur menurut lembar data (ANSI / ISO 21118). Angka pemasaran tanpa metode ukur biasanya lebih tinggi dari kenyataan.",
    "Kecerahan warna dapat jauh di bawah kecerahan putih pada proyektor DLP satu chip; perhitungan ini memakai satu angka lumen.",
    "Kontras sistem (ISCR) tidak dihitung dari dimensi ruang — lihat catatan standar di bawah.",
  ],
  gainNonUnity:
    "Gain layar dianggap merata untuk semua penonton. Layar gain tinggi dan ALR tidak merata: penonton di sisi samping menerima lebih sedikit cahaya.",
  roomDepth: (v: { distance: string }) =>
    `Ruangan dianggap cukup dalam untuk jarak lempar ${v.distance} m; alat ini tidak mengetahui dimensi ruangan Anda.`,
} as const;

export const LIMITS_COPY = {
  title: "Yang tidak dihitung alat ini",
  items: [
    "Tinggi pemasangan, offset lensa, dan lens shift — ambil dari lembar data proyektor.",
    "Kedalaman ruangan, balok struktur, grid plafon, dan posisi unit AC di jalur proyeksi.",
    "Kehilangan keluaran pada posisi zoom paling lebar, yang pada sebagian lensa mencapai 30%.",
    "Kontras sistem (ISCR) dan pengaruh cahaya ruangan terhadap tingkat hitam.",
    "Respons sudut layar ALR dan seberapa besar penonton samping kehilangan kecerahan.",
    "Mode gambar, HDR, dan 3D, yang semuanya menurunkan keluaran dari angka lembar data.",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Refusals (03-UI §12.8 Rule 1 — verbatim)                            */
/* ------------------------------------------------------------------ */

export const REFUSALS = {
  iscr: {
    title: "Rasio kontras sistem: tidak kami publikasikan",
    /** Verbatim from 03-UI §12.8. Do not paraphrase. */
    body: "Rasio kontras sistem mengikuti ANSI/AVIXA V201.01:2021 — nilai spesifik per kategori tidak kami publikasikan karena standarnya berbayar. Hubungi kami untuk hasil pengukuran ISCR di ruangan Anda.",
    note: "Alat ini menghitung kecerahan, dan kecerahan bukan kontras. Proyektor yang cukup terang tetap terlihat pucat jika cahaya ruangan jatuh ke layar dan menaikkan tingkat hitam. Itu masalah kontras, dan satu-satunya cara memastikannya adalah pengukuran di lokasi.",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Worked examples (03-UI §12.6 item 6)                                */
/* ------------------------------------------------------------------ */

export type WorkedExample = {
  id: string;
  title: string;
  context: string;
  input: ThrowInput;
  takeaway: string;
};

export const EXAMPLES: readonly WorkedExample[] = [
  {
    id: "ruang-rapat-tirai",
    title: "Ruang rapat 12 orang, tirai tertutup",
    context:
      "Layar tarik 2,4 m di dinding pendek, proyektor 3.500 lumen di plafon, tirai ditutup saat presentasi. Ini konfigurasi paling umum di kantor Jakarta.",
    input: {
      mode: "jarak",
      throwRatio: 1.5,
      screenWidthM: 2.4,
      throwDistanceM: 3.6,
      aspect: "16x9",
      lumens: 3500,
      gain: 1,
      ambient: "terkontrol",
    },
    takeaway:
      "Ruang kecil hampir tidak pernah gagal pada kecerahan — cadangannya besar, dan mode eco justru pilihan yang benar. Yang perlu diperiksa di ruang seperti ini adalah apakah 3,6 m jarak lempar muat di kedalaman ruangan.",
  },
  {
    id: "aula-sekolah",
    title: "Aula sekolah, layar 4,5 m, jendela besar",
    context:
      "Aula serbaguna dengan jendela tinggi di kedua sisi dan tanpa blackout. Proyektor 6.000 lumen dipasang di plafon belakang dengan throw ratio 1,8.",
    input: {
      mode: "jarak",
      throwRatio: 1.8,
      screenWidthM: 4.5,
      throwDistanceM: 8.1,
      aspect: "16x9",
      lumens: 6000,
      gain: 1,
      ambient: "tinggi",
    },
    takeaway:
      "6.000 lumen terdengar besar di brosur dan tetap tipis untuk layar 4,5 m dengan cahaya siang. Di ruang seperti ini, mengecilkan layar setengah meter sering lebih murah daripada menaikkan kelas proyektor.",
  },
  {
    id: "rumah-ibadah",
    title: "Rumah ibadah, layar 6,0 m, siang hari",
    context:
      "Ruang ibadah dengan bukaan besar dan jemaah yang datang siang hari. Layar 6,0 m, proyektor 8.000 lumen, throw ratio 1,2.",
    input: {
      mode: "jarak",
      throwRatio: 1.2,
      screenWidthM: 6,
      throwDistanceM: 7.2,
      aspect: "16x9",
      lumens: 8000,
      gain: 1,
      ambient: "tinggi",
    },
    takeaway:
      "Ini kasus ketika jawaban yang benar adalah berhenti membeli proyektor. Kebutuhan lumennya melewati 8.000, dan LED direct-view menyelesaikan masalah cahaya ruangan yang tidak bisa diselesaikan oleh proyektor mana pun.",
  },
];

/* ------------------------------------------------------------------ */
/* Reference tables (03-UI §12.6 item 7)                               */
/* ------------------------------------------------------------------ */

export const REFERENCE = {
  brightness: {
    caption: "Target kecerahan layar menurut kondisi cahaya ruangan",
    columns: [
      { key: "kondisi", label: "Kondisi ruangan" },
      { key: "fl", label: "Target (fL)", align: "right" as const, mono: true },
      { key: "nit", label: "≈ cd/m²", align: "right" as const, mono: true },
      { key: "contoh", label: "Contoh di Indonesia" },
    ],
    rows: [
      {
        kondisi: "Gelap total, blackout penuh",
        fl: "12",
        nit: "41",
        contoh: "Bioskop mini, ruang simulasi, home theatre",
      },
      {
        kondisi: "Ambient terkontrol",
        fl: "22",
        nit: "75",
        contoh: "Ruang rapat dengan tirai tertutup, ruang kelas tanpa jendela besar",
      },
      {
        kondisi: "Ambient tinggi",
        fl: "40",
        nit: "137",
        contoh: "Aula dengan jendela besar, lobi, rumah ibadah siang hari",
      },
    ],
    note: "Minimum yang kami pakai untuk ruang Indonesia adalah 22 fL; rekomendasi untuk ruang dengan jendela besar tanpa blackout adalah 40 fL. Konversi memakai 1 fL = 3,426 cd/m².",
  },
  throwClasses: {
    caption: "Kelas throw ratio dan implikasinya pada pemasangan",
    columns: [
      { key: "kelas", label: "Kelas" },
      { key: "tr", label: "Throw ratio", mono: true },
      { key: "jarak", label: "Jarak untuk layar 3,0 m", align: "right" as const, mono: true },
      { key: "catatan", label: "Catatan pemasangan" },
    ],
    rows: [
      {
        kelas: "Ultra-short-throw",
        tr: "< 0,4",
        jarak: "< 1,2 m",
        catatan: "Menuntut layar sangat rata dan bracket kaku; offset vertikal besar",
      },
      {
        kelas: "Short-throw",
        tr: "0,4 – 1,0",
        jarak: "1,2 – 3,0 m",
        catatan: "Mengurangi bayangan presenter, cocok untuk ruang dangkal",
      },
      {
        kelas: "Standar",
        tr: "1,0 – 2,0",
        jarak: "3,0 – 6,0 m",
        catatan: "Pemasangan plafon paling umum di ruang rapat dan kelas",
      },
      {
        kelas: "Long-throw",
        tr: "> 2,0",
        jarak: "> 6,0 m",
        catatan: "Perlu ruang dalam; periksa balok, ducting, dan jalur pandang",
      },
    ],
    note: "Kelas ini adalah konvensi industri untuk membaca lembar data, bukan tabel dari standar berbayar. Throw ratio unit Anda tetap yang menentukan.",
  },
  gains: {
    caption: "Gain permukaan layar yang umum dipakai di Indonesia",
    columns: [
      { key: "permukaan", label: "Permukaan" },
      { key: "gain", label: "Gain tipikal", align: "right" as const, mono: true },
      { key: "catatan", label: "Konsekuensi" },
    ],
    rows: [
      {
        permukaan: "Layar matte putih",
        gain: "1,0",
        catatan: "Acuan. Kecerahan merata ke seluruh sudut pandang",
      },
      {
        permukaan: "Dinding dicat putih",
        gain: "0,7 – 0,9",
        catatan: "Tekstur cat menyebarkan cahaya dan menurunkan ketajaman tepi",
      },
      {
        permukaan: "Layar abu-abu / high-contrast",
        gain: "0,8 – 1,0",
        catatan: "Menukar kecerahan dengan tingkat hitam yang lebih baik",
      },
      {
        permukaan: "Layar gain tinggi",
        gain: "1,3 – 2,0",
        catatan: "Sudut pandang menyempit; hotspot di tengah pada layar besar",
      },
      {
        permukaan: "Layar ALR",
        gain: "0,6 – 1,2",
        catatan: "Menolak cahaya dari arah tertentu saja; harus cocok dengan posisi lampu",
      },
    ],
    note: "Selalu pakai angka gain dari lembar data layar yang benar-benar dibeli. Rentang di atas untuk memeriksa kewajaran, bukan untuk dipakai dalam RAB.",
  },
  matrix: {
    caption: "Lumen minimum yang harus tertulis di lembar data (gain 1,0, rasio 16:9)",
    widthsM: [2.4, 3, 3.6, 4.5, 6] as const,
    note: "Dihitung dengan rumus di panel perhitungan, termasuk cadangan lampu 0,75. Kolom 40 fL adalah rekomendasi kami untuk ruang Indonesia dengan cahaya siang.",
    columns: {
      width: "Lebar layar",
      area: "Luas layar",
      dark: "12 fL",
      controlled: "22 fL",
      high: "40 fL",
    },
  },
} as const;

/* ------------------------------------------------------------------ */
/* FAQ — plain <h2> + prose. NO FAQPage JSON-LD (03-UI §12.6 item 8)   */
/* ------------------------------------------------------------------ */

export const FAQ: readonly { q: string; a: string }[] = [
  {
    q: "Berapa lumen yang saya butuhkan?",
    a: "Tidak ada satu angka. Kebutuhan lumen berbanding lurus dengan luas layar dan dengan target kecerahan ruangan: lm = fL_target × luas_kaki² ÷ gain, lalu dibagi 0,75 sebagai cadangan umur lampu. Layar 3,0 m di ruang bertirai butuh sekitar sepertiga lumen dari layar 6,0 m di ruang bercahaya siang.",
  },
  {
    q: "Apakah lumen di lembar data sama dengan lumen di marketplace?",
    a: "Sering tidak. Lumen yang berarti adalah hasil ukur menurut metode yang disebutkan (ANSI, atau ISO 21118 yang dipakai sebagian besar produsen sekarang). Angka “LED lumens” atau “lumen setara” tidak punya metode ukur yang bisa diperiksa dan biasanya beberapa kali lebih besar dari keluaran sebenarnya. Jika lembar data tidak menyebut metode ukurnya, anggap angkanya belum terverifikasi.",
  },
  {
    q: "Kenapa proyektor saya terlihat pucat padahal lumennya besar?",
    a: "Karena yang Anda lihat adalah kontras, bukan kecerahan. Cahaya ruangan yang jatuh ke layar menaikkan tingkat hitam, sehingga selisih antara bagian gelap dan terang mengecil. Menambah lumen menaikkan keduanya sekaligus dan hanya sedikit menolong. Yang menolong adalah mengendalikan cahaya yang jatuh ke layar: tirai, sudut lampu, dan posisi layar terhadap jendela.",
  },
  {
    q: "Bisakah layar gain tinggi menggantikan proyektor yang lebih terang?",
    a: "Hanya untuk penonton yang duduk di tengah. Gain bekerja dengan memantulkan cahaya lebih terarah, jadi yang didapat di tengah diambil dari sisi. Pada layar lebar, hasilnya hotspot di tengah dan sisi yang redup. Untuk ruang rapat sempit hal ini bisa diterima; untuk aula dan rumah ibadah biasanya tidak.",
  },
  {
    q: "Bagaimana dengan tinggi pemasangan, offset, dan lens shift?",
    a: "Alat ini sengaja tidak menghitungnya. Offset vertikal dan rentang lens shift berbeda untuk setiap model, dan menebaknya menghasilkan bracket yang salah dipesan. Ambil angkanya dari lembar data proyektor, atau kirimkan tipe unitnya kepada kami.",
  },
  {
    q: "Kapan proyektor sebaiknya diganti LED direct-view?",
    a: "Ketika kebutuhan lumen melewati sekitar 8.000 untuk memenuhi target kecerahan. Di atas titik itu proyektor menjadi mahal, berisik, menuntut perawatan lampu, dan tetap kehilangan kontras begitu lampu ruangan menyala. LED direct-view menghasilkan cahayanya sendiri sehingga cahaya ruangan berhenti menjadi masalah.",
  },
];

/* ------------------------------------------------------------------ */
/* Standards, with the date each was last checked (03-UI §12.6 item 9) */
/* ------------------------------------------------------------------ */

export const STANDARDS: readonly {
  name: string;
  title: string;
  usedFor: string;
  checkedAt: string;
}[] = [
  {
    name: "ANSI/AVIXA V201.01:2021",
    title: "Image System Contrast Ratio",
    usedFor:
      "Acuan kontras sistem. Kami menyebutkan standarnya dan tidak menerbitkan nilai per kategori karena standarnya berbayar.",
    checkedAt: "2026-08",
  },
  {
    name: "ANSI/AVIXA V202.01:2016",
    title: "Display Image Size for 2D Content in Audiovisual Systems (DISCAS)",
    usedFor:
      "Acuan ukuran gambar. Dipakai oleh Kalkulator Ukuran Layar, dan menjadi dasar ketika hasil dari alat itu dilanjutkan ke sini.",
    checkedAt: "2026-08",
  },
  {
    name: "ISO 21118:2020",
    title: "Information to be included in specification sheets — Data projectors",
    usedFor:
      "Acuan cara produsen menyatakan keluaran cahaya. Alat ini menganggap angka lumen yang Anda masukkan diukur dengan metode ini.",
    checkedAt: "2026-08",
  },
];

/* ------------------------------------------------------------------ */
/* CTA (03-UI §13.2, kirim_hasil — verbatim structure)                 */
/* ------------------------------------------------------------------ */

export const CTA = {
  refCode: "kirim_hasil",
  waContext: "learn-alat-throw-distance-proyektor",
  headline: "Hasil lengkap di atas. Gratis, tanpa daftar.",
  limitsTitle: "Yang kalkulator ini TIDAK bisa lihat:",
  limits: [
    "offset lensa dan tinggi pemasangan proyektor Anda",
    "balok struktur, ducting, dan grid plafon di jalur proyeksi",
    "cahaya yang benar-benar jatuh ke layar pada jam pemakaian",
    "material layar yang akhirnya terpasang, bukan yang di gambar",
  ],
  button: "Kirim hasil ini + denah ke engineer ACTA →",
  reassurance: "Kami balas dengan koreksi, bukan penawaran.",
  followUp: "Dibalas manusia pada hari kerja.",
  secondary: {
    print: "Cetak / Simpan PDF",
    copyLink: "Salin tautan hasil",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Cross-tool handoff                                                  */
/* ------------------------------------------------------------------ */

export const HANDOFF = {
  from: {
    tool: "Kalkulator Ukuran Layar",
    path: "/learn/alat/ukuran-layar",
    notice: (v: { width: string; diagonalInch: string }) =>
      `Lebar layar ${v.width} m (${v.diagonalInch}") dibawa dari Kalkulator Ukuran Layar. Ubah angkanya jika layar yang akan dipasang berbeda.`,
  },
} as const;

/** Aggregate, for a route that prefers one import. */
export const COPY = {
  TOOL,
  FIELDS,
  RESULT,
  FINDINGS,
  MATH,
  ASSUMPTIONS,
  LIMITS_COPY,
  REFUSALS,
  EXAMPLES,
  REFERENCE,
  FAQ,
  STANDARDS,
  CTA,
  HANDOFF,
  AMBIENT_LABELS,
} as const;
