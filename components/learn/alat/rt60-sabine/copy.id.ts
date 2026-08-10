/**
 * Kalkulator Waktu Dengung (RT60) & Kejelasan Suara — seluruh teks Bahasa Indonesia.
 *
 * Modul daun: TIDAK mengimpor apa pun. `calc.ts` mengimpor berkas ini (label
 * material, judul langkah, teks temuan), sehingga tidak pernah ada siklus impor
 * dan `calc.ts` tetap murni.
 *
 * Aturan isi berkas ini (03-UI §12.1): setiap kalimat yang dibaca pengguna ada di
 * sini — termasuk daftar asumsi, nama standar beserta versinya, dan batas alat.
 * Nilai numerik (koefisien α, konstanta, ambang) ada di `calc.ts`, karena angka
 * adalah fisika, bukan salinan teks.
 *
 * Kalimat yang ditandai VERBATIM disalin persis dari spesifikasi
 * `docs/learn-platform/03-UI-WIDGETS-AND-ARCHITECTURE.md §12.3` / `§12.5`
 * dan tidak boleh diperhalus.
 */

/* ------------------------------------------------------------------ *
 * Sumbu material — id dipakai sebagai nilai parameter URL
 * ------------------------------------------------------------------ */

export const FLOOR_IDS = [
  "keramik",
  "vinyl",
  "kayu",
  "karpet-tipis",
  "karpet-tebal",
] as const;
export type FloorId = (typeof FLOOR_IDS)[number];

export const WALL_IDS = [
  "bata",
  "beton",
  "gypsum",
  "kayu-lapis",
  "gorden",
  "panel-akustik",
] as const;
export type WallId = (typeof WALL_IDS)[number];

export const CEILING_IDS = [
  "gypsum",
  "beton",
  "kalsiboard",
  "akustik",
  "metal-perforasi",
] as const;
export type CeilingId = (typeof CEILING_IDS)[number];

export const ROOM_TYPE_IDS = [
  "rapat",
  "kelas",
  "kantor",
  "auditorium",
  "masjid",
  "gereja",
  "musik",
  "studio",
] as const;
export type RoomTypeId = (typeof ROOM_TYPE_IDS)[number];

export const FLOOR_LABEL: Record<FloorId, string> = {
  keramik: "Keramik / granit di atas pelat beton",
  vinyl: "Vinyl / epoksi di atas pelat beton",
  kayu: "Parket kayu di atas rangka (ada rongga)",
  "karpet-tipis": "Karpet tipis tanpa underlay di atas beton",
  "karpet-tebal": "Karpet tebal dengan underlay",
};

export const WALL_LABEL: Record<WallId, string> = {
  bata: "Bata + plester + cat",
  beton: "Beton ekspos",
  gypsum: "Partisi gypsum pada rangka hollow",
  "kayu-lapis": "Panel kayu / plywood 6 mm dengan rongga",
  gorden: "Gorden tebal berlipat menutup dinding",
  "panel-akustik": "Panel akustik 50 mm (NRC 0,85)",
};

export const CEILING_LABEL: Record<CeilingId, string> = {
  gypsum: "Plafon gypsum 9 mm pada rangka + plenum",
  beton: "Pelat beton ekspos",
  kalsiboard: "Plafon kalsiboard / GRC pada rangka",
  akustik: "Plafon akustik mineral fiber 15 mm (grid T)",
  "metal-perforasi": "Plafon metal perforasi + wol mineral",
};

export const ROOM_TYPE_LABEL: Record<RoomTypeId, string> = {
  rapat: "Ruang rapat / meeting",
  kelas: "Ruang kelas",
  kantor: "Kantor terbuka (open plan)",
  auditorium: "Auditorium / aula serbaguna (pidato)",
  masjid: "Masjid / musala",
  gereja: "Gereja dengan musik",
  musik: "Ruang musik / latihan ansambel",
  studio: "Studio rekaman / ruang kontrol",
};

/**
 * Sumber nilai α. Wajib dibaca sebagai apa adanya: ini nilai PUBLIKASI, bukan
 * hasil pengukuran ACTA di lokasi (03-UI §12.8 Aturan 2 — terbitkan
 * matematikanya, sebut standarnya, jangan reproduksi tabel standar).
 */
export const FLOOR_SOURCE: Record<FloorId, string> = {
  keramik: "Nilai publikasi buku teks akustik arsitektur — ubin keras di atas beton.",
  vinyl: "Nilai publikasi buku teks akustik arsitektur — pelapis lantai tipis di atas beton.",
  kayu: "Nilai publikasi buku teks akustik arsitektur — lantai kayu di atas rangka berongga.",
  "karpet-tipis": "Nilai publikasi buku teks akustik arsitektur — karpet tanpa underlay di atas beton.",
  "karpet-tebal": "Nilai publikasi buku teks akustik arsitektur — karpet berat dengan underlay busa.",
};

export const WALL_SOURCE: Record<WallId, string> = {
  bata: "Nilai publikasi buku teks akustik arsitektur — plester halus di atas pasangan bata.",
  beton: "Nilai publikasi buku teks akustik arsitektur — beton tanpa finishing.",
  gypsum: "Nilai publikasi buku teks akustik arsitektur — papan gypsum pada rangka dengan rongga udara.",
  "kayu-lapis": "Nilai publikasi buku teks akustik arsitektur — panel tipis berongga (penyerap membran).",
  gorden: "Nilai publikasi buku teks akustik arsitektur — kain berat dengan lipatan 50 %.",
  "panel-akustik": "Data publikasi produsen panel wol mineral 50 mm kepadatan 48 kg/m³, pemasangan menempel dinding.",
};

export const CEILING_SOURCE: Record<CeilingId, string> = {
  gypsum: "Nilai publikasi buku teks akustik arsitektur — papan gypsum pada rangka dengan plenum.",
  beton: "Nilai publikasi buku teks akustik arsitektur — beton tanpa finishing.",
  kalsiboard: "Nilai publikasi produsen papan semen berserat pada rangka.",
  akustik: "Data publikasi produsen ubin mineral fiber 15 mm pada grid T dengan plenum 200 mm.",
  "metal-perforasi": "Data publikasi produsen panel metal perforasi 15 % dengan lapisan wol mineral.",
};

export const GLASS_LABEL = "Kaca jendela biasa 5–6 mm";
export const GLASS_SOURCE =
  "Nilai publikasi buku teks akustik arsitektur — kaca jendela biasa 5–6 mm.";

export const PERSON_LABEL = "Orang dewasa duduk (termasuk kursi yang diduduki)";
export const PERSON_SOURCE =
  "Nilai publikasi buku teks akustik arsitektur — serapan per orang dewasa duduk, sudah termasuk kursi kayu/plastik yang didudukinya.";

export const AIR_LABEL = "Udara dalam ruang (suku 4·m·V, hanya di 4 kHz)";
export const AIR_SOURCE =
  "ISO 9613-1:1993 — redaman udara pada 20 °C dan kelembapan relatif 60 %.";

/* ------------------------------------------------------------------ *
 * Pita oktaf
 * ------------------------------------------------------------------ */

export const BAND_LABEL: Record<number, string> = {
  125: "125 Hz",
  250: "250 Hz",
  500: "500 Hz",
  1000: "1 kHz",
  2000: "2 kHz",
  4000: "4 kHz",
};

/* ------------------------------------------------------------------ *
 * Judul langkah perhitungan (ShowTheMath)
 * ------------------------------------------------------------------ */

export const STEP_LABEL = {
  volume: "Volume ruang",
  surface: "Luas permukaan total",
  absorption500: "Absorpsi 500 Hz",
  absorption1k: "Absorpsi 1 kHz",
  model: "Pemilihan model",
  rt500: "Waktu dengung 500 Hz",
  rt1k: "Waktu dengung 1 kHz",
  tMid: "Waktu dengung rata-rata (T_mid)",
  targetAbsorption: "Absorpsi yang dibutuhkan untuk target",
  deltaAbsorption: "Kekurangan absorpsi",
  panelArea: "Luas panel akustik",
  roomConstant: "Konstanta ruang",
  criticalDistance: "Jarak kritis",
  schroeder: "Frekuensi Schroeder",
} as const;

export const STEP_NOTE = {
  sabine: "ᾱ ≤ 0,20 — persamaan Sabine berlaku.",
  eyring: "ᾱ > 0,20 — Sabine melebih-lebihkan, dipakai persamaan Eyring.",
  targetSabine: "ᾱ target ≤ 0,20 — kebutuhan absorpsi dihitung dengan Sabine.",
  targetEyring: "ᾱ target > 0,20 — kebutuhan absorpsi dihitung dengan Eyring.",
  panelNet:
    "Panel menutup permukaan lama, jadi yang dihitung adalah selisih α panel dengan α permukaan yang tertutup.",
  targetMet: "Ruangan sudah di dalam target — tidak ada kekurangan absorpsi.",
  directivity:
    "Q = 2 untuk suara manusia yang berbicara ke arah pendengar.",
  schroeder:
    "Di bawah frekuensi ini ruangan berperilaku modal, bukan statistik.",
} as const;

/* ------------------------------------------------------------------ *
 * Temuan
 * ------------------------------------------------------------------ */

export const FINDING_COPY = {
  diAtasTarget: {
    title: "RT60 di atas target",
    detail: (a: { tMid: string; target: string; room: string; factor: string }) =>
      `T_mid ${a.tMid} detik, sedangkan target untuk ${a.room} adalah ${a.target} detik — ${a.factor}× lebih panjang. Setiap suku kata bertumpuk dengan pantulan suku kata sebelumnya, dan menaikkan volume tata suara justru memperburuknya.`,
  },
  sudahMemenuhi: {
    title: "RT60 sudah memenuhi target",
    detail: (a: { tMid: string; range: string; room: string }) =>
      `T_mid ${a.tMid} detik, di dalam rentang ${a.range} detik untuk ${a.room}. Menambah panel akustik lagi berisiko membuat ruangan terdengar mati dan melelahkan untuk dipakai berbicara lama.`,
  },
  ekorBass: {
    // VERBATIM §12.3
    title:
      "Ruangan ini punya ekor bass — karpet dan gorden tidak akan memperbaikinya.",
    detail: (a: { rt125: string; ratio: string; tMid: string }) =>
      `RT60 pada 125 Hz ${a.rt125} detik, ${a.ratio}× T_mid (${a.tMid} detik). Bahan berpori tipis seperti karpet dan gorden hampir tidak bekerja di bawah 250 Hz. Yang bekerja adalah penyerap membran, panel berongga dalam, atau rongga plenum — bukan menambah kain.`,
  },
  modelEyring: {
    title: "Model Eyring dipakai, bukan Sabine",
    detail: (a: { alpha: string; sabine: string; eyring: string; gap: string }) =>
      `ᾱ = ${a.alpha} melebihi 0,20. Persamaan Sabine akan memberi ${a.sabine} detik, sedangkan Eyring memberi ${a.eyring} detik — selisih ${a.gap}%. Hampir semua kalkulator RT60 berbahasa Indonesia memakai Sabine tanpa syarat, dan pada ruang yang sudah diberi perlakuan akustik hasilnya meleset sebesar itu.`,
  },
  serapanUdara: {
    title: "Serapan udara disertakan pada pita 4 kHz",
    detail: (a: { volume: string; absorption: string }) =>
      `Volume ${a.volume} m³ melewati ambang 1000 m³, jadi suku 4·m·V (${a.absorption} m² sabin) dihitung pada 4 kHz. Di bawah 1000 m³ suku ini diabaikan karena kontribusinya lebih kecil daripada ketidakpastian koefisien α itu sendiri.`,
  },
  diBawahSchroeder: {
    title: "Pita rendah berada di bawah frekuensi Schroeder",
    detail: (a: { frequency: string; bands: string }) =>
      `Frekuensi Schroeder ruangan ini ${a.frequency} Hz. Di bawah frekuensi itu ruangan berperilaku modal — beberapa nada tertentu bertahan jauh lebih lama daripada yang diramalkan model statistik mana pun. Angka pada pita ${a.bands} berlaku sebagai indikasi arah, bukan prediksi.`,
  },
  medanTidakDifus: {
    title: "Bentuk ruang menyimpang dari asumsi medan difus",
    detail: (a: { ratio: string }) =>
      `Perbandingan sisi terpanjang terhadap sisi terpendek ${a.ratio} (atau tinggi plafon melebihi sisi terpendek). Sabine dan Eyring sama-sama mengasumsikan energi suara tersebar merata. Pada koridor, aula memanjang, atau ruang berplafon sangat tinggi, RT60 nyata bisa jauh berbeda dan pantulan tunggal (echo) menjadi masalah yang tidak terlihat sama sekali pada angka RT60.`,
  },
  serapanEkstrem: {
    title: "Serapan sangat tinggi — kedua model melemah",
    detail: (a: { alpha: string }) =>
      `ᾱ = ${a.alpha}, di atas 0,35. Pada tingkat serapan setinggi ini Eyring pun kehilangan akurasi karena serapan tidak lagi tersebar merata di seluruh permukaan. Angka di bawah menunjukkan arah, bukan nilai yang bisa dipakai untuk serah terima pekerjaan.`,
  },
  jendelaTerlaluLuas: {
    title: "Luas jendela melebihi luas dinding",
    detail: (a: { input: string; gross: string; used: string }) =>
      `Masukan ${a.input} m² melebihi luas dinding kotor ${a.gross} m². Nilai dipotong ke ${a.used} m² supaya perhitungan tetap masuk akal. Periksa kembali dimensi ruangan.`,
  },
  kepadatanTinggi: {
    title: "Kepadatan orang di luar rentang wajar",
    detail: (a: { people: string; area: string; density: string }) =>
      `${a.people} orang pada lantai ${a.area} m² berarti ${a.density} orang/m². Di atas 4 orang/m² serapan per orang tidak lagi bertambah linear karena orang saling membayangi, jadi angka serapan orang di sini terlalu tinggi dan RT60 terlalu pendek.`,
  },
  tanpaOrang: {
    title: "Dihitung tanpa orang di dalam ruangan",
    detail: (a: { room: string }) =>
      `Serapan orang biasanya penyumbang terbesar di ${a.room}. Angka ini adalah kondisi ruang kosong — kondisi terburuk, dan justru kondisi yang biasanya diukur saat serah terima pekerjaan.`,
  },
  panelTidakCukup: {
    title: "Target tidak tercapai dengan panel dinding dan plafon saja",
    detail: (a: { need: string; available: string; target: string; room: string }) =>
      `Dibutuhkan ${a.need} m² panel, sedangkan luas dinding dan plafon yang tersedia hanya ${a.available} m². Target ${a.target} detik untuk ${a.room} tidak bisa dicapai hanya dengan menempel panel — perlu perubahan pada lantai, kursi berlapis kain, atau bentuk ruang itu sendiri.`,
  },
} as const;

/* ------------------------------------------------------------------ *
 * Asumsi — termasuk apa yang alat ini TIDAK modelkan
 * ------------------------------------------------------------------ */

/** Empat baris pertama VERBATIM §12.5, sisanya adalah batas yang wajib disebut. */
export const BASE_ASSUMPTIONS: readonly string[] = [
  "Ruang berbentuk kotak tanpa balok atau ceruk.",
  "Medan suara difus (asumsi Sabine). Ruang sangat panjang atau sangat menyerap menyimpang.",
  "Koefisien α dari nilai publikasi produsen, bukan pengukuran di lokasi.",
  "Kursi kosong, meja, lemari, dan isi ruangan lain tidak dihitung. Kursi berlapis kain menambah serapan besar dan tidak dimodelkan di sini.",
  "Kebisingan latar (AC, lalu lintas, jamaah, proyektor) tidak dimodelkan — padahal itu penentu kejelasan suara yang sesungguhnya.",
  "Direktivitas, jumlah, dan penempatan loudspeaker tidak dimodelkan. Jarak kritis dihitung dengan Q = 2, yaitu suara manusia yang berbicara ke arah pendengar.",
  "Pantulan awal, gaung tunggal (echo) dan flutter tidak terlihat pada angka RT60, dan tidak dihitung di sini.",
];

export const ASSUMPTION_AIR_IGNORED = (volume: string) =>
  `Serapan udara diabaikan (V = ${volume} m³, di bawah ambang 1000 m³).`;

export const ASSUMPTION_AIR_INCLUDED = (volume: string, absorption: string) =>
  `Serapan udara 4·m·V disertakan hanya pada pita 4 kHz (V = ${volume} m³ > 1000 m³, tambahan ${absorption} m² sabin) — ISO 9613-1 pada 20 °C, RH 60 %.`;

/* ------------------------------------------------------------------ *
 * Standar
 * ------------------------------------------------------------------ */

/** Chip ringkas di header panel perhitungan. */
export const STANDARDS_CHIP: readonly string[] = ["ISO 3382-1", "IEC 60268-16"];

/** Daftar lengkap dengan tanggal periksa terakhir (03-UI §12.6 butir 9). */
export const STANDARDS: readonly {
  name: string;
  scope: string;
  checked: string;
}[] = [
  {
    name: "ISO 3382-1:2009",
    scope:
      "Pengukuran parameter akustik ruangan — ruang pertunjukan. Sumber definisi T30/T20 dan acuan rentang RT60 yang dipakai di tabel target.",
    checked: "2026-08",
  },
  {
    name: "ISO 3382-2:2008",
    scope:
      "Pengukuran waktu dengung pada ruangan biasa — ruang rapat, kelas, kantor.",
    checked: "2026-08",
  },
  {
    name: "DIN 18041:2016-03",
    scope:
      "Kualitas akustik ruangan menurut penggunaan. Acuan target RT60 per jenis ruang untuk ruang bicara.",
    checked: "2026-08",
  },
  {
    name: "IEC 60268-16:2020",
    scope:
      "Speech Transmission Index (STI). Sumber skala kejelasan suara yang dikutip di blok batas alat.",
    checked: "2026-08",
  },
  {
    name: "IEC 60849:1998 / EN 54-16:2008",
    scope:
      "Sistem tata suara darurat. Sumber syarat STI ≥ 0,50 untuk sistem evakuasi.",
    checked: "2026-08",
  },
  {
    name: "ISO 9613-1:1993",
    scope: "Redaman suara oleh udara. Sumber suku 4·m·V pada pita 4 kHz.",
    checked: "2026-08",
  },
];

export const VERIFIED_AT = "2026-08";

/* ------------------------------------------------------------------ *
 * Batas alat — blok penolakan STI (§12.3). Ini mekanisme lead-gen,
 * bukan disclaimer. Jangan pernah diperhalus menjadi "perkiraan STI".
 * ------------------------------------------------------------------ */

export const STI_REFUSAL = {
  eyebrow: "Batas alat ini",
  /** VERBATIM §12.3 */
  headline:
    "Kejelasan suara (STI) tidak bisa dihitung dari dimensi ruang saja.",
  /** VERBATIM §12.3 */
  why: "STI menurut IEC 60268-16 dipengaruhi kebisingan latar, direktivitas loudspeaker, dan pantulan yang tidak terlihat di denah.",
  /** Alasan teknis mengapa pendekatan %ALcons Peutz sengaja tidak dipakai. */
  whyNotPeutz:
    "Pendekatan %ALcons (Peutz) hanya berlaku untuk jarak pendengar di bawah 3,16 × jarak kritis, mengasumsikan satu sumber suara, dan sama sekali mengabaikan kebisingan latar serta direktivitas loudspeaker. Menerbitkan angka STI dari ketiga asumsi itu akan terlihat meyakinkan dan salah.",
  scaleLabel: "Skala IEC 60268-16",
  scale: [
    { range: "<0,30", label: "Buruk" },
    { range: "0,30–0,45", label: "Kurang" },
    { range: "0,45–0,60", label: "Cukup" },
    { range: "0,60–0,75", label: "Baik" },
    { range: ">0,75", label: "Sangat Baik" },
  ],
  /** VERBATIM §12.3 */
  requirement: "Sistem tata suara darurat (IEC 60849 / EN 54-16) wajib ≥ 0,50.",
  /** Kalimat jembatan ke CTA. Varian `gagal` VERBATIM §12.3. */
  bridge: {
    gagal:
      "Angka RT60 di atas menunjukkan ruangan ini kemungkinan besar tidak lolos 0,50 — tapi satu-satunya cara memastikannya adalah pengukuran STIPA di lokasi.",
    batas:
      "Angka RT60 di atas belum cukup untuk memastikan ruangan ini lolos 0,50 atau tidak — satu-satunya cara memastikannya adalah pengukuran STIPA di lokasi.",
    lolos:
      "Angka RT60 di atas tidak menutup kemungkinan ruangan ini lolos 0,50 — tapi satu-satunya cara memastikannya tetap pengukuran STIPA di lokasi.",
  },
  /** VERBATIM §12.3 — label tombol. Sumber tunggalnya `LEARN_CTA.jadwal_stipa`. */
  cta: "Jadwalkan pengukuran STIPA →",
} as const;

/* ------------------------------------------------------------------ *
 * Contoh terhitung (03-UI §12.6 butir 6) — tiga ruangan Indonesia yang
 * dihitung penuh oleh mesin yang sama, selalu ada di HTML server.
 * ------------------------------------------------------------------ */

export const EXAMPLE_IDS = [
  "rapat-kecil",
  "kelas-sma",
  "masjid-jamaah",
] as const;
export type ExampleId = (typeof EXAMPLE_IDS)[number];

export const EXAMPLE_COPY: Record<
  ExampleId,
  { title: string; description: string; verdict: string }
> = {
  "rapat-kecil": {
    title: "Ruang rapat kantor 6 × 4 × 2,8 m",
    description:
      "Keramik, dinding bata berplester, plafon gypsum, satu bidang kaca 6 m², enam orang. Konfigurasi paling umum di gedung perkantoran Jabodetabek.",
    verdict:
      "Ruangan sekecil ini pun gagal target rapat. Penyebabnya bukan ukurannya, melainkan tidak ada satu pun permukaan yang menyerap.",
  },
  "kelas-sma": {
    title: "Ruang kelas SMA 9 × 7 × 3,5 m",
    description:
      "Keramik, dinding bata berplester, plafon gypsum, jendela 10 m², 32 siswa. Standar bangunan sekolah negeri.",
    verdict:
      "Guru harus berteriak sepanjang hari, dan barisan belakang tetap kehilangan suku kata. Ini masalah akustik ruangan, bukan masalah pengeras suara.",
  },
  "masjid-jamaah": {
    title: "Masjid 20 × 12 × 6 m, 150 jamaah",
    description:
      "Keramik, dinding bata berplester, pelat beton ekspos, kaca 24 m², 150 jamaah. Volume 1440 m³, jadi serapan udara ikut dihitung pada 4 kHz.",
    verdict:
      "Volume besar dengan permukaan keras: dengung panjang dan berekor bass. Menambah pengeras suara justru menaikkan energi pantulan, bukan kejelasan.",
  },
};

/* ------------------------------------------------------------------ *
 * Label antarmuka
 * ------------------------------------------------------------------ */

export const RT60_COPY = {
  slug: "rt60-sabine",
  /** Label Bahasa resmi alat (§12.3). */
  name: "Kalkulator Waktu Dengung (RT60) & Kejelasan Suara",
  shortName: "Kalkulator RT60",
  eyebrow: "ALAT 02 · SABINE / EYRING",
  title: "Hitung waktu dengung ruangan Anda",
  intro:
    "Isi dimensi dan material ruangan. Alat ini menghitung RT60 pada enam pita oktaf, memilih sendiri antara persamaan Sabine dan Eyring, lalu menerjemahkan hasilnya menjadi luas panel akustik dalam m² — angka yang bisa langsung masuk RAB. Tidak perlu daftar, hasilnya bisa disalin.",
  fieldsLabel: "Dimensi & material",
  submitLabel: "Hitung",
  resetLabel: "Atur ulang",
  resultLabel: "Hasil perhitungan RT60",
  mathSummary: "Tampilkan perhitungan",

  field: {
    /** The three dimensions share one legend and one hint instead of three each. */
    dimensionsLabel: "Ukuran ruangan",
    dimensionsHint:
      "Permukaan ke permukaan. Tinggi diukur ke plafon yang terlihat, bukan ke pelat beton.",
    materialsLabel: "Material permukaan",
    length: { label: "Panjang", unit: "m", hint: "Sisi terpanjang, permukaan ke permukaan." },
    width: { label: "Lebar", unit: "m", hint: "Sisi terpendek pada denah." },
    height: {
      label: "Tinggi",
      unit: "m",
      hint: "Ke permukaan plafon yang terlihat, bukan ke pelat beton di atasnya.",
    },
    windowArea: {
      label: "Luas kaca",
      unit: "m²",
      hint: "Total bidang kaca pada dinding. Isi 0 kalau tidak ada.",
    },
    people: {
      label: "Jumlah orang",
      unit: "orang",
      hint: "Saat ruangan dipakai. Isi 0 untuk kondisi kosong — itu kondisi terburuk.",
    },
    floor: { label: "Lantai" },
    wall: { label: "Dinding" },
    ceiling: { label: "Plafon" },
    room: {
      label: "Jenis ruangan",
      hint: "Menentukan target RT60 yang dipakai sebagai pembanding.",
    },
  },

  result: {
    headlineLabel: "WAKTU DENGUNG · T_MID",
    headlineUnit: "detik",
    headlineCaption: (a: { target: string; room: string; range: string }) =>
      `Rata-rata RT60 pada 500 Hz dan 1 kHz. Target ${a.target} detik untuk ${a.room} (rentang wajar ${a.range} detik).`,

    /**
     * The band. `ROOM_TARGETS[].range` has always been in the engine — it just
     * never reached the screen, so a 0,62 detik room read as "meleset dari 0,6"
     * instead of "di dalam rentang". Two-sided on purpose: over-damped rooms are
     * a real and expensive failure, not merely "better than target".
     */
    gaugeLabel: "POSISI RUANGAN ANDA",
    gaugeZones: {
      mati: "Terlalu mati",
      target: "Rentang target",
      agak: "Agak bergema",
      gema: "Bergema",
    },
    gaugeCaption: (a: { room: string; range: string }) =>
      `Rentang wajar untuk ${a.room}: ${a.range} detik. Rentang, bukan satu angka — ` +
      `ISO 3382-1 dan DIN 18041 memang menetapkannya begitu.`,
    gaugeDescription: (a: { tMid: string; room: string; range: string }) =>
      `Waktu dengung ruangan ${a.tMid} detik, terhadap rentang target ${a.range} detik untuk ${a.room}.`,
    verdict: {
      good: (a: { range: string }) => `Di dalam rentang target ${a.range} detik`,
      warning: (a: { factor: string; target: string }) =>
        `${a.factor}× di atas target ${a.target} detik`,
      bad: (a: { factor: string; target: string }) =>
        `${a.factor}× di atas target ${a.target} detik`,
    },
    modelLabel: "MODEL YANG DIPAKAI",
    modelValue: { sabine: "Sabine", eyring: "Eyring" },
    modelCaption: {
      sabine:
        "ᾱ ≤ 0,20 pada pita tengah, jadi persamaan Sabine masih berlaku dan dipakai apa adanya.",
      eyring:
        "ᾱ > 0,20 pada pita tengah. Sabine akan melebih-lebihkan waktu dengung, jadi alat ini berpindah ke Eyring dan menyebutkannya di sini, bukan di catatan kaki.",
    },

    /** Baris uang: mengubah diagnosis menjadi lingkup pekerjaan dalam m². */
    treatmentLabel: "ABSORPSI TAMBAHAN YANG DIBUTUHKAN",
    treatmentValue: (a: { sabin: string; panel: string }) =>
      `${a.sabin} m² sabin ≈ ${a.panel} m² panel akustik 50 mm (NRC 0,85)`,
    treatmentCaption: (a: { coverage: string; available: string; band: string }) =>
      `Dihitung pada pita ${a.band}, pita yang paling kurang serapan. Setara ${a.coverage} dari ${a.available} m² dinding dan plafon yang tersedia. Panel menutup permukaan lama, jadi yang dihitung adalah selisih α-nya.`,
    treatmentMetLabel: "TIDAK PERLU TAMBAHAN ABSORPSI",
    treatmentMetValue: "0 m² sabin",
    treatmentMetCaption:
      "Ruangan sudah berada di dalam rentang target. Menambah serapan lagi akan membuat ruangan terdengar mati.",

    dcLabel: "JARAK KRITIS · Dc",
    dcUnit: "m",
    /** Menyerap fungsi microphone coverage planner yang dibatalkan (§12.0). */
    dcCaption: (a: { dc: string }) =>
      `Mikrofon lebih jauh dari ${a.dc} m dari pembicara akan menangkap lebih banyak pantulan daripada suara asli. Di luar jarak ini, menaikkan gain hanya menaikkan pantulan.`,
    roomConstantLabel: "KONSTANTA RUANG · R",

    bandsCaption: "RT60 per pita oktaf",
    bandsNote:
      "Satu angka RT60 menyembunyikan sepuluh kali lipat perbedaan serapan antar frekuensi. Kolom model menunjukkan persamaan yang dipakai pada tiap pita — pita yang lebih menyerap bisa berpindah ke Eyring sementara pita rendah tetap Sabine.",
    bandsColumns: [
      { key: "band", label: "Pita", mono: true, width: "6.5rem" },
      { key: "absorption", label: "A (m² sabin)", align: "right", mono: true },
      { key: "alpha", label: "ᾱ", align: "right", mono: true },
      { key: "model", label: "Model" },
      { key: "rt60", label: "RT60 (detik)", align: "right", mono: true },
    ],

    surfacesCaption: (a: { band: string }) => `Rincian absorpsi pada ${a.band}`,
    surfacesColumns: [
      { key: "surface", label: "Permukaan" },
      { key: "material", label: "Material" },
      { key: "area", label: "Luas (m²)", align: "right", mono: true },
      { key: "alpha", label: "α", align: "right", mono: true },
      { key: "absorption", label: "A (m² sabin)", align: "right", mono: true },
    ],

    geometryCaption: "Geometri ruangan",
    geometryColumns: [
      { key: "item", label: "Besaran" },
      { key: "value", label: "Nilai", align: "right", mono: true },
    ],
    geometryRows: {
      volume: "Volume (V)",
      floorArea: "Luas lantai",
      ceilingArea: "Luas plafon",
      wallGrossArea: "Luas dinding kotor",
      windowArea: "Luas kaca",
      wallNetArea: "Luas dinding bersih",
      totalSurface: "Luas permukaan total (S)",
      schroeder: "Frekuensi Schroeder",
    },

    findingsLabel: "Temuan",
  },

  /** Nama baris pada rincian absorpsi. */
  surface: {
    floor: "Lantai",
    wall: "Dinding",
    window: "Kaca / jendela",
    ceiling: "Plafon",
    people: "Orang duduk",
    air: "Serapan udara",
  },

  panel: {
    previewLabel: "Pratinjau",
    previewHint: "Tekan Hitung untuk hasil lengkap dan perhitungannya.",
    previewValue: (a: { tMid: string; target: string }) =>
      `T_mid ${a.tMid} detik · target ${a.target} detik`,
    noJs: "Perhitungan dijalankan di server. Kalkulator ini tetap berfungsi penuh tanpa JavaScript.",
  },

  reference: {
    alphaCaption: "Koefisien serapan α material bangunan Indonesia",
    alphaNote:
      "Seluruh nilai di tabel ini adalah nilai publikasi buku teks akustik arsitektur dan lembar data produsen, bukan hasil pengukuran ACTA di ruangan Anda. Material yang sama dengan pemasangan berbeda — rongga di belakang panel, tebal plester, kerapatan kain — bisa berbeda jauh. NRC dihitung sebagai rata-rata α pada 250, 500, 1000 dan 2000 Hz, dibulatkan ke kelipatan 0,05.",
    alphaColumns: [
      { key: "material", label: "Material", width: "20rem" },
      { key: "f125", label: "125 Hz", align: "right", mono: true },
      { key: "f250", label: "250 Hz", align: "right", mono: true },
      { key: "f500", label: "500 Hz", align: "right", mono: true },
      { key: "f1k", label: "1 kHz", align: "right", mono: true },
      { key: "f2k", label: "2 kHz", align: "right", mono: true },
      { key: "f4k", label: "4 kHz", align: "right", mono: true },
      { key: "nrc", label: "NRC", align: "right", mono: true },
    ],

    targetCaption: "Target RT60 menurut jenis ruangan",
    targetNote:
      "Nilai target adalah rentang desain untuk kondisi ruangan terisi, mengacu pada ISO 3382-1:2009 dan DIN 18041:2016 sebagai sumber sasaran desain. Tabel standar itu sendiri tidak direproduksi di sini; yang diterbitkan adalah matematikanya dan sasaran desain yang kami pakai. Ruangan yang lebih besar dari 250 m³ umumnya boleh berada di ujung atas rentang.",
    targetColumns: [
      { key: "room", label: "Jenis ruangan", width: "18rem" },
      { key: "target", label: "Target (detik)", align: "right", mono: true },
      { key: "range", label: "Rentang wajar (detik)", align: "right", mono: true },
    ],

    standardsCaption: "Standar yang dirujuk",
    standardsNote:
      "ACTA menerbitkan matematikanya dan menyebut standarnya, tetapi tidak pernah mereproduksi tabel di dalam standar berbayar. Kolom terakhir adalah tanggal terakhir kami memeriksa versi yang berlaku.",
    standardsColumns: [
      { key: "name", label: "Standar", width: "14rem" },
      { key: "scope", label: "Dipakai untuk" },
      { key: "checked", label: "Diperiksa", align: "right", mono: true },
    ],
  },

  exampleLabel: {
    input: "Masukan",
    tMid: "T_mid",
    target: "Target",
    model: "Model",
    treatment: "Absorpsi tambahan",
  },

  examplesTitle: "Tiga ruangan Indonesia, dihitung penuh",
  examplesIntro:
    "Tiga konfigurasi yang paling sering kami temui di lapangan, lengkap dengan angkanya. Semuanya dihitung dengan mesin yang sama seperti kalkulator di atas — bukan angka yang ditulis tangan.",

  faqTitle: "Pertanyaan yang sering muncul",
  faq: [
    {
      q: "Kenapa hasilnya beda dengan kalkulator RT60 lain?",
      a: "Dua sebab. Pertama, hampir semua kalkulator lain memakai persamaan Sabine tanpa syarat; alat ini berpindah ke Eyring begitu ᾱ melewati 0,20, dan pada ruang yang sudah diberi perlakuan akustik selisihnya 20–30 %. Kedua, alat ini menghitung enam pita oktaf, bukan satu angka. Satu angka RT60 menyembunyikan perbedaan serapan yang bisa mencapai sepuluh kali lipat antara 125 Hz dan 4 kHz.",
    },
    {
      q: "Kenapa kalkulator ini tidak mengeluarkan angka STI?",
      a: "Karena STI tidak bisa dihitung dari dimensi ruang saja. Menurut IEC 60268-16, STI ditentukan juga oleh kebisingan latar, direktivitas loudspeaker, dan pola pantulan yang tidak terlihat di denah. Pendekatan %ALcons yang sering dipakai hanya berlaku di bawah 3,16 × jarak kritis dan mengasumsikan satu sumber suara. Angka STI dari data yang kami punya akan terlihat meyakinkan dan salah, jadi kami tidak menerbitkannya.",
    },
    {
      q: "Apakah memasang karpet cukup untuk memperbaiki ruangan bergema?",
      a: "Sering kali tidak. Karpet bekerja di atas 500 Hz dan hampir tidak bekerja di bawah 250 Hz. Kalau temuan alat ini menyebut ekor bass, karpet dan gorden akan membuat ruangan terdengar lebih tumpul tanpa memperpendek dengung pada suara rendah. Yang bekerja di sana adalah penyerap membran atau panel dengan rongga dalam.",
    },
    {
      q: "Angka m² panel yang keluar itu dipasang di mana?",
      a: "Yang dihitung adalah luas total permukaan menyerap yang harus ditambahkan, bukan posisinya. Prioritas umumnya dinding yang saling berhadapan (untuk menghentikan flutter) dan bidang plafon di sekitar pembicara. Alat ini tidak menghitung distribusi panel, dan distribusi yang buruk bisa memberi RT60 yang benar dengan akustik yang tetap buruk.",
    },
    {
      q: "Apakah hasil kalkulator ini bisa dipakai untuk serah terima pekerjaan?",
      a: "Tidak. Ini prediksi dari nilai α publikasi dan geometri kotak ideal. Serah terima memakai pengukuran di lokasi menurut ISO 3382-2, dengan ruangan dan isinya seperti kondisi terpasang. Gunakan angka ini untuk menentukan lingkup dan anggaran, lalu buktikan dengan pengukuran.",
    },
    {
      q: "Kenapa jumlah orang berpengaruh sebesar itu?",
      a: "Karena manusia adalah penyerap berpori yang sangat efektif — sekitar 0,44 m² sabin per orang pada 500 Hz, kira-kira setara 15 m² dinding bata berplester. Di ruang rapat kecil, isi ruangan menentukan hasilnya. Karena itu kondisi kosong selalu menjadi kondisi terburuk dan biasanya itu yang diukur.",
    },
  ],
} as const;
