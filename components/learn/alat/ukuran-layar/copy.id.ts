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
    "Kalkulator ini memakai metode DISCAS dari AVIXA: ukuran layar dan jarak " +
    "pandang adalah satu persamaan yang sama, hanya diselesaikan untuk variabel " +
    "yang berbeda. Semua angka dihitung di server — halaman ini tetap berfungsi " +
    "penuh tanpa JavaScript.",

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
      label: "Saya ingin hitung",
      options: [
        { value: "ukuran", label: "Ukuran layar" },
        { value: "jarak", label: "Jarak maksimum" },
      ],
      hint: "Dua pertanyaan, satu persamaan. Pilih mana yang belum Anda ketahui.",
    },
    model: {
      label: "Jenis konten",
      options: [
        { value: "bdm", label: "Presentasi — slide, bullet, dashboard (BDM)" },
        { value: "adm", label: "Analitis — CAD, spreadsheet, GIS, medis (ADM)" },
      ],
      hint:
        "ADM dipakai bila penonton harus membaca detail terkecil di layar — " +
        "satu piksel harus terlihat. BDM untuk konten presentasi biasa.",
    },
    farthestViewer: {
      label: "Jarak penonton terjauh",
      unit: "m",
      hint: "Diukur ke MATA penonton di kursi terakhir — bukan ke dinding belakang.",
    },
    plannedDiagonal: {
      label: "Panel yang Anda rencanakan",
      unit: "inci",
      hint: "Dipakai untuk membandingkan rencana Anda dengan hasil hitungan.",
    },
    elementHeight: {
      label: "Tinggi elemen terkecil (%EH)",
      options: [
        { value: "3", label: "3% — judul besar" },
        { value: "2", label: "2% — bullet presentasi" },
        { value: "1", label: "1% — teks padat / tabel" },
      ],
      hint: "Tinggi huruf atau simbol terkecil, sebagai persen dari tinggi gambar.",
      hintInactive: "Tidak memengaruhi hasil pada model ADM.",
    },
    verticalResolution: {
      label: "Resolusi vertikal",
      options: [
        { value: "720", label: "720p" },
        { value: "1080", label: "1080p (Full HD)" },
        { value: "1440", label: "1440p (2K)" },
        { value: "2160", label: "2160p (4K UHD)" },
      ],
      hint: "Jumlah baris piksel layar. Satu piksel harus menyudut ≥ 1 arcmenit.",
      hintInactive: "Tidak memengaruhi hasil pada model BDM.",
    },
    displayAspect: {
      label: "Rasio layar",
      hint: "Bentuk panel atau layar proyeksi yang dipasang.",
    },
    contentAspect: {
      label: "Rasio konten",
      hint: "Bentuk gambar yang benar-benar ditampilkan. 4:3 pada panel 16:9 tidak memakai seluruh layar.",
    },
    closestViewer: {
      label: "Jarak penonton terdepan",
      unit: "m",
      hint: "Opsional. Kosongkan atau isi 0 untuk memakai pedoman 1,5 × tinggi gambar.",
    },
    ceilingHeight: {
      label: "Tinggi plafon",
      unit: "m",
      hint: "Dari lantai ke plafon jadi, bukan ke pelat beton.",
    },
    eyeHeight: {
      label: "Tinggi mata duduk",
      unit: "m",
      hint: "Bawaan 1,15 m — postur duduk orang dewasa Indonesia.",
    },
    advancedSummary: "Parameter lanjutan",
  },

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
    recommendedPanel: "PANEL KOMERSIAL TERDEKAT",
    imageHeight: "TINGGI GAMBAR",
    mountHeight: "TINGGI PEMASANGAN",
    closestViewer: "PENONTON TERDEPAN",
    ladderCaption: "Jarak maksimum per ukuran panel komersial",
    ladderColumns: {
      size: "Ukuran",
      height: "Tinggi gambar",
      width: "Lebar gambar",
      distance: "Jarak maksimum",
      ceiling: "Plafon minimum",
      availability: "Ketersediaan",
    },
    diagonalCaption: (cm: string, heightM: string, widthM: string) =>
      `Setara ${cm} cm. Area gambar ${heightM} m × ${widthM} m.`,
    maxDistanceCaption: (panelIn: string, heightM: string) =>
      `Panel ${panelIn}" memberi tinggi gambar ${heightM} m.`,
    verdictPanel: (panelIn: string) => `Pakai panel ${panelIn}"`,
    verdictNoPanel: "Di luar ukuran panel komersial",
    verdictWithin: "Kursi terjauh Anda masih terjangkau",
    verdictShort: "Kursi terjauh Anda di luar jangkauan",
  },

  /** The money sentence (03-UI §12.2). Generated, never hard-coded. */
  money: {
    shortfallWithPanel: (
      plannedIn: string,
      maxDistanceM: string,
      farthestM: string,
      neededIn: string,
    ) =>
      `Layar ${plannedIn}" yang Anda rencanakan hanya layak sampai jarak ${maxDistanceM} m. ` +
      `Kursi terjauh Anda ${farthestM} m. Anda butuh ${neededIn}" — atau proyektor.`,
    shortfallNoPanel: (
      plannedIn: string,
      maxDistanceM: string,
      farthestM: string,
      requiredIn: string,
    ) =>
      `Layar ${plannedIn}" yang Anda rencanakan hanya layak sampai jarak ${maxDistanceM} m. ` +
      `Kursi terjauh Anda ${farthestM} m. Anda butuh ${requiredIn}" — di luar ukuran panel ` +
      `komersial. Gunakan proyektor atau videowall LED.`,
    within: (plannedIn: string, maxDistanceM: string, farthestM: string) =>
      `Layar ${plannedIn}" yang Anda rencanakan terbaca sampai jarak ${maxDistanceM} m. ` +
      `Kursi terjauh Anda ${farthestM} m — masih di dalam batas.`,
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
      detail: (requiredIn: string, largestIn: string, maxDistanceM: string) =>
        `Ukuran yang dibutuhkan ${requiredIn}" melewati panel terbesar yang dijual ` +
        `sebagai produk jadi (${largestIn}"), yang hanya menjangkau ${maxDistanceM} m. ` +
        `Pada titik ini proyektor atau videowall LED lebih murah dan lebih masuk akal.`,
      href: PROJECTOR_TOOL_PATH,
      hrefLabel: "Lanjutkan di Kalkulator Throw Distance & Kecerahan →",
    },
    panelKurang: {
      title: "Panel yang direncanakan terlalu kecil",
      detail: (plannedIn: string, maxDistanceM: string, farthestM: string) =>
        `Panel ${plannedIn}" terbaca sampai ${maxDistanceM} m. Kursi terjauh Anda ` +
        `${farthestM} m, jadi baris belakang tidak akan bisa membaca konten yang ` +
        `Anda tetapkan.`,
    },
    panelCukup: {
      title: "Ukuran rencana Anda memenuhi",
      detail: (plannedIn: string, maxDistanceM: string, farthestM: string) =>
        `Panel ${plannedIn}" terbaca sampai ${maxDistanceM} m, sedangkan kursi ` +
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
    panelChoice: "Panel komersial terdekat",
    displayHeightFromDiagonal: "Tinggi panel",
    activeImageHeight: "Tinggi gambar aktif",
    maxDistance: "Jarak penonton terjauh",
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
    bottomRule:
      "Bawah gambar 1,2 m dari lantai agar baris di belakang tidak terhalang kepala baris depan.",
  },

  /** ≥2 assumptions, and they say what the tool does NOT model (03-UI §12.5). */
  assumptions: [
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
