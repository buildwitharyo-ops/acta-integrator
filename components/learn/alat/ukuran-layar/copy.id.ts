/**
 * ukuran-layar — every user-facing string, in Bahasa Indonesia.
 *
 * PURE data module: no React, no I/O, no imports at all, so `calc.ts` can pull
 * its sentence templates from here without becoming impure and without creating
 * an import cycle (03-UI §12.1: `copy.id.ts` holds ALL strings, assumptions,
 * limits and standard names).
 *
 * Template functions receive strings that are ALREADY formatted through
 * `lib/learn/format` — this file never rounds and never formats a number.
 */

/** Bare tool path. Also the form action and the reset href. */
export const TOOL_PATH = "/learn/alat/ukuran-layar";

/** Handoff target when no commercial panel is large enough (03-UI §12.2). */
export const PROJECTOR_TOOL_PATH = "/learn/alat/throw-distance-proyektor";

/** Printed as "Diverifikasi: {…} · ACTA" under the math panel. */
export const VERIFIED_AT = "2026-08";

export const UKURAN_LAYAR_COPY = {
  slug: "ukuran-layar",
  path: TOOL_PATH,

  /** Bahasa label, 03-UI §12.2. */
  toolName: "Kalkulator Ukuran Layar — standar AVIXA DISCAS",
  shortName: "Kalkulator Ukuran Layar",
  eyebrow: "ALAT 01 · AVIXA DISCAS",

  h1: "Kalkulator Ukuran Layar",
  h2: "Hitung ukuran layar dan jarak pandang",

  intro:
    "Berapa inci layar yang benar-benar terbaca dari kursi paling belakang? " +
    "Isi tiga hal: jarak kursi terjauh, konten yang ditayangkan, dan panel yang " +
    "Anda rencanakan.",

  /** Chip in the show-the-math header. */
  standardChip: ["AVIXA V202.01"] as const,
  verifiedAt: VERIFIED_AT,

  submitLabel: "Hitung",
  resetLabel: "Atur ulang",
  fieldsLabel: "Parameter ruangan",
  resultLabel: "Hasil perhitungan",
  mathSummary: "Tampilkan perhitungan",

  fields: {
    solve: {
      label: "Yang ingin Anda tahu",
      options: [
        { value: "ukuran", label: "Ukuran layar" },
        { value: "jarak", label: "Jangkauan" },
      ],
    },
    /**
     * The primary control, and the whole jargon fix. Its `value` is the DISCAS
     * `%EH` verbatim — so this IS the `eh` field, not a second control that has
     * to be kept in sync with it — while the face reads as a plain question.
     * The badge keeps the H-multiple visible for anyone who works in those terms.
     */
    contentClass: {
      label: "Yang paling sering ditayangkan",
      options: [
        {
          value: "3",
          label: "Rapat & presentasi",
          description: "Slide, video call, papan tulis digital",
          badge: "6H",
        },
        {
          value: "2",
          label: "Angka & detail",
          description: "Spreadsheet, dashboard, denah, tabel harga",
          badge: "4H",
        },
        {
          value: "4",
          label: "Tayangan & video",
          description: "Signage, hiburan, konten yang ditonton saja",
          badge: "8H",
        },
        {
          value: "1",
          label: "Teks sangat padat",
          description: "Notulen dan dokumen yang dibaca bersama",
          badge: "2H",
        },
      ],
      hintInactive: "Diabaikan: model ADM memakai resolusi, bukan tinggi huruf.",
    },
    model: {
      label: "Model penglihatan",
      options: [
        { value: "bdm", label: "BDM — dari tinggi huruf terkecil" },
        { value: "adm", label: "ADM — dari resolusi (CAD, GIS, medis)" },
      ],
      hint: "ADM dipakai bila satu piksel harus terlihat. Mengabaikan pilihan konten di atas.",
    },
    farthestViewer: {
      label: "Jarak kursi terjauh",
      unit: "m",
      hint: "Ke MATA penonton di kursi terakhir, bukan ke dinding belakang.",
    },
    plannedDiagonal: {
      label: "Panel yang Anda rencanakan",
      unit: "inci",
    },
    elementHeight: {
      label: "Tinggi elemen terkecil (%EH)",
      options: [
        { value: "4", label: "4% — tayangan pasif (8H)" },
        { value: "3", label: "3% — judul & slide (6H)" },
        { value: "2", label: "2% — bullet & dashboard (4H)" },
        { value: "1", label: "1% — teks padat (2H)" },
      ],
      hint: "Ditetapkan oleh pilihan konten. Ubah di sini bila perlu nilai lain.",
      hintInactive: "Tidak dipakai pada model ADM.",
    },
    verticalResolution: {
      label: "Resolusi vertikal",
      options: [
        { value: "720", label: "720p" },
        { value: "1080", label: "1080p (Full HD)" },
        { value: "1440", label: "1440p (2K)" },
        { value: "2160", label: "2160p (4K UHD)" },
      ],
      hint: "Hanya dipakai pada model ADM.",
      hintInactive: "Tidak dipakai pada model BDM.",
    },
    displayAspect: { label: "Rasio layar" },
    contentAspect: {
      label: "Rasio konten",
      hint: "4:3 pada panel 16:9 tidak memakai seluruh layar.",
    },
    closestViewer: {
      label: "Jarak kursi terdepan",
      unit: "m",
      hint: "Kosongkan untuk memakai pedoman 1,5 × tinggi gambar.",
    },
    ceilingHeight: {
      label: "Tinggi plafon",
      unit: "m",
      hint: "Ke plafon jadi, bukan ke pelat beton.",
    },
    eyeHeight: {
      label: "Tinggi mata duduk",
      unit: "m",
    },
    advancedSummary: "Setelan lanjutan",
    quickDistanceLabel: "Jarak umum",
    quickPanelLabel: "Ukuran panel umum",
  },

  /**
   * The three bands. `nyaman` is where AVIXA puts the line; `terbaca` is the
   * third of tolerance ACTA adds on top of it; `jauh` is past both.
   */
  zones: {
    nyaman: {
      label: "Nyaman",
      short: "Nyaman dibaca",
    },
    terbaca: {
      label: "Masih terbaca",
      short: "Masih terbaca",
    },
    jauh: {
      label: "Terlalu jauh",
      short: "Terlalu jauh",
    },
  },

  /** Printed once, near the gauge — the honest label on the tolerance. */
  toleranceNote:
    "Garis “nyaman” adalah angka AVIXA DISCAS. Batas “masih terbaca” ditarik " +
    "sepertiga lebih jauh — penilaian lapangan ACTA, bukan bagian dari standar.",

  aspectLabels: {
    "16x9": "16:9",
    "16x10": "16:10",
    "4x3": "4:3",
  },

  models: {
    adm: {
      label: "ADM — Analytical Decision Making",
      short: "ADM",
      reason:
        "Konten analitis: penonton harus membedakan detail sebesar satu piksel, " +
        "jadi ukuran ditentukan oleh resolusi vertikal, bukan oleh tinggi huruf.",
    },
    bdm: {
      label: "BDM — Basic Decision Making",
      short: "BDM",
      reason:
        "Konten presentasi: ukuran ditentukan oleh tinggi elemen terkecil (%EH), " +
        "bukan oleh resolusi. Pada %EH 3% aturan ini dikenal sebagai aturan 6H.",
    },
  },

  fit: {
    penuh: {
      label: "Penuh",
      note: "Rasio konten sama dengan rasio layar — seluruh panel terpakai.",
    },
    pillarbox: {
      label: "Pillarbox",
      note: "Konten lebih sempit dari layar: tinggi gambar tetap, sisi kiri dan kanan kosong.",
    },
    letterbox: {
      label: "Letterbox",
      note: "Konten lebih lebar dari layar: tinggi gambar turun, atas dan bawah kosong.",
    },
  },

  availability: {
    umum: {
      label: "Umum di Indonesia",
      note: "Ukuran stok reguler di distributor Indonesia.",
    },
    terbatas: {
      label: "Terbatas",
      note: "Hanya beberapa merek dan umumnya indent. Konfirmasi ketersediaan sebelum masuk RAB.",
    },
    pesanan: {
      label: "Pesanan khusus",
      note: "Barang proyek, bukan barang stok. Konfirmasi ketersediaan, jalur pengiriman, dan akses lift sebelum dispesifikasikan.",
    },
    "tidak-ada": {
      label: "Di luar ukuran panel komersial",
      note: "Tidak ada panel jadi seukuran ini. Solusinya proyektor atau videowall LED.",
    },
  },

  results: {
    requiredDiagonal: "UKURAN LAYAR MINIMUM",
    maxDistance: "JARAK PENONTON TERJAUH",
    unitInch: "inci",
    unitMetre: "m",
    recommendedPanel: "UKURAN YANG DISARANKAN",
    imageHeight: "TINGGI GAMBAR",
    mountHeight: "TINGGI PEMASANGAN",
    closestViewer: "PENONTON TERDEPAN",
    ladderCaption: "Jangkauan per ukuran panel komersial",
    ladderColumns: {
      size: "Ukuran",
      height: "Tinggi gambar",
      width: "Lebar gambar",
      distance: "Nyaman s/d",
      tolerated: "Terbaca s/d",
      ceiling: "Plafon minimum",
      availability: "Ketersediaan",
    },
    diagonalCaption: (cm: string, heightM: string, widthM: string) =>
      `Setara ${cm} cm. Area gambar ${heightM} m × ${widthM} m.`,
    panelCaption: (
      heightM: string,
      widthM: string,
      comfortableM: string,
      toleratedM: string,
    ) =>
      `Area gambar ${heightM} m × ${widthM} m. Nyaman sampai ${comfortableM} m, ` +
      `masih terbaca sampai ${toleratedM} m.`,
    maxDistanceCaption: (panelIn: string, heightM: string, comfortableM: string) =>
      `Panel ${panelIn}" memberi tinggi gambar ${heightM} m. Nyaman sampai ${comfortableM} m.`,
    verdictPanel: (panelIn: string) => `Pakai panel ${panelIn}"`,
    verdictPanelWithFloor: (minimumIn: string) =>
      `Minimal ${minimumIn}" bila anggaran terbatas`,
    verdictMinimumOnly: (minimumIn: string) =>
      `${minimumIn}" — terbaca, belum nyaman`,
    verdictNoPanel: "Di luar ukuran panel komersial",
    verdictWithin: "Kursi terjauh Anda masih terjangkau",
    verdictShort: "Kursi terjauh Anda di luar jangkauan",
    /** Headline chip in "jangkauan" mode, one per band. */
    zoneVerdict: {
      nyaman: (ratio: string) => `Nyaman dibaca — ${ratio}× tinggi gambar`,
      terbaca: (ratio: string) => `Masih terbaca — ${ratio}× tinggi gambar`,
      jauh: (ratio: string) => `Terlalu jauh — ${ratio}× tinggi gambar`,
    },
    gaugeLabel: "POSISI KURSI TERJAUH",
    gaugeCaption: (comfortableM: string, toleratedM: string) =>
      `Nyaman sampai ${comfortableM} m, masih terbaca sampai ${toleratedM} m.`,
    gaugeDescription: (
      farthestM: string,
      ratio: string,
      zone: string,
      comfortableM: string,
      toleratedM: string,
    ) =>
      `Kursi terjauh ${farthestM} m, setara ${ratio} kali tinggi gambar — ${zone}. ` +
      `Batas nyaman ${comfortableM} m, batas masih terbaca ${toleratedM} m.`,
    minimumPanel: "MINIMAL",
    comfortablePanel: "NYAMAN",
  },

  /** The money sentence (03-UI §12.2). Generated, never hard-coded. */
  money: {
    shortfallWithPanel: (
      plannedIn: string,
      toleratedM: string,
      farthestM: string,
      minimumIn: string,
    ) =>
      `Panel ${plannedIn}" masih terbaca sampai ${toleratedM} m, sedangkan kursi terjauh ` +
      `Anda ${farthestM} m. Naikkan ke ${minimumIn}".`,
    shortfallNoPanel: (
      plannedIn: string,
      toleratedM: string,
      farthestM: string,
      minimumIn: string,
    ) =>
      `Panel ${plannedIn}" masih terbaca sampai ${toleratedM} m, sedangkan kursi terjauh ` +
      `Anda ${farthestM} m. Ukuran minimum ${minimumIn}" melewati panel terbesar yang ` +
      `dijual — pakai proyektor atau videowall LED.`,
    /** The band that used to be reported as a failure. */
    tolerated: (
      plannedIn: string,
      farthestM: string,
      ratio: string,
      comfortableM: string,
      comfortableIn: string | null,
    ) =>
      `Panel ${plannedIn}" terbaca dari ${farthestM} m — ${ratio}× tinggi gambar, ` +
      `di atas batas nyaman ${comfortableM} m tetapi masih di dalam toleransi. ` +
      (comfortableIn
        ? `Untuk nyaman penuh, ${comfortableIn}".`
        : `Untuk nyaman penuh butuh layar di luar ukuran panel komersial.`),
    within: (plannedIn: string, comfortableM: string, farthestM: string) =>
      `Panel ${plannedIn}" nyaman dibaca sampai ${comfortableM} m, sedangkan kursi ` +
      `terjauh Anda ${farthestM} m. Ukuran ini sudah pas.`,
  },

  findings: {
    plafon: {
      title: "Plafon tidak cukup",
      detail: (
        ceilingM: string,
        requiredCeilingM: string,
        panelIn: string,
        panelHeightM: string,
      ) =>
        `Plafon ${ceilingM} m tidak cukup untuk layar ini. Ini kendala arsitektur, ` +
        `bukan kendala AV. Panel ${panelIn}" butuh ${requiredCeilingM} m dari lantai: ` +
        `1,2 m ke bawah gambar agar baris belakang tidak terhalang kepala baris depan, ` +
        `ditambah ${panelHeightM} m tinggi gambar.`,
    },
    diLuarPanel: {
      title: "Melebihi panel komersial terbesar",
      detail: (minimumIn: string, largestIn: string, toleratedM: string) =>
        `Bahkan dengan toleransi lapangan, ruangan ini menuntut ${minimumIn}". Panel ` +
        `terbesar yang dijual sebagai produk jadi (${largestIn}") hanya terbaca sampai ` +
        `${toleratedM} m. Pada titik ini proyektor atau videowall LED lebih murah dan ` +
        `lebih masuk akal.`,
      href: PROJECTOR_TOOL_PATH,
      hrefLabel: "Lanjutkan di Kalkulator Throw Distance & Kecerahan →",
    },
    panelKurang: {
      title: "Panel yang direncanakan terlalu kecil",
      detail: (
        plannedIn: string,
        toleratedM: string,
        farthestM: string,
        minimumIn: string | null,
      ) =>
        `Panel ${plannedIn}" masih terbaca sampai ${toleratedM} m — sudah termasuk ` +
        `toleransi lapangan. Kursi terjauh Anda ${farthestM} m, jadi baris belakang ` +
        `tidak akan mengikuti konten yang Anda tetapkan. ` +
        (minimumIn
          ? `Ukuran terkecil yang masih bekerja: ${minimumIn}".`
          : `Tidak ada panel komersial yang cukup — pakai proyektor atau videowall LED.`),
    },
    panelBatas: {
      title: "Terbaca, tetapi di ambang",
      detail: (
        plannedIn: string,
        ratio: string,
        comfortableM: string,
        comfortableIn: string | null,
      ) =>
        `Kursi terjauh berada pada ${ratio}× tinggi gambar. Panel ${plannedIn}" nyaman ` +
        `sampai ${comfortableM} m, jadi baris belakang masih membaca tetapi harus lebih ` +
        `berusaha — terasa pada rapat panjang dan pada konten yang lebih padat dari ` +
        `rencana. ` +
        (comfortableIn
          ? `Satu tingkat ke ${comfortableIn}" menghilangkan kompromi ini.`
          : `Untuk menghilangkan kompromi ini dibutuhkan proyektor.`),
    },
    panelCukup: {
      title: "Ukuran rencana Anda memenuhi",
      detail: (plannedIn: string, maxDistanceM: string, farthestM: string) =>
        `Panel ${plannedIn}" nyaman dibaca sampai ${maxDistanceM} m, sedangkan kursi ` +
        `terjauh Anda ${farthestM} m. Tidak perlu naik ukuran.`,
    },
    penontonTerdekat: {
      title: "Baris terdepan terlalu dekat",
      detail: (closestM: string, guidelineM: string) =>
        `Baris terdepan ${closestM} m, sedangkan pedoman DISCAS menyarankan minimal ` +
        `1,5 × tinggi gambar = ${guidelineM} m. Penonton depan harus menoleh untuk ` +
        `menyapu layar. Ini pedoman kenyamanan, bukan syarat — geser satu baris ke ` +
        `belakang bila memungkinkan.`,
    },
    rasioKontenPillarbox: {
      title: "Konten tidak memakai seluruh layar",
      detail: (
        contentLabel: string,
        displayLabel: string,
        panelIn: string,
        effectiveIn: string,
      ) =>
        `Konten ${contentLabel} pada panel ${displayLabel} tampil pillarbox: tinggi ` +
        `gambar tetap, tetapi sisi kiri dan kanan kosong. Panel ${panelIn}" berperilaku ` +
        `seperti layar ${effectiveIn}" untuk konten ini.`,
    },
    rasioKontenLetterbox: {
      title: "Tinggi gambar efektif turun",
      detail: (
        contentLabel: string,
        displayLabel: string,
        dropPercent: string,
      ) =>
        `Konten ${contentLabel} pada layar ${displayLabel} tampil letterbox: gambar ` +
        `menyusut ${dropPercent}% secara tinggi, dan tinggi gambar itulah yang ` +
        `menentukan keterbacaan. Ukuran layar sudah dinaikkan untuk menutup selisih ini.`,
    },
    ketersediaan: {
      title: "Ukuran ini tidak selalu ada di pasar Indonesia",
      detail: (panelIn: string, note: string) => `Panel ${panelIn}": ${note}`,
    },
  },

  refusals: {
    penontonTerbalik: {
      title: "Input saling bertentangan",
      detail: (closestM: string, farthestM: string) =>
        `Jarak penonton terdepan ${closestM} m lebih besar daripada jarak penonton ` +
        `terjauh ${farthestM} m. Salah satu dari dua angka itu keliru. Kami tidak ` +
        `menghitung dari input yang saling bertentangan — perbaiki angkanya, lalu ` +
        `hitung ulang.`,
    },
  },

  /** 03-UI §12.8 rule 1: the number is deliberately not printed. */
  contrastRefusal: {
    title: "Rasio kontras sistem tidak kami hitung",
    body:
      "Rasio kontras sistem mengikuti ANSI/AVIXA V201.01:2021 — nilai spesifik per " +
      "kategori tidak kami publikasikan karena standarnya berbayar. Hubungi kami " +
      "untuk hasil pengukuran ISCR di ruangan Anda.",
  },

  steps: {
    model: "Model penglihatan",
    imageHeightFromDistance: "Tinggi gambar",
    displayHeightFromImage: "Koreksi rasio konten",
    diagonalMetre: "Diagonal layar",
    diagonalInch: "Diagonal dalam inci",
    minimumDiagonal: "Diagonal minimum (dengan toleransi)",
    panelChoice: "Panel komersial terdekat",
    displayHeightFromDiagonal: "Tinggi panel",
    activeImageHeight: "Tinggi gambar aktif",
    maxDistance: "Batas nyaman",
    tolerated: "Batas masih terbaca",
    zone: "Posisi kursi terjauh",
    closestViewer: "Penonton terdepan",
    mounting: "Tinggi pemasangan",
  },

  stepNotes: {
    admBasis:
      "Satu piksel menyudut 1 arcmenit pada jarak terjauh — batas ketajaman mata sehat.",
    bdmBasis: (percentEh: string) =>
      `Elemen terkecil setinggi ${percentEh}% dari tinggi gambar, menyudut ≈ 17,2 arcmenit.`,
    sixH: "Pada %EH 3% persamaan ini menjadi aturan 6H yang dikenal luas.",
    noFitCorrection: "Rasio konten sama dengan rasio layar — tanpa koreksi.",
    tolerance:
      "Faktor 4/3 adalah toleransi lapangan ACTA, bukan bagian dari DISCAS. Standar " +
      "menyatakan jarak yang NYAMAN, bukan jarak saat konten berhenti terbaca.",
    bottomRule:
      "Bawah gambar 1,2 m dari lantai agar baris di belakang tidak terhalang kepala baris depan.",
  },

  /** ≥2 assumptions, and they say what the tool does NOT model (03-UI §12.5). */
  assumptions: [
    "Batas “nyaman” adalah angka AVIXA DISCAS. Batas “masih terbaca” ditarik sepertiga lebih jauh (× 4/3) — itu penilaian lapangan ACTA, bukan klausul standar, dan sengaja dipisah supaya keduanya tidak tertukar.",
    "Perhitungan ini geometri murni: jarak, tinggi gambar, dan ketajaman mata. Kualitas gambar — kontras, kecerahan, silau jendela — tidak dimodelkan.",
    "Jarak penonton terjauh diukur ke MATA penonton di kursi terakhir, bukan ke dinding belakang. Selisih 1 m di sini mengubah ukuran layar satu tingkat penuh.",
    "Tinggi gambar dihitung dari area aktif layar. Bezel, bracket, rangka videowall, dan tebal layar proyeksi tidak dihitung — tambahkan sendiri saat mengecek plafon.",
    "Semua kursi dianggap menghadap layar dan berada di dalam sudut pandang wajar. Kursi di sisi ekstrem, kolom, dan pilar tidak dimodelkan.",
    "Ketajaman mata dianggap normal (20/20). Penonton dengan ketajaman lebih rendah butuh layar lebih besar atau kursi lebih dekat.",
    "Ketersediaan ukuran panel adalah penilaian pasar ACTA per " +
      VERIFIED_AT +
      ", bukan bagian dari standar AVIXA.",
    "Rasio kontras sistem tidak dihitung dan tidak ditampilkan di alat ini.",
  ] as const,

  /** What the calculator cannot see (13 §13.2, tuned to display sizing). */
  limits: [
    "bentuk ruang yang tidak persegi, dan kursi yang jauh di luar sumbu layar",
    "silau jendela, pencahayaan ruangan, dan warna dinding di belakang layar",
    "balok struktur, ducting, dan grid plafon yang menghalangi titik pemasangan",
    "konten yang benar-benar ditayangkan — spreadsheet 8 pt tidak sama dengan judul 40 pt",
  ] as const,

  standards: [
    {
      name: "ANSI/AVIXA V202.01:2016",
      title: "Display Image Size for 2D Content in Audiovisual Systems (DISCAS)",
      scope: "Sumber metode ADM dan BDM yang dipakai alat ini.",
      checked: VERIFIED_AT,
    },
    {
      name: "ANSI/AVIXA V201.01:2021",
      title: "Image System Contrast Ratio (ISCR)",
      scope: "Dirujuk untuk kontras sistem. Tidak dihitung dan tidak ditampilkan di sini.",
      checked: VERIFIED_AT,
    },
  ] as const,

  standardsNote:
    "Kami menerbitkan geometrinya — identitas 3438 arcmenit per radian, persamaan " +
    "diagonal, dan konversi inci — bukan tabel di dalam standar. Dokumen AVIXA " +
    "berbayar dan tidak kami reproduksi.",

  constantsNote:
    "3438 = 60 × 180 / π, jumlah arcmenit dalam satu radian. Faktor ketajaman BDM " +
    "200 setara dengan elemen yang menyudut 3438 / 200 ≈ 17,2 arcmenit.",

  diagram: {
    title: "Potongan memanjang ruangan",
    desc: (
      depthM: string,
      ceilingM: string,
      panelIn: string,
      imageHeightM: string,
    ) =>
      `Potongan memanjang ruang sedalam ${depthM} m dengan plafon ${ceilingM} m. ` +
      `Layar ${panelIn}" dipasang di dinding depan, bawah gambar 1,2 m dari lantai, ` +
      `tinggi gambar ${imageHeightM} m. Garis pandang ditarik dari mata penonton ` +
      `terdepan dan terjauh ke tepi atas dan bawah gambar.`,
    caption:
      "Potongan memanjang. Garis putus-putus adalah tinggi mata duduk; garis pandang " +
      "ditarik ke tepi atas dan bawah gambar.",
    tableCaption: "Data diagram — potongan ruang",
    columns: {
      parameter: "Parameter",
      value: "Nilai",
      note: "Catatan",
    },
    rows: {
      depth: "Kedalaman ruang (ke mata kursi terakhir)",
      ceiling: "Tinggi plafon",
      requiredCeiling: "Plafon minimum yang dibutuhkan",
      panel: "Layar",
      imageHeight: "Tinggi gambar",
      imageWidth: "Lebar gambar",
      imageBottom: "Bawah gambar dari lantai",
      imageTop: "Atas gambar dari lantai",
      eyeHeight: "Tinggi mata duduk",
      closestViewer: "Penonton terdepan",
      farthestViewer: "Penonton terjauh",
      verticalAngle: "Sudut pandang vertikal ke atas gambar",
    },
    notes: {
      bottomRule: "Aturan 1,2 m untuk baris di belakang baris pertama.",
      ceilingOk: "Cukup.",
      ceilingShort: "Kurang — kendala arsitektur.",
      eyeHeight: "Bawaan 1,15 m — postur duduk orang dewasa Indonesia.",
      closestAuto: "Otomatis: 1,5 × tinggi gambar.",
      closestManual: "Diisi manual.",
      verticalAngle: "Dari mata penonton terjauh. Geometri, bukan batas standar.",
    },
  },

  panel: {
    liveTitle: "Ringkasan langsung",
    liveHint:
      "Angka di panel hasil dihitung dari URL sebelumnya. Tekan Hitung untuk hasil " +
      "lengkap: perhitungan, diagram, dan temuan.",
    liveRequired: "Ukuran layar minimum",
    liveMaxDistance: "Jarak penonton terjauh",
    liveRefused: "Input saling bertentangan — perbaiki sebelum menghitung.",
  },
} as const;

export type UkuranLayarCopy = typeof UKURAN_LAYAR_COPY;
